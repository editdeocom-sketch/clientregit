import type { ReactNode } from 'react'
import { Icon, type IconName } from './Icon'

export function Card({
  children,
  className = ''
}: {
  children: ReactNode
  className?: string
}): ReactNode {
  return (
    <div className={`rounded-xl border border-line bg-surface ${className}`}>{children}</div>
  )
}

export function CardHeader({
  title,
  subtitle,
  action
}: {
  title: string
  subtitle?: string
  action?: ReactNode
}): ReactNode {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-line px-5 py-4">
      <div>
        <h3 className="text-sm font-semibold">{title}</h3>
        {subtitle && <p className="mt-0.5 text-xs text-muted">{subtitle}</p>}
      </div>
      {action}
    </div>
  )
}

export function PageHeader({
  title,
  subtitle,
  actions
}: {
  title: string
  subtitle?: ReactNode
  actions?: ReactNode
}): ReactNode {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 className="text-xl font-semibold tracking-tight">{title}</h1>
        {subtitle && <p className="mt-1 text-sm text-muted">{subtitle}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  )
}

export function EmptyState({
  icon = 'archive',
  title,
  message,
  action
}: {
  icon?: IconName
  title: string
  message?: string
  action?: ReactNode
}): ReactNode {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-line bg-surface px-6 py-14 text-center">
      <div className="mb-3 rounded-full bg-surface-2 p-3 text-gold">
        <Icon name={icon} size={24} />
      </div>
      <p className="text-sm font-semibold">{title}</p>
      {message && <p className="mt-1 max-w-sm text-xs text-muted">{message}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  )
}
