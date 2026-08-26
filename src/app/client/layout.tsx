"use client"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { LayoutDashboard, FolderKanban, LogOut, User, ChevronLeft, ChevronRight } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { getInitials } from "@/lib/utils"
import { Skeleton } from "@/components/ui/skeleton"
import { Logo } from "@/components/layout/logo"

const navigation = [
  { name: "Dashboard", href: "/client/dashboard", icon: LayoutDashboard },
  { name: "My Projects", href: "/client/projects", icon: FolderKanban },
]

interface UserProfile {
  full_name: string | null
  email: string
  avatar_url: string | null
}

export default function ClientLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()
  const router = useRouter()
  const [collapsed, setCollapsed] = useState(false)
  const [user, setUser] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const supabase = createClient()

    async function getUser() {
      try {
        const { data: { user: authUser } } = await supabase.auth.getUser()

        if (!authUser) {
          router.push("/login")
          return
        }

        let { data: profile } = await supabase
          .from("profiles")
          .select("full_name, email, avatar_url")
          .eq("id", authUser.id)
          .single()

        if (!profile) {
          const metaName = authUser.user_metadata?.full_name || ""
          await supabase.from("profiles").upsert({
            id: authUser.id,
            full_name: metaName,
            email: authUser.email || "",
            role: authUser.user_metadata?.role || "client",
          }, { onConflict: "id" })
          profile = {
            full_name: metaName,
            email: authUser.email ?? "",
            avatar_url: null,
          }
        }

        setUser(profile ?? {
          full_name: null,
          email: authUser.email ?? "",
          avatar_url: null,
        })
      } catch {
        router.push("/login")
      } finally {
        setLoading(false)
      }
    }

    getUser()
  }, [router])

  if (loading) {
    return (
      <div className="flex h-screen bg-background">
        <Skeleton className="fixed left-0 top-0 h-screen w-72 bg-muted" />
        <div className="ml-72 flex-1">
          <Skeleton className="h-16 w-full bg-muted" />
          <div className="p-6 space-y-6">
            <Skeleton className="h-8 w-64 bg-muted" />
            <Skeleton className="h-64 bg-muted" />
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      <aside
        className={cn(
          "fixed left-0 top-0 z-40 h-screen bg-sidebar border-r border-border transition-all duration-300",
          collapsed ? "w-20" : "w-72"
        )}
      >
        <div className="flex h-full flex-col">
          <div className="flex h-16 items-center justify-between px-4 border-b border-border">
            {!collapsed && (
              <Link href="/client/dashboard" className="flex items-center">
                <Logo size="sm" showText={false} />
                <span className="ml-2 font-semibold text-lg text-sidebar-foreground">
                  Client<span className="text-primary">Regit</span>
                </span>
              </Link>
            )}
            <Button
              variant="ghost"
              size="icon"
              className={cn("text-muted-foreground hover:text-foreground", collapsed && "mx-auto")}
              onClick={() => setCollapsed(!collapsed)}
              aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            >
              {collapsed ? <ChevronRight className="h-5 w-5" /> : <ChevronLeft className="h-5 w-5" />}
            </Button>
          </div>

          <nav className="flex-1 space-y-1 px-3 py-4 overflow-y-auto">
            {navigation.map((item) => {
              const isActive = pathname === item.href || pathname.startsWith(item.href + "/")
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                    isActive
                      ? "bg-sidebar-accent text-sidebar-accent-foreground"
                      : "text-muted-foreground hover:bg-sidebar-accent/50 hover:text-foreground"
                  )}
                >
                  <item.icon className="h-5 w-5 flex-shrink-0" />
                  {!collapsed && <span>{item.name}</span>}
                </Link>
              )
            })}
          </nav>

          <div className="border-t border-border p-4">
            {!collapsed ? (
              <div className="space-y-2">
                <div className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-muted-foreground">
                  <User className="h-5 w-5 flex-shrink-0" />
                  <span className="truncate">{user?.full_name || user?.email || "Client"}</span>
                </div>
                <form action="/api/auth/logout" method="POST">
                  <button
                    type="submit"
                    className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-muted-foreground hover:bg-sidebar-accent/50 hover:text-foreground transition-colors"
                  >
                    <LogOut className="h-5 w-5 flex-shrink-0" />
                    <span>Logout</span>
                  </button>
                </form>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-2">
                <form action="/api/auth/logout" method="POST">
                  <button
                    type="submit"
                    className="rounded-lg p-2 text-muted-foreground hover:bg-sidebar-accent/50 hover:text-foreground transition-colors w-full"
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

      <div className={cn("flex-1 flex flex-col overflow-hidden transition-all duration-300", collapsed ? "ml-20" : "ml-72")}>
        <header className="sticky top-0 z-30 h-16 bg-background/80 backdrop-blur-md border-b border-border">
          <div className="flex h-full items-center px-6">
            <div className="flex items-center gap-3">
              <Avatar className="h-8 w-8">
                <AvatarImage src={user?.avatar_url || undefined} alt={user?.full_name || user?.email} />
                <AvatarFallback className="text-xs">{getInitials(user?.full_name || user?.email || "C")}</AvatarFallback>
              </Avatar>
              <div>
                <p className="text-sm font-medium text-foreground">{user?.full_name || "Client"}</p>
                <p className="text-xs text-muted-foreground">{user?.email}</p>
              </div>
            </div>
          </div>
        </header>
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  )
}
