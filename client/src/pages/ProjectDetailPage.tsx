import { useEffect, useState, useCallback } from "react"
import { Link, useParams } from "react-router-dom"
import { GlassCard } from "@/components/layout/glass-card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Skeleton } from "@/components/ui/skeleton"
import { EmptyState, ErrorState } from "@/components/ui/feedback"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  ArrowLeft,
  FolderKanban,
  FileText,
  Video,
  CheckSquare,
  Building2,
  Clock,
  Calendar,
  ArrowUpRight,
  ExternalLink,
} from "lucide-react"
import { api } from "@/services/api"
import { usePreferences } from "@/contexts/PreferencesContext"
import { formatDate } from "@/lib/utils"

interface ProjectDetail {
  id: number | string
  name: string
  client_id?: number | string | null
  client_name?: string
  client_email?: string
  client_company?: string
  client_phone?: string
  description?: string
  service?: string
  status?: string
  priority?: string
  progress?: number
  start_date?: string | null
  deadline?: string | null
  budget?: number | null
  amount_paid?: number | null
  remaining_amount?: number | null
  notes?: string | null
  created_at?: string
}

interface TaskRow {
  id: number | string
  title: string
  status?: string
  priority?: string
  due_date?: string | null
}

interface VideoRow {
  id: number | string
  title: string
  version?: number
  status?: string
  created_at?: string
}

interface InvoiceRow {
  id: number | string
  invoice_number?: string
  description?: string
  amount?: number
  issue_date?: string
  status?: string
}

const projectStatusClass: Record<string, string> = {
  lead: "bg-slate-500/20 text-slate-600 dark:text-slate-400",
  planning: "bg-indigo-500/20 text-indigo-600 dark:text-indigo-400",
  editing: "bg-blue-500/20 text-blue-600 dark:text-blue-400",
  in_progress: "bg-cyan-500/20 text-cyan-600 dark:text-cyan-400",
  review: "bg-yellow-500/20 text-yellow-600 dark:text-yellow-400",
  revision: "bg-orange-500/20 text-orange-600 dark:text-orange-400",
  approved: "bg-green-500/20 text-green-600 dark:text-green-400",
  completed: "bg-emerald-500/20 text-emerald-600 dark:text-emerald-400",
  delivered: "bg-purple-500/20 text-purple-600 dark:text-purple-400",
  cancelled: "bg-red-500/20 text-red-600 dark:text-red-400",
}

const taskStatusClass: Record<string, string> = {
  todo: "bg-muted text-muted-foreground",
  in_progress: "bg-blue-500/20 text-blue-600 dark:text-blue-400",
  review: "bg-yellow-500/20 text-yellow-600 dark:text-yellow-400",
  done: "bg-green-500/20 text-green-600 dark:text-green-400",
}

const videoStatusClass: Record<string, { label: string; className: string }> = {
  draft: { label: "Draft", className: "bg-muted text-muted-foreground border-0" },
  awaiting_review: { label: "Awaiting Review", className: "bg-yellow-500/20 text-yellow-600 dark:text-yellow-400 border-0" },
  revision_requested: { label: "Changes Requested", className: "bg-orange-500/20 text-orange-600 dark:text-orange-400 border-0" },
  approved: { label: "Approved", className: "bg-green-500/20 text-green-600 dark:text-green-400 border-0" },
}

const invoiceStatusClass: Record<string, string> = {
  paid: "bg-green-500/20 text-green-600 dark:text-green-400 border-0",
  sent: "bg-blue-500/20 text-blue-600 dark:text-blue-400 border-0",
  draft: "bg-muted text-muted-foreground border-0",
  overdue: "bg-red-500/20 text-red-600 dark:text-red-400 border-0",
}

function OverviewRow({ icon: Icon, label, value, href }: { icon: React.ComponentType<{ className?: string }>; label: string; value?: string; href?: string }) {
  const content = (
    <div className="flex items-center gap-3">
      <span className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-muted">
        <Icon className="h-4 w-4 text-muted-foreground" />
      </span>
      <div className="min-w-0">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="truncate text-sm font-medium text-foreground">{value || "—"}</p>
      </div>
    </div>
  )
  if (href) {
    return (
      <Link to={href} className="group transition-opacity" aria-label={label}>
        {content}
        <span className="sr-only">{value || "—"}</span>
      </Link>
    )
  }
  return content
}

