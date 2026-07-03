'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'

// Verify user is a Super Admin
async function verifyAdmin() {
  const supabase = await createClient()
  const { data: { user }, error: userError } = await supabase.auth.getUser()
  if (userError || !user) {
    throw new Error('ไม่ได้รับอนุญาตในการเข้าถึง')
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'admin') {
    throw new Error('เฉพาะผู้ดูแลระบบสูงสุด (Admin) เท่านั้นที่ทำรายการนี้ได้')
  }

  return supabase
}

export async function updateUserRoleAndProfile(
  id: string,
  formData: {
    fullName: string
    phone: string
    learningGroup: string
    workGroup: string
    position: string
    academicStanding: string
    advisorRole: string
    responsibleRoom: string
    role: string
  }
) {
  try {
    const supabase = await verifyAdmin()

    // Update profiles table
    const { error } = await supabase
      .from('profiles')
      .update({
        full_name: formData.fullName,
        phone: formData.phone,
        learning_group: formData.learningGroup,
        work_group: formData.workGroup,
        position: formData.position,
        academic_standing: formData.academicStanding,
        advisor_role: formData.advisorRole,
        responsible_room: formData.responsibleRoom,
        role: formData.role,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)

    if (error) throw new Error(error.message)

    revalidatePath('/admin/users')
    return { success: true }
  } catch (err: any) {
    return { error: err.message || 'เกิดข้อผิดพลาดในการแก้ไขข้อมูลสมาชิก' }
  }
}
