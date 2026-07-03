'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'
import { createNotification } from './notifications'

export async function createBooking(formData: {
  roomId: string
  startTime: string
  endTime: string
  purpose: string
}) {
  const supabase = await createClient()

  // 1. Get current authenticated user
  const { data: { user }, error: userError } = await supabase.auth.getUser()
  if (userError || !user) {
    return { error: 'ไม่พบข้อมูลผู้เข้าใช้งาน กรุณาเข้าสู่ระบบอีกครั้ง' }
  }

  // 2. Validate input dates
  const start = new Date(formData.startTime)
  const end = new Date(formData.endTime)
  const now = new Date()

  if (isNaN(start.getTime()) || isNaN(end.getTime())) {
    return { error: 'กรุณากรอกวันที่และเวลาให้ถูกต้อง' }
  }

  if (start >= end) {
    return { error: 'เวลาเริ่มการจองต้องเกิดขึ้นก่อนเวลาสิ้นสุดการจอง' }
  }

  if (start < now) {
    return { error: 'ไม่สามารถจองห้องประชุมในอดีตได้' }
  }

  // 3. Double booking prevention (Check overlapping bookings)
  // Overlap condition:
  // A booking overlaps if: start_time < new_end_time AND end_time > new_start_time
  // And the booking status must be 'approved' or 'pending' (not 'rejected' or 'cancelled')
  const { data: overlaps, error: overlapError } = await supabase
    .from('bookings')
    .select('id, start_time, end_time')
    .eq('room_id', formData.roomId)
    .in('status', ['pending', 'approved'])
    .lt('start_time', end.toISOString())
    .gt('end_time', start.toISOString())

  if (overlapError) {
    console.error('Overlap check error:', overlapError)
    return { error: 'เกิดข้อผิดพลาดในการตรวจสอบคิวห้องว่าง' }
  }

  if (overlaps && overlaps.length > 0) {
    return { error: 'ช่วงเวลาที่คุณเลือกมีผู้จองแล้วหรืออยู่ระหว่างรออนุมัติ กรุณาเลือกช่วงเวลาอื่น' }
  }

  // 4. Create the booking
  const { error: insertError } = await supabase
    .from('bookings')
    .insert({
      room_id: formData.roomId,
      user_id: user.id,
      start_time: start.toISOString(),
      end_time: end.toISOString(),
      purpose: formData.purpose,
      status: 'pending' // Default status is pending
    })

  if (insertError) {
    console.error('Insert booking error:', insertError)
    return { error: 'ไม่สามารถสร้างรายการจองห้องประชุมได้' }
  }

  // Notify configured roles on new booking creation
  try {
    const { data: userProfile } = await supabase
      .from('profiles')
      .select('full_name')
      .eq('id', user.id)
      .single()
      
    const { data: roomData } = await supabase
      .from('rooms')
      .select('name')
      .eq('id', formData.roomId)
      .single()

    if (userProfile && roomData) {
      const userName = userProfile.full_name || 'ผู้ใช้'
      const roomName = roomData.name || 'ห้องประชุม'
      const dateStr = start.toLocaleDateString('th-TH', { day: 'numeric', month: 'short' })
      const timeStr = `${start.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })}-${end.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })}`
      
      const title = 'คำขอจองห้องประชุมใหม่'
      const content = `${userName} ได้ขอจองห้อง ${roomName} ในวันที่ ${dateStr} เวลา ${timeStr} น. (รอการอนุมัติ)`

      // Fetch notify target roles from system settings
      const { data: config } = await supabase
        .from('system_settings')
        .select('value')
        .eq('key', 'notify_new_booking_roles')
        .single()

      const targetRoles = Array.isArray(config?.value) 
        ? config.value 
        : ['admin', 'subadmin', 'admin booking']

      if (targetRoles.length > 0) {
        // Find users matching these roles
        const { data: targetUsers } = await supabase
          .from('profiles')
          .select('id')
          .in('role', targetRoles)

        if (targetUsers) {
          for (const targetUser of targetUsers) {
            // Do not notify the booking creator themselves
            if (targetUser.id !== user.id) {
              await createNotification(targetUser.id, title, content)
            }
          }
        }
      }
    }
  } catch (notiErr) {
    console.error('Failed to trigger booking creation notifications:', notiErr)
  }

  revalidatePath('/dashboard')
  revalidatePath('/dashboard/my-bookings')
  revalidatePath('/manage')
  return { success: true }
}

