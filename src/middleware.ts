import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })

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
          supabaseResponse = NextResponse.next({
            request,
          })
          supabaseResponse.cookies.set(name, value, options)
        },
        remove(name: string, options: CookieOptions) {
          request.cookies.set(name, '')
          supabaseResponse = NextResponse.next({
            request,
          })
          supabaseResponse.cookies.set(name, '', options)
        },
      },
    }
  )

  const {
    data: { user },
  } = await supabase.auth.getUser()

  // Editor-only routes
  const editorRoutes = ['/dashboard', '/clients', '/projects', '/tasks', '/videos', '/invoices', '/settings']
  const isEditorRoute = editorRoutes.some(route => request.nextUrl.pathname.startsWith(route))
  
  // Client-only routes
  const isClientRoute = request.nextUrl.pathname.startsWith('/client')
  
  // Auth routes
  const isAuthRoute = ['/login', '/signup', '/forgot-password', '/update-password'].includes(request.nextUrl.pathname)

  // If user is not logged in and trying to access protected routes
  if ((isEditorRoute || isClientRoute) && !user) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    url.searchParams.set('redirect', request.nextUrl.pathname)
    return NextResponse.redirect(url)
  }

  // If user is logged in and on auth routes, redirect based on role
  if (isAuthRoute && user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single()

    const role = profile?.role || user.user_metadata?.role || "editor"
    const url = request.nextUrl.clone()
    
    if (role === "client") {
      url.pathname = '/client/dashboard'
    } else {
      url.pathname = '/dashboard'
    }
    return NextResponse.redirect(url)
  }

  // If user is logged in, check role-based access
  if (user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single()

    const role = profile?.role || user.user_metadata?.role || "editor"

    // Client trying to access editor routes - redirect to client dashboard
    if (role === "client" && isEditorRoute) {
      const url = request.nextUrl.clone()
      url.pathname = '/client/dashboard'
      return NextResponse.redirect(url)
    }

    // Editor trying to access client routes - redirect to editor dashboard
    if (role === "editor" && isClientRoute) {
      const url = request.nextUrl.clone()
      url.pathname = '/dashboard'
      return NextResponse.redirect(url)
    }
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/clients/:path*',
    '/projects/:path*',
    '/tasks/:path*',
    '/videos/:path*',
    '/invoices/:path*',
    '/settings/:path*',
    '/client/:path*',
    '/login',
    '/signup',
    '/forgot-password',
    '/update-password',
    '/auth/:path*',
  ],
}
