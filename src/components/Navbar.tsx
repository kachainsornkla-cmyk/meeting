'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/utils/supabase/client'
import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'
import { 
  LogOut, Calendar, Shield, User, LayoutDashboard, 
  ListPlus, Users, Home, Bell, X, Menu
} from 'lucide-react'
import { playNotificationSound } from '@/utils/audio'
import { 
  getUserNotifications, 
  markNotificationAsRead, 
  markAllNotificationsAsRead 
} from '@/app/actions/notifications'
import { savePushSubscription } from '@/app/actions/push'

interface NavbarProps {
  userName: string
  role: string
}

export default function Navbar({ userName, role }: NavbarProps) {
  const router = useRouter()
  const pathname = usePathname()
  const supabase = createClient()

  // Profile info
  const [profile, setProfile] = useState<{ full_name: string | null; avatar_url: string | null } | null>(null)
  
  // Real-time notifications state
  const [notifications, setNotifications] = useState<any[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [isNotiOpen, setIsNotiOpen] = useState(false)
  const [toast, setToast] = useState<{ title: string; content: string } | null>(null)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  // Fetch initial profile & notifications
  useEffect(() => {
    async function getProfileAndNotifications() {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        // 1. Fetch Profile
        const { data: profileData } = await supabase
          .from('profiles')
          .select('full_name, avatar_url')
          .eq('id', user.id)
          .single()
        if (profileData) {
          setProfile(profileData)
        }

        // 2. Fetch Notifications
        const res = await getUserNotifications()
        if (res.notifications) {
          setNotifications(res.notifications)
          const unread = res.notifications.filter((n: any) => !n.is_read).length
          setUnreadCount(unread)
        }

        // 3. Request background notification permission (silent request if not set)
        if ('Notification' in window && Notification.permission === 'granted') {
          try {
            if ('serviceWorker' in navigator && 'PushManager' in window) {
              const reg = await navigator.serviceWorker.ready
              const PUBLIC_VAPID_KEY = 'BCZY4R7Mpz3u_LQ39j-Mfm0J9-RFvZ9-rRjeQWuEVKcXd-4fxCq2l485VsWc51rVqoE-mHxCvlMu0O7YejpfSz0'
              const padding = '='.repeat((4 - PUBLIC_VAPID_KEY.length % 4) % 4)
              const base64 = (PUBLIC_VAPID_KEY + padding).replace(/\-/g, '+').replace(/_/g, '/')
              const rawData = window.atob(base64)
              const outputArray = new Uint8Array(rawData.length)
              for (let i = 0; i < rawData.length; ++i) {
                outputArray[i] = rawData.charCodeAt(i)
              }

              let sub = await reg.pushManager.getSubscription()
              if (!sub) {
                sub = await reg.pushManager.subscribe({
                  userVisibleOnly: true,
                  applicationServerKey: outputArray
                })
              }

              if (sub) {
                const subJson = sub.toJSON()
                if (subJson.endpoint && subJson.keys?.p256dh && subJson.keys?.auth) {
                  await savePushSubscription({
                    endpoint: subJson.endpoint,
                    keys: {
                      p256dh: subJson.keys.p256dh,
                      auth: subJson.keys.auth
                    }
                  })
                }
              }
            }
          } catch (err) {
            console.error('Auto push subscription failed:', err)
          }
        }
      }
    }
    
    getProfileAndNotifications()

    // Listen for custom profile update events
    const handleProfileUpdate = () => {
      getProfileAndNotifications()
    }
    window.addEventListener('profile-updated', handleProfileUpdate)
    return () => {
      window.removeEventListener('profile-updated', handleProfileUpdate)
    }
  }, [])

  // Supabase Real-time Notification listener
  useEffect(() => {
    let channel: any = null

    async function setupRealtime() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      channel = supabase
        .channel(`realtime-notifications:${user.id}`)
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'notifications',
            filter: `user_id=eq.${user.id}`
          },
          (payload) => {
            const newNoti = payload.new
            setNotifications(prev => [newNoti, ...prev])
            setUnreadCount(prev => prev + 1)

             // Get local audio & visual configurations
             const soundType = localStorage.getItem('noti_sound_type') || 'bell'
             const soundVolume = parseFloat(localStorage.getItem('noti_sound_volume') || '0.5')
             const showPopup = localStorage.getItem('noti_show_popup') !== 'false'
             const vibrateEnabled = localStorage.getItem('noti_vibrate') !== 'false'
 
             // Play synthesized ringtone
             playNotificationSound(soundType, soundVolume)

             // Vibrate device if enabled
             if (vibrateEnabled && 'vibrate' in navigator) {
               navigator.vibrate([200, 100, 200])
             }
 
             // Trigger sliding Toast Popup
             if (showPopup) {
               setToast({ title: newNoti.title, content: newNoti.content })
               // Auto dismiss after 6 seconds
               setTimeout(() => {
                 setToast(null)
               }, 6000)
             }
 
             // System Banner Notification (Works foreground/background on phone PWA and desktop)
             if ('Notification' in window && Notification.permission === 'granted') {
               try {
                 if (navigator.serviceWorker && navigator.serviceWorker.controller) {
                   navigator.serviceWorker.ready.then(reg => {
                     reg.showNotification(newNoti.title, {
                       body: newNoti.content,
                       icon: '/icons/icon-192x192.png',
                       badge: '/icons/icon-192x192.png',
                       vibrate: vibrateEnabled ? [200, 100, 200, 100, 200] : undefined,
                       tag: 'booking-alert',
                       renotify: true,
                       actions: [
                         { action: 'open-app', title: '👉 ดูรายละเอียด' }
                       ],
                       data: { url: '/dashboard' }
                     } as any)
                   })
                } else {
                  new Notification(newNoti.title, {
                    body: newNoti.content,
                    icon: '/icons/icon-192x192.png'
                  })
                }
              } catch (err) {
                console.error('System notification error:', err)
              }
            }
          }
        )
        .subscribe()
    }

    setupRealtime()

    return () => {
      if (channel) {
        supabase.removeChannel(channel)
      }
    }
  }, [])

  // Pre-meeting reminder engine (Checks for upcoming meetings and alerts)
  useEffect(() => {
    let reminderInterval: NodeJS.Timeout | null = null

    async function setupReminderEngine() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      // 1. Fetch system reminder setting (reminder_before_minutes)
      let reminderMins = 15
      const { data: settingData } = await supabase
        .from('system_settings')
        .select('value')
        .eq('key', 'reminder_before_minutes')
        .single()
      if (settingData?.value !== undefined) {
        reminderMins = Number(settingData.value)
      }

      // If pre-meeting warning is disabled (0), don't start the engine
      if (reminderMins <= 0) return

      // 2. Load upcoming approved bookings
      const checkAndRemind = async () => {
        const now = new Date()
        const oneHourAgo = new Date(now.getTime() - 3600000)

        // Fetch bookings starting from 1 hour ago (to handle ongoing or very near bookings)
        const { data: bookingsData } = await supabase
          .from('bookings')
          .select('id, start_time, rooms ( name )')
          .eq('user_id', user.id)
          .eq('status', 'approved')
          .gte('start_time', oneHourAgo.toISOString())

        if (!bookingsData || bookingsData.length === 0) return

        const soundType = localStorage.getItem('reminder_sound_type') || 'chime'
        const soundVolume = parseFloat(localStorage.getItem('noti_sound_volume') || '0.5')
        const showPopup = localStorage.getItem('noti_show_popup') !== 'false'
        const vibrateEnabled = localStorage.getItem('noti_vibrate') !== 'false'

        // Get already notified bookings to prevent duplicate alerts
        let notifiedList: string[] = []
        try {
          const stored = localStorage.getItem('notified_bookings')
          if (stored) {
            notifiedList = JSON.parse(stored)
          }
        } catch (e) {
          console.error('Failed to parse notified_bookings:', e)
        }

        let updatedNotified = [...notifiedList]
        let hasNewNotification = false

        for (const booking of bookingsData) {
          if (notifiedList.includes(booking.id)) continue

          const startTime = new Date(booking.start_time)
          const diffMs = startTime.getTime() - now.getTime()
          const diffMins = Math.floor(diffMs / 60000)

          // If the booking is in the future and starts within the reminder window
          if (diffMins >= 0 && diffMins <= reminderMins) {
            hasNewNotification = true
            updatedNotified.push(booking.id)

            const roomName = (booking.rooms as any)?.name || 'ห้องประชุม'
            const formattedTime = startTime.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit', hour12: false })
            const title = 'ห้องประชุมของคุณกำลังจะเริ่ม'
            const content = `ห้อง ${roomName} จะเริ่มประชุมในอีก ${diffMins} นาที (${formattedTime} น.)`

            // 1. Play sound
            playNotificationSound(soundType, soundVolume)

            // Vibrate if enabled
            if (vibrateEnabled && 'vibrate' in navigator) {
              navigator.vibrate([200, 100, 200])
            }

            // 2. Show in-app Toast
            if (showPopup) {
              setToast({ title, content })
            }

            // 3. Show System PWA banner notification if permissions granted
            if ('Notification' in window && Notification.permission === 'granted') {
              try {
                if (navigator.serviceWorker && navigator.serviceWorker.controller) {
                  navigator.serviceWorker.ready.then(reg => {
                    reg.showNotification(title, {
                      body: content,
                      icon: '/icons/icon-192x192.png',
                      badge: '/icons/icon-192x192.png',
                      vibrate: vibrateEnabled ? [200, 100, 200] : undefined,
                      tag: `booking-reminder-${booking.id}`,
                      renotify: true,
                      data: { url: '/dashboard' }
                    } as any)
                  })
                } else {
                  new Notification(title, {
                    body: content,
                    icon: '/icons/icon-192x192.png'
                  })
                }
              } catch (err) {
                console.error('System reminder notification error:', err)
              }
            }
          }
        }

        if (hasNewNotification) {
          localStorage.setItem('notified_bookings', JSON.stringify(updatedNotified))
        }
      }

      // Run immediately on setup
      checkAndRemind()

      // Then check every 30 seconds
      reminderInterval = setInterval(checkAndRemind, 30000)
    }

    setupReminderEngine()

    return () => {
      if (reminderInterval) {
        clearInterval(reminderInterval)
      }
    }
  }, [])

  // Manage layout offset class on body
  useEffect(() => {
    document.body.classList.add('has-sidebar')
    return () => {
      document.body.classList.remove('has-sidebar')
    }
  }, [])

  const getPageTitle = (path: string) => {
    switch (path) {
      case '/dashboard':
        return 'จองห้องประชุม'
      case '/dashboard/my-bookings':
        return 'การจองของฉัน'
      case '/manage':
        return 'การจองทั้งหมด'
      case '/manage/rooms':
        return 'จัดการห้องประชุม'
      case '/manage/users':
        return 'จัดการผู้ใช้งาน'
      case '/manage/settings':
        return 'ตั้งค่าระบบ'
      case '/profile':
        return 'โปรไฟล์ส่วนตัว'
      default:
        return 'ระบบจองห้องประชุม'
    }
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  const handleMarkAsRead = async (id: string) => {
    // Optimistic UI updates
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n))
    setUnreadCount(prev => Math.max(0, prev - 1))
    await markNotificationAsRead(id)
  }

  const handleMarkAllRead = async () => {
    setNotifications(prev => prev.map(n => ({ ...n, is_read: true })))
    setUnreadCount(0)
    await markAllNotificationsAsRead()
  }

  const formatRelativeTime = (isoString: string) => {
    const date = new Date(isoString)
    const diffMs = new Date().getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMins / 60)
    const diffDays = Math.floor(diffHours / 24)

    if (diffMins < 1) return 'เมื่อครู่นี้'
    if (diffMins < 60) return `${diffMins} นาทีที่แล้ว`
    if (diffHours < 24) return `${diffHours} ชม. ที่แล้ว`
    return `${diffDays} วันที่แล้ว`
  }

  const displayName = profile?.full_name || userName
  const allowedAdminRoles = ['admin', 'subadmin', 'admin booking', 'Housekeeper']
  const isAdminArea = allowedAdminRoles.includes(role)

  const renderBadge = () => {
    switch (role) {
      case 'admin':
        return (
          <span className="badge badge-admin" style={{ fontSize: '0.65rem', padding: '2px 8px' }}>
            <Shield size={10} style={{ marginRight: '2px' }} />
            ADMIN
          </span>
        )
      case 'subadmin':
        return (
          <span className="badge badge-subadmin" style={{ fontSize: '0.65rem', padding: '2px 8px' }}>
            <Shield size={10} style={{ marginRight: '2px' }} />
            SUB-ADMIN
          </span>
        )
      case 'admin booking':
        return (
          <span className="badge badge-booking-admin" style={{ fontSize: '0.65rem', padding: '2px 8px' }}>
            <Calendar size={10} style={{ marginRight: '2px' }} />
            BOOKING ADMIN
          </span>
        )
      case 'Housekeeper':
        return (
          <span className="badge badge-housekeeper" style={{ fontSize: '0.65rem', padding: '2px 8px' }}>
            <Home size={10} style={{ marginRight: '2px' }} />
            HOUSEKEEPER
          </span>
        )
      case 'teacher':
        return (
          <span className="badge badge-teacher" style={{ fontSize: '0.65rem', padding: '2px 8px' }}>
            <User size={10} style={{ marginRight: '2px' }} />
            TEACHER
          </span>
        )
      default:
        return (
          <span className="badge badge-user" style={{ fontSize: '0.65rem', padding: '2px 8px' }}>
            <User size={10} style={{ marginRight: '2px' }} />
            USER
          </span>
        )
    }
  }

  return (
    <>
      {/* Sidebar Overlay */}
      <div 
        className={`sidebar-overlay ${isMobileMenuOpen ? 'open' : ''}`} 
        onClick={() => setIsMobileMenuOpen(false)} 
      />

      {/* Sidebar Navigation */}
      <aside className={`sidebar ${isMobileMenuOpen ? 'open' : ''}`}>
        <div className="sidebar-logo">
          <Calendar size={22} style={{ color: 'var(--primary)' }} />
          <span>PWK-ROOM BOOKING</span>
        </div>

        <div className="sidebar-profile">
          <div style={{
            width: '42px',
            height: '42px',
            borderRadius: '50%',
            background: 'rgba(255, 182, 193, 0.25)',
            border: '2px solid var(--primary)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            overflow: 'hidden',
            color: 'var(--primary)',
            fontSize: '1.1rem',
            fontWeight: 700,
            flexShrink: 0
          }}>
            {profile?.avatar_url ? (
              <img 
                src={profile.avatar_url} 
                alt="Avatar" 
                style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
              />
            ) : (
              <span>{displayName.charAt(0).toUpperCase()}</span>
            )}
          </div>
          <div className="sidebar-profile-info">
            <span className="sidebar-profile-name">{displayName}</span>
            <div style={{ marginTop: '2px' }}>{renderBadge()}</div>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', flex: 1, paddingBottom: '24px' }}>
          <div className="sidebar-section-title">เมนูหลัก</div>
          <Link href="/dashboard" className={`sidebar-link ${pathname === '/dashboard' ? 'active' : ''}`} onClick={() => setIsMobileMenuOpen(false)}>
            <Calendar size={18} />
            <span>จองห้องประชุม</span>
          </Link>
          <Link href="/dashboard/my-bookings" className={`sidebar-link ${pathname === '/dashboard/my-bookings' ? 'active' : ''}`} onClick={() => setIsMobileMenuOpen(false)}>
            <LayoutDashboard size={18} />
            <span>การจองของฉัน</span>
          </Link>

          {isAdminArea && (
            <>
              <div className="sidebar-section-title">ผู้ดูแลระบบ</div>
              <Link href="/manage" className={`sidebar-link ${pathname === '/manage' ? 'active' : ''}`} onClick={() => setIsMobileMenuOpen(false)}>
                <LayoutDashboard size={18} />
                <span>การจองทั้งหมด</span>
              </Link>
              {['admin', 'subadmin'].includes(role) && (
                <Link href="/manage/rooms" className={`sidebar-link ${pathname === '/manage/rooms' ? 'active' : ''}`} onClick={() => setIsMobileMenuOpen(false)}>
                  <ListPlus size={18} />
                  <span>จัดการห้องประชุม</span>
                </Link>
              )}
              {role === 'admin' && (
                <Link href="/manage/users" className={`sidebar-link ${pathname === '/manage/users' ? 'active' : ''}`} onClick={() => setIsMobileMenuOpen(false)}>
                  <Users size={18} />
                  <span>จัดการผู้ใช้งาน</span>
                </Link>
              )}
              {['admin', 'subadmin'].includes(role) && (
                <Link href="/manage/settings" className={`sidebar-link ${pathname === '/manage/settings' ? 'active' : ''}`} onClick={() => setIsMobileMenuOpen(false)}>
                  <Shield size={18} />
                  <span>ตั้งค่าระบบ</span>
                </Link>
              )}
            </>
          )}

          <div className="sidebar-section-title">ข้อมูลส่วนตัว</div>
          <Link href="/profile" className={`sidebar-link ${pathname === '/profile' ? 'active' : ''}`} onClick={() => setIsMobileMenuOpen(false)}>
            <User size={18} />
            <span>โปรไฟล์ส่วนตัว</span>
          </Link>
        </div>
      </aside>

      {/* Top Header Bar */}
      <header className="top-header">
        <div className="top-header-left">
          <button 
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} 
            className="sidebar-toggle-btn"
            aria-label="Toggle Sidebar"
          >
            <Menu size={20} />
          </button>
          <span className="top-header-title">{getPageTitle(pathname)}</span>
        </div>

        <div className="top-header-right">
          {/* Real-time Notifications Bell Dropdown */}
          <div style={{ position: 'relative' }}>
            <button 
              onClick={() => setIsNotiOpen(!isNotiOpen)} 
              className="btn btn-secondary" 
              style={{
                position: 'relative',
                padding: '8px',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: 'rgba(255, 182, 193, 0.12)',
                color: 'var(--primary)',
                border: 'none',
                cursor: 'pointer',
                width: '38px',
                height: '38px'
              }}
            >
              <Bell size={18} />
              {unreadCount > 0 && (
                <span style={{
                  position: 'absolute',
                  top: '-2px',
                  right: '-2px',
                  background: '#ff4d6d',
                  color: 'white',
                  borderRadius: '50%',
                  fontSize: '0.62rem',
                  fontWeight: 'bold',
                  width: '16px',
                  height: '16px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  border: '1.5px solid white'
                }}>
                  {unreadCount}
                </span>
              )}
            </button>

            {/* Notifications Panel */}
            {isNotiOpen && (
              <div className="glass-panel animate-fade-in" style={{
                position: 'absolute',
                top: '48px',
                right: '0',
                width: '320px',
                maxHeight: '400px',
                zIndex: 1000,
                padding: '16px',
                background: 'white',
                border: '1px solid rgba(0,0,0,0.06)',
                boxShadow: '0 10px 30px rgba(255,182,193,0.15)',
                display: 'flex',
                flexDirection: 'column',
                gap: '12px',
                borderRadius: '12px'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-color)', paddingBottom: '8px' }}>
                  <span style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--text-primary)' }}>การแจ้งเตือน</span>
                  {unreadCount > 0 && (
                    <button 
                      onClick={handleMarkAllRead} 
                      style={{ background: 'none', border: 'none', color: 'var(--primary)', fontSize: '0.75rem', fontWeight: 600, cursor: 'pointer' }}
                    >
                      อ่านทั้งหมด
                    </button>
                  )}
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', overflowY: 'auto', maxHeight: '280px', paddingRight: '4px' }}>
                  {notifications.length === 0 ? (
                    <div style={{ padding: '24px 0', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.75rem', fontStyle: 'italic' }}>
                      ไม่มีการแจ้งเตือน
                    </div>
                  ) : (
                    notifications.map((n) => (
                      <div 
                        key={n.id} 
                        onClick={() => handleMarkAsRead(n.id)}
                        style={{
                          padding: '10px 12px',
                          borderRadius: '8px',
                          background: n.is_read ? 'rgba(0,0,0,0.015)' : 'rgba(255, 182, 193, 0.08)',
                          border: n.is_read ? '1px solid var(--border-color)' : '1px solid rgba(255, 182, 193, 0.25)',
                          cursor: 'pointer',
                          position: 'relative',
                          transition: 'background 0.2s',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '4px'
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '8px' }}>
                          <span style={{ fontSize: '0.8rem', fontWeight: n.is_read ? 500 : 700, color: 'var(--text-primary)', display: 'block' }}>
                            {n.title}
                          </span>
                          {!n.is_read && (
                            <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#ff4d6d', flexShrink: 0, marginTop: '4px' }} />
                          )}
                        </div>
                        <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', margin: 0, lineHeight: 1.35 }}>
                          {n.content}
                        </p>
                        <div style={{ fontSize: '0.62rem', color: 'var(--text-muted)', textAlign: 'right' }}>
                          {formatRelativeTime(n.created_at)}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Quick Logout */}
          <button 
            onClick={handleLogout} 
            className="btn btn-secondary" 
            style={{ padding: '8px 16px', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            <LogOut size={14} />
            <span>ออก</span>
          </button>
        </div>
      </header>

      {/* Real-time In-App Notification Toast */}
      {toast && (
        <div 
          className="noti-toast-container animate-fade-in"
          style={{
            position: 'fixed',
            bottom: '20px',
            right: '20px',
            left: '20px',
            background: 'white',
            border: '1px solid rgba(255, 182, 193, 0.4)',
            borderLeft: '5px solid var(--primary)',
            borderRadius: '12px',
            boxShadow: '0 10px 30px rgba(0,0,0,0.15)',
            padding: '16px 20px',
            zIndex: 9999,
            display: 'flex',
            gap: '12px',
            alignItems: 'flex-start',
            animation: 'slideInNoti 0.3s ease-out'
          }}
        >
          <Bell size={20} style={{ color: 'var(--primary)', flexShrink: 0, marginTop: '2px' }} />
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 700, fontSize: '0.85rem', color: 'var(--text-primary)', marginBottom: '4px' }}>
              {toast.title}
            </div>
            <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', lineHeight: 1.35 }}>
              {toast.content}
            </div>
          </div>
          <button 
            onClick={() => setToast(null)} 
            style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', flexShrink: 0 }}
          >
            <X size={14} />
          </button>
        </div>
      )}

      <style dangerouslySetInnerHTML={{ __html: `
        .noti-toast-container {
          max-width: calc(100% - 40px);
        }
        @media (min-width: 576px) {
          .noti-toast-container {
            left: auto !important;
            width: 350px !important;
            right: 24px !important;
            bottom: 24px !important;
          }
        }
        @keyframes slideInNoti {
          from {
            transform: translateX(120%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
      ` }} />
    </>
  )
}
