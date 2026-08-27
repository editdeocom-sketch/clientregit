"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { GlassCard } from "@/components/layout/glass-card"
import { Badge } from "@/components/ui/badge"
import { FolderKanban, Video, Clock, CheckCircle } from "lucide-react"
import { formatDate, formatINR } from "@/lib/utils"
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
  budget: number | null
}

interface DashboardStats {
  totalProjects: number
  activeProjects: number
  pendingReviews: number
  completedProjects: number
}

const demoProjects: ProjectData[] = [
  { id: "1", name: "YouTube Episode 42", status: "review", progress: 80, deadline: "2026-12-15", budget: 25000 },
  { id: "2", name: "Instagram Reel Campaign", status: "revision", progress: 60, deadline: "2026-12-20", budget: 15000 },
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
  const [stats, setStats] = useState<DashboardStats>({
    totalProjects: 0,
    activeProjects: 0,
    pendingReviews: 0,
    completedProjects: 0,
  })

  useEffect(() => {
    async function loadData() {
      try {
        const supabase = createClient()
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return

        const { data: profile } = await supabase
          .from("profiles")
          .select("full_name, email")
          .eq("id", user.id)
          .single()

        if (profile?.full_name) {
          setUserName(profile.full_name.split(" ")[0])
        }

        // Find client record by email
        const clientEmail = profile?.email || user.email
        const { data: clientRecord } = await supabase
          .from("clients")
          .select("id")
          .eq("email", clientEmail)
          .single()

        if (clientRecord) {
          const { data } = await supabase
            .from("projects")
            .select("id, name, status, progress, deadline, budget")
            .eq("client_id", clientRecord.id)
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
                budget: p.budget,
              }))
            )

            // Calculate stats
            const active = data.filter((p: any) => !["delivered", "approved"].includes(p.status))
            const reviews = data.filter((p: any) => p.status === "review")
            const completed = data.filter((p: any) => p.status === "delivered")

            setStats({
              totalProjects: data.length,
              activeProjects: active.length,
              pendingReviews: reviews.length,
              completedProjects: completed.length,
            })
          } else {
            setProjects(demoProjects)
            setStats({
              totalProjects: 2,
              activeProjects: 2,
              pendingReviews: 1,
              completedProjects: 0,
            })
          }
        } else {
          setProjects(demoProjects)
          setStats({
            totalProjects: 2,
            activeProjects: 2,
            pendingReviews: 1,
            completedProjects: 0,
          })
        }
      } catch {
        setProjects(demoProjects)
        setStats({
          totalProjects: 2,
          activeProjects: 2,
          pendingReviews: 1,
          completedProjects: 0,
        })
      }
    }

    loadData()
  }, [])

  const statCards = [
    { label: "Total Projects", value: stats.totalProjects, icon: FolderKanban, color: "bg-blue-500/20 text-blue-600 dark:text-blue-400" },
    { label: "Active Projects", value: stats.activeProjects, icon: Clock, color: "bg-yellow-500/20 text-yellow-600 dark:text-yellow-400" },
    { label: "Pending Reviews", value: stats.pendingReviews, icon: Video, color: "bg-orange-500/20 text-orange-600 dark:text-orange-400" },
    { label: "Completed", value: stats.completedProjects, icon: CheckCircle, color: "bg-green-500/20 text-green-600 dark:text-green-400" },
  ]

  return (
    <div className="p-6 space-y-6 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">
          {getGreeting()}, {userName}
        </h1>
        <p className="text-muted-foreground mt-1">
          Here&apos;s an overview of your projects.
          {isDemo && (
            <Badge variant="secondary" className="ml-2 text-xs">
              Demo Data
            </Badge>
          )}
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((card) => (
          <GlassCard key={card.label} className="p-5 hover-lift transition-all duration-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">{card.label}</p>
                <p className="text-2xl font-bold text-foreground mt-1">{card.value}</p>
              </div>
              <div className={`h-12 w-12 rounded-xl flex items-center justify-center ${card.color}`}>
                <card.icon className="h-6 w-6" />
              </div>
            </div>
          </GlassCard>
        ))}
      </div>

      {/* Projects Table */}
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
                <TableHead className="text-muted-foreground">Budget</TableHead>
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
                  <TableCell className="text-muted-foreground text-sm">
                    {project.budget ? formatINR(project.budget) : "\u2014"}
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
