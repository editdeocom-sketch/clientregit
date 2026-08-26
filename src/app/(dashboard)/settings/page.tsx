"use client"

import { useState } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { GlassCard } from "@/components/layout/glass-card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { getInitials } from "@/lib/utils"
import { toast } from "sonner"
import { User, Lock, Briefcase, Shield } from "lucide-react"

export default function SettingsPage() {
  const [name, setName] = useState("Alex Kumar")
  const [email] = useState("alex@clientregit.com")
  const [oldPassword, setOldPassword] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [workspaceName, setWorkspaceName] = useState("Alex Kumar Creative")

  const handleSaveProfile = () => {
    toast.success("Profile updated successfully.")
  }

  const handleChangePassword = () => {
    if (!oldPassword || !newPassword || !confirmPassword) {
      toast.error("Please fill in all password fields.")
      return
    }
    if (newPassword !== confirmPassword) {
      toast.error("New passwords do not match.")
      return
    }
    toast.success("Password changed successfully.")
    setOldPassword("")
    setNewPassword("")
    setConfirmPassword("")
  }

  const handleSaveWorkspace = () => {
    toast.success("Workspace updated successfully.")
  }

  return (
    <div className="p-6 space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-white">Settings</h1>
        <p className="text-white/50 mt-1">Manage your account and workspace preferences.</p>
      </div>

      <Tabs defaultValue="profile" className="w-full">
        <GlassCard className="p-1 mb-6">
          <TabsList className="w-full justify-start gap-1 bg-transparent p-1">
            <TabsTrigger
              value="profile"
              className="gap-2 data-[state=active]:bg-white/10 data-[state=active]:text-white text-white/50 hover:text-white"
            >
              <User className="h-4 w-4" />
              Profile
            </TabsTrigger>
            <TabsTrigger
              value="account"
              className="gap-2 data-[state=active]:bg-white/10 data-[state=active]:text-white text-white/50 hover:text-white"
            >
              <Lock className="h-4 w-4" />
              Account
            </TabsTrigger>
            <TabsTrigger
              value="workspace"
              className="gap-2 data-[state=active]:bg-white/10 data-[state=active]:text-white text-white/50 hover:text-white"
            >
              <Briefcase className="h-4 w-4" />
              Workspace
            </TabsTrigger>
            <TabsTrigger
              value="security"
              className="gap-2 data-[state=active]:bg-white/10 data-[state=active]:text-white text-white/50 hover:text-white"
            >
              <Shield className="h-4 w-4" />
              Security
            </TabsTrigger>
          </TabsList>
        </GlassCard>

        <TabsContent value="profile">
          <GlassCard className="p-6 space-y-8">
            <div>
              <h2 className="text-lg font-semibold text-white mb-1">Profile</h2>
              <p className="text-sm text-white/50">Update your personal information and avatar.</p>
            </div>

            <div className="flex items-center gap-6">
              <Avatar className="h-20 w-20">
                <AvatarImage src="" alt={name} />
                <AvatarFallback className="text-xl">{getInitials(name)}</AvatarFallback>
              </Avatar>
              <div>
                <Button variant="outline" className="border-white/20 text-white hover:bg-white/10">
                  Change Avatar
                </Button>
                <p className="text-xs text-white/40 mt-2">JPG, PNG or GIF. Max size 2MB.</p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label className="text-white/70">Full Name</Label>
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="bg-white/5 border-white/10 text-white placeholder:text-white/30 focus-visible:ring-white/20"
                  placeholder="Enter your full name"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-white/70">Email</Label>
                <Input
                  value={email}
                  readOnly
                  className="bg-white/5 border-white/10 text-white/50 cursor-not-allowed"
                />
              </div>
            </div>

            <div className="flex justify-end">
              <Button className="bg-white text-[#0B132B] hover:bg-white/90" onClick={handleSaveProfile}>
                Save Changes
              </Button>
            </div>
          </GlassCard>
        </TabsContent>

        <TabsContent value="account">
          <GlassCard className="p-6 space-y-8">
            <div>
              <h2 className="text-lg font-semibold text-white mb-1">Change Password</h2>
              <p className="text-sm text-white/50">Update your password to keep your account secure.</p>
            </div>

            <div className="space-y-4 max-w-md">
              <div className="space-y-2">
                <Label className="text-white/70">Current Password</Label>
                <Input
                  type="password"
                  value={oldPassword}
                  onChange={(e) => setOldPassword(e.target.value)}
                  className="bg-white/5 border-white/10 text-white placeholder:text-white/30 focus-visible:ring-white/20"
                  placeholder="Enter current password"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-white/70">New Password</Label>
                <Input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="bg-white/5 border-white/10 text-white placeholder:text-white/30 focus-visible:ring-white/20"
                  placeholder="Enter new password"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-white/70">Confirm New Password</Label>
                <Input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="bg-white/5 border-white/10 text-white placeholder:text-white/30 focus-visible:ring-white/20"
                  placeholder="Confirm new password"
                />
              </div>
            </div>

            <div className="flex justify-end">
              <Button className="bg-white text-[#0B132B] hover:bg-white/90" onClick={handleChangePassword}>
                Change Password
              </Button>
            </div>
          </GlassCard>
        </TabsContent>

        <TabsContent value="workspace">
          <GlassCard className="p-6 space-y-8">
            <div>
              <h2 className="text-lg font-semibold text-white mb-1">Workspace</h2>
              <p className="text-sm text-white/50">Manage your workspace settings.</p>
            </div>

            <div className="space-y-2 max-w-md">
              <Label className="text-white/70">Workspace Name</Label>
              <Input
                value={workspaceName}
                onChange={(e) => setWorkspaceName(e.target.value)}
                className="bg-white/5 border-white/10 text-white placeholder:text-white/30 focus-visible:ring-white/20"
                placeholder="Enter workspace name"
              />
            </div>

            <div className="flex justify-end">
              <Button className="bg-white text-[#0B132B] hover:bg-white/90" onClick={handleSaveWorkspace}>
                Save Changes
              </Button>
            </div>
          </GlassCard>
        </TabsContent>

        <TabsContent value="security">
          <GlassCard className="p-6 space-y-8">
            <div>
              <h2 className="text-lg font-semibold text-white mb-1">Security</h2>
              <p className="text-sm text-white/50">Manage your security settings and sessions.</p>
            </div>

            <div className="space-y-4">
              <h3 className="text-base font-medium text-white">Session Management</h3>
              <p className="text-sm text-white/50">
                View and manage your active sessions across devices. Coming soon.
              </p>
            </div>
          </GlassCard>
        </TabsContent>
      </Tabs>
    </div>
  )
}
