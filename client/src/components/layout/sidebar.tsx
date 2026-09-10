import { Link, useLocation } from "react-router-dom"
import {
  LayoutDashboard,
  Users,
  FolderKanban,
  CheckSquare,
  Video,
  FileText,
  MessageSquare,
  Settings,
  CreditCard,
  Shield,
  ChevronLeft,
  ChevronRight,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Logo } from "@/components/layout/logo"
import { useState } from "react"
import { useAuth } from "@/contexts/AuthContext"

const navigation = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { name: "Clients", href: "/clients", icon: Users },
  { name: "Projects", href: "/projects", icon: FolderKanban },
  { name: "Tasks", href: "/tasks", icon: CheckSquare },
  { name: "Videos", href: "/videos", icon: Video },
  { name: "Invoices", href: "/invoices", icon: FileText },
  { name: "Revisions", href: "/revisions", icon: MessageSquare },
]

const systemNavigation = [
  { name: "Billing", href: "/pricing", icon: CreditCard },
  { name: "Settings", href: "/settings", icon: Settings },
]

interface SidebarProps {
  collapsed?: boolean
  onCollapsedChange?: (collapsed: boolean) => void
}

export function Sidebar({ collapsed: controlledCollapsed, onCollapsedChange }: SidebarProps) {
  const location = useLocation()
  const pathname = location.pathname
  const [internalCollapsed, setInternalCollapsed] = useState(false)
  const collapsed = controlledCollapsed ?? internalCollapsed
  const { user } = useAuth()

  const toggleCollapsed = () => {
    const next = !collapsed
    setInternalCollapsed(next)
    onCollapsedChange?.(next)
  }

  const isActive = (href: string) => pathname === href || pathname.startsWith(href + "/")

  return (
    <aside
      className={cn(
        "fixed left-0 top-0 z-40 h-screen bg-sidebar border-r border-sidebar-border transition-[width] duration-300 ease-in-out",
        collapsed ? "w-20" : "w-60"
      )}
    >
      <div className="flex h-full flex-col">
        {/* Logo */}
        <div className="flex h-16 items-center justify-between px-4 border-b border-sidebar-border">
          {!collapsed && (
            <Link to="/dashboard" className="flex items-center gap-2">
              <Logo size="sm" showText={false} />
              <span className="font-semibold text-lg text-sidebar-foreground tracking-tight">
                Client<span className="text-muted-foreground">Regit</span>
              </span>
            </Link>
          )}
          <Button
            variant="ghost"
            size="icon"
            className={cn(
              "text-muted-foreground hover:text-sidebar-foreground hover:bg-muted transition-colors",
              collapsed && "mx-auto"
            )}
            onClick={toggleCollapsed}
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          </Button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 space-y-0.5 px-3 py-3 overflow-y-auto">
          <p className={cn("px-3 pb-2 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider", collapsed && "sr-only")}>
            Workspace
          </p>
          {navigation.map((item) => (
            <Link
              key={item.name}
              to={item.href}
              title={collapsed ? item.name : undefined}
              className={cn(
                "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors duration-150",
                collapsed && "justify-center px-2",
                isActive(item.href)
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:bg-muted hover:text-sidebar-foreground"
              )}
            >
              <item.icon className={cn("h-4 w-4 flex-shrink-0", isActive(item.href) && "text-primary")} />
              {!collapsed && <span>{item.name}</span>}
            </Link>
          ))}
          <div className="my-3 border-t border-sidebar-border" />
          <p className={cn("px-3 pb-2 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider", collapsed && "sr-only")}>
            System
          </p>
          {systemNavigation.map((item) => (
            <Link
              key={item.name}
              to={item.href}
              title={collapsed ? item.name : undefined}
              className={cn(
                "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors duration-150",
                collapsed && "justify-center px-2",
                isActive(item.href)
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:bg-muted hover:text-sidebar-foreground"
              )}
            >
              <item.icon className={cn("h-4 w-4 flex-shrink-0", isActive(item.href) && "text-primary")} />
              {!collapsed && <span>{item.name}</span>}
            </Link>
          ))}
          {user?.role === 'admin' && (
            <>
              <div className="my-3 border-t border-sidebar-border" />
              <p className={cn("px-3 pb-2 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider", collapsed && "sr-only")}>
                Admin
              </p>
              <Link
                to="/admin"
                title={collapsed ? "Admin Panel" : undefined}
                className={cn(
                  "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors duration-150",
                  collapsed && "justify-center px-2",
                  isActive("/admin")
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:bg-muted hover:text-sidebar-foreground"
                )}
              >
                <Shield className={cn("h-4 w-4 flex-shrink-0", isActive("/admin") && "text-primary")} />
                {!collapsed && <span>Admin Panel</span>}
              </Link>
            </>
          )}
        </nav>
      </div>
    </aside>
  )
}