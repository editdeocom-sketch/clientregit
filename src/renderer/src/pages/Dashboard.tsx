import { useMemo, useState, type ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Bar,
  BarChart,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from 'recharts'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Card, CardHeader, EmptyState, PageHeader } from '@/components/ui/Layout'
import { Icon } from '@/components/ui/Icon'
import { api, fmtDate, invoiceTone, money, type Currency, type Invoice } from '@/lib/api'
import { useApi } from '@/lib/hooks'

interface DashboardData {
  stats: Awaited<ReturnType<typeof api.dashboard.stats>>
  revenue: Awaited<ReturnType<typeof api.dashboard.revenue>>
  income: Awaited<ReturnType<typeof api.dashboard.incomeByClient>>
  statusCounts: Awaited<ReturnType<typeof api.dashboard.statusCounts>>
  upcoming: Awaited<ReturnType<typeof api.dashboard.upcoming>>
  recent: Invoice[]
  defaultCurrency: Currency
}

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

function StatCard({
  label,
  value,
  note,
  icon
}: {
  label: string
  value: string
  note?: string
  icon: ReactNode
}): ReactNode {
  return (
    <Card className="px-5 py-4">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-wider text-muted">{label}</p>
          <p className="mt-2 text-2xl font-semibold tracking-tight">{value}</p>
          {note && <p className="mt-1 text-xs text-muted">{note}</p>}
        </div>
        <div className="rounded-lg bg-gold/15 p-2 text-gold">{icon}</div>
      </div>
    </Card>
  )
}

