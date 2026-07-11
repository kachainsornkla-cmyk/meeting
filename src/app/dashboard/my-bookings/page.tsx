import { createClient } from '@/utils/supabase/server'
import Navbar from '@/components/Navbar'
import MyBookings from '@/components/MyBookings'
import { redirect } from 'next/navigation'

export const revalidate = 0; // Real-time values

export default async function MyBookingsPage() {
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

  // Fetch bookings for this user
  const { data: bookings } = await supabase
    .from('bookings')
    .select(`
      id,
      created_at,
      start_time,
      end_time,
      purpose,
      status,
      participants_count,
      rejection_reason,
      rooms (
        name,
        location
      )
    `)
    .eq('user_id', user.id)
    .order('start_time', { ascending: false })

  const formattedBookings = (bookings || []).map((b: any) => ({
    id: b.id,
    created_at: b.created_at,
    start_time: b.start_time,
    end_time: b.end_time,
    purpose: b.purpose,
    status: b.status,
    participantsCount: b.participants_count,
    rejection_reason: b.rejection_reason,
    roomName: b.rooms?.name || 'ห้องประชุมถูกลบแล้ว',
    roomLocation: b.rooms?.location || 'ไม่ระบุสถานที่'
  }))

  // Fetch allowed cancel roles setting
  const { data: config } = await supabase
    .from('system_settings')
    .select('value')
    .eq('key', 'edit_approved_booking_roles')
    .single()

  const allowedCancelRoles = Array.isArray(config?.value)
    ? config.value
    : ['admin', 'subadmin', 'admin booking']

  return (
    <>
      <Navbar userName={profile.full_name || 'User'} role={profile.role} />
      <main className="container animate-fade-in">
        <MyBookings 
          bookings={formattedBookings} 
          userRole={profile.role}
          allowedCancelRoles={allowedCancelRoles}
        />
      </main>
    </>
  )
}
