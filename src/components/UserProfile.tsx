'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/utils/supabase/client'
import { 
  User, Mail, Phone, Briefcase, GraduationCap, 
  Home, BookOpen, Camera, Key, RefreshCw, 
  CheckCircle, AlertCircle, Users, Award 
} from 'lucide-react'

export default function UserProfile() {
  const supabase = createClient()
  const [user, setUser] = useState<any>(null)
  
  // Profile Fields
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [learningGroup, setLearningGroup] = useState('')
  const [workGroup, setWorkGroup] = useState('')
  const [position, setPosition] = useState('')
  const [academicStanding, setAcademicStanding] = useState('')
  const [advisorRole, setAdvisorRole] = useState('')
  const [responsibleRoom, setResponsibleRoom] = useState('')
  const [avatarUrl, setAvatarUrl] = useState('')

  // Password Fields
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')

  // State Management
  const [loading, setLoading] = useState(true)
  const [saveLoading, setSaveLoading] = useState(false)
  const [passwordLoading, setPasswordLoading] = useState(false)
  const [uploadLoading, setUploadLoading] = useState(false)
  
  const [successMsg, setSuccessMsg] = useState<string | null>(null)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [passwordSuccessMsg, setPasswordSuccessMsg] = useState<string | null>(null)
  const [passwordErrorMsg, setPasswordErrorMsg] = useState<string | null>(null)

  useEffect(() => {
    async function loadProfile() {
      try {
        const { data: { user: authUser } } = await supabase.auth.getUser()
        if (authUser) {
          setUser(authUser)
          setEmail(authUser.email || '')
          
          const { data: profile, error } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', authUser.id)
            .single()
            
          if (profile) {
            setFullName(profile.full_name || '')
            setPhone(profile.phone || '')
            setLearningGroup(profile.learning_group || '')
            setWorkGroup(profile.work_group || '')
            setPosition(profile.position || '')
            setAcademicStanding(profile.academic_standing || '')
            setAdvisorRole(profile.advisor_role || '')
            setResponsibleRoom(profile.responsible_room || '')
            setAvatarUrl(profile.avatar_url || '')
          }
        }
      } catch (err) {
        console.error('Error loading profile:', err)
      } finally {
        setLoading(false)
      }
    }
    loadProfile()
  }, [])

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaveLoading(true)
    setSuccessMsg(null)
    setErrorMsg(null)

    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          full_name: fullName,
          phone,
          learning_group: learningGroup,
          work_group: workGroup,
          position,
          academic_standing: academicStanding,
          advisor_role: advisorRole,
          responsible_room: responsibleRoom,
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id)

      if (error) throw error

      setSuccessMsg('บันทึกข้อมูลส่วนตัวเรียบร้อยแล้ว')
      // Dispatch event to refresh Navbar
      window.dispatchEvent(new Event('profile-updated'))
    } catch (err: any) {
      setErrorMsg(err.message || 'เกิดข้อผิดพลาดในการบันทึกข้อมูล')
    } finally {
      setSaveLoading(false)
    }
  }

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return
    const file = e.target.files[0]
    
    // Check file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      setErrorMsg('ขนาดไฟล์ภาพต้องไม่เกิน 2MB')
      return
    }

    setUploadLoading(true)
    setErrorMsg(null)
    setSuccessMsg(null)

    try {
      const fileExt = file.name.split('.').pop()
      const filePath = `${user.id}/${Date.now()}.${fileExt}`

      // Upload file to the storage bucket
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file, { upsert: true })

      if (uploadError) throw uploadError

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath)

      // Update profiles table with avatar_url
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ avatar_url: publicUrl })
        .eq('id', user.id)

      if (updateError) throw updateError

      setAvatarUrl(publicUrl)
      setSuccessMsg('อัปโหลดรูปภาพโปรไฟล์เรียบร้อยแล้ว')
      window.dispatchEvent(new Event('profile-updated'))
    } catch (err: any) {
      setErrorMsg(err.message || 'เกิดข้อผิดพลาดในการอัปโหลดรูปภาพ')
    } finally {
      setUploadLoading(false)
    }
  }

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (newPassword.length < 6) {
      setPasswordErrorMsg('รหัสผ่านต้องมีความยาวอย่างน้อย 6 ตัวอักษร')
      return
    }

    if (newPassword !== confirmPassword) {
      setPasswordErrorMsg('รหัสผ่านและการยืนยันรหัสผ่านไม่ตรงกัน')
      return
    }

    setPasswordLoading(true)
    setPasswordSuccessMsg(null)
    setPasswordErrorMsg(null)

    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword
      })

      if (error) throw error

      setPasswordSuccessMsg('เปลี่ยนรหัสผ่านเรียบร้อยแล้ว')
      setNewPassword('')
      setConfirmPassword('')
    } catch (err: any) {
      setPasswordErrorMsg(err.message || 'เกิดข้อผิดพลาดในการเปลี่ยนรหัสผ่าน')
    } finally {
      setPasswordLoading(false)
    }
  }

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh', gap: '8px' }}>
        <RefreshCw className="animate-spin" size={24} style={{ color: 'var(--primary)', animation: 'spin 1s linear infinite' }} />
        <span>กำลังโหลดข้อมูลโปรไฟล์...</span>
      </div>
    )
  }

  return (
    <div style={{ 
      display: 'grid', 
      gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', 
      gap: '24px', 
      paddingTop: '20px'
    }}>
      
      {/* LEFT COLUMN: Avatar & Change Password */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        
        {/* Card 1: Avatar Upload & Quick Stats */}
        <div className="glass-panel" style={{ padding: '30px', textAlign: 'center' }}>
          <div style={{ position: 'relative', width: '120px', height: '120px', margin: '0 auto 20px auto' }}>
            <div style={{
              width: '120px',
              height: '120px',
              borderRadius: '50%',
              overflow: 'hidden',
              border: '4px solid var(--primary)',
              background: 'rgba(255, 182, 193, 0.25)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '3rem',
              fontWeight: 800,
              color: 'var(--primary)'
            }}>
              {avatarUrl ? (
                <img src={avatarUrl} alt="Profile" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : (
                <span>{fullName.charAt(0).toUpperCase()}</span>
              )}
            </div>
            
            {/* Upload Button overlay */}
            <label style={{
              position: 'absolute',
              bottom: '0',
              right: '0',
              background: 'var(--primary)',
              color: 'white',
              width: '36px',
              height: '36px',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              boxShadow: '0 4px 10px rgba(0,0,0,0.15)',
              transition: 'all 0.2s'
            }} className="btn-primary">
              <Camera size={18} />
              <input 
                type="file" 
                accept="image/*" 
                onChange={handleAvatarUpload} 
                style={{ display: 'none' }}
                disabled={uploadLoading}
              />
            </label>
          </div>

          <h3 style={{ fontSize: '1.4rem', fontWeight: 700, marginBottom: '4px' }}>{fullName || 'ผู้ใช้งานระบบ'}</h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '16px' }}>{email}</p>
          
          {uploadLoading && (
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem', color: 'var(--primary)' }}>
              <RefreshCw className="animate-spin" size={14} style={{ animation: 'spin 1s linear infinite' }} />
              <span>กำลังอัปโหลดรูปภาพ...</span>
            </div>
          )}
        </div>

        {/* Card 2: Change Password */}
        <div className="glass-panel" style={{ padding: '30px' }}>
          <h3 style={{ fontSize: '1.2rem', display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '20px' }}>
            <Key size={18} style={{ color: 'var(--primary)' }} />
            เปลี่ยนรหัสผ่าน
          </h3>

          {passwordSuccessMsg && (
            <div style={{
              background: 'rgba(34, 197, 94, 0.1)',
              border: '1px solid rgba(34, 197, 94, 0.2)',
              borderRadius: '8px',
              color: 'var(--success)',
              fontSize: '0.85rem',
              padding: '10px',
              marginBottom: '16px',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}>
              <CheckCircle size={14} />
              {passwordSuccessMsg}
            </div>
          )}

          {passwordErrorMsg && (
            <div style={{
              background: 'rgba(239, 68, 68, 0.1)',
              border: '1px solid rgba(239, 68, 68, 0.2)',
              borderRadius: '8px',
              color: 'var(--danger)',
              fontSize: '0.85rem',
              padding: '10px',
              marginBottom: '16px',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}>
              <AlertCircle size={14} />
              {passwordErrorMsg}
            </div>
          )}

          <form onSubmit={handleChangePassword} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div className="form-group">
              <label className="form-label" htmlFor="newPassword">รหัสผ่านใหม่ (อย่างน้อย 6 ตัวอักษร)</label>
              <input 
                type="password" 
                id="newPassword" 
                className="form-input" 
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="••••••••"
                required
              />
            </div>
            
            <div className="form-group">
              <label className="form-label" htmlFor="confirmPassword">ยืนยันรหัสผ่านใหม่</label>
              <input 
                type="password" 
                id="confirmPassword" 
                className="form-input" 
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
                required
              />
            </div>

            <button type="submit" className="btn btn-primary" style={{ width: '100%', padding: '12px' }} disabled={passwordLoading}>
              {passwordLoading ? (
                <>
                  <RefreshCw className="animate-spin" size={16} style={{ animation: 'spin 1s linear infinite' }} />
                  กำลังเปลี่ยนรหัสผ่าน...
                </>
              ) : (
                'บันทึกรหัสผ่านใหม่'
              )}
            </button>
          </form>
        </div>
      </div>

      {/* RIGHT COLUMN: Personal Info Form */}
      <div className="glass-panel" style={{ padding: '30px' }}>
        <h3 style={{ fontSize: '1.3rem', display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '24px' }}>
          <User size={20} style={{ color: 'var(--primary)' }} />
          ข้อมูลส่วนตัวและข้อมูลบุคลากร
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

        <form onSubmit={handleUpdateProfile} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px 20px' }}>
          
          <div className="form-group" style={{ gridColumn: 'span 2' }}>
            <label className="form-label">
              <User size={12} style={{ marginRight: '4px', verticalAlign: 'middle' }} />
              ชื่อ-นามสกุล (Full Name)
            </label>
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
            <label className="form-label">
              <Mail size={12} style={{ marginRight: '4px', verticalAlign: 'middle' }} />
              อีเมล (Email - แก้ไขไม่ได้)
            </label>
            <input 
              type="email" 
              className="form-input" 
              value={email}
              disabled 
              style={{ background: 'rgba(0,0,0,0.02)', cursor: 'not-allowed' }}
            />
          </div>

          <div className="form-group">
            <label className="form-label">
              <Phone size={12} style={{ marginRight: '4px', verticalAlign: 'middle' }} />
              เบอร์โทรศัพท์ (Phone)
            </label>
            <input 
              type="tel" 
              className="form-input" 
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="089-XXXXXXX"
            />
          </div>

          <div className="form-group">
            <label className="form-label">
              <BookOpen size={12} style={{ marginRight: '4px', verticalAlign: 'middle' }} />
              กลุ่มสาระการเรียนรู้ (Learning Group)
            </label>
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
            <label className="form-label">
              <Users size={12} style={{ marginRight: '4px', verticalAlign: 'middle' }} />
              กลุ่มงาน (Work Group)
            </label>
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
            <label className="form-label">
              <Briefcase size={12} style={{ marginRight: '4px', verticalAlign: 'middle' }} />
              ตำแหน่ง (Position)
            </label>
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
            <label className="form-label">
              <Award size={12} style={{ marginRight: '4px', verticalAlign: 'middle' }} />
              วิทยฐานะ (Academic Standing)
            </label>
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
            <label className="form-label">
              <GraduationCap size={12} style={{ marginRight: '4px', verticalAlign: 'middle' }} />
              ครูที่ปรึกษาชั้น/ห้อง (Advisor Role)
            </label>
            <input 
              type="text" 
              className="form-input" 
              value={advisorRole}
              onChange={(e) => setAdvisorRole(e.target.value)}
              placeholder="ม.1/1 (ระบุ 'ไม่มี' หากไม่ได้เป็น)"
            />
          </div>

          <div className="form-group">
            <label className="form-label">
              <Home size={12} style={{ marginRight: '4px', verticalAlign: 'middle' }} />
              ห้องที่รับผิดชอบ (Responsible Room)
            </label>
            <input 
              type="text" 
              className="form-input" 
              value={responsibleRoom}
              onChange={(e) => setResponsibleRoom(e.target.value)}
              placeholder="ห้อง 411 (ระบุ 'ไม่มี' หากไม่มี)"
            />
          </div>

          <div style={{ gridColumn: 'span 2', display: 'flex', justifyContent: 'flex-end', marginTop: '16px' }}>
            <button type="submit" className="btn btn-primary" style={{ padding: '14px 40px' }} disabled={saveLoading}>
              {saveLoading ? (
                <>
                  <RefreshCw className="animate-spin" size={18} style={{ animation: 'spin 1s linear infinite' }} />
                  กำลังบันทึกข้อมูล...
                </>
              ) : (
                'บันทึกข้อมูลส่วนตัว'
              )}
            </button>
          </div>

        </form>
      </div>

      <style jsx global>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .animate-spin {
          animation: spin 1s linear infinite;
        }
        .nav-profile-link:hover {
          background: rgba(255, 182, 193, 0.18) !important;
        }
      `}</style>
    </div>
  )
}
