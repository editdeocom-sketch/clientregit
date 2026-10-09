import { app } from 'electron'
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import { ensureTrialStarted, getLicenseRecord, saveLicense } from './store'
import type {
  LicenseActivateInput,
  LicenseSignInInput,
  LicenseState,
  LicenseType
} from '../../shared/types'

export const TRIAL_DAYS = 7

export function isActivationConfigured(): boolean {
  return Boolean(__SUPABASE_URL__ && __SUPABASE_ANON_KEY__)
}

export function siteUrl(): string {
  return __SITE_URL__
}

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return Promise.race([
    promise,
    new Promise<never>((_, reject) => {
      const timer = setTimeout(
        () => reject(new Error('Network timeout. Check your internet connection and try again.')),
        ms
      )
      timer.unref()
    })
  ])
}

let sessionCache: Record<string, string> | null = null

function sessionFile(): string {
  return join(app.getPath('userData'), 'auth-session.json')
}

function loadSession(): Record<string, string> {
  if (sessionCache) return sessionCache
  try {
    if (existsSync(sessionFile())) {
      sessionCache = JSON.parse(readFileSync(sessionFile(), 'utf8')) as Record<string, string>
    } else {
      sessionCache = {}
    }
  } catch {
    sessionCache = {}
  }
  return sessionCache
}

const authStorage = {
  getItem(key: string): string | null {
    return loadSession()[key] ?? null
  },
  setItem(key: string, value: string): void {
    loadSession()[key] = value
    try {
      mkdirSync(dirname(sessionFile()), { recursive: true })
      writeFileSync(sessionFile(), JSON.stringify(sessionCache))
    } catch {
      // best effort — session persistence is not critical
    }
  },
  removeItem(key: string): void {
    delete loadSession()[key]
    try {
      writeFileSync(sessionFile(), JSON.stringify(sessionCache))
    } catch {
      // best effort
    }
  }
}

let client: SupabaseClient | null = null

function getClient(): SupabaseClient {
  if (!client) {
    client = createClient(__SUPABASE_URL__, __SUPABASE_ANON_KEY__, {
      auth: {
        storage: authStorage as never,
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: false
      }
    })
  }
  return client
}

function computeState(): LicenseState {
  const record = getLicenseRecord()
  const now = Date.now()
  const trialEnd = record.trial_started_at
    ? new Date(record.trial_started_at).getTime() + TRIAL_DAYS * 86400000
    : null

  let status: LicenseState['status']
  if (record.activated) {
    status =
      record.license_expires_at && new Date(record.license_expires_at).getTime() < now
        ? 'license_expired'
        : 'activated'
  } else {
    status = trialEnd && now < trialEnd ? 'trial' : 'trial_expired'
  }

  return {
    status,
    trial_days_left: trialEnd ? Math.max(0, Math.ceil((trialEnd - now) / 86400000)) : 0,
    trial_ends_at: trialEnd ? new Date(trialEnd).toISOString() : null,
    email: record.email,
    license_key: record.license_key,
    license_type: record.license_type,
    license_expires_at: record.license_expires_at,
    last_validated_at: record.last_validated_at,
    site_url: siteUrl()
  }
}

function deactivateLocal(): void {
  saveLicense({
    activated: false,
    license_key: null,
    license_type: null,
    license_expires_at: null,
    last_validated_at: null
  })
}

let validatedThisSession = false

async function validateOnline(): Promise<void> {
  if (validatedThisSession) return
  validatedThisSession = true

  const record = getLicenseRecord()
  if (!record.activated || !isActivationConfigured()) return

  try {
    await withTimeout(
      (async () => {
        const supa = getClient()
        const { data: auth } = await supa.auth.getUser()
        if (!auth.user) {
          deactivateLocal()
          return
        }
        const { data, error } = await supa
          .from('licenses')
          .select('license_key, type, expires_at, status')
          .eq('license_key', record.license_key ?? '')
          .maybeSingle()
        if (error) throw new Error(error.message)
        if (!data || data.status !== 'active') {
          deactivateLocal()
          return
        }
        saveLicense({
          license_type: data.type as LicenseType,
          license_expires_at: data.expires_at as string | null,
          last_validated_at: new Date().toISOString()
        })
      })(),
      6000
    )
  } catch {
    // Offline or server unavailable — keep working on the stored license (grace).
    // Subscription expiry is still enforced locally by computeState().
  }
}

