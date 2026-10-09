import { useState, type ReactNode } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { Card, CardHeader, EmptyState, PageHeader } from '@/components/ui/Layout'
import { Icon } from '@/components/ui/Icon'
import { ClientForm } from '@/components/clients/ClientForm'
import { StatusBadge } from '@/components/projects/StatusBadge'
import {
  api,
  fmtDate,
  invoiceTone,
  money,
  type Client,
  type Invoice,
  type Project
} from '@/lib/api'
import { useApi } from '@/lib/hooks'
import { toast } from '@/store/ui'

type Tab = 'projects' | 'invoices' | 'info'

interface DetailData {
  client: Client
  totals: Awaited<ReturnType<typeof api.clients.totals>>
  projects: Project[]
  invoices: Invoice[]
}

export function ClientDetail(): ReactNode {
  const { id = '' } = useParams()
  const navigate = useNavigate()
  const [tab, setTab] = useState<Tab>('projects')
  const [formOpen, setFormOpen] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)

  const { data, loading, reload } = useApi<DetailData>(async () => {
    const client = await api.clients.get(id)
    if (!client) throw new Error('Client not found')
    const [totals, projects, invoices] = await Promise.all([
      api.clients.totals(id),
      api.projects.list({ client_id: id, includeDone: true }),
      api.invoices.list({ client_id: id })
    ])
    return { client, totals, projects, invoices }
  }, [id])

  if (loading && !data) {
    return <div className="py-20 text-center text-sm text-muted">Loading client…</div>
  }
  if (!data) return null

  const { client, totals, projects, invoices } = data

  const toggleArchive = async (): Promise<void> => {
    try {
      await api.clients.setArchived(client.id, !client.archived)
      toast.success(client.archived ? 'Client restored' : 'Client archived')
      reload()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : String(err))
    }
  }

  const tabs: Array<{ id: Tab; label: string; count: number }> = [
    { id: 'projects', label: 'Projects', count: projects.length },
    { id: 'invoices', label: 'Invoices', count: invoices.length },
    { id: 'info', label: 'Details', count: 0 }
  ]

  return (
    <div>
      <Link to="/clients" className="mb-4 inline-flex items-center gap-1.5 text-sm text-muted hover:text-ink">
        <Icon name="arrow-left" size={15} />
        Clients
      </Link>

      <PageHeader
        title={client.name}
        subtitle={[client.company, client.email].filter(Boolean).join(' · ') || undefined}
        actions={
          <>
            <Button
              variant="secondary"
              icon={<Icon name="trash" size={15} />}
              onClick={() => setConfirmDelete(true)}
            >
              Delete
            </Button>
            <Button variant="secondary" icon={<Icon name="archive" size={15} />} onClick={toggleArchive}>
              {client.archived ? 'Restore' : 'Archive'}
            </Button>
            <Button variant="secondary" icon={<Icon name="pencil" size={15} />} onClick={() => setFormOpen(true)}>
              Edit
            </Button>
            <Button
              variant="secondary"
              icon={<Icon name="film" size={15} />}
              onClick={() => navigate('/projects?new=1&client=' + client.id)}
            >
              New project
            </Button>
            <Button
              variant="primary"
              icon={<Icon name="plus" size={15} />}
              onClick={() => navigate('/invoices/new?client=' + client.id)}
            >
              New invoice
            </Button>
          </>
        }
      />

      <div className="mb-5 grid grid-cols-3 gap-4">
        <Card className="px-5 py-4">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-muted">Projects</p>
          <p className="mt-1.5 text-2xl font-semibold">{totals.projects}</p>
        </Card>
        <Card className="px-5 py-4">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-muted">Invoiced</p>
          <p className="mt-1.5 text-2xl font-semibold">{money(totals.invoiced, client.currency ?? 'INR')}</p>
        </Card>
        <Card className="px-5 py-4">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-muted">Received</p>
          <p className="mt-1.5 text-2xl font-semibold text-success">{money(totals.paid, client.currency ?? 'INR')}</p>
        </Card>
      </div>

      <div className="mb-4 flex gap-1 border-b border-line">
        {tabs.map((item) => (
          <button
            key={item.id}
            onClick={() => setTab(item.id)}
            className={`-mb-px border-b-2 px-4 py-2.5 text-sm font-medium transition-colors cursor-pointer ${
              tab === item.id
                ? 'border-gold text-gold-strong dark:text-gold'
                : 'border-transparent text-muted hover:text-ink'
            }`}
          >
            {item.label}
            {item.count > 0 && <span className="ml-1.5 text-xs text-muted">({item.count})</span>}
          </button>
        ))}
      </div>

      {tab === 'projects' &&
        (projects.length === 0 ? (
          <EmptyState
            icon="film"
            title="No projects"
            message="Create a project to track work, deadlines and files."
            action={
              <Button variant="primary" onClick={() => navigate('/projects?new=1&client=' + client.id)}>
                New project
              </Button>
            }
          />
        ) : (
          <div className="overflow-hidden rounded-xl border border-line bg-surface">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-line text-left text-[11px] uppercase tracking-wider text-muted">
                  <th className="px-5 py-3 font-semibold">Project</th>
                  <th className="px-5 py-3 font-semibold">Status</th>
                  <th className="px-5 py-3 font-semibold">Deadline</th>
                  <th className="px-5 py-3 text-right font-semibold">Quote</th>
                </tr>
              </thead>
              <tbody>
                {projects.map((project) => (
                  <tr
                    key={project.id}
                    onClick={() => navigate(`/projects/${project.id}`)}
                    className="border-b border-line/60 transition-colors last:border-0 hover:bg-surface-2 cursor-pointer"
                  >
                    <td className="px-5 py-3.5 font-medium">{project.title}</td>
                    <td className="px-5 py-3.5">
                      <StatusBadge status={project.status} />
                    </td>
                    <td className="px-5 py-3.5 text-muted">
                      {project.deadline
                        ? fmtDate(project.deadline)
                        : '—'}
                    </td>
                    <td className="px-5 py-3.5 text-right font-semibold">
                      {project.quoted_amount ? money(project.quoted_amount, project.currency) : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ))}

      {tab === 'invoices' &&
        (invoices.length === 0 ? (
          <EmptyState
            icon="file-text"
            title="No invoices"
            message="Bill this client for projects and track payments."
            action={
              <Button variant="primary" onClick={() => navigate('/invoices/new?client=' + client.id)}>
                New invoice
              </Button>
            }
          />
        ) : (
          <div className="overflow-hidden rounded-xl border border-line bg-surface">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-line text-left text-[11px] uppercase tracking-wider text-muted">
                  <th className="px-5 py-3 font-semibold">Number</th>
                  <th className="px-5 py-3 font-semibold">Issued</th>
                  <th className="px-5 py-3 font-semibold">Status</th>
                  <th className="px-5 py-3 text-right font-semibold">Total</th>
                  <th className="px-5 py-3 text-right font-semibold">Balance</th>
                </tr>
              </thead>
              <tbody>
                {invoices.map((invoice) => (
                  <tr
                    key={invoice.id}
                    onClick={() => navigate(`/invoices/${invoice.id}`)}
                    className="border-b border-line/60 transition-colors last:border-0 hover:bg-surface-2 cursor-pointer"
                  >
                    <td className="px-5 py-3.5 font-medium">{invoice.invoice_number}</td>
                    <td className="px-5 py-3.5 text-muted">{fmtDate(invoice.issue_date)}</td>
                    <td className="px-5 py-3.5">
                      <Badge tone={invoiceTone[invoice.status]}>{invoice.status}</Badge>
                    </td>
                    <td className="px-5 py-3.5 text-right font-semibold">
                      {money(invoice.total, invoice.currency)}
                    </td>
                    <td className="px-5 py-3.5 text-right text-muted">
                      {money(invoice.balance, invoice.currency)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ))}

      {tab === 'info' && (
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
          <Card>
            <CardHeader title="Contact" />
            <div className="space-y-3 px-5 py-4 text-sm">
              <Row label="Email" value={client.email} />
              <Row label="Phone" value={client.phone} />
              <Row label="Company" value={client.company} />
              <Row label="Address" value={client.address} />
              <Row label="Default currency" value={client.currency ?? 'App default'} />
              <Row
                label="Tags"
                value={
                  client.tags.length > 0 ? (
                    <span className="flex flex-wrap gap-1">
                      {client.tags.map((tag) => (
                        <span key={tag} className="rounded-full bg-surface-2 px-2 py-0.5 text-[11px] text-muted">
                          {tag}
                        </span>
                      ))}
                    </span>
                  ) : (
                    '—'
                  )
                }
              />
            </div>
          </Card>
          <Card>
            <CardHeader title="Notes" />
            <div className="px-5 py-4 text-sm whitespace-pre-wrap text-muted">
              {client.notes || 'No notes yet.'}
            </div>
          </Card>
        </div>
      )}

      <ClientForm
        open={formOpen}
        client={client}
        onClose={() => setFormOpen(false)}
        onSaved={() => reload()}
      />

      <ConfirmDialog
        open={confirmDelete}
        title="Delete client?"
        message={`"${client.name}" will be permanently deleted. Clients with projects or invoices cannot be deleted — archive them instead.`}
        confirmLabel="Delete"
        danger
        onClose={() => setConfirmDelete(false)}
        onConfirm={() => {
          void api.clients
            .remove(client.id)
            .then(() => {
              toast.success('Client deleted')
              navigate('/clients')
            })
            .catch((err: unknown) => {
              toast.error(err instanceof Error ? err.message : String(err))
            })
        }}
      />
    </div>
  )
}

function Row({ label, value }: { label: string; value: string | number | ReactNode }): ReactNode {
  return (
    <div className="flex justify-between gap-6 border-b border-line/50 pb-2.5 last:border-0">
      <span className="text-muted">{label}</span>
      <span className="text-right font-medium">{value || '—'}</span>
    </div>
  )
}
