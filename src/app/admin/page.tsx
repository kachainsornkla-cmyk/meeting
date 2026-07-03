import { createClient } from '@/utils/supabase/server'
import Navbar from '@/components/Navbar'
import AdminDashboard from '@/components/AdminDashboard'
import { redirect } from 'next/navigation'

export const revalidate = 0; // Disable cache for real-time status updates

export default async function AdminPage() {
  const supabase = await createClient()

  // Get user session
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    redirect('/login')
  }

  // Get user profile and verify if admin
  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name, role')
    .eq('id', user.id)
    .single()

  if (!profile) {
    redirect('/login')
  }

  if (profile.role !== 'admin') {
    redirect('/dashboard') // Regular users can't see this page
  }

  // Fetch all bookings
  const { data: bookings } = await supabase
    .from('bookings')
    .select(`
      id,
      created_at,
      start_time,
      end_time,
      purpose,
      status,
      rejection_reason,
      rooms (
        name,
        location
      ),
      profiles (
        full_name,
        email
      )
    `)
    .order('created_at', { ascending: false })

  const formattedBookings = (bookings || []).map((b: any) => ({
    id: b.id,
    created_at: b.created_at,
    start_time: b.start_time,
    end_time: b.end_time,
    purpose: b.purpose,
    status: b.status,
    rejection_reason: b.rejection_reason,
    roomName: b.rooms?.name || 'ห้องประชุมถูกลบแล้ว',
    roomLocation: b.rooms?.location || 'ไม่ระบุสถานที่',
    userFullName: b.profiles?.full_name || 'ผู้ใช้งาน',
    userEmail: b.profiles?.email || 'ไม่มีอีเมล'
  }))

  return (
    <>
      <Navbar userName={profile.full_name || 'Admin'} role={profile.role} />
      <main className="container animate-fade-in">
        <AdminDashboard bookings={formattedBookings} />
      </main>
    </>
  )
}
