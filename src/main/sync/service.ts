import { app, BrowserWindow } from 'electron'
import { getDb, now } from '../db/database'
import { clearTombstonesBefore, listTombstones } from '../db/tombstones'
import { authClient, isActivationConfigured } from '../license/service'
import { getLicenseRecord } from '../license/store'
import type { SupabaseClient } from '@supabase/supabase-js'
import type { TeamStatus } from '../../shared/types'

const PUSH_ENTITIES = ['clients', 'projects', 'invoices', 'tasks'] as const
const APPLY_ORDER = ['clients', 'projects', 'invoices', 'tasks'] as const
const OVERLAP_MS = 5 * 60 * 1000
const PUSH_CHUNK = 400
const PULL_PAGE = 1000

interface SyncRowInput {
  entity: string
  row_id: string
  data: Record<string, unknown>
  updated_at: string
  deleted: boolean
}

interface PulledRow {
  entity: (typeof APPLY_ORDER)[number]
  row_id: string
  data: Record<string, unknown>
  updated_at: string
  deleted: boolean
}

interface CachedTeam {
  teamId: string
  teamName: string | null
  role: 'leader' | 'member'
  memberCount: number
}

let syncing = false
let cachedTeam: CachedTeam | null = null
let lastSyncAt: string | null = null
let lastError: string | null = null
let syncTimer: NodeJS.Timeout | null = null
let started = false

function readSetting(key: string): string | null {
  const row = getDb().prepare('SELECT value FROM settings WHERE key = ?').get(key) as
    | { value: string }
    | undefined
  return row?.value ?? null
}

function writeSetting(key: string, value: string): void {
  getDb()
    .prepare(
      'INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value'
    )
    .run(key, value)
}

function clearSetting(key: string): void {
  getDb().prepare('DELETE FROM settings WHERE key = ?').run(key)
}

function isTeamLicensed(): boolean {
  const record = getLicenseRecord()
  return (
    record.activated && (record.seats ?? 1) > 1 && record.team_state !== 'offline' && record.team_state !== 'no_seat'
  )
}

function tableColumns(entity: string): Set<string> {
  const rows = getDb().prepare(`PRAGMA table_info(${entity})`).all() as Array<{ name: string }>
  return new Set(rows.map((r) => r.name))
}

function pick(row: Record<string, unknown>, columns: Set<string>): Record<string, unknown> {
  const out: Record<string, unknown> = {}
  for (const [key, value] of Object.entries(row)) {
    if (columns.has(key)) out[key] = value
  }
  return out
}

function localUpdatedAt(entity: string, id: string): string | null {
  const row = getDb()
    .prepare(`SELECT updated_at FROM ${entity} WHERE id = ?`)
    .get(id) as { updated_at?: string } | undefined
  return row?.updated_at ?? null
}

function isLocalNewer(entity: string, id: string, remoteIso: string): boolean {
  const local = localUpdatedAt(entity, id)
  if (!local) return false
  const localMs = Date.parse(local)
  const remoteMs = Date.parse(remoteIso)
  if (Number.isNaN(localMs) || Number.isNaN(remoteMs)) return false
  return localMs > remoteMs
}

function invoicePayload(id: string): Record<string, unknown> | null {
  const db = getDb()
  const row = db.prepare('SELECT * FROM invoices WHERE id = ?').get(id) as
    | Record<string, unknown>
    | undefined
  if (!row) return null
  const items = db.prepare('SELECT * FROM invoice_items WHERE invoice_id = ?').all(id)
  const payments = db.prepare('SELECT * FROM payments WHERE invoice_id = ?').all(id)
  return { ...row, items, payments }
}

function collectPushRows(): SyncRowInput[] {
  const rows: SyncRowInput[] = []
  for (const tomb of listTombstones()) {
    rows.push({
      entity: tomb.entity,
      row_id: tomb.row_id,
      data: {},
      updated_at: tomb.deleted_at,
      deleted: true
    })
  }
  const cursor = readSetting('sync.last_push_at')
  const since = cursor ? new Date(Date.parse(cursor) - OVERLAP_MS).toISOString() : null
  for (const entity of PUSH_ENTITIES) {
    const dbRows = (
      since
        ? getDb().prepare(`SELECT * FROM ${entity} WHERE updated_at > ?`).all(since)
        : getDb().prepare(`SELECT * FROM ${entity}`).all()
    ) as Array<Record<string, unknown>>
    for (const row of dbRows) {
      const id = row.id as string
      const data = entity === 'invoices' ? invoicePayload(id) : row
      if (!data) continue
      rows.push({
        entity,
        row_id: id,
        data,
        updated_at: row.updated_at as string,
        deleted: false
      })
    }
  }
  return rows
}

