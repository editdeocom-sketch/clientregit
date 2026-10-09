import type { ReactNode } from 'react'
import { Outlet } from 'react-router-dom'
import { Sidebar } from './Sidebar'

export function AppLayout(): ReactNode {
  return (
    <div className="flex h-full bg-canvas text-ink">
      <Sidebar />
      <main className="flex-1 overflow-y-auto">
        <div className="mx-auto max-w-6xl px-8 py-7">
          <Outlet />
        </div>
      </main>
    </div>
  )
}
