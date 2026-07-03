'use client'

import { useState } from 'react'
import { updateBookingStatus } from '@/app/actions/bookings'
import { Calendar, Clock, User, Mail, Check, X, AlertCircle, FileText, CheckSquare, XSquare, ShieldAlert } from 'lucide-react'

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

export default function AdminDashboard({ bookings, userRole }: AdminDashboardProps) {
  const [filter, setFilter] = useState<string>('all')
  const [loadingId, setLoadingId] = useState<string | null>(null)
  
  // Rejection modal state
  const [rejectingId, setRejectingId] = useState<string | null>(null)
  const [rejectionReason, setRejectionReason] = useState('')

  // Calculate statistics
  const total = bookings.length
  const pending = bookings.filter(b => b.status === 'pending').length
  const approved = bookings.filter(b => b.status === 'approved').length
  const cancelled = bookings.filter(b => b.status === 'cancelled' || b.status === 'rejected').length

  const filteredBookings = bookings.filter((b) => {
    if (filter === 'all') return true
    return b.status === filter
  })

  const handleApprove = async (id: string) => {
    if (!confirm('ยืนยันการอนุมัติการจองห้องประชุมนี้?')) return
    setLoadingId(id)
    const res = await updateBookingStatus(id, 'approved')
    setLoadingId(null)
    if (res.error) alert(res.error)
  }

  const handleRejectSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!rejectingId) return
    if (!rejectionReason.trim()) {
      alert('กรุณากรอกเหตุผลในการปฏิเสธการจอง')
      return
    }

    setLoadingId(rejectingId)
    const res = await updateBookingStatus(rejectingId, 'rejected', rejectionReason)
    setLoadingId(null)
    
    if (res.error) {
      alert(res.error)
    } else {
      setRejectingId(null)
      setRejectionReason('')
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
    return d.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })
  }

  return (
    <div style={{ marginTop: '24px' }}>
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
          <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem', fontWeight: 600, textTransform: 'uppercase', marginBottom: '8px' }}>ยกเลิก/ปฏิเสธ</div>
          <div style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--danger)' }}>{cancelled}</div>
        </div>
      </div>

      {/* Filter Tabs */}
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
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Bookings List */}
      {filteredBookings.length === 0 ? (
        <div className="glass-panel" style={{
          padding: '48px',
          textAlign: 'center',
          color: 'var(--text-muted)'
        }}>
          ไม่พบข้อมูลรายการจองห้องประชุม
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {filteredBookings.map((b) => (
            <div key={b.id} className="glass-panel animate-fade-in" style={{
              padding: '24px',
              border: '1px solid rgba(255,255,255,0.06)'
            }}>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-start',
                flexWrap: 'wrap',
                gap: '16px',
                marginBottom: '16px'
              }}>
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
                        style={{
                          padding: '6px 12px',
                          fontSize: '0.8rem',
                          boxShadow: 'none'
                        }}
                      >
                        <X size={14} />
                        <span>ปฏิเสธ</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Detail Grid */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                gap: '16px',
                padding: '16px',
                background: 'rgba(255,255,255,0.01)',
                border: '1px solid rgba(255,255,255,0.03)',
                borderRadius: '8px'
              }}>
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
                <div style={{
                  marginTop: '16px',
                  background: 'rgba(239, 68, 68, 0.05)',
                  border: '1px solid rgba(239, 68, 68, 0.1)',
                  color: 'var(--danger)',
                  padding: '12px 16px',
                  borderRadius: '8px',
                  fontSize: '0.85rem'
                }}>
                  <strong>เหตุผลการปฏิเสธ:</strong> {b.rejection_reason}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Reject Modal */}
      {rejectingId && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          backgroundColor: 'rgba(0,0,0,0.65)',
          backdropFilter: 'blur(8px)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 1000,
          padding: '20px'
        }}>
          <div className="glass-panel animate-fade-in" style={{
            width: '100%',
            maxWidth: '450px',
            padding: '32px',
            border: '1px solid rgba(255,255,255,0.1)'
          }}>
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
                  placeholder="เช่น ห้องปิดปรับปรุงในวันดังกล่าว, ชนกับตารางกิจกรรมใหญ่ของบริษัท..."
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
    </div>
  )
}
