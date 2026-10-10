import { getDb, newId, now, round2 } from '../database'
import { getSettings } from './settings'
import { markTombstone } from '../tombstones'
import type {
  Invoice,
  InvoiceInput,
  InvoiceItem,
  InvoiceListOptions,
  InvoiceStatus,
  Payment,
  PaymentInput
} from '../../../shared/types'

interface InvoiceRow {
  id: string
  invoice_number: string
  client_id: string
  client_name?: string
  project_id: string | null
  project_title?: string | null
  issue_date: string
  due_date: string | null
  status: InvoiceStatus
  currency: Invoice['currency']
  subtotal: number
  tax_percent: number
  tax_amount: number
  discount: number
  total: number
  notes: string
  created_at: string
  updated_at: string
}

function today(): string {
  return new Date().toISOString().slice(0, 10)
}

export function computeTotals(
  items: Array<{ quantity: number; rate: number }>,
  taxPercent: number,
  discount: number
): { subtotal: number; tax_amount: number; total: number } {
  const subtotal = round2(items.reduce((sum, it) => sum + it.quantity * it.rate, 0))
  const safeDiscount = round2(Math.min(Math.max(discount || 0, 0), subtotal))
  const taxable = round2(subtotal - safeDiscount)
  const taxAmount = round2((taxable * (taxPercent || 0)) / 100)
  const total = round2(taxable + taxAmount)
  return { subtotal, tax_amount: taxAmount, total }
}

function effectiveStatus(row: InvoiceRow, amountPaid: number): InvoiceStatus {
  if (row.status === 'sent' || row.status === 'partial') {
    if (row.due_date && row.due_date < today()) return 'overdue'
  }
  return row.status
}

function attach(row: InvoiceRow): Invoice {
  const db = getDb()
  const items = db
    .prepare('SELECT * FROM invoice_items WHERE invoice_id = ? ORDER BY position ASC')
    .all(row.id) as InvoiceItem[]
  const payments = db
    .prepare('SELECT * FROM payments WHERE invoice_id = ? ORDER BY paid_at ASC')
    .all(row.id) as Payment[]
  const amountPaid = round2(payments.reduce((sum, p) => sum + p.amount, 0))
  const balance = round2(row.total - amountPaid)
  const { client_name, project_title, ...rest } = row
  return {
    ...rest,
    client_name,
    project_title,
    items,
    payments,
    amount_paid: amountPaid,
    balance,
    status: effectiveStatus(row, amountPaid)
  }
}

export function listInvoices(options: InvoiceListOptions = {}): Invoice[] {
  const db = getDb()
  const clauses: string[] = []
  const params: unknown[] = []

  if (options.client_id) {
    clauses.push('i.client_id = ?')
    params.push(options.client_id)
  }
  if (options.q) {
    clauses.push('(i.invoice_number LIKE ? OR c.name LIKE ? OR i.notes LIKE ?)')
    const like = `%${options.q}%`
    params.push(like, like, like)
  }

  const where = clauses.length ? `WHERE ${clauses.join(' AND ')}` : ''
  const rows = db
    .prepare(
      `SELECT i.*, c.name AS client_name, p.title AS project_title
       FROM invoices i
       JOIN clients c ON c.id = i.client_id
       LEFT JOIN projects p ON p.id = i.project_id
       ${where}
       ORDER BY i.issue_date DESC, i.created_at DESC`
    )
    .all(...params) as InvoiceRow[]

  let invoices = rows.map(attach)
  if (options.status) {
    invoices = invoices.filter((inv) => inv.status === options.status)
  }
  return invoices
}

export function getInvoice(id: string): Invoice | null {
  const row = getDb()
    .prepare(
      `SELECT i.*, c.name AS client_name, p.title AS project_title
       FROM invoices i
       JOIN clients c ON c.id = i.client_id
       LEFT JOIN projects p ON p.id = i.project_id
       WHERE i.id = ?`
    )
    .get(id) as InvoiceRow | undefined
  return row ? attach(row) : null
}

function nextNumber(): string {
  const settings = getSettings()
  return `${settings.invoice_prefix}${String(settings.invoice_next).padStart(4, '0')}`
}

export function previewInvoiceNumber(): string {
  return nextNumber()
}

function bumpCounter(): void {
  getDb()
    .prepare('UPDATE settings SET value = CAST(value AS INTEGER) + 1 WHERE key = ?')
    .run('invoice_next')
}

function insertItems(
  invoiceId: string,
  items: InvoiceInput['items'],
  amounts: { subtotal: number; tax_amount: number; total: number },
  taxPercent: number,
  discount: number
): void {
  const db = getDb()
  db.prepare('DELETE FROM invoice_items WHERE invoice_id = ?').run(invoiceId)
  const insert = db.prepare(
    `INSERT INTO invoice_items (id, invoice_id, description, quantity, rate, amount, position)
     VALUES (?, ?, ?, ?, ?, ?, ?)`
  )
  items.forEach((item, index) => {
    if (!item.description.trim()) return
    insert.run(
      newId(),
      invoiceId,
      item.description.trim(),
      item.quantity,
      item.rate,
      round2(item.quantity * item.rate),
      index
    )
  })
  db.prepare(
    `UPDATE invoices SET subtotal = ?, tax_percent = ?, tax_amount = ?, discount = ?, total = ?, updated_at = ?
     WHERE id = ?`
  ).run(amounts.subtotal, taxPercent, amounts.tax_amount, discount, amounts.total, now(), invoiceId)
}

