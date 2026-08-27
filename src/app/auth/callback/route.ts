import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const origin = request.nextUrl.origin
  const code = searchParams.get('code')
  const next = searchParams.get('next')

  if (code) {
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return request.cookies.get(name)?.value
          },
          set(name: string, value: string, options: CookieOptions) {
            request.cookies.set(name, value)
          },
          remove(name: string, options: CookieOptions) {
            request.cookies.set(name, '')
          },
        },
      }
    )

    const { data, error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error && data.user) {
      const role = data.user.user_metadata?.role || "editor"
      
      if (next) {
        return NextResponse.redirect(`${origin}${next}`)
      }

      if (role === "client") {
        return NextResponse.redirect(`${origin}/client/dashboard`)
      }
      return NextResponse.redirect(`${origin}/dashboard`)
    }
  }

  // Fallback - redirect to login
  return NextResponse.redirect(`${origin}/login`)
}
