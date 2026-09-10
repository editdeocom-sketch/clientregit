import { useEffect, useState, useCallback } from "react"
import { GlassCard } from "@/components/layout/glass-card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Loader2, Save, FileText, Clock } from "lucide-react"
import { api } from "@/services/api"
import { toast } from "sonner"

const LEGAL_PAGE_OPTIONS = [
  { slug: "privacy", label: "Privacy Policy" },
  { slug: "terms", label: "Terms & Conditions" },
  { slug: "cookies", label: "Cookie Policy" },
  { slug: "refund-policy", label: "Refund Policy" },
  { slug: "acceptable-use", label: "Acceptable Use Policy" },
  { slug: "security", label: "Security" },
  { slug: "advertising-policy", label: "Advertising Policy" },
]

interface PageData {
  id?: number
  page_slug: string
  title: string
  content: string
  version: number
  status: string
  updated_at: string | null
}

interface LegalPageSummary {
  id: number
  page_slug: string
  title: string
  version: number
  status: string
  updated_at: string | null
}

export default function LegalPage() {
  const [pages, setPages] = useState<LegalPageSummary[]>([])
  const [selectedSlug, setSelectedSlug] = useState<string>("privacy")
  const [pageData, setPageData] = useState<PageData>({ page_slug: "privacy", title: "", content: "", version: 0, status: "draft", updated_at: null })
  const [loadingPages, setLoadingPages] = useState(true)
  const [loadingContent, setLoadingContent] = useState(false)
  const [saving, setSaving] = useState(false)

  const loadPages = useCallback(async () => {
    try {
      const res = await api.get<{ success: boolean; data: LegalPageSummary[] }>("/admin/legal")
      if (res.success && res.data) {
        setPages(res.data)
      }
    } catch {
      toast.error("Failed to load legal pages")
    } finally {
      setLoadingPages(false)
    }
  }, [])

  const loadContent = useCallback(async (slug: string) => {
    setLoadingContent(true)
    try {
      const res = await api.get<{ success: boolean; data: LegalPageSummary[] }>("/admin/legal")
      if (res.success && res.data) {
        const found = res.data.find((p) => p.page_slug === slug)
        if (found) {
          setPageData({
            page_slug: found.page_slug,
            title: found.title,
            content: "", // Content not returned in list; re-fetch if needed
            version: found.version,
            status: found.status,
            updated_at: found.updated_at,
          })
        } else {
          setPageData({ page_slug: slug, title: LEGAL_PAGE_OPTIONS.find((o) => o.slug === slug)?.label || slug, content: "", version: 0, status: "draft", updated_at: null })
        }
      }
    } catch {
      toast.error("Failed to load page content")
    } finally {
      setLoadingContent(false)
    }
  }, [])

  useEffect(() => {
    loadPages()
  }, [loadPages])

  useEffect(() => {
    if (selectedSlug) {
      loadContent(selectedSlug)
    }
  }, [selectedSlug, loadContent])

  const handleSave = async () => {
    if (!selectedSlug) return
    setSaving(true)
    try {
      const res = await api.put<{ success: boolean; data: PageData }>(`/admin/legal/${selectedSlug}`, {
        title: pageData.title,
        content: pageData.content,
      })
      if (res.success) {
        toast.success("Page saved successfully")
        loadPages()
      }
    } catch {
      toast.error("Failed to save page")
    } finally {
      setSaving(false)
    }
  }

  const selectedOption = LEGAL_PAGE_OPTIONS.find((p) => p.slug === selectedSlug)

  if (loadingPages) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Legal Pages</h1>
        <p className="text-muted-foreground mt-1">Edit legal and policy pages shown to users.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Page list sidebar */}
        <div className="lg:col-span-1">
          <GlassCard className="p-4">
            <h3 className="text-sm font-semibold text-foreground mb-3">Pages</h3>
            <div className="space-y-1">
              {LEGAL_PAGE_OPTIONS.map((option) => {
                const page = pages.find((p) => p.page_slug === option.slug)
                return (
                  <button
                    key={option.slug}
                    onClick={() => setSelectedSlug(option.slug)}
                    className={`w-full text-left px-3 py-2.5 rounded-lg text-sm transition-colors flex items-center gap-2 ${
                      selectedSlug === option.slug
                        ? "bg-primary/10 text-primary font-medium"
                        : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                    }`}
                  >
                    <FileText className="h-4 w-4 shrink-0" />
                    <span className="truncate">{option.label}</span>
                    {page && page.version > 0 && (
                      <span className="ml-auto text-xs text-muted-foreground">v{page.version}</span>
                    )}
                  </button>
                )
              })}
            </div>
          </GlassCard>
        </div>

        {/* Editor */}
        <div className="lg:col-span-3 space-y-6">
          <GlassCard className="p-6 space-y-6">
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-lg font-semibold text-foreground">
                  {selectedOption?.label || "Select a page"}
                </h2>
                <p className="text-sm text-muted-foreground mt-1">
                  Editing the {selectedOption?.label} page content.
                </p>
              </div>
              {pageData.version > 0 && (
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground bg-muted px-2.5 py-1 rounded-full">
                  <Clock className="h-3 w-3" />
                  <span>Version {pageData.version}</span>
                  {pageData.updated_at && (
                    <span className="ml-1">
                      &middot; {new Date(pageData.updated_at).toLocaleDateString()}
                    </span>
                  )}
                </div>
              )}
            </div>

            {loadingContent ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-muted-foreground">Page Title</Label>
                  <Input
                    value={pageData.title}
                    onChange={(e) => setPageData((prev) => ({ ...prev, title: e.target.value }))}
                    className="bg-muted border-border text-foreground placeholder:text-muted-foreground focus-visible:ring-ring/20"
                    placeholder="Page title"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-muted-foreground">Content (Markdown)</Label>
                  <textarea
                    value={pageData.content}
                    onChange={(e) => setPageData((prev) => ({ ...prev, content: e.target.value }))}
                    className="flex min-h-[500px] w-full rounded-md border border-input bg-muted px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 font-mono leading-relaxed"
                    placeholder="Enter page content in Markdown format..."
                  />
                </div>

                <p className="text-xs text-muted-foreground">
                  Content supports Markdown formatting. The page will be rendered as HTML on the public site.
                </p>
              </div>
            )}
          </GlassCard>

          <div className="flex justify-end">
            <Button
              className="bg-primary text-primary-foreground hover:bg-primary/90 gap-2"
              onClick={handleSave}
              disabled={saving || loadingContent}
            >
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              Save Page
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
