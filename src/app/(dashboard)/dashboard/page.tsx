"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { GlassCard } from "@/components/layout/glass-card"
import { Users, FolderKanban, Video, FileText, Clock, ArrowRight } from "lucide-react"
import { formatINR, formatDate } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"

interface DashboardStats {
  activeClients: number
  activeProjects: number
  pendingReviews: number
  pendingPayments: number
}

interface RecentProject {
  id: string
  name: string
  client: string
  status: string
  progress: number
}

interface RecentActivity {
  id: string
  description: string
  time: string
}

const demoStats: DashboardStats = {
  activeClients: 12,
  activeProjects: 8,
  pendingReviews: 5,
  pendingPayments: 38000,
}

const demoProjects: RecentProject[] = [
  { id: "1", name: "YouTube Episode 42", client: "Rahul Media", status: "editing", progress: 65 },
  { id: "2", name: "Instagram Reel Campaign", client: "Pixel Studios", status: "review", progress: 80 },
  { id: "3", name: "Product Commercial", client: "Creator Labs", status: "brief", progress: 15 },
]

const demoActivities: RecentActivity[] = [
  { id: "1", description: "YouTube Episode 42 moved to Review", time: "2 hours ago" },
  { id: "2", description: "New comment on Instagram Reel Campaign", time: "4 hours ago" },
  { id: "3", description: "Invoice INV-2608-0001 marked as paid", time: "1 day ago" },
]

function getGreeting(): string {
  const hour = new Date().getHours()
  if (hour < 12) return "Good morning"
  if (hour < 17) return "Good afternoon"
  return "Good evening"
}

const statusColor: Record<string, string> = {
  brief: "bg-white/10 text-white/60",
  editing: "bg-blue-500/20 text-blue-400",
  review: "bg-yellow-500/20 text-yellow-400",
  revision: "bg-orange-500/20 text-orange-400",
  approved: "bg-green-500/20 text-green-400",
  delivered: "bg-purple-500/20 text-purple-400",
}

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats>(demoStats)
  const [projects, setProjects] = useState<RecentProject[]>(demoProjects)
  const [activities, setActivities] = useState<RecentActivity[]>(demoActivities)
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

        const [clientsRes, projectsRes, videosRes, invoicesRes] = await Promise.all([
          supabase.from("clients").select("id", { count: "exact", head: true }).eq("editor_id", user.id).eq("status", "active"),
          supabase.from("projects").select("id, name, status, progress, clients(name)", { count: "exact" }).eq("editor_id", user.id).order("created_at", { ascending: false }).limit(5),
          supabase.from("videos").select("id", { count: "exact", head: true }).eq("uploaded_by", user.id).eq("status", "awaiting_review"),
          supabase.from("invoices").select("amount").eq("client_id", user.id).in("status", ["sent", "overdue"]),
        ])

        const totalPayments = invoicesRes.data?.reduce((sum, inv) => sum + (inv.amount || 0), 0) ?? 0

        if (clientsRes.count !== null) {
          setIsDemo(false)
          setStats({
            activeClients: clientsRes.count ?? 0,
            activeProjects: projectsRes.count ?? 0,
            pendingReviews: videosRes.count ?? 0,
            pendingPayments: totalPayments,
          })
        }

        if (projectsRes.data && projectsRes.data.length > 0) {
          setProjects(
            projectsRes.data.map((p: any) => ({
              id: p.id,
              name: p.name,
              client: p.clients?.name ?? "Unknown",
              status: p.status,
              progress: p.progress ?? 0,
            }))
          )
        }
      } catch {
        // Keep demo data
      }
    }

    loadData()
  }, [])

  const statCards = [
    { label: "Active Clients", value: stats.activeClients, icon: Users, color: "bg-blue-500/20 text-blue-400" },
    { label: "Active Projects", value: stats.activeProjects, icon: FolderKanban, color: "bg-green-500/20 text-green-400" },
    { label: "Pending Reviews", value: stats.pendingReviews, icon: Video, color: "bg-yellow-500/20 text-yellow-400" },
    { label: "Pending Payments", value: formatINR(stats.pendingPayments), icon: FileText, color: "bg-purple-500/20 text-purple-400" },
  ]

  return (
    <div className="p-6 space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-white">
          {getGreeting()}, {userName} 👋
        </h1>
        <p className="text-white/50 mt-1">
          Here&apos;s what&apos;s happening with your workspace.
          {isDemo && (
            <Badge variant="glass" className="ml-2 text-xs">
              Demo Data
            </Badge>
          )}
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((card) => (
          <GlassCard key={card.label} className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-white/50">{card.label}</p>
                <p className="text-2xl font-bold text-white mt-1">{card.value}</p>
              </div>
              <div className={`h-12 w-12 rounded-xl flex items-center justify-center ${card.color}`}>
                <card.icon className="h-6 w-6" />
              </div>
            </div>
          </GlassCard>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <GlassCard className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-white">Recent Projects</h2>
              <Link
                href="/projects"
                className="text-sm text-white/50 hover:text-white flex items-center gap-1 transition-colors"
              >
                View all <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
            {projects.length === 0 ? (
              <div className="text-center py-12">
                <FolderKanban className="h-12 w-12 text-white/20 mx-auto mb-3" />
                <p className="text-white/40">No projects yet. Create your first project to get started.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {projects.map((project) => (
                  <div
                    key={project.id}
                    className="flex items-center justify-between p-3 rounded-lg bg-white/5 hover:bg-white/10 transition-colors"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-white truncate">{project.name}</p>
                      <p className="text-xs text-white/40 mt-0.5">{project.client}</p>
                    </div>
                    <div className="flex items-center gap-3 ml-4">
                      <div className="w-24">
                        <div className="h-1.5 rounded-full bg-white/10 overflow-hidden">
                          <div
                            className="h-full rounded-full bg-gradient-to-r from-blue-500 to-cyan-400"
                            style={{ width: `${project.progress}%` }}
                          />
                        </div>
                        <p className="text-[10px] text-white/40 text-right mt-0.5">{project.progress}%</p>
                      </div>
                      <Badge className={`${statusColor[project.status] ?? "bg-white/10 text-white/60"} border-0`}>
                        {project.status}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </GlassCard>
        </div>

        <div>
          <GlassCard className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-white">Recent Activity</h2>
            </div>
            {activities.length === 0 ? (
              <div className="text-center py-12">
                <Clock className="h-12 w-12 text-white/20 mx-auto mb-3" />
                <p className="text-white/40">No recent activity to show.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {activities.map((activity) => (
                  <div key={activity.id} className="flex gap-3">
                    <div className="h-2 w-2 rounded-full bg-blue-400 mt-2 flex-shrink-0" />
                    <div>
                      <p className="text-sm text-white/80">{activity.description}</p>
                      <p className="text-xs text-white/40 mt-0.5">{activity.time}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </GlassCard>
        </div>
      </div>
    </div>
  )
}
