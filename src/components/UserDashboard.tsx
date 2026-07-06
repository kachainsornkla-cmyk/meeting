'use client'

import { useState } from 'react'
import { createBooking } from '@/app/actions/bookings'
import { Users, MapPin, Calendar, Clock, Sparkles, Filter, Search, X, Check, AlertCircle } from 'lucide-react'
import AlertModal from '@/components/AlertModal'

interface Room {
  id: string
  name: string
  capacity: number
  location: string
  amenities: string[]
  image_url: string | null
}

interface Booking {
  id: string
  room_id: string
  start_time: string
  end_time: string
  status: string
  userName: string
}

interface UserDashboardProps {
  rooms: Room[]
  bookings: Booking[]
  userRole?: string
}

export default function UserDashboard({ rooms, bookings, userRole }: UserDashboardProps) {
  // Search & Filter state
  const [searchTerm, setSearchTerm] = useState('')
  const [capacityFilter, setCapacityFilter] = useState<string>('all')

  // Booking Modal state
  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null)
  const [bookingDate, setBookingDate] = useState<string>(
    new Date().toLocaleDateString('en-CA') // YYYY-MM-DD local format
  )
  const [startTime, setStartTime] = useState('09:00')
  const [endTime, setEndTime] = useState('10:00')
  const [purpose, setPurpose] = useState('')
  
  // Status states
  const [submitting, setSubmitting] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [successMsg, setSuccessMsg] = useState<string | null>(null)
  const [alertConfig, setAlertConfig] = useState<{ type: 'success' | 'error' | 'warning' | 'info'; title: string; message: string } | null>(null)

  // Filter rooms based on search & capacity
  const filteredRooms = rooms.filter((room) => {
    const matchesSearch = room.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          room.location.toLowerCase().includes(searchTerm.toLowerCase())
    
    let matchesCapacity = true
    if (capacityFilter === 'small') matchesCapacity = room.capacity < 6
    else if (capacityFilter === 'medium') matchesCapacity = room.capacity >= 6 && room.capacity <= 10
    else if (capacityFilter === 'large') matchesCapacity = room.capacity > 10

    return matchesSearch && matchesCapacity
  })

  // Get bookings for the selected room on the selected date
  const getBusyTimesForSelected = () => {
    if (!selectedRoom) return []
    return bookings.filter((b) => {
      if (b.room_id !== selectedRoom.id) return false
      const bookingStart = new Date(b.start_time)
      const selectedDate = new Date(bookingDate)
      return bookingStart.toDateString() === selectedDate.toDateString()
    })
  }

  const busyBookings = getBusyTimesForSelected()

  // Generate 24-hour time options in 15-minute intervals
  const timeOptions = Array.from({ length: 96 }, (_, i) => {
    const hour = Math.floor(i / 4);
    const minute = (i % 4) * 15;
    return `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
  });

  const getEndTimeOptions = () => {
    const [startH, startM] = startTime.split(':').map(Number);
    const startTotal = startH * 60 + startM;

    const filtered = timeOptions.filter(t => {
      const [h, m] = t.split(':').map(Number);
      const total = h * 60 + m;
      return total > startTotal;
    });

    if (filtered.length === 0 || !filtered.includes('23:59')) {
      filtered.push('23:59');
    }
    return filtered;
  };

  const handleStartTimeChange = (newStart: string) => {
    setStartTime(newStart);
    
    const [startH, startM] = newStart.split(':').map(Number);
    const [endH, endM] = endTime.split(':').map(Number);
    
    const startTotal = startH * 60 + startM;
    const endTotal = endH * 60 + endM;
    
    if (endTotal <= startTotal) {
      let newEndH = startH + 1;
      let newEndM = startM;
      if (newEndH >= 24) {
        setEndTime('23:59');
      } else {
        setEndTime(`${newEndH.toString().padStart(2, '0')}:${newEndM.toString().padStart(2, '0')}`);
      }
    }
  };

  const handleBookingSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedRoom) return

    setSubmitting(true)
    setErrorMsg(null)
    setSuccessMsg(null)

    const start = new Date(`${bookingDate}T${startTime}:00`)
    const end = new Date(`${bookingDate}T${endTime}:00`)

    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      setErrorMsg('กรุณากรอกวันที่และเวลาให้ถูกต้อง')
      setAlertConfig({ type: 'error', title: 'ข้อมูลไม่ถูกต้อง', message: 'กรุณากรอกวันที่และเวลาให้ถูกต้อง' })
      setSubmitting(false)
      return
    }

    const result = await createBooking({
      roomId: selectedRoom.id,
      startTime: start.toISOString(),
      endTime: end.toISOString(),
      purpose,
    })

    setSubmitting(false)

    if (result.error) {
      setErrorMsg(result.error)
      setAlertConfig({ type: 'error', title: 'จองห้องประชุมไม่สำเร็จ', message: result.error })
    } else {
      const autoApproveRoles = ['admin', 'subadmin', 'admin booking']
      const isAutoApprove = userRole && autoApproveRoles.includes(userRole)
      const msg = isAutoApprove
        ? 'จองห้องประชุมสำเร็จเรียบร้อยแล้ว!'
        : 'ส่งคำขอจองห้องประชุมเรียบร้อยแล้ว! กำลังรอผู้ดูแลระบบอนุมัติ'

      setSuccessMsg(msg)
      setAlertConfig({ 
        type: 'success', 
        title: 'จองห้องประชุมสำเร็จ', 
        message: msg 
      })
      setPurpose('')
      setSelectedRoom(null) // Close modal immediately on success
    }
  }

  const formatTime = (isoString: string) => {
    const d = new Date(isoString)
    return d.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit', hour12: false })
  }

  return (
    <div style={{ marginTop: '24px' }}>
      {/* Header Banner */}
      <div className="glass-panel" style={{
        padding: '32px',
        marginBottom: '32px',
        background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.1), rgba(168, 85, 247, 0.05))',
        border: '1px solid rgba(255, 255, 255, 0.06)',
        display: 'flex',
        flexDirection: 'column',
        gap: '8px'
      }}>
        <h1 style={{ fontSize: '1.8rem', fontWeight: 800 }}>จองห้องประชุมออนไลน์</h1>
        <p style={{ color: 'var(--text-secondary)' }}>
          ค้นหาห้องประชุมที่ต้องการระบุขนาดความจุและสิ่งอำนวยความสะดวก เพื่อทำการจองคิวใช้งานได้อย่างรวดเร็ว
        </p>
      </div>

      {/* Filters Bar */}
      <div className="glass-panel" style={{
        padding: '20px',
        marginBottom: '24px',
        display: 'flex',
        flexWrap: 'wrap',
        gap: '16px',
        alignItems: 'center',
        justifyContent: 'space-between'
      }}>
        <div style={{ display: 'flex', gap: '12px', flex: 1, minWidth: '280px' }}>
          <div style={{ position: 'relative', flex: 1 }}>
            <Search size={18} style={{
              position: 'absolute',
              left: '12px',
              top: '50%',
              transform: 'translateY(-50%)',
              color: 'var(--text-muted)'
            }} />
            <input
              type="text"
              placeholder="ค้นหาชื่อห้องหรือสถานที่..."
              className="form-input"
              style={{ paddingLeft: '40px' }}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          <Filter size={16} style={{ color: 'var(--text-secondary)' }} />
          <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>ความจุห้อง:</span>
          <select
            className="form-input"
            style={{ width: 'auto', padding: '8px 16px', cursor: 'pointer' }}
            value={capacityFilter}
            onChange={(e) => setCapacityFilter(e.target.value)}
          >
            <option value="all">ทั้งหมด</option>
            <option value="small">ขนาดเล็ก (น้อยกว่า 6 คน)</option>
            <option value="medium">ขนาดกลาง (6-10 คน)</option>
            <option value="large">ขนาดใหญ่ (มากกว่า 10 คน)</option>
          </select>
        </div>
      </div>

      {/* Rooms Grid */}
      {filteredRooms.length === 0 ? (
        <div style={{
          textAlign: 'center',
          padding: '48px',
          color: 'var(--text-muted)'
        }}>
          ไม่พบห้องประชุมที่ตรงกับเงื่อนไขการค้นหาของคุณ
        </div>
      ) : (
        <div className="grid-cols-3">
          {filteredRooms.map((room) => (
            <div key={room.id} className="glass-panel" style={{
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column',
              height: '100%'
            }}>
              {/* Room Image */}
              <div style={{
                height: '180px',
                width: '100%',
                backgroundImage: `url(${room.image_url || 'https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=800&q=80'})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                position: 'relative'
              }}>
                <div style={{
                  position: 'absolute',
                  top: '12px',
                  right: '12px',
                  background: 'rgba(13, 20, 35, 0.85)',
                  backdropFilter: 'blur(4px)',
                  padding: '4px 10px',
                  borderRadius: '6px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  fontSize: '0.8rem',
                  border: '1px solid rgba(255, 255, 255, 0.1)'
                }}>
                  <Users size={12} style={{ color: 'var(--primary)' }} />
                  <span>{room.capacity} ที่นั่ง</span>
                </div>
              </div>

              {/* Room Details */}
              <div style={{ padding: '20px', flex: 1, display: 'flex', flexDirection: 'column' }}>
                <h3 style={{ fontSize: '1.2rem', marginBottom: '8px' }}>{room.name}</h3>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  color: 'var(--text-secondary)',
                  fontSize: '0.85rem',
                  marginBottom: '16px'
                }}>
                  <MapPin size={14} style={{ color: 'var(--text-muted)' }} />
                  <span>{room.location}</span>
                </div>

                {/* Amenities */}
                <div style={{
                  display: 'flex',
                  flexWrap: 'wrap',
                  gap: '6px',
                  marginBottom: '20px'
                }}>
                  {room.amenities.map((amenity, idx) => (
                    <span key={idx} style={{
                      fontSize: '0.75rem',
                      background: 'rgba(255, 255, 255, 0.04)',
                      border: '1px solid rgba(255, 255, 255, 0.05)',
                      color: 'var(--text-secondary)',
                      padding: '2px 8px',
                      borderRadius: '4px'
                    }}>
                      {amenity}
                    </span>
                  ))}
                </div>

                {/* Button */}
                <button
                  onClick={() => {
                    setSelectedRoom(room)
                    setErrorMsg(null)
                    setSuccessMsg(null)
                  }}
                  className="btn btn-primary"
                  style={{ width: '100%', marginTop: 'auto' }}
                >
                  <Calendar size={16} />
                  จองห้องประชุมนี้
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Booking Modal */}
      {selectedRoom && (
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
            maxWidth: '650px',
            maxHeight: '90vh',
            overflowY: 'auto',
            padding: '32px',
            position: 'relative',
            border: '1px solid rgba(255,255,255,0.1)'
          }}>
            {/* Close Button */}
            <button
              onClick={() => setSelectedRoom(null)}
              style={{
                position: 'absolute',
                top: '20px',
                right: '20px',
                background: 'none',
                border: 'none',
                color: 'var(--text-secondary)',
                cursor: 'pointer'
              }}
            >
              <X size={24} />
            </button>

            {/* Modal Title */}
            <h2 style={{ fontSize: '1.5rem', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Sparkles size={20} style={{ color: 'var(--accent)' }} />
              จองห้องประชุม: {selectedRoom.name}
            </h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '24px' }}>
              {selectedRoom.location} • ความจุ {selectedRoom.capacity} ที่นั่ง
            </p>

            {/* Main Content Layout */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
              {/* Booking Form */}
              <form onSubmit={handleBookingSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div className="form-group">
                  <label className="form-label">วันที่ต้องการจอง</label>
                  <input
                    type="date"
                    className="form-input"
                    value={bookingDate}
                    min={new Date().toLocaleDateString('en-CA')}
                    onChange={(e) => setBookingDate(e.target.value)}
                    required
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div className="form-group">
                    <label className="form-label">เริ่มเวลา</label>
                    <select
                      className="form-input"
                      value={startTime}
                      onChange={(e) => handleStartTimeChange(e.target.value)}
                      style={{ appearance: 'auto', background: 'white' }}
                      required
                    >
                      {timeOptions.map((t) => (
                        <option key={t} value={t}>
                          {t} น.
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">สิ้นสุดเวลา</label>
                    <select
                      className="form-input"
                      value={endTime}
                      onChange={(e) => setEndTime(e.target.value)}
                      style={{ appearance: 'auto', background: 'white' }}
                      required
                    >
                      {getEndTimeOptions().map((t) => (
                        <option key={t} value={t}>
                          {t} น.
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">วัตถุประสงค์ในการใช้ห้อง</label>
                  <textarea
                    className="form-input"
                    placeholder="ระบุวัตถุประสงค์ เช่น ประชุมทีมดีไซน์รายเดือน..."
                    style={{ minHeight: '80px', resize: 'vertical' }}
                    value={purpose}
                    onChange={(e) => setPurpose(e.target.value)}
                    required
                  />
                </div>

                {errorMsg && (
                  <div style={{
                    background: 'rgba(239, 68, 68, 0.1)',
                    border: '1px solid rgba(239, 68, 68, 0.2)',
                    borderRadius: '8px',
                    color: 'var(--danger)',
                    fontSize: '0.85rem',
                    padding: '10px 12px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}>
                    <AlertCircle size={16} />
                    <span>{errorMsg}</span>
                  </div>
                )}

                {successMsg && (
                  <div style={{
                    background: 'rgba(34, 197, 94, 0.1)',
                    border: '1px solid rgba(34, 197, 94, 0.2)',
                    borderRadius: '8px',
                    color: 'var(--success)',
                    fontSize: '0.85rem',
                    padding: '10px 12px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}>
                    <Check size={16} />
                    <span>{successMsg}</span>
                  </div>
                )}

                <div style={{ display: 'flex', gap: '12px', marginTop: '10px' }}>
                  <button
                    type="button"
                    className="btn btn-secondary"
                    style={{ flex: 1 }}
                    onClick={() => setSelectedRoom(null)}
                    disabled={submitting}
                  >
                    ยกเลิก
                  </button>
                  <button
                    type="submit"
                    className="btn btn-primary"
                    style={{ flex: 2 }}
                    disabled={submitting}
                  >
                    {submitting ? 'กำลังส่งคำขอ...' : 'ยืนยันการจอง'}
                  </button>
                </div>
              </form>

              {/* Booking Availability Schedule */}
              <div style={{
                background: 'rgba(255, 255, 255, 0.02)',
                border: '1px solid rgba(255, 255, 255, 0.04)',
                borderRadius: '12px',
                padding: '16px',
                display: 'flex',
                flexDirection: 'column',
                maxHeight: '340px'
              }}>
                <h4 style={{
                  fontSize: '0.95rem',
                  fontWeight: 600,
                  marginBottom: '12px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  color: 'var(--text-secondary)'
                }}>
                  <Clock size={14} />
                  ตารางการจองวันที่ {new Date(bookingDate).toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: 'numeric' })}
                </h4>
                
                <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {busyBookings.length === 0 ? (
                    <div style={{
                      flex: 1,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '0.85rem',
                      color: 'var(--text-muted)',
                      textAlign: 'center',
                      padding: '20px'
                    }}>
                      ห้องนี้ว่างตลอดทั้งวันในวันที่เลือก สามารถจองได้เลยครับ
                    </div>
                  ) : (
                    busyBookings.map((b) => (
                      <div key={b.id} style={{
                        background: b.status === 'approved' ? 'rgba(34, 197, 94, 0.08)' : 'rgba(245, 158, 11, 0.08)',
                        borderLeft: `3px solid ${b.status === 'approved' ? 'var(--success)' : 'var(--warning)'}`,
                        padding: '10px 12px',
                        borderRadius: '0 8px 8px 0',
                        fontSize: '0.85rem'
                      }}>
                        <div style={{ fontWeight: 600, marginBottom: '2px', display: 'flex', justifyContent: 'space-between' }}>
                          <span>{formatTime(b.start_time)} - {formatTime(b.end_time)}</span>
                          <span style={{ fontSize: '0.75rem', color: b.status === 'approved' ? 'var(--success)' : 'var(--warning)' }}>
                            {b.status === 'approved' ? 'อนุมัติแล้ว' : 'รออนุมัติ'}
                          </span>
                        </div>
                        <div style={{ color: 'var(--text-secondary)' }}>ผู้จอง: {b.userName}</div>
                      </div>
                    ))
                  )}
                </div>
              </div>
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
