'use client'

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

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  return (
    <nav className="navbar">
      <div className="nav-container">
        <Link href={role === 'admin' ? '/admin' : '/dashboard'} className="nav-brand">
          <Calendar size={24} />
          <span>BOOKING SPACE</span>
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
          </div>

          <div className="nav-user">
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '2px' }}>
              <span style={{ color: 'var(--text-primary)', fontSize: '0.9rem', fontWeight: 600 }}>
                {userName}
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
