'use client'

import { useState } from 'react'
import { addRoom, editRoom, deleteRoom } from '@/app/actions/rooms'
import { 
  Users, MapPin, Sparkles, Plus, Edit2, Trash2, X, ToggleLeft, ToggleRight,
  Tv, Wifi, Video, FileText, CheckCircle, AlertTriangle
} from 'lucide-react'
import AlertModal from '@/components/AlertModal'

interface RoomItem {
  id: string
  created_at: string
  name: string
  capacity: number
  location: string
  amenities: string[]
  image_url: string | null
  is_active: boolean
}

interface AdminRoomsProps {
  rooms: RoomItem[]
}

export default function AdminRooms({ rooms }: AdminRoomsProps) {
  const [modalOpen, setModalOpen] = useState(false)
  const [editingRoom, setEditingRoom] = useState<RoomItem | null>(null)
  
  // Form fields state
  const [name, setName] = useState('')
  const [capacity, setCapacity] = useState<number>(8)
  const [location, setLocation] = useState('')
  const [amenitiesStr, setAmenitiesStr] = useState('')
  const [imageUrl, setImageUrl] = useState('')
  const [isActive, setIsActive] = useState(true)

  const [loading, setLoading] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [alertConfig, setAlertConfig] = useState<{ type: 'success' | 'error' | 'warning' | 'info'; title: string; message: string } | null>(null)

  const openAddModal = () => {
    setEditingRoom(null)
    setName('')
    setCapacity(8)
    setLocation('')
    setAmenitiesStr('Projector, Whiteboard, Wifi')
    setImageUrl('')
    setIsActive(true)
    setErrorMsg(null)
    setModalOpen(true)
  }

  const openEditModal = (room: RoomItem) => {
    setEditingRoom(room)
    setName(room.name)
    setCapacity(room.capacity)
    setLocation(room.location)
    setAmenitiesStr(room.amenities.join(', '))
    setImageUrl(room.image_url || '')
    setIsActive(room.is_active)
    setErrorMsg(null)
    setModalOpen(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setErrorMsg(null)

    // Convert comma-separated amenities to array
    const amenities = amenitiesStr
      .split(',')
      .map((item) => item.trim())
      .filter((item) => item.length > 0)

    const payload = {
      name,
      capacity,
      location,
      amenities,
      imageUrl,
      isActive
    }

    let result
    if (editingRoom) {
      result = await editRoom(editingRoom.id, payload)
    } else {
      result = await addRoom(payload)
    }

    setLoading(false)

    if (result.error) {
      setErrorMsg(result.error)
      setAlertConfig({ type: 'error', title: 'บันทึกข้อมูลไม่สำเร็จ', message: result.error })
    } else {
      setAlertConfig({ 
        type: 'success', 
        title: 'บันทึกข้อมูลสำเร็จ', 
        message: editingRoom ? 'แก้ไขข้อมูลห้องประชุมเรียบร้อยแล้ว' : 'เพิ่มห้องประชุมใหม่เรียบร้อยแล้ว' 
      })
      setModalOpen(false)
    }
  }

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`คุณแน่ใจหรือไม่ว่าต้องการลบห้องประชุม "${name}"? การลบนี้จะลบประวัติการจองทั้งหมดที่เกี่ยวข้องด้วย`)) {
      return
    }

    setLoading(true)
    const result = await deleteRoom(id)
    setLoading(false)

    if (result.error) {
      setAlertConfig({ type: 'error', title: 'ลบห้องไม่สำเร็จ', message: result.error })
    } else {
      setAlertConfig({ type: 'success', title: 'ลบห้องสำเร็จ', message: `ลบห้องประชุม "${name}" เรียบร้อยแล้ว` })
    }
  }

  const handleToggleActive = async (room: RoomItem) => {
    // Quick toggle active state
    const result = await editRoom(room.id, {
      name: room.name,
      capacity: room.capacity,
      location: room.location,
      amenities: room.amenities,
      imageUrl: room.image_url || '',
      isActive: !room.is_active
    })

    if (result.error) {
      setAlertConfig({ type: 'error', title: 'เปลี่ยนสถานะไม่สำเร็จ', message: result.error })
    } else {
      setAlertConfig({ 
        type: 'success', 
        title: 'เปลี่ยนสถานะสำเร็จ', 
        message: `เปลี่ยนสถานะการเปิดให้บริการห้อง "${room.name}" เรียบร้อยแล้ว` 
      })
    }
  }

  return (
    <div style={{ marginTop: '24px' }}>
      {/* Header Panel */}
      <div className="glass-panel" style={{
        padding: '32px',
        marginBottom: '32px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '20px',
        background: 'linear-gradient(135deg, rgba(59,130,246,0.05), rgba(168,85,247,0.08))',
        border: '1px solid rgba(255,255,255,0.06)'
      }}>
        <div>
          <h1 style={{ fontSize: '1.8rem', fontWeight: 800, marginBottom: '8px' }}>จัดการห้องประชุม</h1>
          <p style={{ color: 'var(--text-secondary)' }}>
            เพิ่มห้องประชุมใหม่ แก้ไขข้อมูลความจุ อุปกรณ์ และเปิด-ปิดสถานะพร้อมใช้งานของห้อง
          </p>
        </div>

        <button onClick={openAddModal} className="btn btn-primary">
          <Plus size={18} />
          เพิ่มห้องประชุม
        </button>
      </div>

      {/* Rooms Table / Grid */}
      <div className="glass-panel" style={{ overflow: 'hidden', border: '1px solid rgba(255,255,255,0.06)' }}>
        <table style={{
          width: '100%',
          borderCollapse: 'collapse',
          textAlign: 'left',
          fontSize: '0.95rem'
        }}>
          <thead>
            <tr style={{
              background: 'rgba(255,255,255,0.02)',
              borderBottom: '1px solid var(--border-color)',
              color: 'var(--text-secondary)',
              fontFamily: 'var(--font-display)',
              textTransform: 'uppercase',
              fontSize: '0.8rem',
              letterSpacing: '0.05em'
            }}>
              <th style={{ padding: '16px 20px' }}>ห้องประชุม</th>
              <th style={{ padding: '16px 20px' }}>สถานที่</th>
              <th style={{ padding: '16px 20px' }}>ความจุ</th>
              <th style={{ padding: '16px 20px' }}>อุปกรณ์อำนวยความสะดวก</th>
              <th style={{ padding: '16px 20px' }}>สถานะ</th>
              <th style={{ padding: '16px 20px', textAlign: 'right' }}>จัดการ</th>
            </tr>
          </thead>
          <tbody>
            {rooms.length === 0 ? (
              <tr>
                <td colSpan={6} style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
                  ยังไม่มีข้อมูลห้องประชุมในระบบ กรุณากดปุ่มเพิ่มห้องประชุมด้านบน
                </td>
              </tr>
            ) : (
              rooms.map((room, index) => (
                <tr key={room.id} style={{
                  borderBottom: index === rooms.length - 1 ? 'none' : '1px solid var(--border-color)',
                  background: room.is_active ? 'transparent' : 'rgba(255,255,255,0.01)',
                  opacity: room.is_active ? 1 : 0.7
                }}>
                  {/* Name & Photo */}
                  <td style={{ padding: '16px 20px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div style={{
                        width: '48px',
                        height: '48px',
                        borderRadius: '8px',
                        backgroundImage: `url(${room.image_url || 'https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=80&q=80'})`,
                        backgroundSize: 'cover',
                        backgroundPosition: 'center',
                        border: '1px solid rgba(255,255,255,0.08)'
                      }} />
                      <strong style={{ fontSize: '1rem', color: 'var(--text-primary)' }}>{room.name}</strong>
                    </div>
                  </td>

                  {/* Location */}
                  <td style={{ padding: '16px 20px', color: 'var(--text-secondary)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <MapPin size={14} style={{ color: 'var(--text-muted)' }} />
                      <span>{room.location}</span>
                    </div>
                  </td>

                  {/* Capacity */}
                  <td style={{ padding: '16px 20px', color: 'var(--text-primary)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Users size={14} style={{ color: 'var(--primary)' }} />
                      <span>{room.capacity} ที่นั่ง</span>
                    </div>
                  </td>

                  {/* Amenities */}
                  <td style={{ padding: '16px 20px' }}>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                      {room.amenities.map((a, idx) => (
                        <span key={idx} style={{
                          fontSize: '0.7rem',
                          background: 'rgba(255,255,255,0.04)',
                          color: 'var(--text-secondary)',
                          padding: '2px 6px',
                          borderRadius: '4px',
                          border: '1px solid rgba(255,255,255,0.05)'
                        }}>
                          {a}
                        </span>
                      ))}
                    </div>
                  </td>

                  {/* Active Toggle */}
                  <td style={{ padding: '16px 20px' }}>
                    <button
                      onClick={() => handleToggleActive(room)}
                      style={{
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        color: room.is_active ? 'var(--success)' : 'var(--text-muted)',
                        display: 'flex',
                        alignItems: 'center'
                      }}
                      title={room.is_active ? 'คลิกเพื่อปิดใช้งาน' : 'คลิกเพื่อเปิดใช้งาน'}
                    >
                      {room.is_active ? <ToggleRight size={28} /> : <ToggleLeft size={28} />}
                    </button>
                  </td>

                  {/* Actions */}
                  <td style={{ padding: '16px 20px', textAlign: 'right' }}>
                    <div style={{ display: 'inline-flex', gap: '8px' }}>
                      <button
                        onClick={() => openEditModal(room)}
                        className="btn btn-secondary"
                        style={{ padding: '6px 10px', fontSize: '0.8rem' }}
                      >
                        <Edit2 size={12} />
                        <span>แก้ไข</span>
                      </button>
                      <button
                        onClick={() => handleDelete(room.id, room.name)}
                        className="btn btn-secondary"
                        style={{
                          padding: '6px 10px',
                          fontSize: '0.8rem',
                          color: 'var(--danger)',
                          borderColor: 'rgba(239, 68, 68, 0.2)',
                          background: 'rgba(239, 68, 68, 0.05)'
                        }}
                      >
                        <Trash2 size={12} />
                        <span>ลบ</span>
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Add / Edit Modal */}
      {modalOpen && (
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
            maxWidth: '500px',
            padding: '32px',
            position: 'relative',
            border: '1px solid rgba(255,255,255,0.1)'
          }}>
            {/* Close Button */}
            <button
              onClick={() => setModalOpen(false)}
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

            {/* Title */}
            <h2 style={{ fontSize: '1.4rem', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Sparkles size={20} style={{ color: 'var(--accent)' }} />
              {editingRoom ? 'แก้ไขข้อมูลห้องประชุม' : 'เพิ่มห้องประชุมใหม่'}
            </h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '24px' }}>
              กรุณากรอกข้อมูลห้องประชุมให้ครบถ้วนเพื่อเปิดให้บริการจอง
            </p>

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div className="form-group">
                <label className="form-label">ชื่อห้องประชุม</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="เช่น Room A - Creative Loft"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div className="form-group">
                  <label className="form-label">ความจุ (จำนวนที่นั่ง)</label>
                  <input
                    type="number"
                    className="form-input"
                    value={capacity}
                    onChange={(e) => setCapacity(parseInt(e.target.value) || 0)}
                    min={1}
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">สถานที่ตั้ง / ชั้น</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="เช่น อาคาร 1 ชั้น 3"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">อุปกรณ์ (คั่นด้วยเครื่องหมายจุลภาค ,)</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="Projector, Whiteboard, Wifi, Smart TV"
                  value={amenitiesStr}
                  onChange={(e) => setAmenitiesStr(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label className="form-label">URL รูปภาพห้องประชุม (เว้นว่างได้)</label>
                <input
                  type="url"
                  className="form-input"
                  placeholder="https://example.com/room.jpg"
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                />
              </div>

              {editingRoom && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', margin: '6px 0' }}>
                  <input
                    type="checkbox"
                    id="isActiveCheck"
                    checked={isActive}
                    onChange={(e) => setIsActive(e.target.checked)}
                    style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                  />
                  <label htmlFor="isActiveCheck" style={{ fontSize: '0.9rem', cursor: 'pointer' }}>
                    เปิดให้บริการจองห้องประชุมนี้ (Active)
                  </label>
                </div>
              )}

              {errorMsg && (
                <div style={{
                  background: 'rgba(239, 68, 68, 0.1)',
                  border: '1px solid rgba(239, 68, 68, 0.2)',
                  borderRadius: '8px',
                  color: 'var(--danger)',
                  fontSize: '0.85rem',
                  padding: '10px 12px',
                  textAlign: 'center'
                }}>
                  {errorMsg}
                </div>
              )}

              <div style={{ display: 'flex', gap: '12px', marginTop: '10px' }}>
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="btn btn-secondary"
                  style={{ flex: 1 }}
                  disabled={loading}
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  style={{ flex: 2 }}
                  disabled={loading}
                >
                  {loading ? 'กำลังบันทึก...' : 'บันทึกข้อมูล'}
                </button>
              </div>
            </form>
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
