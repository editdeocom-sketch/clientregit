"use client"

import { useEffect, useState, useRef } from "react"
import { createClient } from "@/lib/supabase/client"
import { GlassCard } from "@/components/layout/glass-card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Video as VideoIcon, Play, ExternalLink, Plus, Upload, X, AlertCircle, CheckCircle } from "lucide-react"
import { formatDate } from "@/lib/utils"
import Link from "next/link"
import { toast } from "sonner"

const MAX_FILE_SIZE_MB = 50
const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024

interface VideoData {
  id: string
  title: string
  project: string
  project_id: string
  version: number
  status: "draft" | "awaiting_review" | "revision_requested" | "approved"
  created_at: string
}

interface ProjectData {
  id: string
  name: string
}

const statusConfig: Record<string, { label: string; className: string }> = {
  draft: { label: "Draft", className: "bg-muted text-muted-foreground border-0" },
  awaiting_review: { label: "Awaiting Review", className: "bg-yellow-500/20 text-yellow-400 border-0" },
  revision_requested: { label: "Revision Requested", className: "bg-orange-500/20 text-orange-400 border-0" },
  approved: { label: "Approved", className: "bg-green-500/20 text-green-400 border-0" },
}

export default function VideosPage() {
  const [videos, setVideos] = useState<VideoData[]>([])
  const [projects, setProjects] = useState<ProjectData[]>([])
  const [uploadOpen, setUploadOpen] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [fileError, setFileError] = useState<string | null>(null)
  const [uploadForm, setUploadForm] = useState({
    title: "",
    project_id: "",
    description: "",
  })
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    async function loadData() {
      try {
        const supabase = createClient()
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return

        // Load videos
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
              project_id: v.project_id,
              version: v.version,
              status: v.status,
              created_at: v.created_at,
            }))
          )
        }

        // Load projects for upload dropdown
        const { data: projectData } = await supabase
          .from("projects")
          .select("id, name")
          .eq("editor_id", user.id)
          .order("name")

        if (projectData) {
          setProjects(projectData)
        }
      } catch {
        setVideos([])
      }
    }

    loadData()
  }, [])

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setFileError(null)

    // Check file type
    const allowedTypes = ["video/mp4", "video/quicktime", "video/x-msvideo", "video/webm", "video/ogg"]
    if (!allowedTypes.includes(file.type)) {
      setFileError("Invalid file type. Please upload MP4, MOV, AVI, WebM, or OGG video files.")
      setSelectedFile(null)
      return
    }

    // Check file size
    if (file.size > MAX_FILE_SIZE_BYTES) {
      setFileError(`File size exceeds ${MAX_FILE_SIZE_MB}MB limit. Current size: ${(file.size / (1024 * 1024)).toFixed(1)}MB. Please compress your video or use a smaller file.`)
      setSelectedFile(null)
      return
    }

    setSelectedFile(file)
    
    // Auto-fill title from filename
    if (!uploadForm.title) {
      const name = file.name.replace(/\.[^/.]+$/, "").replace(/[-_]/g, " ")
      setUploadForm(prev => ({ ...prev, title: name }))
    }
  }

  const handleUpload = async () => {
    if (!selectedFile || !uploadForm.project_id || !uploadForm.title) {
      toast.error("Please fill in all required fields")
      return
    }

    setUploading(true)

    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        toast.error("You must be logged in")
        return
      }

      // Upload file to Supabase Storage
      const fileExt = selectedFile.name.split(".").pop()
      const fileName = `${user.id}/${uploadForm.project_id}/${Date.now()}.${fileExt}`
      
      const { error: uploadError } = await supabase.storage
        .from("videos")
        .upload(fileName, selectedFile, {
          contentType: selectedFile.type,
          upsert: false,
        })

      if (uploadError) {
        toast.error(`Upload failed: ${uploadError.message}`)
        return
      }

      // Get the version number for this project
      const { data: existingVideos } = await supabase
        .from("videos")
        .select("version")
        .eq("project_id", uploadForm.project_id)
        .order("version", { ascending: false })
        .limit(1)

      const nextVersion = existingVideos && existingVideos.length > 0 
        ? existingVideos[0].version + 1 
        : 1

      // Create video record
      const { error: dbError } = await supabase
        .from("videos")
        .insert({
          project_id: uploadForm.project_id,
          uploaded_by: user.id,
          title: uploadForm.title,
          version: nextVersion,
          file_path: fileName,
          status: "draft",
        })

      if (dbError) {
        toast.error(`Failed to save video: ${dbError.message}`)
        return
      }

      toast.success("Video uploaded successfully!")
      setUploadOpen(false)
      setSelectedFile(null)
      setUploadForm({ title: "", project_id: "", description: "" })
      
      // Reload videos
      window.location.reload()
    } catch (err) {
      toast.error("An error occurred during upload")
    } finally {
      setUploading(false)
    }
  }

  const resetUpload = () => {
    setUploadOpen(false)
    setSelectedFile(null)
    setFileError(null)
    setUploadForm({ title: "", project_id: "", description: "" })
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  return (
    <div className="p-6 space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Videos</h1>
          <p className="text-muted-foreground mt-1">Review and manage all uploaded videos.</p>
        </div>
        <Button 
          className="bg-primary text-primary-foreground hover:bg-primary/90"
          onClick={() => setUploadOpen(true)}
          disabled={projects.length === 0}
        >
          <Upload className="h-4 w-4 mr-2" />
          Upload Video
        </Button>
      </div>

      {videos.length === 0 ? (
        <GlassCard className="p-16 text-center">
          <VideoIcon className="h-12 w-12 text-muted-foreground/30 mx-auto mb-3" />
          <p className="text-muted-foreground mb-4">No videos yet. Upload your first video to get started.</p>
          <Button 
            className="bg-primary text-primary-foreground hover:bg-primary/90"
            onClick={() => setUploadOpen(true)}
            disabled={projects.length === 0}
          >
            <Upload className="h-4 w-4 mr-2" />
            Upload Video
          </Button>
          {projects.length === 0 && (
            <p className="text-sm text-muted-foreground mt-3">
              Create a project first before uploading videos.
            </p>
          )}
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

      {/* Upload Dialog */}
      <Dialog open={uploadOpen} onOpenChange={setUploadOpen}>
        <DialogContent className="border-border bg-card text-foreground sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Upload Video</DialogTitle>
            <DialogDescription className="text-muted-foreground">
              Upload a video file to a project. Maximum file size: {MAX_FILE_SIZE_MB}MB.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Project Selection */}
            <div className="space-y-2">
              <Label htmlFor="project">Project *</Label>
              <Select 
                value={uploadForm.project_id} 
                onValueChange={(value) => setUploadForm(prev => ({ ...prev, project_id: value }))}
              >
                <SelectTrigger className="border-border bg-muted text-foreground">
                  <SelectValue placeholder="Select a project" />
                </SelectTrigger>
                <SelectContent className="border-border bg-card">
                  {projects.map((project) => (
                    <SelectItem key={project.id} value={project.id} className="text-foreground">
                      {project.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Video Title */}
            <div className="space-y-2">
              <Label htmlFor="title">Video Title *</Label>
              <Input
                id="title"
                value={uploadForm.title}
                onChange={(e) => setUploadForm(prev => ({ ...prev, title: e.target.value }))}
                placeholder="Enter video title"
                className="border-border bg-muted text-foreground"
              />
            </div>

            {/* File Upload */}
            <div className="space-y-2">
              <Label>Video File *</Label>
              <div 
                className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors cursor-pointer
                  ${fileError ? "border-destructive bg-destructive/10" : 
                    selectedFile ? "border-green-500 bg-green-500/10" : 
                    "border-border hover:border-primary/50 hover:bg-muted/50"}`}
                onClick={() => fileInputRef.current?.click()}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="video/mp4,video/quicktime,video/x-msvideo,video/webm,video/ogg"
                  onChange={handleFileSelect}
                  className="hidden"
                />
                
                {selectedFile ? (
                  <div className="space-y-2">
                    <CheckCircle className="h-8 w-8 text-green-500 mx-auto" />
                    <p className="text-sm font-medium text-foreground">{selectedFile.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {(selectedFile.size / (1024 * 1024)).toFixed(1)} MB
                    </p>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation()
                        setSelectedFile(null)
                        setFileError(null)
                        if (fileInputRef.current) fileInputRef.current.value = ""
                      }}
                      className="text-muted-foreground hover:text-foreground"
                    >
                      <X className="h-4 w-4 mr-1" />
                      Remove
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <Upload className="h-8 w-8 text-muted-foreground mx-auto" />
                    <p className="text-sm text-muted-foreground">
                      Click to select a video file
                    </p>
                    <p className="text-xs text-muted-foreground">
                      MP4, MOV, AVI, WebM, OGG (max {MAX_FILE_SIZE_MB}MB)
                    </p>
                  </div>
                )}
              </div>

              {fileError && (
                <div className="flex items-start gap-2 text-sm text-destructive mt-2">
                  <AlertCircle className="h-4 w-4 flex-shrink-0 mt-0.5" />
                  <span>{fileError}</span>
                </div>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="ghost"
              onClick={resetUpload}
              className="text-muted-foreground hover:text-foreground"
            >
              Cancel
            </Button>
            <Button
              onClick={handleUpload}
              disabled={!selectedFile || !uploadForm.project_id || !uploadForm.title || uploading}
              className="bg-primary text-primary-foreground hover:bg-primary/90"
            >
              {uploading ? (
                <>
                  <div className="h-4 w-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin mr-2" />
                  Uploading...
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4 mr-2" />
                  Upload
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
