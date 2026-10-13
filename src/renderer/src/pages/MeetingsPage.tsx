import { useEffect, useMemo, useState, type ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { Field, Input, Select, Textarea } from '@/components/ui/Field'
import { Icon } from '@/components/ui/Icon'
import { Card, CardHeader, EmptyState, PageHeader } from '@/components/ui/Layout'
import { Modal } from '@/components/ui/Modal'
import { api, type Tone } from '@/lib/api'
import { useApi } from '@/lib/hooks'
import {
  addGuest,
  createMeeting,
  deleteMeeting,
  inviteMembers,
  listGuests,
  listMeetings,
  listMembers,
  meetingLink,
  pendingMeetingInvites,
  removeGuest,
  removeMember,
  respondToInvite,
  setMeetingStatus,
  watchMeetings
} from '@/lib/meetings'
import { toast } from '@/store/ui'
import type { Meeting, MeetingGuest, MeetingMember, MeetingStatus } from '@shared/types'

const statusTone: Record<MeetingStatus, Tone> = {
  scheduled: 'info',
  live: 'danger',
  ended: 'muted',
  cancelled: 'muted'
}

function formatWhen(meeting: Meeting): string {
  if (!meeting.scheduled_at) return 'No time set'
  const date = new Date(meeting.scheduled_at)
  const sameDay = date.toISOString().slice(0, 10) === new Date().toISOString().slice(0, 10)
  const time = date.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })
  const day = date.toLocaleDateString('en-GB', { weekday: 'short', day: '2-digit', month: 'short' })
  return sameDay ? `Today ${time}` : `${day} ${time}`
}

function parseGuestLines(text: string): Array<{ name: string; email?: string }> {
  return text
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const match = line.match(/^(.*?)\s*<([^>]+)>\s*$/)
      if (match) return { name: match[1].trim() || match[2], email: match[2].trim() }
      if (line.includes('@') && !line.includes(' ')) return { name: line, email: line }
      return { name: line }
    })
}

async function copyText(text: string, label: string): Promise<void> {
  try {
    await navigator.clipboard.writeText(text)
    toast.success(`${label} copied.`)
  } catch {
    toast.error('Could not copy to clipboard.')
  }
}

