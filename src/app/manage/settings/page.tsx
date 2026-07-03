import { createClient } from '@/utils/supabase/server'
import Navbar from '@/components/Navbar'
import SystemSettings from '@/components/SystemSettings'
import { redirect } from 'next/navigation'

export const revalidate = 0; // Live settings updates

export default async function AdminSettingsPage() {
  const supabase = await createClient()

  // Get user session
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    redirect('/login')
  }

  // Get current user profile and check if admin
  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name, role')
    .eq('id', user.id)
    .single()

  if (!profile) {
    redirect('/login')
  }

  if (!['admin', 'subadmin'].includes(profile.role)) {
    redirect('/manage') // Only admins and subadmins can configure system notifications
  }

  return (
    <>
      <Navbar userName={profile.full_name || 'Admin'} role={profile.role} />
      <main className="container animate-fade-in" style={{ paddingBottom: '60px' }}>
        <SystemSettings />
      </main>
    </>
  )
}
