"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { GlassCard } from "@/components/layout/glass-card"
import { Users, FolderKanban, Video, FileText, Clock, ArrowRight, Plus } from "lucide-react"
import { formatINR } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
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

function getGreeting(): string {
  const hour = new Date().getHours()
  if (hour < 12) return "Good morning"
  if (hour < 17) return "Good afternoon"
  return "Good evening"
}

const statusColor: Record<string, string> = {
  brief: "bg-muted text-muted-foreground",
  editing: "bg-blue-500/20 text-blue-600 dark:text-blue-400",
  review: "bg-yellow-500/20 text-yellow-600 dark:text-yellow-400",
  revision: "bg-orange-500/20 text-orange-600 dark:text-orange-400",
  approved: "bg-green-500/20 text-green-600 dark:text-green-400",
  delivered: "bg-purple-500/20 text-purple-600 dark:text-purple-400",
}

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats>({
    activeClients: 0,
    activeProjects: 0,
    pendingReviews: 0,
    pendingPayments: 0,
  })
  const [projects, setProjects] = useState<RecentProject[]>([])
  const [activities, setActivities] = useState<RecentActivity[]>([])
  const [userName, setUserName] = useState("there")
  const [loading, setLoading] = useState(true)

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
        } else {
          const metaName = user.user_metadata?.full_name
          if (metaName) {
            setUserName(metaName.split(" ")[0])
          }
          await supabase.from("profiles").upsert({
            id: user.id,
            full_name: metaName || "",
            email: user.email || "",
            phone: user.user_metadata?.phone || "",
            role: user.user_metadata?.role || "editor",
          }, { onConflict: "id" })
        }

        const [clientsRes, projectsRes, videosRes, invoicesRes, activitiesRes] = await Promise.all([
          supabase.from("clients").select("id", { count: "exact", head: true }).eq("editor_id", user.id).eq("status", "active"),
          supabase.from("projects").select("id, name, status, progress, clients(name)", { count: "exact" }).eq("editor_id", user.id).order("created_at", { ascending: false }).limit(5),
          supabase.from("videos").select("id", { count: "exact", head: true }).eq("uploaded_by", user.id).eq("status", "awaiting_review"),
          supabase.from("invoices").select("amount, clients!inner(editor_id)").eq("clients.editor_id", user.id).in("status", ["sent", "overdue"]),
          supabase.from("activities").select("id, description, created_at").eq("user_id", user.id).order("created_at", { ascending: false }).limit(5),
        ])

        const totalPayments = invoicesRes.data?.reduce((sum: number, inv: any) => sum + (inv.amount || 0), 0) ?? 0

        setStats({
          activeClients: clientsRes.count ?? 0,
          activeProjects: projectsRes.count ?? 0,
          pendingReviews: videosRes.count ?? 0,
          pendingPayments: totalPayments,
        })

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

        if (activitiesRes.data && activitiesRes.data.length > 0) {
          setActivities(
            activitiesRes.data.map((a: any) => ({
              id: a.id,
              description: a.description,
              time: new Date(a.created_at).toLocaleDateString(),
            }))
          )
        }
      } catch {
        // Keep empty state
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [])

  const statCards = [
    { label: "Active Clients", value: stats.activeClients, icon: Users, color: "bg-blue-500/20 text-blue-600 dark:text-blue-400" },
    { label: "Active Projects", value: stats.activeProjects, icon: FolderKanban, color: "bg-green-500/20 text-green-600 dark:text-green-400" },
    { label: "Pending Reviews", value: stats.pendingReviews, icon: Video, color: "bg-yellow-500/20 text-yellow-600 dark:text-yellow-400" },
    { label: "Pending Payments", value: formatINR(stats.pendingPayments), icon: FileText, color: "bg-purple-500/20 text-purple-600 dark:text-purple-400" },
  ]

  const isEmpty = !loading && stats.activeClients === 0 && stats.activeProjects === 0

  return (
    <div className="p-6 space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-foreground">
          {getGreeting()}, {userName}
        </h1>
        <div className="text-muted-foreground mt-1">
          Here&apos;s what&apos;s happening with your workspace.
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((card) => (
          <GlassCard key={card.label} className="p-5">
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

      {isEmpty ? (
        <GlassCard className="p-12 text-center">
          <FolderKanban className="h-16 w-16 text-muted-foreground/30 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-foreground mb-2">Welcome to ClientRegit</h2>
          <p className="text-muted-foreground mb-6 max-w-md mx-auto">
            Get started by adding your first client. Once you have clients, you can create projects, upload videos, and track invoices.
          </p>
          <Link href="/clients">
            <Button className="bg-primary text-primary-foreground hover:bg-primary/90">
              <Plus className="h-4 w-4 mr-2" />
              Add Your First Client
            </Button>
          </Link>
        </GlassCard>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <GlassCard className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-foreground">Recent Projects</h2>
                <Link
                  href="/projects"
                  className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors"
                >
                  View all <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
              {projects.length === 0 ? (
                <div className="text-center py-12">
                  <FolderKanban className="h-12 w-12 text-muted-foreground/30 mx-auto mb-3" />
                  <p className="text-muted-foreground mb-4">No projects yet.</p>
                  <Link href="/projects">
                    <Button variant="outline" className="border-border text-foreground hover:bg-muted">
                      <Plus className="h-4 w-4 mr-2" />
                      Create Project
                    </Button>
                  </Link>
                </div>
              ) : (
                <div className="space-y-3">
                  {projects.map((project) => (
                    <div
                      key={project.id}
                      className="flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                    >
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">{project.name}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">{project.client}</p>
                      </div>
                      <div className="flex items-center gap-3 ml-4">
                        <div className="w-24">
                          <div className="h-1.5 rounded-full bg-border overflow-hidden">
                            <div
                              className="h-full rounded-full bg-gradient-to-r from-blue-500 to-cyan-400"
                              style={{ width: `${project.progress}%` }}
                            />
                          </div>
                          <p className="text-[10px] text-muted-foreground text-right mt-0.5">{project.progress}%</p>
                        </div>
                        <Badge className={`${statusColor[project.status] ?? "bg-muted text-muted-foreground"} border-0`}>
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
                <h2 className="text-lg font-semibold text-foreground">Recent Activity</h2>
              </div>
              {activities.length === 0 ? (
                <div className="text-center py-12">
                  <Clock className="h-12 w-12 text-muted-foreground/30 mx-auto mb-3" />
                  <p className="text-muted-foreground">No recent activity to show.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {activities.map((activity) => (
                    <div key={activity.id} className="flex gap-3">
                      <div className="h-2 w-2 rounded-full bg-blue-500 mt-2 flex-shrink-0" />
                      <div>
                        <p className="text-sm text-foreground/80">{activity.description}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">{activity.time}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </GlassCard>
          </div>
        </div>
      )}
    </div>
  )
}