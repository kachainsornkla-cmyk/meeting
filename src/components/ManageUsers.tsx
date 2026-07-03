'use client'

import { useState } from 'react'
import { updateUserRoleAndProfile } from '@/app/actions/users'
import { 
  User, Mail, Phone, Briefcase, GraduationCap, 
  Home, BookOpen, Key, RefreshCw, CheckCircle, 
  AlertCircle, Users, Award, Search, Filter, Edit2, X 
} from 'lucide-react'
import AlertModal from '@/components/AlertModal'

interface UserItem {
  id: string
  email: string | null
  full_name: string | null
  role: string
  phone: string | null
  learning_group: string | null
  work_group: string | null
  position: string | null
  academic_standing: string | null
  advisor_role: string | null
  responsible_room: string | null
  avatar_url: string | null
}

interface ManageUsersProps {
  users: UserItem[]
}

export default function ManageUsers({ users: initialUsers }: ManageUsersProps) {
  const [users, setUsers] = useState<UserItem[]>(initialUsers)
  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState('all')
  const [editingUser, setEditingUser] = useState<UserItem | null>(null)
  
  // Edit Form Fields
  const [fullName, setFullName] = useState('')
  const [phone, setPhone] = useState('')
  const [learningGroup, setLearningGroup] = useState('')
  const [workGroup, setWorkGroup] = useState('')
  const [position, setPosition] = useState('')
  const [academicStanding, setAcademicStanding] = useState('')
  const [advisorRole, setAdvisorRole] = useState('')
  const [responsibleRoom, setResponsibleRoom] = useState('')
  const [userRole, setUserRole] = useState('')

  // State Management
  const [loading, setLoading] = useState(false)
  const [successMsg, setSuccessMsg] = useState<string | null>(null)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [alertConfig, setAlertConfig] = useState<{ type: 'success' | 'error' | 'warning' | 'info'; title: string; message: string } | null>(null)

  const handleEditClick = (user: UserItem) => {
    setEditingUser(user)
    setFullName(user.full_name || '')
    setPhone(user.phone || '')
    setLearningGroup(user.learning_group || '')
    setWorkGroup(user.work_group || '')
    setPosition(user.position || '')
    setAcademicStanding(user.academic_standing || '')
    setAdvisorRole(user.advisor_role || '')
    setResponsibleRoom(user.responsible_room || '')
    setUserRole(user.role || 'user')
    setSuccessMsg(null)
    setErrorMsg(null)
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingUser) return

    setLoading(true)
    setSuccessMsg(null)
    setErrorMsg(null)

    const res = await updateUserRoleAndProfile(editingUser.id, {
      fullName,
      phone,
      learningGroup,
      workGroup,
      position,
      academicStanding,
      advisorRole,
      responsibleRoom,
      role: userRole
    })

    if (res.error) {
      setErrorMsg(res.error)
      setAlertConfig({ type: 'error', title: 'อัปเดตไม่สำเร็จ', message: res.error })
      setLoading(false)
    } else {
      setSuccessMsg('อัปเดตข้อมูลผู้ใช้งานและสิทธิ์การเข้าใช้งานเรียบร้อยแล้ว')
      setAlertConfig({ type: 'success', title: 'อัปเดตสำเร็จ', message: 'อัปเดตข้อมูลผู้ใช้งานและสิทธิ์การเข้าใช้งานเรียบร้อยแล้ว' })
      
      // Update local state
      setUsers(prev => prev.map(u => u.id === editingUser.id ? {
        ...u,
        full_name: fullName,
        phone,
        learning_group: learningGroup,
        work_group: workGroup,
        position,
        academic_standing: academicStanding,
        advisor_role: advisorRole,
        responsible_room: responsibleRoom,
        role: userRole
      } : u))
      
      setTimeout(() => {
        setEditingUser(null)
      }, 1000)
    }
  }

  // Filter and Search logic
  const filteredUsers = users.filter(u => {
    const matchesSearch = 
      (u.full_name || '').toLowerCase().includes(search.toLowerCase()) ||
      (u.email || '').toLowerCase().includes(search.toLowerCase())
    
    const matchesRole = roleFilter === 'all' || u.role === roleFilter

    return matchesSearch && matchesRole
  })

  const getRoleLabel = (roleName: string) => {
    switch (roleName) {
      case 'admin': return 'Admin (ผู้ดูแลระบบสูงสุด)'
      case 'subadmin': return 'Subadmin (ผู้ช่วยผู้ดูแล)'
      case 'admin booking': return 'Booking Admin (ผู้ดูแลการจอง)'
      case 'Housekeeper': return 'Housekeeper (แม่บ้าน/ผู้ดูแลห้อง)'
      case 'teacher': return 'Teacher (ครู)'
      default: return 'User (สมาชิกทั่วไป)'
    }
  }

  const getRoleBadgeClass = (roleName: string) => {
    switch (roleName) {
      case 'admin': return 'badge-admin'
      case 'subadmin': return 'badge-subadmin'
      case 'admin booking': return 'badge-booking-admin'
      case 'Housekeeper': return 'badge-housekeeper'
      case 'teacher': return 'badge-teacher'
      default: return 'badge-user'
    }
  }

  return (
    <div style={{ marginTop: '24px' }}>
      
      {/* Search & Filter Bar */}
      <div className="glass-panel" style={{ padding: '20px', marginBottom: '24px', display: 'flex', flexWrap: 'wrap', gap: '16px', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flex: 1, minWidth: '260px' }}>
          <div style={{ position: 'relative', width: '100%' }}>
            <Search size={18} style={{ position: 'absolute', left: '12px', top: '12px', color: 'var(--text-muted)' }} />
            <input 
              type="text" 
              className="form-input" 
              style={{ paddingLeft: '40px' }}
              placeholder="ค้นหาชื่อ หรือ อีเมลสมาชิก..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          <Filter size={18} style={{ color: 'var(--text-muted)' }} />
          <select 
            className="form-input" 
            style={{ width: '220px', appearance: 'auto' }}
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
          >
            <option value="all">ทั้งหมด ทุกสิทธิ์</option>
            <option value="admin">Admin</option>
            <option value="subadmin">Subadmin</option>
            <option value="admin booking">Booking Admin</option>
            <option value="Housekeeper">Housekeeper</option>
            <option value="teacher">Teacher</option>
            <option value="user">User</option>
          </select>
        </div>
      </div>

      {/* Users List Container */}
      <div className="glass-panel" style={{ padding: '24px', overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '12px' }}>
              <th style={{ padding: '12px 16px', color: 'var(--text-muted)', fontSize: '0.85rem', fontWeight: 600 }}>โปรไฟล์</th>
              <th style={{ padding: '12px 16px', color: 'var(--text-muted)', fontSize: '0.85rem', fontWeight: 600 }}>ชื่อ-นามสกุล / อีเมล</th>
              <th style={{ padding: '12px 16px', color: 'var(--text-muted)', fontSize: '0.85rem', fontWeight: 600 }}>กลุ่มสาระฯ / กลุ่มงาน</th>
              <th style={{ padding: '12px 16px', color: 'var(--text-muted)', fontSize: '0.85rem', fontWeight: 600 }}>ตำแหน่ง / วิทยฐานะ</th>
              <th style={{ padding: '12px 16px', color: 'var(--text-muted)', fontSize: '0.85rem', fontWeight: 600 }}>สิทธิ์การใช้งาน</th>
              <th style={{ padding: '12px 16px', color: 'var(--text-muted)', fontSize: '0.85rem', fontWeight: 600, textAlign: 'center' }}>จัดการ</th>
            </tr>
          </thead>
          <tbody>
            {filteredUsers.length === 0 ? (
              <tr>
                <td colSpan={6} style={{ textAlign: 'center', padding: '40px', color: 'var(--text-secondary)' }}>
                  ไม่พบข้อมูลสมาชิกในระบบตามเงื่อนไขค้นหา
                </td>
              </tr>
            ) : (
              filteredUsers.map((u) => (
                <tr key={u.id} style={{ borderBottom: '1px solid var(--border-color)', transition: 'background 0.2s' }} className="user-row">
                  {/* Profile Image */}
                  <td style={{ padding: '16px' }}>
                    <div style={{
                      width: '42px',
                      height: '42px',
                      borderRadius: '50%',
                      overflow: 'hidden',
                      border: '2px solid var(--primary)',
                      background: 'rgba(255, 182, 193, 0.2)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '1.1rem',
                      fontWeight: 700,
                      color: 'var(--primary)'
                    }}>
                      {u.avatar_url ? (
                        <img src={u.avatar_url} alt="Avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      ) : (
                        <span>{(u.full_name || 'U').charAt(0).toUpperCase()}</span>
                      )}
                    </div>
                  </td>

                  {/* Name & Email */}
                  <td style={{ padding: '16px' }}>
                    <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{u.full_name || 'ไม่ระบุชื่อ'}</div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{u.email}</div>
                    {u.phone && <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>📞 {u.phone}</div>}
                  </td>

                  {/* Group Info */}
                  <td style={{ padding: '16px', fontSize: '0.9rem' }}>
                    <div>{u.learning_group || '-'}</div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{u.work_group || '-'}</div>
                  </td>

                  {/* Position Info */}
                  <td style={{ padding: '16px', fontSize: '0.9rem' }}>
                    <div>{u.position || '-'}</div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{u.academic_standing || '-'}</div>
                  </td>

                  {/* System Role */}
                  <td style={{ padding: '16px' }}>
                    <span className={`badge ${getRoleBadgeClass(u.role)}`}>
                      {u.role.toUpperCase()}
                    </span>
                  </td>

                  {/* Actions */}
                  <td style={{ padding: '16px', textAlign: 'center' }}>
                    <button 
                      onClick={() => handleEditClick(u)} 
                      className="btn btn-secondary" 
                      style={{ padding: '8px 12px', fontSize: '0.8rem', gap: '4px' }}
                    >
                      <Edit2 size={12} />
                      <span>แก้ไขสิทธิ์</span>
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* EDIT MODAL */}
      {editingUser && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.5)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '20px'
        }}>
          <div className="glass-panel" style={{
            width: '100%',
            maxWidth: '650px',
            background: 'white',
            border: 'none',
            padding: '30px',
            maxHeight: '90vh',
            overflowY: 'auto',
            position: 'relative',
            boxShadow: '0 20px 50px rgba(0,0,0,0.15)'
          }}>
            {/* Close Button */}
            <button 
              onClick={() => setEditingUser(null)}
              style={{
                position: 'absolute',
                top: '20px',
                right: '20px',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                color: 'var(--text-secondary)'
              }}
            >
              <X size={20} />
            </button>

            <h3 style={{ fontSize: '1.3rem', display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '24px' }}>
              <User size={20} style={{ color: 'var(--primary)' }} />
              แก้ไขสิทธิ์และข้อมูลสมาชิก
            </h3>

            {successMsg && (
              <div style={{
                background: 'rgba(34, 197, 94, 0.1)',
                border: '1px solid rgba(34, 197, 94, 0.2)',
                borderRadius: '8px',
                color: 'var(--success)',
                fontSize: '0.9rem',
                padding: '12px',
                marginBottom: '20px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}>
                <CheckCircle size={16} />
                {successMsg}
              </div>
            )}

            {errorMsg && (
              <div style={{
                background: 'rgba(239, 68, 68, 0.1)',
                border: '1px solid rgba(239, 68, 68, 0.2)',
                borderRadius: '8px',
                color: 'var(--danger)',
                fontSize: '0.9rem',
                padding: '12px',
                marginBottom: '20px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}>
                <AlertCircle size={16} />
                {errorMsg}
              </div>
            )}

            <form onSubmit={handleSave} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px 20px' }}>
              
              <div className="form-group" style={{ gridColumn: 'span 2' }}>
                <label className="form-label">สิทธิ์การเข้าใช้งานระบบ (System Role) *</label>
                <select 
                  className="form-input" 
                  value={userRole} 
                  onChange={(e) => setUserRole(e.target.value)}
                  style={{ appearance: 'auto', fontWeight: 600, color: 'var(--primary)', borderColor: 'var(--primary)' }}
                  required
                >
                  <option value="user">User (ผู้ใช้ทั่วไป)</option>
                  <option value="teacher">Teacher (คุณครู)</option>
                  <option value="Housekeeper">Housekeeper (แม่บ้าน/ผู้ดูแลความสะอาด)</option>
                  <option value="admin booking">Booking Admin (ผู้ดูแลการจอง)</option>
                  <option value="subadmin">Subadmin (ผู้ช่วยผู้ดูแลระบบ)</option>
                  <option value="admin">Admin (ผู้ดูแลระบบสูงสุด)</option>
                </select>
              </div>

              <div className="form-group" style={{ gridColumn: 'span 2' }}>
                <label className="form-label">ชื่อ-นามสกุล (Full Name)</label>
                <input 
                  type="text" 
                  className="form-input" 
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="นายสมชาย ใจดี"
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">อีเมล (Email - แก้ไขไม่ได้)</label>
                <input 
                  type="email" 
                  className="form-input" 
                  value={editingUser.email || ''}
                  disabled 
                  style={{ background: 'rgba(0,0,0,0.03)', cursor: 'not-allowed' }}
                />
              </div>

              <div className="form-group">
                <label className="form-label">เบอร์โทรศัพท์ (Phone)</label>
                <input 
                  type="tel" 
                  className="form-input" 
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="089-XXXXXXX"
                />
              </div>

              <div className="form-group">
                <label className="form-label">กลุ่มสาระการเรียนรู้</label>
                <select 
                  className="form-input" 
                  value={learningGroup} 
                  onChange={(e) => setLearningGroup(e.target.value)}
                  style={{ appearance: 'auto' }}
                >
                  <option value="">-- เลือกกลุ่มสาระฯ --</option>
                  <option value="กลุ่มสาระฯ ภาษาไทย">กลุ่มสาระฯ ภาษาไทย</option>
                  <option value="กลุ่มสาระฯ คณิตศาสตร์">กลุ่มสาระฯ คณิตศาสตร์</option>
                  <option value="กลุ่มสาระฯ วิทยาศาสตร์และเทคโนโลยี">กลุ่มสาระฯ วิทยาศาสตร์และเทคโนโลยี</option>
                  <option value="กลุ่มสาระฯ สังคมศึกษา ศาสนา และวัฒนธรรม">กลุ่มสาระฯ สังคมศึกษา ศาสนา และวัฒนธรรม</option>
                  <option value="กลุ่มสาระฯ สุขศึกษาและพลศึกษา">กลุ่มสาระฯ สุขศึกษาและพลศึกษา</option>
                  <option value="กลุ่มสาระฯ ศิลปะ">กลุ่มสาระฯ ศิลปะ</option>
                  <option value="กลุ่มสาระฯ การงานอาชีพ">กลุ่มสาระฯ การงานอาชีพ</option>
                  <option value="กลุ่มสาระฯ ภาษาต่างประเทศ">กลุ่มสาระฯ ภาษาต่างประเทศ</option>
                  <option value="กิจกรรมพัฒนาผู้เรียน">กิจกรรมพัฒนาผู้เรียน</option>
                  <option value="อื่นๆ / ไม่ระบุ">อื่นๆ / ไม่ระบุ</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">กลุ่มงาน</label>
                <select 
                  className="form-input" 
                  value={workGroup} 
                  onChange={(e) => setWorkGroup(e.target.value)}
                  style={{ appearance: 'auto' }}
                >
                  <option value="">-- เลือกกลุ่มงาน --</option>
                  <option value="กลุ่มบริหารวิชาการ">กลุ่มบริหารวิชาการ</option>
                  <option value="กลุ่มบริหารงบประมาณ">กลุ่มบริหารงบประมาณ</option>
                  <option value="กลุ่มบริหารงานบุคคล">กลุ่มบริหารงานบุคคล</option>
                  <option value="กลุ่มบริหารทั่วไป">กลุ่มบริหารทั่วไป</option>
                  <option value="อื่นๆ / ไม่ระบุ">อื่นๆ / ไม่ระบุ</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">ตำแหน่ง</label>
                <select 
                  className="form-input" 
                  value={position} 
                  onChange={(e) => setPosition(e.target.value)}
                  style={{ appearance: 'auto' }}
                >
                  <option value="">-- เลือกตำแหน่ง --</option>
                  <option value="ผู้อำนวยการโรงเรียน">ผู้อำนวยการโรงเรียน</option>
                  <option value="รองผู้อำนวยการโรงเรียน">รองผู้อำนวยการโรงเรียน</option>
                  <option value="ครู">ครู</option>
                  <option value="ครูผู้ช่วย">ครูผู้ช่วย</option>
                  <option value="พนักงานราชการ">พนักงานราชการ</option>
                  <option value="ครูอัตราจ้าง">ครูอัตราจ้าง</option>
                  <option value="เจ้าหน้าที่ธุรการ">เจ้าหน้าที่ธุรการ</option>
                  <option value="อื่นๆ">อื่นๆ</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">วิทยฐานะ</label>
                <select 
                  className="form-input" 
                  value={academicStanding} 
                  onChange={(e) => setAcademicStanding(e.target.value)}
                  style={{ appearance: 'auto' }}
                >
                  <option value="">-- เลือกวิทยฐานะ --</option>
                  <option value="ไม่มีวิทยฐานะ">ไม่มีวิทยฐานะ</option>
                  <option value="ครูชำนาญการ">ครูชำนาญการ</option>
                  <option value="ครูชำนาญการพิเศษ">ครูชำนาญการพิเศษ</option>
                  <option value="ครูเชี่ยวชาญ">ครูเชี่ยวชาญ</option>
                  <option value="ครูเชี่ยวชาญพิเศษ">ครูเชี่ยวชาญพิเศษ</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">ครูที่ปรึกษา</label>
                <input 
                  type="text" 
                  className="form-input" 
                  value={advisorRole}
                  onChange={(e) => setAdvisorRole(e.target.value)}
                  placeholder="เช่น ม.1/1"
                />
              </div>

              <div className="form-group">
                <label className="form-label">ห้องที่รับผิดชอบ</label>
                <input 
                  type="text" 
                  className="form-input" 
                  value={responsibleRoom}
                  onChange={(e) => setResponsibleRoom(e.target.value)}
                  placeholder="เช่น ห้อง 411"
                />
              </div>

              <div style={{ gridColumn: 'span 2', display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '16px' }}>
                <button 
                  type="button" 
                  className="btn btn-secondary" 
                  onClick={() => setEditingUser(null)}
                  disabled={loading}
                >
                  ยกเลิก
                </button>
                <button 
                  type="submit" 
                  className="btn btn-primary" 
                  style={{ padding: '12px 30px' }}
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <RefreshCw className="animate-spin" size={16} style={{ animation: 'spin 1s linear infinite' }} />
                      กำลังบันทึก...
                    </>
                  ) : (
                    'บันทึกการแก้ไข'
                  )}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      <style jsx global>{`
        .user-row:hover {
          background: rgba(255, 182, 193, 0.05);
        }
      `}</style>
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
