'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/utils/supabase/client'
import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'
import { 
  LogOut, Calendar, Shield, User, LayoutDashboard, 
  ListPlus, Users, Home, Bell, X 
} from 'lucide-react'
import { playNotificationSound } from '@/utils/audio'
import { 
  getUserNotifications, 
  markNotificationAsRead, 
  markAllNotificationsAsRead 
} from '@/app/actions/notifications'

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
        if ('Notification' in window && Notification.permission === 'default') {
          // Only request if they interact or if we can (we check in Settings but good to have)
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

            // Play synthesized ringtone
            playNotificationSound(soundType, soundVolume)

            // Trigger sliding Toast Popup
            if (showPopup) {
              setToast({ title: newNoti.title, content: newNoti.content })
              // Auto dismiss after 6 seconds
              setTimeout(() => {
                setToast(null)
              }, 6000)
            }

            // System Background Notification (if window is hidden)
            if ('Notification' in window && Notification.permission === 'granted' && document.hidden) {
              new Notification(newNoti.title, {
                body: newNoti.content,
                icon: '/icons/icon-192x192.png',
                badge: '/icons/icon-192x192.png'
              })
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
    <nav className="navbar" style={{ position: 'relative', zIndex: 900 }}>
      <div className="nav-container">
        <Link href={isAdminArea ? '/manage' : '/dashboard'} className="nav-brand">
          <Calendar size={24} />
          <span>BOOKING PWK-ROOM</span>
        </Link>

        <div style={{ display: 'flex', gap: '24px', alignItems: 'center' }}>
          <div className="nav-menu">
            {isAdminArea ? (
              <>
                <Link 
                  href="/manage" 
                  className={`nav-link ${pathname === '/manage' ? 'active' : ''}`}
                  style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
                >
                  <LayoutDashboard size={16} />
                  การจองทั้งหมด
                </Link>
                {['admin', 'subadmin'].includes(role) && (
                  <Link 
                    href="/manage/rooms" 
                    className={`nav-link ${pathname === '/manage/rooms' ? 'active' : ''}`}
                    style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
                  >
                    <ListPlus size={16} />
                    จัดการห้องประชุม
                  </Link>
                )}
                {role === 'admin' && (
                  <>
                    <Link 
                      href="/manage/users" 
                      className={`nav-link ${pathname === '/manage/users' ? 'active' : ''}`}
                      style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
                    >
                      <Users size={16} />
                      จัดการผู้ใช้งาน
                    </Link>
                    <Link 
                      href="/manage/settings" 
                      className={`nav-link ${pathname === '/manage/settings' ? 'active' : ''}`}
                      style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
                    >
                      <Shield size={16} />
                      ตั้งค่าระบบ
                    </Link>
                  </>
                )}
              </>
            ) : (
              <>
                <Link 
                  href="/dashboard" 
                  className={`nav-link ${pathname === '/dashboard' ? 'active' : ''}`}
                  style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
                >
                  <Calendar size={16} />
                  จองห้องประชุม
                </Link>
                <Link 
                  href="/dashboard/my-bookings" 
                  className={`nav-link ${pathname === '/dashboard/my-bookings' ? 'active' : ''}`}
                  style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
                >
                  <LayoutDashboard size={16} />
                  การจองของฉัน
                </Link>
              </>
            )}
            <Link 
              href="/profile" 
              className={`nav-link ${pathname === '/profile' ? 'active' : ''}`}
              style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
            >
              <User size={16} />
              โปรไฟล์
            </Link>
          </div>

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

          <div className="nav-user">
            <Link href="/profile" className="nav-profile-link" style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '12px',
              textDecoration: 'none',
              padding: '6px 10px',
              borderRadius: '8px',
              transition: 'all 0.2s ease',
            }}>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '2px' }}>
                <span style={{ color: 'var(--text-primary)', fontSize: '0.9rem', fontWeight: 600 }}>
                  {displayName}
                </span>
                {renderBadge()}
              </div>

              {/* Avatar Circle */}
              <div style={{
                width: '38px',
                height: '38px',
                borderRadius: '50%',
                background: 'rgba(255, 182, 193, 0.25)',
                border: '2px solid var(--primary)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                overflow: 'hidden',
                color: 'var(--primary)',
                fontSize: '1rem',
                fontWeight: 700,
                flexShrink: 0,
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
            </Link>

            <button 
              onClick={handleLogout} 
              className="btn btn-secondary" 
              style={{ padding: '8px 12px', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '6px' }}
            >
              <LogOut size={14} />
              <span>ออก</span>
            </button>
          </div>
        </div>
      </div>

      {/* Real-time In-App Notification Toast */}
      {toast && (
        <div style={{
          position: 'fixed',
          bottom: '24px',
          right: '24px',
          background: 'white',
          border: '1px solid rgba(255, 182, 193, 0.4)',
          borderLeft: '5px solid var(--primary)',
          borderRadius: '12px',
          boxShadow: '0 10px 30px rgba(0,0,0,0.15)',
          padding: '16px 20px',
          zIndex: 9999,
          maxWidth: '350px',
          display: 'flex',
          gap: '12px',
          alignItems: 'flex-start',
          animation: 'slideInNoti 0.3s ease-out'
        }}>
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

      <style jsx global>{`
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
      `}</style>
    </nav>
  )
}
