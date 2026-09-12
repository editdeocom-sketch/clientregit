import { useEffect, useState, useCallback, useRef } from "react"
import { useNavigate } from "react-router-dom"
import {
  Search,
  Users,
  FolderKanban,
  CheckSquare,
  FileText,
  Video,
  CornerDownLeft,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { api } from "@/services/api"

interface SearchItem {
  id: string
  label: string
  subtitle?: string
  url: string
  group: string
  icon: React.ComponentType<{ className?: string }>
}

interface ClientLike { id: string | number; name?: string; company?: string }
interface ProjectLike { id: string | number; name?: string; client_name?: string }
interface TaskLike { id: string | number; title?: string }
interface VideoLike { id: string | number; title?: string }
interface InvoiceLike { id: string | number; invoice_number?: string; client_name?: string }

const GROUP_ORDER = ["Clients", "Projects", "Tasks", "Videos", "Invoices"]

export function CommandPalette({
  open,
  onOpenChange,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const navigate = useNavigate()
  const [query, setQuery] = useState("")
  const [items, setItems] = useState<SearchItem[]>([])
  const [loading, setLoading] = useState(false)
  const [activeIndex, setActiveIndex] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)

  // Global CMD+K / CTRL+K
  useEffect(() => {
    function handler(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault()
        onOpenChange(!open)
      }
    }
    window.addEventListener("keydown", handler)
    return () => window.removeEventListener("keydown", handler)
  }, [open, onOpenChange])

  useEffect(() => {
    if (open) {
      setQuery("")
      setActiveIndex(0)
      setLoading(true)
      Promise.allSettled([
        api.get<{ data: ClientLike[] }>("/clients"),
        api.get<{ data: ProjectLike[] }>("/projects"),
        api.get<{ data: TaskLike[] }>("/tasks"),
        api.get<{ data: VideoLike[] }>("/videos"),
        api.get<{ data: InvoiceLike[] }>("/invoices"),
      ]).then((results) => {
        const next: SearchItem[] = []
        const add = (group: string, icon: React.ComponentType<{ className?: string }>, rows: Omit<SearchItem, "group" | "icon">[]) => {
          rows.forEach((r) => next.push({ ...r, group, icon }))
        }

        const [clients, projects, tasks, videos, invoices] = results

        if (clients.status === "fulfilled" && clients.value.data) {
          add("Clients", Users, clients.value.data.map((c) => ({
            id: String(c.id),
            label: c.name || "Unnamed client",
            subtitle: c.company,
            url: `/clients/${c.id}`,
          })))
        }
        if (projects.status === "fulfilled" && projects.value.data) {
          add("Projects", FolderKanban, projects.value.data.map((p) => ({
            id: String(p.id),
            label: p.name || "Unnamed project",
            subtitle: p.client_name,
            url: `/projects/${p.id}`,
          })))
        }
        if (tasks.status === "fulfilled" && tasks.value.data) {
          add("Tasks", CheckSquare, tasks.value.data.map((t) => ({
            id: String(t.id),
            label: t.title || "Untitled task",
            url: "/tasks",
          })))
        }
        if (videos.status === "fulfilled" && videos.value.data) {
          add("Videos", Video, videos.value.data.map((v) => ({
            id: String(v.id),
            label: v.title || "Untitled video",
            url: `/videos/${v.id}`,
          })))
        }
        if (invoices.status === "fulfilled" && invoices.value.data) {
          add("Invoices", FileText, invoices.value.data.map((inv) => ({
            id: String(inv.id),
            label: inv.invoice_number ? `Invoice ${inv.invoice_number}` : `Invoice #${inv.id}`,
            subtitle: inv.client_name,
            url: "/invoices",
          })))
        }
        setItems(next)
        setLoading(false)
      })
    }
  }, [open])

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 10)
  }, [open])

  const filtered = useCallback(() => {
    const q = query.trim().toLowerCase()
    if (!q) return items
    return items.filter(
      (i) =>
        i.label.toLowerCase().includes(q) ||
        (i.subtitle || "").toLowerCase().includes(q)
    )
  }, [query, items])

  const results = filtered()

  useEffect(() => setActiveIndex(0), [query])

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault()
      setActiveIndex((i) => Math.min(i + 1, results.length - 1))
    } else if (e.key === "ArrowUp") {
      e.preventDefault()
      setActiveIndex((i) => Math.max(i - 1, 0))
    } else if (e.key === "Enter" && results[activeIndex]) {
      go(results[activeIndex])
    } else if (e.key === "Escape") {
      onOpenChange(false)
    }
  }

  const go = (item: SearchItem) => {
    onOpenChange(false)
    navigate(item.url)
  }

  if (!open) return null

  // Group results preserving order
  const grouped: { group: string; rows: SearchItem[] }[] = []
  for (const g of GROUP_ORDER) {
    const rows = results.filter((r) => r.group === g)
    if (rows.length) grouped.push({ group: g, rows })
  }

  let flatIndex = -1

  return (
    <div
      className="fixed inset-0 z-[100] flex items-start justify-center bg-black/50 p-4 pt-[12vh] animate-fade-in"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onOpenChange(false)
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Quick search"
        className="w-full max-w-xl overflow-hidden rounded-lg border border-border bg-card shadow-lg animate-slide-up"
        onKeyDown={handleKeyDown}
      >
        <div className="flex items-center gap-3 border-b border-border px-4 py-3">
          <Search className="h-4 w-4 text-muted-foreground" />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search clients, projects, tasks, videos, invoices..."
            className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground focus:outline-none"
            aria-label="Search"
          />
          <kbd className="hidden sm:inline-flex items-center gap-1 rounded border border-border bg-muted px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground">
            <CornerDownLeft className="h-3 w-3" />
            Enter
          </kbd>
        </div>

        <div className="max-h-[50vh] overflow-y-auto p-2">
          {loading ? (
            <p className="px-3 py-8 text-center text-sm text-muted-foreground">Loading…</p>
          ) : grouped.length === 0 ? (
            <p className="px-3 py-8 text-center text-sm text-muted-foreground">
              No results found
            </p>
          ) : (
            grouped.map(({ group, rows }) => (
              <div key={group}>
                <p className="px-3 pb-1 pt-3 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                  {group}
                </p>
                {rows.map((item) => {
                  flatIndex += 1
                  const idx = flatIndex
                  const ItemIcon = item.icon
                  return (
                    <button
                      key={`${group}-${item.id}`}
                      type="button"
                      onMouseEnter={() => setActiveIndex(idx)}
                      onClick={() => go(item)}
                      className={cn(
                        "flex w-full items-center gap-3 rounded-md px-3 py-2 text-left text-sm transition-colors",
                        idx === activeIndex
                          ? "bg-primary/10 text-primary"
                          : "text-foreground"
                      )}
                    >
                      <ItemIcon className="h-4 w-4 flex-shrink-0 text-muted-foreground" />
                      <span className="min-w-0 flex-1">
                        <span className="block truncate">{item.label}</span>
                        {item.subtitle && (
                          <span className="block truncate text-xs text-muted-foreground">
                            {item.subtitle}
                          </span>
                        )}
                      </span>
                    </button>
                  )
                })}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}