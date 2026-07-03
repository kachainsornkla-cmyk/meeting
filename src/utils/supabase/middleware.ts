import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // Refresh session if expired
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const path = request.nextUrl.pathname

  // 1. If not logged in and trying to access /, /profile, /dashboard or /manage, redirect to /login
  if (!user && (path === '/' || path.startsWith('/profile') || path.startsWith('/dashboard') || path.startsWith('/manage'))) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }

  // 2. If logged in, perform role-based access checks
  if (user) {
    // Get user's profile and role
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    const role = profile?.role || 'user'
    const allowedAdminRoles = ['admin', 'subadmin', 'admin booking', 'Housekeeper']

    // Block non-admins from /manage
    if (path.startsWith('/manage')) {
      if (!allowedAdminRoles.includes(role)) {
        const url = request.nextUrl.clone()
        url.pathname = '/dashboard'
        return NextResponse.redirect(url)
      }

      // /manage/users is restricted to super admin only
      if (path.startsWith('/manage/users') && role !== 'admin') {
        const url = request.nextUrl.clone()
        url.pathname = '/manage'
        return NextResponse.redirect(url)
      }

      // /manage/rooms is restricted to admin and subadmin only
      if (path.startsWith('/manage/rooms') && !['admin', 'subadmin'].includes(role)) {
        const url = request.nextUrl.clone()
        url.pathname = '/manage'
        return NextResponse.redirect(url)
      }
    }

    // Redirect administrative roles away from user dashboard to admin panel for better UX
    if (path.startsWith('/dashboard') && allowedAdminRoles.includes(role)) {
      const url = request.nextUrl.clone()
      url.pathname = '/manage'
      return NextResponse.redirect(url)
    }

    // Redirect logged in users away from auth pages
    if (path === '/' || path === '/login' || path === '/register') {
      const url = request.nextUrl.clone()
      url.pathname = allowedAdminRoles.includes(role) ? '/manage' : '/dashboard'
      return NextResponse.redirect(url)
    }
  }

  return supabaseResponse
}
