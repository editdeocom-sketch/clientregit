import type { ReactNode } from 'react'
import type { Tone } from '@/lib/api'

const toneClasses: Record<Tone, string> = {
  neutral: 'bg-surface-2 text-muted border-line',
  gold: 'bg-gold/15 text-gold-strong dark:text-gold border-gold/40',
  info: 'bg-info-bg text-info border-info/30',
  warn: 'bg-warn-bg text-warn border-warn/30',
  success: 'bg-success-bg text-success border-success/30',
  danger: 'bg-danger-bg text-danger border-danger/30',
  teal: 'bg-teal-bg text-teal border-teal/30',
  muted: 'bg-surface-2 text-muted/70 border-line'
}

interface BadgeProps {
  tone?: Tone
  children: ReactNode
  className?: string
}

export function Badge({ tone = 'neutral', children, className = '' }: BadgeProps): ReactNode {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-semibold whitespace-nowrap ${toneClasses[tone]} ${className}`}
    >
      {children}
    </span>
  )
}
