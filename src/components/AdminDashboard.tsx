'use client'

import { useState } from 'react'
import { updateBookingStatus } from '@/app/actions/bookings'
import { 
  Calendar, Clock, User, Mail, Check, X, AlertCircle, 
  FileText, CheckSquare, XSquare, ShieldAlert, List, CalendarDays 
} from 'lucide-react'
import AlertModal from '@/components/AlertModal'

interface BookingItem {
  id: string
  created_at: string
  start_time: string
  end_time: string
  purpose: string
  status: string
  rejection_reason: string | null
  roomName: string
  roomLocation: string
  userFullName: string
  userEmail: string
}

interface AdminDashboardProps {
  bookings: BookingItem[]
  userRole?: string
}

// Predefined list of beautiful pastel room colors (background & border & text)
const getRoomColors = (roomName: string) => {
  const colors = [
    { bg: 'rgba(255, 182, 193, 0.15)', text: 'HSL(345, 90%, 60%)', border: 'rgba(255, 182, 193, 0.35)' }, // Pastel Pink
    { bg: 'rgba(173, 216, 230, 0.15)', text: 'HSL(195, 90%, 50%)', border: 'rgba(173, 216, 230, 0.35)' }, // Pastel Light Blue
    { bg: 'rgba(152, 251, 152, 0.15)', text: 'HSL(120, 65%, 42%)', border: 'rgba(152, 251, 152, 0.35)' }, // Pastel Mint Green
    { bg: 'rgba(238, 130, 238, 0.15)', text: 'HSL(300, 65%, 55%)', border: 'rgba(238, 130, 238, 0.35)' }, // Pastel Violet
    { bg: 'rgba(255, 222, 173, 0.15)', text: 'HSL(35, 85%, 50%)', border: 'rgba(255, 222, 173, 0.35)' },  // Pastel Orange/Peach
    { bg: 'rgba(127, 255, 212, 0.15)', text: 'HSL(160, 75%, 38%)', border: 'rgba(127, 255, 212, 0.35)' }, // Pastel Turquoise
    { bg: 'rgba(219, 112, 147, 0.15)', text: 'HSL(340, 65%, 50%)', border: 'rgba(219, 112, 147, 0.35)' }, // Pastel Pale Red
    { bg: 'rgba(240, 230, 140, 0.15)', text: 'HSL(54, 70%, 42%)', border: 'rgba(240, 230, 140, 0.35)' },  // Pastel Khaki/Yellow
  ]
  
  // Basic hashing function to ensure consistent colors for each room name
  let hash = 0
  for (let i = 0; i < roomName.length; i++) {
    hash = roomName.charCodeAt(i) + ((hash << 5) - hash)
  }
  const idx = Math.abs(hash) % colors.length
  return colors[idx]
}

