import type { ButtonHTMLAttributes, ReactNode } from 'react'

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger'
type Size = 'sm' | 'md'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
  size?: Size
  icon?: ReactNode
}

const variants: Record<Variant, string> = {
  primary:
    'bg-gold text-white hover:bg-gold-strong disabled:hover:bg-gold border border-transparent',
  secondary:
    'bg-surface-2 text-ink border border-line hover:border-gold hover:text-gold-strong',
  ghost: 'bg-transparent text-muted hover:text-ink hover:bg-surface-2 border border-transparent',
  danger: 'bg-danger text-white hover:opacity-90 border border-transparent'
}

const sizes: Record<Size, string> = {
  sm: 'px-2.5 py-1.5 text-xs gap-1.5',
  md: 'px-3.5 py-2 text-sm gap-2'
}

export function Button({
  variant = 'secondary',
  size = 'md',
  icon,
  className = '',
  children,
  ...rest
}: ButtonProps): ReactNode {
  return (
    <button
      className={`inline-flex items-center justify-center rounded-lg font-medium transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${variants[variant]} ${sizes[size]} ${className}`}
      {...rest}
    >
      {icon}
      {children}
    </button>
  )
}
