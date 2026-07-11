'use client'

import { useState } from 'react'
import { cancelBooking } from '@/app/actions/bookings'
import { Calendar, Clock, MapPin, AlertTriangle, FileText, CheckCircle, XCircle, Trash2 } from 'lucide-react'
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
}

interface MyBookingsProps {
  bookings: BookingItem[]
  userRole?: string
  allowedCancelRoles?: string[]
}

export default function MyBookings({ bookings, userRole, allowedCancelRoles }: MyBookingsProps) {
  const [filter, setFilter] = useState<string>('all')
  const [cancellingId, setCancellingId] = useState<string | null>(null)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [alertConfig, setAlertConfig] = useState<{ type: 'success' | 'error' | 'warning' | 'info'; title: string; message: string } | null>(null)

  const allowedCancelRolesList = allowedCancelRoles || ['admin', 'subadmin', 'admin booking']

  const filteredBookings = bookings.filter((b) => {
    if (filter === 'all') return true
    return b.status === filter
  })

  const handleCancel = async (id: string) => {
    if (!confirm('คุณแน่ใจหรือไม่ว่าต้องการยกเลิกการจองห้องประชุมนี้?')) {
      return
    }

    setCancellingId(id)
    setErrorMsg(null)

    const result = await cancelBooking(id)

    setCancellingId(null)

    if (result.error) {
      setErrorMsg(result.error)
      setAlertConfig({ type: 'error', title: 'ยกเลิกการจองไม่สำเร็จ', message: result.error })
    } else {
      setAlertConfig({ type: 'success', title: 'ยกเลิกการจองสำเร็จ', message: 'ยกเลิกการจองห้องประชุมนี้เรียบร้อยแล้ว' })
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved':
        return <span className="badge badge-approved">อนุมัติแล้ว</span>
      case 'rejected':
        return <span className="badge badge-rejected">ปฏิเสธ</span>
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
      {/* Title */}
      <div className="glass-panel" style={{
        padding: '32px',
        marginBottom: '32px',
        background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.05), rgba(168, 85, 247, 0.08))',
        border: '1px solid rgba(255, 255, 255, 0.06)'
      }}>
        <h1 style={{ fontSize: '1.8rem', fontWeight: 800, marginBottom: '8px' }}>ประวัติการจองห้องประชุม</h1>
        <p style={{ color: 'var(--text-secondary)' }}>
          ตรวจสอบสถานะการจองของคุณ รายการที่อยู่ระหว่างรออนุมัติ หรือยกเลิกการจอง
        </p>
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
          { key: 'rejected', label: 'ปฏิเสธการจอง' },
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
          ไม่พบรายการจองห้องประชุม
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
                  <h3 style={{ fontSize: '1.2rem', marginBottom: '6px' }}>{b.roomName}</h3>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    color: 'var(--text-secondary)',
                    fontSize: '0.85rem'
                  }}>
                    <MapPin size={14} style={{ color: 'var(--text-muted)' }} />
                    <span>{b.roomLocation}</span>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  {getStatusBadge(b.status)}
                  
                  {/* Cancel Button */}
                  {(b.status === 'pending' || (b.status === 'approved' && allowedCancelRolesList.includes(userRole || ''))) && (
                    <button
                      onClick={() => handleCancel(b.id)}
                      disabled={cancellingId === b.id}
                      className="btn btn-secondary"
                      style={{
                        padding: '6px 12px',
                        fontSize: '0.8rem',
                        color: 'var(--danger)',
                        borderColor: 'rgba(239, 68, 68, 0.2)',
                        background: 'rgba(239, 68, 68, 0.05)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px'
                      }}
                    >
                      <Trash2 size={12} />
                      <span>{cancellingId === b.id ? 'กำลังยกเลิก...' : 'ยกเลิกจอง'}</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Booking Details Grid */}
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
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>วันที่จอง</div>
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

              {/* Rejection Alert */}
              {b.status === 'rejected' && b.rejection_reason && (
                <div style={{
                  marginTop: '16px',
                  background: 'rgba(239, 68, 68, 0.05)',
                  border: '1px solid rgba(239, 68, 68, 0.1)',
                  color: 'var(--danger)',
                  padding: '12px 16px',
                  borderRadius: '8px',
                  fontSize: '0.85rem',
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '8px'
                }}>
                  <AlertTriangle size={16} style={{ marginTop: '2px', flexShrink: 0 }} />
                  <div>
                    <strong>สาเหตุที่ปฏิเสธ:</strong> {b.rejection_reason}
                  </div>
                </div>
              )}
            </div>
          ))}
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
