import type { InputHTMLAttributes, ReactNode, SelectHTMLAttributes, TextareaHTMLAttributes } from 'react'

const controlClass =
  'w-full rounded-lg border border-line bg-surface px-3 py-2 text-sm text-ink placeholder:text-muted/70 outline-none transition-colors focus:border-gold focus:ring-2 focus:ring-gold/25 disabled:opacity-60'

interface FieldProps {
  label?: string
  hint?: string
  required?: boolean
  children: ReactNode
  className?: string
}

export function Field({ label, hint, required, children, className = '' }: FieldProps): ReactNode {
  return (
    <label className={`block ${className}`}>
      {label && (
        <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-muted">
          {label}
          {required && <span className="text-gold"> *</span>}
        </span>
      )}
      {children}
      {hint && <span className="mt-1 block text-xs text-muted">{hint}</span>}
    </label>
  )
}

export function Input(props: InputHTMLAttributes<HTMLInputElement>): ReactNode {
  return <input className={`${controlClass} ${props.className ?? ''}`} {...props} />
}

export function Textarea(props: TextareaHTMLAttributes<HTMLTextAreaElement>): ReactNode {
  return <textarea className={`${controlClass} resize-y ${props.className ?? ''}`} {...props} />
}

export function Select(props: SelectHTMLAttributes<HTMLSelectElement>): ReactNode {
  return <select className={`${controlClass} cursor-pointer ${props.className ?? ''}`} {...props} />
}
