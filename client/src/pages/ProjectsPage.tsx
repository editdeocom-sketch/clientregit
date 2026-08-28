import { useEffect, useState } from "react"
import api from "@/services/api"
import { useAuth } from "@/contexts/AuthContext"
import { GlassCard } from "@/components/layout/glass-card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { FolderKanban, Plus, Search, MoreHorizontal, Trash2, Pencil } from "lucide-react"
import { formatDate } from "@/lib/utils"
import { usePreferences } from "@/contexts/PreferencesContext"
import { toast } from "sonner"

interface ProjectData {
  id: string
  name: string
  client: string
  status: "lead" | "planning" | "editing" | "in_progress" | "review" | "revision" | "approved" | "completed" | "delivered" | "cancelled"
  progress: number
  deadline: string | null
  budget: number | null
  description: string | null
}

const statusColors: Record<string, string> = {
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

const progressColors: Record<string, string> = {
  lead: "from-slate-400 to-slate-500",
  planning: "from-indigo-500 to-violet-400",
  editing: "from-blue-500 to-cyan-400",
  in_progress: "from-cyan-500 to-blue-400",
  review: "from-yellow-500 to-amber-400",
  revision: "from-orange-500 to-amber-400",
  approved: "from-green-500 to-emerald-400",
  completed: "from-emerald-500 to-green-400",
  delivered: "from-purple-500 to-violet-400",
  cancelled: "from-red-400 to-red-500",
}

const emptyForm = {
  name: "",
  client: "",
  status: "lead" as ProjectData["status"],
  progress: 0,
  deadline: "",
  budget: "",
  description: "",
}

export default function ProjectsPage() {
  const { user } = useAuth()
  const { formatAmount, toBaseAmount, preferences } = usePreferences()
  const [projects, setProjects] = useState<ProjectData[]>([])
  const [filtered, setFiltered] = useState<ProjectData[]>([])
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [dialogOpen, setDialogOpen] = useState(false)
  const [form, setForm] = useState(emptyForm)
  const [saving, setSaving] = useState(false)
  const [progressDialogOpen, setProgressDialogOpen] = useState(false)
  const [editingProject, setEditingProject] = useState<ProjectData | null>(null)
  const [newProgress, setNewProgress] = useState(0)
  const [savingProgress, setSavingProgress] = useState(false)
  const [clients, setClients] = useState<{ id: number; name: string }[]>([])
  const [showSuggestions, setShowSuggestions] = useState(false)

  const matchingClients = form.client.trim()
    ? clients.filter((c) => c.name.toLowerCase().includes(form.client.trim().toLowerCase()) && c.name.toLowerCase() !== form.client.trim().toLowerCase())
    : []

  async function loadClients() {
    try {
      const res = await api.get<{ success: boolean; data: any[] }>("/clients")
      if (res.success && res.data) {
        setClients(res.data.map((c: any) => ({ id: c.id, name: c.name })))
      }
    } catch {
      setClients([])
    }
  }

  function openAddDialog() {
    setForm(emptyForm)
    setShowSuggestions(false)
    loadClients()
    setDialogOpen(true)
  }

  function selectClient(name: string) {
    setForm({ ...form, client: name })
    setShowSuggestions(false)
  }

  useEffect(() => {
    if (user) loadProjects()
  }, [user])

  useEffect(() => {
    let result = projects
    if (search) {
      const q = search.toLowerCase()
      result = result.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.client.toLowerCase().includes(q)
      )
    }
    if (statusFilter !== "all") {
      result = result.filter((p) => p.status === statusFilter)
    }
    setFiltered(result)
  }, [search, statusFilter, projects])

  async function loadProjects() {
    try {
      const res = await api.get<{ success: boolean; data: any[] }>("/projects")
      if (res.success && res.data) {
        setProjects(
          res.data.map((p: any) => ({
            id: p.id,
            name: p.name,
            client: p.client_name ?? "Unknown",
            status: p.status,
            progress: p.progress ?? 0,
            deadline: p.deadline,
            budget: p.budget,
            description: p.description,
          }))
        )
      }
    } catch (err) {
      console.error("Load projects exception:", err)
      setProjects([])
    }
  }

  async function handleSave() {
    setSaving(true)
    try {
      const clientsRes = await api.get<{ success: boolean; data: any[] }>("/clients")
      const matchedClient = clientsRes.data?.find(
        (c: any) => c.name?.toLowerCase() === form.client.toLowerCase()
      )

      if (!matchedClient) {
        toast.error("Client not found. Please add the client first.")
        return
      }

      await api.post("/projects", {
        name: form.name,
        client_id: matchedClient.id,
        status: form.status,
        progress: form.progress ?? 0,
        deadline: form.deadline || null,
        budget: form.budget ? toBaseAmount(Number(form.budget)) : null,
        description: form.description || null,
      })

      toast.success("Project created successfully!")
      setDialogOpen(false)
      setForm(emptyForm)
      await loadProjects()
    } catch (err: any) {
      toast.error(err?.message || "Failed to create project.")
    } finally {
      setSaving(false)
    }
  }

  const statuses = ["all", "lead", "planning", "editing", "in_progress", "review", "revision", "approved", "completed", "delivered", "cancelled"]

  async function handleStatusUpdate(projectId: string, newStatus: ProjectData["status"]) {
    try {
      const statusProgress: Record<string, number> = {
        lead: 0,
        planning: 10,
        editing: 25,
        in_progress: 50,
        review: 60,
        revision: 70,
        approved: 80,
        completed: 90,
        delivered: 100,
        cancelled: 0,
      }
      await api.put(`/projects/${projectId}`, {
        status: newStatus,
        progress: statusProgress[newStatus] ?? 0,
      })
      toast.success(`Project marked as ${newStatus}`)
      await loadProjects()
    } catch (err: any) {
      toast.error(err?.message || "Failed to update status.")
    }
  }

  async function handleDelete(projectId: string) {
    try {
      await api.delete(`/projects/${projectId}`)
      toast.success("Project deleted.")
      await loadProjects()
    } catch (err: any) {
      toast.error(err?.message || "Failed to delete project.")
    }
  }

  async function handleProgressUpdate() {
    if (!editingProject) return
    setSavingProgress(true)
    try {
      await api.put(`/projects/${editingProject.id}`, { progress: newProgress })
      toast.success("Progress updated!")
      setProgressDialogOpen(false)
      setEditingProject(null)
      await loadProjects()
    } catch (err: any) {
      toast.error(err?.message || "Failed to save progress. Please try again.")
    } finally {
      setSavingProgress(false)
    }
  }

  function openProgressDialog(project: ProjectData) {
    setEditingProject(project)
    setNewProgress(project.progress)
    setProgressDialogOpen(true)
  }

  function getStatusActions(currentStatus: ProjectData["status"]) {
    const allStatuses: { status: ProjectData["status"]; label: string }[] = [
      { status: "lead", label: "Mark as Lead" },
      { status: "planning", label: "Mark as Planning" },
      { status: "editing", label: "Mark as Editing" },
      { status: "in_progress", label: "Mark as In Progress" },
      { status: "review", label: "Mark as Review" },
      { status: "revision", label: "Mark as Revision" },
      { status: "approved", label: "Mark as Approved" },
      { status: "completed", label: "Mark as Completed" },
      { status: "delivered", label: "Mark as Delivered" },
      { status: "cancelled", label: "Mark as Cancelled" },
    ]
    return allStatuses.filter((s) => s.status !== currentStatus)
  }

  function formatStatusLabel(s: string) {
    return s.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())
  }

  return (
    <div className="p-6 space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Projects</h1>
          <p className="text-muted-foreground mt-1">Track and manage all your projects.</p>
        </div>
        <Button onClick={openAddDialog}>
          <Plus className="h-4 w-4 mr-2" />
          Add Project
        </Button>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search projects..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
        <div className="flex gap-1 p-1 rounded-lg bg-muted border border-border">
          {statuses.map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                statusFilter === s
                  ? "bg-background text-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {s === "all" ? "All" : formatStatusLabel(s)}
            </button>
          ))}
        </div>
      </div>

      <GlassCard className="overflow-hidden">
        {filtered.length === 0 ? (
          <div className="text-center py-16">
            <FolderKanban className="h-12 w-12 text-muted-foreground mx-auto mb-3 opacity-40" />
            <p className="text-muted-foreground mb-4">
              {search || statusFilter !== "all"
                ? "No projects match your filters."
                : "No projects yet. Create your first project to get started."}
            </p>
            {!search && statusFilter === "all" && (
              <Button
                onClick={openAddDialog}
                variant="ghost"
                size="sm"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Project
              </Button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-3 px-5 font-medium text-muted-foreground">Project</th>
                  <th className="text-left py-3 px-5 font-medium text-muted-foreground">Client</th>
                  <th className="text-left py-3 px-5 font-medium text-muted-foreground">Deadline</th>
                  <th className="text-right py-3 px-5 font-medium text-muted-foreground">Budget</th>
                  <th className="text-left py-3 px-5 font-medium text-muted-foreground">Progress</th>
                  <th className="text-left py-3 px-5 font-medium text-muted-foreground">Status</th>
                  <th className="text-right py-3 px-5 font-medium text-muted-foreground">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((project) => (
                  <tr
                    key={project.id}
                    className="border-b border-border last:border-0 hover:bg-muted/50 transition-colors"
                  >
                    <td className="py-4 px-5">
                      <span className="font-medium text-foreground">{project.name}</span>
                    </td>
                    <td className="py-4 px-5 text-muted-foreground">{project.client}</td>
                    <td className="py-4 px-5 text-muted-foreground">
                      {project.deadline ? formatDate(project.deadline) : "-"}
                    </td>
                    <td className="py-4 px-5 text-right font-medium text-foreground">
                      {project.budget ? formatAmount(project.budget) : "-"}
                    </td>
                    <td className="py-4 px-5">
                      <div className="w-24">
                        <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                          <div
                            className={`h-full rounded-full bg-gradient-to-r ${progressColors[project.status] ?? "from-muted-foreground/30 to-muted-foreground/50"}`}
                            style={{ width: `${project.progress}%` }}
                          />
                        </div>
                        <p className="text-[10px] text-muted-foreground mt-1">{project.progress}%</p>
                      </div>
                    </td>
                    <td className="py-4 px-5">
                      <Badge className={`${statusColors[project.status]} border-0`}>
                        {formatStatusLabel(project.status)}
                      </Badge>
                    </td>
                    <td className="py-4 px-5 text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-48">
                          <DropdownMenuItem onClick={() => openProgressDialog(project)}>
                            <Pencil className="h-4 w-4 mr-2" />
                            Update Progress
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          {getStatusActions(project.status).map((action) => (
                            <DropdownMenuItem
                              key={action.status}
                              onClick={() => handleStatusUpdate(project.id, action.status)}
                            >
                              {action.label}
                            </DropdownMenuItem>
                          ))}
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            className="text-red-600 dark:text-red-400 focus:text-red-600 dark:focus:text-red-400"
                            onClick={() => handleDelete(project.id)}
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </GlassCard>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Project</DialogTitle>
            <DialogDescription className="text-muted-foreground">
              Fill in the details to create a new project.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Project Name *</Label>
              <Input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="e.g. YouTube Episode 42"
              />
            </div>
            <div className="relative space-y-2">
              <Label>Client *</Label>
              <Input
                value={form.client}
                onChange={(e) => {
                  setForm({ ...form, client: e.target.value })
                  setShowSuggestions(true)
                }}
                onFocus={() => setShowSuggestions(true)}
                onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
                placeholder="Type to search existing clients..."
                autoComplete="off"
              />
              {showSuggestions && matchingClients.length > 0 && (
                <div className="absolute z-10 w-full mt-1 rounded-md border border-border bg-popover shadow-lg max-h-40 overflow-y-auto">
                  {matchingClients.map((c) => (
                    <button
                      key={c.id}
                      type="button"
                      className="w-full text-left px-3 py-2 text-sm hover:bg-muted transition-colors"
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={() => selectClient(c.name)}
                    >
                      <span className="text-foreground">{c.name}</span>
                    </button>
                  ))}
                  <div className="px-3 py-1.5 text-[10px] text-muted-foreground border-t border-border">
                    Matching clients — click to select
                  </div>
                </div>
              )}
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder="Brief description of the project..."
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Status</Label>
                <select
                  value={form.status}
                  onChange={(e) => setForm({ ...form, status: e.target.value as ProjectData["status"] })}
                  className="flex h-10 w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                >
                  {["lead", "planning", "editing", "in_progress", "review", "revision", "approved", "completed", "delivered", "cancelled"].map((s) => (
                    <option key={s} value={s}>{formatStatusLabel(s)}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <Label>Budget ({preferences.currency})</Label>
                <Input
                  type="number"
                  value={form.budget}
                  onChange={(e) => setForm({ ...form, budget: e.target.value })}
                  placeholder="0"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Deadline</Label>
              <Input
                type="date"
                value={form.deadline}
                onChange={(e) => setForm({ ...form, deadline: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              disabled={!form.name || !form.client || saving}
            >
              {saving ? "Creating..." : "Create Project"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={progressDialogOpen} onOpenChange={setProgressDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Update Progress</DialogTitle>
            <DialogDescription className="text-muted-foreground">
              {editingProject?.name}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label>Progress</Label>
                <span className="text-sm font-medium text-foreground">{newProgress}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                step="5"
                value={newProgress}
                onChange={(e) => setNewProgress(Number(e.target.value))}
                className="w-full h-2 bg-muted rounded-lg appearance-none cursor-pointer accent-primary"
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>0%</span>
                <span>25%</span>
                <span>50%</span>
                <span>75%</span>
                <span>100%</span>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setProgressDialogOpen(false)} disabled={savingProgress}>
              Cancel
            </Button>
            <Button onClick={handleProgressUpdate} disabled={savingProgress}>
              {savingProgress ? "Saving..." : "Save Progress"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
