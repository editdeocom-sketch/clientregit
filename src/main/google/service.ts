import { app, safeStorage, shell } from 'electron'
import { randomBytes, createHash } from 'node:crypto'
import { createServer, type Server } from 'node:http'
import { existsSync, mkdirSync, readFileSync, writeFileSync, rmSync } from 'node:fs'
import { join } from 'node:path'
import type { GoogleAccountInfo, GoogleCreatedMeeting, GoogleMeeting } from '../../shared/types'

const CLIENT_ID = (): string => __GOOGLE_CLIENT_ID__
const CLIENT_SECRET = (): string => __GOOGLE_CLIENT_SECRET__

const SCOPES = [
  'openid',
  'email',
  'profile',
  'https://www.googleapis.com/auth/calendar.events'
].join(' ')

const AUTH_URL = 'https://accounts.google.com/o/oauth2/v2/auth'
const TOKEN_URL = 'https://oauth2.googleapis.com/token'
const REVOKE_URL = 'https://oauth2.googleapis.com/revoke'
const CALENDAR_API = 'https://www.googleapis.com/calendar/v3'

const LINK_TIMEOUT_MS = 5 * 60_000

interface TokenSet {
  access_token: string
  refresh_token: string | null
  expires_at: number
  email: string
  name: string | null
  picture: string | null
}

interface PendingLink {
  server: Server
  verifier: string
  state: string
  resolve: (info: GoogleAccountInfo) => void
  reject: (err: Error) => void
  timer: NodeJS.Timeout
}

let pending: PendingLink | null = null
let cached: TokenSet | null = null
let cacheLoaded = false

function requireConfigured(): void {
  if (!CLIENT_ID() || !CLIENT_SECRET()) {
    throw new Error(
      'Google integration is not configured. Add GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET to .env, then rebuild.'
    )
  }
}

function tokenPath(): string {
  return join(app.getPath('userData'), 'google-account.bin')
}

function loadTokens(): TokenSet | null {
  if (cacheLoaded) return cached
  cacheLoaded = true
  try {
    const file = tokenPath()
    if (!existsSync(file)) return null
    const wrapper = JSON.parse(readFileSync(file, 'utf8')) as {
      v: number
      enc: boolean
      data: string
    }
    const json = wrapper.enc ? safeStorage.decryptString(Buffer.from(wrapper.data, 'base64')) : wrapper.data
    const parsed = JSON.parse(json) as TokenSet
    if (!parsed.access_token) return null
    cached = parsed
    return cached
  } catch {
    cached = null
    return null
  }
}

function saveTokens(tokens: TokenSet): void {
  cached = tokens
  cacheLoaded = true
  const json = JSON.stringify(tokens)
  const dir = app.getPath('userData')
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true })
  let wrapper: { v: number; enc: boolean; data: string }
  if (safeStorage.isEncryptionAvailable()) {
    wrapper = { v: 1, enc: true, data: safeStorage.encryptString(json).toString('base64') }
  } else {
    wrapper = { v: 1, enc: false, data: json }
  }
  writeFileSync(tokenPath(), JSON.stringify(wrapper))
}

function clearTokens(): void {
  cached = null
  cacheLoaded = true
  try {
    rmSync(tokenPath(), { force: true })
  } catch {
    // best effort
  }
}

function toInfo(tokens: TokenSet): GoogleAccountInfo {
  return { email: tokens.email, name: tokens.name, picture: tokens.picture }
}

function parseIdToken(idToken: string): { email: string; name: string | null; picture: string | null } {
  const part = idToken.split('.')[1]
  const payload = JSON.parse(Buffer.from(part, 'base64url').toString('utf8')) as Record<string, unknown>
  return {
    email: String(payload.email ?? ''),
    name: typeof payload.name === 'string' ? payload.name : null,
    picture: typeof payload.picture === 'string' ? payload.picture : null
  }
}

function base64Url(buf: Buffer): string {
  return buf.toString('base64url')
}

async function refreshTokens(tokens: TokenSet): Promise<TokenSet> {
  if (!tokens.refresh_token) throw new Error('Google session expired. Link your account again.')
  const body = new URLSearchParams({
    client_id: CLIENT_ID(),
    client_secret: CLIENT_SECRET(),
    refresh_token: tokens.refresh_token,
    grant_type: 'refresh_token'
  })
  const res = await fetch(TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body
  })
  const data = (await res.json()) as Record<string, unknown>
  if (!res.ok) {
    if (data.error === 'invalid_grant') {
      clearTokens()
      throw new Error('Google access was revoked. Link your account again.')
    }
    throw new Error(`Google token refresh failed (${String(data.error ?? res.status)}).`)
  }
  const next: TokenSet = {
    ...tokens,
    access_token: String(data.access_token),
    expires_at: Date.now() + Number(data.expires_in ?? 3600) * 1000
  }
  saveTokens(next)
  return next
}

