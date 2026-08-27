"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { GlassCard } from "@/components/layout/glass-card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  ArrowLeft,
  FolderKanban,
  Play,
} from "lucide-react"
import { formatDate } from "@/lib/utils"
import Link from "next/link"

interface VideoData {
  id: string
  title: string
  version: number
  status: string
  created_at: string
}

interface ProjectDetail {
  id: string
  name: string
  status: string
  progress: number
  deadline: string | null
  description: string | null
}

const demoProject: ProjectDetail = {
  id: "1",
  name: "YouTube Episode 42",
  status: "review",
  progress: 80,
  deadline: "2026-12-15",
  description: "Final cut review for YouTube Episode 42",
}

const demoVideos: VideoData[] = [
  { id: "v1", title: "Full Episode Cut - Draft 3", version: 3, status: "awaiting_review", created_at: "2026-12-10" },
  { id: "v2", title: "Intro Sequence Revision", version: 2, status: "approved", created_at: "2026-12-08" },
  { id: "v3", title: "Full Episode Cut - Draft 1", version: 1, status: "approved", created_at: "2026-12-02" },
]

const statusColor: Record<string, string> = {
  brief: "bg-muted text-muted-foreground",
  editing: "bg-blue-500/20 text-blue-600 dark:text-blue-400",
  review: "bg-yellow-500/20 text-yellow-600 dark:text-yellow-400",
  revision: "bg-orange-500/20 text-orange-600 dark:text-orange-400",
  approved: "bg-green-500/20 text-green-600 dark:text-green-400",
  delivered: "bg-purple-500/20 text-purple-600 dark:text-purple-400",
  awaiting_review: "bg-yellow-500/20 text-yellow-600 dark:text-yellow-400",
}

const progressGradients: Record<string, string> = {
  brief: "from-slate-400 to-slate-500",
  editing: "from-blue-500 to-cyan-400",
  review: "from-yellow-500 to-amber-400",
  revision: "from-orange-500 to-amber-400",
  approved: "from-green-500 to-emerald-400",
  delivered: "from-purple-500 to-violet-400",
}

export default function ClientProjectDetailPage() {
  const params = useParams()
  const router = useRouter()
  const projectId = params.id as string

  const [project, setProject] = useState<ProjectDetail>(demoProject)
  const [videos, setVideos] = useState<VideoData[]>(demoVideos)
  const [isDemo, setIsDemo] = useState(true)

  useEffect(() => {
    async function loadData() {
      try {
        const supabase = createClient()
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return

        // Get client record by email
        const { data: profile } = await supabase
          .from("profiles")
          .select("email")
          .eq("id", user.id)
          .single()

        const clientEmail = profile?.email || user.email
        const { data: clientRecord } = await supabase
          .from("clients")
          .select("id")
          .eq("email", clientEmail)
          .single()

        if (clientRecord) {
          const { data: projectData } = await supabase
            .from("projects")
            .select("id, name, status, progress, deadline, description")
            .eq("id", projectId)
            .eq("client_id", clientRecord.id)
            .single()

          if (projectData) {
            setIsDemo(false)
            setProject({
              id: projectData.id,
              name: projectData.name,
              status: projectData.status,
              progress: projectData.progress ?? 0,
              deadline: projectData.deadline,
              description: projectData.description,
            })

            const { data: videoData } = await supabase
              .from("videos")
              .select("id, title, version, status, created_at")
              .eq("project_id", projectId)
              .order("version", { ascending: false })

            if (videoData && videoData.length > 0) {
              setVideos(videoData.map((v: any) => ({
                id: v.id,
                title: v.title,
                version: v.version,
                status: v.status,
                created_at: v.created_at,
              })))
            }
          }
        }
      } catch {
        // Keep demo data
      }
    }

    loadData()
  }, [projectId])

  return (
    <div className="p-6 space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => router.push("/client/dashboard")}
          className="text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-foreground">{project.name}</h1>
          <div className="flex items-center gap-3 mt-1">
            <Badge className={`${statusColor[project.status] ?? "bg-muted text-muted-foreground"} border-0`}>
              {project.status}
            </Badge>
            {project.deadline && (
              <span className="text-sm text-muted-foreground">Due {formatDate(project.deadline)}</span>
            )}
            {isDemo && (
              <Badge variant="secondary" className="text-xs">
                Demo Data
              </Badge>
            )}
          </div>
        </div>
      </div>

      {/* Description */}
      {project.description && (
        <GlassCard className="p-4">
          <p className="text-sm text-muted-foreground">{project.description}</p>
        </GlassCard>
      )}

      {/* Progress */}
      <GlassCard className="p-4">
        <div className="flex items-center justify-between mb-2">
          <p className="text-sm text-muted-foreground">Project Progress</p>
          <p className="text-sm font-medium text-foreground">{project.progress}%</p>
        </div>
        <div className="h-2.5 rounded-full bg-border overflow-hidden">
          <div
            className={`h-full rounded-full bg-gradient-to-r ${progressGradients[project.status] ?? "from-muted-foreground/30 to-muted-foreground/50"}`}
            style={{ width: `${project.progress}%` }}
          />
        </div>
      </GlassCard>

      {/* Videos */}
      <GlassCard className="p-6">
        <h2 className="text-lg font-semibold text-foreground mb-4">Videos</h2>
        {videos.length === 0 ? (
          <div className="text-center py-12">
            <FolderKanban className="h-12 w-12 text-muted-foreground/30 mx-auto mb-3" />
            <p className="text-muted-foreground">No videos uploaded for this project yet.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {videos.map((video) => (
              <div
                key={video.id}
                className="flex items-center justify-between p-4 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium text-foreground truncate">{video.title}</p>
                    <Badge variant="secondary" className="text-[10px] flex-shrink-0">
                      v{video.version}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge className={`${statusColor[video.status] ?? "bg-muted text-muted-foreground"} border-0 text-[10px]`}>
                      {video.status.replace(/_/g, " ")}
                    </Badge>
                    <p className="text-xs text-muted-foreground">{formatDate(video.created_at)}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 ml-4 flex-shrink-0">
                  <Link href={`/videos/${video.id}`}>
                    <Button variant="outline" size="sm" className="text-xs border-border text-foreground hover:bg-muted">
                      <Play className="h-3.5 w-3.5 mr-1.5" />
                      Watch
                    </Button>
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </GlassCard>
    </div>
  )
}
