'use server'

import { createClient } from '@/utils/supabase/server'
import webpush from 'web-push'

const PUBLIC_VAPID_KEY = 'BCZY4R7Mpz3u_LQ39j-Mfm0J9-RFvZ9-rRjeQWuEVKcXd-4fxCq2l485VsWc51rVqoE-mHxCvlMu0O7YejpfSz0'
const PRIVATE_VAPID_KEY = 'AxngpQB8TMPl_MzVGH_uhqYVxGHYkp5kspWSURq_VxE'

// Configure web-push with VAPID details
webpush.setVapidDetails(
  'mailto:admin@pwk.ac.th',
  PUBLIC_VAPID_KEY,
  PRIVATE_VAPID_KEY
)

// Save a new browser subscription for current user
export async function savePushSubscription(sub: {
  endpoint: string
  keys: {
    p256dh: string
    auth: string
  }
}) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      return { error: 'ไม่ได้รับอนุญาต กรุณาเข้าสู่ระบบอีกครั้ง' }
    }

    // Upsert subscription
    const { error } = await supabase
      .from('push_subscriptions')
      .upsert({
        user_id: user.id,
        endpoint: sub.endpoint,
        p256dh: sub.keys.p256dh,
        auth: sub.keys.auth
      }, { onConflict: 'endpoint' })

    if (error) throw error
    return { success: true }
  } catch (err: any) {
    console.error('Failed to save push subscription:', err)
    return { error: err.message || 'ไม่สามารถบันทึกข้อมูลสิทธิ์การแจ้งเตือนระบบได้' }
  }
}

// Delete an existing subscription (e.g. when user toggles off)
export async function deletePushSubscription(endpoint: string) {
  try {
    const supabase = await createClient()
    const { error } = await supabase
      .from('push_subscriptions')
      .delete()
      .eq('endpoint', endpoint)

    if (error) throw error
    return { success: true }
  } catch (err: any) {
    console.error('Failed to delete push subscription:', err)
    return { error: err.message || 'ไม่สามารถยกเลิกการตั้งค่าได้' }
  }
}

// Internal server-side trigger to send real-time Web Push alerts to a user (Works offline/background/swiped away!)
export async function triggerPushNotification(userId: string, title: string, body: string, url: string = '/dashboard') {
  try {
    const supabase = await createClient()
    
    // Fetch all active subscriptions for the target user
    const { data: subs, error } = await supabase
      .from('push_subscriptions')
      .select('id, endpoint, p256dh, auth')
      .eq('user_id', userId)

    if (error || !subs || subs.length === 0) return { success: false, reason: 'No subscriptions found' }

    const payload = JSON.stringify({
      title,
      body,
      url
    })

    const sendPromises = subs.map(async (sub) => {
      try {
        const pushSubscription = {
          endpoint: sub.endpoint,
          keys: {
            p256dh: sub.p256dh,
            auth: sub.auth
          }
        }
        await webpush.sendNotification(pushSubscription, payload)
      } catch (err: any) {
        // If the push service returns 404 (Expired) or 410 (Gone), delete the subscription from DB
        if (err.statusCode === 404 || err.statusCode === 410) {
          console.log(`Push subscription expired (Status ${err.statusCode}). Deleting subscription ID: ${sub.id}`)
          await supabase
            .from('push_subscriptions')
            .delete()
            .eq('id', sub.id)
        } else {
          console.error('Push notification send error:', err)
        }
      }
    })

    await Promise.all(sendPromises)
    return { success: true }
  } catch (err: any) {
    console.error('Trigger push notification failed:', err)
    return { error: err.message }
  }
}
