"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { GlassCard } from "@/components/layout/glass-card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Video as VideoIcon, Play, ExternalLink, Plus } from "lucide-react"
import { formatDate } from "@/lib/utils"
import Link from "next/link"

interface VideoData {
  id: string
  title: string
  project: string
  version: number
  status: "draft" | "awaiting_review" | "revision_requested" | "approved"
  created_at: string
}

const statusConfig: Record<string, { label: string; className: string }> = {
  draft: { label: "Draft", className: "bg-muted text-muted-foreground border-0" },
  awaiting_review: { label: "Awaiting Review", className: "bg-yellow-500/20 text-yellow-400 border-0" },
  revision_requested: { label: "Revision Requested", className: "bg-orange-500/20 text-orange-400 border-0" },
  approved: { label: "Approved", className: "bg-green-500/20 text-green-400 border-0" },
}

export default function VideosPage() {
  const [videos, setVideos] = useState<VideoData[]>([])

  useEffect(() => {
    async function loadVideos() {
      try {
        const supabase = createClient()
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return

        const { data } = await supabase
          .from("videos")
          .select("*, projects(name)")
          .eq("uploaded_by", user.id)
          .order("created_at", { ascending: false })

        if (data) {
          setVideos(
            data.map((v: any) => ({
              id: v.id,
              title: v.title,
              project: v.projects?.name ?? "Unknown Project",
              version: v.version,
              status: v.status,
              created_at: v.created_at,
            }))
          )
        }
      } catch {
        setVideos([])
      }
    }

    loadVideos()
  }, [])

  return (
    <div className="p-6 space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Videos</h1>
          <p className="text-muted-foreground mt-1">Review and manage all uploaded videos.</p>
        </div>
      </div>

      {videos.length === 0 ? (
        <GlassCard className="p-16 text-center">
          <VideoIcon className="h-12 w-12 text-muted-foreground/30 mx-auto mb-3" />
          <p className="text-muted-foreground mb-4">No videos yet. Upload your first video to get started.</p>
          <Button variant="glass" size="sm" asChild>
            <Link href="/projects">
              <Plus className="h-4 w-4 mr-2" />
              Upload Video
            </Link>
          </Button>
        </GlassCard>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {videos.map((video) => (
            <Link key={video.id} href={`/videos/${video.id}`}>
              <GlassCard className="p-5 hover:bg-muted transition-all cursor-pointer group h-full">
                <div className="flex items-start gap-4">
                  <div className="h-16 w-24 rounded-lg bg-muted flex items-center justify-center flex-shrink-0 group-hover:bg-accent transition-colors">
                    <Play className="h-6 w-6 text-muted-foreground group-hover:text-foreground transition-colors" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="font-medium text-foreground truncate">{video.title}</h3>
                      <ExternalLink className="h-4 w-4 text-muted-foreground/30 group-hover:text-muted-foreground flex-shrink-0 mt-0.5 transition-colors" />
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">{video.project}</p>
                    <div className="flex items-center gap-3 mt-3">
                      <Badge className={statusConfig[video.status].className}>
                        {statusConfig[video.status].label}
                      </Badge>
                      <span className="text-xs text-muted-foreground/50">v{video.version}</span>
                      <span className="text-xs text-muted-foreground/50">{formatDate(video.created_at)}</span>
                    </div>
                  </div>
                </div>
              </GlassCard>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}