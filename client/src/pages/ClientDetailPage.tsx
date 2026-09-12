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
  Users,
  Mail,
  Phone,
  Building2,
  MapPin,
  Globe,
  FileText,
  FolderKanban,
  Video,
  ExternalLink,
  Pencil,
  Clock,
} from "lucide-react"
import { api } from "@/services/api"
import { usePreferences } from "@/contexts/PreferencesContext"
import { formatDate } from "@/lib/utils"

interface ClientDetail {
  id: number | string
  name: string
  email: string
  phone?: string
  company?: string
  address?: string
  city?: string
  state?: string
  country?: string
  website?: string
  notes?: string
  status?: string
  source?: string
  created_at?: string
}

interface ProjectRow {
  id: number | string
  name: string
  client_name?: string
  status: string
  progress?: number
  deadline?: string | null
  budget?: number | null
}

interface VideoRow {
  id: number | string
  title: string
  project_id?: number | string | null
  project_name?: string
  version?: number
  status?: string
  created_at?: string
}

interface InvoiceRow {
  id: number | string
  invoice_number?: string
  project_name?: string
  description?: string
  amount?: number
  issue_date?: string
  due_date?: string
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

function DetailRow({ icon: Icon, label, value }: { icon: React.ComponentType<{ className?: string }>; label: string; value?: string }) {
  return (
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
}

export default function ClientDetailPage() {
  const { id } = useParams<{ id: string }>()
  const { formatAmount } = usePreferences()

  const [client, setClient] = useState<ClientDetail | null>(null)
  const [projects, setProjects] = useState<ProjectRow[]>([])
  const [videos, setVideos] = useState<VideoRow[]>([])
  const [invoices, setInvoices] = useState<InvoiceRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  const load = useCallback(async () => {
    if (!id) return
    setLoading(true)
    setError(false)
    try {
      const [clientRes, projectRes, videoRes, invoiceRes] = await Promise.all([
        api.get<{ success: boolean; data: ClientDetail }>(`/clients/${id}`),
        api.get<{ success: boolean; data: ProjectRow[] }>(`/projects?client=${id}`),
        api.get<{ success: boolean; data: VideoRow[] }>(`/videos`),
        api.get<{ success: boolean; data: InvoiceRow[] }>(`/invoices?client=${id}`),
      ])
      if (!clientRes.data) {
        setError(true)
        setLoading(false)
        return
      }
      const projectIds = new Set(
        (projectRes.data || []).map((p) => String(p.id))
      )
      setClient(clientRes.data)
      setProjects(projectRes.data || [])
      setVideos((videoRes.data || []).filter((v) => projectIds.has(String(v.project_id))))
      setInvoices(invoiceRes.data || [])
    } catch {
      setError(true)
    } finally {
      setLoading(false)
    }
  }, [id])

  useEffect(() => {
    load()
  }, [load])

  const totalBilled = invoices
    .filter((inv) => inv.status === "paid")
    .reduce((sum, inv) => sum + Number(inv.amount || 0), 0)
  const pendingAmount = invoices
    .filter((inv) => inv.status !== "paid")
    .reduce((sum, inv) => sum + Number(inv.amount || 0), 0)

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

  if (error || !client) {
    return (
      <div className="p-6">
        <Link
          to="/clients"
          className="mb-6 inline-flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Clients
        </Link>
        <ErrorState
          title="Couldn't load this client"
          description="The client may have been removed, or the server is temporarily unavailable."
          onRetry={load}
        />
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <Link
            to="/clients"
            className="inline-flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Clients
          </Link>
          <div className="mt-3 flex items-center gap-3">
            <h1 className="text-2xl font-bold text-foreground">{client.name}</h1>
            <Badge
              className={
                client.status === "active"
                  ? "border-0 bg-green-500/20 text-green-600 dark:text-green-400"
                  : "border-0 bg-muted text-muted-foreground"
              }
            >
              {client.status || "active"}
            </Badge>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            {client.company || ""}
            {(client.city || client.country) && ` · ${[client.city, client.country].filter(Boolean).join(", ")}`}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link to={`/clients?edit=${client.id}`}>
            <span className="inline-flex items-center gap-2 rounded-lg border border-border px-4 py-2 text-sm font-medium text-foreground shadow-sm transition-colors hover:bg-muted">
              <Pencil className="h-4 w-4" />
              Edit Client
            </span>
          </Link>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <GlassCard className="p-5">
          <p className="text-sm text-muted-foreground">Projects</p>
          <p className="mt-1 text-2xl font-bold text-foreground">{projects.length}</p>
        </GlassCard>
        <GlassCard className="p-5">
          <p className="text-sm text-muted-foreground">Total Billed</p>
          <p className="mt-1 text-2xl font-bold text-green-600 dark:text-green-400">{formatAmount(totalBilled)}</p>
        </GlassCard>
        <GlassCard className="p-5">
          <p className="text-sm text-muted-foreground">Outstanding</p>
          <p className="mt-1 text-2xl font-bold text-yellow-600 dark:text-yellow-400">{formatAmount(pendingAmount)}</p>
        </GlassCard>
      </div>

      <Tabs defaultValue="overview">
        <TabsList className="w-full sm:w-auto justify-start overflow-x-auto">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="projects">
            Projects <span className="ml-1.5 rounded-full bg-muted px-1.5 text-xs">{projects.length}</span>
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
              <DetailRow icon={Mail} label="Email" value={client.email} />
              <DetailRow icon={Phone} label="Phone" value={client.phone} />
              <DetailRow icon={Building2} label="Company" value={client.company} />
              <DetailRow
                icon={MapPin}
                label="Location"
                value={[client.address, client.city, client.state, client.country].filter(Boolean).join(", ")}
              />
              <DetailRow icon={Globe} label="Website" value={client.website} />
              <DetailRow icon={Clock} label="Client since" value={client.created_at ? formatDate(client.created_at) : undefined} />
              {client.source && <DetailRow icon={Users} label="Source" value={client.source} />}
            </div>
          </GlassCard>

          {client.notes && (
            <GlassCard className="p-5">
              <h3 className="mb-2 text-sm font-semibold text-foreground">Notes</h3>
              <p className="whitespace-pre-wrap text-sm text-muted-foreground">{client.notes}</p>
            </GlassCard>
          )}
        </TabsContent>

        {/* Projects */}
        <TabsContent value="projects">
          <GlassCard className="overflow-hidden">
            {projects.length === 0 ? (
              <EmptyState
                icon={FolderKanban}
                title="No projects yet"
                description="Projects will appear here once you create one for this client."
              />
            ) : (
              <Table>
                <TableHeader>
                  <TableRow className="border-border hover:bg-transparent">
                    <TableHead className="text-muted-foreground">Project</TableHead>
                    <TableHead className="text-muted-foreground">Status</TableHead>
                    <TableHead className="text-muted-foreground">Progress</TableHead>
                    <TableHead className="text-muted-foreground">Deadline</TableHead>
                    <TableHead className="text-muted-foreground text-right">Budget</TableHead>
                    <TableHead className="sr-only">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {projects.map((project) => (
                    <TableRow key={project.id} className="border-border hover:bg-muted">
                      <TableCell className="font-medium text-foreground">
                        <Link to={`/projects/${project.id}`} className="inline-flex items-center gap-1.5 transition-colors hover:text-primary">
                          {project.name}
                          <ExternalLink className="h-3.5 w-3.5 opacity-60" />
                        </Link>
                      </TableCell>
                      <TableCell>
                        <Badge className={projectStatusClass[project.status] || projectStatusClass.lead}>
                          {project.status.replace(/_/g, " ")}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground">{project.progress ?? 0}%</TableCell>
                      <TableCell className="text-muted-foreground">
                        {project.deadline ? formatDate(project.deadline) : "—"}
                      </TableCell>
                      <TableCell className="text-right text-muted-foreground">
                        {project.budget ? formatAmount(Number(project.budget)) : "—"}
                      </TableCell>
                      <TableCell className="text-right">
                        <Link to={`/projects/${project.id}`} aria-label={`Open ${project.name}`} className="inline-flex items-center justify-center rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground">
                          <ExternalLink className="h-4 w-4" />
                        </Link>
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
                title="No videos for this client"
                description="Videos uploaded to this client's projects will appear here."
              />
            ) : (
              <Table>
                <TableHeader>
                  <TableRow className="border-border hover:bg-transparent">
                    <TableHead className="text-muted-foreground">Title</TableHead>
                    <TableHead className="text-muted-foreground">Project</TableHead>
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
                        <TableCell className="text-muted-foreground">{video.project_name || "—"}</TableCell>
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
                title="No invoices yet"
                description="Invoices for this client will appear here."
              />
            ) : (
              <Table>
                <TableHeader>
                  <TableRow className="border-border hover:bg-transparent">
                    <TableHead className="text-muted-foreground">Invoice #</TableHead>
                    <TableHead className="text-muted-foreground">Description</TableHead>
                    <TableHead className="text-muted-foreground">Issued</TableHead>
                    <TableHead className="text-muted-foreground">Due</TableHead>
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
                      <TableCell className="text-muted-foreground">
                        {invoice.due_date ? formatDate(invoice.due_date) : "—"}
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