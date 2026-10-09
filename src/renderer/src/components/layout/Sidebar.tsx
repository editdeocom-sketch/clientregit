import type { ReactNode } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import { Icon, type IconName } from '@/components/ui/Icon'
import { useUi } from '@/store/ui'

interface NavItem {
  to: string
  label: string
  icon: IconName
}

const navItems: NavItem[] = [
  { to: '/', label: 'Dashboard', icon: 'dashboard' },
  { to: '/clients', label: 'Clients', icon: 'users' },
  { to: '/projects', label: 'Projects', icon: 'film' },
  { to: '/invoices', label: 'Invoices', icon: 'file-text' },
  { to: '/calendar', label: 'Calendar', icon: 'calendar' },
  { to: '/reports', label: 'Reports', icon: 'chart' },
  { to: '/settings', label: 'Settings', icon: 'settings' }
]

export function Sidebar(): ReactNode {
  const location = useLocation()
  const theme = useUi((state) => state.theme)
  const setTheme = useUi((state) => state.setTheme)

  return (
    <aside className="flex w-60 shrink-0 flex-col border-r border-line bg-surface">
      <div className="flex items-center gap-3 px-5 py-5">
        <img
          src="/logo-emblem.png"
          alt="ClientRegit"
          className="h-9 w-9 shrink-0 object-contain"
        />
        <div>
          <div className="text-sm font-semibold tracking-tight">ClientRegit</div>
          <div className="text-[10px] uppercase tracking-widest text-muted">
            for video editors
          </div>
        </div>
      </div>

      <nav className="flex-1 space-y-1 px-3 py-2">
        {navItems.map((item) => {
          const active =
            item.to === '/'
              ? location.pathname === '/'
              : location.pathname.startsWith(item.to)
          return (
            <NavLink
              key={item.to}
              to={item.to}
              className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                active
                  ? 'bg-gold/15 text-gold-strong dark:text-gold'
                  : 'text-muted hover:bg-surface-2 hover:text-ink'
              }`}
            >
              <Icon name={item.icon} size={18} />
              {item.label}
              {active && <span className="ml-auto h-1.5 w-1.5 rounded-full bg-gold" />}
            </NavLink>
          )
        })}
      </nav>

      <div className="border-t border-line px-4 py-4">
        <button
          onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
          className="flex w-full items-center gap-3 rounded-lg px-2 py-2 text-sm text-muted transition-colors hover:bg-surface-2 hover:text-ink cursor-pointer"
        >
          <Icon name={theme === 'dark' ? 'sun' : 'moon'} size={18} />
          {theme === 'dark' ? 'Light mode' : 'Dark mode'}
        </button>
      </div>
    </aside>
  )
}
