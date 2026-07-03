import { createClient } from '@/utils/supabase/server'
import Navbar from '@/components/Navbar'
import AdminRooms from '@/components/AdminRooms'
import { redirect } from 'next/navigation'

export const revalidate = 0; // Disable cache for live editing

export default async function AdminRoomsPage() {
  const supabase = await createClient()

  // Get user session
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    redirect('/login')
  }

  // Get user profile
  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name, role')
    .eq('id', user.id)
    .single()

  if (!profile) {
    redirect('/login')
  }

  if (profile.role !== 'admin') {
    redirect('/dashboard')
  }

  // Fetch all rooms (both active & inactive)
  const { data: rooms } = await supabase
    .from('rooms')
    .select('*')
    .order('name', { ascending: true })

  return (
    <>
      <Navbar userName={profile.full_name || 'Admin'} role={profile.role} />
      <main className="container animate-fade-in">
        <AdminRooms rooms={rooms || []} />
      </main>
    </>
  )
}
