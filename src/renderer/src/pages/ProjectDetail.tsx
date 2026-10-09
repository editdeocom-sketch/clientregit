import { useState, type ReactNode } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { Card, CardHeader, EmptyState, PageHeader } from '@/components/ui/Layout'
import { Icon, type IconName } from '@/components/ui/Icon'
import { ProjectForm } from '@/components/projects/ProjectForm'
import { StatusMenu } from '@/components/projects/StatusBadge'
import { TasksTab } from '@/components/projects/TasksTab'
import {
  api,
  FILE_KIND_LABEL,
  fmtDate,
  isOverdue,
  money,
  type FileKind,
  type Project,
  type ProjectFile,
  type ProjectStatus
} from '@/lib/api'
import { useApi } from '@/lib/hooks'
import { toast } from '@/store/ui'

interface DetailData {
  project: Project
  files: ProjectFile[]
}

const kindIcon: Record<FileKind, IconName> = {
  folder: 'folder',
  premiere: 'film',
  after_effects: 'film',
  resolve: 'film',
  final_cut: 'film',
  other: 'file-text'
}

type DetailTab = 'details' | 'files' | 'tasks'

export function ProjectDetail(): ReactNode {
  const { id = '' } = useParams()
  const navigate = useNavigate()
  const [formOpen, setFormOpen] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [tab, setTab] = useState<DetailTab>('details')

  const { data, loading, reload } = useApi<DetailData>(async () => {
    const project = await api.projects.get(id)
    if (!project) throw new Error('Project not found')
    const files = await api.projects.files(id)
    return { project, files }
  }, [id])

  const run = async (fn: () => Promise<unknown>, success?: string): Promise<void> => {
    try {
      await fn()
      if (success) toast.success(success)
      reload()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : String(err))
    }
  }

  const addPaths = async (properties: Array<'openFile' | 'openDirectory'>): Promise<void> => {
    try {
      const paths = await api.files.pick(properties)
      for (const path of paths) {
        await api.projects.addFile(id, { path })
      }
      if (paths.length > 0) toast.success(`${paths.length} link${paths.length > 1 ? 's' : ''} added`)
      reload()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : String(err))
    }
  }

  const openFile = async (file: ProjectFile): Promise<void> => {
    try {
      const result = await api.files.openPath(file.path)
      if (!result.ok) toast.error(result.error || 'Could not open this path')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : String(err))
    }
  }

  if (loading && !data) {
    return <div className="py-20 text-center text-sm text-muted">Loading project…</div>
  }
  if (!data) return null

  const { project, files } = data

  const changeStatus = async (next: ProjectStatus): Promise<void> => {
    await run(
      () =>
        api.projects.update(project.id, {
          client_id: project.client_id,
          title: project.title,
          description: project.description,
          status: next,
          priority: project.priority,
          deadline: project.deadline,
          quoted_amount: project.quoted_amount,
          currency: project.currency
        }),
      'Status updated'
    )
  }

  const tabs: Array<{ id: DetailTab; label: string; count?: number }> = [
    { id: 'details', label: 'Details' },
    { id: 'files', label: 'Files', count: files.length },
    { id: 'tasks', label: 'Tasks' }
  ]

  return (
    <div>
      <Link to="/projects" className="mb-4 inline-flex items-center gap-1.5 text-sm text-muted hover:text-ink">
        <Icon name="arrow-left" size={15} />
        Projects
      </Link>

      <PageHeader
        title={project.title}
        subtitle={
          <span>
            for{' '}
            <Link to={`/clients/${project.client_id}`} className="text-gold-strong hover:underline dark:text-gold">
              {project.client_name}
            </Link>
          </span>
        }
        actions={
          <>
            <Button variant="secondary" icon={<Icon name="trash" size={15} />} onClick={() => setConfirmDelete(true)}>
              Delete
            </Button>
            <Button variant="primary" icon={<Icon name="pencil" size={15} />} onClick={() => setFormOpen(true)}>
              Edit
            </Button>
          </>
        }
      />

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <div className="mb-4 flex items-center justify-between gap-2 border-b border-line">
            <div className="flex gap-1">
              {tabs.map((item) => (
                <button
                  key={item.id}
                  onClick={() => setTab(item.id)}
                  className={`-mb-px cursor-pointer border-b-2 px-4 py-2.5 text-sm font-medium transition-colors ${
                    tab === item.id
                      ? 'border-gold text-gold-strong dark:text-gold'
                      : 'border-transparent text-muted hover:text-ink'
                  }`}
                >
                  {item.label}
                  {item.count !== undefined && (
                    <span className="ml-1.5 text-xs text-muted">({item.count})</span>
                  )}
                </button>
              ))}
            </div>
            <div className="pb-2">
              <StatusMenu project={project} onChange={(next) => void changeStatus(next)} />
            </div>
          </div>

          {tab === 'details' && (
            <Card>
              <CardHeader title="Description" />
              <div className="px-5 py-4 text-sm whitespace-pre-wrap text-muted">
                {project.description || 'No description.'}
              </div>
            </Card>
          )}

          {tab === 'files' && (
            <Card>
              <CardHeader
                title="Linked files & folders"
                subtitle="Project files live on your disk — open them right from here"
                action={
                  <div className="flex gap-2">
                    <Button size="sm" icon={<Icon name="folder" size={14} />} onClick={() => addPaths(['openDirectory'])}>
                      Add folder
                    </Button>
                    <Button size="sm" icon={<Icon name="plus" size={14} />} onClick={() => addPaths(['openFile'])}>
                      Add file
                    </Button>
                  </div>
                }
              />
              <div className="divide-y divide-line/60">
                {files.length === 0 ? (
                  <div className="px-5 py-8 text-center text-sm text-muted">
                    No linked files yet. Add your Premiere project, footage folder or exports.
                  </div>
                ) : (
                  files.map((file) => (
                    <div key={file.id} className="flex items-center gap-3 px-5 py-3">
                      <div className="rounded-lg bg-surface-2 p-2 text-gold">
                        <Icon name={kindIcon[file.kind]} size={16} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="truncate text-sm font-medium">{file.label}</span>
                          <Badge tone="neutral">{FILE_KIND_LABEL[file.kind]}</Badge>
                        </div>
                        <div className="truncate text-xs text-muted">{file.path}</div>
                      </div>
                      <div className="flex shrink-0 gap-1">
                        <Button
                          size="sm"
                          variant="ghost"
                          icon={<Icon name="external" size={14} />}
                          onClick={() => openFile(file)}
                        >
                          Open
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          icon={<Icon name="eye" size={14} />}
                          onClick={() =>
                            run(() => api.files.reveal(file.path), 'Shown in Explorer')
                          }
                        >
                          Reveal
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          icon={<Icon name="trash" size={14} />}
                          onClick={() =>
                            run(() => api.projects.removeFile(file.id), 'Link removed')
                          }
                        />
                      </div>
                    </div>
                  ))
                )}
              </div>
            </Card>
          )}

          {tab === 'tasks' && <TasksTab projectId={project.id} />}
        </div>

        <div className="space-y-5">
          <Card>
            <CardHeader title="Details" />
            <div className="space-y-3 px-5 py-4 text-sm">
              <InfoRow label="Deadline">
                {project.deadline ? (
                  <span
                    className={
                      isOverdue(project.deadline) && !['delivered', 'cancelled'].includes(project.status)
                        ? 'font-semibold text-danger'
                        : ''
                    }
                  >
                    {fmtDate(project.deadline)}
                  </span>
                ) : (
                  '—'
                )}
              </InfoRow>
              <InfoRow label="Priority" value={project.priority} />
              <InfoRow label="Quote">
                {project.quoted_amount ? money(project.quoted_amount, project.currency) : '—'}
              </InfoRow>
              <InfoRow label="Created" value={fmtDate(project.created_at)} />
              <InfoRow label="Delivered" value={project.delivered_at ? fmtDate(project.delivered_at) : '—'} />
            </div>
          </Card>

          <Card>
            <CardHeader title="Client" />
            <div className="px-5 py-4">
              <Link
                to={`/clients/${project.client_id}`}
                className="block rounded-lg border border-line px-4 py-3 transition-colors hover:border-gold"
              >
                <div className="text-sm font-semibold">{project.client_name}</div>
                <div className="mt-1 text-xs text-muted">View client profile →</div>
              </Link>
            </div>
          </Card>

          <Button
            variant="primary"
            className="w-full"
            icon={<Icon name="plus" size={15} />}
            onClick={() => navigate(`/invoices/new?client=${project.client_id}&project=${project.id}`)}
          >
            Invoice this project
          </Button>
        </div>
      </div>

      <ProjectForm
        open={formOpen}
        project={project}
        onClose={() => setFormOpen(false)}
        onSaved={() => reload()}
      />

      <ConfirmDialog
        open={confirmDelete}
        title="Delete project?"
        message={`"${project.title}" and its linked files list will be permanently deleted. This cannot be undone.`}
        confirmLabel="Delete"
        danger
        onClose={() => setConfirmDelete(false)}
        onConfirm={() => {
          void api.projects
            .remove(project.id)
            .then(() => {
              toast.success('Project deleted')
              navigate('/projects')
            })
            .catch((err: unknown) => toast.error(err instanceof Error ? err.message : String(err)))
        }}
      />
    </div>
  )
}

function InfoRow({ label, value, children }: { label: string; value?: string; children?: ReactNode }): ReactNode {
  return (
    <div className="flex justify-between gap-4 border-b border-line/50 pb-2.5 last:border-0">
      <span className="text-muted">{label}</span>
      <span className="text-right font-medium">{children ?? value ?? '—'}</span>
    </div>
  )
}
