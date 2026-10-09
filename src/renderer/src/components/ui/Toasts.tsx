import type { ReactNode } from 'react'
import { useUi } from '@/store/ui'
import { Icon } from './Icon'

const toneClasses = {
  info: 'border-info/40 bg-info-bg text-info',
  success: 'border-success/40 bg-success-bg text-success',
  error: 'border-danger/40 bg-danger-bg text-danger'
} as const

export function Toasts(): ReactNode {
  const toasts = useUi((state) => state.toasts)
  const removeToast = useUi((state) => state.removeToast)

  if (toasts.length === 0) return null

  return (
    <div className="fixed bottom-5 right-5 z-[60] flex w-80 flex-col gap-2">
      {toasts.map((item) => (
        <button
          key={item.id}
          onClick={() => removeToast(item.id)}
          className={`animate-fade-in flex items-start gap-2 rounded-lg border px-3.5 py-3 text-left text-sm shadow-lg backdrop-blur cursor-pointer ${toneClasses[item.tone]}`}
        >
          <Icon name={item.tone === 'success' ? 'check' : item.tone === 'error' ? 'alert' : 'clock'} size={16} className="mt-0.5 shrink-0" />
          <span className="text-ink">{item.message}</span>
        </button>
      ))}
    </div>
  )
}
