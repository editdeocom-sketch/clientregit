import { useEffect, useState } from "react"
import { Link } from "react-router-dom"
import { GlassCard } from "@/components/layout/glass-card"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Users, FolderKanban, Video, FileText, Clock, ArrowRight, Plus, TrendingUp, Calendar, CheckCircle, MessageSquare } from "lucide-react"
import { usePreferences } from "@/contexts/PreferencesContext"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/contexts/AuthContext"
import api from "@/services/api"

interface DashboardStats {
  activeClients: number
  activeProjects: number
  pendingReviews: number
  pendingPayments: number
  totalRevenue: number
  projectEarnings: ProjectEarning[]
  completedProjects: number
  overdueTasks: number
}

interface ProjectEarning {
  id: number
  name: string
  client_name?: string
  budget: number
  amount_paid: number
  remaining_amount: number
  invoiced_amount: number
  invoiced_paid: number
  paid_amount: number
}

interface RecentProject {
  id: string
  name: string
  client: string
  status: string
  progress: number
  deadline: string | null
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
  const { user } = useAuth()
  const { formatAmount } = usePreferences()
  const [stats, setStats] = useState<DashboardStats>({
    activeClients: 0,
    activeProjects: 0,
    pendingReviews: 0,
    pendingPayments: 0,
    totalRevenue: 0,
    completedProjects: 0,
    overdueTasks: 0,
    projectEarnings: [],
  })
  const [projects, setProjects] = useState<RecentProject[]>([])
  const [activities, setActivities] = useState<RecentActivity[]>([])
  const [userName, setUserName] = useState("there")
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadData() {
      try {
        if (user?.name) {
          setUserName(user.name.split(" ")[0])
        }

        const res = await api.get<{ success: boolean; data: any }>('/dashboard/stats')
        if (res.success && res.data) {
          const d = res.data
          setStats({
            activeClients: d.activeClients || 0,
            activeProjects: d.activeProjects || 0,
            pendingReviews: d.awaitingReviewVideos || 0,
            pendingPayments: d.outstandingBalance || 0,
            totalRevenue: d.totalRevenue || 0,
            completedProjects: d.completedProjects || 0,
            overdueTasks: d.pendingTasks || 0,
            projectEarnings: d.projectEarnings || [],
          })

          if (d.recentProjects) {
            setProjects(d.recentProjects.map((p: any) => ({
              id: p.id,
              name: p.name,
              client: p.client_name || "Unknown",
              status: p.status,
              progress: p.progress || 0,
              deadline: p.deadline,
            })))
          }

          if (d.recentActivity) {
            setActivities(d.recentActivity.map((a: any) => ({
              id: a.id,
              description: a.description,
              time: new Date(a.created_at).toLocaleDateString(),
            })))
          }
        }
      } catch {
        // Keep empty state
      } finally {
        setLoading(false)
      }
    }

