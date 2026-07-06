import { createClient } from '@/utils/supabase/server'
import Navbar from '@/components/Navbar'
import UserDashboard from '@/components/UserDashboard'
import { redirect } from 'next/navigation'

export const revalidate = 0; // Disable caching to fetch real-time booking statuses

export default async function DashboardPage() {
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

  // Fetch active rooms
  const { data: rooms } = await supabase
    .from('rooms')
    .select('*')
    .eq('is_active', true)
    .order('name', { ascending: true })

  // Fetch upcoming bookings so the client can show busy/free slots or check dates
  const { data: bookings } = await supabase
    .from('bookings')
    .select(`
      id,
      room_id,
      start_time,
      end_time,
      status,
      profiles (
        full_name
      )
    `)
    .in('status', ['pending', 'approved'])
    .order('start_time', { ascending: true })

  // Transform profiles relation for type safety
  const formattedBookings = (bookings || []).map((b: any) => ({
    id: b.id,
    room_id: b.room_id,
    start_time: b.start_time,
    end_time: b.end_time,
    status: b.status,
    userName: b.profiles?.full_name || 'ผู้ใช้งานระบบ'
  }))

  return (
    <>
      <Navbar userName={profile.full_name || 'User'} role={profile.role} />
      <main className="container animate-fade-in">
        <UserDashboard rooms={rooms || []} bookings={formattedBookings} userRole={profile.role} />
      </main>
    </>
  )
}
