import { useEffect, useState, useCallback } from "react"
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
import { CheckSquare, Plus, Calendar, GripVertical, Trash2 } from "lucide-react"
import { toast } from "sonner"

interface TaskData {
  id: string
  project: { id: string; name: string } | string
  title: string
  description: string | null
  status: "todo" | "in_progress" | "review" | "done"
  priority: "low" | "medium" | "high"
  due_date: string | null
  assignee: string | null
  created_at: string
  updated_at: string
}

interface ProjectOption {
  id: string
  name: string
}

const columns: { key: TaskData["status"]; label: string; color: string }[] = [
  { key: "todo", label: "TO DO", color: "border-border" },
  { key: "in_progress", label: "IN PROGRESS", color: "border-blue-500/30" },
  { key: "review", label: "REVIEW", color: "border-yellow-500/30" },
  { key: "done", label: "DONE", color: "border-green-500/30" },
]

const priorityConfig: Record<string, { label: string; className: string }> = {
  high: { label: "High", className: "bg-red-500/20 text-red-400 border-0" },
  medium: { label: "Medium", className: "bg-yellow-500/20 text-yellow-400 border-0" },
  low: { label: "Low", className: "bg-blue-500/20 text-blue-400 border-0" },
}

const emptyForm = {
  title: "",
  description: "",
  status: "todo" as TaskData["status"],
  priority: "medium" as TaskData["priority"],
  due_date: "",
  project_id: "",
}

