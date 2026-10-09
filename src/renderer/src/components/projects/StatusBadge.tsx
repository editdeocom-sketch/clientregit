import { useEffect, useRef, useState, type ReactNode } from 'react'
import { Badge } from '@/components/ui/Badge'
import { Icon } from '@/components/ui/Icon'
import {
  PROJECT_STATUSES,
  PROJECT_STATUS_LABEL,
  projectTone,
  statusBlinks,
  type Project,
  type ProjectStatus
} from '@/lib/api'

export function StatusBadge({
  status,
  blink = true
}: {
  status: ProjectStatus
  blink?: boolean
}): ReactNode {
  return (
    <Badge tone={projectTone[status]} className={blink && statusBlinks(status) ? 'animate-status-blink' : ''}>
      {PROJECT_STATUS_LABEL[status]}
    </Badge>
  )
}

interface StatusMenuProps {
  project: Project
  onChange: (status: ProjectStatus) => void
}

export function StatusMenu({ project, onChange }: StatusMenuProps): ReactNode {
  const [open, setOpen] = useState(false)
  const [pos, setPos] = useState<{ left: number; top: number } | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const buttonRef = useRef<HTMLButtonElement>(null)

  const MENU_W = 192
  const MENU_H = 216

  const toggle = (): void => {
    if (!open && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect()
      let left = rect.right - MENU_W
      if (left < 8) left = 8
      let top = rect.bottom + 4
      if (top + MENU_H > window.innerHeight - 8) {
        top = Math.max(8, rect.top - MENU_H - 4)
      }
      setPos({ left, top })
    }
    setOpen((value) => !value)
  }

  useEffect(() => {
    if (!open) return
    const handler = (event: MouseEvent): void => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setOpen(false)
      }
    }
    const escape = (event: KeyboardEvent): void => {
      if (event.key === 'Escape') setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    document.addEventListener('keydown', escape)
    return () => {
      document.removeEventListener('mousedown', handler)
      document.removeEventListener('keydown', escape)
    }
  }, [open])

  return (
    <div ref={containerRef} className="relative inline-block">
      <button
        ref={buttonRef}
        onClick={toggle}
        className="cursor-pointer"
        aria-label="Change status"
      >
        <StatusBadge status={project.status} />
      </button>
      {open && pos && (
        <div
          style={{ position: 'fixed', left: pos.left, top: pos.top, width: MENU_W }}
          className="z-50 rounded-lg border border-line bg-surface py-1 shadow-xl"
        >
          {PROJECT_STATUSES.map((status) => (
            <button
              key={status}
              onClick={() => {
                setOpen(false)
                if (status !== project.status) onChange(status)
              }}
              className="flex w-full items-center gap-2 px-3 py-1.5 text-left transition-colors hover:bg-surface-2 cursor-pointer"
            >
              <Badge tone={projectTone[status]}>{PROJECT_STATUS_LABEL[status]}</Badge>
              {status === project.status && (
                <Icon
                  name="check"
                  size={14}
                  className="ml-auto shrink-0 text-gold-strong dark:text-gold"
                />
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
