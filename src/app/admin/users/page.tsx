import { createClient } from '@/utils/supabase/server'
import Navbar from '@/components/Navbar'
import ManageUsers from '@/components/ManageUsers'
import { redirect } from 'next/navigation'

export const revalidate = 0; // Disable cache for live updates

export default async function AdminUsersPage() {
  const supabase = await createClient()

  // Get user session
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    redirect('/login')
  }

  // Get current user profile and check if super admin
  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name, role')
    .eq('id', user.id)
    .single()

  if (!profile) {
    redirect('/login')
  }

  if (profile.role !== 'admin') {
    redirect('/admin') // Only super admins can manage users
  }

  // Fetch all profiles
  const { data: users } = await supabase
    .from('profiles')
    .select('*')
    .order('full_name', { ascending: true })

  return (
    <>
      <Navbar userName={profile.full_name || 'Admin'} role={profile.role} />
      <main className="container animate-fade-in" style={{ paddingBottom: '60px' }}>
        <div style={{ marginBottom: '20px' }}>
          <h1 style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '8px' }}>
            การจัดการข้อมูลและสิทธิ์สมาชิก
          </h1>
          <p style={{ color: 'var(--text-secondary)' }}>
            ค้นหาข้อมูลบุคลากร แก้ไขข้อมูลตำแหน่ง/กลุ่มสาระฯ และปรับระดับสิทธิ์การเข้าถึงระบบของบุคลากรในโรงเรียน
          </p>
        </div>
        <ManageUsers users={users || []} />
      </main>
    </>
  )
}
