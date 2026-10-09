import { useEffect, useState, type ReactNode } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Field'
import { Icon } from '@/components/ui/Icon'
import { EmptyState, PageHeader } from '@/components/ui/Layout'
import { ProjectForm } from '@/components/projects/ProjectForm'
import { StatusMenu } from '@/components/projects/StatusBadge'
import {
  api,
  fmtDate,
  isOverdue,
  money,
  PROJECT_STATUSES,
  PROJECT_STATUS_LABEL,
  type Project,
  type ProjectStatus
} from '@/lib/api'
import { useApi, useDebounced } from '@/lib/hooks'
import { toast } from '@/store/ui'

const priorityBadge: Record<Project['priority'], 'neutral' | 'gold' | 'danger'> = {
  low: 'neutral',
  normal: 'neutral',
  high: 'danger'
}

export function Projects(): ReactNode {
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const [query, setQuery] = useState('')
  const [status, setStatus] = useState<ProjectStatus | 'all'>('all')
  const [includeDone, setIncludeDone] = useState(false)
  const [formOpen, setFormOpen] = useState(false)
  const [defaultClientId, setDefaultClientId] = useState<string | undefined>()
  const debounced = useDebounced(query)

  useEffect(() => {
    if (searchParams.get('new') === '1') {
      setDefaultClientId(searchParams.get('client') ?? undefined)
      setFormOpen(true)
      setSearchParams({}, { replace: true })
    }
  }, [searchParams, setSearchParams])

  const { data: projects, loading, reload } = useApi<Project[]>(
    () =>
      api.projects.list({
        q: debounced || undefined,
        status: status === 'all' ? undefined : status,
        includeDone
      }),
    [debounced, status, includeDone]
  )

  const changeStatus = async (project: Project, next: ProjectStatus): Promise<void> => {
    try {
      await api.projects.update(project.id, {
        client_id: project.client_id,
        title: project.title,
        description: project.description,
        status: next,
        priority: project.priority,
        deadline: project.deadline,
        quoted_amount: project.quoted_amount,
        currency: project.currency
      })
      reload()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : String(err))
    }
  }

  return (
    <div>
      <PageHeader
        title="Projects"
        subtitle="Video jobs in motion"
        actions={
          <Button variant="primary" icon={<Icon name="plus" size={15} />} onClick={() => setFormOpen(true)}>
            New project
          </Button>
        }
      />

      <div className="mb-4 flex flex-wrap items-center gap-3">
        <div className="relative w-72">
          <span className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-muted">
            <Icon name="search" size={15} />
          </span>
          <Input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search projects…"
            className="pl-9"
          />
        </div>
        <button
          onClick={() => setIncludeDone((value) => !value)}
          className={`flex items-center gap-1.5 rounded-lg border px-3 py-2 text-sm transition-colors cursor-pointer ${
            includeDone
              ? 'border-gold bg-gold/15 text-gold-strong dark:text-gold'
              : 'border-line bg-surface text-muted hover:text-ink'
          }`}
        >
          <Icon name="check" size={15} />
          Show delivered
        </button>
      </div>

      <div className="mb-4 flex flex-wrap gap-1.5">
        {(['all', ...PROJECT_STATUSES] as Array<ProjectStatus | 'all'>).map((item) => (
          <button
            key={item}
            onClick={() => setStatus(item)}
            className={`rounded-full border px-3 py-1.5 text-xs font-medium transition-colors cursor-pointer ${
              status === item
                ? 'border-gold bg-gold text-white'
                : 'border-line bg-surface text-muted hover:border-gold hover:text-ink'
            }`}
          >
            {item === 'all' ? 'All' : PROJECT_STATUS_LABEL[item]}
          </button>
        ))}
      </div>

      {loading && !projects ? (
        <div className="py-16 text-center text-sm text-muted">Loading projects…</div>
      ) : !projects || projects.length === 0 ? (
        <EmptyState
          icon="film"
          title="No projects"
          message="Create a project to track deadlines, quotes and linked files."
          action={
            <Button variant="primary" onClick={() => setFormOpen(true)}>
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
                <th className="px-5 py-3 font-semibold">Client</th>
                <th className="px-5 py-3 font-semibold">Deadline</th>
                <th className="px-5 py-3 text-right font-semibold">Quote</th>
                <th className="px-5 py-3 text-right font-semibold">Status</th>
              </tr>
            </thead>
            <tbody>
              {projects.map((project) => (
                <tr
                  key={project.id}
                  onClick={() => navigate(`/projects/${project.id}`)}
                  className="border-b border-line/60 transition-colors last:border-0 hover:bg-surface-2 cursor-pointer"
                >
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{project.title}</span>
                      {project.priority !== 'normal' && (
                        <Badge tone={priorityBadge[project.priority]}>
                          {project.priority === 'high' ? 'high' : 'low'}
                        </Badge>
                      )}
                    </div>
                  </td>
                  <td className="px-5 py-3.5 text-muted">{project.client_name}</td>
                  <td className="px-5 py-3.5">
                    {project.deadline ? (
                      <span
                        className={
                          isOverdue(project.deadline) &&
                          !['delivered', 'cancelled'].includes(project.status)
                            ? 'font-semibold text-danger'
                            : 'text-muted'
                        }
                      >
                        {fmtDate(project.deadline)}
                      </span>
                    ) : (
                      <span className="text-muted">—</span>
                    )}
                  </td>
                  <td className="px-5 py-3.5 text-right font-semibold">
                    {project.quoted_amount ? money(project.quoted_amount, project.currency) : '—'}
                  </td>
                  <td
                    className="px-5 py-3.5 text-right"
                    onClick={(event) => event.stopPropagation()}
                  >
                    <StatusMenu
                      project={project}
                      onChange={(next) => void changeStatus(project, next)}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <ProjectForm
        open={formOpen}
        defaultClientId={defaultClientId}
        onClose={() => {
          setFormOpen(false)
          setDefaultClientId(undefined)
        }}
        onSaved={() => reload()}
      />
    </div>
  )
}
