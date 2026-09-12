import { NavLink } from "react-router-dom"
import { LayoutDashboard, FolderKanban, CheckSquare, Video, FileText } from "lucide-react"
import { cn } from "@/lib/utils"

const items = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard, end: true },
  { to: "/projects", label: "Projects", icon: FolderKanban },
  { to: "/tasks", label: "Tasks", icon: CheckSquare },
  { to: "/videos", label: "Videos", icon: Video },
  { to: "/invoices", label: "Invoices", icon: FileText },
]

export function BottomNav() {
  return (
    <nav
      aria-label="Primary"
      className="fixed bottom-0 left-0 right-0 z-40 border-t border-border bg-card/95 backdrop-blur lg:hidden"
    >
      <div className="grid grid-cols-5">
        {items.map(({ to, label, icon: Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              cn(
                "flex flex-col items-center gap-0.5 py-2.5 pb-[max(0.625rem,env(safe-area-inset-bottom))] text-[11px] font-medium transition-colors",
                isActive ? "text-primary" : "text-muted-foreground hover:text-foreground"
              )
            }
          >
            {({ isActive }) => (
              <>
                <Icon className={cn("h-5 w-5", isActive && "drop-shadow-[0_0_6px_rgba(37,99,235,0.4)]")} />
                {label}
              </>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  )
}