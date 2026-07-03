'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'

// Verify user is an Admin
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
    throw new Error('เฉพาะผู้ดูแลระบบเท่านั้นที่ทำรายการนี้ได้')
  }

  return supabase
}

export async function addRoom(formData: {
  name: string
  capacity: number
  location: string
  amenities: string[]
  imageUrl: string
}) {
  try {
    const supabase = await verifyAdmin()

    const { error } = await supabase
      .from('rooms')
      .insert({
        name: formData.name,
        capacity: formData.capacity,
        location: formData.location,
        amenities: formData.amenities,
        image_url: formData.imageUrl || null,
        is_active: true
      })

    if (error) throw new Error(error.message)

    revalidatePath('/admin/rooms')
    revalidatePath('/dashboard')
    return { success: true }
  } catch (err: any) {
    return { error: err.message || 'เกิดข้อผิดพลาดในการเพิ่มห้องประชุม' }
  }
}

export async function editRoom(
  id: string,
  formData: {
    name: string
    capacity: number
    location: string
    amenities: string[]
    imageUrl: string
    isActive: boolean
  }
) {
  try {
    const supabase = await verifyAdmin()

    const { error } = await supabase
      .from('rooms')
      .update({
        name: formData.name,
        capacity: formData.capacity,
        location: formData.location,
        amenities: formData.amenities,
        image_url: formData.imageUrl || null,
        is_active: formData.isActive
      })
      .eq('id', id)

    if (error) throw new Error(error.message)

    revalidatePath('/admin/rooms')
    revalidatePath('/dashboard')
    return { success: true }
  } catch (err: any) {
    return { error: err.message || 'เกิดข้อผิดพลาดในการแก้ไขห้องประชุม' }
  }
}

export async function deleteRoom(id: string) {
  try {
    const supabase = await verifyAdmin()

    const { error } = await supabase
      .from('rooms')
      .delete()
      .eq('id', id)

    if (error) throw new Error(error.message)

    revalidatePath('/admin/rooms')
    revalidatePath('/dashboard')
    return { success: true }
  } catch (err: any) {
    return { error: err.message || 'เกิดข้อผิดพลาดในการลบห้องประชุม' }
  }
}