export default function ProjectDetailPage() {
  const { id } = useParams<{ id: string }>()
  const { formatAmount } = usePreferences()

  const [project, setProject] = useState<ProjectDetail | null>(null)
  const [tasks, setTasks] = useState<TaskRow[]>([])
  const [videos, setVideos] = useState<VideoRow[]>([])
  const [invoices, setInvoices] = useState<InvoiceRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  const load = useCallback(async () => {
    if (!id) return
    setLoading(true)
    setError(false)
    try {
      const [projectRes, taskRes, videoRes, invoiceRes] = await Promise.all([
        api.get<{ success: boolean; data: ProjectDetail }>(`/projects/${id}`),
        api.get<{ success: boolean; data: TaskRow[] }>(`/tasks?project=${id}`),
        api.get<{ success: boolean; data: VideoRow[] }>(`/videos?project=${id}`),
        api.get<{ success: boolean; data: InvoiceRow[] }>(`/invoices`),
      ])
      if (!projectRes.data) {
        setError(true)
        setLoading(false)
        return
      }
      setProject(projectRes.data)
      setTasks(taskRes.data || [])
      setVideos(videoRes.data || [])
      setInvoices((invoiceRes.data || []).filter((inv) => String((inv as InvoiceRow & { project_id?: string }).project_id) === String(id)))
    } catch {
      setError(true)
    } finally {
      setLoading(false)
    }
  }, [id])

  useEffect(() => {
    load()
  }, [load])

  if (loading) {
    return (
      <div className="p-6 space-y-6 animate-fade-in">
        <div className="flex items-center gap-4">
          <Skeleton className="h-9 w-24" />
          <Skeleton className="h-8 w-48" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-24" />
          ))}
        </div>
        <Skeleton className="h-64" />
      </div>
    )
  }

  if (error || !project) {
    return (
      <div className="p-6">
        <Link
          to="/projects"
          className="mb-6 inline-flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Projects
        </Link>
        <ErrorState
          title="Couldn't load this project"
          description="The project may have been removed, or the server is temporarily unavailable."
          onRetry={load}
        />
      </div>
    )
  }

  const progress = project.progress ?? 0

  return (
    <div className="p-6 space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <Link
            to="/projects"
            className="inline-flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Projects
          </Link>
          <div className="mt-3 flex items-center gap-3">
            <h1 className="text-2xl font-bold text-foreground">{project.name}</h1>
            <Badge className={projectStatusClass[project.status || ""] || projectStatusClass.lead}>
              {project.status?.replace(/_/g, " ") || "lead"}
            </Badge>
          </div>
          {project.client_name && (
            <Link to={`/clients/${project.client_id}`} className="mt-1 inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-primary">
              <Building2 className="h-3.5 w-3.5" />
              {project.client_name}
              <ArrowUpRight className="h-3 w-3" />
            </Link>
          )}
        </div>
        <div className="w-full max-w-sm sm:w-72">
          <div className="flex items-center justify-between text-sm mb-1.5">
            <span className="text-muted-foreground">Progress</span>
            <span className="font-medium text-foreground">{progress}%</span>
          </div>
          <div className="h-2 w-full rounded-full bg-muted">
            <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${progress}%` }} />
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <GlassCard className="p-5">
          <p className="text-sm text-muted-foreground">Budget</p>
          <p className="mt-1 text-xl font-bold text-foreground">{project.budget ? formatAmount(Number(project.budget)) : "—"}</p>
        </GlassCard>
        <GlassCard className="p-5">
          <p className="text-sm text-muted-foreground">Amount Paid</p>
          <p className="mt-1 text-xl font-bold text-green-600 dark:text-green-400">
            {project.amount_paid ? formatAmount(Number(project.amount_paid)) : "—"}
          </p>
        </GlassCard>
        <GlassCard className="p-5">
          <p className="text-sm text-muted-foreground">Remaining</p>
          <p className="mt-1 text-xl font-bold text-yellow-600 dark:text-yellow-400">
            {project.remaining_amount ? formatAmount(Number(project.remaining_amount)) : "—"}
          </p>
        </GlassCard>
        <GlassCard className="p-5">
          <p className="text-sm text-muted-foreground">Videos / Tasks</p>
          <p className="mt-1 text-xl font-bold text-foreground">{videos.length} / {tasks.length}</p>
        </GlassCard>
      </div>

      <Tabs defaultValue="overview">
        <TabsList className="w-full sm:w-auto justify-start overflow-x-auto">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="tasks">
            Tasks <span className="ml-1.5 rounded-full bg-muted px-1.5 text-xs">{tasks.length}</span>
          </TabsTrigger>
          <TabsTrigger value="videos">
            Videos <span className="ml-1.5 rounded-full bg-muted px-1.5 text-xs">{videos.length}</span>
          </TabsTrigger>
          <TabsTrigger value="invoices">
            Invoices <span className="ml-1.5 rounded-full bg-muted px-1.5 text-xs">{invoices.length}</span>
          </TabsTrigger>
        </TabsList>

        {/* Overview */}
        <TabsContent value="overview" className="space-y-4">
          <GlassCard className="p-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <OverviewRow icon={Building2} label="Client" value={project.client_name} href={project.client_id ? `/clients/${project.client_id}` : undefined} />
              <OverviewRow icon={FolderKanban} label="Service" value={project.service} />
              <OverviewRow icon={Calendar} label="Deadline" value={project.deadline ? formatDate(project.deadline) : undefined} />
              <OverviewRow icon={Clock} label="Start date" value={project.start_date ? formatDate(project.start_date) : undefined} />
              <OverviewRow icon={CheckSquare} label="Priority" value={project.priority} />
              <OverviewRow icon={Clock} label="Created" value={project.created_at ? formatDate(project.created_at) : undefined} />
            </div>
          </GlassCard>

          {project.description && (
            <GlassCard className="p-5">
              <h3 className="mb-2 text-sm font-semibold text-foreground">Description</h3>
              <p className="whitespace-pre-wrap text-sm text-muted-foreground">{project.description}</p>
            </GlassCard>
          )}
          {project.notes && (
            <GlassCard className="p-5">
              <h3 className="mb-2 text-sm font-semibold text-foreground">Notes</h3>
              <p className="whitespace-pre-wrap text-sm text-muted-foreground">{project.notes}</p>
            </GlassCard>
          )}
        </TabsContent>

        {/* Tasks */}
        <TabsContent value="tasks">
          <GlassCard className="overflow-hidden">
            {tasks.length === 0 ? (
              <EmptyState
                icon={CheckSquare}
                title="No tasks yet"
                description="Tasks linked to this project will appear here."
              />
            ) : (
              <Table>
                <TableHeader>
                  <TableRow className="border-border hover:bg-transparent">
                    <TableHead className="text-muted-foreground">Task</TableHead>
                    <TableHead className="text-muted-foreground">Status</TableHead>
                    <TableHead className="text-muted-foreground">Priority</TableHead>
                    <TableHead className="text-muted-foreground">Due</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {tasks.map((task) => (
                    <TableRow key={task.id} className="border-border hover:bg-muted">
                      <TableCell className="font-medium text-foreground">{task.title}</TableCell>
                      <TableCell>
                        <Badge className={taskStatusClass[task.status || "todo"] || taskStatusClass.todo}>
                          {task.status?.replace(/_/g, " ") || "todo"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground">{task.priority || "—"}</TableCell>
                      <TableCell className="text-muted-foreground">
                        {task.due_date ? formatDate(task.due_date) : "—"}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </GlassCard>
        </TabsContent>

        {/* Videos */}
        <TabsContent value="videos">
          <GlassCard className="overflow-hidden">
            {videos.length === 0 ? (
              <EmptyState
                icon={Video}
                title="No videos yet"
                description="Upload a video to this project to start the review workflow."
              />
            ) : (
              <Table>
                <TableHeader>
                  <TableRow className="border-border hover:bg-transparent">
                    <TableHead className="text-muted-foreground">Title</TableHead>
                    <TableHead className="text-muted-foreground">Version</TableHead>
                    <TableHead className="text-muted-foreground">Status</TableHead>
                    <TableHead className="text-muted-foreground">Uploaded</TableHead>
                    <TableHead className="sr-only">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {videos.map((video) => {
                    const statusMeta = videoStatusClass[video.status || "draft"] || videoStatusClass.draft
                    return (
                      <TableRow key={video.id} className="border-border hover:bg-muted">
                        <TableCell className="font-medium text-foreground">
                          <Link to={`/videos/${video.id}`} className="inline-flex items-center gap-1.5 transition-colors hover:text-primary">
                            {video.title}
                            <ExternalLink className="h-3.5 w-3.5 opacity-60" />
                          </Link>
                        </TableCell>
                        <TableCell className="text-muted-foreground">v{video.version ?? 1}</TableCell>
                        <TableCell>
                          <Badge className={statusMeta.className}>{statusMeta.label}</Badge>
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {video.created_at ? formatDate(video.created_at) : "—"}
                        </TableCell>
                        <TableCell className="text-right">
                          <Link to={`/videos/${video.id}`} aria-label={`Review ${video.title}`} className="inline-flex items-center justify-center rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground">
                            <ExternalLink className="h-4 w-4" />
                          </Link>
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            )}
          </GlassCard>
        </TabsContent>

        {/* Invoices */}
        <TabsContent value="invoices">
          <GlassCard className="overflow-hidden">
            {invoices.length === 0 ? (
              <EmptyState
                icon={FileText}
                title="No invoices for this project"
                description="Invoices linked to this project will appear here."
              />
            ) : (
              <Table>
                <TableHeader>
                  <TableRow className="border-border hover:bg-transparent">
                    <TableHead className="text-muted-foreground">Invoice #</TableHead>
                    <TableHead className="text-muted-foreground">Description</TableHead>
                    <TableHead className="text-muted-foreground">Issued</TableHead>
                    <TableHead className="text-muted-foreground">Status</TableHead>
                    <TableHead className="text-muted-foreground text-right">Amount</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {invoices.map((invoice) => (
                    <TableRow key={invoice.id} className="border-border hover:bg-muted">
                      <TableCell className="font-medium text-foreground">
                        <Link to={`/invoices?invoice=${invoice.id}`} className="transition-colors hover:text-primary">
                          {invoice.invoice_number || `#${invoice.id}`}
                        </Link>
                      </TableCell>
                      <TableCell className="text-muted-foreground">{invoice.description || "—"}</TableCell>
                      <TableCell className="text-muted-foreground">
                        {invoice.issue_date ? formatDate(invoice.issue_date) : "—"}
                      </TableCell>
                      <TableCell>
                        <Badge className={invoiceStatusClass[invoice.status || ""] || invoiceStatusClass.draft}>
                          {invoice.status || "draft"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right font-medium text-foreground">
                        {formatAmount(Number(invoice.amount || 0))}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </GlassCard>
        </TabsContent>
      </Tabs>
    </div>
  )
}