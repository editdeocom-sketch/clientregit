import { useEffect, useState } from "react"
import { Navigate } from "react-router-dom"
import { useAuth } from "@/contexts/AuthContext"
import { Sidebar } from "@/components/layout/sidebar"
import { Topbar } from "@/components/layout/topbar"
import { Skeleton } from "@/components/ui/skeleton"

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { user, loading: authLoading } = useAuth()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)

  useEffect(() => {
    if (!authLoading && !user) {
      window.location.href = "/login"
    }
  }, [user, authLoading])

  if (authLoading) {
    return (
      <div className="flex h-screen bg-background">
        <Skeleton className="fixed left-0 top-0 h-screen w-72 bg-muted hidden lg:block" />
        <div className="flex-1">
          <Skeleton className="h-16 w-full bg-muted" />
          <div className="p-6 space-y-6">
            <Skeleton className="h-8 w-64 bg-muted" />
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-28 bg-muted" />
              ))}
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (!user) return <Navigate to="/login" replace />

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      <div className="hidden lg:block">
        <Sidebar collapsed={sidebarCollapsed} onCollapsedChange={setSidebarCollapsed} />
      </div>

      {sidebarOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="fixed inset-0 bg-black/50"
            onClick={() => setSidebarOpen(false)}
          />
          <div className="fixed left-0 top-0 h-full">
            <Sidebar collapsed={sidebarCollapsed} onCollapsedChange={setSidebarCollapsed} />
          </div>
        </div>
      )}

      <div className={`flex-1 flex flex-col overflow-hidden ${sidebarCollapsed ? "lg:ml-20" : "lg:ml-72"}`}>
        <Topbar
          user={{
            full_name: user.name || null,
            email: user.email || "",
            avatar_url: user.avatar || null,
            phone: user.phone || null,
          }}
          onMenuToggle={() => setSidebarOpen(!sidebarOpen)}
        />
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  )
}
