import { useEffect, useState } from 'react';
import { api } from '@/services/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { Settings, Save, Loader2, Globe, Mail, Share2, BarChart3 } from 'lucide-react';

interface SiteSettings {
  site_title: string;
  site_description: string;
  og_image: string;
  favicon_url: string;
  canonical_base_url: string;
  organization_name: string;
  contact_email: string;
  support_email: string;
  google_verification_code: string;
  google_analytics_id: string;
  social_links: Record<string, string>;
}

const DEFAULT_SETTINGS: SiteSettings = {
  site_title: '',
  site_description: '',
  og_image: '',
  favicon_url: '',
  canonical_base_url: '',
  organization_name: '',
  contact_email: '',
  support_email: '',
  google_verification_code: '',
  google_analytics_id: '',
  social_links: {},
};

export default function SettingsPage() {
  const [settings, setSettings] = useState<SiteSettings>(DEFAULT_SETTINGS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const res = await api.get<{ success: boolean; data: SiteSettings }>('/admin/settings');
      if (res.success && res.data) {
        setSettings({
          ...DEFAULT_SETTINGS,
          ...res.data,
          social_links: res.data.social_links || {},
        });
      }
    } catch {
      toast.error('Failed to load settings');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await api.put<{ success: boolean }>('/admin/settings', {
        site_title: settings.site_title,
        site_description: settings.site_description,
        og_image: settings.og_image,
        favicon_url: settings.favicon_url,
        canonical_base_url: settings.canonical_base_url,
        organization_name: settings.organization_name,
        contact_email: settings.contact_email,
        support_email: settings.support_email,
        google_verification_code: settings.google_verification_code,
        google_analytics_id: settings.google_analytics_id,
        social_links: settings.social_links,
      });
      if (res.success) {
        toast.success('Settings saved successfully');
      }
    } catch {
      toast.error('Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  const updateField = (key: keyof SiteSettings, value: string) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
  };

  const updateSocialLink = (platform: string, value: string) => {
    setSettings((prev) => ({
      ...prev,
      social_links: { ...prev.social_links, [platform]: value },
    }));
  };

  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64 rounded-lg" />
        <Skeleton className="h-64 rounded-lg" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
          <Settings className="h-6 w-6" />
          Site Settings
        </h1>
        <p className="text-muted-foreground mt-1">Manage general site settings and configuration</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Globe className="h-5 w-5" />
            General
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label className="text-muted-foreground">Site Title</Label>
            <Input
              value={settings.site_title}
              onChange={(e) => updateField('site_title', e.target.value)}
              placeholder="ClientRegit"
            />
            <p className="text-xs text-muted-foreground">{settings.site_title.length}/60 characters recommended</p>
          </div>
          <div className="space-y-2">
            <Label className="text-muted-foreground">Site Description</Label>
            <textarea
              value={settings.site_description}
              onChange={(e) => updateField('site_description', e.target.value)}
              className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              placeholder="Manage clients, projects, video reviews..."
            />
            <p className="text-xs text-muted-foreground">{settings.site_description.length}/160 characters recommended</p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Share2 className="h-5 w-5" />
            Open Graph & Branding
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label className="text-muted-foreground">OG Image URL</Label>
            <Input
              value={settings.og_image}
              onChange={(e) => updateField('og_image', e.target.value)}
              placeholder="https://clientregit.com/og-image.png"
            />
            <p className="text-xs text-muted-foreground">Recommended: 1200x630 pixels</p>
          </div>
          <div className="space-y-2">
            <Label className="text-muted-foreground">Favicon URL</Label>
            <Input
              value={settings.favicon_url}
              onChange={(e) => updateField('favicon_url', e.target.value)}
              placeholder="https://clientregit.com/favicon.svg"
            />
          </div>
          <div className="space-y-2">
            <Label className="text-muted-foreground">Canonical Base URL</Label>
            <Input
              value={settings.canonical_base_url}
              onChange={(e) => updateField('canonical_base_url', e.target.value)}
              placeholder="https://clientregit.com"
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Organization
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label className="text-muted-foreground">Organization Name</Label>
            <Input
              value={settings.organization_name}
              onChange={(e) => updateField('organization_name', e.target.value)}
              placeholder="ClientRegit"
            />
          </div>
          <div className="space-y-2">
            <Label className="text-muted-foreground">Contact Email</Label>
            <Input
              value={settings.contact_email}
              onChange={(e) => updateField('contact_email', e.target.value)}
              placeholder="contact@clientregit.com"
            />
          </div>
          <div className="space-y-2">
            <Label className="text-muted-foreground">Support Email</Label>
            <Input
              value={settings.support_email}
              onChange={(e) => updateField('support_email', e.target.value)}
              placeholder="support@clientregit.com"
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Google Integration
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label className="text-muted-foreground">Google Verification Code</Label>
            <Input
              value={settings.google_verification_code}
              onChange={(e) => updateField('google_verification_code', e.target.value)}
              placeholder="e.g., abc123def456"
            />
            <p className="text-xs text-muted-foreground">From Google Search Console HTML tag verification</p>
          </div>
          <div className="space-y-2">
            <Label className="text-muted-foreground">Google Analytics ID</Label>
            <Input
              value={settings.google_analytics_id}
              onChange={(e) => updateField('google_analytics_id', e.target.value)}
              placeholder="e.g., G-XXXXXXXXXX"
            />
            <p className="text-xs text-muted-foreground">Your Google Analytics 4 measurement ID</p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Social Links</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {['twitter', 'facebook', 'instagram', 'linkedin', 'youtube', 'github'].map((platform) => (
            <div key={platform} className="space-y-2">
              <Label className="text-muted-foreground capitalize">{platform}</Label>
              <Input
                value={settings.social_links[platform] || ''}
                onChange={(e) => updateSocialLink(platform, e.target.value)}
                placeholder={`https://${platform}.com/yourhandle`}
              />
            </div>
          ))}
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={saving} className="gap-2">
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          Save Settings
        </Button>
      </div>
    </div>
  );
}