export function MeetingsPage(): ReactNode {
  const navigate = useNavigate()
  const { data: user } = useApi(() => api.user.get(), [])
  const { data: roster } = useApi(() => api.team.roster(), [])
  const {
    data: allMeetings,
    loading,
    reload: reloadMeetings
  } = useApi<Meeting[]>(() => listMeetings(), [])

  const { data: myInvites, reload: reloadInvites } = useApi(() => pendingMeetingInvites(), [])

  useEffect(() => {
    return watchMeetings(() => {
      reloadMeetings()
      reloadInvites()
    })
  }, [reloadMeetings, reloadInvites])

  const [createOpen, setCreateOpen] = useState(false)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [cancelTarget, setCancelTarget] = useState<Meeting | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<Meeting | null>(null)

  const now = Date.now()
  const meetingsList = allMeetings ?? []
  const live = meetingsList.filter((m) => m.status === 'live')
  const upcoming = meetingsList.filter(
    (m) => m.status === 'scheduled'
  )
  const history = meetingsList.filter((m) => m.status === 'ended' || m.status === 'cancelled')
  const selected = meetingsList.find((m) => m.id === selectedId) ?? null

  const inviteMeetingTitles = useMemo(() => {
    const map = new Map<string, Meeting>()
    for (const meeting of meetingsList) map.set(meeting.id, meeting)
    return map
  }, [meetingsList])

  return (
    <div>
      <PageHeader
        title="Meetings"
        subtitle="Schedule, share links, and start video calls"
        actions={
          <Button variant="primary" icon={<Icon name="video" size={16} />} onClick={() => setCreateOpen(true)}>
            New meeting
          </Button>
        }
      />

      {(myInvites?.length ?? 0) > 0 && myInvites && (
        <Card className="mb-5 border-gold/50">
          <CardHeader title="Pending invites" subtitle="Meetings waiting for your response" />
          <div className="divide-y divide-line/60">
            {myInvites.map((invite) => {
              const meeting = inviteMeetingTitles.get(invite.meeting_id)
              if (!meeting) return null
              return (
                <div key={invite.meeting_id} className="flex items-center gap-3 px-5 py-3">
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-medium">{meeting.title}</div>
                    <div className="text-xs text-muted">
                      {formatWhen(meeting)} · hosted by {meeting.host_user_id === user?.id ? 'you' : 'your team'}
                    </div>
                  </div>
                  <Button
                    size="sm"
                    variant="primary"
                    onClick={() => {
                      void respondToInvite(meeting.id, 'accepted')
                        .then(() => {
                          toast.success('Invite accepted.')
                          reloadInvites()
                        })
                        .catch((err: unknown) => toast.error(String(err)))
                    }}
                  >
                    Accept
                  </Button>
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => {
                      void respondToInvite(meeting.id, 'declined')
                        .then(() => reloadInvites())
                        .catch((err: unknown) => toast.error(String(err)))
                    }}
                  >
                    Decline
                  </Button>
                </div>
              )
            })}
          </div>
        </Card>
      )}

      {live.length > 0 && (
        <section className="mb-6">
          <h2 className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted">Live now</h2>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {live.map((meeting) => (
              <MeetingCard
                key={meeting.id}
                meeting={meeting}
                isHost={meeting.host_user_id === user?.id}
                onOpen={() => setSelectedId(meeting.id)}
                onJoin={() => navigate(`/meetings/room/${meeting.code}`)}
              />
            ))}
          </div>
        </section>
      )}

      <section className="mb-6">
        <h2 className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted">Upcoming</h2>
        {loading && !allMeetings ? (
          <Card>
            <div className="py-10 text-center text-sm text-muted">Loading…</div>
          </Card>
        ) : upcoming.length === 0 ? (
          <EmptyState
            icon="video"
            title="No upcoming meetings"
            message="Create a meeting to get a shareable link and join code."
            action={
              <Button variant="primary" size="sm" onClick={() => setCreateOpen(true)}>
                New meeting
              </Button>
            }
          />
        ) : (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {upcoming.map((meeting) => (
              <MeetingCard
                key={meeting.id}
                meeting={meeting}
                isHost={meeting.host_user_id === user?.id}
                onOpen={() => setSelectedId(meeting.id)}
                onJoin={() => navigate(`/meetings/room/${meeting.code}`)}
              />
            ))}
          </div>
        )}
      </section>

      {history.length > 0 && (
        <section>
          <h2 className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted">History</h2>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {history.map((meeting) => (
              <MeetingCard
                key={meeting.id}
                meeting={meeting}
                isHost={meeting.host_user_id === user?.id}
                onOpen={() => setSelectedId(meeting.id)}
                onJoin={() => navigate(`/meetings/room/${meeting.code}`)}
              />
            ))}
          </div>
        </section>
      )}

      <CreateMeetingModal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        onCreated={() => {
          setCreateOpen(false)
          reloadMeetings()
          toast.success('Meeting created.')
        }}
      />

      {selected && (
        <MeetingDetailsModal
          key={selected.id}
          meeting={selected}
          isHost={selected.host_user_id === user?.id}
          myInvite={myInvites?.find((i) => i.meeting_id === selected.id) ?? null}
          roster={roster ?? []}
          onClose={() => setSelectedId(null)}
          onChanged={() => {
            reloadMeetings()
            reloadInvites()
          }}
          onCancel={() => setCancelTarget(selected)}
          onDelete={() => setDeleteTarget(selected)}
          onJoin={() => navigate(`/meetings/room/${selected.code}`)}
        />
      )}

      <ConfirmDialog
        open={!!cancelTarget}
        title="Cancel meeting?"
        message={`"${cancelTarget?.title ?? ''}" will be marked as cancelled for everyone.`}
        confirmLabel="Cancel meeting"
        danger
        onConfirm={() => {
          const target = cancelTarget
          setCancelTarget(null)
          if (!target) return
          void setMeetingStatus(target.id, 'cancelled')
            .then(() => {
              reloadMeetings()
              setSelectedId(null)
              toast.success('Meeting cancelled.')
            })
            .catch((err: unknown) => toast.error(String(err)))
        }}
        onClose={() => setCancelTarget(null)}
      />

      <ConfirmDialog
        open={!!deleteTarget}
        title="Delete meeting?"
        message={`"${deleteTarget?.title ?? ''}" and its chat history will be permanently removed.`}
        confirmLabel="Delete"
        danger
        onConfirm={() => {
          const target = deleteTarget
          setDeleteTarget(null)
          if (!target) return
          void deleteMeeting(target.id)
            .then(() => {
              reloadMeetings()
              setSelectedId(null)
              toast.success('Meeting deleted.')
            })
            .catch((err: unknown) => toast.error(String(err)))
        }}
        onClose={() => setDeleteTarget(null)}
      />
    </div>
  )
}

