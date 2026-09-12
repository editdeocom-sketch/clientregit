import { useEffect, useState, useRef, useCallback } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { GlassCard } from "@/components/layout/glass-card"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { PasswordInput } from "@/components/ui/password-input"
import { getInitials, cn } from "@/lib/utils"
import { toast } from "sonner"
import {
  User, Lock, Briefcase, Shield, CreditCard, Loader2, Pencil, Camera, Trash2,
  CheckCircle2, XCircle, AlertCircle, Crown, ArrowUpRight, Zap
} from "lucide-react"
import { api } from "@/services/api"
import { useAuth } from "@/contexts/AuthContext"
import { usePreferences } from "@/contexts/PreferencesContext"
import { countryOptions } from "@/lib/countryData"
import { billingService, formatBytes, type Entitlements, type Usage, type BillingPayment, type PlanDefinition } from "@/services/billingService"
import { Link } from "react-router-dom"

function validatePassword(pw: string): { valid: boolean; errors: string[] } {
  const errors: string[] = []
  if (pw.length < 8) errors.push("At least 8 characters")
  if (pw.length > 64) errors.push("Max 64 characters")
  if (!/[A-Z]/.test(pw)) errors.push("At least one uppercase letter")
  if (!/[a-z]/.test(pw)) errors.push("At least one lowercase letter")
  if (!/[0-9]/.test(pw)) errors.push("At least one number")
  if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?`~]/.test(pw)) errors.push("At least one symbol")
  return { valid: errors.length === 0, errors }
}

function PasswordRequirement({ met, text }: { met: boolean; text: string }) {
  return (
    <div className="flex items-center gap-1.5 text-xs">
      {met ? (
        <CheckCircle2 className="h-3 w-3 text-green-600 dark:text-green-400" />
      ) : (
        <XCircle className="h-3 w-3 text-muted-foreground/50" />
      )}
      <span className={cn("transition-colors", met ? "text-green-600 dark:text-green-400" : "text-muted-foreground")}>
        {text}
      </span>
    </div>
  )
}

function BillingTabContent() {
  const { preferences } = usePreferences()
  const [subscription, setSubscription] = useState<{ subscription: any; plan: PlanDefinition; entitlements: Entitlements } | null>(null)
  const [usage, setUsage] = useState<{ usage: Usage; limits: Record<string, number | null>; storageBytes: number } | null>(null)
  const [payments, setPayments] = useState<BillingPayment[]>([])
  const [loading, setLoading] = useState(true)
  const [cancelling, setCancelling] = useState(false)
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false)

  const loadBilling = useCallback(async () => {
    try {
      const [sub, useData, payData] = await Promise.all([
        billingService.getSubscription(),
        billingService.getUsage(),
        billingService.getPayments(),
      ])
      setSubscription(sub)
      setUsage(useData)
      setPayments(payData)
    } catch (err) {
      toast.error("Failed to load billing info")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { loadBilling() }, [loadBilling])

  const handleCancel = async () => {
    if (!subscription?.subscription?.id) return
    setCancelling(true)
    try {
      await billingService.cancelSubscription(subscription.subscription.id)
      toast.success("Subscription will cancel at period end.")
      await loadBilling()
    } catch (err: any) {
      toast.error(err.message || "Failed to cancel subscription")
    } finally {
      setCancelling(false)
      setCancelDialogOpen(false)
    }
  }

  if (loading) {
    return <div className="flex items-center justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
  }

  const plan = subscription?.plan
  const entitlements = subscription?.entitlements
  const usageData = usage?.usage
  const limits = subscription?.plan?.limits || usage?.limits || {}
  const isPro = entitlements?.plan !== "free"
  const isRecurring = plan?.recurring === true

  return (
    <div className="space-y-6">
      <GlassCard className="p-6">
        <div className="flex items-start justify-between mb-6">
          <div>
            <h2 className="text-lg font-semibold text-foreground mb-1">Current Plan</h2>
            <p className="text-sm text-muted-foreground">Your subscription and plan details.</p>
          </div>
          {!isPro && (
            <Link to="/pricing">
              <Button className="bg-primary text-primary-foreground hover:bg-primary/90 gap-2">
                <ArrowUpRight className="h-4 w-4" /> Upgrade
              </Button>
            </Link>
          )}
        </div>
          <div className="flex items-center gap-4 p-4 rounded-lg bg-muted/50 border border-border">
          <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
            {isPro ? <Crown className="h-6 w-6 text-primary" /> : <Zap className="h-6 w-6 text-muted-foreground" />}
          </div>
          <div className="flex-1">
            <p className="font-semibold text-foreground">{plan?.name || "Free"}</p>
            <p className="text-sm text-muted-foreground">
              {isPro
                ? subscription?.subscription?.cancel_at_period_end
                  ? `Active until ${new Date(subscription.subscription.current_period_end || "").toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" })}`
                  : subscription?.subscription?.status === "active" ? "Active" : subscription?.subscription?.status || "Active"
                : "Free"}
              {isPro && plan?.interval ? ` — ${plan.interval}` : ""}
              {entitlements?.storageBytes ? ` — ${formatBytes(entitlements.storageBytes)} storage` : ""}
            </p>
            {subscription?.subscription?.currency && (
              <p className="text-xs text-muted-foreground mt-1">Currency: {subscription.subscription.currency}</p>
            )}
            {isPro && subscription?.subscription?.current_period_end && (
              <p className="text-xs text-muted-foreground mt-1">
                {subscription?.subscription?.cancel_at_period_end ? "Cancels" : "Renews"}: {new Date(subscription.subscription.current_period_end).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" })}
              </p>
            )}
            {isPro && subscription?.subscription?.expires_at && (
              <p className="text-xs text-muted-foreground mt-1">Expires: {new Date(subscription.subscription.expires_at).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" })}</p>
            )}
          </div>
{isRecurring && (
            <Button variant="outline" className="border-destructive/50 text-destructive hover:bg-destructive/10" onClick={() => setCancelDialogOpen(true)} disabled={cancelling}>
              {cancelling ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Cancel
            </Button>
          )}
        </div>
      </GlassCard>

      <Dialog open={cancelDialogOpen} onOpenChange={setCancelDialogOpen}>
        <DialogContent className="bg-card border-border text-foreground">
          <DialogHeader>
            <DialogTitle>Cancel Subscription?</DialogTitle>
            <DialogDescription className="text-muted-foreground">
              Your subscription will remain active until the end of the billing period,
              then automatically cancel.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setCancelDialogOpen(false)} className="text-muted-foreground hover:text-foreground">
              Keep Plan
            </Button>
            <Button variant="destructive" onClick={handleCancel} disabled={cancelling}>
              {cancelling ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Cancel Subscription
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {usageData && (
        <GlassCard className="p-6">
          <h3 className="text-base font-semibold text-foreground mb-4">Usage This Period</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[
              { label: "Clients", value: usageData.clients, limit: limits.clients },
              { label: "Active Projects", value: usageData.activeProjects, limit: limits.activeProjects },
              { label: "Tasks", value: usageData.tasks, limit: limits.tasks },
              { label: "Invoices (month)", value: usageData.invoicesMonthly, limit: limits.invoicesMonthly },
              { label: "Video Uploads (month)", value: usageData.videoUploadsMonthly, limit: limits.videoUploadsMonthly },
              { label: "Storage", value: usageData.storageBytes, limit: usage?.storageBytes, isBytes: true },
            ].map((item) => {
              const max = item.limit ?? null
              const pct = max ? Math.min(100, (item.value / max) * 100) : 0
              const nearLimit = pct > 80
              return (
                <div key={item.label} className="p-3 rounded-lg bg-muted/50 border border-border">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs text-muted-foreground">{item.label}</span>
                    <span className={`text-xs font-medium ${nearLimit ? "text-orange-500" : "text-muted-foreground"}`}>
                      {item.isBytes ? formatBytes(item.value) : item.value}{max !== null ? ` / ${item.isBytes ? formatBytes(max) : max}` : ""}
                    </span>
                  </div>
                  {max !== null && (
                    <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                      <div className={`h-full rounded-full transition-all ${nearLimit ? "bg-orange-500" : "bg-primary"}`} style={{ width: `${pct}%` }} />
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </GlassCard>
      )}

      <GlassCard className="p-6">
        <h3 className="text-base font-semibold text-foreground mb-4">Payment History</h3>
        {payments.length === 0 ? (
          <p className="text-sm text-muted-foreground py-4 text-center">No payments yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-2 px-3 text-xs font-medium text-muted-foreground">Date</th>
                  <th className="text-left py-2 px-3 text-xs font-medium text-muted-foreground">Plan</th>
                  <th className="text-left py-2 px-3 text-xs font-medium text-muted-foreground">Currency</th>
                  <th className="text-left py-2 px-3 text-xs font-medium text-muted-foreground">Amount</th>
                  <th className="text-left py-2 px-3 text-xs font-medium text-muted-foreground">Status</th>
                  <th className="text-left py-2 px-3 text-xs font-medium text-muted-foreground">Payment ID</th>
                </tr>
              </thead>
              <tbody>
                {payments.map((p) => (
                  <tr key={p.id} className="border-b border-border/50">
                    <td className="py-2 px-3 text-foreground">{p.paid_at || p.created_at}</td>
                    <td className="py-2 px-3 text-foreground">{p.plan_name}</td>
                    <td className="py-2 px-3 text-xs text-muted-foreground">{p.currency}</td>
                    <td className="py-2 px-3 text-foreground">{p.amount.toLocaleString()}</td>
                    <td className="py-2 px-3">
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${p.status === "paid" ? "bg-green-500/10 text-green-600" : p.status === "created" ? "bg-yellow-500/10 text-yellow-600" : "bg-red-500/10 text-red-600"}`}>
                        {p.status}
                      </span>
                    </td>
                    <td className="py-2 px-3 text-xs text-muted-foreground font-mono">{p.provider_payment_id || p.provider_order_id || "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </GlassCard>
    </div>
  )
}

export default function SettingsPage() {
  const { user, updateUser, logout } = useAuth()
  const { preferences, updatePreferences } = usePreferences()

  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [phone, setPhone] = useState("")
  const [avatarUrl, setAvatarUrl] = useState("")
  const [workspaceName, setWorkspaceName] = useState("")
  const [country, setCountry] = useState(preferences.country)
  const [currency, setCurrency] = useState(preferences.currency)
  const [currencySymbol, setCurrencySymbol] = useState(preferences.currencySymbol)
  const [phoneCode, setPhoneCode] = useState(preferences.phoneCode)
  const [savingPreferences, setSavingPreferences] = useState(false)

  const [editingName, setEditingName] = useState(false)
  const [editingPhone, setEditingPhone] = useState(false)
  const [editName, setEditName] = useState("")
  const [editPhone, setEditPhone] = useState("")

  const [currentPassword, setCurrentPassword] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [uploadingAvatar, setUploadingAvatar] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)

  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (user) {
      setName(user.name || "")
      setEmail(user.email || "")
      setPhone(user.phone || "")
      setAvatarUrl(user.avatar || "")
      setWorkspaceName(user.name ? `${user.name}'s Workspace` : "My Workspace")
      setEditName(user.name || "")
      setEditPhone(user.phone || "")
      setLoading(false)
    }
  }, [user])

  useEffect(() => {
    setCountry(preferences.country)
    setCurrency(preferences.currency)
    setCurrencySymbol(preferences.currencySymbol)
    setPhoneCode(preferences.phoneCode)
  }, [preferences])

  const handleCountryChange = (value: string) => {
    const selected = countryOptions.find((item) => item.name === value)
    if (!selected) return
    setCountry(selected.name)
    setCurrency(selected.currency)
    setCurrencySymbol(selected.symbol)
    setPhoneCode(selected.phoneCode)
  }

  const handleSavePreferences = async () => {
    setSavingPreferences(true)
    try {
      await updatePreferences({ country, currency, currencySymbol, phoneCode })
      toast.success("Country and currency updated.")
    } catch (err: any) {
      toast.error(err.message || "Failed to update country and currency.")
    } finally {
      setSavingPreferences(false)
    }
  }

  const handleAvatarUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (file.size > 2 * 1024 * 1024) {
      toast.error("File must be less than 2MB.")
      return
    }

    const allowed = ["image/jpeg", "image/png", "image/gif", "image/webp"]
    if (!allowed.includes(file.type)) {
      toast.error("Only JPG, PNG, GIF, or WebP allowed.")
      return
    }

    setUploadingAvatar(true)
    try {
      const url = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader()
        reader.onload = () => resolve(String(reader.result))
        reader.onerror = () => reject(new Error("Could not read the image."))
        reader.readAsDataURL(file)
      })
      await api.put("/auth/profile", { avatar: url })
      setAvatarUrl(url)
      updateUser({ avatar: url })
      toast.success("Avatar updated successfully.")
    } catch (err: any) {
      toast.error(err.message || "Failed to process avatar.")
    } finally {
      setUploadingAvatar(false)
      if (fileInputRef.current) fileInputRef.current.value = ""
    }
  }, [])

  const handleSaveName = async () => {
    if (!editName.trim()) {
      toast.error("Name cannot be empty.")
      return
    }
    setSaving(true)
    try {
      await api.put("/auth/profile", { name: editName.trim() })
      setName(editName.trim())
      updateUser({ name: editName.trim() })
      setEditingName(false)
      toast.success("Name updated.")
    } catch (err: any) {
      toast.error(err.message || "Failed to update name.")
    } finally {
      setSaving(false)
    }
  }

  const handleSavePhone = async () => {
    setSaving(true)
    try {
      await api.put("/auth/profile", { phone: editPhone.trim() })
      setPhone(editPhone.trim())
      updateUser({ phone: editPhone.trim() })
      setEditingPhone(false)
      toast.success("Phone updated.")
    } catch (err: any) {
      toast.error(err.message || "Failed to update phone.")
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteAccount = async () => {
    setSaving(true)
    try {
      await api.delete("/auth/account")
      toast.success("Your account has been deleted.")
      logout()
    } catch (err: any) {
      toast.error(err.message || "Failed to delete account.")
    } finally {
      setSaving(false)
      setDeleteOpen(false)
    }
  }

  const handleChangePassword = async () => {
    if (!currentPassword) {
      toast.error("Please enter your current password.")
      return
    }
    if (!newPassword || !confirmPassword) {
      toast.error("Please fill in all password fields.")
      return
    }
    if (newPassword !== confirmPassword) {
      toast.error("New passwords do not match.")
      return
    }
    const { valid, errors } = validatePassword(newPassword)
    if (!valid) {
      toast.error(errors[0])
      return
    }

    setSaving(true)
    try {
      await api.put("/auth/change-password", {
        currentPassword,
        newPassword,
      })
      toast.success("Password changed successfully.")
      setCurrentPassword("")
      setNewPassword("")
      setConfirmPassword("")
    } catch (err: any) {
      toast.error(err.message || "Failed to change password.")
    } finally {
      setSaving(false)
    }
  }

  const newPwValidation = validatePassword(newPassword)

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
        <h1 className="text-2xl font-bold text-foreground">Settings</h1>
        <p className="text-muted-foreground mt-1">Manage your account and workspace preferences.</p>
      </div>

      <Tabs defaultValue="profile" className="w-full">
        <GlassCard className="p-1 mb-6 overflow-x-auto scrollbar-none">
          <TabsList className="w-max min-w-full justify-start gap-1 bg-transparent p-1">
            <TabsTrigger value="profile" className="shrink-0 whitespace-nowrap gap-2 data-[state=active]:bg-muted data-[state=active]:text-foreground text-muted-foreground hover:text-foreground">
              <User className="h-4 w-4" />
              Profile
            </TabsTrigger>
            <TabsTrigger value="account" className="shrink-0 whitespace-nowrap gap-2 data-[state=active]:bg-muted data-[state=active]:text-foreground text-muted-foreground hover:text-foreground">
              <Lock className="h-4 w-4" />
              Account
            </TabsTrigger>
            <TabsTrigger value="workspace" className="shrink-0 whitespace-nowrap gap-2 data-[state=active]:bg-muted data-[state=active]:text-foreground text-muted-foreground hover:text-foreground">
              <Briefcase className="h-4 w-4" />
              Workspace
            </TabsTrigger>
            <TabsTrigger value="security" className="shrink-0 whitespace-nowrap gap-2 data-[state=active]:bg-muted data-[state=active]:text-foreground text-muted-foreground hover:text-foreground">
              <Shield className="h-4 w-4" />
              Security
            </TabsTrigger>
            <TabsTrigger value="billing" className="shrink-0 whitespace-nowrap gap-2 data-[state=active]:bg-muted data-[state=active]:text-foreground text-muted-foreground hover:text-foreground">
              <CreditCard className="h-4 w-4" />
              Billing
            </TabsTrigger>
          </TabsList>
        </GlassCard>

        {/* ========== PROFILE TAB ========== */}
        <TabsContent value="profile">
          <GlassCard className="p-6 space-y-8">
            <div>
              <h2 className="text-lg font-semibold text-foreground mb-1">Profile</h2>
              <p className="text-sm text-muted-foreground">Your personal information and avatar.</p>
            </div>

            {/* Avatar */}
            <div className="flex items-center gap-6">
              <div className="relative group">
                <Avatar className="h-20 w-20">
                  <AvatarImage src={avatarUrl} alt={name} />
                  <AvatarFallback className="text-xl">{getInitials(name || email)}</AvatarFallback>
                </Avatar>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploadingAvatar}
                  className="absolute inset-0 flex items-center justify-center rounded-full bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                >
                  {uploadingAvatar ? (
                    <Loader2 className="h-5 w-5 text-white animate-spin" />
                  ) : (
                    <Camera className="h-5 w-5 text-white" />
                  )}
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/gif,image/webp"
                  onChange={handleAvatarUpload}
                  className="hidden"
                />
              </div>
              <div>
                <Button
                  variant="outline"
                  className="border-border text-foreground hover:bg-muted"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploadingAvatar}
                >
                  {uploadingAvatar ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : (
                    <Camera className="h-4 w-4 mr-2" />
                  )}
                  Change Avatar
                </Button>
                <p className="text-xs text-muted-foreground mt-2">JPG, PNG, GIF or WebP. Max 2MB.</p>
              </div>
            </div>

            {/* Name */}
            <div className="space-y-2">
              <Label className="text-muted-foreground">Full Name</Label>
              {editingName ? (
                <div className="flex items-center gap-2">
                  <Input
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="bg-muted border-border text-foreground focus-visible:ring-ring/20 flex-1"
                    autoFocus
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleSaveName()
                      if (e.key === "Escape") {
                        setEditName(name)
                        setEditingName(false)
                      }
                    }}
                  />
                  <Button size="sm" onClick={handleSaveName} disabled={saving} className="bg-primary text-primary-foreground hover:bg-primary/90">
                    {saving ? <Loader2 className="h-3 w-3 animate-spin" /> : <CheckCircle2 className="h-3 w-3" />}
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => { setEditName(name); setEditingName(false) }} className="text-muted-foreground hover:text-foreground">
                    <XCircle className="h-3 w-3" />
                  </Button>
                </div>
              ) : (
                <div className="flex items-center gap-3">
                  <div className="flex-1 h-10 rounded-md bg-muted border border-border px-3 flex items-center text-foreground">
                    {name || <span className="text-muted-foreground">Not set</span>}
                  </div>
                  <Button size="sm" variant="ghost" onClick={() => setEditingName(true)} className="text-muted-foreground hover:text-foreground hover:bg-muted">
                    <Pencil className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </div>

            {/* Email (read-only) */}
            <div className="space-y-2">
              <Label className="text-muted-foreground">Email</Label>
              <div className="flex items-center gap-3">
                <div className="flex-1 h-10 rounded-md bg-muted border border-border px-3 flex items-center text-muted-foreground">
                  {email}
                </div>
                <div className="w-8" />
              </div>
            </div>

            {/* Phone */}
            <div className="space-y-2">
              <Label className="text-muted-foreground">Phone Number</Label>
              {editingPhone ? (
                <div className="flex items-center gap-2">
                  <Input
                    value={editPhone}
                    onChange={(e) => setEditPhone(e.target.value)}
                    className="bg-muted border-border text-foreground focus-visible:ring-ring/20 flex-1"
                    placeholder="+91 98765 43210"
                    autoFocus
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleSavePhone()
                      if (e.key === "Escape") {
                        setEditPhone(phone)
                        setEditingPhone(false)
                      }
                    }}
                  />
                  <Button size="sm" onClick={handleSavePhone} disabled={saving} className="bg-primary text-primary-foreground hover:bg-primary/90">
                    {saving ? <Loader2 className="h-3 w-3 animate-spin" /> : <CheckCircle2 className="h-3 w-3" />}
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => { setEditPhone(phone); setEditingPhone(false) }} className="text-muted-foreground hover:text-foreground">
                    <XCircle className="h-3 w-3" />
                  </Button>
                </div>
              ) : (
                <div className="flex items-center gap-3">
                  <div className="flex-1 h-10 rounded-md bg-muted border border-border px-3 flex items-center text-foreground">
                    {phone || <span className="text-muted-foreground">Not set</span>}
                  </div>
                  <Button size="sm" variant="ghost" onClick={() => setEditingPhone(true)} className="text-muted-foreground hover:text-foreground hover:bg-muted">
                    <Pencil className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </div>

            <div className="border-t border-destructive/30 pt-6">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h3 className="text-base font-medium text-foreground">Delete Account</h3>
                  <p className="mt-1 text-sm text-muted-foreground">Permanently delete your account and all data you created.</p>
                </div>
<Button variant="outline" onClick={() => setDeleteOpen(true)} disabled={saving} className="border-destructive/50 text-destructive hover:bg-destructive/10">
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete Account
                </Button>
              </div>
            </div>
          </GlassCard>

          <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
            <DialogContent className="bg-card border-border text-foreground">
              <DialogHeader>
                <DialogTitle>Delete Account</DialogTitle>
                <DialogDescription className="text-muted-foreground">
                  This will permanently delete your account and all associated data.
                  This action cannot be undone.
                </DialogDescription>
              </DialogHeader>
              <DialogFooter>
                <Button variant="ghost" onClick={() => setDeleteOpen(false)} className="text-muted-foreground hover:text-foreground">
                  Keep Account
                </Button>
                <Button variant="destructive" onClick={handleDeleteAccount} disabled={saving}>
                  {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                  Delete Account
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </TabsContent>

        {/* ========== ACCOUNT TAB (Change Password) ========== */}
        <TabsContent value="account">
          <GlassCard className="p-6 space-y-8">
            <div>
              <h2 className="text-lg font-semibold text-foreground mb-1">Change Password</h2>
              <p className="text-sm text-muted-foreground">Enter your current password, then set a new one.</p>
            </div>

            <div className="space-y-4 max-w-md">
              <div className="space-y-2">
                <Label className="text-muted-foreground">Current Password</Label>
                <PasswordInput
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className="bg-muted border-border text-foreground placeholder:text-muted-foreground focus-visible:ring-ring/20"
                  placeholder="Enter current password"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-muted-foreground">New Password</Label>
                <PasswordInput
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="bg-muted border-border text-foreground placeholder:text-muted-foreground focus-visible:ring-ring/20"
                  placeholder="Enter new password"
                />
                {newPassword.length > 0 && (
                  <div className="space-y-1 mt-2">
                    <PasswordRequirement met={newPassword.length >= 8 && newPassword.length <= 64} text="8-64 characters" />
                    <PasswordRequirement met={/[A-Z]/.test(newPassword)} text="One uppercase letter" />
                    <PasswordRequirement met={/[a-z]/.test(newPassword)} text="One lowercase letter" />
                    <PasswordRequirement met={/[0-9]/.test(newPassword)} text="One number" />
                    <PasswordRequirement met={/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?`~]/.test(newPassword)} text="One symbol" />
                  </div>
                )}
              </div>
              <div className="space-y-2">
                <Label className="text-muted-foreground">Confirm New Password</Label>
                <PasswordInput
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="bg-muted border-border text-foreground placeholder:text-muted-foreground focus-visible:ring-ring/20"
                  placeholder="Confirm new password"
                />
                {confirmPassword.length > 0 && (
                  <div className="flex items-center gap-1.5 text-xs mt-1">
                    {newPassword === confirmPassword ? (
                      <>
                        <CheckCircle2 className="h-3 w-3 text-green-600 dark:text-green-400" />
                        <span className="text-green-600 dark:text-green-400">Passwords match</span>
                      </>
                    ) : (
                      <>
                        <AlertCircle className="h-3 w-3 text-red-500" />
                        <span className="text-red-500">Passwords do not match</span>
                      </>
                    )}
                  </div>
                )}
              </div>
            </div>

            <div className="flex justify-end">
              <Button
                className="bg-primary text-primary-foreground hover:bg-primary/90"
                onClick={handleChangePassword}
                disabled={saving || !currentPassword || !newPassword || !confirmPassword || !newPwValidation.valid}
              >
                {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                Change Password
              </Button>
            </div>
          </GlassCard>
        </TabsContent>

        {/* ========== WORKSPACE TAB ========== */}
        <TabsContent value="workspace">
          <GlassCard className="p-6 space-y-8">
            <div>
              <h2 className="text-lg font-semibold text-foreground mb-1">Workspace</h2>
              <p className="text-sm text-muted-foreground">Manage your workspace settings.</p>
            </div>

            <div className="space-y-2 max-w-md">
              <Label className="text-muted-foreground">Workspace Name</Label>
              <Input
                value={workspaceName}
                onChange={(e) => setWorkspaceName(e.target.value)}
                className="bg-muted border-border text-foreground placeholder:text-muted-foreground focus-visible:ring-ring/20"
                placeholder="Enter workspace name"
              />
            </div>

            <div className="max-w-2xl space-y-4 border-t border-border pt-6">
              <div>
                <h3 className="text-base font-medium text-foreground">Regional Settings</h3>
                <p className="mt-1 text-sm text-muted-foreground">Choose your country. Currency, symbol, and phone code update automatically.</p>
              </div>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label className="text-muted-foreground">Country</Label>
                  <select
                    value={country}
                    onChange={(e) => handleCountryChange(e.target.value)}
                    className="flex h-10 w-full rounded-md border border-border bg-muted px-3 py-2 text-sm text-foreground outline-none focus:ring-2 focus:ring-ring"
                  >
                    {countryOptions.map((item) => <option key={item.code} value={item.name}>{item.name}</option>)}
                  </select>
                </div>
                <div className="space-y-2">
                  <Label className="text-muted-foreground">Currency</Label>
                  <Input value={`${currency} (${currencySymbol})`} readOnly className="bg-muted border-border text-foreground" />
                </div>
                <div className="space-y-2">
                  <Label className="text-muted-foreground">Currency Symbol</Label>
                  <Input value={currencySymbol} readOnly className="bg-muted border-border text-foreground" />
                </div>
                <div className="space-y-2">
                  <Label className="text-muted-foreground">Phone Country Code</Label>
                  <Input value={phoneCode || "Not available"} readOnly className="bg-muted border-border text-foreground" />
                </div>
              </div>
            </div>

            <div className="flex justify-end">
              <Button className="bg-primary text-primary-foreground hover:bg-primary/90" onClick={handleSavePreferences} disabled={savingPreferences}>
                {savingPreferences && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Save Changes
              </Button>
            </div>
          </GlassCard>
        </TabsContent>

        {/* ========== SECURITY TAB ========== */}
        <TabsContent value="security">
          <GlassCard className="p-6 space-y-8">
            <div>
              <h2 className="text-lg font-semibold text-foreground mb-1">Security</h2>
              <p className="text-sm text-muted-foreground">Manage your security settings and sessions.</p>
            </div>

            <div className="space-y-4">
              <h3 className="text-base font-medium text-foreground">Session Management</h3>
              <p className="text-sm text-muted-foreground">
                View and manage your active sessions across devices. Coming soon.
              </p>
            </div>
          </GlassCard>
        </TabsContent>

        {/* ========== BILLING TAB ========== */}
        <TabsContent value="billing">
          <BillingTabContent />
        </TabsContent>
      </Tabs>
    </div>
  )
}
