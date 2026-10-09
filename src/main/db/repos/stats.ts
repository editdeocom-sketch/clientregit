import { getDb, round2 } from '../database'
import type {
  CalendarEvent,
  ClientIncome,
  Currency,
  DashboardStats,
  MonthPoint,
  StatusCount
} from '../../../shared/types'

function today(): string {
  return new Date().toISOString().slice(0, 10)
}

export function getDashboardStats(): DashboardStats {
  const db = getDb()

  const active = db
    .prepare(`SELECT COUNT(*) AS c FROM projects WHERE status NOT IN ('delivered', 'cancelled')`)
    .get() as { c: number }

  const overdue = db
    .prepare(
      `SELECT COUNT(*) AS c FROM projects
       WHERE deadline IS NOT NULL AND deadline < ?
         AND status NOT IN ('delivered', 'cancelled')`
    )
    .get(today()) as { c: number }

  const unpaidRows = db
    .prepare(
      `SELECT i.currency AS currency,
              IFNULL(SUM(i.total - IFNULL(p.paid, 0)), 0) AS amount
       FROM invoices i
       LEFT JOIN (SELECT invoice_id, SUM(amount) AS paid FROM payments GROUP BY invoice_id) p
         ON p.invoice_id = i.id
       WHERE i.status IN ('sent', 'partial')
       GROUP BY i.currency`
    )
    .all() as Array<{ currency: Currency; amount: number }>

  const monthStart = `${today().slice(0, 7)}-01`
  const revenueRows = db
    .prepare(
      `SELECT i.currency AS currency, IFNULL(SUM(p.amount), 0) AS amount
       FROM payments p JOIN invoices i ON i.id = p.invoice_id
       WHERE p.paid_at >= ? AND i.status != 'cancelled'
       GROUP BY i.currency`
    )
    .all(monthStart) as Array<{ currency: Currency; amount: number }>

  const unpaid: Record<Currency, number> = { INR: 0, USD: 0 }
  for (const row of unpaidRows) unpaid[row.currency] = round2(row.amount)

  const revenue: Record<Currency, number> = { INR: 0, USD: 0 }
  for (const row of revenueRows) revenue[row.currency] = round2(row.amount)

  return {
    active_projects: active.c,
    overdue_deadlines: overdue.c,
    unpaid,
    revenue_month: revenue
  }
}

export function getRevenue(months: number, currency: Currency): MonthPoint[] {
  const db = getDb()
  const points: MonthPoint[] = []
  const now = new Date()
  const keys: string[] = []
  for (let i = months - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    keys.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`)
  }
  for (const key of keys) points.push({ month: key, INR: 0, USD: 0 })

  const start = `${keys[0]}-01`
  const endMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1)
  const end = `${endMonth.getFullYear()}-${String(endMonth.getMonth()).padStart(2, '0')}-01`

  const rows = db
    .prepare(
      `SELECT substr(p.paid_at, 1, 7) AS month, IFNULL(SUM(p.amount), 0) AS amount
       FROM payments p JOIN invoices i ON i.id = p.invoice_id
       WHERE i.currency = ? AND i.status != 'cancelled' AND p.paid_at >= ? AND p.paid_at < ?
       GROUP BY month`
    )
    .all(currency, start, end) as Array<{ month: string; amount: number }>

  for (const row of rows) {
    const point = points.find((p) => p.month === row.month)
    if (point) point[currency] = round2(row.amount)
  }
  return points
}

export function getIncomeByClient(currency: Currency, limit: number): ClientIncome[] {
  const db = getDb()
  const rows = db
    .prepare(
      `SELECT c.id AS client_id, c.name AS client_name, IFNULL(SUM(p.amount), 0) AS amount
       FROM payments p
       JOIN invoices i ON i.id = p.invoice_id
       JOIN clients c ON c.id = i.client_id
       WHERE i.currency = ? AND i.status != 'cancelled'
       GROUP BY c.id
       ORDER BY amount DESC
       LIMIT ?`
    )
    .all(currency, limit) as Array<{
    client_id: string
    client_name: string
    amount: number
  }>
  return rows.map((row) => {
    const income: ClientIncome = { client_id: row.client_id, client_name: row.client_name, INR: 0, USD: 0 }
    income[currency] = round2(row.amount)
    return income
  })
}

export function getStatusCounts(): StatusCount[] {
  const rows = getDb()
    .prepare(
      `SELECT status, COUNT(*) AS count FROM projects
       GROUP BY status`
    )
    .all() as StatusCount[]
  return rows
}

export function getCalendarRange(start: string, end: string): CalendarEvent[] {
  const db = getDb()

  const deadlines = db
    .prepare(
      `SELECT p.id, p.title, p.status, p.deadline AS date, c.name AS client_name
       FROM projects p JOIN clients c ON c.id = p.client_id
       WHERE p.deadline IS NOT NULL AND p.deadline >= ? AND p.deadline <= ?
         AND p.status NOT IN ('cancelled')`
    )
    .all(start, end) as Array<{
    id: string
    title: string
    status: string
    date: string
    client_name: string
  }>

  const dueInvoices = db
    .prepare(
      `SELECT i.id, i.invoice_number, i.status, i.due_date AS date, c.name AS client_name
       FROM invoices i JOIN clients c ON c.id = i.client_id
       WHERE i.due_date IS NOT NULL AND i.due_date >= ? AND i.due_date <= ?
         AND i.status IN ('sent', 'partial')`
    )
    .all(start, end) as Array<{
    id: string
    invoice_number: string
    status: string
    date: string
    client_name: string
  }>

  const events: CalendarEvent[] = [
    ...deadlines.map((d) => ({
      date: d.date,
      kind: 'deadline' as const,
      id: d.id,
      title: d.title,
      subtitle: d.client_name,
      status: d.status,
      route: `/projects/${d.id}`
    })),
    ...dueInvoices.map((i) => ({
      date: i.date,
      kind: 'invoice_due' as const,
      id: i.id,
      title: i.invoice_number,
      subtitle: i.client_name,
      status: i.status,
      route: `/invoices/${i.id}`
    }))
  ]
  events.sort((a, b) => a.date.localeCompare(b.date))
  return events
}