export async function getLicenseState(): Promise<LicenseState> {
  ensureTrialStarted()
  await validateOnline()
  return computeState()
}

export async function signInLicense(input: LicenseSignInInput): Promise<{ email: string }> {
  ensureTrialStarted()
  if (!isActivationConfigured()) {
    throw new Error('Activation service is not configured yet. Please contact support.')
  }

  const email = input.email.trim()
  const password = input.password
  if (!email || !password) throw new Error('Enter your email and password.')

  const supa = getClient()
  const result = await withTimeout(supa.auth.signInWithPassword({ email, password }), 8000)
  if (result.error) {
    const message = result.error.message.toLowerCase()
    if (message.includes('invalid login credentials')) throw new Error('Incorrect email or password.')
    if (message.includes('email not confirmed'))
      throw new Error('Confirm your email first — check your inbox for the link.')
    throw new Error(result.error.message)
  }
  return { email: result.data.user?.email ?? email }
}

export async function activateLicense(input: LicenseActivateInput): Promise<LicenseState> {
  ensureTrialStarted()
  if (!isActivationConfigured()) {
    throw new Error('Activation service is not configured yet. Please contact support.')
  }

  const key = input.licenseKey.trim().toUpperCase()
  if (!key) throw new Error('Enter your license key.')

  const supa = getClient()

  let signedInEmail: string | null = null
  if (input.email?.trim() && input.password) {
    const signIn = await withTimeout(
      supa.auth.signInWithPassword({ email: input.email.trim(), password: input.password }),
      8000
    )
    if (signIn.error) {
      const message = signIn.error.message.toLowerCase()
      if (message.includes('invalid login credentials'))
        throw new Error('Incorrect email or password.')
      if (message.includes('email not confirmed'))
        throw new Error('Confirm your email first — check your inbox for the link.')
      throw new Error(signIn.error.message)
    }
    signedInEmail = signIn.data.user?.email ?? input.email.trim()
  } else {
    const { data: auth, error: authError } = await withTimeout(supa.auth.getUser(), 8000)
    if (authError || !auth.user) throw new Error('Sign in with your email and password first.')
    signedInEmail = auth.user.email ?? null
  }

  const { data: row, error } = await withTimeout(
    Promise.resolve(
      supa.from('licenses').select('license_key, type, expires_at, status').eq('license_key', key).maybeSingle()
    ),
    8000
  )
  if (error) {
    throw new Error('Could not verify the license. Check your internet connection.')
  }
  if (!row) {
    throw new Error('License key not found for this account.')
  }
  if (row.status !== 'active') {
    throw new Error('This license has been revoked. Please contact support.')
  }
  if (row.expires_at && new Date(row.expires_at).getTime() < Date.now()) {
    throw new Error('This license has expired. Renew it on the website to continue.')
  }

  saveLicense({
    activated: true,
    email: signedInEmail ?? getLicenseRecord().email ?? null,
    license_key: row.license_key as string,
    license_type: row.type as LicenseType,
    license_expires_at: (row.expires_at as string | null) ?? null,
    last_validated_at: new Date().toISOString()
  })
  validatedThisSession = true
  return computeState()
}

export async function deactivateLicense(): Promise<LicenseState> {
  if (isActivationConfigured()) {
    try {
      await getClient().auth.signOut()
    } catch {
      // ignore — local deactivation still applies
    }
  }
  deactivateLocal()
  validatedThisSession = true
  return computeState()
}
