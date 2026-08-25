"use client"

import { Bell, Moon, Sun, Menu, Search } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from "@/components/ui/dropdown-menu"
import { cn } from "@/lib/utils"
import { getInitials } from "@/lib/utils"
import { useTheme } from "next-themes"
import { useRouter } from "next/navigation"

interface TopbarProps {
  user: {
    full_name: string | null
    email: string
    avatar_url: string | null
  }
}

export function Topbar({ user }: TopbarProps) {
  const { theme, setTheme } = useTheme()
  const router = useRouter()

  const handleLogout = async () => {
    const res = await fetch("/api/auth/logout", { method: "POST" })
    if (res.ok) {
      router.push("/login")
      router.refresh()
    }
  }

  return (
    <header className="sticky top-0 z-30 h-16 bg-[#0B132B]/80 backdrop-blur-md border-b border-white/10">
      <div className="flex h-full items-center justify-between px-6">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden text-white/60 hover:text-white"
            onClick={() => {
              const sidebar = document.querySelector('aside[class*="fixed"]')
              if (sidebar) {
                sidebar.classList.toggle("w-72")
                sidebar.classList.toggle("w-20")
              }
            }}
          >
            <Menu className="h-5 w-5" />
          </Button>
          <div className="relative hidden sm:block">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/40" />
            <input
              type="search"
              placeholder="Search clients, projects..."
              className="h-9 w-64 rounded-lg bg-white/5 border border-white/10 px-10 py-2 text-sm text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-white/20 focus:border-transparent"
            />
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            className="text-white/60 hover:text-white"
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          >
            {theme === "dark" ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
          </Button>

          <Button variant="ghost" size="icon" className="text-white/60 hover:text-white relative">
            <Bell className="h-5 w-5" />
            <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-red-500 text-[10px] font-medium flex items-center justify-center">
              3
            </span>
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-10 w-10 rounded-full p-0">
                <Avatar className="h-10 w-10">
                  <AvatarImage src={user.avatar_url || undefined} alt={user.full_name || user.email} />
                  <AvatarFallback>{getInitials(user.full_name || user.email)}</AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56 bg-[#0B132B] border-white/10">
              <div className="px-2 py-1">
                <p className="text-sm font-medium text-white">{user.full_name || "User"}</p>
                <p className="text-xs text-white/50 truncate">{user.email}</p>
              </div>
              <DropdownMenuSeparator className="border-white/10" />
              <DropdownMenuItem onClick={handleLogout} className="text-white hover:bg-white/10">
                Log out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  )
}