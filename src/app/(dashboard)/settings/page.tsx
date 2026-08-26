"use client"

import { useEffect, useState, useRef, useCallback } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { GlassCard } from "@/components/layout/glass-card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { PasswordInput } from "@/components/ui/password-input"
import { getInitials } from "@/lib/utils"
import { toast } from "sonner"
import {
  User, Lock, Briefcase, Shield, Loader2, Pencil, Camera,
  CheckCircle2, XCircle, AlertCircle
} from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { cn } from "@/lib/utils"

function validatePassword(pw: string): { valid: boolean; errors: string[] } {
  const errors: string[] = []
  if (pw.length < 6) errors.push("At least 6 characters")
  if (pw.length > 10) errors.push("Max 10 characters")
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

export default function SettingsPage() {
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [phone, setPhone] = useState("")
  const [avatarUrl, setAvatarUrl] = useState("")
  const [workspaceName, setWorkspaceName] = useState("")

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
  const [userId, setUserId] = useState("")

  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    async function loadProfile() {
      try {
        const supabase = createClient()
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return

        setUserId(user.id)
        setEmail(user.email || "")

        let { data: profile } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", user.id)
          .single()

        if (!profile) {
          const metaName = user.user_metadata?.full_name || ""
          const metaPhone = user.user_metadata?.phone || ""
          await supabase.from("profiles").upsert({
            id: user.id,
            full_name: metaName,
            email: user.email || "",
            phone: metaPhone,
            role: user.user_metadata?.role || "editor",
          }, { onConflict: "id" })
          profile = {
            id: user.id,
            full_name: metaName,
            email: user.email || "",
            phone: metaPhone,
            avatar_url: null,
            role: user.user_metadata?.role || "editor",
            created_at: new Date().toISOString(),
          }
        }

        if (profile) {
          setName(profile.full_name || "")
          setPhone(profile.phone || "")
          setAvatarUrl(profile.avatar_url || "")
          setWorkspaceName(profile.full_name ? `${profile.full_name}'s Workspace` : "My Workspace")
          setEditName(profile.full_name || "")
          setEditPhone(profile.phone || "")
        }
      } catch {
        // ignore
      } finally {
        setLoading(false)
      }
    }
    loadProfile()
  }, [])

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
      const supabase = createClient()
      const ext = file.name.split(".").pop()
      const filePath = `${userId}/avatar.${ext}`

      let { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(filePath, file, { upsert: true })

      if (uploadError && uploadError.message?.includes("Bucket not found")) {
        await supabase.storage.createBucket("avatars", { public: true })
        const retry = await supabase.storage
          .from("avatars")
          .upload(filePath, file, { upsert: true })
        if (retry.error) throw retry.error
      } else if (uploadError) {
        throw uploadError
      }

      const { data } = supabase.storage.from("avatars").getPublicUrl(filePath)
      const publicUrl = `${data.publicUrl}?t=${Date.now()}`

      const { error: updateError } = await supabase
        .from("profiles")
        .update({ avatar_url: publicUrl })
        .eq("id", userId)

      if (updateError) throw updateError

      setAvatarUrl(publicUrl)
      toast.success("Avatar updated!")
    } catch (err: any) {
      toast.error(err.message || "Failed to upload avatar. Please run the avatar bucket SQL first.")
    } finally {
      setUploadingAvatar(false)
      if (fileInputRef.current) fileInputRef.current.value = ""
    }
  }, [userId])

  const handleSaveName = async () => {
    if (!editName.trim()) {
      toast.error("Name cannot be empty.")
      return
    }
    setSaving(true)
    try {
      const supabase = createClient()
      const { error } = await supabase
        .from("profiles")
        .update({ full_name: editName.trim() })
        .eq("id", userId)
      if (error) throw error
      setName(editName.trim())
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
      const supabase = createClient()
      const { error } = await supabase
        .from("profiles")
        .update({ phone: editPhone.trim() })
        .eq("id", userId)
      if (error) throw error
      setPhone(editPhone.trim())
      setEditingPhone(false)
      toast.success("Phone updated.")
    } catch (err: any) {
      toast.error(err.message || "Failed to update phone.")
    } finally {
      setSaving(false)
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
      const supabase = createClient()

      const { error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password: currentPassword,
      })
      if (signInError) {
        toast.error("Current password is incorrect.")
        setSaving(false)
        return
      }

      const { error } = await supabase.auth.updateUser({ password: newPassword })
      if (error) throw error
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
        <GlassCard className="p-1 mb-6">
          <TabsList className="w-full justify-start gap-1 bg-transparent p-1">
            <TabsTrigger value="profile" className="gap-2 data-[state=active]:bg-muted data-[state=active]:text-foreground text-muted-foreground hover:text-foreground">
              <User className="h-4 w-4" />
              Profile
            </TabsTrigger>
            <TabsTrigger value="account" className="gap-2 data-[state=active]:bg-muted data-[state=active]:text-foreground text-muted-foreground hover:text-foreground">
              <Lock className="h-4 w-4" />
              Account
            </TabsTrigger>
            <TabsTrigger value="workspace" className="gap-2 data-[state=active]:bg-muted data-[state=active]:text-foreground text-muted-foreground hover:text-foreground">
              <Briefcase className="h-4 w-4" />
              Workspace
            </TabsTrigger>
            <TabsTrigger value="security" className="gap-2 data-[state=active]:bg-muted data-[state=active]:text-foreground text-muted-foreground hover:text-foreground">
              <Shield className="h-4 w-4" />
              Security
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
          </GlassCard>
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
                    <PasswordRequirement met={newPassword.length >= 6 && newPassword.length <= 10} text="6-10 characters" />
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

            <div className="flex justify-end">
              <Button className="bg-primary text-primary-foreground hover:bg-primary/90" onClick={() => toast.success("Workspace updated.")}>
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
      </Tabs>
    </div>
  )
}