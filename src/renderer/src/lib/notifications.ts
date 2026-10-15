import type { AppSettings, TeamMember, UserProfile } from '@shared/types'
import { api } from './api'

type Category = 'tasks' | 'team'

const SEEN_KEY = 'cr.notify.seen'
const ROSTER_KEY = 'cr.notify.roster'
const TASKS_KEY = 'cr.notify.tasks'
const TICK_MS = 45_000

function readSeen(): string[] {
  try {
    const raw = localStorage.getItem(SEEN_KEY)
    const parsed = raw ? (JSON.parse(raw) as string[]) : []
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

function hasSeen(tag: string): boolean {
  return readSeen().includes(tag)
}

function markSeen(tag: string): void {
  try {
    const list = readSeen()
    list.unshift(tag)
    localStorage.setItem(SEEN_KEY, JSON.stringify(list.slice(0, 500)))
  } catch {
    // storage unavailable
  }
}

function categoryEnabled(settings: AppSettings, category: Category): boolean {
  switch (category) {
    case 'tasks':
      return settings.notify_tasks
    case 'team':
      return settings.notify_team
  }
}

function loadRoster(): TeamMember[] {
  try {
    const raw = localStorage.getItem(ROSTER_KEY)
    const parsed = raw ? (JSON.parse(raw) as TeamMember[]) : []
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

function saveRoster(roster: TeamMember[]): void {
  try {
    localStorage.setItem(ROSTER_KEY, JSON.stringify(roster))
  } catch {
    // storage unavailable
  }
}

interface TaskSnapshotEntry {
  assignee: string | null
  due: string | null
  done: boolean
}

function loadTaskSnapshot(): Record<string, TaskSnapshotEntry> {
  try {
    const raw = localStorage.getItem(TASKS_KEY)
    const parsed = raw ? (JSON.parse(raw) as Record<string, TaskSnapshotEntry>) : {}
    return parsed && typeof parsed === 'object' ? parsed : {}
  } catch {
    return {}
  }
}

function saveTaskSnapshot(snapshot: Record<string, TaskSnapshotEntry>): void {
  try {
    localStorage.setItem(TASKS_KEY, JSON.stringify(snapshot))
  } catch {
    // storage unavailable
  }
}

function todayLocal(): string {
  const now = new Date()
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`
}

export function startNotificationEngine(): () => void {
  let disposed = false
  let tick = 0
  let user: UserProfile | null = null
  let cachedSettings: AppSettings | null = null
  let rosterCache: TeamMember[] = loadRoster()

  void api.user.get().then((profile) => {
    user = profile
  })

  const refreshSettings = async (): Promise<AppSettings | null> => {
    try {
      cachedSettings = await api.settings.get()
    } catch {
      cachedSettings = null
    }
    return cachedSettings
  }

  const notify = (
    title: string,
    body: string,
    tag: string,
    route: string,
    category: Category
  ): void => {
    if (disposed) return
    const settings = cachedSettings
    if (!settings || !settings.notify_enabled || !categoryEnabled(settings, category)) return
    if (hasSeen(tag)) return
    markSeen(tag)
    if (!('Notification' in window)) return
    try {
      void (async () => {
        const permission =
          Notification.permission === 'default'
            ? await Notification.requestPermission()
            : Notification.permission
        if (permission !== 'granted') return
        const notification = new Notification(title, { body, tag })
        notification.onclick = () => {
          void api.app.showWindow()
          window.location.hash = `#${route}`
          notification.close()
        }
      })()
    } catch {
      // notifications unavailable
    }
  }

  const checkRoster = async (): Promise<void> => {
    const settings = cachedSettings
    if (!settings?.notify_enabled || !settings.notify_team) return
    let roster: TeamMember[]
    try {
      roster = await api.team.roster()
    } catch {
      return
    }
    const previous = rosterCache
    if (previous.length === 0) {
      rosterCache = roster
      saveRoster(roster)
      return
    }
    const known = new Set(previous.map((member) => member.user_id))
    for (const member of roster) {
      if (!known.has(member.user_id)) {
        notify(
          'New teammate',
          `${member.email ?? 'Someone'} joined your team workspace.`,
          `team-${member.user_id}`,
          '/settings',
          'team'
        )
      }
    }
    rosterCache = roster
    saveRoster(roster)
  }

  const checkTasks = async (): Promise<void> => {
    const settings = cachedSettings
    if (!settings?.notify_enabled || !settings.notify_tasks || !user) return
    const snapshot = loadTaskSnapshot()
    const next: Record<string, TaskSnapshotEntry> = {}
    try {
      const projects = await api.projects.list()
      for (const project of projects) {
        const tasks = await api.tasks.list(project.id)
        for (const task of tasks) {
          const entry: TaskSnapshotEntry = {
            assignee: task.assignee_id,
            due: task.due_date,
            done: task.done
          }
          next[task.id] = entry
          const previous = snapshot[task.id]
          const mine = task.assignee_id === user.id
          if (!previous && mine) {
            notify(
              'Task assigned to you',
              task.title,
              `assign-${task.id}`,
              `/projects/${task.project_id}`,
              'tasks'
            )
          } else if (previous && !mine && task.assignee_id === user.id) {
            notify(
              'Task assigned to you',
              task.title,
              `assign-${task.id}`,
              `/projects/${task.project_id}`,
              'tasks'
            )
          }
          if (mine && !task.done && task.due_date) {
            const today = todayLocal()
            if (task.due_date === today) {
              notify(
                'Due today',
                task.title,
                `due-${task.id}-${task.due_date}`,
                `/projects/${task.project_id}`,
                'tasks'
              )
            } else if (task.due_date < today) {
              notify(
                'Task overdue',
                `${task.title} (due ${task.due_date})`,
                `overdue-${task.id}-${task.due_date}`,
                `/projects/${task.project_id}`,
                'tasks'
              )
            }
          }
        }
      }
    } catch {
      return
    }
    saveTaskSnapshot(next)
  }

  const runTick = async (): Promise<void> => {
    if (disposed) return
    tick += 1
    await refreshSettings()
    if (!cachedSettings?.notify_enabled) return
    if (tick % 4 === 1) await checkRoster()
    if (tick % 6 === 3) await checkTasks()
  }

  void refreshSettings()
  void runTick()
  const interval = setInterval(() => void runTick(), TICK_MS)

  return () => {
    disposed = true
    clearInterval(interval)
  }
}
