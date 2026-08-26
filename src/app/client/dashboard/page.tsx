"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { GlassCard } from "@/components/layout/glass-card"
import { Badge } from "@/components/ui/badge"
import { FolderKanban } from "lucide-react"
import { formatDate } from "@/lib/utils"
import Link from "next/link"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

interface ProjectData {
  id: string
  name: string
  status: string
  progress: number
  deadline: string | null
}

const demoProjects: ProjectData[] = [
  { id: "1", name: "YouTube Episode 42", status: "review", progress: 80, deadline: "2026-12-15" },
  { id: "2", name: "Instagram Reel Campaign", status: "revision", progress: 60, deadline: "2026-12-20" },
]

const statusColor: Record<string, string> = {
  brief: "bg-muted text-muted-foreground",
  editing: "bg-blue-500/20 text-blue-600 dark:text-blue-400",
  review: "bg-yellow-500/20 text-yellow-600 dark:text-yellow-400",
  revision: "bg-orange-500/20 text-orange-600 dark:text-orange-400",
  approved: "bg-green-500/20 text-green-600 dark:text-green-400",
  delivered: "bg-purple-500/20 text-purple-600 dark:text-purple-400",
}

const progressGradients: Record<string, string> = {
  brief: "from-slate-400 to-slate-500",
  editing: "from-blue-500 to-cyan-400",
  review: "from-yellow-500 to-amber-400",
  revision: "from-orange-500 to-amber-400",
  approved: "from-green-500 to-emerald-400",
  delivered: "from-purple-500 to-violet-400",
}

function getGreeting(): string {
  const hour = new Date().getHours()
  if (hour < 12) return "Good morning"
  if (hour < 17) return "Good afternoon"
  return "Good evening"
}

export default function ClientDashboardPage() {
  const [projects, setProjects] = useState<ProjectData[]>([])
  const [userName, setUserName] = useState("there")
  const [isDemo, setIsDemo] = useState(true)

  useEffect(() => {
    async function loadData() {
      try {
        const supabase = createClient()
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return

        const { data: profile } = await supabase
          .from("profiles")
          .select("full_name")
          .eq("id", user.id)
          .single()

        if (profile?.full_name) {
          setUserName(profile.full_name.split(" ")[0])
        }

        const { data } = await supabase
          .from("projects")
          .select("id, name, status, progress, deadline")
          .eq("client_id", user.id)
          .order("created_at", { ascending: false })

        if (data && data.length > 0) {
          setIsDemo(false)
          setProjects(
            data.map((p: any) => ({
              id: p.id,
              name: p.name,
              status: p.status,
              progress: p.progress ?? 0,
              deadline: p.deadline,
            }))
          )
        } else {
          setProjects(demoProjects)
        }
      } catch {
        setProjects(demoProjects)
      }
    }

    loadData()
  }, [])

  return (
    <div className="p-6 space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-foreground">
          {getGreeting()}, {userName}
        </h1>
        <p className="text-muted-foreground mt-1">
          Here&apos;s an overview of your projects.
          {isDemo && (
            <Badge variant="glass" className="ml-2 text-xs">
              Demo Data
            </Badge>
          )}
        </p>
      </div>

      <GlassCard className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-foreground">Your Projects</h2>
        </div>
        {projects.length === 0 ? (
          <div className="text-center py-12">
            <FolderKanban className="h-12 w-12 text-muted-foreground/30 mx-auto mb-3" />
            <p className="text-muted-foreground">No projects assigned to you yet.</p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="border-border hover:bg-transparent">
                <TableHead className="text-muted-foreground">Project Name</TableHead>
                <TableHead className="text-muted-foreground">Status</TableHead>
                <TableHead className="text-muted-foreground">Progress</TableHead>
                <TableHead className="text-muted-foreground text-right">Deadline</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {projects.map((project) => (
                <TableRow key={project.id} className="border-border/50 hover:bg-muted/50">
                  <TableCell>
                    <Link
                      href={`/client/projects/${project.id}`}
                      className="font-medium text-foreground hover:text-foreground/80 transition-colors"
                    >
                      {project.name}
                    </Link>
                  </TableCell>
                  <TableCell>
                    <Badge className={`${statusColor[project.status] ?? "bg-muted text-muted-foreground"} border-0`}>
                      {project.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="w-28">
                      <div className="h-2 rounded-full bg-border overflow-hidden">
                        <div
                          className={`h-full rounded-full bg-gradient-to-r ${progressGradients[project.status] ?? "from-muted-foreground/30 to-muted-foreground/50"}`}
                          style={{ width: `${project.progress}%` }}
                        />
                      </div>
                      <p className="text-[10px] text-muted-foreground mt-1">{project.progress}%</p>
                    </div>
                  </TableCell>
                  <TableCell className="text-muted-foreground text-sm text-right">
                    {project.deadline ? formatDate(project.deadline) : "\u2014"}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </GlassCard>
    </div>
  )
}
