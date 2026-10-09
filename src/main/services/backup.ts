import { dialog } from 'electron'
import { writeFile, readFile } from 'node:fs/promises'
import { getDb } from '../db/database'
import { getSettings, replaceSettings } from '../db/repos/settings'
import { toCsv } from './csv'
import type {
  BackupImportResult,
  BackupPayload,
  BackupTable,
  ExportResult
} from '../../shared/types'

const TABLES: BackupTable[] = [
  'clients',
  'projects',
  'project_files',
  'invoices',
  'invoice_items',
  'payments'
]

const COLUMNS: Record<BackupTable, string[]> = {
  clients: [
    'id',
    'name',
    'company',
    'email',
    'phone',
    'address',
    'notes',
    'tags',
    'color',
    'currency',
    'archived',
    'created_at',
    'updated_at'
  ],
  projects: [
    'id',
    'client_id',
    'title',
    'description',
    'status',
    'priority',
    'deadline',
    'delivered_at',
    'quoted_amount',
    'currency',
    'created_at',
    'updated_at'
  ],
  project_files: ['id', 'project_id', 'path', 'label', 'kind', 'created_at'],
  invoices: [
    'id',
    'invoice_number',
    'client_id',
    'project_id',
    'issue_date',
    'due_date',
    'status',
    'currency',
    'subtotal',
    'tax_percent',
    'tax_amount',
    'discount',
    'total',
    'notes',
    'created_at',
    'updated_at'
  ],
  invoice_items: ['id', 'invoice_id', 'description', 'quantity', 'rate', 'amount', 'position'],
  payments: ['id', 'invoice_id', 'amount', 'paid_at', 'method', 'reference', 'notes']
}

const REQUIRED: Record<BackupTable, string[]> = {
  clients: ['id', 'name'],
  projects: ['id', 'client_id', 'title'],
  project_files: ['id', 'project_id', 'path'],
  invoices: ['id', 'invoice_number', 'client_id', 'issue_date'],
  invoice_items: ['id', 'invoice_id', 'description'],
  payments: ['id', 'invoice_id', 'amount', 'paid_at']
}

function dateStamp(): string {
  return new Date().toISOString().slice(0, 10)
}

export async function exportJson(): Promise<ExportResult> {
  const db = getDb()
  const payload: BackupPayload = {
    app: 'clientregit',
    version: 1,
    exported_at: new Date().toISOString(),
    settings: getSettings(),
    clients: [],
    projects: [],
    project_files: [],
    invoices: [],
    invoice_items: [],
    payments: []
  }
  for (const table of TABLES) {
    payload[table] = db.prepare(`SELECT * FROM ${table}`).all() as never
  }

  const result = await dialog.showSaveDialog({
    title: 'Export backup',
    defaultPath: `clientregit-backup-${dateStamp()}.json`,
    filters: [{ name: 'JSON', extensions: ['json'] }]
  })
  if (result.canceled || !result.filePath) return { path: null }
  await writeFile(result.filePath, JSON.stringify(payload, null, 2), 'utf8')
  return { path: result.filePath }
}

export async function importJson(mode: 'replace' | 'merge'): Promise<BackupImportResult | null> {
  const result = await dialog.showOpenDialog({
    title: mode === 'replace' ? 'Restore backup (replaces all data)' : 'Merge backup',
    filters: [{ name: 'JSON', extensions: ['json'] }],
    properties: ['openFile']
  })
  if (result.canceled || !result.filePaths[0]) return null

  const raw = await readFile(result.filePaths[0], 'utf8')
  let payload: BackupPayload
  try {
    payload = JSON.parse(raw) as BackupPayload
  } catch {
    throw new Error('The selected file is not valid JSON')
  }
  if (payload.app !== 'clientregit' || !Array.isArray(payload.clients)) {
    throw new Error('The selected file is not a ClientRegit backup')
  }

  const db = getDb()
  const counts = {
    clients: 0,
    projects: 0,
    project_files: 0,
    invoices: 0,
    invoice_items: 0,
    payments: 0,
    settings: 0
  } as BackupImportResult['counts']

  db.pragma('foreign_keys = OFF')
  try {
    const run = db.transaction(() => {
      if (mode === 'replace') {
        db.prepare('DELETE FROM payments').run()
        db.prepare('DELETE FROM invoice_items').run()
        db.prepare('DELETE FROM invoices').run()
        db.prepare('DELETE FROM project_files').run()
        db.prepare('DELETE FROM projects').run()
        db.prepare('DELETE FROM clients').run()
      }

      for (const table of TABLES) {
        const columns = COLUMNS[table]
        const required = REQUIRED[table]
        const placeholders = columns.map(() => '?').join(', ')
        const insert = db.prepare(
          `INSERT OR IGNORE INTO ${table} (${columns.join(', ')}) VALUES (${placeholders})`
        )
        const rows = (payload[table] ?? []) as Array<Record<string, unknown>>
        for (const row of rows) {
          if (!row || typeof row !== 'object') continue
          if (!required.every((key) => row[key] !== undefined && row[key] !== null)) continue
          const info = insert.run(...columns.map((col) => row[col] ?? null))
          counts[table] += info.changes
        }
      }

      if (payload.settings) {
        if (mode === 'replace') {
          replaceSettings(payload.settings)
          counts.settings = 1
        } else {
          const existing = db.prepare('SELECT key FROM settings').all() as Array<{ key: string }>
          const existingKeys = new Set(existing.map((row) => row.key))
          const insert = db.prepare(
            'INSERT OR IGNORE INTO settings (key, value) VALUES (?, ?)'
          )
          for (const [key, value] of Object.entries(payload.settings)) {
            if (value === undefined || existingKeys.has(key)) continue
            insert.run(key, String(value))
            counts.settings += 1
          }
        }
      }
    })
    run()
  } finally {
    db.pragma('foreign_keys = ON')
  }

  return { counts }
}

export async function exportCsv(table: BackupTable): Promise<ExportResult> {
  const db = getDb()
  const rows = db.prepare(`SELECT * FROM ${table}`).all() as Array<Record<string, unknown>>
  const csv = toCsv(rows)
  const result = await dialog.showSaveDialog({
    title: `Export ${table}`,
    defaultPath: `clientregit-${table}-${dateStamp()}.csv`,
    filters: [{ name: 'CSV', extensions: ['csv'] }]
  })
  if (result.canceled || !result.filePath) return { path: null }
  await writeFile(result.filePath, csv, 'utf8')
  return { path: result.filePath }
}
