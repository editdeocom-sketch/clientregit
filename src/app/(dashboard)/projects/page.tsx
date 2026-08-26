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
  brief: "bg-white/10 text-white/60",
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

  async function handleSave() {
    setSaving(true)
    try {
      const newProject: ProjectData = {
        id: Date.now().toString(),
        name: form.name,
        client: form.client,
        status: form.status,
        progress: form.progress,
        deadline: form.deadline || null,
        budget: form.budget ? Number(form.budget) : null,
        description: form.description || null,
      }
      setProjects((prev) => [newProject, ...prev])
      setDialogOpen(false)
      setForm(emptyForm)
    } finally {
      setSaving(false)
    }
  }

  const statuses = ["all", "brief", "editing", "review", "revision", "approved", "delivered"]

  return (
    <div className="p-6 space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Projects</h1>
          <p className="text-white/50 mt-1">Track and manage all your projects.</p>
        </div>
        <Button onClick={() => { setForm(emptyForm); setDialogOpen(true) }} className="bg-gradient-to-r from-[#3A506B] to-[#5C7A9B] hover:from-[#4A607B] hover:to-[#6C8AAB] text-white">
          <Plus className="h-4 w-4 mr-2" />
          Add Project
        </Button>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/40" />
          <Input
            placeholder="Search projects..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10 bg-white/5 border-white/10 text-white placeholder:text-white/40"
          />
        </div>
        <div className="flex gap-1 p-1 rounded-lg bg-white/5 border border-white/10">
          {statuses.map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                statusFilter === s
                  ? "bg-white/15 text-white"
                  : "text-white/50 hover:text-white/70"
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
            <FolderKanban className="h-12 w-12 text-white/20 mx-auto mb-3" />
            <p className="text-white/40 mb-4">
              {search || statusFilter !== "all"
                ? "No projects match your filters."
                : "No projects yet. Create your first project to get started."}
            </p>
            {!search && statusFilter === "all" && (
              <Button
                onClick={() => { setForm(emptyForm); setDialogOpen(true) }}
                variant="glass"
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
              <TableRow className="border-white/10 hover:bg-transparent">
                <TableHead className="text-white/60">Project</TableHead>
                <TableHead className="text-white/60">Client</TableHead>
                <TableHead className="text-white/60">Status</TableHead>
                <TableHead className="text-white/60">Progress</TableHead>
                <TableHead className="text-white/60">Deadline</TableHead>
                <TableHead className="text-white/60 text-right">Budget</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((project) => (
                <TableRow key={project.id} className="border-white/5 hover:bg-white/5">
                  <TableCell>
                    <div>
                      <p className="font-medium text-white">{project.name}</p>
                      {project.description && (
                        <p className="text-xs text-white/40 mt-0.5 truncate max-w-xs">{project.description}</p>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-white/60">{project.client}</TableCell>
                  <TableCell>
                    <Badge className={`${statusColors[project.status]} border-0`}>
                      {project.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="w-24">
                      <div className="h-2 rounded-full bg-white/10 overflow-hidden">
                        <div
                          className={`h-full rounded-full bg-gradient-to-r ${progressColors[project.status] ?? "from-white/30 to-white/50"}`}
                          style={{ width: `${project.progress}%` }}
                        />
                      </div>
                      <p className="text-[10px] text-white/40 mt-1">{project.progress}%</p>
                    </div>
                  </TableCell>
                  <TableCell className="text-white/60 text-sm">
                    {project.deadline ? formatDate(project.deadline) : "—"}
                  </TableCell>
                  <TableCell className="text-white text-right font-medium">
                    {project.budget ? formatINR(project.budget) : "—"}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </GlassCard>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="bg-[#141E3A] border-white/10 text-white">
          <DialogHeader>
            <DialogTitle>Add Project</DialogTitle>
            <DialogDescription className="text-white/50">
              Fill in the details to create a new project.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label className="text-white/70">Project Name *</Label>
              <Input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="e.g. YouTube Episode 42"
                className="bg-white/5 border-white/10 text-white placeholder:text-white/40"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-white/70">Client *</Label>
              <Input
                value={form.client}
                onChange={(e) => setForm({ ...form, client: e.target.value })}
                placeholder="Client name"
                className="bg-white/5 border-white/10 text-white placeholder:text-white/40"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-white/70">Description</Label>
              <Textarea
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder="Brief description of the project..."
                className="bg-white/5 border-white/10 text-white placeholder:text-white/40"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-white/70">Status</Label>
                <select
                  value={form.status}
                  onChange={(e) => setForm({ ...form, status: e.target.value as ProjectData["status"] })}
                  className="flex h-10 w-full rounded-md border border-white/10 bg-white/5 px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-white/20"
                >
                  {["brief", "editing", "review", "revision", "approved", "delivered"].map((s) => (
                    <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <Label className="text-white/70">Budget (₹)</Label>
                <Input
                  type="number"
                  value={form.budget}
                  onChange={(e) => setForm({ ...form, budget: e.target.value })}
                  placeholder="0"
                  className="bg-white/5 border-white/10 text-white placeholder:text-white/40"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-white/70">Deadline</Label>
              <Input
                type="date"
                value={form.deadline}
                onChange={(e) => setForm({ ...form, deadline: e.target.value })}
                className="bg-white/5 border-white/10 text-white"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setDialogOpen(false)} className="text-white/60 hover:text-white">
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              disabled={!form.name || !form.client || saving}
              className="bg-gradient-to-r from-[#3A506B] to-[#5C7A9B] text-white"
            >
              {saving ? "Creating..." : "Create Project"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