async function validTokens(): Promise<TokenSet> {
  const tokens = loadTokens()
  if (!tokens) throw new Error('Link your Google account first.')
  if (tokens.expires_at - Date.now() > 60_000) return tokens
  return refreshTokens(tokens)
}

function cleanupPending(): void {
  if (!pending) return
  clearTimeout(pending.timer)
  pending.server.close()
  pending = null
}

function respond(res: import('node:http').ServerResponse, status: number, html: string): void {
  res.writeHead(status, { 'Content-Type': 'text/html; charset=utf-8' })
  res.end(`<!doctype html><html><head><meta charset="utf-8"><title>ClientRegit</title></head>
<body style="font-family:system-ui,sans-serif;background:#FCFCF7;color:#1c1917;display:flex;align-items:center;justify-content:center;height:100vh;margin:0">
<div style="text-align:center;max-width:420px;padding:24px">
<h1 style="font-size:20px;margin:0 0 8px">ClientRegit</h1>
<p style="font-size:14px;line-height:1.6;margin:0">${html}</p>
</div></body></html>`)
}

export function googleConfigured(): boolean {
  return Boolean(CLIENT_ID() && CLIENT_SECRET())
}

export async function googleStatus(): Promise<GoogleAccountInfo | null> {
  if (!googleConfigured()) return null
  const tokens = loadTokens()
  if (!tokens) return null
  if (tokens.expires_at - Date.now() > 60_000) return toInfo(tokens)
  try {
    const refreshed = await refreshTokens(tokens)
    return toInfo(refreshed)
  } catch {
    return null
  }
}

export function googleLink(): Promise<GoogleAccountInfo> {
  requireConfigured()
  if (pending) throw new Error('A Google sign-in is already in progress.')
  const verifier = base64Url(randomBytes(32))
  const challenge = base64Url(createHash('sha256').update(verifier).digest())
  const state = base64Url(randomBytes(16))

  return new Promise<GoogleAccountInfo>((resolve, reject) => {
    const server = createServer((req, res) => {
      const url = new URL(req.url ?? '/', 'http://127.0.0.1')
      if (url.pathname !== '/callback') {
        respond(res, 404, 'Not found.')
        return
      }
      const err = url.searchParams.get('error')
      const code = url.searchParams.get('code')
      const returnedState = url.searchParams.get('state')
      if (err || !code || returnedState !== state) {
        respond(res, 400, 'Sign-in was cancelled or failed. You can close this tab.')
        const rejectNow = pending?.reject
        cleanupPending()
        rejectNow?.(new Error(err ? `Google sign-in failed: ${err}` : 'Google sign-in failed.'))
        return
      }

      void (async () => {
        try {
          const body = new URLSearchParams({
            code,
            client_id: CLIENT_ID(),
            client_secret: CLIENT_SECRET(),
            redirect_uri: `http://127.0.0.1:${server.address() instanceof Object ? String((server.address() as { port: number }).port) : ''}/callback`,
            grant_type: 'authorization_code',
            code_verifier: verifier
          })
          const tokenRes = await fetch(TOKEN_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body
          })
          const data = (await tokenRes.json()) as Record<string, unknown>
          if (!tokenRes.ok || !data.access_token) {
            throw new Error(`Google token exchange failed (${String(data.error ?? tokenRes.status)}).`)
          }
          const identity = parseIdToken(String(data.id_token ?? ''))
          const tokens: TokenSet = {
            access_token: String(data.access_token),
            refresh_token: typeof data.refresh_token === 'string' ? data.refresh_token : loadTokens()?.refresh_token ?? null,
            expires_at: Date.now() + Number(data.expires_in ?? 3600) * 1000,
            email: identity.email,
            name: identity.name,
            picture: identity.picture
          }
          saveTokens(tokens)
          respond(res, 200, `Linked <strong>${identity.email}</strong>. You can close this tab and return to ClientRegit.`)
          const resolveNow = pending?.resolve
          cleanupPending()
          resolveNow?.(toInfo(tokens))
        } catch (e) {
          respond(res, 500, 'Something went wrong. You can close this tab and try again in ClientRegit.')
          const rejectNow = pending?.reject
          cleanupPending()
          rejectNow?.(e instanceof Error ? e : new Error(String(e)))
        }
      })()
    })

    server.listen(0, '127.0.0.1', () => {
      const address = server.address()
      const port = address && typeof address === 'object' ? address.port : 0
      const redirectUri = `http://127.0.0.1:${port}/callback`
      const authUrl = new URL(AUTH_URL)
      authUrl.searchParams.set('client_id', CLIENT_ID())
      authUrl.searchParams.set('redirect_uri', redirectUri)
      authUrl.searchParams.set('response_type', 'code')
      authUrl.searchParams.set('scope', SCOPES)
      authUrl.searchParams.set('state', state)
      authUrl.searchParams.set('code_challenge', challenge)
      authUrl.searchParams.set('code_challenge_method', 'S256')
      authUrl.searchParams.set('access_type', 'offline')
      authUrl.searchParams.set('prompt', 'consent')

      pending = {
        server,
        verifier,
        state,
        resolve,
        reject,
        timer: setTimeout(() => {
          reject(new Error('Google sign-in timed out. Try again.'))
          cleanupPending()
        }, LINK_TIMEOUT_MS)
      }
      void shell.openExternal(authUrl.toString())
    })

    server.on('error', (e) => {
      cleanupPending()
      reject(e instanceof Error ? e : new Error(String(e)))
    })
  })
}