async function push(supa: SupabaseClient): Promise<void> {
  const rows = collectPushRows()
  if (rows.length === 0) return
  for (let i = 0; i < rows.length; i += PUSH_CHUNK) {
    const chunk = rows.slice(i, i + PUSH_CHUNK)
    const { error } = await supa.rpc('sync_push', { p_rows: chunk })
    if (error) throw new Error(`Sync push failed: ${error.message}`)
  }
  let maxTs = readSetting('sync.last_push_at') ?? ''
  for (const row of rows) {
    if (row.updated_at > maxTs) maxTs = row.updated_at
  }
  if (maxTs) {
    writeSetting('sync.last_push_at', maxTs)
    clearTombstonesBefore(maxTs)
  }
}

function applyDelete(entity: string, id: string, remoteIso: string): void {
  if (isLocalNewer(entity, id, remoteIso)) return
  const exists = getDb().prepare(`SELECT 1 FROM ${entity} WHERE id = ?`).get(id)
  if (!exists) return
  getDb().prepare(`DELETE FROM ${entity} WHERE id = ?`).run(id)
}

function applyUpsert(entity: string, id: string, data: Record<string, unknown>, remoteIso: string): void {
  if (isLocalNewer(entity, id, remoteIso)) return
  const columns = tableColumns(entity)
  const values = pick(data, columns)
  values.id = id
  const cols = Object.keys(values)
  const placeholders = cols.map(() => '?').join(', ')
  const updates = cols.filter((c) => c !== 'id' && c !== 'created_at').map((c) => `${c} = excluded.${c}`)
  const sql =
    `INSERT INTO ${entity} (${cols.join(', ')}) VALUES (${placeholders}) ` +
    `ON CONFLICT(id) DO UPDATE SET ${updates.length ? updates.join(', ') : 'id = excluded.id'}`
  getDb()
    .prepare(sql)
    .run(...cols.map((c) => values[c] as never))
}

function applyInvoice(data: Record<string, unknown>, remoteIso: string): void {
  const id = data.id as string
  if (isLocalNewer('invoices', id, remoteIso)) return
  const db = getDb()
  const columns = tableColumns('invoices')
  const items = (data.items as Array<Record<string, unknown>> | undefined) ?? []
  const payments = (data.payments as Array<Record<string, unknown>> | undefined) ?? []
  const { items: _items, payments: _payments, ...invoiceData } = data
  const values = pick(invoiceData, columns)
  values.id = id
  const cols = Object.keys(values)
  const placeholders = cols.map(() => '?').join(', ')
  const updates = cols.filter((c) => c !== 'id' && c !== 'created_at').map((c) => `${c} = excluded.${c}`)

  const run = db.transaction(() => {
    db.prepare(
      `INSERT INTO invoices (${cols.join(', ')}) VALUES (${placeholders}) ` +
        `ON CONFLICT(id) DO UPDATE SET ${updates.length ? updates.join(', ') : 'id = excluded.id'}`
    ).run(...cols.map((c) => values[c] as never))
    db.prepare('DELETE FROM invoice_items WHERE invoice_id = ?').run(id)
    db.prepare('DELETE FROM payments WHERE invoice_id = ?').run(id)
    const insertItem = db.prepare(
      `INSERT INTO invoice_items (id, invoice_id, description, quantity, rate, amount, position)
       VALUES (?, ?, ?, ?, ?, ?, ?)`
    )
    for (const item of items) {
      insertItem.run(
        item.id as string,
        id,
        item.description as string,
        (item.quantity as number) ?? 1,
        (item.rate as number) ?? 0,
        (item.amount as number) ?? 0,
        (item.position as number) ?? 0
      )
    }
    const insertPayment = db.prepare(
      `INSERT INTO payments (id, invoice_id, amount, paid_at, method, reference, notes)
       VALUES (?, ?, ?, ?, ?, ?, ?)`
    )
    for (const payment of payments) {
      insertPayment.run(
        payment.id as string,
        id,
        payment.amount as number,
        payment.paid_at as string,
        (payment.method as string) ?? '',
        (payment.reference as string) ?? '',
        (payment.notes as string) ?? ''
      )
    }
  })
  run()
}

function applyPulledRows(pulled: PulledRow[]): { applied: number; failedAt: string | null } {
  const ordered = [...pulled].sort(
    (a, b) => APPLY_ORDER.indexOf(a.entity) - APPLY_ORDER.indexOf(b.entity)
  )
  let applied = 0
  let failedAt: string | null = null
  for (const row of ordered) {
    try {
      if (row.deleted) {
        applyDelete(row.entity, row.row_id, row.updated_at)
      } else if (row.entity === 'invoices') {
        applyInvoice(row.data, row.updated_at)
      } else {
        applyUpsert(row.entity, row.row_id, row.data, row.updated_at)
      }
      applied += 1
    } catch {
      const ms = Date.parse(row.updated_at)
      if (!Number.isNaN(ms) && (failedAt === null || ms < Date.parse(failedAt))) {
        failedAt = row.updated_at
      }
    }
  }
  return { applied, failedAt }
}

