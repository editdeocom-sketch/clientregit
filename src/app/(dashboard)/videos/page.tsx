"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { GlassCard } from "@/components/layout/glass-card"
import { Badge } from "@/components/ui/badge"
import { Video as VideoIcon, Play, ExternalLink } from "lucide-react"
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

const demoVideos: VideoData[] = [
  { id: "1", title: "YouTube Episode 42 — Rough Cut", project: "YouTube Episode 42", version: 1, status: "awaiting_review", created_at: "2026-08-24T10:00:00Z" },
  { id: "2", title: "Instagram Reel #1 — Final", project: "Instagram Reel Campaign", version: 3, status: "approved", created_at: "2026-08-23T14:30:00Z" },
  { id: "3", title: "Product Commercial — V2", project: "Product Commercial", version: 2, status: "revision_requested", created_at: "2026-08-22T09:15:00Z" },
  { id: "4", title: "Corporate Training — Intro", project: "Corporate Training Video", version: 1, status: "draft", created_at: "2026-08-21T16:45:00Z" },
]

const statusConfig: Record<string, { label: string; className: string }> = {
  draft: { label: "Draft", className: "bg-white/10 text-white/60 border-0" },
  awaiting_review: { label: "Awaiting Review", className: "bg-yellow-500/20 text-yellow-400 border-0" },
  revision_requested: { label: "Revision Requested", className: "bg-orange-500/20 text-orange-400 border-0" },
  approved: { label: "Approved", className: "bg-green-500/20 text-green-400 border-0" },
}

export default function VideosPage() {
  const [videos, setVideos] = useState<VideoData[]>([])
  const [isDemo, setIsDemo] = useState(true)

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

        if (data && data.length > 0) {
          setIsDemo(false)
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
        } else {
          setVideos(demoVideos)
        }
      } catch {
        setVideos(demoVideos)
      }
    }

    loadVideos()
  }, [])

  return (
    <div className="p-6 space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-white">Videos</h1>
        <p className="text-white/50 mt-1">Review and manage all uploaded videos.</p>
      </div>

      {isDemo && (
        <Badge variant="glass" className="text-xs">
          Showing demo data — connect Supabase to load real videos
        </Badge>
      )}

      {videos.length === 0 ? (
        <GlassCard className="p-16 text-center">
          <VideoIcon className="h-12 w-12 text-white/20 mx-auto mb-3" />
          <p className="text-white/40">No videos uploaded yet. Upload your first video from a project.</p>
        </GlassCard>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {videos.map((video) => (
            <Link key={video.id} href={`/videos/${video.id}`}>
              <GlassCard className="p-5 hover:bg-white/10 transition-all cursor-pointer group h-full">
                <div className="flex items-start gap-4">
                  <div className="h-16 w-24 rounded-lg bg-white/5 flex items-center justify-center flex-shrink-0 group-hover:bg-white/10 transition-colors">
                    <Play className="h-6 w-6 text-white/40 group-hover:text-white/70 transition-colors" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="font-medium text-white truncate">{video.title}</h3>
                      <ExternalLink className="h-4 w-4 text-white/20 group-hover:text-white/50 flex-shrink-0 mt-0.5 transition-colors" />
                    </div>
                    <p className="text-sm text-white/50 mt-1">{video.project}</p>
                    <div className="flex items-center gap-3 mt-3">
                      <Badge className={statusConfig[video.status].className}>
                        {statusConfig[video.status].label}
                      </Badge>
                      <span className="text-xs text-white/30">v{video.version}</span>
                      <span className="text-xs text-white/30">{formatDate(video.created_at)}</span>
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
