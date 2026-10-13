import { useEffect, useState } from 'react'
import { api } from './api'
import {
  pendingMeetingInvites,
  unreadDirectMessages,
  watchDirectMessages,
  watchMyMeetingInvites
} from './meetings'

export interface MeetBadges {
  invites: number
  unread: number
}

export function useMeetBadges(): MeetBadges {
  const [badges, setBadges] = useState<MeetBadges>({ invites: 0, unread: 0 })

  useEffect(() => {
    let alive = true

    const refresh = async (): Promise<void> => {
      try {
        const [invites, unread] = await Promise.all([pendingMeetingInvites(), unreadDirectMessages()])
        if (!alive) return
        setBadges({ invites: invites.length, unread: unread.length })
      } catch {
        // badges are best-effort
      }
    }

    void refresh()
    const offSync = api.team.onSynced(() => void refresh())
    const offDm = watchDirectMessages(() => void refresh())
    let offInvites: (() => void) | null = null
    let inviteWatchCancelled = false
    void api.user.get().then((user) => {
      if (inviteWatchCancelled || !user) return
      offInvites = watchMyMeetingInvites(user.id, () => void refresh())
    })

    return () => {
      alive = false
      inviteWatchCancelled = true
      offSync()
      offDm()
      offInvites?.()
    }
  }, [])

  return badges
}