export function createInvoice(input: InvoiceInput): Invoice {
  const db = getDb()
  const id = newId()
  const ts = now()
  const taxPercent = input.tax_percent ?? 0
  const discount = input.discount ?? 0
  const totals = computeTotals(input.items, taxPercent, discount)
  const number = nextNumber()

  const run = db.transaction(() => {
    db.prepare(
      `INSERT INTO invoices (id, invoice_number, client_id, project_id, issue_date, due_date,
        status, currency, subtotal, tax_percent, tax_amount, discount, total, notes, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    ).run(
      id,
      number,
      input.client_id,
      input.project_id ?? null,
      input.issue_date,
      input.due_date ?? null,
      input.status ?? 'draft',
      input.currency,
      totals.subtotal,
      taxPercent,
      totals.tax_amount,
      discount,
      totals.total,
      input.notes?.trim() ?? '',
      ts,
      ts
    )
    insertItems(id, input.items, totals, taxPercent, discount)
    bumpCounter()
  })
  run()

  const invoice = getInvoice(id)
  if (!invoice) throw new Error('Failed to create invoice')
  return invoice
}

export function updateInvoice(id: string, input: InvoiceInput): Invoice {
  const db = getDb()
  const existing = getInvoice(id)
  if (!existing) throw new Error('Invoice not found')

  const taxPercent = input.tax_percent ?? 0
  const discount = input.discount ?? 0
  const totals = computeTotals(input.items, taxPercent, discount)
  const targetStatus: InvoiceStatus =
    input.status ?? (existing.status === 'overdue' ? 'sent' : existing.status)

  const run = db.transaction(() => {
    db.prepare(
      `UPDATE invoices SET client_id = ?, project_id = ?, issue_date = ?, due_date = ?,
        status = ?, currency = ?, notes = ?, updated_at = ? WHERE id = ?`
    ).run(
      input.client_id,
      input.project_id ?? null,
      input.issue_date,
      input.due_date ?? null,
      targetStatus,
      input.currency,
      input.notes?.trim() ?? '',
      now(),
      id
    )
    insertItems(id, input.items, totals, taxPercent, discount)
    syncStatus(id)
  })
  run()

  const invoice = getInvoice(id)
  if (!invoice) throw new Error('Invoice not found')
  return invoice
}

function syncStatus(id: string): void {
  const db = getDb()
  const row = db.prepare('SELECT * FROM invoices WHERE id = ?').get(id) as InvoiceRow | undefined
  if (!row || row.status === 'cancelled' || row.status === 'draft') return
  const paidRow = db
    .prepare('SELECT IFNULL(SUM(amount), 0) AS s FROM payments WHERE invoice_id = ?')
    .get(id) as { s: number }
  const paid = round2(paidRow.s)
  const balance = round2(row.total - paid)
  let status: InvoiceStatus = row.status
  if (balance <= 0) status = 'paid'
  else if (paid > 0) status = 'partial'
  else if (row.status === 'paid' || row.status === 'partial') status = 'sent'
  if (status !== row.status) {
    db.prepare('UPDATE invoices SET status = ?, updated_at = ? WHERE id = ?').run(status, now(), id)
  }
}

export function setInvoiceStatus(id: string, status: InvoiceStatus): void {
  getDb()
    .prepare('UPDATE invoices SET status = ?, updated_at = ? WHERE id = ?')
    .run(status, now(), id)
}

export function deleteInvoice(id: string): void {
  getDb().prepare('DELETE FROM invoices WHERE id = ?').run(id)
  markTombstone('invoices', id)
}

export function addPayment(invoiceId: string, input: PaymentInput): Invoice {
  const db = getDb()
  const invoice = getInvoice(invoiceId)
  if (!invoice) throw new Error('Invoice not found')
  if (input.amount <= 0) throw new Error('Payment amount must be greater than zero')
  if (invoice.status === 'cancelled') throw new Error('Cannot add a payment to a cancelled invoice')

  db.prepare(
    `INSERT INTO payments (id, invoice_id, amount, paid_at, method, reference, notes)
     VALUES (?, ?, ?, ?, ?, ?, ?)`
  ).run(
    newId(),
    invoiceId,
    round2(input.amount),
    input.paid_at ?? today(),
    input.method ?? '',
    input.reference ?? '',
    input.notes ?? ''
  )
  if (invoice.status === 'draft') setInvoiceStatus(invoiceId, 'sent')
  syncStatus(invoiceId)
  getDb().prepare('UPDATE invoices SET updated_at = ? WHERE id = ?').run(now(), invoiceId)
  return getInvoice(invoiceId)!
}

export function removePayment(paymentId: string): Invoice | null {
  const db = getDb()
  const row = db
    .prepare('SELECT invoice_id FROM payments WHERE id = ?')
    .get(paymentId) as { invoice_id: string } | undefined
  if (!row) return null
  db.prepare('DELETE FROM payments WHERE id = ?').run(paymentId)
  syncStatus(row.invoice_id)
  db.prepare('UPDATE invoices SET updated_at = ? WHERE id = ?').run(now(), row.invoice_id)
  return getInvoice(row.invoice_id)
}