function MeetingCard({
  meeting,
  isHost,
  onOpen,
  onJoin
}: {
  meeting: Meeting
  isHost: boolean
  onOpen: () => void
  onJoin: () => void
}): ReactNode {
  const joinable = meeting.status === 'live' || meeting.status === 'scheduled'
  return (
    <Card className="p-4">
      <div className="flex items-start justify-between gap-3">
        <button onClick={onOpen} className="min-w-0 flex-1 cursor-pointer text-left">
          <div className="truncate text-sm font-semibold">{meeting.title}</div>
          <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-muted">
            <span>{formatWhen(meeting)}</span>
            {meeting.duration_min && <span>· {meeting.duration_min} min</span>}
            <span>· code {meeting.code}</span>
          </div>
        </button>
        <div className="flex shrink-0 items-center gap-2">
          <Badge tone={statusTone[meeting.status]}>{meeting.status}</Badge>
          {isHost && meeting.status === 'scheduled' && <Badge tone="gold">host</Badge>}
        </div>
      </div>
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <Button
          size="sm"
          variant={joinable ? 'primary' : 'secondary'}
          disabled={!joinable}
          icon={<Icon name="video" size={14} />}
          onClick={onJoin}
        >
          {meeting.status === 'live' ? 'Join' : 'Enter room'}
        </Button>
        <Button
          size="sm"
          variant="secondary"
          icon={<Icon name="copy" size={14} />}
          onClick={() => void copyText(meetingLink(meeting.code), 'Invite link')}
        >
          Copy link
        </Button>
        <Button size="sm" variant="ghost" onClick={onOpen}>
          Details
        </Button>
      </div>
    </Card>
  )
}

function CreateMeetingModal({
  open,
  onClose,
  onCreated
}: {
  open: boolean
  onClose: () => void
  onCreated: (meeting: { id: string; code: string }) => void
}): ReactNode {
  const { data: roster } = useApi(() => api.team.roster(), [])
  const [title, setTitle] = useState('')
  const [whenLocal, setWhenLocal] = useState('')
  const [duration, setDuration] = useState('60')
  const [lobby, setLobby] = useState(true)
  const [description, setDescription] = useState('')
  const [memberIds, setMemberIds] = useState<string[]>([])
  const [guestLines, setGuestLines] = useState('')
  const [busy, setBusy] = useState(false)

  if (!open) return null

  const submit = async (): Promise<void> => {
    if (!title.trim()) {
      toast.error('Enter a meeting title.')
      return
    }
    setBusy(true)
    try {
      const guests = parseGuestLines(guestLines)
      const scheduledAt = whenLocal ? new Date(whenLocal).toISOString() : null
      const result = await createMeeting({
        title: title.trim(),
        scheduledAt,
        durationMin: duration ? Number(duration) : null,
        lobbyEnabled: lobby,
        description: description.trim() || null,
        memberIds,
        guests
      })
      onCreated(result)
      setTitle('')
      setWhenLocal('')
      setDescription('')
      setMemberIds([])
      setGuestLines('')
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : String(err))
    } finally {
      setBusy(false)
    }
  }

  return (
    <Modal
      open={open}
      title="New meeting"
      onClose={onClose}
      wide
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="primary" disabled={busy} onClick={() => void submit()}>
            {busy ? 'Creating…' : 'Create meeting'}
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <Field label="Title" required>
          <Input
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            placeholder="Weekly sync"
            autoFocus
          />
        </Field>
        <div className="grid grid-cols-2 gap-4">
          <Field label="When" hint="Leave empty for an ad-hoc meeting">
            <Input type="datetime-local" value={whenLocal} onChange={(event) => setWhenLocal(event.target.value)} />
          </Field>
          <Field label="Duration (minutes)">
            <Input
              type="number"
              min={5}
              step={5}
              value={duration}
              onChange={(event) => setDuration(event.target.value)}
            />
          </Field>
        </div>
        <Field label="Description">
          <Textarea rows={2} value={description} onChange={(event) => setDescription(event.target.value)} />
        </Field>
        <label className="flex cursor-pointer items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={lobby}
            onChange={(event) => setLobby(event.target.checked)}
            className="h-4 w-4 accent-[var(--color-gold,#bf932a)]"
          />
          Waiting room — guests wait until you let them in
        </label>
        <Field label="Invite team members">
          <div className="max-h-40 space-y-1 overflow-y-auto rounded-lg border border-line p-2">
            {(roster ?? []).length === 0 && (
              <p className="px-1 py-1 text-xs text-muted">No team members yet. Set up a team in Settings.</p>
            )}
            {(roster ?? []).map((member) => (
              <label key={member.user_id} className="flex cursor-pointer items-center gap-2 rounded px-1 py-1 text-sm hover:bg-surface-2">
                <input
                  type="checkbox"
                  checked={memberIds.includes(member.user_id)}
                  onChange={(event) =>
                    setMemberIds((prev) =>
                      event.target.checked
                        ? [...prev, member.user_id]
                        : prev.filter((id) => id !== member.user_id)
                    )
                  }
                  className="h-4 w-4 accent-[var(--color-gold,#bf932a)]"
                />
                <span className="truncate">{member.email ?? member.user_id}</span>
              </label>
            ))}
          </div>
        </Field>
        <Field label="Guests" hint="One per line: Name, or Name &lt;email&gt;">
          <Textarea
            rows={3}
            value={guestLines}
            onChange={(event) => setGuestLines(event.target.value)}
            placeholder={'Alex Morgan\nsam@client.com'}
          />
        </Field>
      </div>
    </Modal>
  )
}

