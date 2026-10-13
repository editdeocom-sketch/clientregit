import { useState, type ReactNode } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { Icon, type IconName } from '@/components/ui/Icon'
import { api, type LicenseState } from '@/lib/api'
import { useApi } from '@/lib/hooks'
import { useMeetBadges } from '@/lib/useBadges'
import { useUi } from '@/store/ui'

interface NavItem {
  to: string
  label: string
  icon: IconName
  badge?: 'invites' | 'unread'
}

const navItems: NavItem[] = [
  { to: '/', label: 'Dashboard', icon: 'dashboard' },
  { to: '/clients', label: 'Clients', icon: 'users' },
  { to: '/projects', label: 'Projects', icon: 'film' },
  { to: '/invoices', label: 'Invoices', icon: 'file-text' },
  { to: '/calendar', label: 'Calendar', icon: 'calendar' },
  { to: '/meetings', label: 'Meetings', icon: 'video', badge: 'invites' },
  { to: '/messages', label: 'Messages', icon: 'message', badge: 'unread' },
  { to: '/reports', label: 'Reports', icon: 'chart' },
  { to: '/profile', label: 'Profile', icon: 'user' },
  { to: '/settings', label: 'Settings', icon: 'settings' }
]

export function Sidebar(): ReactNode {
  const location = useLocation()
  const theme = useUi((state) => state.theme)
  const setTheme = useUi((state) => state.setTheme)
  const { data: license } = useApi<LicenseState>(() => api.license.getState(), [])
  const badges = useMeetBadges()
  const [confirmOut, setConfirmOut] = useState(false)
  const [loggingOut, setLoggingOut] = useState(false)

  const email = license?.email ?? null
  const initial = (email ?? '?').trim().charAt(0).toUpperCase() || '?'

  const logOut = async (): Promise<void> => {
    setConfirmOut(false)
    setLoggingOut(true)
    try {
      await api.license.deactivate()
      window.location.reload()
    } catch {
      setLoggingOut(false)
    }
  }

  return (
    <aside className="flex w-60 shrink-0 flex-col border-r border-line bg-surface">
      <div className="flex items-center gap-3 px-5 py-5">
        <img
          src="logo-emblem.png"
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
          const badgeCount =
            item.badge === 'invites'
              ? badges.invites
              : item.badge === 'unread'
                ? badges.unread
                : 0
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
              {badgeCount > 0 && (
                <span className="ml-auto rounded-full bg-gold px-1.5 py-0.5 text-[10px] font-bold leading-none text-white">
                  {badgeCount > 99 ? '99+' : badgeCount}
                </span>
              )}
              {active && badgeCount === 0 && (
                <span className="ml-auto h-1.5 w-1.5 rounded-full bg-gold" />
              )}
            </NavLink>
          )
        })}
      </nav>

      <div className="space-y-1 border-t border-line px-4 py-4">
        {email && (
          <>
            <NavLink
              to="/profile"
              className="flex items-center gap-3 rounded-lg px-2 py-2 text-sm transition-colors hover:bg-surface-2"
              title="Your profile"
            >
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-gold/15 text-xs font-semibold text-gold-strong dark:text-gold">
                {initial}
              </span>
              <span className="min-w-0 flex-1 truncate text-xs font-medium text-ink">
                {email}
              </span>
            </NavLink>
            <button
              onClick={() => setConfirmOut(true)}
              disabled={loggingOut}
              className="flex w-full cursor-pointer items-center gap-3 rounded-lg px-2 py-2 text-sm text-muted transition-colors hover:bg-surface-2 hover:text-danger disabled:opacity-50"
            >
              <Icon name="logout" size={18} />
              {loggingOut ? 'Signing out…' : 'Log out'}
            </button>
          </>
        )}
        <button
          onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
          className="flex w-full items-center gap-3 rounded-lg px-2 py-2 text-sm text-muted transition-colors hover:bg-surface-2 hover:text-ink cursor-pointer"
        >
          <Icon name={theme === 'dark' ? 'sun' : 'moon'} size={18} />
          {theme === 'dark' ? 'Light mode' : 'Dark mode'}
        </button>
      </div>

      <ConfirmDialog
        open={confirmOut}
        title="Log out?"
        message="You will be signed out and this computer will be deactivated. Sign in again with your license key to continue."
        confirmLabel="Log out"
        danger
        onConfirm={() => void logOut()}
        onClose={() => setConfirmOut(false)}
      />
    </aside>
  )
}
