import { useMemo, useState, type ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Card, CardHeader, PageHeader } from '@/components/ui/Layout'
import { Icon } from '@/components/ui/Icon'
import { api, fmtDate, type CalendarEvent } from '@/lib/api'
import { useApi } from '@/lib/hooks'

const WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

function iso(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}

function startOfWeek(date: Date): Date {
  const result = new Date(date)
  const day = (result.getDay() + 6) % 7
  result.setDate(result.getDate() - day)
  return result
}

function endOfWeek(date: Date): Date {
  const result = startOfWeek(date)
  result.setDate(result.getDate() + 6)
  return result
}

export function CalendarPage(): ReactNode {
  const navigate = useNavigate()
  const now = new Date()
  const [year, setYear] = useState(now.getFullYear())
  const [month, setMonth] = useState(now.getMonth())
  const [selected, setSelected] = useState<string | null>(null)

  const { data: events, loading } = useApi<CalendarEvent[]>(() => {
    const first = new Date(year, month, 1)
    const last = new Date(year, month + 1, 0)
    return api.calendar.range(iso(startOfWeek(first)), iso(endOfWeek(last)))
  }, [year, month])

  const weeks = useMemo(() => {
    const first = new Date(year, month, 1)
    const last = new Date(year, month + 1, 0)
    const gridStart = startOfWeek(first)
    const gridEnd = endOfWeek(last)
    const days: Date[] = []
    const cursor = new Date(gridStart)
    while (cursor <= gridEnd) {
      days.push(new Date(cursor))
      cursor.setDate(cursor.getDate() + 1)
    }
    const result: Date[][] = []
    for (let i = 0; i < days.length; i += 7) result.push(days.slice(i, i + 7))
    return result
  }, [year, month])

  const eventsByDay = useMemo(() => {
    const map = new Map<string, CalendarEvent[]>()
    for (const event of events ?? []) {
      const list = map.get(event.date) ?? []
      list.push(event)
      map.set(event.date, list)
    }
    return map
  }, [events])

  const monthLabel = new Date(year, month, 1).toLocaleDateString('en-GB', {
    month: 'long',
    year: 'numeric'
  })

  const step = (delta: number): void => {
    const next = new Date(year, month + delta, 1)
    setYear(next.getFullYear())
    setMonth(next.getMonth())
    setSelected(null)
  }

  const todayIso = iso(new Date())
  const selectedEvents = selected ? (eventsByDay.get(selected) ?? []) : []

  return (
    <div>
      <PageHeader
        title="Calendar"
        subtitle="Project deadlines and invoice due dates"
        actions={
          <div className="flex items-center gap-2">
            <Button variant="ghost" icon={<Icon name="chevron-left" size={15} />} onClick={() => step(-1)} />
            <span className="min-w-40 text-center text-sm font-semibold">{monthLabel}</span>
            <Button variant="ghost" icon={<Icon name="chevron-right" size={15} />} onClick={() => step(1)} />
            <Button
              size="sm"
              variant="secondary"
              onClick={() => {
                setYear(now.getFullYear())
                setMonth(now.getMonth())
              }}
            >
              Today
            </Button>
          </div>
        }
      />

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        <Card className="overflow-hidden lg:col-span-2">
          <div className="grid grid-cols-7 border-b border-line">
            {WEEKDAYS.map((day) => (
              <div key={day} className="px-2 py-2.5 text-center text-[11px] font-semibold uppercase tracking-wider text-muted">
                {day}
              </div>
            ))}
          </div>
          {loading && !events ? (
            <div className="py-16 text-center text-sm text-muted">Loading…</div>
          ) : (
            <div>
              {weeks.map((week, weekIndex) => (
                <div key={weekIndex} className="grid grid-cols-7 border-b border-line/60 last:border-0">
                  {week.map((day) => {
                    const dateIso = iso(day)
                    const inMonth = day.getMonth() === month
                    const isToday = dateIso === todayIso
                    const dayEvents = eventsByDay.get(dateIso) ?? []
                    return (
                      <button
                        key={dateIso}
                        onClick={() => setSelected(dateIso)}
                        className={`min-h-24 cursor-pointer border-r border-line/40 p-1.5 text-left transition-colors last:border-r-0 ${
                          inMonth ? 'bg-surface' : 'bg-canvas'
                        } ${selected === dateIso ? 'ring-1 ring-gold ring-inset' : 'hover:bg-surface-2'}`}
                      >
                        <span
                          className={`inline-flex h-6 w-6 items-center justify-center rounded-full text-xs ${
                            isToday
                              ? 'bg-gold font-bold text-white'
                              : inMonth
                                ? 'text-ink'
                                : 'text-muted/50'
                          }`}
                        >
                          {day.getDate()}
                        </span>
                        <div className="mt-1 space-y-1">
                          {dayEvents.slice(0, 3).map((event) => (
                            <div
                              key={`${event.kind}-${event.id}`}
                              className={`truncate rounded px-1.5 py-0.5 text-[10px] font-medium ${
                                event.kind === 'deadline'
                                  ? 'bg-gold/20 text-gold-strong dark:text-gold'
                                  : 'bg-info-bg text-info'
                              }`}
                            >
                              {event.title}
                            </div>
                          ))}
                          {dayEvents.length > 3 && (
                            <div className="text-[10px] text-muted">+{dayEvents.length - 3} more</div>
                          )}
                        </div>
                      </button>
                    )
                  })}
                </div>
              ))}
            </div>
          )}
        </Card>

        <div className="space-y-5">
          <Card>
            <CardHeader title={selected ? fmtDate(selected) : 'Select a day'} />
            <div className="px-5 py-4">
              {!selected ? (
                <p className="text-sm text-muted">Click a day to see what is due.</p>
              ) : selectedEvents.length === 0 ? (
                <p className="text-sm text-muted">Nothing due on this day.</p>
              ) : (
                <div className="space-y-2">
                  {selectedEvents.map((event) => (
                    <button
                      key={`${event.kind}-${event.id}`}
                      onClick={() => navigate(event.route)}
                      className="flex w-full items-center gap-3 rounded-lg border border-line px-3 py-2.5 text-left transition-colors hover:border-gold cursor-pointer"
                    >
                      <div className="min-w-0 flex-1">
                        <div className="truncate text-sm font-medium">{event.title}</div>
                        <div className="truncate text-xs text-muted">{event.subtitle}</div>
                      </div>
                      <Badge tone={event.kind === 'deadline' ? 'gold' : 'info'}>
                        {event.kind === 'deadline' ? 'deadline' : 'invoice'}
                      </Badge>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </Card>

          <Card>
            <CardHeader title="Legend" />
            <div className="space-y-2 px-5 py-4 text-sm text-muted">
              <div className="flex items-center gap-2">
                <span className="h-3 w-3 rounded-sm bg-gold/40" /> Project deadline
              </div>
              <div className="flex items-center gap-2">
                <span className="h-3 w-3 rounded-sm bg-info-bg" /> Invoice due date
              </div>
              <div className="flex items-center gap-2">
                <span className="h-3 w-3 rounded-full bg-gold" /> Today
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}