function MeetingDetailsModal({
  meeting,
  isHost,
  myInvite,
  roster,
  onClose,
  onChanged,
  onCancel,
  onDelete,
  onJoin
}: {
  meeting: Meeting
  isHost: boolean
  myInvite: MeetingMember | null
  roster: Array<{ user_id: string; email: string | null; role: 'leader' | 'member' }>
  onClose: () => void
  onChanged: () => void
  onCancel: () => void
  onDelete: () => void
  onJoin: () => void
}): ReactNode {
  const { data: members, reload: reloadMembers } = useApi<MeetingMember[]>(
    () => listMembers(meeting.id),
    [meeting.id]
  )
  const { data: guests, reload: reloadGuests } = useApi<MeetingGuest[]>(
    () => listGuests(meeting.id),
    [meeting.id]
  )
  const [inviteOpen, setInviteOpen] = useState(false)
  const [guestName, setGuestName] = useState('')
  const [guestEmail, setGuestEmail] = useState('')
  const [busy, setBusy] = useState(false)

  const memberEmail = (userId: string): string =>
    roster.find((member) => member.user_id === userId)?.email ?? userId
  const notInvited = roster.filter(
    (member) => !(members ?? []).some((row) => row.user_id === member.user_id)
  )
  const link = meetingLink(meeting.code)
  const joinable = meeting.status === 'live' || meeting.status === 'scheduled'

  return (
    <Modal
      open
      title={meeting.title}
      onClose={onClose}
      wide
      footer={
        <>
          <Button variant="secondary" onClick={() => void copyText(link, 'Invite link')} icon={<Icon name="link" size={15} />}>
            Copy link
          </Button>
          {joinable && (
            <Button variant="primary" onClick={onJoin} icon={<Icon name="video" size={15} />}>
              {meeting.status === 'live' ? 'Join now' : 'Enter room'}
            </Button>
          )}
          {!isHost && myInvite?.invite_status === 'invited' && (
            <Button
              variant="primary"
              disabled={busy}
              onClick={() => {
                setBusy(true)
                void respondToInvite(meeting.id, 'accepted')
                  .then(() => {
                    onChanged()
                    toast.success('Invite accepted.')
                  })
                  .catch((err: unknown) => toast.error(String(err)))
                  .finally(() => setBusy(false))
              }}
            >
              Accept invite
            </Button>
          )}
        </>
      }
    >
      <div className="space-y-5">
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div>
            <div className="text-xs font-semibold uppercase tracking-wide text-muted">When</div>
            <div className="mt-0.5">{formatWhen(meeting)}</div>
          </div>
          <div>
            <div className="text-xs font-semibold uppercase tracking-wide text-muted">Join code</div>
            <div className="mt-0.5 font-mono">{meeting.code}</div>
          </div>
          <div className="col-span-2">
            <div className="text-xs font-semibold uppercase tracking-wide text-muted">Link</div>
            <div className="mt-0.5 break-all font-mono text-xs">{link}</div>
          </div>
          {meeting.description && (
            <div className="col-span-2">
              <div className="text-xs font-semibold uppercase tracking-wide text-muted">Description</div>
              <div className="mt-0.5 whitespace-pre-wrap">{meeting.description}</div>
            </div>
          )}
        </div>

        <div>
          <div className="mb-2 flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wide text-muted">
              Team members ({(members ?? []).length})
            </span>
            {isHost && notInvited.length > 0 && (
              <Button size="sm" variant="ghost" onClick={() => setInviteOpen((value) => !value)}>
                {inviteOpen ? 'Close' : 'Invite more'}
              </Button>
            )}
          </div>
          <div className="space-y-1">
            {(members ?? []).map((member) => (
              <div key={member.user_id} className="flex items-center gap-2 rounded-lg border border-line px-3 py-2 text-sm">
                <span className="min-w-0 flex-1 truncate">{memberEmail(member.user_id)}</span>
                <Badge tone={member.invite_status === 'accepted' ? 'success' : member.invite_status === 'declined' ? 'danger' : 'warn'}>
                  {member.invite_status}
                </Badge>
                {isHost && (
                  <button
                    className="cursor-pointer text-muted transition-colors hover:text-danger"
                    title="Remove"
                    onClick={() => {
                      void removeMember(meeting.id, member.user_id)
                        .then(() => {
                          reloadMembers()
                          onChanged()
                        })
                        .catch((err: unknown) => toast.error(String(err)))
                    }}
                  >
                    <Icon name="x" size={14} />
                  </button>
                )}
              </div>
            ))}
            {(members ?? []).length === 0 && (
              <p className="text-xs text-muted">No team members invited.</p>
            )}
          </div>
          {inviteOpen && (
            <div className="mt-2 rounded-lg border border-gold/40 bg-gold/5 p-3">
              <div className="space-y-1">
                {notInvited.map((member) => (
                  <div key={member.user_id} className="flex items-center justify-between gap-2 text-sm">
                    <span className="min-w-0 flex-1 truncate">{member.email ?? member.user_id}</span>
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => {
                        void inviteMembers(meeting.id, [member.user_id])
                          .then(() => {
                            reloadMembers()
                            onChanged()
                          })
                          .catch((err: unknown) => toast.error(String(err)))
                      }}
                    >
                      Invite
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div>
          <span className="text-xs font-semibold uppercase tracking-wide text-muted">
            Guests ({(guests ?? []).length})
          </span>
          <div className="mt-2 space-y-1">
            {(guests ?? []).map((guest) => (
              <div key={guest.id} className="flex items-center gap-2 rounded-lg border border-line px-3 py-2 text-sm">
                <Icon name="user" size={14} />
                <span className="min-w-0 flex-1 truncate">
                  {guest.name}
                  {guest.email && <span className="text-muted"> · {guest.email}</span>}
                </span>
                {isHost && (
                  <button
                    className="cursor-pointer text-muted transition-colors hover:text-danger"
                    title="Remove guest"
                    onClick={() => {
                      void removeGuest(guest.id)
                        .then(() => {
                          reloadGuests()
                          onChanged()
                        })
                        .catch((err: unknown) => toast.error(String(err)))
                    }}
                  >
                    <Icon name="x" size={14} />
                  </button>
                )}
              </div>
            ))}
            {(guests ?? []).length === 0 && <p className="text-xs text-muted">No guests yet.</p>}
          </div>
          {isHost && (
            <div className="mt-2 flex gap-2">
              <Input
                placeholder="Guest name"
                value={guestName}
                onChange={(event) => setGuestName(event.target.value)}
                className="flex-1"
              />
              <Input
                placeholder="Email (optional)"
                value={guestEmail}
                onChange={(event) => setGuestEmail(event.target.value)}
                className="flex-1"
              />
              <Button
                size="sm"
                variant="secondary"
                disabled={!guestName.trim()}
                onClick={() => {
                  void addGuest(meeting.id, { name: guestName.trim(), email: guestEmail.trim() || undefined })
                    .then(() => {
                      setGuestName('')
                      setGuestEmail('')
                      reloadGuests()
                      onChanged()
                    })
                    .catch((err: unknown) => toast.error(String(err)))
                }}
              >
                Add
              </Button>
            </div>
          )}
        </div>

        {isHost && (
          <div className="flex flex-wrap gap-2 border-t border-line pt-4">
            {(meeting.status === 'scheduled' || meeting.status === 'live') && (
              <Button size="sm" variant="secondary" onClick={onCancel}>
                Cancel meeting
              </Button>
            )}
            {(meeting.status === 'ended' || meeting.status === 'cancelled') && (
              <Button size="sm" variant="secondary" onClick={onDelete}>
                Delete meeting
              </Button>
            )}
          </div>
        )}
      </div>
    </Modal>
  )
}
