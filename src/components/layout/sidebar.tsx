"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  LayoutDashboard,
  Users,
  FolderKanban,
  CheckSquare,
  Video,
  FileText,
  Settings,
  LogOut,
  User,
  ChevronLeft,
  ChevronRight,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Logo } from "@/components/layout/logo"
import { useState } from "react"

const navigation = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { name: "Clients", href: "/clients", icon: Users },
  { name: "Projects", href: "/projects", icon: FolderKanban },
  { name: "Tasks", href: "/tasks", icon: CheckSquare },
  { name: "Videos", href: "/videos", icon: Video },
  { name: "Invoices", href: "/invoices", icon: FileText },
]

const systemNavigation = [
  { name: "Settings", href: "/settings", icon: Settings },
]

export function Sidebar() {
  const pathname = usePathname()
  const [collapsed, setCollapsed] = useState(false)

  return (
    <aside
      className={cn(
        "fixed left-0 top-0 z-40 h-screen bg-[#0B132B] border-r border-white/5 transition-all duration-300",
        collapsed ? "w-20" : "w-72"
      )}
    >
      <div className="flex h-full flex-col">
        <div className="flex h-16 items-center justify-between px-4 border-b border-white/10">
          {!collapsed && (
            <Link href="/dashboard" className="flex items-center">
              <Logo size="sm" showText={false} />
              <span className="ml-2 font-semibold text-lg text-white">
                Client<span className="text-[#5C7A9B]">Regit</span>
              </span>
            </Link>
          )}
          <Button
            variant="ghost"
            size="icon"
            className={cn("text-white/60 hover:text-white", collapsed && "mx-auto")}
            onClick={() => setCollapsed(!collapsed)}
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {collapsed ? <ChevronRight className="h-5 w-5" /> : <ChevronLeft className="h-5 w-5" />}
          </Button>
        </div>

        <nav className="flex-1 space-y-1 px-3 py-4 overflow-y-auto">
          {!collapsed && (
            <>
              <p className="px-3 py-1 text-xs font-medium text-white/40 uppercase tracking-wider">
                Workspace
              </p>
              {navigation.map((item) => {
                const isActive = pathname === item.href || pathname.startsWith(item.href + "/")
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={cn(
                      "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                      isActive
                        ? "bg-white/10 text-white"
                        : "text-white/60 hover:bg-white/5 hover:text-white"
                    )}
                  >
                    <item.icon className="h-5 w-5 flex-shrink-0" />
                    <span>{item.name}</span>
                  </Link>
                )
              })}
              <Separator className="my-4 border-white/10" />
              <p className="px-3 py-1 text-xs font-medium text-white/40 uppercase tracking-wider">
                System
              </p>
              {systemNavigation.map((item) => {
                const isActive = pathname === item.href || pathname.startsWith(item.href + "/")
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={cn(
                      "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                      isActive
                        ? "bg-white/10 text-white"
                        : "text-white/60 hover:bg-white/5 hover:text-white"
                    )}
                  >
                    <item.icon className="h-5 w-5 flex-shrink-0" />
                    <span>{item.name}</span>
                  </Link>
                )
              })}
            </>
          )}
        </nav>

        <div className="border-t border-white/10 p-4">
          {!collapsed ? (
            <div className="space-y-2">
              <Link
                href="/settings"
                className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-white/60 hover:bg-white/5 hover:text-white transition-colors"
              >
                <User className="h-5 w-5 flex-shrink-0" />
                <span>Profile</span>
              </Link>
              <form action="/api/auth/logout" method="POST">
                <button
                  type="submit"
                  className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-white/60 hover:bg-white/5 hover:text-white transition-colors"
                >
                  <LogOut className="h-5 w-5 flex-shrink-0" />
                  <span>Logout</span>
                </button>
              </form>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-2">
              <Link
                href="/settings"
                className="rounded-lg p-2 text-white/60 hover:bg-white/5 hover:text-white transition-colors"
                title="Profile"
              >
                <User className="h-5 w-5" />
              </Link>
              <form action="/api/auth/logout" method="POST">
                <button
                  type="submit"
                  className="rounded-lg p-2 text-white/60 hover:bg-white/5 hover:text-white transition-colors w-full"
                  title="Logout"
                >
                  <LogOut className="h-5 w-5 mx-auto" />
                </button>
              </form>
            </div>
          )}
        </div>
      </div>
    </aside>
  )
}