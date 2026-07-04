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
        // Fetch user profile to check role & sync details
        const { data: profile } = await supabase
          .from('profiles')
          .select('role, avatar_url, full_name')
          .eq('id', user.id)
          .single()

        let role = 'user'
        const googleName = user.user_metadata?.full_name || user.user_metadata?.name
        const googleAvatar = user.user_metadata?.avatar_url || user.user_metadata?.picture

        if (profile) {
          role = profile.role
          
          // Sync metadata to existing profile if avatar_url or full_name is missing
          const updates: any = {}
          let needsUpdate = false
          
          if (!profile.avatar_url && googleAvatar) {
            updates.avatar_url = googleAvatar
            needsUpdate = true
          }
          if (!profile.full_name && googleName) {
            updates.full_name = googleName
            needsUpdate = true
          }
          
          if (needsUpdate) {
            updates.updated_at = new Date().toISOString()
            await supabase
              .from('profiles')
              .update(updates)
              .eq('id', user.id)
          }
        } else {
          // If profile is missing (failsafe creation)
          const { data: profilesList } = await supabase.from('profiles').select('id').limit(1)
          const isFirstUser = !profilesList || profilesList.length === 0
          role = isFirstUser ? 'admin' : 'user'
          
          await supabase
            .from('profiles')
            .insert({
              id: user.id,
              full_name: googleName || user.email?.split('@')[0] || 'User',
              email: user.email,
              avatar_url: googleAvatar,
              role: role,
              updated_at: new Date().toISOString()
            })
        }
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
