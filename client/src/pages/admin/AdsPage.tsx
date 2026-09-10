import { useEffect, useState } from "react"
import { GlassCard } from "@/components/layout/glass-card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Loader2, Save } from "lucide-react"
import { api } from "@/services/api"
import { toast } from "sonner"

interface AdSettings {
  adsense_client_id: string
  adsense_enabled: number
  ad_positions: Record<string, boolean>
}

export default function AdsPage() {
  const [settings, setSettings] = useState<AdSettings>({ adsense_client_id: "", adsense_enabled: 0, ad_positions: {} })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    loadSettings()
  }, [])

  const loadSettings = async () => {
    try {
      const res = await api.get<{ success: boolean; data: AdSettings }>("/admin/ads")
      if (res.success && res.data) {
        setSettings({
          adsense_client_id: res.data.adsense_client_id || "",
          adsense_enabled: res.data.adsense_enabled || 0,
          ad_positions: res.data.ad_positions || {},
        })
      }
    } catch {
      toast.error("Failed to load ad settings")
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      const res = await api.put<{ success: boolean }>("/admin/ads", {
        adsense_client_id: settings.adsense_client_id,
        adsense_enabled: settings.adsense_enabled,
        ad_positions: settings.ad_positions,
      })
      if (res.success) {
        toast.success("Ad settings saved successfully")
      }
    } catch {
      toast.error("Failed to save ad settings")
    } finally {
      setSaving(false)
    }
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
        <h1 className="text-2xl font-bold text-foreground">Advertising Settings</h1>
        <p className="text-muted-foreground mt-1">Configure Google AdSense integration for the free plan.</p>
      </div>

      <GlassCard className="p-6 space-y-6">
        <div>
          <h2 className="text-lg font-semibold text-foreground mb-1">AdSense Configuration</h2>
          <p className="text-sm text-muted-foreground">Enable advertisements on the free plan to support development.</p>
        </div>

        <div className="space-y-6 max-w-2xl">
          <div className="flex items-center justify-between p-4 rounded-lg bg-muted/50 border border-border">
            <div>
              <Label className="text-foreground font-medium">Enable Ads</Label>
              <p className="text-sm text-muted-foreground mt-1">
                Show advertisements to free plan users. Paid plan users never see ads.
              </p>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={settings.adsense_enabled === 1}
              onClick={() =>
                setSettings((prev) => ({
                  ...prev,
                  adsense_enabled: prev.adsense_enabled === 1 ? 0 : 1,
                }))
              }
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ${
                settings.adsense_enabled === 1 ? "bg-primary" : "bg-muted-foreground/30"
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  settings.adsense_enabled === 1 ? "translate-x-6" : "translate-x-1"
                }`}
              />
            </button>
          </div>

          <div className="space-y-2">
            <Label className="text-muted-foreground">AdSense Client ID</Label>
            <Input
              value={settings.adsense_client_id}
              onChange={(e) => setSettings((prev) => ({ ...prev, adsense_client_id: e.target.value }))}
              className="bg-muted border-border text-foreground placeholder:text-muted-foreground focus-visible:ring-ring/20"
              placeholder="ca-pub-XXXXXXXXXXXXXXXX"
              disabled={settings.adsense_enabled !== 1}
            />
            <p className="text-xs text-muted-foreground">
              Your Google AdSense publisher ID. Find it in your AdSense account under Settings &gt; Account &gt; Account Information.
            </p>
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
          Save Ad Settings
        </Button>
      </div>
    </div>
  )
}
