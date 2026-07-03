import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  
  if (code) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    
    if (!error) {
      // Get the logged-in user
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        // Fetch user profile to check role
        const { data: profile } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', user.id)
          .single()

        const role = profile?.role || 'user'
        const allowedAdminRoles = ['admin', 'subadmin', 'admin booking', 'Housekeeper']
        
        if (allowedAdminRoles.includes(role)) {
          return NextResponse.redirect(`${origin}/manage`)
        } else {
          return NextResponse.redirect(`${origin}/dashboard`)
        }
      }
    }
  }

  // If authentication fails, redirect to login page with error
  return NextResponse.redirect(`${origin}/login?error=OAuth authentication failed`)
}
