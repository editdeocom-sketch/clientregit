import { useState, type ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import { Bar, BarChart, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Card, CardHeader, PageHeader } from '@/components/ui/Layout'
import { Icon } from '@/components/ui/Icon'
import {
  api,
  CHART_COLORS,
  fmtDate,
  invoiceTone,
  money,
  PROJECT_STATUS_LABEL,
  type Currency,
  type Invoice
} from '@/lib/api'
import { useApi } from '@/lib/hooks'
import { toast } from '@/store/ui'

const chartTooltip = {
  contentStyle: {
    background: 'var(--surface)',
    border: '1px solid var(--line)',
    borderRadius: 8,
    fontSize: 12,
    color: 'var(--ink)'
  },
  labelStyle: { color: 'var(--muted)' },
  cursor: { fill: 'var(--surface-2)' }
}

export function Reports(): ReactNode {
  const navigate = useNavigate()
  const [currency, setCurrency] = useState<Currency>('INR')

  const { data, loading, reload } = useApi<{
    revenue: Awaited<ReturnType<typeof api.dashboard.revenue>>
    income: Awaited<ReturnType<typeof api.dashboard.incomeByClient>>
    statusCounts: Awaited<ReturnType<typeof api.dashboard.statusCounts>>
    outstanding: Invoice[]
    totals: Awaited<ReturnType<typeof api.dashboard.stats>>
  }>(async () => {
    const [revenue, income, statusCounts, allInvoices, totals] = await Promise.all([
      api.dashboard.revenue(12, currency),
      api.dashboard.incomeByClient(currency, 10),
      api.dashboard.statusCounts(),
      api.invoices.list(),
      api.dashboard.stats()
    ])
    const outstanding = allInvoices.filter(
      (invoice) =>
        invoice.balance > 0 && ['sent', 'partial', 'overdue'].includes(invoice.status)
    )
    return { revenue, income, statusCounts, outstanding, totals }
  }, [currency])

  const exportPayments = async (): Promise<void> => {
    try {
      const result = await api.backup.exportCsv('payments')
      if (result.path) toast.success(`Saved to ${result.path}`)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : String(err))
    }
  }

  if (loading && !data) {
    return <div className="py-20 text-center text-sm text-muted">Loading reports…</div>
  }
  if (!data) return null

  const revenueRows = data.revenue.map((point) => ({
    label: point.month.slice(5),
    value: point[currency]
  }))
  const outstandingTotal = data.outstanding.reduce(
    (sum, invoice) => (invoice.currency === currency ? sum + invoice.balance : sum),
    0
  )
  const statusTotal = data.statusCounts.reduce((sum, row) => sum + row.count, 0)

  return (
    <div>
      <PageHeader
        title="Reports"
        subtitle="How the business is doing"
        actions={
          <>
            <div className="flex overflow-hidden rounded-lg border border-line bg-surface text-xs">
              {(['INR', 'USD'] as Currency[]).map((cur) => (
                <button
                  key={cur}
                  onClick={() => setCurrency(cur)}
                  className={`px-3 py-2 font-medium transition-colors cursor-pointer ${
                    currency === cur ? 'bg-gold text-white' : 'text-muted hover:text-ink'
                  }`}
                >
                  {cur}
                </button>
              ))}
            </div>
            <Button variant="secondary" icon={<Icon name="refresh" size={15} />} onClick={reload}>
              Refresh
            </Button>
            <Button variant="secondary" icon={<Icon name="download" size={15} />} onClick={exportPayments}>
              Export payments CSV
            </Button>
          </>
        }
      />

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader title="Revenue — last 12 months" subtitle={`Received in ${currency}`} />
          <div className="h-64 px-3 py-4">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={revenueRows} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
                <XAxis
                  dataKey="label"
                  tick={{ fontSize: 10, fill: 'var(--muted)' }}
                  axisLine={{ stroke: 'var(--line)' }}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fontSize: 10, fill: 'var(--muted)' }}
                  axisLine={false}
                  tickLine={false}
                  width={54}
                  tickFormatter={(value: number) =>
                    value >= 1000 ? `${Math.round(value / 1000)}k` : String(value)
                  }
                />
                <Tooltip {...chartTooltip} />
                <Bar dataKey="value" radius={[3, 3, 0, 0]} maxBarSize={30}>
                  {revenueRows.map((entry, index) => (
                    <Cell
                      key={index}
                      fill={entry.value > 0 ? CHART_COLORS[index % 3] : CHART_COLORS[3]}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card>
          <CardHeader title="Outstanding" subtitle={`Unpaid invoices in ${currency}`} />
          <div className="px-5 py-4">
            <p className="text-3xl font-semibold">{money(outstandingTotal, currency)}</p>
            <p className="mt-1 text-xs text-muted">{data.outstanding.length} open invoices</p>
            <div className="mt-4 space-y-2">
              {data.outstanding.slice(0, 5).map((invoice) => (
                <button
                  key={invoice.id}
                  onClick={() => navigate(`/invoices/${invoice.id}`)}
                  className="flex w-full items-center justify-between rounded-lg border border-line px-3 py-2 text-left transition-colors hover:border-gold cursor-pointer"
                >
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-medium">{invoice.invoice_number}</span>
                    <span className="block truncate text-xs text-muted">{invoice.client_name}</span>
                  </span>
                  <span className="text-right">
                    <span className="block text-sm font-semibold">
                      {money(invoice.balance, invoice.currency)}
                    </span>
                    <Badge tone={invoiceTone[invoice.status]}>{invoice.status}</Badge>
                  </span>
                </button>
              ))}
            </div>
          </div>
        </Card>
      </div>

      <div className="mt-5 grid grid-cols-1 gap-5 lg:grid-cols-2">
        <Card>
          <CardHeader title="Income by client" subtitle={`Top 10 in ${currency}`} />
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-line text-left text-[11px] uppercase tracking-wider text-muted">
                <th className="px-5 py-3 font-semibold">Client</th>
                <th className="px-5 py-3 text-right font-semibold">Received</th>
                <th className="px-5 py-3 text-right font-semibold">Share</th>
              </tr>
            </thead>
            <tbody>
              {data.income.length === 0 && (
                <tr>
                  <td colSpan={3} className="px-5 py-6 text-center text-muted">
                    No payments recorded yet.
                  </td>
                </tr>
              )}
              {data.income.map((row) => {
                const total = data.income.reduce((sum, item) => sum + item[currency], 0)
                const share = total > 0 ? Math.round((row[currency] / total) * 100) : 0
                return (
                  <tr
                    key={row.client_id}
                    onClick={() => navigate(`/clients/${row.client_id}`)}
                    className="border-b border-line/60 last:border-0 hover:bg-surface-2 cursor-pointer"
                  >
                    <td className="px-5 py-3 font-medium">{row.client_name}</td>
                    <td className="px-5 py-3 text-right font-semibold">
                      {money(row[currency], currency)}
                    </td>
                    <td className="px-5 py-3 text-right text-muted">{share}%</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </Card>

        <Card>
          <CardHeader title="Project pipeline" subtitle={`${statusTotal} projects total`} />
          <div className="space-y-3 px-5 py-4">
            {data.statusCounts.length === 0 && (
              <p className="text-sm text-muted">No projects yet.</p>
            )}
            {data.statusCounts.map((row, index) => (
              <div key={row.status}>
                <div className="mb-1 flex items-center justify-between text-xs">
                  <span className="font-medium">{PROJECT_STATUS_LABEL[row.status]}</span>
                  <span className="text-muted">{row.count}</span>
                </div>
                <div className="h-2.5 rounded-full bg-surface-2">
                  <div
                    className="h-2.5 rounded-full"
                    style={{
                      width: `${statusTotal ? Math.max((row.count / statusTotal) * 100, 4) : 0}%`,
                      background: row.status === 'in_progress' ? '#bf932a' : CHART_COLORS[index % 3]
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  )
}
