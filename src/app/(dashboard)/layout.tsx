"use client"

import { Sidebar } from "@/components/layout/sidebar"
import { Topbar } from "@/components/layout/topbar"
import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import { Skeleton } from "@/components/ui/skeleton"

interface UserProfile {
  full_name: string | null
  email: string
  avatar_url: string | null
  phone: string | null
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const [user, setUser] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const router = useRouter()

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
          .select("full_name, email, avatar_url, phone")
          .eq("id", authUser.id)
          .single()

        if (!profile) {
          const metaName = authUser.user_metadata?.full_name || ""
          const metaPhone = authUser.user_metadata?.phone || ""
          await supabase.from("profiles").upsert({
            id: authUser.id,
            full_name: metaName,
            email: authUser.email || "",
            phone: metaPhone,
            role: authUser.user_metadata?.role || "editor",
          }, { onConflict: "id" })
          profile = {
            full_name: metaName,
            email: authUser.email ?? "",
            avatar_url: null,
            phone: metaPhone,
          }
        }

        setUser(profile ?? {
          full_name: authUser.user_metadata?.full_name ?? null,
          email: authUser.email ?? "",
          avatar_url: null,
          phone: null,
        })
      } catch {
        setUser({
          full_name: null,
          email: "user@example.com",
          avatar_url: null,
          phone: null,
        })
      } finally {
        setLoading(false)
      }
    }

    getUser()
  }, [router])

  if (loading) {
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

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      {/* Desktop sidebar */}
      <div className="hidden lg:block">
        <Sidebar />
      </div>

      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div 
            className="fixed inset-0 bg-black/50"
            onClick={() => setSidebarOpen(false)}
          />
          <div className="fixed left-0 top-0 h-full">
            <Sidebar />
          </div>
        </div>
      )}

      <div className="flex-1 flex flex-col overflow-hidden lg:ml-72">
        <Topbar 
          user={user ?? {
            full_name: null,
            email: "",
            avatar_url: null,
            phone: null,
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
