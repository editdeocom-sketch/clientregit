import { useEffect, useRef, useState, type ReactNode } from 'react'
import { Icon } from '@/components/ui/Icon'
import { Button } from '@/components/ui/Button'
import { Card, EmptyState, PageHeader } from '@/components/ui/Layout'
import { Input } from '@/components/ui/Field'
import { api } from '@/lib/api'
import { useApi } from '@/lib/hooks'
import {
  listConversations,
  listDirectMessages,
  markConversationRead,
  openConversation,
  sendDirectMessage,
  unreadDirectMessages,
  watchDirectMessages
} from '@/lib/meetings'
import { toast } from '@/store/ui'
import type { DirectMessage } from '@shared/types'

function shortTime(iso: string): string {
  const date = new Date(iso)
  const today = new Date().toISOString().slice(0, 10)
  if (date.toISOString().slice(0, 10) === today) {
    return date.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })
  }
  return date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })
}

export function MessagesPage(): ReactNode {
  const { data: user } = useApi(() => api.user.get(), [])
  const { data: roster } = useApi(() => api.team.roster(), [])
  const { data: conversations, reload: reloadConversations } = useApi(() => listConversations(), [])
  const { data: unread, reload: reloadUnread } = useApi(() => unreadDirectMessages(), [])

  const [activeId, setActiveId] = useState<string | null>(null)
  const [conversationId, setConversationId] = useState<string | null>(null)
  const [messages, setMessages] = useState<DirectMessage[] | null>(null)
  const [draft, setDraft] = useState('')
  const [opening, setOpening] = useState(false)
  const [search, setSearch] = useState('')
  const bottomRef = useRef<HTMLDivElement | null>(null)

  const unreadByOther = new Map<string, number>()
  const conversationByOther = new Map<string, string>()
  for (const conversation of conversations ?? []) {
    const other = conversation.user_a === user?.id ? conversation.user_b : conversation.user_a
    conversationByOther.set(other, conversation.id)
  }
  for (const message of unread ?? []) {
    const conversation = (conversations ?? []).find((row) => row.id === message.conversation_id)
    if (!conversation) continue
    const other = conversation.user_a === user?.id ? conversation.user_b : conversation.user_a
    if (message.sender_id !== user?.id) {
      unreadByOther.set(other, (unreadByOther.get(other) ?? 0) + 1)
    }
  }

  const openWith = async (otherId: string): Promise<void> => {
    setActiveId(otherId)
    setMessages(null)
    setOpening(true)
    try {
      const id = await openConversation(otherId)
      setConversationId(id)
      const rows = await listDirectMessages(id)
      setMessages(rows)
      await markConversationRead(id)
      reloadUnread()
      reloadConversations()
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : String(err))
    } finally {
      setOpening(false)
    }
  }

  useEffect(() => {
    return watchDirectMessages((message) => {
      if (message.conversation_id === conversationId) {
        setMessages((prev) => {
          if (prev?.some((row) => row.id === message.id)) return prev
          return [...(prev ?? []), message]
        })
        if (message.sender_id !== user?.id && conversationId) {
          void markConversationRead(conversationId).then(() => reloadUnread())
        }
      }
      reloadUnread()
      reloadConversations()
    })
  }, [conversationId, user?.id, reloadUnread, reloadConversations])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages?.length])

  const send = async (): Promise<void> => {
    const body = draft.trim()
    if (!body || !conversationId) return
    setDraft('')
    try {
      await sendDirectMessage(conversationId, body)
      const rows = await listDirectMessages(conversationId)
      setMessages(rows)
      reloadConversations()
    } catch (err: unknown) {
      setDraft(body)
      toast.error(err instanceof Error ? err.message : String(err))
    }
  }

  const emailOf = (id: string): string =>
    roster?.find((member) => member.user_id === id)?.email ?? id

  const members = (roster ?? [])
    .filter((member) => member.user_id !== user?.id)
    .filter((member) => (member.email ?? '').toLowerCase().includes(search.toLowerCase()))

  const activeEmail = activeId ? emailOf(activeId) : null
  const activeMessages = (messages ?? []).slice().sort((a, b) => a.created_at.localeCompare(b.created_at))

  return (
    <div>
      <PageHeader title="Messages" subtitle="Direct messages with your team" />
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        <Card className="lg:col-span-1">
          <div className="border-b border-line p-3">
            <div className="relative">
              <Icon
                name="search"
                size={15}
                className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted"
              />
              <Input
                placeholder="Search people"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                className="pl-9"
              />
            </div>
          </div>
          <div className="max-h-[60vh] overflow-y-auto">
            {members.length === 0 ? (
              <div className="px-4 py-8 text-center text-sm text-muted">
                {search ? 'No matches.' : 'No teammates yet. Set up a team in Settings.'}
              </div>
            ) : (
              members.map((member) => {
                const count = unreadByOther.get(member.user_id) ?? 0
                const last = (conversations ?? []).find(
                  (row) =>
                    (row.user_a === member.user_id && row.user_b === user?.id) ||
                    (row.user_b === member.user_id && row.user_a === user?.id)
                )
                return (
                  <button
                    key={member.user_id}
                    onClick={() => void openWith(member.user_id)}
                    className={`flex w-full cursor-pointer items-center gap-3 border-b border-line/50 px-4 py-3 text-left transition-colors last:border-0 ${
                      activeId === member.user_id ? 'bg-gold/10' : 'hover:bg-surface-2'
                    }`}
                  >
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-surface-2 text-sm font-semibold uppercase text-muted">
                      {(member.email ?? '?').charAt(0)}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-medium">{member.email ?? member.user_id}</span>
                      <span className="block truncate text-xs text-muted">
                        {last ? 'Last message ' + shortTime(last.last_message_at) : 'Start a conversation'}
                      </span>
                    </span>
                    {count > 0 && (
                      <span className="shrink-0 rounded-full bg-gold px-1.5 py-0.5 text-[10px] font-bold leading-none text-white">
                        {count > 9 ? '9+' : count}
                      </span>
                    )}
                  </button>
                )
              })
            )}
          </div>
        </Card>

        <Card className="flex min-h-[60vh] flex-col lg:col-span-2">
          {!activeId ? (
            <EmptyState
              icon="message"
              title="Select a teammate"
              message="Pick someone on the left to start or continue a conversation."
            />
          ) : (
            <>
              <div className="flex items-center gap-2 border-b border-line px-5 py-3">
                <Icon name="message" size={16} />
                <span className="text-sm font-semibold">{activeEmail}</span>
              </div>
              <div className="flex-1 space-y-3 overflow-y-auto px-5 py-4">
                {messages === null || opening ? (
                  <div className="py-10 text-center text-sm text-muted">Loading…</div>
                ) : activeMessages.length === 0 ? (
                  <div className="py-10 text-center text-sm text-muted">
                    No messages yet. Say hello!
                  </div>
                ) : (
                  activeMessages.map((message) => {
                    const mine = message.sender_id === user?.id
                    return (
                      <div key={message.id} className={`flex ${mine ? 'justify-end' : 'justify-start'}`}>
                        <div
                          className={`max-w-[75%] rounded-2xl px-3.5 py-2 text-sm ${
                            mine ? 'bg-gold text-white' : 'bg-surface-2 text-ink'
                          }`}
                        >
                          <div className="whitespace-pre-wrap break-words">{message.body}</div>
                          <div className={`mt-1 text-[10px] ${mine ? 'text-white/70' : 'text-muted'}`}>
                            {shortTime(message.created_at)}
                          </div>
                        </div>
                      </div>
                    )
                  })
                )}
                <div ref={bottomRef} />
              </div>
              <div className="flex items-center gap-2 border-t border-line px-4 py-3">
                <Input
                  placeholder={`Message ${activeEmail ?? ''}`}
                  value={draft}
                  onChange={(event) => setDraft(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter' && !event.shiftKey) {
                      event.preventDefault()
                      void send()
                    }
                  }}
                />
                <Button
                  variant="primary"
                  disabled={!draft.trim()}
                  icon={<Icon name="send" size={15} />}
                  onClick={() => void send()}
                >
                  Send
                </Button>
              </div>
            </>
          )}
        </Card>
      </div>
    </div>
  )
}
