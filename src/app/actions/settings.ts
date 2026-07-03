'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'

// Get system setting value by key
export async function getSystemSetting(key: string) {
  try {
    const supabase = await createClient()
    const { data, error } = await supabase
      .from('system_settings')
      .select('value')
      .eq('key', key)
      .single()

    if (error && error.code !== 'PGRST116') throw error
    return { value: data?.value || null }
  } catch (err: any) {
    console.error(`Failed to fetch setting ${key}:`, err)
    return { error: err.message || 'ไม่สามารถดึงข้อมูลการตั้งค่าได้', value: null }
  }
}

// Update system setting value (Admin only)
export async function updateSystemSetting(key: string, value: any) {
  try {
    const supabase = await createClient()
    
    // Verify admin role
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      return { error: 'ไม่ได้รับอนุญาตในการทำรายการ' }
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (profile?.role !== 'admin') {
      return { error: 'คุณไม่มีสิทธิ์ของแอดมินในการปรับเปลี่ยนการตั้งค่าระบบ' }
    }

    // Insert or update setting
    const { error } = await supabase
      .from('system_settings')
      .upsert({
        key,
        value,
        updated_at: new Date().toISOString()
      })

    if (error) throw error

    revalidatePath('/manage')
    revalidatePath('/dashboard')
    return { success: true }
  } catch (err: any) {
    console.error(`Failed to update setting ${key}:`, err)
    return { error: err.message || 'ไม่สามารถบันทึกการตั้งค่าระบบได้' }
  }
}
