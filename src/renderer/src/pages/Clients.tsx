import { useState, type ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Field'
import { Icon } from '@/components/ui/Icon'
import { EmptyState, PageHeader } from '@/components/ui/Layout'
import { ClientForm } from '@/components/clients/ClientForm'
import { api, type Client } from '@/lib/api'
import { useApi, useDebounced } from '@/lib/hooks'
import { toast } from '@/store/ui'

export function Clients(): ReactNode {
  const navigate = useNavigate()
  const [query, setQuery] = useState('')
  const [showArchived, setShowArchived] = useState(false)
  const [formOpen, setFormOpen] = useState(false)
  const debounced = useDebounced(query)

  const { data: clients, loading, reload } = useApi<Client[]>(
    () => api.clients.list({ q: debounced || undefined, includeArchived: showArchived }),
    [debounced, showArchived]
  )

  const toggleArchive = async (client: Client): Promise<void> => {
    try {
      await api.clients.setArchived(client.id, !client.archived)
      toast.success(client.archived ? 'Client restored' : 'Client archived')
      reload()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : String(err))
    }
  }

  return (
    <div>
      <PageHeader
        title="Clients"
        subtitle="Everyone you work with"
        actions={
          <Button variant="primary" icon={<Icon name="plus" size={15} />} onClick={() => setFormOpen(true)}>
            New client
          </Button>
        }
      />

      <div className="mb-4 flex items-center gap-3">
        <div className="relative w-72">
          <span className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-muted">
            <Icon name="search" size={15} />
          </span>
          <Input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search name, company, email…"
            className="pl-9"
          />
        </div>
        <button
          onClick={() => setShowArchived((value) => !value)}
          className={`flex items-center gap-1.5 rounded-lg border px-3 py-2 text-sm transition-colors cursor-pointer ${
            showArchived
              ? 'border-gold bg-gold/15 text-gold-strong dark:text-gold'
              : 'border-line bg-surface text-muted hover:text-ink'
          }`}
        >
          <Icon name="archive" size={15} />
          Archived
        </button>
      </div>

      {loading && !clients ? (
        <div className="py-16 text-center text-sm text-muted">Loading clients…</div>
      ) : !clients || clients.length === 0 ? (
        <EmptyState
          icon="users"
          title={query ? 'No matching clients' : 'No clients yet'}
          message={
            query
              ? 'Try a different search term.'
              : 'Add your first client to start tracking projects and invoices.'
          }
          action={
            !query && (
              <Button variant="primary" onClick={() => setFormOpen(true)}>
                New client
              </Button>
            )
          }
        />
      ) : (
        <div className="overflow-hidden rounded-xl border border-line bg-surface">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-line text-left text-[11px] uppercase tracking-wider text-muted">
                <th className="px-5 py-3 font-semibold">Client</th>
                <th className="px-5 py-3 font-semibold">Contact</th>
                <th className="px-5 py-3 font-semibold">Tags</th>
                <th className="px-5 py-3 text-right font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody>
              {clients.map((client) => (
                <tr
                  key={client.id}
                  onClick={() => navigate(`/clients/${client.id}`)}
                  className={`border-b border-line/60 transition-colors last:border-0 hover:bg-surface-2 cursor-pointer ${
                    client.archived ? 'opacity-60' : ''
                  }`}
                >
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-3">
                      <span
                        className="h-2.5 w-2.5 shrink-0 rounded-full"
                        style={{ background: client.color }}
                      />
                      <div>
                        <div className="font-medium">
                          {client.name}
                          {client.archived && (
                            <span className="ml-2 text-[10px] uppercase text-muted">archived</span>
                          )}
                        </div>
                        {client.company && <div className="text-xs text-muted">{client.company}</div>}
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-3.5 text-muted">
                    <div>{client.email || '—'}</div>
                    <div className="text-xs">{client.phone}</div>
                  </td>
                  <td className="px-5 py-3.5">
                    <div className="flex flex-wrap gap-1">
                      {client.tags.map((tag) => (
                        <span
                          key={tag}
                          className="rounded-full bg-surface-2 px-2 py-0.5 text-[11px] text-muted"
                        >
                          {tag}
                        </span>
                      ))}
                      {client.tags.length === 0 && <span className="text-muted">—</span>}
                    </div>
                  </td>
                  <td className="px-5 py-3.5">
                    <div className="flex justify-end gap-1">
                      <Button
                        size="sm"
                        variant="ghost"
                        icon={<Icon name="external" size={14} />}
                        onClick={(event) => {
                          event.stopPropagation()
                          navigate(`/clients/${client.id}`)
                        }}
                      >
                        Open
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        icon={<Icon name="archive" size={14} />}
                        onClick={(event) => {
                          event.stopPropagation()
                          void toggleArchive(client)
                        }}
                      >
                        {client.archived ? 'Restore' : 'Archive'}
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <ClientForm
        open={formOpen}
        onClose={() => setFormOpen(false)}
        onSaved={() => reload()}
      />
    </div>
  )
}