export async function googleUnlink(): Promise<void> {
  const tokens = loadTokens()
  if (tokens?.refresh_token) {
    try {
      await fetch(REVOKE_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({ token: tokens.refresh_token })
      })
    } catch {
      // best effort
    }
  }
  clearTokens()
}

export async function googleCreateMeeting(input: {
  title: string
  durationMin?: number
}): Promise<GoogleCreatedMeeting> {
  requireConfigured()
  const tokens = await validTokens()
  const duration = Math.min(Math.max(input.durationMin ?? 30, 15), 480)
  const start = new Date()
  const end = new Date(start.getTime() + duration * 60_000)
  const title = input.title.trim() || 'ClientRegit Meeting'

  const res = await fetch(`${CALENDAR_API}/calendars/primary/events?conferenceDataVersion=1`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${tokens.access_token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      summary: title,
      start: { dateTime: start.toISOString() },
      end: { dateTime: end.toISOString() },
      conferenceData: {
        createRequest: {
          requestId: randomBytes(8).toString('hex'),
          conferenceSolutionKey: { type: 'hangoutsMeet' }
        }
      }
    })
  })
  const data = (await res.json()) as Record<string, unknown>
  if (!res.ok) {
    const reason = (data.error as { message?: string } | undefined)?.message
    throw new Error(reason ? `Google Calendar: ${reason}` : `Google Calendar error (${res.status}).`)
  }
  const meetLink = typeof data.hangoutLink === 'string' ? data.hangoutLink : null
  if (!meetLink) throw new Error('Google created the event but returned no Meet link.')
  return {
    title,
    meetLink,
    start: start.toISOString(),
    end: end.toISOString(),
    htmlLink: typeof data.htmlLink === 'string' ? data.htmlLink : ''
  }
}

export async function googleUpcoming(days = 14): Promise<GoogleMeeting[]> {
  requireConfigured()
  const tokens = await validTokens()
  const timeMax = new Date(Date.now() + days * 86_400_000).toISOString()
  const params = new URLSearchParams({
    singleEvents: 'true',
    orderBy: 'startTime',
    timeMin: new Date().toISOString(),
    timeMax,
    maxResults: '20',
    conferenceDataVersion: '1',
    fields:
      'items(id,summary,start,end,status,hangoutLink,conferenceData.conferenceId)'
  })
  const res = await fetch(`${CALENDAR_API}/calendars/primary/events?${params}`, {
    headers: { Authorization: `Bearer ${tokens.access_token}` }
  })
  const data = (await res.json()) as { items?: Array<Record<string, unknown>> }
  if (!res.ok) {
    const reason = (data as { error?: { message?: string } }).error?.message
    throw new Error(reason ? `Google Calendar: ${reason}` : `Google Calendar error (${res.status}).`)
  }
  const items = Array.isArray(data.items) ? data.items : []
  return items
    .filter((item) => item.status !== 'cancelled' && typeof item.hangoutLink === 'string')
    .map((item) => {
      const start = item.start as { dateTime?: string; date?: string } | undefined
      const end = item.end as { dateTime?: string; date?: string } | undefined
      return {
        id: String(item.id),
        title: String(item.summary ?? 'Meeting'),
        start: String(start?.dateTime ?? start?.date ?? ''),
        end: String(end?.dateTime ?? end?.date ?? ''),
        meetLink: String(item.hangoutLink),
        status: (item.status as GoogleMeeting['status']) ?? 'confirmed'
      }
    })
}
