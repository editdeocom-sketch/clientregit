import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { Field, Input, Select } from '@/components/ui/Field'
import { Icon, type IconName } from '@/components/ui/Icon'
import { api } from '@/lib/api'
import { useApi } from '@/lib/hooks'
import { CallEngine, type CallPeerState, type CallSelfState } from '@/lib/call'
import {
  getMeetingByCode,
  listMeetingMessages,
  sendMeetingMessage,
  setMeetingStatus,
  watchMeetingMessages
} from '@/lib/meetings'
import { sb } from '@/lib/supabase'
import { toast } from '@/store/ui'
import type { MeetingByCode, MeetingMessage, UserProfile } from '@shared/types'

type Mode = 'idle' | 'waiting' | 'joined'

interface RoomInfo extends MeetingByCode {
  id: string
  code: string
  hostUserId?: string | null
  startedAt?: string | null
  isHost: boolean
}

const REACTIONS = [
  '\u{1F44D}',
  '\u{2764}\u{FE0F}',
  '\u{1F525}',
  '\u{1F44F}',
  '\u{1F602}',
  '\u{1F44B}'
]

function shortWhen(iso: string | null | undefined): string {
  if (!iso) return ''
  const date = new Date(iso)
  return date.toLocaleString('en-GB', {
    weekday: 'short',
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit'
  })
}

function VideoSurface({
  stream,
  mirrored,
  showMedia,
  mutedSelf
}: {
  stream: MediaStream | null
  mirrored?: boolean
  showMedia?: boolean
  mutedSelf?: boolean
}): ReactNode {
  const ref = useRef<HTMLVideoElement | null>(null)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    if (el.srcObject !== stream) el.srcObject = stream
    if (stream) void el.play().catch(() => undefined)
  }, [stream])
  return (
    <video
      ref={ref}
      autoPlay
      playsInline
      muted={!!mutedSelf}
      className={`h-full w-full object-cover ${mirrored ? '-scale-x-100' : ''}`}
      style={{ display: showMedia === false ? 'none' : undefined }}
    />
  )
}

