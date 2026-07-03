'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/utils/supabase/client'
import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'
import { LogOut, Calendar, Shield, User, LayoutDashboard, ListPlus } from 'lucide-react'

interface NavbarProps {
  userName: string
  role: string
}

export default function Navbar({ userName, role }: NavbarProps) {
  const router = useRouter()
  const pathname = usePathname()
  const supabase = createClient()

  const [profile, setProfile] = useState<{ full_name: string | null; avatar_url: string | null } | null>(null)

  useEffect(() => {
    async function getProfile() {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const { data } = await supabase
          .from('profiles')
          .select('full_name, avatar_url')
          .eq('id', user.id)
          .single()
        if (data) {
          setProfile(data)
        }
      }
    }
    getProfile()

    // Listen for custom profile update events to reload navbar details instantly
    const handleProfileUpdate = () => {
      getProfile()
    }
    window.addEventListener('profile-updated', handleProfileUpdate)
    return () => {
      window.removeEventListener('profile-updated', handleProfileUpdate)
    }
  }, [])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  const displayName = profile?.full_name || userName

  return (
    <nav className="navbar">
      <div className="nav-container">
        <Link href={role === 'admin' ? '/admin' : '/dashboard'} className="nav-brand">
          <Calendar size={24} />
          <span>BOOKING PWK-ROOM</span>
        </Link>

        <div style={{ display: 'flex', gap: '24px', alignItems: 'center' }}>
          <div className="nav-menu">
            {role === 'admin' ? (
              <>
                <Link 
                  href="/admin" 
                  className={`nav-link ${pathname === '/admin' ? 'active' : ''}`}
                  style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
                >
                  <LayoutDashboard size={16} />
                  การจองทั้งหมด
                </Link>
                <Link 
                  href="/admin/rooms" 
                  className={`nav-link ${pathname === '/admin/rooms' ? 'active' : ''}`}
                  style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
                >
                  <ListPlus size={16} />
                  จัดการห้องประชุม
                </Link>
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
                {role === 'admin' ? (
                  <span className="badge badge-admin" style={{ fontSize: '0.65rem', padding: '2px 8px' }}>
                    <Shield size={10} style={{ marginRight: '2px' }} />
                    ADMIN
                  </span>
                ) : (
                  <span className="badge badge-user" style={{ fontSize: '0.65rem', padding: '2px 8px' }}>
                    <User size={10} style={{ marginRight: '2px' }} />
                    USER
                  </span>
                )}
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
    </nav>
  )
}
