import { useEffect, useState } from "react"
import { Link } from "react-router-dom"
import { MessageSquare, Video, Calendar, ArrowRight, CheckCircle, AlertCircle } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { GlassCard } from "@/components/layout/glass-card"
import { useAuth } from "@/contexts/AuthContext"
import { api } from "@/services/api"
import { formatDate } from "@/lib/utils"

interface RevisionItem {
  id: number | string
  action: string
  description: string
  created_at: string
  video_id: number
  video_title: string
  video_status: string
  version: number
  project_id?: number
  project_name?: string
  project_status?: string
  project_progress?: number
  project_deadline?: string
}

const statusStyles: Record<string, string> = {
  awaiting_review: "bg-yellow-500/20 text-yellow-600 dark:text-yellow-400 border-0",
  revision_requested: "bg-orange-500/20 text-orange-600 dark:text-orange-400 border-0",
  approved: "bg-green-500/20 text-green-600 dark:text-green-400 border-0",
}

export default function RevisionsPage() {
  const { user } = useAuth()
  const [items, setItems] = useState<RevisionItem[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) return
    api.get<{ success: boolean; data: RevisionItem[] }>("/dashboard/revisions")
      .then((response) => setItems(response.data || []))
      .catch(() => setItems([]))
      .finally(() => setLoading(false))
  }, [user])

  return (
    <div className="p-6 space-y-6 animate-fade-in">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Revisions</h1>
          <p className="mt-1 text-muted-foreground">Client feedback, change requests, approvals, and videos waiting for review.</p>
        </div>
        <Badge className="bg-primary/10 text-primary border-0">{items.length} updates</Badge>
      </div>

      {loading ? (
        <GlassCard className="p-12 text-center text-muted-foreground">Loading revisions...</GlassCard>
      ) : items.length === 0 ? (
        <GlassCard className="p-12 text-center">
          <MessageSquare className="mx-auto mb-3 h-12 w-12 text-muted-foreground/40" />
          <p className="text-muted-foreground">No client feedback or pending reviews yet.</p>
        </GlassCard>
      ) : (
        <div className="space-y-4">
          {items.map((item) => (
            <GlassCard key={`${item.id}-${item.video_id}`} className="p-5">
              <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                <div className="flex gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                    {item.action === "approved" ? <CheckCircle className="h-5 w-5 text-green-500" /> : item.action === "revision_requested" ? <AlertCircle className="h-5 w-5 text-orange-500" /> : <MessageSquare className="h-5 w-5 text-primary" />}
                  </div>
                  <div>
                    <p className="font-medium text-foreground">{item.description}</p>
                    <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1"><Video className="h-3.5 w-3.5" />{item.video_title} v{item.version}</span>
                      {item.project_name && <span>{item.project_name}</span>}
                      <span className="flex items-center gap-1"><Calendar className="h-3.5 w-3.5" />{formatDate(item.created_at)}</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3 md:shrink-0">
                  <Badge className={statusStyles[item.video_status] || "bg-muted text-muted-foreground border-0"}>{item.video_status.replace(/_/g, " ")}</Badge>
                  <Link to={`/videos/${item.video_id}`} className="inline-flex items-center gap-1 text-sm text-primary hover:underline">Open review <ArrowRight className="h-4 w-4" /></Link>
                </div>
              </div>
              {item.project_name && (
                <div className="mt-4 rounded-md bg-muted/50 p-3 text-xs text-muted-foreground">
                  Project: <span className="font-medium text-foreground">{item.project_name}</span>
                  {item.project_progress !== undefined && <span className="ml-4">Progress: <span className="text-foreground">{item.project_progress}%</span></span>}
                  {item.project_deadline && <span className="ml-4">Deadline: <span className="text-foreground">{formatDate(item.project_deadline)}</span></span>}
                </div>
              )}
            </GlassCard>
          ))}
        </div>
      )}
    </div>
  )
}