export default function TasksPage() {
  const { user } = useAuth()
  const [tasks, setTasks] = useState<TaskData[]>([])
  const [projects, setProjects] = useState<ProjectOption[]>([])
  const [dialogOpen, setDialogOpen] = useState(false)
  const [form, setForm] = useState(emptyForm)
  const [saving, setSaving] = useState(false)
  const [deletingTask, setDeletingTask] = useState<TaskData | null>(null)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)

  const loadTasks = useCallback(async () => {
    if (!user) return
    try {
      const data = await api.get<{ data: TaskData[] }>("/tasks")
      setTasks(data.data.map((task: TaskData & { project_name?: string }) => ({
        ...task,
        id: String(task.id),
        project: task.project,
      })))
    } catch {
      setTasks([])
    }
  }, [user])

  const loadProjects = useCallback(async () => {
    if (!user) return
    try {
      const data = await api.get<{ data: ProjectOption[] }>("/projects")
      setProjects(data.data.map((project) => ({ ...project, id: String(project.id) })))
    } catch {
      setProjects([])
    }
  }, [user])

  useEffect(() => {
    loadTasks()
    loadProjects()
  }, [loadTasks, loadProjects])

  function getProjectName(task: TaskData): string {
    const flatName = (task as unknown as Record<string, unknown>).project_name as string | undefined
    if (flatName) return flatName
    if (task.project && typeof task.project === "object" && "name" in task.project) {
      return task.project.name
    }
    const match = projects.find((p) => p.id === (typeof task.project === "string" ? task.project : task.project?.id))
    return match?.name ?? ""
  }

  function handleDragStart(e: React.DragEvent, taskId: string) {
    e.dataTransfer.setData("taskId", taskId)
  }

  async function handleDrop(e: React.DragEvent, newStatus: TaskData["status"]) {
    e.preventDefault()
    const taskId = e.dataTransfer.getData("taskId")
    const task = tasks.find((t) => String(t.id) === taskId)
    if (!task || task.status === newStatus) return

    setTasks((prev) =>
      prev.map((t) => (String(t.id) === taskId ? { ...t, status: newStatus } : t))
    )

    try {
      await api.put(`/tasks/${taskId}`, {
        status: newStatus,
        updated_at: new Date().toISOString(),
      })
      toast.success("Task status updated.")
    } catch (err: unknown) {
      toast.error("Failed to update task status.")
      await loadTasks()
    }
  }

  function handleDragOver(e: React.DragEvent) {
    e.preventDefault()
    e.dataTransfer.dropEffect = "move"
  }

  async function handleSave() {
    setSaving(true)
    try {
      if (!user) {
        toast.error("You must be logged in.")
        return
      }

      if (!form.project_id) {
        toast.error("Please select a project.")
        return
      }

await api.post("/tasks", {
  project_id: form.project_id || null,
  title: form.title,
  description: form.description || null,
  status: form.status,
  priority: form.priority,
  due_date: form.due_date || null,
  assignee_id: user.id,
  })

      toast.success("Task created successfully.")
      setDialogOpen(false)
      setForm(emptyForm)
      await loadTasks()
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to create task."
      toast.error(message)
    } finally {
      setSaving(false)
    }
  }

  function openDeleteDialog(task: TaskData) {
    setDeletingTask(task)
    setDeleteDialogOpen(true)
  }

  async function handleDelete() {
    if (!deletingTask) return
    try {
      await api.delete(`/tasks/${deletingTask.id}`)
      toast.success("Task deleted.")
      setDeleteDialogOpen(false)
      setDeletingTask(null)
      await loadTasks()
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to delete task."
      toast.error(message)
    }
  }

  const totalTasks = tasks.length

  return (
    <div className="p-6 space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Tasks</h1>
          <p className="text-muted-foreground mt-1">Drag and drop tasks between columns.</p>
        </div>
        <Button onClick={() => { setForm(emptyForm); setDialogOpen(true) }} className="bg-gradient-to-r from-[#3A506B] to-[#5C7A9B] hover:from-[#4A607B] hover:to-[#6C8AAB] text-white">
          <Plus className="h-4 w-4 mr-2" />
          Add Task
        </Button>
      </div>

      {totalTasks === 0 ? (
        <GlassCard className="p-16 text-center">
          <CheckSquare className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
          <p className="text-muted-foreground mb-4">No tasks yet. Create tasks to track your work.</p>
          <Button onClick={() => { setForm(emptyForm); setDialogOpen(true) }} variant="glass" size="sm">
            <Plus className="h-4 w-4 mr-2" />
            Add Task
          </Button>
        </GlassCard>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {columns.map((col) => {
            const colTasks = tasks.filter((t) => t.status === col.key)
            return (
              <div
                key={col.key}
                className={`rounded-xl border-t-2 ${col.color} bg-card p-3 space-y-3 min-h-[200px]`}
                onDrop={(e) => handleDrop(e, col.key)}
                onDragOver={handleDragOver}
              >
                <div className="flex items-center justify-between px-1">
                  <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    {col.label}
                  </h3>
                  <span className="text-xs text-muted-foreground bg-muted rounded-full px-2 py-0.5">
                    {colTasks.length}
                  </span>
                </div>
                <div className="space-y-2">
                  {colTasks.map((task) => (
                    <GlassCard
                      key={task.id}
                      className="p-3 cursor-grab active:cursor-grabbing hover:bg-muted transition-colors"
                      draggable
                      onDragStart={(e) => handleDragStart(e, task.id)}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-start gap-2 flex-1 min-w-0">
                          <GripVertical className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                          <div className="min-w-0">
                            <p className="text-sm font-medium text-foreground leading-snug">{task.title}</p>
                            {getProjectName(task) && (
                              <p className="text-[10px] text-muted-foreground mt-1">{getProjectName(task)}</p>
                            )}
                            {task.due_date && (
                              <div className="flex items-center gap-1 mt-1.5">
                                <Calendar className="h-3 w-3 text-muted-foreground" />
                                <span className="text-[10px] text-muted-foreground">{task.due_date}</span>
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-1 flex-shrink-0">
                          <Badge className={`${priorityConfig[task.priority].className} text-[10px]`}>
                            {priorityConfig[task.priority].label}
                          </Badge>
                          <button
                            onClick={() => openDeleteDialog(task)}
                            className="p-1 rounded hover:bg-destructive/20 text-muted-foreground hover:text-destructive transition-colors"
                          >
                            <Trash2 className="h-3 w-3" />
                          </button>
                        </div>
                      </div>
                    </GlassCard>
                  ))}
                  {colTasks.length === 0 && (
                    <div className="text-center py-8 text-muted-foreground text-xs">
                      Drop tasks here
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="bg-card border-border text-foreground">
          <DialogHeader>
            <DialogTitle>Add Task</DialogTitle>
            <DialogDescription className="text-muted-foreground">
              Create a new task and assign it to a project.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label className="text-muted-foreground">Project *</Label>
              <select
                value={form.project_id}
                onChange={(e) => setForm({ ...form, project_id: e.target.value })}
                className="flex h-10 w-full rounded-md border border-border bg-muted px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              >
                <option value="">Select a project</option>
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label className="text-muted-foreground">Title *</Label>
              <Input
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                placeholder="Task title"
                className="bg-muted border-border text-foreground placeholder:text-muted-foreground"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-muted-foreground">Description</Label>
              <Textarea
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder="Optional description..."
                className="bg-muted border-border text-foreground placeholder:text-muted-foreground"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-muted-foreground">Status</Label>
                <select
                  value={form.status}
                  onChange={(e) => setForm({ ...form, status: e.target.value as TaskData["status"] })}
                  className="flex h-10 w-full rounded-md border border-border bg-muted px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                >
                  <option value="todo">To Do</option>
                  <option value="in_progress">In Progress</option>
                  <option value="review">Review</option>
                  <option value="done">Done</option>
                </select>
              </div>
              <div className="space-y-2">
                <Label className="text-muted-foreground">Priority</Label>
                <select
                  value={form.priority}
                  onChange={(e) => setForm({ ...form, priority: e.target.value as TaskData["priority"] })}
                  className="flex h-10 w-full rounded-md border border-border bg-muted px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                </select>
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-muted-foreground">Due Date</Label>
              <Input
                type="date"
                value={form.due_date}
                onChange={(e) => setForm({ ...form, due_date: e.target.value })}
                className="bg-muted border-border text-foreground"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setDialogOpen(false)} className="text-muted-foreground hover:text-foreground">
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              disabled={!form.title || !form.project_id || saving}
              className="bg-gradient-to-r from-[#3A506B] to-[#5C7A9B] text-white"
            >
              {saving ? "Creating..." : "Create Task"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="bg-card border-border text-foreground">
          <DialogHeader>
            <DialogTitle>Delete Task</DialogTitle>
            <DialogDescription className="text-muted-foreground">
              Are you sure you want to delete &ldquo;{deletingTask?.title}&rdquo;? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setDeleteDialogOpen(false)} className="text-muted-foreground hover:text-foreground">
              Cancel
            </Button>
            <Button
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
