import {
  useEffect,
  useState,
  type KeyboardEvent as ReactKeyboardEvent,
  type ReactNode
} from 'react'
import { useNavigate } from 'react-router-dom'
import { Modal } from '@/components/ui/Modal'
import { Input } from '@/components/ui/Field'
import { Icon, type IconName } from '@/components/ui/Icon'
import { api } from '@/lib/api'

interface JumpResult {
  key: string
  icon: IconName
  kind: 'Client' | 'Project' | 'Invoice'
  label: string
  sub: string
  path: string
}

export function Shortcuts(): ReactNode {
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<JumpResult[]>([])
  const [active, setActive] = useState(0)

  useEffect(() => {
    const handler = (event: KeyboardEvent): void => {
      if (!(event.ctrlKey || event.metaKey) || event.altKey) return
      const key = event.key.toLowerCase()
      if (key === 'k') {
        event.preventDefault()
        setQuery('')
        setResults([])
        setActive(0)
        setOpen(true)
      } else if (key === 'n') {
        const target = document.querySelector<HTMLElement>('[data-new-button]:not([disabled])')
        if (target) {
          event.preventDefault()
          target.click()
        }
      } else if (key === 'f') {
        const target = document.querySelector<HTMLInputElement>('[data-search-input]')
        if (target) {
          event.preventDefault()
          target.focus()
          target.select()
        }
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [])

  useEffect(() => {
    if (!open) return
    const term = query.trim()
    if (term.length < 2) {
      setResults([])
      setActive(0)
      return
    }
    let cancelled = false
    const timer = window.setTimeout(() => {
      void (async () => {
        try {
          const [clients, projects, invoices] = await Promise.all([
            api.clients.list({ q: term }),
            api.projects.list({ q: term }),
            api.invoices.list({ q: term })
          ])
          if (cancelled) return
          const found: JumpResult[] = [
            ...clients.slice(0, 5).map((client) => ({
              key: `client-${client.id}`,
              icon: 'users' as const,
              kind: 'Client' as const,
              label: client.name,
              sub: client.company || client.email || '',
              path: `/clients/${client.id}`
            })),
            ...projects.slice(0, 5).map((project) => ({
              key: `project-${project.id}`,
              icon: 'briefcase' as const,
              kind: 'Project' as const,
              label: project.title,
              sub: project.client_name ?? '',
              path: `/projects/${project.id}`
            })),
            ...invoices.slice(0, 5).map((invoice) => ({
              key: `invoice-${invoice.id}`,
              icon: 'file-text' as const,
              kind: 'Invoice' as const,
              label: invoice.invoice_number,
              sub: invoice.client_name ?? '',
              path: `/invoices/${invoice.id}`
            }))
          ]
          setResults(found)
          setActive(0)
        } catch {
          if (!cancelled) setResults([])
        }
      })()
    }, 180)
    return () => {
      cancelled = true
      window.clearTimeout(timer)
    }
  }, [query, open])

  const go = (result: JumpResult): void => {
    setOpen(false)
    setQuery('')
    navigate(result.path)
  }

  const onKeyDown = (event: ReactKeyboardEvent<HTMLInputElement>): void => {
    if (event.key === 'ArrowDown') {
      event.preventDefault()
      setActive((index) => Math.min(index + 1, results.length - 1))
    } else if (event.key === 'ArrowUp') {
      event.preventDefault()
      setActive((index) => Math.max(index - 1, 0))
    } else if (event.key === 'Enter') {
      event.preventDefault()
      const result = results[active]
      if (result) go(result)
    }
  }

  const showEmpty = query.trim().length >= 2 && results.length === 0

  return (
    <Modal open={open} title="Quick jump" onClose={() => setOpen(false)}>
      <div className="relative">
        <span className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-muted">
          <Icon name="search" size={15} />
        </span>
        <Input
          autoFocus
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          onKeyDown={onKeyDown}
          placeholder="Search clients, projects, invoices…"
          className="pl-9"
        />
      </div>
      {showEmpty ? (
        <p className="py-6 text-center text-sm text-muted">No matches.</p>
      ) : (
        <ul className="mt-3 max-h-72 overflow-y-auto">
          {results.map((result, index) => (
            <li key={result.key}>
              <button
                onClick={() => go(result)}
                onMouseEnter={() => setActive(index)}
                className={`flex w-full cursor-pointer items-center gap-3 rounded-lg px-3 py-2 text-left text-sm transition-colors ${
                  index === active ? 'bg-gold/15 text-ink' : 'text-ink hover:bg-surface-2'
                }`}
              >
                <Icon name={result.icon} size={15} />
                <span className="min-w-0 flex-1 truncate">{result.label}</span>
                {result.sub && <span className="max-w-40 truncate text-xs text-muted">{result.sub}</span>}
                <span className="text-[10px] font-semibold uppercase tracking-wider text-muted">
                  {result.kind}
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
      <p className="mt-3 text-xs text-muted">
        ↑↓ to move · Enter to open · Esc to close · Ctrl+N new · Ctrl+F search
      </p>
    </Modal>
  )
}
