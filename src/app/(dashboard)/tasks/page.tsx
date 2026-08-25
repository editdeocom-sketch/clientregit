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
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog"
import { CheckSquare, Plus, Calendar, GripVertical } from "lucide-react"

interface TaskData {
  id: string
  title: string
  description: string | null
  status: "todo" | "in_progress" | "review" | "done"
  priority: "low" | "medium" | "high"
  due_date: string | null
}

const demoTasks: TaskData[] = [
  { id: "1", title: "Color grade YouTube Episode 42", description: null, status: "todo", priority: "high", due_date: "2026-08-28" },
  { id: "2", title: "Add lower thirds to podcast", description: null, status: "todo", priority: "medium", due_date: "2026-08-30" },
  { id: "3", title: "Edit Instagram Reel #3", description: null, status: "in_progress", priority: "high", due_date: "2026-08-27" },
  { id: "4", title: "Sound design for product commercial", description: null, status: "in_progress", priority: "medium", due_date: "2026-09-01" },
  { id: "5", title: "Motion graphics for YouTube intro", description: null, status: "in_progress", priority: "low", due_date: "2026-09-05" },
  { id: "6", title: "Review Instagram Reel #1", description: null, status: "review", priority: "medium", due_date: "2026-08-26" },
  { id: "7", title: "Client feedback on corporate video", description: null, status: "review", priority: "low", due_date: "2026-08-25" },
  { id: "8", title: "Export podcast final cut", description: null, status: "done", priority: "high", due_date: null },
  { id: "9", title: "Thumbnail design for Episode 41", description: null, status: "done", priority: "medium", due_date: null },
]

const columns: { key: TaskData["status"]; label: string; color: string }[] = [
  { key: "todo", label: "TO DO", color: "border-white/10" },
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
}

export default function TasksPage() {
  const [tasks, setTasks] = useState<TaskData[]>([])
  const [isDemo, setIsDemo] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [form, setForm] = useState(emptyForm)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    async function loadTasks() {
      try {
        const supabase = createClient()
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return

        const { data } = await supabase
          .from("tasks")
          .select("*")
          .eq("assignee_id", user.id)
          .order("created_at", { ascending: false })

        if (data && data.length > 0) {
          setIsDemo(false)
          setTasks(data as TaskData[])
        } else {
          setTasks(demoTasks)
        }
      } catch {
        setTasks(demoTasks)
      }
    }

    loadTasks()
  }, [])

  function handleDragStart(e: React.DragEvent, taskId: string) {
    e.dataTransfer.setData("taskId", taskId)
  }

  function handleDrop(e: React.DragEvent, newStatus: TaskData["status"]) {
    e.preventDefault()
    const taskId = e.dataTransfer.getData("taskId")
    setTasks((prev) =>
      prev.map((t) => (t.id === taskId ? { ...t, status: newStatus } : t))
    )
  }

  function handleDragOver(e: React.DragEvent) {
    e.preventDefault()
  }

  async function handleSave() {
    setSaving(true)
    try {
      const newTask: TaskData = {
        id: Date.now().toString(),
        title: form.title,
        description: form.description || null,
        status: form.status,
        priority: form.priority,
        due_date: form.due_date || null,
      }
      setTasks((prev) => [...prev, newTask])
      setDialogOpen(false)
      setForm(emptyForm)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="p-6 space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Tasks</h1>
          <p className="text-white/50 mt-1">Drag and drop tasks between columns.</p>
        </div>
        <Button onClick={() => { setForm(emptyForm); setDialogOpen(true) }} className="bg-gradient-to-r from-[#3A506B] to-[#5C7A9B] hover:from-[#4A607B] hover:to-[#6C8AAB] text-white">
          <Plus className="h-4 w-4 mr-2" />
          Add Task
        </Button>
      </div>

      {isDemo && (
        <Badge variant="glass" className="text-xs">
          Showing demo data — drag tasks between columns to try it out
        </Badge>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {columns.map((col) => {
          const colTasks = tasks.filter((t) => t.status === col.key)
          return (
            <div
              key={col.key}
              className={`rounded-xl border-t-2 ${col.color} bg-white/[0.02] p-3 space-y-3 min-h-[200px]`}
              onDrop={(e) => handleDrop(e, col.key)}
              onDragOver={handleDragOver}
            >
              <div className="flex items-center justify-between px-1">
                <h3 className="text-xs font-semibold text-white/50 uppercase tracking-wider">
                  {col.label}
                </h3>
                <span className="text-xs text-white/30 bg-white/5 rounded-full px-2 py-0.5">
                  {colTasks.length}
                </span>
              </div>
              <div className="space-y-2">
                {colTasks.map((task) => (
                  <GlassCard
                    key={task.id}
                    className="p-3 cursor-grab active:cursor-grabbing hover:bg-white/10 transition-colors"
                    draggable
                    onDragStart={(e) => handleDragStart(e, task.id)}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-start gap-2 flex-1 min-w-0">
                        <GripVertical className="h-4 w-4 text-white/20 mt-0.5 flex-shrink-0" />
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-white leading-snug">{task.title}</p>
                          {task.due_date && (
                            <div className="flex items-center gap-1 mt-1.5">
                              <Calendar className="h-3 w-3 text-white/30" />
                              <span className="text-[10px] text-white/40">{task.due_date}</span>
                            </div>
                          )}
                        </div>
                      </div>
                      <Badge className={`${priorityConfig[task.priority].className} text-[10px] flex-shrink-0`}>
                        {priorityConfig[task.priority].label}
                      </Badge>
                    </div>
                  </GlassCard>
                ))}
                {colTasks.length === 0 && (
                  <div className="text-center py-8 text-white/20 text-xs">
                    Drop tasks here
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="bg-[#141E3A] border-white/10 text-white">
          <DialogHeader>
            <DialogTitle>Add Task</DialogTitle>
            <DialogDescription className="text-white/50">
              Create a new task and assign it to a column.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label className="text-white/70">Title *</Label>
              <Input
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                placeholder="Task title"
                className="bg-white/5 border-white/10 text-white placeholder:text-white/40"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-white/70">Description</Label>
              <Textarea
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder="Optional description..."
                className="bg-white/5 border-white/10 text-white placeholder:text-white/40"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-white/70">Status</Label>
                <select
                  value={form.status}
                  onChange={(e) => setForm({ ...form, status: e.target.value as TaskData["status"] })}
                  className="flex h-10 w-full rounded-md border border-white/10 bg-white/5 px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-white/20"
                >
                  <option value="todo">To Do</option>
                  <option value="in_progress">In Progress</option>
                  <option value="review">Review</option>
                  <option value="done">Done</option>
                </select>
              </div>
              <div className="space-y-2">
                <Label className="text-white/70">Priority</Label>
                <select
                  value={form.priority}
                  onChange={(e) => setForm({ ...form, priority: e.target.value as TaskData["priority"] })}
                  className="flex h-10 w-full rounded-md border border-white/10 bg-white/5 px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-white/20"
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                </select>
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-white/70">Due Date</Label>
              <Input
                type="date"
                value={form.due_date}
                onChange={(e) => setForm({ ...form, due_date: e.target.value })}
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
              disabled={!form.title || saving}
              className="bg-gradient-to-r from-[#3A506B] to-[#5C7A9B] text-white"
            >
              {saving ? "Creating..." : "Create Task"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
