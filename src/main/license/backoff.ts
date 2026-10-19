import { getDb } from '../db/database'

// Client-side backoff for desktop sign-in: 5 consecutive failures lock the
// form (30s, doubling, max 15 minutes). Runs alongside Supabase's server-side
// limits — this mainly stops scripted guessing against the activation dialog
// and gives the user a clear countdown instead of repeated failures.
const K_ATTEMPTS = 'auth.signin_attempts'
const K_LOCK_UNTIL = 'auth.signin_lock_until'

const FAIL_THRESHOLD = 5
const BASE_LOCK_SECONDS = 30
const MAX_LOCK_SECONDS = 900

function read(key: string): string | null {
  const row = getDb().prepare('SELECT value FROM settings WHERE key = ?').get(key) as
    | { value: string }
    | undefined
  return row?.value ?? null
}

function write(key: string, value: string): void {
  getDb()
    .prepare(
      'INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value'
    )
    .run(key, value)
}

function clear(key: string): void {
  getDb().prepare('DELETE FROM settings WHERE key = ?').run(key)
}

export function signInLockRemainingSec(): number {
  const until = Number(read(K_LOCK_UNTIL) ?? '0') || 0
  return until > Date.now() ? Math.ceil((until - Date.now()) / 1000) : 0
}

export function assertSignInAllowed(): void {
  const remaining = signInLockRemainingSec()
  if (remaining > 0) {
    throw new Error(`Too many failed attempts — try again in ${remaining} seconds.`)
  }
}

export function recordSignInFailure(): void {
  const attempts = (Number(read(K_ATTEMPTS) ?? '0') || 0) + 1
  write(K_ATTEMPTS, String(attempts))
  if (attempts >= FAIL_THRESHOLD) {
    const lockSec = Math.min(BASE_LOCK_SECONDS * 2 ** (attempts - FAIL_THRESHOLD), MAX_LOCK_SECONDS)
    write(K_LOCK_UNTIL, String(Date.now() + lockSec * 1000))
  }
}

export function recordSignInSuccess(): void {
  clear(K_ATTEMPTS)
  clear(K_LOCK_UNTIL)
}