export async function cancelBooking(bookingId: string) {
  const supabase = await createClient()

  // Get current user
  const { data: { user }, error: userError } = await supabase.auth.getUser()
  if (userError || !user) {
    return { error: 'ไม่ได้รับอนุญาตในการทำรายการ' }
  }

  // Find booking to verify ownership
  const { data: booking, error: fetchError } = await supabase
    .from('bookings')
    .select('user_id, status')
    .eq('id', bookingId)
    .single()

  if (fetchError || !booking) {
    return { error: 'ไม่พบรายการจองห้องประชุมนี้' }
  }

  // Users can only cancel their own bookings, and only if not rejected/cancelled
  if (booking.user_id !== user.id) {
    return { error: 'คุณไม่มีสิทธิ์ยกเลิกรายการจองของผู้อื่น' }
  }

  if (booking.status === 'cancelled') {
    return { error: 'รายการจองนี้ได้รับการยกเลิกไปแล้ว' }
  }

  // Fetch booking details for notification context before updating
  const { data: bookingDetail } = await supabase
    .from('bookings')
    .select(`
      start_time,
      rooms (
        name
      ),
      profiles (
        full_name
      )
    `)
    .eq('id', bookingId)
    .single()

  // Update status to cancelled
  const { error: updateError } = await supabase
    .from('bookings')
    .update({ status: 'cancelled' })
    .eq('id', bookingId)

  if (updateError) {
    return { error: 'ไม่สามารถยกเลิกรายการจองได้' }
  }

  // Notify admins of cancellation
  if (bookingDetail) {
    const roomName = (bookingDetail.rooms as any)?.name || 'ห้องประชุม'
    const userName = (bookingDetail.profiles as any)?.full_name || 'ผู้ใช้'
    const dateStr = new Date(bookingDetail.start_time).toLocaleDateString('th-TH', { day: 'numeric', month: 'short' })
    const title = 'ยกเลิกการจองห้องประชุม'
    const content = `${userName} ได้กดยกเลิกการจองห้อง ${roomName} วันที่ ${dateStr} แล้ว`

    const { data: admins } = await supabase
      .from('profiles')
      .select('id')
      .in('role', ['admin', 'subadmin', 'admin booking'])

    if (admins) {
      for (const admin of admins) {
        await createNotification(admin.id, title, content)
      }
    }
  }

  revalidatePath('/dashboard')
  revalidatePath('/dashboard/my-bookings')
  return { success: true }
}

export async function updateBookingStatus(bookingId: string, status: 'approved' | 'rejected', rejectionReason?: string) {
  const supabase = await createClient()

  // Verify user is admin, subadmin, or admin booking
  const { data: { user }, error: userError } = await supabase.auth.getUser()
  if (userError || !user) {
    return { error: 'ไม่ได้รับอนุญาตในการทำรายการ' }
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  const allowedRoles = ['admin', 'subadmin', 'admin booking']
  if (!allowedRoles.includes(profile?.role || '')) {
    return { error: 'คุณไม่มีสิทธิ์ในการอนุมัติหรือปฏิเสธคำขอจองห้องประชุม' }
  }

  // Fetch booking details to notify the user before status update
  const { data: bookingData } = await supabase
    .from('bookings')
    .select(`
      user_id,
      start_time,
      rooms (
        name
      )
    `)
    .eq('id', bookingId)
    .single()

  // Update status
  const updateData: any = { status }
  if (status === 'rejected' && rejectionReason) {
    updateData.rejection_reason = rejectionReason
  }

  const { error: updateError } = await supabase
    .from('bookings')
    .update(updateData)
    .eq('id', bookingId)

  if (updateError) {
    return { error: 'ไม่สามารถเปลี่ยนสถานะรายการจองได้' }
  }

  // Notify the booking owner of approval or rejection
  if (bookingData) {
    const roomName = (bookingData.rooms as any)?.name || 'ห้องประชุม'
    const dateStr = new Date(bookingData.start_time).toLocaleDateString('th-TH', { day: 'numeric', month: 'short' })
    const title = status === 'approved' ? 'อนุมัติการจองห้องประชุมแล้ว' : 'ปฏิเสธการจองห้องประชุม'
    const content = status === 'approved'
      ? `คำขอจองห้อง ${roomName} ในวันที่ ${dateStr} ของคุณได้รับการอนุมัติแล้ว`
      : `คำขอจองห้อง ${roomName} ในวันที่ ${dateStr} ของคุณถูกปฏิเสธ ${rejectionReason ? `เนื่องจาก: ${rejectionReason}` : ''}`

    await createNotification(bookingData.user_id, title, content)
  }

  revalidatePath('/manage')
  revalidatePath('/dashboard')
  revalidatePath('/dashboard/my-bookings')
  return { success: true }
}
