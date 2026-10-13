import type {
  DirectMessage,
  Meeting,
  MeetingByCode,
  MeetingGuest,
  MeetingMember,
  MeetingMessage
} from '@shared/types'
import type { RealtimeChannel, SupabaseClient } from '@supabase/supabase-js'
import { api } from './api'
import { sb } from './supabase'

export interface CreateMeetingInput {
  title: string
  scheduledAt: string | null
  durationMin: number | null
  lobbyEnabled: boolean
  description: string | null
  memberIds: string[]
  guests: Array<{ name: string; email?: string }>
}

export interface MeetingUpdateInput {
  title?: string
  scheduledAt?: string | null
  clearScheduled?: boolean
  durationMin?: number | null
  clearDuration?: boolean
  lobbyEnabled?: boolean
  description?: string | null
}

export function meetingLink(code: string): string {
  return `${__SITE_URL__}/#/join/${code}`
}

async function rpc<T>(fn: string, args: Record<string, unknown>): Promise<T> {
  const client = await sb()
  const { data, error } = await client.rpc(fn, args)
  if (error) throw new Error(error.message)
  return data as T
}

export async function listMeetings(): Promise<Meeting[]> {
  const client = await sb()
  const { data, error } = await client
    .from('meetings')
    .select('*')
    .order('created_at', { ascending: false })
  if (error) throw new Error(error.message)
  return (data ?? []) as Meeting[]
}

export async function createMeeting(input: CreateMeetingInput): Promise<{ id: string; code: string }> {
  const result = await rpc<{ ok: boolean; code?: string; id?: string }>('create_meeting', {
    p_title: input.title,
    p_scheduled_at: input.scheduledAt,
    p_duration_min: input.durationMin,
    p_lobby_enabled: input.lobbyEnabled,
    p_description: input.description,
    p_member_ids: input.memberIds,
    p_guest: input.guests
  })
  if (!result.ok || !result.id || !result.code) {
    throw new Error(meetingErrorCode(result.code))
  }
  return { id: result.id, code: result.code }
}

export async function updateMeeting(id: string, patch: MeetingUpdateInput): Promise<void> {
  const result = await rpc<{ ok: boolean; code?: string }>('update_meeting', {
    p_id: id,
    p_title: patch.title,
    p_scheduled_at: patch.scheduledAt ?? null,
    p_clear_scheduled: patch.clearScheduled ?? false,
    p_duration_min: patch.durationMin ?? null,
    p_clear_duration: patch.clearDuration ?? false,
    p_lobby_enabled: patch.lobbyEnabled,
    p_description: patch.description
  })
  if (!result.ok) throw new Error(meetingErrorCode(result.code))
}

export async function setMeetingStatus(
  id: string,
  status: 'scheduled' | 'live' | 'ended' | 'cancelled'
): Promise<void> {
  const result = await rpc<{ ok: boolean; code?: string }>('set_meeting_status', {
    p_id: id,
    p_status: status
  })
  if (!result.ok) throw new Error(meetingErrorCode(result.code))
}

export async function getMeetingByCode(code: string): Promise<MeetingByCode | null> {
  const client = await sb()
  const { data, error } = await client.rpc('get_meeting_by_code', { p_code: code })
  if (error) throw new Error(error.message)
  const payload = data as MeetingByCode | null
  if (!payload?.ok) return null
  return payload
}

export async function deleteMeeting(id: string): Promise<void> {
  const client = await sb()
  const { error } = await client.from('meetings').delete().eq('id', id)
  if (error) throw new Error(error.message)
}

export async function listMembers(meetingId: string): Promise<MeetingMember[]> {
  const client = await sb()
  const { data, error } = await client
    .from('meeting_members')
    .select('*')
    .eq('meeting_id', meetingId)
  if (error) throw new Error(error.message)
  return (data ?? []) as MeetingMember[]
}

export async function listGuests(meetingId: string): Promise<MeetingGuest[]> {
  const client = await sb()
  const { data, error } = await client
    .from('meeting_guests')
    .select('*')
    .eq('meeting_id', meetingId)
  if (error) throw new Error(error.message)
  return (data ?? []) as MeetingGuest[]
}