    if (user) loadData()
  }, [user])

  const [financialView, setFinancialView] = useState<"revenue" | "pending" | null>(null)

  const statCards = [
    { label: "Active Clients", value: stats.activeClients, icon: Users, color: "bg-blue-500/20 text-blue-600 dark:text-blue-400" },
    { label: "Active Projects", value: stats.activeProjects, icon: FolderKanban, color: "bg-green-500/20 text-green-600 dark:text-green-400" },
    { label: "Pending Reviews", value: stats.pendingReviews, icon: Video, color: "bg-yellow-500/20 text-yellow-600 dark:text-yellow-400" },
    { label: "Total Revenue / Earnings", value: formatAmount(stats.totalRevenue), icon: TrendingUp, color: "bg-emerald-500/20 text-emerald-600 dark:text-emerald-400", view: "revenue" as const },
    { label: "Pending Payments", value: formatAmount(stats.pendingPayments), icon: FileText, color: "bg-purple-500/20 text-purple-600 dark:text-purple-400", view: "pending" as const },
  ]

  const quickActions = [
    { label: "Add Client", to: "/clients", icon: Users },
    { label: "New Project", to: "/projects", icon: FolderKanban },
    { label: "Upload Video", to: "/videos", icon: Video },
    { label: "Create Invoice", to: "/invoices", icon: FileText },
  ]

  const isEmpty = !loading && stats.activeClients === 0 && stats.activeProjects === 0

  return (
    <div className="p-6 space-y-6 animate-fade-in">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">
            {getGreeting()}, {userName}
          </h1>
          <div className="text-muted-foreground mt-1">
            Here&apos;s what&apos;s happening with your workspace.
          </div>
        </div>
        <Link to="/revisions" className="inline-flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-sm font-medium text-foreground hover:bg-muted">
          <MessageSquare className="h-4 w-4" />
          Revisions
        </Link>
      </div>

      {!isEmpty && (
        <div className="flex flex-wrap gap-3">
          {quickActions.map((action) => (
            <Link key={action.label} to={action.to}>
              <Button variant="outline" className="border-border text-foreground hover:bg-muted">
                <action.icon className="h-4 w-4 mr-2" />
                {action.label}
              </Button>
            </Link>
          ))}
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {statCards.map((card) => (
          <GlassCard key={card.label} className={`p-5 hover-lift transition-all duration-300 ${card.view ? "cursor-pointer" : ""}`} onClick={() => card.view && setFinancialView(card.view)}>
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
          <Link to="/clients">
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
                  to="/projects"
                  className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors"
                >
                  View all <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
              {projects.length === 0 ? (
                <div className="text-center py-12">
                  <FolderKanban className="h-12 w-12 text-muted-foreground/30 mx-auto mb-3" />
                  <p className="text-muted-foreground mb-4">No projects yet.</p>
                  <Link to="/projects">
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
                        {project.deadline && (
                          <div className="flex items-center gap-1 text-xs text-muted-foreground">
                            <Calendar className="h-3 w-3" />
                            {new Date(project.deadline).toLocaleDateString()}
                          </div>
                        )}
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

          <div className="space-y-6">
            <GlassCard className="p-6">
              <h2 className="text-lg font-semibold text-foreground mb-4">Quick Stats</h2>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-lg bg-green-500/20 flex items-center justify-center">
                      <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-foreground">Completed</p>
                      <p className="text-xs text-muted-foreground">{stats.completedProjects} projects</p>
                    </div>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-lg bg-yellow-500/20 flex items-center justify-center">
                      <TrendingUp className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-foreground">To-Do Tasks</p>
                      <p className="text-xs text-muted-foreground">{stats.overdueTasks} tasks</p>
                    </div>
                  </div>
                </div>
              </div>
            </GlassCard>

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
                      <div className="h-2 w-2 rounded-full bg-primary mt-2 flex-shrink-0" />
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

      <Dialog open={financialView !== null} onOpenChange={(open) => !open && setFinancialView(null)}>
        <DialogContent className="max-w-3xl bg-card border-border text-foreground">
          <DialogHeader>
            <DialogTitle>{financialView === "revenue" ? "Total Revenue / Earnings" : "Pending Payments"}</DialogTitle>
            <DialogDescription className="text-muted-foreground">
              Project-wise financial details synced from SQLite.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-2">
            {stats.projectEarnings.filter((project) => financialView === "revenue" || project.remaining_amount > 0).length === 0 ? (
              <p className="py-8 text-center text-muted-foreground">No project financial records found.</p>
            ) : (
              stats.projectEarnings
                .filter((project) => financialView === "revenue" || project.remaining_amount > 0)
                .map((project) => (
                  <div key={project.id} className="rounded-lg border border-border bg-muted/40 p-4">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <p className="font-medium text-foreground">{project.name}</p>
                        <p className="text-xs text-muted-foreground">{project.client_name || "No client"}</p>
                      </div>
                      <div className="grid grid-cols-2 gap-4 text-right text-sm sm:grid-cols-4">
                        <div><p className="text-xs text-muted-foreground">Budget</p><p className="font-medium text-foreground">{formatAmount(project.budget || 0)}</p></div>
                        <div><p className="text-xs text-muted-foreground">Paid Amount</p><p className="font-medium text-green-600 dark:text-green-400">{formatAmount(project.paid_amount || project.amount_paid || project.invoiced_paid || 0)}</p></div>
                        <div><p className="text-xs text-muted-foreground">Remaining</p><p className="font-medium text-yellow-600 dark:text-yellow-400">{formatAmount(Math.max(0, (project.budget || project.invoiced_amount || 0) - (project.paid_amount || project.amount_paid || project.invoiced_paid || 0)))}</p></div>
                        <div>
                          <p className="text-xs text-muted-foreground">Payment Status</p>
                          {(() => {
                            const paid = project.paid_amount || project.amount_paid || project.invoiced_paid || 0
                            const due = project.budget || project.invoiced_amount || 0
                            const label = due > 0 && paid >= due ? "Paid" : paid > 0 ? "Partially Paid" : "Pending"
                            const color = label === "Paid" ? "text-green-600 dark:text-green-400" : label === "Partially Paid" ? "text-orange-600 dark:text-orange-400" : "text-yellow-600 dark:text-yellow-400"
                            return <p className={`font-medium ${color}`}>{label}</p>
                          })()}
                        </div>
                      </div>
                    </div>
                    {project.invoiced_amount > 0 && <p className="mt-3 border-t border-border pt-2 text-xs text-muted-foreground">Invoiced: <span className="text-foreground">{formatAmount(project.invoiced_amount)}</span></p>}
                  </div>
                ))
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
