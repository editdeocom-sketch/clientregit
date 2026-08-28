import { useEffect, useState } from "react"
import { useParams } from "react-router-dom"
import { api } from "@/services/api"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { GlassCard } from "@/components/layout/glass-card"
import { Check, MessageSquare, Send, X } from "lucide-react"
import { toast } from "sonner"
import { formatDate, formatVideoTime } from "@/lib/utils"

interface SharedVideo {
  id: number
  title: string
  version: number
  file_url: string
  file_name: string
  status: string
  created_at: string
  project_name?: string
  project_description?: string
  project_status?: string
  project_progress?: number
  project_deadline?: string
}

interface SharedComment {
  id: number
  timestamp: number
  comment: string
  user_name: string
  created_at: string
}

export default function SharedVideoPage() {
  const { token } = useParams<{ token: string }>()
  const [video, setVideo] = useState<SharedVideo | null>(null)
  const [comments, setComments] = useState<SharedComment[]>([])
  const [comment, setComment] = useState("")
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)

  useEffect(() => {
    async function load() {
      try {
        const [videoResponse, commentsResponse] = await Promise.all([
          api.get<{ data: SharedVideo }>(`/videos/shared/${token}`),
          api.get<{ data: SharedComment[] }>(`/videos/shared/${token}/comments`),
        ])
        setVideo(videoResponse.data)
        setComments(commentsResponse.data || [])
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "This share link is unavailable")
      } finally {
        setLoading(false)
      }
    }
    if (token) load()
  }, [token])

  async function addComment() {
    if (!comment.trim() || !token) return
    setSending(true)
    try {
      const response = await api.post<{ data: SharedComment }>(`/videos/shared/${token}/comments`, {
        timestamp: currentTime,
        comment: comment.trim(),
        guest_name: name.trim() || "Client",
        guest_email: email.trim(),
      })
      setComments((items) => [...items, response.data].sort((a, b) => a.timestamp - b.timestamp))
      setComment("")
      toast.success("Feedback sent to the editor")
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to send feedback")
    } finally {
      setSending(false)
    }
  }

  async function updateStatus(status: "approved" | "revision_requested") {
    if (!token || !video) return
    setSending(true)
    try {
      const response = await api.put<{ data: { status: string } }>(`/videos/shared/${token}/status`, {
        status,
        guest_name: name.trim() || "Client",
        comment: status === "revision_requested" ? comment.trim() : "",
      })
      setVideo({ ...video, status: response.data.status })
      setComment("")
      toast.success(status === "approved" ? "Video approved" : "Change request sent to the editor")
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to update review status")
    } finally {
      setSending(false)
    }
  }

  if (loading) return <div className="min-h-screen bg-background flex items-center justify-center text-muted-foreground">Loading shared video...</div>
  if (!video) return <div className="min-h-screen bg-background flex items-center justify-center text-muted-foreground">This video link is unavailable.</div>

  return (
    <div className="min-h-screen bg-background p-6 lg:p-10">
      <div className="mx-auto max-w-6xl space-y-6">
        <div>
          <p className="text-sm font-medium text-primary">ClientRegit video review</p>
          <h1 className="mt-1 text-2xl font-bold text-foreground">{video.title}</h1>
          <p className="mt-1 text-sm text-muted-foreground">Version {video.version} · {video.project_name || "Project"}</p>
        </div>

        <GlassCard className="overflow-hidden p-0">
          {video.file_url ? (
            <video
              className="aspect-video w-full bg-black"
              src={video.file_url}
              controls
              preload="metadata"
              onLoadedMetadata={(event) => setDuration(event.currentTarget.duration)}
              onTimeUpdate={(event) => setCurrentTime(event.currentTarget.currentTime)}
            />
          ) : (
            <div className="aspect-video flex items-center justify-center bg-muted text-muted-foreground">Media unavailable</div>
          )}
        </GlassCard>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <GlassCard className="p-6 lg:col-span-2">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-foreground">Feedback and revisions</h2>
              <Badge className="bg-muted text-muted-foreground border-0">{video.status.replace(/_/g, " ")}</Badge>
            </div>
            <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2">
              <Input value={name} onChange={(event) => setName(event.target.value)} placeholder="Your name" />
              <Input value={email} onChange={(event) => setEmail(event.target.value)} type="email" placeholder="Your email (optional)" />
            </div>
            <div className="mt-3 flex items-start gap-3">
              <Textarea value={comment} onChange={(event) => setComment(event.target.value)} placeholder={`Add feedback at ${formatVideoTime(currentTime)}...`} />
              <Button onClick={addComment} disabled={!comment.trim() || sending} size="icon" title="Send feedback"><Send className="h-4 w-4" /></Button>
            </div>
            <div className="mt-5 space-y-3">
              {comments.length === 0 && <p className="py-6 text-center text-sm text-muted-foreground">No feedback yet.</p>}
              {comments.map((item) => (
                <button key={item.id} type="button" className="w-full rounded-lg bg-muted/60 p-3 text-left hover:bg-muted" onClick={() => setCurrentTime(item.timestamp)}>
                  <div className="flex items-center justify-between gap-3">
                    <span className="flex items-center gap-2 text-sm font-medium text-foreground"><MessageSquare className="h-4 w-4 text-primary" />{item.user_name}</span>
                    <span className="text-xs text-muted-foreground">{formatVideoTime(item.timestamp)}</span>
                  </div>
                  <p className="mt-1 text-sm text-muted-foreground">{item.comment}</p>
                </button>
              ))}
            </div>
          </GlassCard>

          <GlassCard className="p-6">
            <h2 className="text-lg font-semibold text-foreground">Project details</h2>
            <div className="mt-4 space-y-3 text-sm">
              <p className="text-muted-foreground">Project <span className="float-right text-foreground">{video.project_name || "-"}</span></p>
              <p className="text-muted-foreground">Progress <span className="float-right text-foreground">{video.project_progress ?? 0}%</span></p>
              <p className="text-muted-foreground">Deadline <span className="float-right text-foreground">{video.project_deadline ? formatDate(video.project_deadline) : "-"}</span></p>
              <p className="border-t border-border pt-3 text-muted-foreground">{video.project_description || "No project description provided."}</p>
            </div>
            <div className="mt-6 space-y-2">
              <Button className="w-full" disabled={sending || video.status === "approved"} onClick={() => updateStatus("approved")}><Check className="mr-2 h-4 w-4" />Approve video</Button>
              <Button variant="outline" className="w-full" disabled={sending || video.status === "approved"} onClick={() => updateStatus("revision_requested")}><X className="mr-2 h-4 w-4" />Request changes</Button>
            </div>
          </GlassCard>
        </div>
      </div>
    </div>
  )
}
