import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import { Bell, Moon, Sun, Menu, Search, Check, Command, LogOut } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from "@/components/ui/dropdown-menu"
import { getInitials, cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { useAuth } from "@/contexts/AuthContext"
import { api } from "@/services/api"

interface TopbarProps {
  user: {
    full_name: string | null
    email: string
    avatar_url: string | null
    phone?: string | null
  }
  onMenuToggle?: () => void
}

export function Topbar({ user, onMenuToggle }: TopbarProps) {
  const navigate = useNavigate()
  const { logout } = useAuth()
  const [mounted, setMounted] = useState(false)
  const [searchFocused, setSearchFocused] = useState(false)
  const [dark, setDark] = useState(false)
  const [reviewCount, setReviewCount] = useState(0)
  const [reviewItems, setReviewItems] = useState<{ id: number; description: string; created_at: string }[]>([])

  useEffect(() => {
    setMounted(true)
    const stored = localStorage.getItem("theme")
    const isDark = stored === "dark" || (!stored && window.matchMedia("(prefers-color-scheme: dark)").matches)
    setDark(isDark)
    document.documentElement.classList.toggle("dark", isDark)
  }, [])

  useEffect(() => {
    let active = true
    api.get<{ data: { awaitingReviewVideos: number; recentActivity: { id: number; description: string; created_at: string; entity_type: string }[] } }>("/dashboard/stats")
      .then((response) => {
        if (!active) return
        setReviewCount(response.data.awaitingReviewVideos || 0)
        setReviewItems((response.data.recentActivity || []).filter((item) => item.entity_type === "video").slice(0, 5))
      })
      .catch(() => undefined)
    return () => { active = false }
  }, [user.email])

  const toggleTheme = () => {
    const next = !dark
    setDark(next)
    localStorage.setItem("theme", next ? "dark" : "light")
    document.documentElement.classList.toggle("dark", next)
  }

  const handleLogout = () => {
    logout()
  }

  return (
    <header className="sticky top-0 z-30 h-16 bg-card/80 backdrop-blur-md border-b border-border">
      <div className="flex h-full items-center justify-between px-6">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden text-muted-foreground hover:text-foreground"
            onClick={onMenuToggle}
          >
            <Menu className="h-5 w-5" />
          </Button>
          
          {/* Search */}
          <div className="relative hidden sm:block">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              type="search"
              placeholder="Search clients, projects..."
              className={cn(
                "h-9 w-64 rounded-lg bg-muted px-10 py-2 text-sm text-foreground placeholder:text-muted-foreground",
                "focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent",
                "border border-border transition-all duration-200",
                searchFocused && "w-80 ring-2 ring-ring"
              )}
              onFocus={() => setSearchFocused(true)}
              onBlur={() => setSearchFocused(false)}
            />
            <kbd className="absolute right-3 top-1/2 -translate-y-1/2 hidden lg:inline-flex h-5 items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground">
              <Command className="h-3 w-3" />K
            </kbd>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {mounted && (
            <Button
              variant="ghost"
              size="icon"
              className="text-muted-foreground hover:text-foreground"
              onClick={toggleTheme}
            >
              {dark ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
            </Button>
          )}

          {/* Notifications */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground relative">
                <Bell className="h-5 w-5" />
                <Badge className="absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center text-[10px] bg-primary text-primary-foreground">
                  {reviewCount}
                </Badge>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-80 bg-card border-border">
              <div className="px-3 py-2 border-b border-border">
                <p className="text-sm font-medium text-foreground">Notifications</p>
              </div>
              <div className="px-3 py-6 text-center">
                {reviewItems.length === 0 ? (
                  <>
                    <Check className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                    <p className="text-sm text-muted-foreground">No recent review activity</p>
                  </>
                ) : (
                  <div className="space-y-3 text-left">
                    {reviewItems.map((item) => (
                      <div key={item.id} className="rounded-md bg-muted/60 p-2">
                        <p className="text-xs text-foreground">{item.description}</p>
                        <p className="mt-1 text-[10px] text-muted-foreground">{new Date(item.created_at).toLocaleString()}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* User menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-10 w-10 rounded-full p-0">
                <Avatar className="h-10 w-10">
                  <AvatarImage src={user.avatar_url || undefined} alt={user.full_name || user.email} />
                  <AvatarFallback>{getInitials(user.full_name || user.email)}</AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56 bg-card border-border">
              <div className="px-2 py-1">
                <p className="text-sm font-medium text-foreground">{user.full_name || "User"}</p>
                <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                {user.phone && (
                  <p className="text-xs text-muted-foreground truncate mt-0.5">{user.phone}</p>
                )}
              </div>
              <DropdownMenuSeparator className="border-border" />
              <DropdownMenuItem onClick={() => navigate("/settings")} className="text-foreground hover:bg-muted cursor-pointer">
                Settings
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleLogout} className="text-destructive hover:bg-destructive/10 cursor-pointer">
                <LogOut className="h-4 w-4 mr-2" />
                Log out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  )
}
