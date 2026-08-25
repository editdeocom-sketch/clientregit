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
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const [user, setUser] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
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

        const { data: profile } = await supabase
          .from("profiles")
          .select("full_name, email, avatar_url")
          .eq("id", authUser.id)
          .single()

        setUser(profile ?? {
          full_name: null,
          email: authUser.email ?? "",
          avatar_url: null,
        })
      } catch {
        setUser({
          full_name: null,
          email: "user@example.com",
          avatar_url: null,
        })
      } finally {
        setLoading(false)
      }
    }

    getUser()
  }, [router])

  if (loading) {
    return (
      <div className="flex h-screen bg-[#0B132B]">
        <Skeleton className="fixed left-0 top-0 h-screen w-72 bg-white/5" />
        <div className="ml-72 flex-1">
          <Skeleton className="h-16 w-full bg-white/5" />
          <div className="p-6 space-y-6">
            <Skeleton className="h-8 w-64 bg-white/5" />
            <div className="grid grid-cols-4 gap-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-28 bg-white/5" />
              ))}
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-screen bg-[#0B132B] overflow-hidden">
      <Sidebar />
      <div className="ml-72 flex-1 flex flex-col overflow-hidden">
        <Topbar
          user={user ?? {
            full_name: null,
            email: "",
            avatar_url: null,
          }}
        />
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  )
}