export default function AdminDashboard({ bookings, userRole }: AdminDashboardProps) {
  const [viewMode, setViewMode] = useState<'list' | 'calendar'>('list')
  const [filter, setFilter] = useState<string>('all')
  const [loadingId, setLoadingId] = useState<string | null>(null)
  
  // Rejection modal state
  const [rejectingId, setRejectingId] = useState<string | null>(null)
  const [rejectionReason, setRejectionReason] = useState('')

  // Day selection modal state
  const [selectedDayBookings, setSelectedDayBookings] = useState<{ date: Date; items: BookingItem[] } | null>(null)
  const [alertConfig, setAlertConfig] = useState<{ type: 'success' | 'error' | 'warning' | 'info'; title: string; message: string } | null>(null)

  // Monthly Navigation State
  const [currentDate, setCurrentDate] = useState(new Date())
  const year = currentDate.getFullYear()
  const month = currentDate.getMonth()

  // Calculate statistics
  const total = bookings.length
  const pending = bookings.filter(b => b.status === 'pending').length
  const approved = bookings.filter(b => b.status === 'approved').length
  const cancelled = bookings.filter(b => b.status === 'cancelled' || b.status === 'rejected').length

  const filteredBookings = bookings.filter((b) => {
    if (filter === 'all') return true
    return b.status === filter
  })

  // Monthly Calendar logic
  const handlePrevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1))
  }

  const handleNextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1))
  }

  const handleGoToday = () => {
    setCurrentDate(new Date())
  }

  const getDaysInMonth = () => {
    const firstDay = new Date(year, month, 1)
    const startDayOfWeek = firstDay.getDay() // 0 = Sun, 1 = Mon...
    const totalDays = new Date(year, month + 1, 0).getDate()
    const totalDaysPrev = new Date(year, month, 0).getDate()

    const cells = []

    // 1. Previous month padding cells
    for (let i = startDayOfWeek - 1; i >= 0; i--) {
      cells.push({
        date: new Date(year, month - 1, totalDaysPrev - i),
        isCurrentMonth: false
      })
    }

    // 2. Current month cells
    for (let i = 1; i <= totalDays; i++) {
      cells.push({
        date: new Date(year, month, i),
        isCurrentMonth: true
      })
    }

    // 3. Next month padding cells to round to 42 cells (6 rows)
    const remaining = 42 - cells.length
    for (let i = 1; i <= remaining; i++) {
      cells.push({
        date: new Date(year, month + 1, i),
        isCurrentMonth: false
      })
    }

    return cells
  }

  const isSameDate = (date1: Date, date2Str: string) => {
    const date2 = new Date(date2Str)
    return date1.getFullYear() === date2.getFullYear() &&
           date1.getMonth() === date2.getMonth() &&
           date1.getDate() === date2.getDate()
  }

  const THAI_MONTHS = [
    'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน',
    'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'
  ]

  const handleApprove = async (id: string) => {
    if (!confirm('ยืนยันการอนุมัติการจองห้องประชุมนี้?')) return
    setLoadingId(id)
    const res = await updateBookingStatus(id, 'approved')
    setLoadingId(null)
    if (res.error) {
      setAlertConfig({ type: 'error', title: 'อนุมัติไม่สำเร็จ', message: res.error })
    } else {
      setAlertConfig({ type: 'success', title: 'อนุมัติสำเร็จ', message: 'อนุมัติการจองห้องประชุมเรียบร้อยแล้ว' })
      // If we are currently showing details modal, update it dynamically
      if (selectedDayBookings) {
        setSelectedDayBookings(prev => {
          if (!prev) return null
          return {
            ...prev,
            items: prev.items.map(item => item.id === id ? { ...item, status: 'approved' } : item)
          }
        })
      }
    }
  }

  const handleRejectSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!rejectingId) return
    if (!rejectionReason.trim()) {
      setAlertConfig({ type: 'warning', title: 'ระบุเหตุผล', message: 'กรุณากรอกเหตุผลในการปฏิเสธการจอง' })
      return
    }

    setLoadingId(rejectingId)
    const res = await updateBookingStatus(rejectingId, 'rejected', rejectionReason)
    setLoadingId(null)
    
    if (res.error) {
      setAlertConfig({ type: 'error', title: 'ปฏิเสธไม่สำเร็จ', message: res.error })
    } else {
      setAlertConfig({ type: 'success', title: 'ปฏิเสธการจองสำเร็จ', message: 'ปฏิเสธการจองห้องประชุมนี้เรียบร้อยแล้ว' })
      const currentId = rejectingId
      setRejectingId(null)
      setRejectionReason('')
      // If we are currently showing details modal, update it dynamically
      if (selectedDayBookings) {
        setSelectedDayBookings(prev => {
          if (!prev) return null
          return {
            ...prev,
            items: prev.items.map(item => item.id === currentId ? { ...item, status: 'rejected', rejection_reason: rejectionReason } : item)
          }
        })
      }
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved':
        return <span className="badge badge-approved">อนุมัติแล้ว</span>
      case 'rejected':
        return <span className="badge badge-rejected">ปฏิเสธแล้ว</span>
      case 'cancelled':
        return <span className="badge badge-cancelled">ยกเลิกแล้ว</span>
      default:
        return <span className="badge badge-pending">รออนุมัติ</span>
    }
  }

  const formatDate = (isoString: string) => {
    const d = new Date(isoString)
    return d.toLocaleDateString('th-TH', { day: 'numeric', month: 'long', year: 'numeric' })
  }

  const formatTime = (isoString: string) => {
    const d = new Date(isoString)
    return d.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit', hour12: false })
  }

  return (
    <div style={{ marginTop: '24px' }}>
      
      {/* Role Banner warnings */}
      {userRole === 'Housekeeper' && (
        <div style={{
          background: 'rgba(16, 185, 129, 0.08)',
          border: '1px solid rgba(16, 185, 129, 0.25)',
          borderRadius: '12px',
          color: 'var(--text-primary)',
          padding: '16px 20px',
          marginBottom: '24px',
          display: 'flex',
          alignItems: 'center',
          gap: '12px'
        }}>
          <ShieldAlert size={20} style={{ color: 'var(--success)' }} />
          <div>
            <strong style={{ display: 'block', fontSize: '0.95rem', marginBottom: '2px', color: 'var(--success)' }}>
              สิทธิ์การใช้งาน: แม่บ้าน / ผู้ดูแลความสะอาด (ดูอย่างเดียว)
            </strong>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
              คุณสามารถตรวจสอบรายการจองห้องประชุมทั้งหมดเพื่อใช้วางแผนการทำความสะอาดและจัดเตรียมห้องได้เท่านั้น ไม่สามารถอนุมัติหรือปฏิเสธคำขอได้
            </span>
          </div>
        </div>
      )}

      {userRole === 'admin booking' && (
        <div style={{
          background: 'rgba(59, 130, 246, 0.08)',
          border: '1px solid rgba(59, 130, 246, 0.25)',
          borderRadius: '12px',
          color: 'var(--text-primary)',
          padding: '16px 20px',
          marginBottom: '24px',
          display: 'flex',
          alignItems: 'center',
          gap: '12px'
        }}>
          <ShieldAlert size={20} style={{ color: 'var(--primary)' }} />
          <div>
            <strong style={{ display: 'block', fontSize: '0.95rem', marginBottom: '2px', color: 'var(--primary)' }}>
              สิทธิ์การใช้งาน: ผู้ดูแลการจอง (Booking Admin)
            </strong>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
              คุณสามารถอนุมัติหรือปฏิเสธคำขอจองห้องประชุมได้เท่านั้น ไม่สามารถจัดการข้อมูลห้องประชุมหรือสมาชิกในระบบได้
            </span>
          </div>
        </div>
      )}

      {/* Statistics Banner */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
        gap: '20px',
        marginBottom: '32px'
      }}>
        <div className="glass-panel animate-fade-in" style={{ padding: '24px', borderLeft: '4px solid var(--primary)' }}>
          <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem', fontWeight: 600, textTransform: 'uppercase', marginBottom: '8px' }}>รายการจองทั้งหมด</div>
          <div style={{ fontSize: '2rem', fontWeight: 800 }}>{total}</div>
        </div>

        <div className="glass-panel animate-fade-in" style={{ padding: '24px', borderLeft: '4px solid var(--warning)', animationDelay: '0.05s' }}>
          <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem', fontWeight: 600, textTransform: 'uppercase', marginBottom: '8px' }}>รออนุมัติ</div>
          <div style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--warning)' }}>{pending}</div>
        </div>

        <div className="glass-panel animate-fade-in" style={{ padding: '24px', borderLeft: '4px solid var(--success)', animationDelay: '0.1s' }}>
          <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem', fontWeight: 600, textTransform: 'uppercase', marginBottom: '8px' }}>อนุมัติแล้ว</div>
          <div style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--success)' }}>{approved}</div>
        </div>

        <div className="glass-panel animate-fade-in" style={{ padding: '24px', borderLeft: '4px solid var(--danger)', animationDelay: '0.15s' }}>
          <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem', fontWeight: 600, textTransform: 'uppercase', marginBottom: '8px' }}>ปฏิเสธ/ยกเลิก</div>
          <div style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--danger)' }}>{cancelled}</div>
        </div>
      </div>

      {/* Main View Mode Selector */}
      <div className="glass-panel" style={{
        padding: '12px 20px',
        marginBottom: '24px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '16px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <CalendarDays size={20} style={{ color: 'var(--primary)' }} />
          <h2 style={{ fontSize: '1.2rem', fontWeight: 700 }}>ปฏิทินงานและการอนุมัติจอง</h2>
        </div>
        
        <div style={{ display: 'flex', gap: '8px', background: 'rgba(0,0,0,0.03)', padding: '4px', borderRadius: '8px' }}>
          <button
            onClick={() => setViewMode('list')}
            className="btn"
            style={{
              padding: '6px 12px',
              fontSize: '0.85rem',
              borderRadius: '6px',
              background: viewMode === 'list' ? 'white' : 'transparent',
              color: viewMode === 'list' ? 'var(--primary)' : 'var(--text-secondary)',
              border: 'none',
              boxShadow: viewMode === 'list' ? '0 2px 8px rgba(0,0,0,0.05)' : 'none',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <List size={14} />
            <span>รูปแบบรายการ</span>
          </button>
          <button
            onClick={() => setViewMode('calendar')}
            className="btn"
            style={{
              padding: '6px 12px',
              fontSize: '0.85rem',
              borderRadius: '6px',
              background: viewMode === 'calendar' ? 'white' : 'transparent',
              color: viewMode === 'calendar' ? 'var(--primary)' : 'var(--text-secondary)',
              border: 'none',
              boxShadow: viewMode === 'calendar' ? '0 2px 8px rgba(0,0,0,0.05)' : 'none',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <CalendarDays size={14} />
            <span>ปฏิทินรายเดือน</span>
          </button>
        </div>
      </div>

      {/* VIEW CONDITIONAL RENDERING */}
      {viewMode === 'list' ? (
        <>
          {/* Filter Tabs (Only shown in List View) */}
          <div style={{
            display: 'flex',
            gap: '8px',
            overflowX: 'auto',
            paddingBottom: '12px',
            marginBottom: '24px',
            borderBottom: '1px solid var(--border-color)'
          }}>
            {[
              { key: 'all', label: 'ทั้งหมด' },
              { key: 'pending', label: 'รออนุมัติ' },
              { key: 'approved', label: 'อนุมัติแล้ว' },
              { key: 'rejected', label: 'ปฏิเสธแล้ว' },
              { key: 'cancelled', label: 'ยกเลิกแล้ว' }
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => setFilter(tab.key)}
                className="btn"
                style={{
                  padding: '8px 16px',
                  fontSize: '0.85rem',
                  borderRadius: '8px',
                  background: filter === tab.key ? 'var(--primary)' : 'rgba(255,255,255,0.03)',
                  color: filter === tab.key ? 'white' : 'var(--text-secondary)',
                  border: filter === tab.key ? 'none' : '1px solid var(--border-color)',
                  boxShadow: filter === tab.key ? '0 4px 10px rgba(255, 182, 193, 0.4)' : 'none'
                }}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Bookings List */}
          {filteredBookings.length === 0 ? (
            <div className="glass-panel" style={{ padding: '48px', textAlign: 'center', color: 'var(--text-muted)' }}>
              ไม่พบข้อมูลรายการจองห้องประชุม
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {filteredBookings.map((b) => (
                <div key={b.id} className="glass-panel animate-fade-in" style={{ padding: '24px', border: '1px solid rgba(255,255,255,0.06)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px', marginBottom: '16px' }}>
                    <div>
                      <h3 style={{ fontSize: '1.2rem', marginBottom: '4px' }}>{b.roomName}</h3>
                      <div style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '8px' }}>
                        {b.roomLocation}
                      </div>
                      
                      {/* User Profile Info */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap', marginTop: '8px' }}>
                        <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                          <User size={12} style={{ color: 'var(--primary)' }} />
                          ผู้จอง: <strong>{b.userFullName}</strong>
                        </span>
                        <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                          <Mail size={12} />
                          {b.userEmail}
                        </span>
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      {getStatusBadge(b.status)}

                      {/* Actions for Pending */}
                      {b.status === 'pending' && userRole !== 'Housekeeper' && (
                        <div style={{ display: 'flex', gap: '8px' }}>
                          <button
                            onClick={() => handleApprove(b.id)}
                            disabled={loadingId !== null}
                            className="btn btn-primary"
                            style={{
                              padding: '6px 12px',
                              fontSize: '0.8rem',
                              background: 'linear-gradient(135deg, var(--success), #16a34a)',
                              boxShadow: 'none'
                            }}
                          >
                            <Check size={14} />
                            <span>อนุมัติ</span>
                          </button>
                          <button
                            onClick={() => {
                              setRejectingId(b.id)
                              setRejectionReason('')
                            }}
                            disabled={loadingId !== null}
                            className="btn btn-danger"
                            style={{ padding: '6px 12px', fontSize: '0.8rem', boxShadow: 'none' }}
                          >
                            <X size={14} />
                            <span>ปฏิเสธ</span>
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Detail Grid */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', padding: '16px', background: 'rgba(0,0,0,0.01)', border: '1px solid rgba(0,0,0,0.03)', borderRadius: '8px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <Calendar size={16} style={{ color: 'var(--primary)' }} />
                      <div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>วันที่ขอใช้งาน</div>
                        <div style={{ fontSize: '0.9rem', fontWeight: 500 }}>{formatDate(b.start_time)}</div>
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <Clock size={16} style={{ color: 'var(--primary)' }} />
                      <div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>เวลา</div>
                        <div style={{ fontSize: '0.9rem', fontWeight: 500 }}>
                          {formatTime(b.start_time)} - {formatTime(b.end_time)} น.
                        </div>
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <FileText size={16} style={{ color: 'var(--primary)' }} />
                      <div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>วัตถุประสงค์</div>
                        <div style={{ fontSize: '0.9rem', fontWeight: 500 }}>{b.purpose}</div>
                      </div>
                    </div>
                  </div>

                  {/* Rejection Details */}
                  {b.status === 'rejected' && b.rejection_reason && (
                    <div style={{ marginTop: '16px', background: 'rgba(239, 68, 68, 0.05)', border: '1px solid rgba(239, 68, 68, 0.1)', color: 'var(--danger)', padding: '12px 16px', borderRadius: '8px', fontSize: '0.85rem' }}>
                      <strong>เหตุผลการปฏิเสธ:</strong> {b.rejection_reason}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </>
      ) : (
        /* MONTHLY CALENDAR VIEW */
        <div className="glass-panel" style={{ padding: '24px' }}>
          
          {/* Calendar Header / Navigation */}
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '24px',
            flexWrap: 'wrap',
            gap: '12px'
          }}>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button onClick={handlePrevMonth} className="btn btn-secondary" style={{ padding: '6px 12px', fontSize: '0.85rem' }}>
                ◀ เดือนก่อนหน้า
              </button>
              <button onClick={handleGoToday} className="btn btn-secondary" style={{ padding: '6px 12px', fontSize: '0.85rem' }}>
                วันนี้
              </button>
              <button onClick={handleNextMonth} className="btn btn-secondary" style={{ padding: '6px 12px', fontSize: '0.85rem' }}>
                เดือนถัดไป ▶
              </button>
            </div>
            
            <h3 style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--primary)', margin: 0 }}>
              {THAI_MONTHS[month]} {year + 543}
            </h3>
          </div>

          {/* Weekdays Header */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(7, 1fr)',
            gap: '8px',
            textAlign: 'center',
            marginBottom: '8px',
            fontWeight: 700,
            fontSize: '0.85rem',
            color: 'var(--text-secondary)'
          }}>
            {['อาทิตย์', 'จันทร์', 'อังคาร', 'พุธ', 'พฤหัสบดี', 'ศุกร์', 'เสาร์'].map((day, idx) => (
              <div 
                key={idx} 
                style={{ 
                  padding: '8px 0', 
                  background: idx === 0 || idx === 6 ? 'rgba(255, 182, 193, 0.08)' : 'rgba(0,0,0,0.02)',
                  borderRadius: '6px',
                  color: idx === 0 ? 'var(--danger)' : idx === 6 ? 'var(--primary)' : 'var(--text-secondary)'
                }}
              >
                {day}
              </div>
            ))}
          </div>

          {/* Calendar Days Grid */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(7, 1fr)',
            gap: '8px'
          }}>
            {getDaysInMonth().map((cell, idx) => {
              const dayBookings = bookings.filter(b => isSameDate(cell.date, b.start_time))
              const isToday = isSameDate(cell.date, new Date().toISOString())
              
              return (
                <div 
                  key={idx} 
                  style={{
                    padding: '10px',
                    borderRadius: '8px',
                    border: isToday ? '2px solid var(--primary)' : '1px solid rgba(0,0,0,0.06)',
                    background: !cell.isCurrentMonth 
                      ? 'rgba(0,0,0,0.015)' 
                      : isToday 
                        ? 'rgba(255, 182, 193, 0.12)' 
                        : 'white',
                    opacity: cell.isCurrentMonth ? 1 : 0.4,
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '8px',
                    minHeight: '110px'
                  }}
                  onClick={() => setSelectedDayBookings({ date: cell.date, items: dayBookings })}
                  onMouseEnter={(e) => {
                    if (cell.isCurrentMonth) {
                      e.currentTarget.style.transform = 'translateY(-2px)'
                      e.currentTarget.style.boxShadow = '0 6px 15px rgba(255, 182, 193, 0.15)'
                      e.currentTarget.style.borderColor = 'var(--primary)'
                    }
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'none'
                    e.currentTarget.style.boxShadow = 'none'
                    e.currentTarget.style.borderColor = isToday ? 'var(--primary)' : 'rgba(0,0,0,0.06)'
                  }}
                >
                  {/* Date Number & Counter */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ 
                      fontWeight: 700, 
                      fontSize: '0.85rem', 
                      color: isToday ? 'var(--primary)' : 'var(--text-primary)' 
                    }}>
                      {cell.date.getDate()}
                    </span>
                    {dayBookings.length > 0 && (
                      <span style={{ 
                        fontSize: '0.65rem', 
                        padding: '1px 5px', 
                        borderRadius: '9999px',
                        background: 'var(--primary)',
                        color: 'white',
                        fontWeight: 600
                      }}>
                        {dayBookings.length}
                      </span>
                    )}
                  </div>

                  {/* Summary Event Pills with distinct Room colors & status dots */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '3px', flex: 1, overflow: 'hidden' }}>
                    {dayBookings.slice(0, 2).map((b) => {
                      const roomColors = getRoomColors(b.roomName)
                      const statusDotColor = b.status === 'approved' 
                        ? '#22c55e' 
                        : b.status === 'pending' 
                          ? '#f59e0b' 
                          : '#ef4444'

                      return (
                        <div 
                          key={b.id} 
                          style={{
                            fontSize: '0.65rem',
                            padding: '3px 6px',
                            borderRadius: '4px',
                            background: roomColors.bg,
                            border: `1px solid ${roomColors.border}`,
                            color: roomColors.text,
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px'
                          }}
                          title={`${b.roomName} (${formatTime(b.start_time)} - ${formatTime(b.end_time)}): ${b.purpose}`}
                        >
                          <span style={{ 
                            width: '5px', 
                            height: '5px', 
                            borderRadius: '50%', 
                            background: statusDotColor,
                            flexShrink: 0
                          }} />
                          <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {formatTime(b.start_time)}-{formatTime(b.end_time)} {b.roomName}
                          </span>
                        </div>
                      )
                    })}
                    {dayBookings.length > 2 && (
                      <div style={{ fontSize: '0.6rem', color: 'var(--primary)', fontWeight: 600, textAlign: 'right' }}>
                        + อีก {dayBookings.length - 2} รายการ
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>

        </div>
      )}

      {/* REJECT MODAL */}
      {rejectingId && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          backgroundColor: 'rgba(0,0,0,0.5)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 1100,
          padding: '20px'
        }}>
          <div className="glass-panel animate-fade-in" style={{ width: '100%', maxWidth: '450px', padding: '32px', border: '1px solid rgba(0,0,0,0.06)' }}>
            <h2 style={{ fontSize: '1.3rem', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <ShieldAlert size={20} style={{ color: 'var(--danger)' }} />
              ปฏิเสธคำขอจองห้องประชุม
            </h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '20px' }}>
              กรุณากรอกเหตุผลหรือคำอธิบายเพื่อแจ้งให้ผู้ใช้งานระบบทราบ
            </p>

            <form onSubmit={handleRejectSubmit}>
              <div className="form-group" style={{ marginBottom: '20px' }}>
                <label className="form-label">เหตุผลการปฏิเสธ</label>
                <textarea
                  className="form-input"
                  placeholder="เช่น ห้องปิดปรับปรุงในวันดังกล่าว, ชนกับตารางกิจกรรมใหญ่ของโรงเรียน..."
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  style={{ minHeight: '100px', resize: 'vertical' }}
                  required
                />
              </div>

              <div style={{ display: 'flex', gap: '12px' }}>
                <button
                  type="button"
                  onClick={() => setRejectingId(null)}
                  className="btn btn-secondary"
                  style={{ flex: 1 }}
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  className="btn btn-danger"
                  style={{ flex: 1 }}
                >
                  ยืนยันปฏิเสธ
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* SELECTED DAY BOOKINGS DETAILED MODAL */}
      {selectedDayBookings && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          backgroundColor: 'rgba(0,0,0,0.5)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 1000,
          padding: '20px'
        }}>
          <div className="glass-panel animate-fade-in" style={{
            width: '100%',
            maxWidth: '700px',
            maxHeight: '90vh',
            overflowY: 'auto',
            padding: '30px',
            border: 'none',
            background: 'white',
            boxShadow: '0 20px 40px rgba(0,0,0,0.1)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', borderBottom: '1px solid var(--border-color)', paddingBottom: '12px' }}>
              <h2 style={{ fontSize: '1.4rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '8px' }}>
                <CalendarDays size={22} style={{ color: 'var(--primary)' }} />
                <span>ตารางการจอง วันที่ {formatDate(selectedDayBookings.date.toISOString())}</span>
              </h2>
              <button 
                onClick={() => setSelectedDayBookings(null)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)' }}
              >
                <X size={20} />
              </button>
            </div>

            {selectedDayBookings.items.length === 0 ? (
              <div style={{ padding: '40px 0', textAlign: 'center', color: 'var(--text-muted)', fontStyle: 'italic' }}>
                ไม่มีรายการจองห้องประชุมในวันนี้
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {selectedDayBookings.items.map((b) => {
                  const roomColors = getRoomColors(b.roomName)
                  return (
                    <div 
                      key={b.id} 
                      style={{ 
                        padding: '16px', 
                        borderRadius: '8px', 
                        border: `1px solid ${roomColors.border}`, 
                        background: roomColors.bg 
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px', marginBottom: '12px' }}>
                        <div>
                          <h4 style={{ fontSize: '1.1rem', fontWeight: 700, margin: 0, color: roomColors.text }}>🏢 {b.roomName}</h4>
                          <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '2px' }}>{b.roomLocation}</div>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          {getStatusBadge(b.status)}
                          
                          {b.status === 'pending' && userRole !== 'Housekeeper' && (
                            <div style={{ display: 'flex', gap: '4px' }}>
                              <button
                                onClick={() => handleApprove(b.id)}
                                disabled={loadingId !== null}
                                className="btn btn-primary"
                                style={{ padding: '4px 8px', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '4px' }}
                              >
                                <Check size={12} />
                                <span>อนุมัติ</span>
                              </button>
                              <button
                                onClick={() => {
                                  setRejectingId(b.id)
                                  setRejectionReason('')
                                }}
                                disabled={loadingId !== null}
                                className="btn btn-danger"
                                style={{ padding: '4px 8px', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '4px' }}
                              >
                                <X size={12} />
                                <span>ปฏิเสธ</span>
                              </button>
                            </div>
                          )}
                        </div>
                      </div>

                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '10px', fontSize: '0.85rem', color: 'var(--text-secondary)', background: 'rgba(255, 255, 255, 0.65)', padding: '10px', borderRadius: '6px', border: '1px solid rgba(0,0,0,0.03)' }}>
                        <div>🕒 <strong>เวลา:</strong> {formatTime(b.start_time)} - {formatTime(b.end_time)} น.</div>
                        <div>👤 <strong>ผู้จอง:</strong> {b.userFullName}</div>
                        <div style={{ gridColumn: 'span 2' }}>📝 <strong>วัตถุประสงค์:</strong> {b.purpose}</div>
                      </div>

                      {b.status === 'rejected' && b.rejection_reason && (
                        <div style={{ marginTop: '8px', background: 'rgba(239, 68, 68, 0.04)', border: '1px solid rgba(239, 68, 68, 0.08)', color: 'var(--danger)', padding: '8px 12px', borderRadius: '6px', fontSize: '0.8rem' }}>
                          <strong>เหตุผลการปฏิเสธ:</strong> {b.rejection_reason}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            )}

            <div style={{ marginTop: '24px', display: 'flex', justifyContent: 'flex-end' }}>
              <button onClick={() => setSelectedDayBookings(null)} className="btn btn-secondary" style={{ padding: '8px 24px' }}>
                ปิดหน้าจอ
              </button>
            </div>
          </div>
        </div>
      )}

      {alertConfig && (
        <AlertModal
          type={alertConfig.type}
          title={alertConfig.title}
          message={alertConfig.message}
          onClose={() => setAlertConfig(null)}
        />
      )}
    </div>
  )
}
