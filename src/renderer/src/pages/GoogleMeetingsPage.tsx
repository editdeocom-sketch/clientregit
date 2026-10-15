import { useState, type ReactNode } from 'react'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Card, CardHeader, PageHeader } from '@/components/ui/Layout'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { Icon } from '@/components/ui/Icon'
import { api } from '@/lib/api'
import { useApi } from '@/lib/hooks'
import { toast } from '@/store/ui'
import type { GoogleAccountInfo, GoogleCreatedMeeting, GoogleMeeting } from '@shared/types'

function fmtWhen(iso: string): string {
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return iso
  return date.toLocaleString('en-GB', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit'
  })
}

export function GoogleMeetingsPage(): ReactNode {
  const { data: account, loading, reload: reloadStatus } = useApi<GoogleAccountInfo | null>(
    () => api.google.status(),
    []
  )
  const { data: upcoming, loading: upcomingLoading, reload: reloadUpcoming } = useApi<GoogleMeeting[]>(
    () => (account ? api.google.upcoming(14) : Promise.resolve([])),
    [account?.email]
  )

  const [linking, setLinking] = useState(false)
  const [creating, setCreating] = useState(false)
  const [title, setTitle] = useState('')
  const [created, setCreated] = useState<GoogleCreatedMeeting | null>(null)
  const [confirmUnlink, setConfirmUnlink] = useState(false)

  const link = async (): Promise<void> => {
    setLinking(true)
    try {
      const info = await api.google.link()
      toast.success(`Linked ${info.email}`)
      reloadStatus()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : String(err))
    } finally {
      setLinking(false)
    }
  }

  const create = async (openAfter: boolean): Promise<void> => {
    setCreating(true)
    try {
      const meeting = await api.google.createMeeting({ title, durationMin: 30 })
      setCreated(meeting)
      setTitle('')
      toast.success('Meeting created in your Google Calendar')
      if (openAfter) void api.files.openExternal(meeting.meetLink)
      reloadUpcoming()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : String(err))
    } finally {
      setCreating(false)
    }
  }

  const copy = async (text: string): Promise<void> => {
    try {
      await navigator.clipboard.writeText(text)
      toast.success('Meet link copied')
    } catch {
      toast.error('Could not copy the link')
    }
  }

  const unlink = async (): Promise<void> => {
    setConfirmUnlink(false)
    try {
      await api.google.unlink()
      toast.success('Google account unlinked')
      setCreated(null)
      reloadStatus()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : String(err))
    }
  }

  return (
    <div>
      <PageHeader
        title="Meetings"
        subtitle="Create and join Google Meet sessions with your linked Google account"
      />

      <div className="space-y-5">
        <Card>
          <CardHeader
            title="Google account"
            action={
              account ? (
                <Button variant="ghost" size="sm" onClick={() => setConfirmUnlink(true)}>
                  Unlink
                </Button>
              ) : undefined
            }
          />
          <div className="px-5 py-4">
            {loading ? (
              <p className="text-sm text-muted">Checking link status…</p>
            ) : account ? (
              <div className="flex items-center gap-3">
                {account.picture ? (
                  <img
                    src={account.picture}
                    alt=""
                    className="h-9 w-9 rounded-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <span className="flex h-9 w-9 items-center justify-center rounded-full bg-gold/15 text-sm font-semibold text-gold-strong dark:text-gold">
                    {(account.name ?? account.email).charAt(0).toUpperCase()}
                  </span>
                )}
                <div className="min-w-0">
                  <div className="truncate text-sm font-semibold">{account.name ?? account.email}</div>
                  <div className="truncate text-xs text-muted">{account.email}</div>
                </div>
                <Badge tone="gold">Linked</Badge>
              </div>
            ) : (
              <div className="flex flex-col items-start gap-3 sm:flex-row sm:items-center sm:justify-between">
                <p className="max-w-xl text-sm leading-relaxed text-muted">
                  Link a Google account to create Google Meet sessions from ClientRegit. Meetings are created in
                  your Google Calendar; your Google data goes to Google, not to us. Tokens are stored encrypted on
                  this PC.
                </p>
                <Button
                  variant="primary"
                  icon={<Icon name="link" size={15} />}
                  disabled={linking}
                  onClick={() => void link()}
                >
                  {linking ? 'Waiting for Google…' : 'Link Google account'}
                </Button>
              </div>
            )}
            {linking && (
              <p className="mt-3 text-xs text-muted">
                A browser window opened for Google sign-in. Approve access, then return here.
              </p>
            )}
          </div>
        </Card>

        {account && (
          <Card>
            <CardHeader title="New meeting" subtitle="Creates an instant Google Meet and adds it to your calendar" />
            <div className="flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center">
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Meeting title (e.g. Client review — Sharma Films)"
                className="w-full flex-1 rounded-lg border border-line bg-surface-2 px-3 py-2 text-sm outline-none focus:border-gold"
              />
              <div className="flex gap-2">
                <Button
                  variant="primary"
                  icon={<Icon name="video" size={15} />}
                  disabled={creating}
                  onClick={() => void create(true)}
                >
                  {creating ? 'Creating…' : 'Create & open'}
                </Button>
                <Button variant="secondary" disabled={creating} onClick={() => void create(false)}>
                  Create
                </Button>
              </div>
            </div>
            {created && (
              <div className="mx-5 mb-4 flex flex-wrap items-center gap-2 rounded-lg border border-gold/40 bg-gold/5 px-4 py-3 text-sm">
                <span className="font-semibold">{created.title}</span>
                <a
                  href={created.meetLink}
                  onClick={(e) => {
                    e.preventDefault()
                    void api.files.openExternal(created.meetLink)
                  }}
                  className="truncate text-gold-strong underline-offset-2 hover:underline dark:text-gold"
                >
                  {created.meetLink}
                </a>
                <Button variant="ghost" size="sm" icon={<Icon name="copy" size={14} />} onClick={() => void copy(created.meetLink)}>
                  Copy
                </Button>
              </div>
            )}
          </Card>
        )}

        {account && (
          <Card>
            <CardHeader
              title="Upcoming Google meetings"
              subtitle="Events with a Meet link in the next 14 days"
              action={
                <Button variant="ghost" size="sm" icon={<Icon name="refresh" size={14} />} onClick={() => reloadUpcoming()}>
                  Refresh
                </Button>
              }
            />
            <div className="divide-y divide-line/60 px-5 py-1">
              {upcomingLoading ? (
                <p className="py-6 text-center text-sm text-muted">Loading upcoming meetings…</p>
              ) : !upcoming || upcoming.length === 0 ? (
                <p className="py-6 text-center text-sm text-muted">
                  No upcoming Google meetings. Create one above or schedule it in Google Calendar.
                </p>
              ) : (
                upcoming.map((meeting) => (
                  <div key={meeting.id} className="flex items-center gap-3 py-3">
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-sm font-medium">{meeting.title}</div>
                      <div className="truncate text-xs text-muted">{fmtWhen(meeting.start)}</div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      icon={<Icon name="copy" size={14} />}
                      onClick={() => void copy(meeting.meetLink)}
                    />
                    <Button
                      variant="secondary"
                      size="sm"
                      icon={<Icon name="external" size={14} />}
                      onClick={() => void api.files.openExternal(meeting.meetLink)}
                    >
                      Join
                    </Button>
                  </div>
                ))
              )}
            </div>
          </Card>
        )}
      </div>

      <ConfirmDialog
        open={confirmUnlink}
        title="Unlink Google account?"
        message="ClientRegit will lose access to your Google Calendar. Meetings already created stay in your calendar."
        confirmLabel="Unlink"
        danger
        onConfirm={() => void unlink()}
        onClose={() => setConfirmUnlink(false)}
      />
    </div>
  )
}