export async function inviteMembers(meetingId: string, userIds: string[]): Promise<void> {
  const client = await sb()
  const rows = userIds.map((user_id) => ({ meeting_id: meetingId, user_id }))
  const { error } = await client.from('meeting_members').insert(rows)
  if (error) throw new Error(error.message)
}

export async function removeMember(meetingId: string, userId: string): Promise<void> {
  const client = await sb()
  const { error } = await client
    .from('meeting_members')
    .delete()
    .eq('meeting_id', meetingId)
    .eq('user_id', userId)
  if (error) throw new Error(error.message)
}

export async function addGuest(
  meetingId: string,
  guest: { name: string; email?: string }
): Promise<void> {
  const client = await sb()
  const { error } = await client.from('meeting_guests').insert({ meeting_id: meetingId, ...guest })
  if (error) throw new Error(error.message)
}

export async function removeGuest(guestId: string): Promise<void> {
  const client = await sb()
  const { error } = await client.from('meeting_guests').delete().eq('id', guestId)
  if (error) throw new Error(error.message)
}

export async function respondToInvite(
  meetingId: string,
  status: 'accepted' | 'declined'
): Promise<void> {
  const client = await sb()
  const user = await api.user.get()
  if (!user) throw new Error('Sign in to respond to invites.')
  const { error } = await client
    .from('meeting_members')
    .update({ invite_status: status })
    .eq('meeting_id', meetingId)
    .eq('user_id', user.id)
  if (error) throw new Error(error.message)
}

export async function listMeetingMessages(meetingId: string): Promise<MeetingMessage[]> {
  const client = await sb()
  const { data, error } = await client
    .from('meeting_messages')
    .select('*')
    .eq('meeting_id', meetingId)
    .order('created_at', { ascending: true })
    .limit(500)
  if (error) throw new Error(error.message)
  return (data ?? []) as MeetingMessage[]
}

export async function sendMeetingMessage(
  meetingId: string,
  input: { senderId: string; senderName: string; body: string; kind?: 'user' | 'guest' }
): Promise<void> {
  const client = await sb()
  const { error } = await client.from('meeting_messages').insert({
    meeting_id: meetingId,
    sender_kind: input.kind ?? 'user',
    sender_id: input.senderId,
    sender_name: input.senderName,
    body: input.body.slice(0, 4000)
  })
  if (error) throw new Error(error.message)
}

export function watchMeetingMessages(
  meetingId: string,
  onInsert: (message: MeetingMessage) => void
): () => void {
  let cancelled = false
  let client: SupabaseClient | null = null
  let channel: RealtimeChannel | null = null
  void sb().then((c) => {
    if (cancelled) return
    client = c
    channel = c
      .channel(`mm-${meetingId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'meeting_messages',
          filter: `meeting_id=eq.${meetingId}`
        },
        (payload) => onInsert(payload.new as MeetingMessage)
      )
      .subscribe()
  })
  return () => {
    cancelled = true
    if (client && channel) void client.removeChannel(channel)
  }
}

export function watchMeetings(onChange: () => void): () => void {
  let cancelled = false
  let client: SupabaseClient | null = null
  let channel: RealtimeChannel | null = null
  void sb().then((c) => {
    if (cancelled) return
    client = c
    channel = c
      .channel(`mtg-watch-${Date.now()}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'meetings' },
        () => onChange()
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'meeting_members' },
        () => onChange()
      )
      .subscribe()
  })
  return () => {
    cancelled = true
    if (client && channel) void client.removeChannel(channel)
  }
}

// --- 1:1 messaging ---

export async function openConversation(otherId: string): Promise<string> {
  const result = await rpc<{ ok: boolean; code?: string; id?: string }>(
    'get_or_create_conversation',
    { p_other: otherId }
  )
  if (!result.ok || !result.id) throw new Error(result.code ?? 'Could not open conversation.')
  return result.id
}

export async function listConversations(): Promise<ConversationRow[]> {
  const client = await sb()
  const { data, error } = await client
    .from('conversations')
    .select('*')
    .order('last_message_at', { ascending: false })
  if (error) throw new Error(error.message)
  return (data ?? []) as ConversationRow[]
}