export function MeetingRoom(): ReactNode {
  const { code = '' } = useParams()
  const navigate = useNavigate()
  const { data: user } = useApi<UserProfile | null>(() => api.user.get(), [])

  const [info, setInfo] = useState<RoomInfo | null | undefined>(undefined)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [mode, setMode] = useState<Mode>('idle')
  const [busy, setBusy] = useState(false)
  const [joinError, setJoinError] = useState<string | null>(null)

  const [peers, setPeers] = useState<CallPeerState[]>([])
  const [selfState, setSelfState] = useState<CallSelfState | null>(null)
  const [micOn, setMicOn] = useState(true)
  const [camOn, setCamOn] = useState(true)
  const [screenActive, setScreenActive] = useState(false)
  const [panel, setPanel] = useState<'chat' | 'people' | null>(null)
  const [chat, setChat] = useState<MeetingMessage[] | null>(null)
  const [chatDraft, setChatDraft] = useState('')
  const [seenChat, setSeenChat] = useState(0)
  const [floats, setFloats] = useState<Array<{ id: number; emoji: string }>>([])
  const [reactionBar, setReactionBar] = useState(false)
  const [recording, setRecording] = useState(false)
  const [recordSeconds, setRecordSeconds] = useState(0)
  const [endConfirm, setEndConfirm] = useState(false)
  const [left, setLeft] = useState(false)

  const [displayName, setDisplayName] = useState('')
  const [localStream, setLocalStream] = useState<MediaStream | null>(null)
  const [previewTick, setPreviewTick] = useState(0)
  const [devices, setDevices] = useState<MediaDeviceInfo[]>([])
  const [camId, setCamId] = useState('')
  const [micId, setMicId] = useState('')
  const [deviceError, setDeviceError] = useState<string | null>(null)

  const engineRef = useRef<CallEngine | null>(null)
  const localStreamRef = useRef<MediaStream | null>(null)
  const localScreenRef = useRef<MediaStream | null>(null)
  const recorderRef = useRef<MediaRecorder | null>(null)
  const audioCtxRef = useRef<AudioContext | null>(null)
  const recordStartRef = useRef<number>(0)

  const kind: 'user' | 'guest' = user ? 'user' : 'guest'
  const isHost = !!info?.isHost

  useEffect(() => {
    if (user) setDisplayName(user.full_name || user.email || 'Guest')
  }, [user])

  const loadRoom = useCallback(async (): Promise<void> => {
    try {
      const found = await getMeetingByCode(code)
      if (!found?.ok || !found.id) {
        setInfo(null)
        return
      }
      let hostUserId: string | null = null
      let startedAt: string | null = null
      let isHostMember = false
      if (user) {
        try {
          const client = await sb()
          const { data } = await client
            .from('meetings')
            .select('host_user_id, started_at')
            .eq('id', found.id)
            .maybeSingle()
          if (data) {
            hostUserId = data.host_user_id
            startedAt = data.started_at
            isHostMember = data.host_user_id === user.id
          }
        } catch {
          setLoadError(null)
        }
      }
      setInfo({ ...found, id: found.id, code: found.code ?? code, hostUserId, startedAt, isHost: isHostMember })
      setLoadError(null)
    } catch (err: unknown) {
      setLoadError(err instanceof Error ? err.message : 'Could not load the meeting.')
    }
  }, [code, user])

  useEffect(() => {
    if (user === undefined) return
    void loadRoom()
  }, [user, loadRoom])

  const status = info?.status
  const meetingOpen = status === 'scheduled' || status === 'live'

  useEffect(() => {
    if (!info || !meetingOpen) return
    const timer = setInterval(() => void loadRoom(), 4000)
    return () => clearInterval(timer)
  }, [info, meetingOpen, loadRoom])

  useEffect(() => {
    if (user) return
    setDisplayName((prev) => prev || 'Guest')
  }, [user])

  const enterCall = useCallback(async (): Promise<void> => {
    if (!info?.id || engineRef.current) return
    setBusy(true)
    setJoinError(null)
    try {
      const client = await sb()
      let sessionId: string | null = null
      try {
        const { data, error } = await client.rpc('active_call_session', {
          p_meeting_id: info.id
        })
        if (!error) sessionId = data as string | null
      } catch {
        sessionId = null
      }
      const local = localStreamRef.current
      if (!local) throw new Error('Camera and microphone are not ready.')

      const engine = new CallEngine({
        client,
        code,
        meetingId: info.id,
        sessionId,
        name: displayName.trim() || 'Guest',
        kind,
        userId: user?.id ?? null,
        isHost,
        lobbyEnabled: !!info.lobby_enabled,
        localStream: local,
        callbacks: {
          onPeers: setPeers,
          onSelf: setSelfState,
          onLobbyRequest: () => setPanel((current) => current ?? 'people'),
          onReaction: (reaction) => pushFloat(reaction.emoji),
          onError: (message) => toast.error(message)
        }
      })
      engineRef.current = engine
      await engine.start()
      setMode('joined')
      void listMeetingMessages(info.id)
        .then(setChat)
        .catch(() => setChat([]))
    } catch (err: unknown) {
      engineRef.current = null
      const message = err instanceof Error ? err.message : 'Could not join the call.'
      setJoinError(message)
      toast.error(message)
    } finally {
      setBusy(false)
    }
  }, [info, code, displayName, kind, user, isHost])

  useEffect(() => {
    if (mode === 'waiting' && info?.status === 'live') void enterCall()
  }, [mode, info?.status, enterCall])

  const setupDevices = useCallback(async (): Promise<void> => {
    if (localStreamRef.current) return
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true })
      localStreamRef.current = stream
      setLocalStream(stream)
      setPreviewTick((tick) => tick + 1)
      const list = await navigator.mediaDevices.enumerateDevices()
      setDevices(list)
      const video = stream.getVideoTracks()[0]
      const audio = stream.getAudioTracks()[0]
      const videoId = video ? video.getSettings().deviceId : undefined
      const audioId = audio ? audio.getSettings().deviceId : undefined
      if (videoId) setCamId(videoId)
      if (audioId) setMicId(audioId)
    } catch {
      setDeviceError('Camera and microphone access is needed to join with audio and video.')
    }
  }, [])

  useEffect(() => {
    void setupDevices()
    return () => {
      const engine = engineRef.current
      if (engine) void engine.leave()
      localStreamRef.current?.getTracks().forEach((track) => track.stop())
      localScreenRef.current?.getTracks().forEach((track) => track.stop())
      recorderRef.current?.state === 'recording' && recorderRef.current.stop()
      audioCtxRef.current?.close().catch(() => undefined)
    }
  }, [setupDevices])

  const switchDevice = useCallback(async (nextCam: string, nextMic: string): Promise<void> => {
    if (engineRef.current) return
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: nextCam ? { deviceId: { exact: nextCam } } : true,
        audio: nextMic ? { deviceId: { exact: nextMic } } : true
      })
      localStreamRef.current?.getTracks().forEach((track) => track.stop())
      localStreamRef.current = stream
      setLocalStream(stream)
      setPreviewTick((tick) => tick + 1)
    } catch {
      toast.error('Could not switch device.')
    }
  }, [])

  const handleJoin = async (): Promise<void> => {
    if (!info) return
    if (!displayName.trim()) {
      toast.error('Enter your name to join.')
      return
    }
    setBusy(true)
    try {
      if (info.status === 'scheduled') {
        if (isHost) {
          await setMeetingStatus(info.id, 'live')
          await loadRoom()
        } else {
          setMode('waiting')
          setBusy(false)
          return
        }
      }
      setBusy(false)
      await enterCall()
    } catch (err: unknown) {
      setBusy(false)
      toast.error(err instanceof Error ? err.message : 'Could not start the meeting.')
    }
  }

  const leaveCall = async (): Promise<void> => {
    setLeft(true)
    if (recorderRef.current && recorderRef.current.state !== 'inactive') {
      recorderRef.current.stop()
    }
    setRecording(false)
    const engine = engineRef.current
    engineRef.current = null
    localScreenRef.current?.getTracks().forEach((track) => track.stop())
    localScreenRef.current = null
    await engine?.leave()
    localStreamRef.current?.getTracks().forEach((track) => track.stop())
    localStreamRef.current = null
    navigate('/meetings')
  }

  useEffect(() => {
    if (!info) return
    if (info.status !== 'ended' && info.status !== 'cancelled') return
    const engine = engineRef.current
    if (engine) {
      engineRef.current = null
      if (recorderRef.current && recorderRef.current.state !== 'inactive') {
        recorderRef.current.stop()
      }
      setRecording(false)
      void engine.leave()
      localStreamRef.current?.getTracks().forEach((track) => track.stop())
      localStreamRef.current = null
    }
  }, [info])

  useEffect(() => {
    if (mode !== 'joined' || !info?.id) return
    return watchMeetingMessages(info.id, (message) => {
      setChat((prev) => {
        if (prev?.some((row) => row.id === message.id)) return prev
        return [...(prev ?? []), message]
      })
    })
  }, [mode, info?.id])

  useEffect(() => {
    if (panel === 'chat') setSeenChat((chat ?? []).length)
  }, [panel, chat])

  const pushFloat = (emoji: string): void => {
    const id = Date.now() + Math.random()
    setFloats((prev) => [...prev, { id, emoji }])
    setTimeout(() => setFloats((prev) => prev.filter((item) => item.id !== id)), 2400)
  }

  const react = (emoji: string): void => {
    pushFloat(emoji)
    engineRef.current?.sendReaction(emoji)
  }

  const toggleMic = (): void => {
    const next = !micOn
    setMicOn(next)
    const track = localStreamRef.current?.getAudioTracks()[0]
    if (track) track.enabled = next
    engineRef.current?.setMic(next)
  }

  const toggleCam = (): void => {
    const next = !camOn
    setCamOn(next)
    const track = localStreamRef.current?.getVideoTracks()[0]
    if (track) track.enabled = next
    engineRef.current?.setCam(next)
  }

  const toggleScreen = async (): Promise<void> => {
    const engine = engineRef.current
    if (!engine) return
    if (screenActive) {
      engine.stopScreen()
      localScreenRef.current?.getTracks().forEach((track) => track.stop())
      localScreenRef.current = null
      setScreenActive(false)
      return
    }
    try {
      const stream = await navigator.mediaDevices.getDisplayMedia({ video: true, audio: true })
      localScreenRef.current = stream
      await engine.startScreen(stream)
      setScreenActive(true)
      const track = stream.getVideoTracks()[0]
      track?.addEventListener('ended', () => {
        engine.stopScreen()
        localScreenRef.current = null
        setScreenActive(false)
      })
    } catch {
      // picker dismissed
    }
  }

  const buildRecordingStream = (): MediaStream | null => {
    const local = localStreamRef.current
    if (!local) return null
    try {
      const ctx = new AudioContext()
      audioCtxRef.current = ctx
      const dest = ctx.createMediaStreamDestination()
      const sources: Array<MediaStream | null> = [
        local,
        ...peers.map((peer) => peer.stream)
      ]
      for (const source of sources) {
        if (source && source.getAudioTracks().length > 0) {
          try {
            ctx.createMediaStreamSource(source).connect(dest)
          } catch {
            // stream without usable audio
          }
        }
      }
      const videoTracks = localScreenRef.current
        ? localScreenRef.current.getVideoTracks()
        : local.getVideoTracks()
      return new MediaStream([...videoTracks, ...dest.stream.getAudioTracks()])
    } catch {
      return null
    }
  }

  const startRecording = (): void => {
    if (recorderRef.current && recorderRef.current.state !== 'inactive') return
    const stream = buildRecordingStream()
    if (!stream) {
      toast.error('Recording is not available right now.')
      return
    }
    const mimeType = ['video/webm;codecs=vp9,opus', 'video/webm;codecs=vp8,opus', 'video/webm'].find(
      (type) => MediaRecorder.isTypeSupported(type)
    )
    let recorder: MediaRecorder
    try {
      recorder = mimeType ? new MediaRecorder(stream, { mimeType }) : new MediaRecorder(stream)
    } catch {
      toast.error('Recording is not supported on this system.')
      return
    }
    const chunks: Blob[] = []
    recorder.ondataavailable = (event) => {
      if (event.data.size > 0) chunks.push(event.data)
    }
    recorder.onstop = () => {
      const blob = new Blob(chunks, { type: 'video/webm' })
      const url = URL.createObjectURL(blob)
      const anchor = document.createElement('a')
      const stamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19)
      const label = (info?.title ?? 'meeting').replace(/[^\w-]+/g, '-').slice(0, 40) || 'meeting'
      anchor.href = url
      anchor.download = `ClientRegit-${label}-${stamp}.webm`
      document.body.appendChild(anchor)
      anchor.click()
      anchor.remove()
      setTimeout(() => URL.revokeObjectURL(url), 30000)
      audioCtxRef.current?.close().catch(() => undefined)
      audioCtxRef.current = null
      toast.success('Recording saved to your downloads folder.')
    }
    recorder.start(1000)
    recorderRef.current = recorder
    recordStartRef.current = Date.now()
    setRecordSeconds(0)
    setRecording(true)
  }

  const stopRecording = (): void => {
    const recorder = recorderRef.current
    if (recorder && recorder.state !== 'inactive') recorder.stop()
    setRecording(false)
  }

  useEffect(() => {
    if (!recording) return
    const timer = setInterval(() => {
      setRecordSeconds(Math.floor((Date.now() - recordStartRef.current) / 1000))
    }, 1000)
    return () => clearInterval(timer)
  }, [recording])

  const sendChat = async (): Promise<void> => {
    const body = chatDraft.trim()
    if (!body || !info?.id) return
    setChatDraft('')
    try {
      await sendMeetingMessage(info.id, {
        senderId: user?.id ?? engineRef.current?.getSelfPeerId() ?? 'guest',
        senderName: displayName.trim() || 'Guest',
        body,
        kind
      })
    } catch (err: unknown) {
      setChatDraft(body)
      toast.error(err instanceof Error ? err.message : 'Message failed.')
    }
  }

  const waitingGuests = peers.filter((peer) => !peer.admitted && peer.kind === 'guest')
  const visiblePeers = peers.filter((peer) => peer.admitted || isHost)
  const screenPeer = visiblePeers.find((peer) => peer.screenOn && peer.screenStream)
  const stageStream = localScreenRef.current ?? screenPeer?.screenStream ?? null

  const gridClass = useMemo(() => {
    const count = visiblePeers.length + 1
    if (count <= 1) return 'grid-cols-1'
    if (count === 2) return 'grid-cols-2'
    if (count <= 4) return 'grid-cols-2 lg:grid-cols-2'
    return 'grid-cols-2 lg:grid-cols-3'
  }, [visiblePeers.length])

  if (user === undefined || info === undefined) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-canvas text-sm text-muted">
        Loading meeting…
      </div>
    )
  }

  if (left) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-canvas p-6 text-center">
        <Icon name="check" size={28} className="text-success" />
        <p className="text-sm font-semibold">You left the call.</p>
        <Button variant="primary" onClick={() => navigate('/meetings')}>
          Back to meetings
        </Button>
      </div>
    )
  }

  if (loadError) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-canvas p-6 text-center">
        <Icon name="alert" size={28} className="text-danger" />
        <p className="max-w-sm text-sm text-muted">{loadError}</p>
        <Button variant="secondary" onClick={() => void loadRoom()}>
          Try again
        </Button>
      </div>
    )
  }

  if (!info) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-canvas p-6 text-center">
        <Icon name="video-off" size={28} className="text-muted" />
        <p className="text-sm font-semibold">Meeting not found</p>
        <p className="max-w-sm text-xs text-muted">
          Check the meeting code {code ? `“${code}”` : ''} and try again.
        </p>
        <Button variant="secondary" onClick={() => navigate('/meetings')}>
          Back to meetings
        </Button>
      </div>
    )
  }

  if (info.status === 'ended' || info.status === 'cancelled') {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-canvas p-6 text-center">
        <Icon name="phone-off" size={28} className="text-muted" />
        <p className="text-sm font-semibold">
          {info.status === 'cancelled' ? 'This meeting was cancelled.' : 'This meeting has ended.'}
        </p>
        <p className="text-xs text-muted">{info.title}</p>
        <Button variant="secondary" onClick={() => navigate('/meetings')}>
          Back to meetings
        </Button>
      </div>
    )
  }

  if (mode === 'waiting') {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-canvas p-6 text-center">
        <span className="h-10 w-10 animate-soft-pulse rounded-full bg-gold/20 text-gold">
          <Icon name="clock" size={22} className="mx-auto mt-2" />
        </span>
        <p className="text-sm font-semibold">Waiting for the host to start the meeting…</p>
        <p className="text-xs text-muted">
          {info.title}
          {info.scheduled_at ? ` · ${shortWhen(info.scheduled_at)}` : ''}
        </p>
        <p className="text-[11px] text-muted">This screen refreshes automatically.</p>
        <Button variant="secondary" onClick={() => navigate('/meetings')}>
          Leave
        </Button>
      </div>
    )
  }

  if (mode === 'idle' || deviceError) {
    const scheduled = info.status === 'scheduled'
    return (
      <div className="flex min-h-screen flex-col bg-canvas">
        <header className="flex items-center gap-3 border-b border-line bg-surface px-5 py-3">
          <button
            className="cursor-pointer rounded-md p-1.5 text-muted transition-colors hover:bg-surface-2 hover:text-ink"
            onClick={() => navigate('/meetings')}
            title="Back"
          >
            <Icon name="arrow-left" size={18} />
          </button>
          <div className="min-w-0 flex-1">
            <div className="truncate text-sm font-semibold">{info.title}</div>
            <div className="text-xs text-muted">
              {scheduled ? `Starts ${shortWhen(info.scheduled_at)}` : 'Meeting is live'}
              {info.lobby_enabled ? ' · waiting room on' : ''}
            </div>
          </div>
          <Badge tone={scheduled ? 'info' : 'danger'}>{info.status}</Badge>
        </header>

        <main className="mx-auto grid w-full max-w-5xl flex-1 grid-cols-1 gap-6 px-6 py-8 lg:grid-cols-2">
          <div className="relative aspect-video overflow-hidden rounded-xl border border-line bg-black">
            {deviceError ? (
              <div className="flex h-full flex-col items-center justify-center gap-3 p-6 text-center">
                <Icon name="video-off" size={26} className="text-white/70" />
                <p className="max-w-xs text-sm text-white/80">{deviceError}</p>
                <Button variant="secondary" size="sm" onClick={() => { setDeviceError(null); localStreamRef.current = null; void setupDevices() }}>
                  Try again
                </Button>
              </div>
            ) : (
              <VideoSurface
                key={previewTick}
                stream={localStream}
                mirrored
                mutedSelf
                showMedia={camOn}
              />
            )}
            <div className="absolute bottom-3 left-3 flex gap-2">
              <button
                onClick={toggleMic}
                className={`cursor-pointer rounded-full p-2.5 transition-colors ${micOn ? 'bg-white/15 text-white hover:bg-white/25' : 'bg-danger text-white'}`}
                title={micOn ? 'Mute microphone' : 'Unmute microphone'}
              >
                <Icon name={micOn ? 'mic' : 'mic-off'} size={16} />
              </button>
              <button
                onClick={toggleCam}
                className={`cursor-pointer rounded-full p-2.5 transition-colors ${camOn ? 'bg-white/15 text-white hover:bg-white/25' : 'bg-danger text-white'}`}
                title={camOn ? 'Turn camera off' : 'Turn camera on'}
              >
                <Icon name={camOn ? 'video' : 'video-off'} size={16} />
              </button>
            </div>
          </div>

          <div className="space-y-4">
            <h1 className="text-lg font-semibold">Ready to join?</h1>
            <Field label={kind === 'guest' ? 'Your name' : 'Joining as'}>
              {kind === 'guest' ? (
                <Input
                  value={displayName}
                  onChange={(event) => setDisplayName(event.target.value)}
                  placeholder="Enter your name"
                  maxLength={60}
                />
              ) : (
                <div className="rounded-lg border border-line bg-surface px-3 py-2 text-sm">
                  {displayName || user?.email || 'You'}
                </div>
              )}
            </Field>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <Field label="Camera">
                <Select
                  value={camId}
                  onChange={(event) => {
                    setCamId(event.target.value)
                    void switchDevice(event.target.value, micId)
                  }}
                >
                  {devices.filter((d) => d.kind === 'videoinput').map((device) => (
                    <option key={device.deviceId} value={device.deviceId}>
                      {device.label || `Camera ${device.deviceId.slice(0, 4)}`}
                    </option>
                  ))}
                  {devices.filter((d) => d.kind === 'videoinput').length === 0 && (
                    <option value="">Default</option>
                  )}
                </Select>
              </Field>
              <Field label="Microphone">
                <Select
                  value={micId}
                  onChange={(event) => {
                    setMicId(event.target.value)
                    void switchDevice(camId, event.target.value)
                  }}
                >
                  {devices.filter((d) => d.kind === 'audioinput').map((device) => (
                    <option key={device.deviceId} value={device.deviceId}>
                      {device.label || `Microphone ${device.deviceId.slice(0, 4)}`}
                    </option>
                  ))}
                  {devices.filter((d) => d.kind === 'audioinput').length === 0 && (
                    <option value="">Default</option>
                  )}
                </Select>
              </Field>
            </div>
            {joinError && <p className="text-xs text-danger">{joinError}</p>}
            <div className="flex flex-wrap gap-2">
              <Button
                variant="primary"
                size="md"
                disabled={busy || !!deviceError}
                icon={<Icon name="video" size={16} />}
                onClick={() => void handleJoin()}
              >
                {busy
                  ? 'Joining…'
                  : scheduled && isHost
                    ? 'Start & join'
                    : scheduled
                      ? 'Join'
                      : 'Join now'}
              </Button>
              <Button variant="secondary" size="md" onClick={() => navigate('/meetings')}>
                Cancel
              </Button>
            </div>
            {scheduled && !isHost && (
              <p className="text-xs text-muted">
                The host has not started this meeting yet — you will wait once you join.
              </p>
            )}
            {info.lobby_enabled && (
              <p className="text-xs text-muted">
                This meeting has a waiting room. The host will let you in.
              </p>
            )}
          </div>
        </main>
      </div>
    )
  }

  const inLobby = !!selfState?.waitingInLobby
  const denied = !!selfState?.denied

  if (denied) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-canvas p-6 text-center">
        <Icon name="x" size={28} className="text-danger" />
        <p className="text-sm font-semibold">The host did not admit you to this meeting.</p>
        <Button variant="secondary" onClick={() => void leaveCall()}>
          Leave
        </Button>
      </div>
    )
  }

  const tileStream = (peer: CallPeerState): MediaStream | null =>
    peer.screenOn && peer.screenStream ? peer.screenStream : peer.stream

  return (
    <div className="flex h-screen flex-col bg-canvas text-ink">
      <header className="flex items-center gap-3 border-b border-line bg-surface px-4 py-2.5">
        <Icon name="video" size={16} className="text-gold" />
        <div className="min-w-0 flex-1">
          <div className="truncate text-sm font-semibold">{info.title}</div>
          <div className="text-[11px] text-muted">Code {info.code}</div>
        </div>
        {recording && (
          <span className="flex items-center gap-1.5 rounded-full bg-danger-bg px-2.5 py-1 text-[11px] font-semibold text-danger">
            <span className="h-2 w-2 rounded-full bg-danger animate-soft-pulse" />
            REC {Math.floor(recordSeconds / 60)}:{String(recordSeconds % 60).padStart(2, '0')}
          </span>
        )}
        <Badge tone="danger">live</Badge>
        <Button
          size="sm"
          variant="ghost"
          icon={<Icon name="copy" size={14} />}
          onClick={() => {
            void navigator.clipboard
              .writeText(`${__SITE_URL__}/#/join/${info.code}`)
              .then(() => toast.success('Invite link copied.'))
              .catch(() => toast.error('Could not copy link.'))
          }}
        >
          Copy link
        </Button>
        {isHost && (
          <Button size="sm" variant="secondary" onClick={() => setEndConfirm(true)}>
            End meeting
          </Button>
        )}
      </header>

      <div className="flex min-h-0 flex-1">
        <main className="flex min-w-0 flex-1 flex-col gap-3 p-4">
          <div className="relative min-h-0 flex-1 rounded-xl border border-line bg-black/90">
            {stageStream ? (
              <VideoSurface stream={stageStream} showMedia />
            ) : (
              <div className="flex h-full items-center justify-center text-xs text-white/40">
                {visiblePeers.length === 0
                  ? 'Waiting for others to join…'
                  : 'No screen share — camera view below'}
              </div>
            )}
            {stageStream && (
              <div className="absolute bottom-2 left-2 rounded bg-black/60 px-2 py-1 text-[11px] text-white">
                {localScreenRef.current ? 'Your screen' : screenPeer?.name ?? 'Screen'}
              </div>
            )}
            <div className="pointer-events-none absolute right-2 top-2 flex flex-col items-end gap-1">
              {floats.map((float) => (
                <span
                  key={float.id}
                  className="animate-reaction text-4xl drop-shadow"
                >
                  {float.emoji}
                </span>
              ))}
            </div>
          </div>

          <div className={`grid shrink-0 gap-3 ${gridClass}`}>
            <div className="relative aspect-video overflow-hidden rounded-lg border border-line bg-black">
              <VideoSurface key="self" stream={localStream} mirrored mutedSelf showMedia={camOn} />
              <div className="absolute bottom-2 left-2 flex items-center gap-1.5 rounded bg-black/60 px-2 py-1 text-[11px] text-white">
                {displayName || 'You'} (you)
                {!micOn && <Icon name="mic-off" size={12} />}
              </div>
            </div>
            {visiblePeers.map((peer) => (
              <div key={peer.peerId} className="relative aspect-video overflow-hidden rounded-lg border border-line bg-black">
                <VideoSurface
                  stream={tileStream(peer)}
                  showMedia={peer.camOn || peer.screenOn}
                />
                <div className="absolute bottom-2 left-2 flex items-center gap-1.5 rounded bg-black/60 px-2 py-1 text-[11px] text-white">
                  <span className="max-w-28 truncate">{peer.name}</span>
                  {peer.isHost && <span className="text-gold">host</span>}
                  {!peer.micOn && <Icon name="mic-off" size={12} />}
                  {peer.connectionState !== 'connected' && peer.connectionState !== 'connecting' && (
                    <span className="text-danger">{peer.connectionState}</span>
                  )}
                </div>
              </div>
            ))}
          </div>

          <footer className="flex flex-wrap items-center justify-center gap-2">
            <CtrlButton
              icon={micOn ? 'mic' : 'mic-off'}
              label={micOn ? 'Mute' : 'Unmute'}
              active={micOn}
              danger={!micOn}
              onClick={toggleMic}
            />
            <CtrlButton
              icon={camOn ? 'video' : 'video-off'}
              label={camOn ? 'Stop video' : 'Start video'}
              active={camOn}
              danger={!camOn}
              onClick={toggleCam}
            />
            <CtrlButton
              icon="monitor"
              label={screenActive ? 'Stop share' : 'Share'}
              active={screenActive}
              onClick={() => void toggleScreen()}
            />
            <CtrlButton
              icon="record"
              label={recording ? 'Stop rec' : 'Record'}
              active={recording}
              danger={recording}
              onClick={() => (recording ? stopRecording() : startRecording())}
            />
            <CtrlButton
              icon="message"
              label="Chat"
              active={panel === 'chat'}
              badge={panel === 'chat' ? 0 : Math.max(0, (chat?.length ?? 0) - seenChat)}
              onClick={() => setPanel((current) => (current === 'chat' ? null : 'chat'))}
            />
            <CtrlButton
              icon="users"
              label="People"
              active={panel === 'people'}
              badge={waitingGuests.length && isHost ? waitingGuests.length : undefined}
              onClick={() => setPanel((current) => (current === 'people' ? null : 'people'))}
            />
            <CtrlButton
              icon="smile"
              label="React"
              active={reactionBar}
              onClick={() => setReactionBar((open) => !open)}
            />
            <button
              onClick={() => void leaveCall()}
              className="ml-2 inline-flex cursor-pointer items-center gap-2 rounded-lg bg-danger px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:opacity-90"
            >
              <Icon name="phone-off" size={16} />
              Leave
            </button>
          </footer>

          {reactionBar && (
            <div className="flex items-center justify-center gap-2">
              {REACTIONS.map((emoji) => (
                <button
                  key={emoji}
                  onClick={() => react(emoji)}
                  className="cursor-pointer rounded-lg border border-line bg-surface px-3 py-1.5 text-xl transition-transform hover:scale-110"
                >
                  {emoji}
                </button>
              ))}
            </div>
          )}
        </main>

        {panel && (
          <aside className="flex w-80 shrink-0 flex-col border-l border-line bg-surface">
            <div className="flex items-center justify-between border-b border-line px-4 py-3">
              <span className="text-sm font-semibold">{panel === 'chat' ? 'In-call chat' : 'People'}</span>
              <button
                className="cursor-pointer rounded-md p-1 text-muted hover:bg-surface-2 hover:text-ink"
                onClick={() => setPanel(null)}
              >
                <Icon name="x" size={16} />
              </button>
            </div>

            {panel === 'chat' ? (
              <>
                <div className="flex-1 space-y-3 overflow-y-auto px-4 py-3">
                  {chat === null ? (
                    <p className="py-8 text-center text-xs text-muted">Loading chat…</p>
                  ) : chat.length === 0 ? (
                    <p className="py-8 text-center text-xs text-muted">No messages yet.</p>
                  ) : (
                    chat.map((message) => (
                      <div key={message.id}>
                        <div className="flex items-baseline gap-2">
                          <span className="text-[11px] font-semibold">{message.sender_name}</span>
                          <span className="text-[10px] text-muted">
                            {new Date(message.created_at).toLocaleTimeString('en-GB', {
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </span>
                        </div>
                        <p className="whitespace-pre-wrap break-words text-sm">{message.body}</p>
                      </div>
                    ))
                  )}
                </div>
                <div className="flex items-center gap-2 border-t border-line px-3 py-3">
                  <Input
                    placeholder="Message everyone"
                    value={chatDraft}
                    onChange={(event) => setChatDraft(event.target.value)}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter' && !event.shiftKey) {
                        event.preventDefault()
                        void sendChat()
                      }
                    }}
                  />
                  <Button
                    variant="primary"
                    size="sm"
                    disabled={!chatDraft.trim()}
                    onClick={() => void sendChat()}
                    icon={<Icon name="send" size={14} />}
                  />
                </div>
              </>
            ) : (
              <div className="flex-1 overflow-y-auto px-3 py-3">
                {isHost && waitingGuests.length > 0 && (
                  <div className="mb-3 rounded-lg border border-gold/50 bg-gold/10 p-3">
                    <div className="mb-2 text-xs font-semibold text-gold-strong dark:text-gold">
                      Waiting room ({waitingGuests.length})
                    </div>
                    <div className="space-y-2">
                      {waitingGuests.map((peer) => (
                        <div key={peer.peerId} className="flex items-center gap-2 text-sm">
                          <span className="min-w-0 flex-1 truncate">{peer.name}</span>
                          <Button
                            size="sm"
                            variant="primary"
                            onClick={() => engineRef.current?.admit(peer.peerId)}
                          >
                            Admit
                          </Button>
                          <Button
                            size="sm"
                            variant="secondary"
                            onClick={() => engineRef.current?.deny(peer.peerId)}
                          >
                            Deny
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                <div className="space-y-1">
                  <div className="flex items-center gap-2 rounded-lg px-2 py-2 text-sm">
                    <span className="flex h-7 w-7 items-center justify-center rounded-full bg-gold/15 text-xs font-semibold text-gold-strong dark:text-gold">
                      {(displayName || 'Y').charAt(0).toUpperCase()}
                    </span>
                    <span className="min-w-0 flex-1 truncate">{displayName || 'You'} (you)</span>
                    {isHost && <Badge tone="gold">host</Badge>}
                  </div>
                  {visiblePeers.map((peer) => (
                    <div key={peer.peerId} className="flex items-center gap-2 rounded-lg px-2 py-2 text-sm">
                      <span className="flex h-7 w-7 items-center justify-center rounded-full bg-surface-2 text-xs font-semibold uppercase text-muted">
                        {peer.name.charAt(0).toUpperCase()}
                      </span>
                      <span className="min-w-0 flex-1 truncate">{peer.name}</span>
                      {peer.isHost && <Badge tone="gold">host</Badge>}
                      {peer.kind === 'guest' && <Badge tone="teal">guest</Badge>}
                      {!peer.micOn && <Icon name="mic-off" size={14} className="text-muted" />}
                    </div>
                  ))}
                  {visiblePeers.length === 0 && (
                    <p className="px-2 py-4 text-xs text-muted">
                      You are the only one here. Share the link to invite others.
                    </p>
                  )}
                </div>
              </div>
            )}
          </aside>
        )}
      </div>

      {inLobby && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/70 p-6">
          <div className="animate-fade-in w-full max-w-sm rounded-xl border border-line bg-surface p-6 text-center">
            <span className="mx-auto mb-3 flex h-11 w-11 items-center justify-center rounded-full bg-gold/15 text-gold">
              <Icon name="clock" size={22} />
            </span>
            <p className="text-sm font-semibold">You are in the waiting room</p>
            <p className="mt-1 text-xs text-muted">
              {info.host_name ? `${info.host_name} will let you in shortly.` : 'The host will let you in shortly.'}
            </p>
            <div className="mt-4 flex justify-center gap-2">
              <Button variant="secondary" size="sm" onClick={() => void leaveCall()}>
                Leave
              </Button>
            </div>
          </div>
        </div>
      )}

      <ConfirmDialog
        open={endConfirm}
        title="End meeting for everyone?"
        message="The call will close for all participants and the meeting will be marked as ended."
        confirmLabel="End meeting"
        danger
        onConfirm={() => {
          setEndConfirm(false)
          if (!info) return
          void setMeetingStatus(info.id, 'ended')
            .then(() => {
              void loadRoom()
            })
            .catch((err: unknown) => toast.error(String(err)))
        }}
        onClose={() => setEndConfirm(false)}
      />
    </div>
  )
}

function CtrlButton({
  icon,
  label,
  active,
  danger,
  badge,
  onClick
}: {
  icon: IconName
  label: string
  active?: boolean
  danger?: boolean
  badge?: number
  onClick: () => void
}): ReactNode {
  return (
    <button
      onClick={onClick}
      title={label}
      className={`relative inline-flex cursor-pointer items-center gap-2 rounded-lg border px-3 py-2 text-xs font-semibold transition-colors ${
        danger
          ? 'border-danger bg-danger text-white'
          : active
            ? 'border-gold bg-gold/15 text-gold-strong dark:text-gold'
            : 'border-line bg-surface text-muted hover:border-gold hover:text-ink'
      }`}
    >
      <Icon name={icon} size={15} />
      {label}
      {badge !== undefined && badge > 0 && (
        <span className="absolute -right-1.5 -top-1.5 rounded-full bg-gold px-1 text-[9px] font-bold leading-4 text-white">
          {badge > 9 ? '9+' : badge}
        </span>
      )}
    </button>
  )
}
