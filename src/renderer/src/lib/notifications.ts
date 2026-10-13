import type { AppSettings, DirectMessage, Meeting, MeetingMember, TeamMember, UserProfile } from '@shared/types'
import { api } from './api'
import {
  listMeetings,
  pendingMeetingInvites,
  unreadDirectMessages,
  watchDirectMessages,
  watchMeetings
} from './meetings'
import { sb } from './supabase'

type Category = 'meeting_invites' | 'meeting_reminders' | 'direct_messages' | 'tasks' | 'team'

const SEEN_KEY = 'cr.notify.seen'
const ROSTER_KEY = 'cr.notify.roster'
const TASKS_KEY = 'cr.notify.tasks'
const TICK_MS = 45_000
const REMINDER_MS = 10 * 60_000

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
    case 'meeting_invites':
      return settings.notify_meeting_invites
    case 'meeting_reminders':
      return settings.notify_meeting_reminders
    case 'direct_messages':
      return settings.notify_direct_messages
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

  const emailOf = (userId: string): string =>
    rosterCache.find((member) => member.user_id === userId)?.email ?? 'A teammate'

  const checkDirectMessages = async (): Promise<void> => {
    const settings = cachedSettings
    if (!settings?.notify_enabled || !settings.notify_direct_messages) return
    let messages: DirectMessage[]
    try {
      messages = await unreadDirectMessages()
    } catch {
      return
    }
    for (const message of messages) {
      if (user && message.sender_id === user.id) continue
      const onPage =
        document.visibilityState === 'visible' && window.location.hash.startsWith('#/messages')
      if (onPage) {
        if (!hasSeen(`dm-${message.id}`)) markSeen(`dm-${message.id}`)
        continue
      }
      const sender = emailOf(message.sender_id)
      notify(
        `Message from ${sender}`,
        message.body.slice(0, 120),
        `dm-${message.id}`,
        '/messages',
        'direct_messages'
      )
    }
  }

  const checkInvitesAndMeetings = async (): Promise<void> => {
    const settings = cachedSettings
    if (!settings?.notify_enabled) return
    let meetings: Meeting[]
    let invites: MeetingMember[]
    try {
      ;[meetings, invites] = await Promise.all([listMeetings(), pendingMeetingInvites()])
    } catch {
      return
    }
    const byId = new Map(meetings.map((meeting) => [meeting.id, meeting]))
    const now = Date.now()

    if (settings.notify_meeting_invites) {
      for (const invite of invites) {
        const meeting = byId.get(invite.meeting_id)
        notify(
          `Meeting invite: ${meeting?.title ?? 'New meeting'}`,
          meeting?.scheduled_at
            ? `Scheduled for ${new Date(meeting.scheduled_at).toLocaleString('en-GB')}`
            : 'Open ClientRegit to respond.',
          `invite-${invite.meeting_id}`,
          '/meetings',
          'meeting_invites'
        )
      }
    }

    if (!settings.notify_meeting_reminders) return

    let declined: string[] = []
    try {
      const client = await sb()
      const { data } = await client
        .from('meeting_members')
        .select('meeting_id')
        .eq('invite_status', 'declined')
      declined = ((data ?? []) as Array<{ meeting_id: string }>).map((row) => row.meeting_id)
    } catch {
      declined = []
    }

    for (const meeting of meetings) {
      if (meeting.status === 'ended' || meeting.status === 'cancelled') continue
      if (declined.includes(meeting.id)) continue

      if (meeting.status === 'live') {
        const hostIsMe = user && meeting.host_user_id === user.id
        const inRoom = window.location.hash.includes(meeting.code)
        if (!hostIsMe && !inRoom) {
          notify(
            `Meeting started: ${meeting.title}`,
            'The host is live now — join from the Meetings page.',
            `live-${meeting.id}`,
            `/meetings/room/${meeting.code}`,
            'meeting_reminders'
          )
        }
        continue
      }

      if (!meeting.scheduled_at) continue
      const startsAt = new Date(meeting.scheduled_at).getTime()
      const inReminderWindow = now >= startsAt - REMINDER_MS && now < startsAt + 5 * 60_000
      if (!inReminderWindow) continue
      const minutes = Math.max(0, Math.round((startsAt - now) / 60_000))
      const whenText =
        minutes >= 1
          ? `Starts in ${minutes} minute${minutes === 1 ? '' : 's'}`
          : 'Starting now'
      notify(
        `Meeting reminder: ${meeting.title}`,
        `${whenText} · ${new Date(meeting.scheduled_at).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}`,
        `rem-${meeting.id}`,
        `/meetings/room/${meeting.code}`,
        'meeting_reminders'
      )
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
    await checkInvitesAndMeetings()
    await checkDirectMessages()
    if (tick % 4 === 1) await checkRoster()
    if (tick % 6 === 3) await checkTasks()
  }

  const seedDirectMessageBaseline = async (): Promise<void> => {
    try {
      const messages = await unreadDirectMessages()
      for (const message of messages) markSeen(`dm-${message.id}`)
    } catch {
      // not signed in yet
    }
  }

  void refreshSettings()
  void seedDirectMessageBaseline()
  void runTick()
  const interval = setInterval(() => void runTick(), TICK_MS)

  const offDm = watchDirectMessages((message) => {
    if (disposed) return
    if (user && message.sender_id === user.id) return
    const onPage =
      document.visibilityState === 'visible' && window.location.hash.startsWith('#/messages')
    if (onPage) {
      if (!hasSeen(`dm-${message.id}`)) markSeen(`dm-${message.id}`)
      return
    }
    const sender = emailOf(message.sender_id)
    notify(
      `Message from ${sender}`,
      message.body.slice(0, 120),
      `dm-${message.id}`,
      '/messages',
      'direct_messages'
    )
  })

  const offMeet = watchMeetings(() => {
    void checkInvitesAndMeetings()
  })

  return () => {
    disposed = true
    clearInterval(interval)
    offDm()
    offMeet()
  }
}
