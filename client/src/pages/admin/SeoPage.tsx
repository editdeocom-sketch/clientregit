import { useEffect, useState } from "react"
import { GlassCard } from "@/components/layout/glass-card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Loader2, Save } from "lucide-react"
import { api } from "@/services/api"
import { toast } from "sonner"

interface SiteSettings {
  site_title: string
  site_description: string
  og_image: string
  favicon_url: string
  canonical_base_url: string
  google_verification_code: string
  google_analytics_id: string
  search_console_verification: string
  organization_name: string
  contact_email: string
  support_email: string
  social_links: Record<string, string>
}

const DEFAULT_SETTINGS: SiteSettings = {
  site_title: "ClientRegit — Client Management for Creative Professionals",
  site_description: "Manage clients, projects, video reviews, tasks, and invoices in one calm workspace built for video editors and freelancers.",
  og_image: "",
  favicon_url: "",
  canonical_base_url: "https://clientregit.com",
  google_verification_code: "",
  google_analytics_id: "",
  search_console_verification: "",
  organization_name: "ClientRegit",
  contact_email: "support@clientregit.com",
  support_email: "support@clientregit.com",
  social_links: {},
}

export default function SeoPage() {
  const [settings, setSettings] = useState<SiteSettings>(DEFAULT_SETTINGS)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    loadSettings()
  }, [])

  const loadSettings = async () => {
    try {
      const res = await api.get<{ success: boolean; data: SiteSettings }>("/admin/settings")
      if (res.success && res.data) {
        setSettings({
          ...DEFAULT_SETTINGS,
          ...res.data,
          social_links: res.data.social_links || {},
        })
      }
    } catch {
      toast.error("Failed to load site settings")
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      const res = await api.put<{ success: boolean }>("/admin/settings", {
        site_title: settings.site_title,
        site_description: settings.site_description,
        og_image: settings.og_image,
        favicon_url: settings.favicon_url,
        canonical_base_url: settings.canonical_base_url,
        google_verification_code: settings.google_verification_code,
        google_analytics_id: settings.google_analytics_id,
        search_console_verification: settings.search_console_verification,
        organization_name: settings.organization_name,
        contact_email: settings.contact_email,
        support_email: settings.support_email,
      })
      if (res.success) {
        toast.success("SEO settings saved successfully")
      }
    } catch {
      toast.error("Failed to save SEO settings")
    } finally {
      setSaving(false)
    }
  }

  const updateField = (key: keyof SiteSettings, value: string) => {
    setSettings((prev) => ({ ...prev, [key]: value }))
  }

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Site & SEO Settings</h1>
        <p className="text-muted-foreground mt-1">Manage site branding, search engine optimization, and verification codes.</p>
      </div>

      <GlassCard className="p-6 space-y-6">
        <div>
          <h2 className="text-lg font-semibold text-foreground mb-1">Homepage</h2>
          <p className="text-sm text-muted-foreground">Title and description shown in search engine results.</p>
        </div>

        <div className="space-y-4 max-w-2xl">
          <div className="space-y-2">
            <Label className="text-muted-foreground">Site Title</Label>
            <Input
              value={settings.site_title}
              onChange={(e) => updateField("site_title", e.target.value)}
              className="bg-muted border-border text-foreground placeholder:text-muted-foreground focus-visible:ring-ring/20"
              placeholder="ClientRegit — Client Management for Creative Professionals"
            />
            <p className="text-xs text-muted-foreground">{settings.site_title.length}/60 characters recommended</p>
          </div>

          <div className="space-y-2">
            <Label className="text-muted-foreground">Site Description</Label>
            <textarea
              value={settings.site_description}
              onChange={(e) => updateField("site_description", e.target.value)}
              className="flex min-h-[80px] w-full rounded-md border border-input bg-muted px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              placeholder="Manage clients, projects, video reviews, tasks, and invoices..."
            />
            <p className="text-xs text-muted-foreground">{settings.site_description.length}/160 characters recommended</p>
          </div>
        </div>
      </GlassCard>

      <GlassCard className="p-6 space-y-6">
        <div>
          <h2 className="text-lg font-semibold text-foreground mb-1">Open Graph & Social</h2>
          <p className="text-sm text-muted-foreground">Settings for social media sharing and preview cards.</p>
        </div>

        <div className="space-y-4 max-w-2xl">
          <div className="space-y-2">
            <Label className="text-muted-foreground">OG Image URL</Label>
            <Input
              value={settings.og_image}
              onChange={(e) => updateField("og_image", e.target.value)}
              className="bg-muted border-border text-foreground placeholder:text-muted-foreground focus-visible:ring-ring/20"
              placeholder="https://clientregit.com/og-image.png"
            />
            <p className="text-xs text-muted-foreground">Recommended: 1200x630 pixels. Leave blank to use default.</p>
          </div>

          <div className="space-y-2">
            <Label className="text-muted-foreground">Favicon URL</Label>
            <Input
              value={settings.favicon_url}
              onChange={(e) => updateField("favicon_url", e.target.value)}
              className="bg-muted border-border text-foreground placeholder:text-muted-foreground focus-visible:ring-ring/20"
              placeholder="https://clientregit.com/favicon.svg"
            />
          </div>

          <div className="space-y-2">
            <Label className="text-muted-foreground">Canonical Base URL</Label>
            <Input
              value={settings.canonical_base_url}
              onChange={(e) => updateField("canonical_base_url", e.target.value)}
              className="bg-muted border-border text-foreground placeholder:text-muted-foreground focus-visible:ring-ring/20"
              placeholder="https://clientregit.com"
            />
          </div>
        </div>
      </GlassCard>

      <GlassCard className="p-6 space-y-6">
        <div>
          <h2 className="text-lg font-semibold text-foreground mb-1">Google Integration</h2>
          <p className="text-sm text-muted-foreground">Connect your site to Google Search Console and Analytics.</p>
        </div>

        <div className="space-y-4 max-w-2xl">
          <div className="space-y-2">
            <Label className="text-muted-foreground">Google Verification Code</Label>
            <Input
              value={settings.google_verification_code}
              onChange={(e) => updateField("google_verification_code", e.target.value)}
              className="bg-muted border-border text-foreground placeholder:text-muted-foreground focus-visible:ring-ring/20"
              placeholder="e.g., abc123def456"
            />
            <p className="text-xs text-muted-foreground">From Google Search Console HTML tag verification.</p>
          </div>

          <div className="space-y-2">
            <Label className="text-muted-foreground">Google Analytics ID</Label>
            <Input
              value={settings.google_analytics_id}
              onChange={(e) => updateField("google_analytics_id", e.target.value)}
              className="bg-muted border-border text-foreground placeholder:text-muted-foreground focus-visible:ring-ring/20"
              placeholder="e.g., G-XXXXXXXXXX"
            />
            <p className="text-xs text-muted-foreground">Your Google Analytics 4 measurement ID.</p>
          </div>

          <div className="space-y-2">
            <Label className="text-muted-foreground">Search Console Verification</Label>
            <Input
              value={settings.search_console_verification}
              onChange={(e) => updateField("search_console_verification", e.target.value)}
              className="bg-muted border-border text-foreground placeholder:text-muted-foreground focus-visible:ring-ring/20"
              placeholder="Verification code from Search Console"
            />
          </div>
        </div>
      </GlassCard>

      <GlassCard className="p-6 space-y-6">
        <div>
          <h2 className="text-lg font-semibold text-foreground mb-1">Organization</h2>
          <p className="text-sm text-muted-foreground">Default organization details for structured data and contact info.</p>
        </div>

        <div className="space-y-4 max-w-2xl">
          <div className="space-y-2">
            <Label className="text-muted-foreground">Organization Name</Label>
            <Input
              value={settings.organization_name}
              onChange={(e) => updateField("organization_name", e.target.value)}
              className="bg-muted border-border text-foreground placeholder:text-muted-foreground focus-visible:ring-ring/20"
              placeholder="ClientRegit"
            />
          </div>

          <div className="space-y-2">
            <Label className="text-muted-foreground">Contact Email</Label>
            <Input
              value={settings.contact_email}
              onChange={(e) => updateField("contact_email", e.target.value)}
              className="bg-muted border-border text-foreground placeholder:text-muted-foreground focus-visible:ring-ring/20"
              placeholder="support@clientregit.com"
            />
          </div>

          <div className="space-y-2">
            <Label className="text-muted-foreground">Support Email</Label>
            <Input
              value={settings.support_email}
              onChange={(e) => updateField("support_email", e.target.value)}
              className="bg-muted border-border text-foreground placeholder:text-muted-foreground focus-visible:ring-ring/20"
              placeholder="support@clientregit.com"
            />
          </div>
        </div>
      </GlassCard>

      <div className="flex justify-end">
        <Button
          className="bg-primary text-primary-foreground hover:bg-primary/90 gap-2"
          onClick={handleSave}
          disabled={saving}
        >
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          Save Settings
        </Button>
      </div>
    </div>
  )
}
