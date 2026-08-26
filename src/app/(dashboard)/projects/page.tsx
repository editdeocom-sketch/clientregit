"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { GlassCard } from "@/components/layout/glass-card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog"
import { FolderKanban, Plus, Search } from "lucide-react"
import { formatINR, formatDate } from "@/lib/utils"
import { toast } from "sonner"

interface ProjectData {
  id: string
  name: string
  client: string
  status: "brief" | "editing" | "review" | "revision" | "approved" | "delivered"
  progress: number
  deadline: string | null
  budget: number | null
  description: string | null
}

const statusColors: Record<string, string> = {
  brief: "bg-muted text-muted-foreground",
  editing: "bg-blue-500/20 text-blue-400",
  review: "bg-yellow-500/20 text-yellow-400",
  revision: "bg-orange-500/20 text-orange-400",
  approved: "bg-green-500/20 text-green-400",
  delivered: "bg-purple-500/20 text-purple-400",
}

const progressColors: Record<string, string> = {
  brief: "from-slate-400 to-slate-500",
  editing: "from-blue-500 to-cyan-400",
  review: "from-yellow-500 to-amber-400",
  revision: "from-orange-500 to-amber-400",
  approved: "from-green-500 to-emerald-400",
  delivered: "from-purple-500 to-violet-400",
}

const emptyForm = {
  name: "",
  client: "",
  status: "brief" as ProjectData["status"],
  progress: 0,
  deadline: "",
  budget: "",
  description: "",
}

export default function ProjectsPage() {
  const [projects, setProjects] = useState<ProjectData[]>([])
  const [filtered, setFiltered] = useState<ProjectData[]>([])
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [dialogOpen, setDialogOpen] = useState(false)
  const [form, setForm] = useState(emptyForm)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    loadProjects()
  }, [])

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
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data } = await supabase
        .from("projects")
        .select("*, clients(name)")
        .eq("editor_id", user.id)
        .order("created_at", { ascending: false })

      if (data) {
        setProjects(
          data.map((p: any) => ({
            id: p.id,
            name: p.name,
            client: p.clients?.name ?? "Unknown",
            status: p.status,
            progress: p.progress ?? 0,
            deadline: p.deadline,
            budget: p.budget,
            description: p.description,
          }))
        )
      }
    } catch {
      setProjects([])
    }
  }

  async function handleSave() {
    setSaving(true)
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        toast.error("You must be logged in.")
        return
      }

      const { data: clientData } = await supabase
        .from("clients")
        .select("id")
        .eq("editor_id", user.id)
        .ilike("name", form.client)
        .single()

      if (!clientData) {
        toast.error("Client not found. Please add the client first.")
        return
      }

      const { error } = await supabase.from("projects").insert({
        name: form.name,
        client_id: clientData.id,
        editor_id: user.id,
        status: form.status,
        progress: form.progress,
        deadline: form.deadline || null,
        budget: form.budget ? Number(form.budget) : null,
        description: form.description || null,
      })
      if (error) throw error

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

  const statuses = ["all", "brief", "editing", "review", "revision", "approved", "delivered"]

  return (
    <div className="p-6 space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Projects</h1>
          <p className="text-muted-foreground mt-1">Track and manage all your projects.</p>
        </div>
        <Button onClick={() => { setForm(emptyForm); setDialogOpen(true) }}>
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
              {s === "all" ? "All" : s.charAt(0).toUpperCase() + s.slice(1)}
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
                onClick={() => { setForm(emptyForm); setDialogOpen(true) }}
                variant="ghost"
                size="sm"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Project
              </Button>
            )}
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="border-border hover:bg-transparent">
                <TableHead className="text-muted-foreground">Project</TableHead>
                <TableHead className="text-muted-foreground">Client</TableHead>
                <TableHead className="text-muted-foreground">Status</TableHead>
                <TableHead className="text-muted-foreground">Progress</TableHead>
                <TableHead className="text-muted-foreground">Deadline</TableHead>
                <TableHead className="text-muted-foreground text-right">Budget</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((project) => (
                <TableRow key={project.id} className="border-border hover:bg-muted/50">
                  <TableCell>
                    <div>
                      <p className="font-medium text-foreground">{project.name}</p>
                      {project.description && (
                        <p className="text-xs text-muted-foreground mt-0.5 truncate max-w-xs">{project.description}</p>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-muted-foreground">{project.client}</TableCell>
                  <TableCell>
                    <Badge className={`${statusColors[project.status]} border-0`}>
                      {project.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="w-24">
                      <div className="h-2 rounded-full bg-muted overflow-hidden">
                        <div
                          className={`h-full rounded-full bg-gradient-to-r ${progressColors[project.status] ?? "from-muted-foreground/30 to-muted-foreground/50"}`}
                          style={{ width: `${project.progress}%` }}
                        />
                      </div>
                      <p className="text-[10px] text-muted-foreground mt-1">{project.progress}%</p>
                    </div>
                  </TableCell>
                  <TableCell className="text-muted-foreground text-sm">
                    {project.deadline ? formatDate(project.deadline) : "—"}
                  </TableCell>
                  <TableCell className="text-foreground text-right font-medium">
                    {project.budget ? formatINR(project.budget) : "—"}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
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
            <div className="space-y-2">
              <Label>Client *</Label>
              <Input
                value={form.client}
                onChange={(e) => setForm({ ...form, client: e.target.value })}
                placeholder="Client name"
              />
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
                  {["brief", "editing", "review", "revision", "approved", "delivered"].map((s) => (
                    <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <Label>Budget (₹)</Label>
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
    </div>
  )
}