async function pull(supa: SupabaseClient): Promise<number> {
  let cursor = readSetting('sync.last_pull_at')
  let applied = 0
  let failedAt: string | null = null
  for (;;) {
    const { data, error } = await supa.rpc('sync_pull', {
      p_since: cursor,
      p_limit: PULL_PAGE
    })
    if (error) throw new Error(`Sync pull failed: ${error.message}`)
    const payload = data as { ok?: boolean; rows?: PulledRow[]; server_now?: string }
    if (!payload.ok) throw new Error('Sync pull rejected — sign in again in Settings.')
    const rows = payload.rows ?? []
    if (rows.length === 0) break
    const result = applyPulledRows(rows)
    applied += result.applied
    if (result.failedAt) {
      failedAt = result.failedAt
      break
    }
    cursor = payload.server_now ?? cursor
    if (rows.length < PULL_PAGE) break
  }
  if (failedAt) {
    const retry = new Date(Date.parse(failedAt) - 1).toISOString()
    writeSetting('sync.last_pull_at', retry)
  } else if (cursor) {
    writeSetting('sync.last_pull_at', cursor)
  }
  return applied
}

function notifyRenderer(): void {
  for (const win of BrowserWindow.getAllWindows()) {
    if (!win.isDestroyed()) win.webContents.send('team:synced')
  }
}

async function loadTeamInfo(supa: SupabaseClient): Promise<CachedTeam | null> {
  const { data: auth } = await supa.auth.getUser()
  if (!auth.user) return null
  const { data: member, error } = await supa
    .from('team_members')
    .select('team_id, role')
    .eq('user_id', auth.user.id)
    .maybeSingle()
  if (error) throw new Error(error.message)
  if (!member) return null

  const teamId = member.team_id as string
  const [{ data: team }, rosterResult] = await Promise.all([
    supa.from('teams').select('name').eq('id', teamId).maybeSingle(),
    supa.rpc('team_roster')
  ])
  const members = ((rosterResult.data as { members?: unknown[] } | null)?.members ?? []) as unknown[]
  return {
    teamId,
    teamName: (team as { name?: string } | null)?.name ?? null,
    role: member.role as 'leader' | 'member',
    memberCount: members.length
  }
}

async function buildStatus(): Promise<TeamStatus> {
  return {
    inTeam: cachedTeam !== null,
    teamName: cachedTeam?.teamName ?? null,
    role: cachedTeam?.role ?? null,
    memberCount: cachedTeam?.memberCount ?? 0,
    lastSyncAt,
    syncing,
    lastError
  }
}

export function getStatus(): Promise<TeamStatus> {
  return buildStatus()
}

export async function syncNow(): Promise<TeamStatus> {
  if (syncing) return buildStatus()
  if (!isActivationConfigured() || !isTeamLicensed()) {
    cachedTeam = null
    return buildStatus()
  }

  syncing = true
  lastError = null
  try {
    const supa = authClient()
    const team = await loadTeamInfo(supa)
    cachedTeam = team
    if (!team) {
      // Not (or no longer) a team member — reset cursors so a future join
      // performs a full push/pull.
      clearSetting('sync.last_push_at')
      clearSetting('sync.last_pull_at')
      return buildStatus()
    }
    await push(supa)
    const applied = await pull(supa)
    lastSyncAt = now()
    if (applied > 0) notifyRenderer()
  } catch (err) {
    lastError = err instanceof Error ? err.message : String(err)
  } finally {
    syncing = false
  }
  return buildStatus()
}

export function scheduleSync(delayMs = 3000): void {
  if (syncTimer) clearTimeout(syncTimer)
  syncTimer = setTimeout(() => {
    syncTimer = null
    void syncNow()
  }, delayMs)
  syncTimer.unref?.()
}

export function startSyncLoop(): void {
  if (started) return
  started = true
  // First pass after the license/seat check has had a chance to run.
  const initial = setTimeout(() => void syncNow(), 6000)
  initial.unref?.()
  const interval = setInterval(() => void syncNow(), 60000)
  interval.unref?.()
  for (const win of BrowserWindow.getAllWindows()) {
    win.on('focus', () => scheduleSync(1500))
  }
  app.on('browser-window-created', (_event, win) => {
    win.on('focus', () => scheduleSync(1500))
  })
}