export function Dashboard(): ReactNode {
  const navigate = useNavigate()
  const [currency, setCurrency] = useState<Currency | null>(null)

  const { data, loading, reload } = useApi<DashboardData>(async () => {
    const settings = await api.settings.get()
    const activeCurrency = currency ?? settings.currency
    const [stats, revenue, income, statusCounts, upcoming, recent] = await Promise.all([
      api.dashboard.stats(),
      api.dashboard.revenue(6, activeCurrency),
      api.dashboard.incomeByClient(activeCurrency, 5),
      api.dashboard.statusCounts(),
      api.dashboard.upcoming(14),
      api.invoices.list()
    ])
    return {
      stats,
      revenue,
      income,
      statusCounts,
      upcoming,
      recent: recent.slice(0, 5),
      defaultCurrency: activeCurrency
    }
  }, [currency])

  const activeCurrency = data?.defaultCurrency ?? 'INR'

  const revenueMax = useMemo(
    () => Math.max(...(data?.revenue ?? []).map((point) => point[activeCurrency]), 1),
    [data, activeCurrency]
  )

  const statusTotal = useMemo(
    () => (data?.statusCounts ?? []).reduce((sum, row) => sum + row.count, 0),
    [data]
  )

  if (loading && !data) {
    return <div className="py-20 text-center text-sm text-muted">Loading dashboard…</div>
  }
  if (!data) return null

  const unpaidTotal =
    data.stats.unpaid.INR > 0 && data.stats.unpaid.USD > 0
      ? `${money(data.stats.unpaid.INR, 'INR')}  ·  ${money(data.stats.unpaid.USD, 'USD')}`
      : data.stats.unpaid.USD > 0
        ? money(data.stats.unpaid.USD, 'USD')
        : money(data.stats.unpaid.INR, 'INR')

  const revenueMonth =
    data.stats.revenue_month.INR > 0 && data.stats.revenue_month.USD > 0
      ? `${money(data.stats.revenue_month.INR, 'INR')}  ·  ${money(data.stats.revenue_month.USD, 'USD')}`
      : data.stats.revenue_month.USD > 0
        ? money(data.stats.revenue_month.USD, 'USD')
        : money(data.stats.revenue_month.INR, 'INR')

  const revenueChart = data.revenue.map((point) => ({
    label: point.month.slice(5),
    value: point[activeCurrency]
  }))

  return (
    <div>
      <PageHeader
        title="Dashboard"
        subtitle={new Date().toLocaleDateString('en-GB', {
          weekday: 'long',
          day: 'numeric',
          month: 'long',
          year: 'numeric'
        })}
        actions={
          <>
            <Button variant="secondary" icon={<Icon name="refresh" size={15} />} onClick={reload}>
              Refresh
            </Button>
            <Button
              variant="primary"
              icon={<Icon name="plus" size={15} />}
              onClick={() => navigate('/invoices/new')}
            >
              New invoice
            </Button>
          </>
        }
      />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard
          label="Active projects"
          value={String(data.stats.active_projects)}
          icon={<Icon name="film" size={18} />}
        />
        <StatCard
          label="Overdue deadlines"
          value={String(data.stats.overdue_deadlines)}
          note={data.stats.overdue_deadlines > 0 ? 'Needs attention' : 'All on track'}
          icon={<Icon name="alert" size={18} />}
        />
        <StatCard label="Unpaid invoices" value={unpaidTotal} icon={<Icon name="file-text" size={18} />} />
        <StatCard label="Received this month" value={revenueMonth} icon={<Icon name="money" size={18} />} />
      </div>

      <div className="mt-5 grid grid-cols-1 gap-5 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader
            title="Revenue — last 6 months"
            subtitle={`Payments received in ${activeCurrency}`}
            action={
              <div className="flex overflow-hidden rounded-lg border border-line text-xs">
                {(['INR', 'USD'] as Currency[]).map((cur) => (
                  <button
                    key={cur}
                    onClick={() => setCurrency(cur)}
                    className={`px-2.5 py-1 font-medium transition-colors cursor-pointer ${
                      activeCurrency === cur
                        ? 'bg-gold text-white'
                        : 'bg-surface text-muted hover:text-ink'
                    }`}
                  >
                    {cur}
                  </button>
                ))}
              </div>
            }
          />
          <div className="h-60 px-3 py-4">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={revenueChart} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
                <XAxis
                  dataKey="label"
                  tick={{ fontSize: 11, fill: 'var(--muted)' }}
                  axisLine={{ stroke: 'var(--line)' }}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fontSize: 11, fill: 'var(--muted)' }}
                  axisLine={false}
                  tickLine={false}
                  width={54}
                  tickFormatter={(value: number) =>
                    value >= 1000 ? `${Math.round(value / 1000)}k` : String(value)
                  }
                />
                <Tooltip {...chartTooltip} />
                <Bar dataKey="value" radius={[4, 4, 0, 0]} maxBarSize={44}>
                  {revenueChart.map((entry, index) => (
                    <Cell
                      key={index}
                      fill={entry.value >= revenueMax && entry.value > 0 ? '#bf932a' : '#dfc57b'}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card>
          <CardHeader title="Project status" subtitle={`${statusTotal} projects total`} />
          <div className="space-y-3 px-5 py-4">
            {data.statusCounts.length === 0 && (
              <p className="text-sm text-muted">No projects yet.</p>
            )}
            {data.statusCounts.map((row) => (
              <div key={row.status}>
                <div className="mb-1 flex items-center justify-between text-xs">
                  <span className="capitalize text-muted">
                    {row.status.replace('_', ' ')}
                  </span>
                  <span className="font-semibold">{row.count}</span>
                </div>
                <div className="h-2 rounded-full bg-surface-2">
                  <div
                    className={`h-2 rounded-full ${row.status === 'in_progress' ? 'bg-gold' : 'bg-gold-soft/70'}`}
                    style={{
                      width: `${statusTotal ? Math.max((row.count / statusTotal) * 100, 3) : 0}%`
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <div className="mt-5 grid grid-cols-1 gap-5 lg:grid-cols-2">
        <Card>
          <CardHeader title="Top clients" subtitle={`By payments received in ${activeCurrency}`} />
          <div className="px-5 py-4">
            {data.income.length === 0 ? (
              <p className="text-sm text-muted">No payment history yet.</p>
            ) : (
              <div className="space-y-3">
                {data.income.map((row, index) => (
                  <button
                    key={row.client_id}
                    onClick={() => navigate(`/clients/${row.client_id}`)}
                    className="flex w-full items-center justify-between rounded-lg px-2 py-1.5 text-left transition-colors hover:bg-surface-2 cursor-pointer"
                  >
                    <span className="flex items-center gap-2.5 text-sm">
                      <span className="flex h-6 w-6 items-center justify-center rounded-full bg-gold/15 text-[10px] font-bold text-gold">
                        {index + 1}
                      </span>
                      {row.client_name}
                    </span>
                    <span className="text-sm font-semibold">
                      {money(row[activeCurrency], activeCurrency)}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </Card>

        <Card>
          <CardHeader
            title="Upcoming & overdue"
            subtitle="Next 14 days"
            action={
              <Button size="sm" variant="ghost" onClick={() => navigate('/calendar')}>
                Calendar
              </Button>
            }
          />
          <div className="px-5 py-4">
            {data.upcoming.length === 0 ? (
              <p className="text-sm text-muted">Nothing due in the next two weeks.</p>
            ) : (
              <div className="space-y-2">
                {data.upcoming.slice(0, 6).map((event) => (
                  <button
                    key={`${event.kind}-${event.id}`}
                    onClick={() => navigate(event.route)}
                    className="flex w-full items-center gap-3 rounded-lg border border-line px-3 py-2 text-left transition-colors hover:border-gold cursor-pointer"
                  >
                    <div className="w-14 shrink-0 text-center">
                      <div className="text-[10px] uppercase text-muted">
                        {new Date(`${event.date}T00:00:00`).toLocaleDateString('en-GB', {
                          month: 'short'
                        })}
                      </div>
                      <div className="text-sm font-bold">{event.date.slice(8, 10)}</div>
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-sm font-medium">{event.title}</div>
                      <div className="truncate text-xs text-muted">{event.subtitle}</div>
                    </div>
                    <Badge tone={event.kind === 'deadline' ? 'gold' : 'info'}>
                      {event.kind === 'deadline' ? 'deadline' : 'invoice due'}
                    </Badge>
                  </button>
                ))}
              </div>
            )}
          </div>
        </Card>
      </div>

      <Card className="mt-5">
        <CardHeader
          title="Recent invoices"
          action={
            <Button size="sm" variant="ghost" onClick={() => navigate('/invoices')}>
              View all
            </Button>
          }
        />
        {data.recent.length === 0 ? (
          <div className="px-5 py-6">
            <EmptyState
              icon="file-text"
              title="No invoices yet"
              message="Create your first invoice to start tracking payments."
              action={
                <Button variant="primary" onClick={() => navigate('/invoices/new')}>
                  New invoice
                </Button>
              }
            />
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-line text-left text-[11px] uppercase tracking-wider text-muted">
                <th className="px-5 py-3 font-semibold">Number</th>
                <th className="px-5 py-3 font-semibold">Client</th>
                <th className="px-5 py-3 font-semibold">Issued</th>
                <th className="px-5 py-3 font-semibold">Status</th>
                <th className="px-5 py-3 text-right font-semibold">Total</th>
              </tr>
            </thead>
            <tbody>
              {data.recent.map((invoice) => (
                <tr
                  key={invoice.id}
                  onClick={() => navigate(`/invoices/${invoice.id}`)}
                  className="border-b border-line/60 transition-colors last:border-0 hover:bg-surface-2 cursor-pointer"
                >
                  <td className="px-5 py-3 font-medium">{invoice.invoice_number}</td>
                  <td className="px-5 py-3 text-muted">{invoice.client_name}</td>
                  <td className="px-5 py-3 text-muted">{fmtDate(invoice.issue_date)}</td>
                  <td className="px-5 py-3">
                    <Badge tone={invoiceTone[invoice.status]}>{invoice.status}</Badge>
                  </td>
                  <td className="px-5 py-3 text-right font-semibold">
                    {money(invoice.total, invoice.currency)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>
    </div>
  )
}
