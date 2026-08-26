"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { GlassCard } from "@/components/layout/glass-card"
import {
  Video,
  Play,
  Pause,
  SkipBack,
  SkipForward,
  MessageSquare,
  Check,
  X,
  Clock,
  ArrowLeft,
  Send,
} from "lucide-react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { toast } from "sonner"
import { formatVideoTime } from "@/lib/utils"

const demoComments = [
  { id: "1", user: "Rahul", timestamp: 14, comment: "Make the title sequence bigger and more prominent" },
  { id: "2", user: "Rahul", timestamp: 27, comment: "Replace this shot with the alternative take" },
  { id: "3", user: "Rahul", timestamp: 65, comment: "Great transition here, keep this!" },
  { id: "4", user: "Alex", timestamp: 105, comment: "Can we add background music starting from here?" },
]

const videoData = {
  title: "YouTube Episode 42 - Final Cut",
  project: "YouTube Episode 42",
  version: 3,
  status: "awaiting_review",
  uploadedAt: "Dec 10, 2026",
  duration: 155,
}

export default function VideoReviewPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const [currentTime, setCurrentTime] = useState(14)
  const [isPlaying, setIsPlaying] = useState(false)
  const [comments, setComments] = useState(demoComments)
  const [newComment, setNewComment] = useState("")
  const [status, setStatus] = useState(videoData.status)
  const [approvalOpen, setApprovalOpen] = useState(false)
  const [revisionOpen, setRevisionOpen] = useState(false)
  const [revisionText, setRevisionText] = useState("")

  const progress = (currentTime / videoData.duration) * 100

  const handleTimelineClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect()
    const x = e.clientX - rect.left
    const percentage = x / rect.width
    const time = Math.floor(percentage * videoData.duration)
    setCurrentTime(Math.max(0, Math.min(time, videoData.duration)))
  }

  const handleAddComment = () => {
    if (!newComment.trim()) return
    const comment = {
      id: String(Date.now()),
      user: "You",
      timestamp: currentTime,
      comment: newComment.trim(),
    }
    setComments((prev) => [...prev, comment])
    setNewComment("")
    toast.success("Comment added")
  }

  const handleApprove = () => {
    setStatus("approved")
    setApprovalOpen(false)
    toast.success("Video approved!")
  }

  const handleRevision = () => {
    setStatus("revision_requested")
    setRevisionOpen(false)
    setRevisionText("")
    toast.success("Revision requested")
  }

  return (
    <div className="min-h-screen bg-background p-6 lg:p-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <Link
          href="/videos"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Videos
        </Link>

        <GlassCard className="overflow-hidden p-0">
          <div
            className="relative flex aspect-video w-full cursor-pointer items-center justify-center bg-gradient-to-br from-card to-background"
            onClick={() => setIsPlaying(!isPlaying)}
          >
            <div className="flex flex-col items-center gap-4">
              <div className="flex h-24 w-24 items-center justify-center rounded-full bg-muted ring-1 ring-border">
                <Video className="h-12 w-12 text-muted-foreground" />
              </div>
              <button className="flex h-16 w-16 items-center justify-center rounded-full bg-blue-600 text-white shadow-lg shadow-blue-600/30 transition-all hover:scale-105 hover:bg-blue-500">
                {isPlaying ? <Pause className="h-7 w-7" /> : <Play className="ml-1 h-7 w-7" />}
              </button>
            </div>
          </div>

          <div className="space-y-3 px-6 py-4">
            <div
              className="group relative h-2 w-full cursor-pointer rounded-full bg-muted"
              onClick={handleTimelineClick}
            >
              <div
                className="absolute left-0 top-0 h-full rounded-full bg-blue-600 transition-all"
                style={{ width: `${progress}%` }}
              />
              <div
                className="absolute top-1/2 h-4 w-4 -translate-x-1/2 -translate-y-1/2 rounded-full bg-blue-600 shadow-lg shadow-blue-600/40 transition-all group-hover:scale-125"
                style={{ left: `${progress}%` }}
              />
            </div>

            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span className="font-mono">{formatVideoTime(currentTime)}</span>
              <span className="font-mono">{formatVideoTime(videoData.duration)}</span>
            </div>

            <div className="flex items-center justify-center gap-4">
              <Button
                variant="ghost"
                size="icon"
                className="h-10 w-10 rounded-full text-muted-foreground hover:text-foreground"
                onClick={() => setCurrentTime(Math.max(0, currentTime - 10))}
              >
                <SkipBack className="h-5 w-5" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="flex h-12 w-12 items-center justify-center rounded-full bg-muted text-foreground hover:bg-muted/80"
                onClick={() => setIsPlaying(!isPlaying)}
              >
                {isPlaying ? <Pause className="h-5 w-5" /> : <Play className="ml-0.5 h-5 w-5" />}
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-10 w-10 rounded-full text-muted-foreground hover:text-foreground"
                onClick={() => setCurrentTime(Math.min(videoData.duration, currentTime + 10))}
              >
                <SkipForward className="h-5 w-5" />
              </Button>
            </div>
          </div>
        </GlassCard>

        <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
          <GlassCard className="space-y-4 p-5">
            <div className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5 text-muted-foreground" />
              <h2 className="text-lg font-semibold text-foreground">Comments</h2>
              <Badge variant="secondary" className="bg-muted text-muted-foreground">
                {comments.length}
              </Badge>
            </div>

            <div className="space-y-3 max-h-[400px] overflow-y-auto pr-1">
              {comments
                .sort((a, b) => a.timestamp - b.timestamp)
                .map((c) => (
                  <div
                    key={c.id}
                    className="flex items-start gap-3 rounded-lg bg-muted/30 p-3 ring-1 ring-border/50 transition-colors hover:bg-muted/50"
                  >
                    <button
                      className="flex shrink-0 items-center gap-1 rounded-full bg-blue-600/20 px-2.5 py-1 text-xs font-medium text-blue-600 dark:text-blue-400 transition-colors hover:bg-blue-600/30"
                      onClick={() => setCurrentTime(c.timestamp)}
                    >
                      <Clock className="h-3 w-3" />
                      {formatVideoTime(c.timestamp)}
                    </button>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm text-foreground">{c.comment}</p>
                      <p className="mt-1 text-xs text-muted-foreground">{c.user}</p>
                    </div>
                  </div>
                ))}
            </div>

            <div className="flex items-center gap-2 border-t border-border/50 pt-4">
              <Input
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder={`Add a comment at ${formatVideoTime(currentTime)}...`}
                className="flex-1 border-border bg-muted text-foreground placeholder:text-muted-foreground focus-visible:ring-blue-600"
                onKeyDown={(e) => e.key === "Enter" && handleAddComment()}
              />
              <Button
                size="icon"
                onClick={handleAddComment}
                disabled={!newComment.trim()}
                className="h-10 w-10 shrink-0 bg-blue-600 text-white hover:bg-blue-500"
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </GlassCard>

          <GlassCard className="space-y-5 p-5">
            <h2 className="text-lg font-semibold text-foreground">Video Info</h2>

            <div className="space-y-3">
              <div>
                <p className="text-xs text-muted-foreground">Status</p>
                <Badge
                  variant="secondary"
                  className={`mt-1 ${
                    status === "approved"
                      ? "bg-emerald-500/20 text-emerald-600 dark:text-emerald-400"
                      : status === "revision_requested"
                        ? "bg-red-500/20 text-red-600 dark:text-red-400"
                        : "bg-yellow-500/20 text-yellow-600 dark:text-yellow-400"
                  }`}
                >
                  {status === "approved"
                    ? "Approved"
                    : status === "revision_requested"
                      ? "Revision Requested"
                      : "Awaiting Review"}
                </Badge>
              </div>

              <div>
                <p className="text-xs text-muted-foreground">Project</p>
                <p className="text-sm font-medium text-foreground">{videoData.project}</p>
              </div>

              <div>
                <p className="text-xs text-muted-foreground">Version</p>
                <p className="text-sm font-medium text-foreground">Version {videoData.version}</p>
              </div>

              <div>
                <p className="text-xs text-muted-foreground">Uploaded</p>
                <p className="text-sm font-medium text-foreground">{videoData.uploadedAt}</p>
              </div>
            </div>

            <div className="space-y-3 pt-2">
              <Button
                variant="outline"
                className="w-full border-border bg-transparent text-foreground hover:bg-muted"
                onClick={() => setRevisionOpen(true)}
              >
                <X className="mr-2 h-4 w-4" />
                Request Changes
              </Button>
              <Button
                className="w-full bg-emerald-600 text-white shadow-lg shadow-emerald-600/20 hover:bg-emerald-500"
                onClick={() => setApprovalOpen(true)}
              >
                <Check className="mr-2 h-4 w-4" />
                Approve Video
              </Button>
            </div>
          </GlassCard>
        </div>
      </div>

      <Dialog open={approvalOpen} onOpenChange={setApprovalOpen}>
        <DialogContent className="border-border bg-card text-foreground">
          <DialogHeader>
            <DialogTitle>Approve this video?</DialogTitle>
            <DialogDescription className="text-muted-foreground">
              Are you sure you want to approve this video? This action is final and will mark the
              video as approved for delivery.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="ghost"
              onClick={() => setApprovalOpen(false)}
              className="text-muted-foreground hover:text-foreground"
            >
              Cancel
            </Button>
            <Button onClick={handleApprove} className="bg-emerald-600 text-white hover:bg-emerald-500">
              <Check className="mr-2 h-4 w-4" />
              Approve Video
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={revisionOpen} onOpenChange={setRevisionOpen}>
        <DialogContent className="border-border bg-card text-foreground">
          <DialogHeader>
            <DialogTitle>Request Changes</DialogTitle>
            <DialogDescription className="text-muted-foreground">
              What needs to be changed?
            </DialogDescription>
          </DialogHeader>
          <Textarea
            value={revisionText}
            onChange={(e) => setRevisionText(e.target.value)}
            placeholder="Describe the changes needed..."
            className="min-h-[120px] border-border bg-muted text-foreground placeholder:text-muted-foreground focus-visible:ring-blue-600"
          />
          <DialogFooter>
            <Button
              variant="ghost"
              onClick={() => {
                setRevisionOpen(false)
                setRevisionText("")
              }}
              className="text-muted-foreground hover:text-foreground"
            >
              Cancel
            </Button>
            <Button
              onClick={handleRevision}
              disabled={!revisionText.trim()}
              className="bg-blue-600 text-white hover:bg-blue-500"
            >
              <Send className="mr-2 h-4 w-4" />
              Submit
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
