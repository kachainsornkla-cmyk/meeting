import { createClient } from '@/utils/supabase/server'
import Navbar from '@/components/Navbar'
import UserProfile from '@/components/UserProfile'
import { redirect } from 'next/navigation'

export const revalidate = 0; // Disable cache to fetch real-time profile details

export default async function ProfilePage() {
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

  return (
    <>
      <Navbar userName={profile.full_name || 'User'} role={profile.role} />
      <main className="container animate-fade-in" style={{ paddingBottom: '60px' }}>
        <div style={{ marginBottom: '20px' }}>
          <h1 style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '8px' }}>
            การจัดการข้อมูลส่วนตัว
          </h1>
          <p style={{ color: 'var(--text-secondary)' }}>
            อัปเดตรายละเอียดบัญชีของคุณ รูปภาพโปรไฟล์ และสิทธิ์การใช้งาน
          </p>
        </div>
        <UserProfile />
      </main>
    </>
  )
}
