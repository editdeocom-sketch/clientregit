import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import { api } from './api'

let shared: SupabaseClient | null = null
let syncedAt = 0

/**
 * Renderer Supabase client authenticated as the signed-in app user.
 * The desktop app owns the auth session in the main process; the renderer
 * pulls a short-lived token over IPC (user.session) and syncs it into this
 * client every ~25 minutes. The client is shared so REST + realtime reuse
 * the same token, and supabase-js re-attaches it to realtime on refresh.
 */
export async function sb(): Promise<SupabaseClient> {
  if (!shared) {
    shared = createClient(__SUPABASE_URL__, __SUPABASE_ANON_KEY__, {
      auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false }
    })
  }
  if (Date.now() - syncedAt > 25 * 60_000) {
    try {
      const session = await api.user.session()
      if (session) {
        const { error } = await shared.auth.setSession({
          access_token: session.access_token,
          refresh_token: session.refresh_token
        })
        if (!error) syncedAt = Date.now()
      }
    } catch {
      // Signed out or IPC unavailable — queries run without a user session.
    }
  }
  return shared
}

/** Unauthenticated client (meeting lookup by code, guest-capability RPCs). */
export function sbAnon(): SupabaseClient {
  return createClient(__SUPABASE_URL__, __SUPABASE_ANON_KEY__, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false }
  })
}