export async function listDirectMessages(conversationId: string): Promise<DirectMessage[]> {
  const client = await sb()
  const { data, error } = await client
    .from('messages')
    .select('*')
    .eq('conversation_id', conversationId)
    .order('created_at', { ascending: true })
    .limit(500)
  if (error) throw new Error(error.message)
  return (data ?? []) as DirectMessage[]
}

export async function sendDirectMessage(conversationId: string, body: string): Promise<void> {
  const user = await api.user.get()
  if (!user) throw new Error('Sign in to send messages.')
  const client = await sb()
  const { error } = await client.from('messages').insert({
    conversation_id: conversationId,
    sender_id: user.id,
    body: body.slice(0, 8000)
  })
  if (error) throw new Error(error.message)
  const { error: convError } = await client
    .from('conversations')
    .update({ last_message_at: new Date().toISOString() })
    .eq('id', conversationId)
  if (convError) throw new Error(convError.message)
}

export async function markConversationRead(conversationId: string): Promise<void> {
  const user = await api.user.get()
  if (!user) return
  const client = await sb()
  const { error } = await client
    .from('messages')
    .update({ read_at: new Date().toISOString() })
    .eq('conversation_id', conversationId)
    .neq('sender_id', user.id)
    .is('read_at', null)
  if (error) throw new Error(error.message)
}

export async function unreadDirectMessages(): Promise<DirectMessage[]> {
  const user = await api.user.get()
  if (!user) return []
  const client = await sb()
  const { data, error } = await client
    .from('messages')
    .select('*')
    .is('read_at', null)
    .neq('sender_id', user.id)
    .order('created_at', { ascending: false })
    .limit(200)
  if (error) throw new Error(error.message)
  return (data ?? []) as DirectMessage[]
}

export async function pendingMeetingInvites(): Promise<MeetingMember[]> {
  const user = await api.user.get()
  if (!user) return []
  const client = await sb()
  const { data, error } = await client
    .from('meeting_members')
    .select('*')
    .eq('user_id', user.id)
    .eq('invite_status', 'invited')
  if (error) throw new Error(error.message)
  return (data ?? []) as MeetingMember[]
}

export function watchDirectMessages(onChange: (message: DirectMessage) => void): () => void {
  let cancelled = false
  let client: SupabaseClient | null = null
  let channel: RealtimeChannel | null = null
  void sb().then((c) => {
    if (cancelled) return
    client = c
    channel = c
      .channel(`dm-watch-${Date.now()}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'messages' },
        (payload) => onChange(payload.new as DirectMessage)
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'messages' },
        (payload) => onChange(payload.new as DirectMessage)
      )
      .subscribe()
  })
  return () => {
    cancelled = true
    if (client && channel) void client.removeChannel(channel)
  }
}

export function watchMyMeetingInvites(
  userId: string,
  onChange: (row: MeetingMember) => void
): () => void {
  let cancelled = false
  let client: SupabaseClient | null = null
  let channel: RealtimeChannel | null = null
  void sb().then((c) => {
    if (cancelled) return
    client = c
    channel = c
      .channel(`mi-watch-${userId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'meeting_members',
          filter: `user_id=eq.${userId}`
        },
        (payload) => onChange(payload.new as MeetingMember)
      )
      .subscribe()
  })
  return () => {
    cancelled = true
    if (client && channel) void client.removeChannel(channel)
  }
}

export interface ConversationRow {
  id: string
  user_a: string
  user_b: string
  last_message_at: string
  created_at: string
}

function meetingErrorCode(code?: string): string {
  switch (code) {
    case 'not_host':
      return 'Only the meeting host can do that.'
    case 'bad_title':
      return 'Enter a meeting title (max 200 characters).'
    case 'bad_duration':
      return 'Duration must be more than 0 minutes.'
    case 'no_team':
      return 'Team members can only be invited from a team workspace.'
    case 'bad_members':
      return 'You can only invite people from your team.'
    case 'bad_status':
      return 'Invalid meeting status.'
    case 'not_authenticated':
      return 'Sign in to manage meetings.'
    case 'not_found':
      return 'Meeting not found.'
    default:
      return code ? `Meeting error: ${code}` : 'Meeting request failed.'
  }
}
