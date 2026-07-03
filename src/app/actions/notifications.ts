'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'
import { triggerPushNotification } from './push'

// Get current user session
async function getCurrentUser() {
  const supabase = await createClient()
  const { data: { user }, error: userError } = await supabase.auth.getUser()
  if (userError || !user) {
    throw new Error('ไม่ได้รับอนุญาตในการเข้าถึง กรุณาเข้าสู่ระบบอีกครั้ง')
  }
  return { supabase, user }
}

// Fetch all notifications for current user
export async function getUserNotifications() {
  try {
    const { supabase, user } = await getCurrentUser()
    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(50)

    if (error) throw error
    return { notifications: data || [] }
  } catch (err: any) {
    return { error: err.message || 'เกิดข้อผิดพลาดในการดึงข้อมูลการแจ้งเตือน', notifications: [] }
  }
}

// Mark a single notification as read
export async function markNotificationAsRead(id: string) {
  try {
    const { supabase, user } = await getCurrentUser()
    const { error } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('id', id)
      .eq('user_id', user.id) // Ensure security check

    if (error) throw error
    revalidatePath('/dashboard')
    revalidatePath('/manage')
    return { success: true }
  } catch (err: any) {
    return { error: err.message || 'ไม่สามารถแก้ไขสถานะการแจ้งเตือนได้' }
  }
}

// Mark all notifications as read for current user
export async function markAllNotificationsAsRead() {
  try {
    const { supabase, user } = await getCurrentUser()
    const { error } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('user_id', user.id)
      .eq('is_read', false)

    if (error) throw error
    revalidatePath('/dashboard')
    revalidatePath('/manage')
    return { success: true }
  } catch (err: any) {
    return { error: err.message || 'ไม่สามารถแก้ไขสถานะการแจ้งเตือนได้' }
  }
}

// Internal/External helper to create a notification (Server Side Only)
export async function createNotification(userId: string, title: string, content: string) {
  try {
    const supabase = await createClient()
    const { error } = await supabase
      .from('notifications')
      .insert({
        user_id: userId,
        title,
        content,
        is_read: false
      })

    if (error) throw error

    // Trigger background system push notifications via web-push
    await triggerPushNotification(userId, title, content)

    return { success: true }
  } catch (err: any) {
    console.error('Failed to create notification:', err)
    return { error: err.message || 'ไม่สามารถบันทึกรายการแจ้งเตือนได้' }
  }
}
