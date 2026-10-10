import { getDb, newId, now } from '../database'
import { markTombstone } from '../tombstones'
import type { Client, ClientInput, ClientListOptions } from '../../../shared/types'

interface ClientRow {
  id: string
  name: string
  company: string
  email: string
  phone: string
  address: string
  notes: string
  tags: string
  color: string
  currency: string | null
  archived: number
  created_at: string
  updated_at: string
}

function rowToClient(row: ClientRow): Client {
  return {
    id: row.id,
    name: row.name,
    company: row.company,
    email: row.email,
    phone: row.phone,
    address: row.address,
    notes: row.notes,
    tags: row.tags
      ? row.tags
          .split(',')
          .map((t) => t.trim())
          .filter(Boolean)
      : [],
    color: row.color,
    currency: (row.currency as Client['currency']) ?? null,
    archived: row.archived === 1,
    created_at: row.created_at,
    updated_at: row.updated_at
  }
}

export function listClients(options: ClientListOptions = {}): Client[] {
  const db = getDb()
  const clauses: string[] = []
  const params: unknown[] = []

  if (!options.includeArchived) clauses.push('archived = 0')
  if (options.q) {
    clauses.push('(name LIKE ? OR company LIKE ? OR email LIKE ? OR phone LIKE ?)')
    const like = `%${options.q}%`
    params.push(like, like, like, like)
  }

  const where = clauses.length ? `WHERE ${clauses.join(' AND ')}` : ''
  const rows = db
    .prepare(`SELECT * FROM clients ${where} ORDER BY name COLLATE NOCASE ASC`)
    .all(...params) as ClientRow[]
  return rows.map(rowToClient)
}

export function getClient(id: string): Client | null {
  const row = getDb().prepare('SELECT * FROM clients WHERE id = ?').get(id) as
    | ClientRow
    | undefined
  return row ? rowToClient(row) : null
}

export function createClient(input: ClientInput): Client {
  const db = getDb()
  const id = newId()
  const ts = now()
  db.prepare(
    `INSERT INTO clients (id, name, company, email, phone, address, notes, tags, color, currency, archived, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, ?, ?)`
  ).run(
    id,
    input.name.trim(),
    input.company?.trim() ?? '',
    input.email?.trim() ?? '',
    input.phone?.trim() ?? '',
    input.address?.trim() ?? '',
    input.notes?.trim() ?? '',
    (input.tags ?? []).join(','),
    input.color ?? '#BF932A',
    input.currency ?? null,
    ts,
    ts
  )
  return getClient(id)!
}

export function updateClient(id: string, input: ClientInput): Client {
  const db = getDb()
  db.prepare(
    `UPDATE clients SET name = ?, company = ?, email = ?, phone = ?, address = ?, notes = ?,
       tags = ?, color = ?, currency = ?, updated_at = ? WHERE id = ?`
  ).run(
    input.name.trim(),
    input.company?.trim() ?? '',
    input.email?.trim() ?? '',
    input.phone?.trim() ?? '',
    input.address?.trim() ?? '',
    input.notes?.trim() ?? '',
    (input.tags ?? []).join(','),
    input.color ?? '#BF932A',
    input.currency ?? null,
    now(),
    id
  )
  const client = getClient(id)
  if (!client) throw new Error('Client not found')
  return client
}

export function setClientArchived(id: string, archived: boolean): void {
  getDb()
    .prepare('UPDATE clients SET archived = ?, updated_at = ? WHERE id = ?')
    .run(archived ? 1 : 0, now(), id)
}

export function deleteClient(id: string): void {
  const db = getDb()
  const projects = db
    .prepare('SELECT COUNT(*) AS c FROM projects WHERE client_id = ?')
    .get(id) as { c: number }
  const invoices = db
    .prepare('SELECT COUNT(*) AS c FROM invoices WHERE client_id = ?')
    .get(id) as { c: number }
  if (projects.c > 0 || invoices.c > 0) {
    throw new Error(
      'This client has projects or invoices. Archive the client instead of deleting.'
    )
  }
  db.prepare('DELETE FROM clients WHERE id = ?').run(id)
  markTombstone('clients', id)
}

export function clientTotals(
  id: string
): { projects: number; invoiced: number; paid: number } {
  const db = getDb()
  const projects = db
    .prepare('SELECT COUNT(*) AS c FROM projects WHERE client_id = ?')
    .get(id) as { c: number }
  const invoiced = db
    .prepare(
      `SELECT IFNULL(SUM(total), 0) AS s FROM invoices WHERE client_id = ? AND status != 'cancelled'`
    )
    .get(id) as { s: number }
  const paid = db
    .prepare(
      `SELECT IFNULL(SUM(p.amount), 0) AS s
       FROM payments p JOIN invoices i ON i.id = p.invoice_id
       WHERE i.client_id = ? AND i.status != 'cancelled'`
    )
    .get(id) as { s: number }
  return { projects: projects.c, invoiced: invoiced.s, paid: paid.s }
}
