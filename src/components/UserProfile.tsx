'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/utils/supabase/client'
import { useRouter } from 'next/navigation'
import { 
  User, Mail, Phone, Briefcase, GraduationCap, 
  Home, BookOpen, Camera, Key, RefreshCw, 
  CheckCircle, AlertCircle, Users, Award, Bell
} from 'lucide-react'
import { playNotificationSound } from '@/utils/audio'
import { savePushSubscription } from '@/app/actions/push'
import AlertModal from '@/components/AlertModal'

export default function UserProfile() {
  const supabase = createClient()
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [userRole, setUserRole] = useState('user')
  
  // Name Popup States
  const [showNamePopup, setShowNamePopup] = useState(false)
  const [popupPrefix, setPopupPrefix] = useState('')
  const [popupFirstName, setPopupFirstName] = useState('')
  const [popupLastName, setPopupLastName] = useState('')
  const [popupError, setPopupError] = useState<string | null>(null)
  const [popupLoading, setPopupLoading] = useState(false)
  const [customPrefix, setCustomPrefix] = useState('')

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

  // Notification settings fields
  const [pushPermission, setPushPermission] = useState<string>('default')
  const [soundType, setSoundType] = useState('bell')
  const [reminderSoundType, setReminderSoundType] = useState('chime')
  const [soundVolume, setSoundVolume] = useState(0.5)
  const [showPopup, setShowPopup] = useState(true)
  const [notiVibrate, setNotiVibrate] = useState(true)

  // State Management
  const [loading, setLoading] = useState(true)
  const [saveLoading, setSaveLoading] = useState(false)
  const [passwordLoading, setPasswordLoading] = useState(false)
  const [uploadLoading, setUploadLoading] = useState(false)
  
  const [successMsg, setSuccessMsg] = useState<string | null>(null)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [passwordSuccessMsg, setPasswordSuccessMsg] = useState<string | null>(null)
  const [passwordErrorMsg, setPasswordErrorMsg] = useState<string | null>(null)
  const [notiSuccess, setNotiSuccess] = useState<string | null>(null)
  const [alertConfig, setAlertConfig] = useState<{ type: 'success' | 'error' | 'warning' | 'info'; title: string; message: string } | null>(null)

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
            setUserRole(profile.role || 'user')

            // Check if URL has ?setup=true to prompt for real name/popup
            if (typeof window !== 'undefined') {
              const params = new URLSearchParams(window.location.search)
              if (params.get('setup') === 'true' && !profile.phone) {
                setShowNamePopup(true)
                
                // Pre-populate name fields if they already have full_name (e.g. email register)
                if (profile.full_name) {
                  const name = profile.full_name.trim()
                  const prefixes = ["นาย", "นางสาว", "นาง", "ดร.", "ครู", "อาจารย์"]
                  let matchedPrefix = ''
                  for (const p of prefixes) {
                    if (name.startsWith(p)) {
                      matchedPrefix = p
                      break
                    }
                  }
                  
                  if (matchedPrefix) {
                    setPopupPrefix(matchedPrefix)
                    const nameWithoutPrefix = name.substring(matchedPrefix.length).trim()
                    const parts = nameWithoutPrefix.split(/\s+/)
                    setPopupFirstName(parts[0] || '')
                    setPopupLastName(parts.slice(1).join(' '))
                  } else {
                    const parts = name.split(/\s+/)
                    if (parts.length > 0) {
                      setPopupFirstName(parts[0])
                      setPopupLastName(parts.slice(1).join(' '))
                    }
                  }
                }
              }
            }


          }
        }
      } catch (err) {
        console.error('Error loading profile:', err)
      } finally {
        setLoading(false)
      }
    }
    
    loadProfile()

    // Read Notification System permission status
    if ('Notification' in window) {
      setPushPermission(Notification.permission)
      if (Notification.permission === 'granted') {
        // Auto-refresh push subscription in database on load to keep it updated
        subscribeToPush()
      }
    }

    // Read local storage settings
    if (typeof window !== 'undefined') {
      setSoundType(localStorage.getItem('noti_sound_type') || 'bell')
      setReminderSoundType(localStorage.getItem('reminder_sound_type') || 'chime')
      setSoundVolume(parseFloat(localStorage.getItem('noti_sound_volume') || '0.5'))
      setShowPopup(localStorage.getItem('noti_show_popup') !== 'false')
      setNotiVibrate(localStorage.getItem('noti_vibrate') !== 'false')
    }
  }, [])

  const handleSaveSetupPopup = async (e: React.FormEvent) => {
    e.preventDefault()
    const finalPrefix = popupPrefix === 'อื่นๆ' ? customPrefix.trim() : popupPrefix;
    if (!finalPrefix || !popupFirstName.trim() || !popupLastName.trim() ||
        !phone.trim() || !learningGroup || !workGroup || !position ||
        !advisorRole.trim() || !responsibleRoom.trim()) {
      setPopupError('กรุณากรอกข้อมูลให้ครบถ้วนทุกช่อง')
      return
    }
    setPopupLoading(true)
    setPopupError(null)
    
    const combinedName = `${finalPrefix}${popupFirstName.trim()} ${popupLastName.trim()}`
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ 
          full_name: combinedName,
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

      setFullName(combinedName)
      setShowNamePopup(false)
      setAlertConfig({
        type: 'success',
        title: 'ตั้งค่าโปรไฟล์สำเร็จ',
        message: 'บันทึกข้อมูลส่วนตัวเรียบร้อยแล้ว กำลังนำคุณเข้าสู่ระบบ...'
      })
      // Dispatch event to refresh Navbar
      window.dispatchEvent(new Event('profile-updated'))

      // Redirect after a short delay
      const allowedAdminRoles = ['admin', 'subadmin', 'admin booking', 'Housekeeper']
      const nextUrl = allowedAdminRoles.includes(userRole) ? '/manage' : '/dashboard'
      setTimeout(() => {
        router.push(nextUrl)
      }, 1500)
    } catch (err: any) {
      setPopupError(err.message || 'เกิดข้อผิดพลาดในการบันทึกข้อมูล')
    } finally {
      setPopupLoading(false)
    }
  }

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaveLoading(true)
    setSuccessMsg(null)
    setErrorMsg(null)

    // Force check all fields
    if (!fullName.trim() || !phone.trim() || !learningGroup || !workGroup || !position || !advisorRole.trim() || !responsibleRoom.trim()) {
      setErrorMsg('กรุณากรอกข้อมูลส่วนตัวให้ครบถ้วนทุกช่อง')
      setAlertConfig({ 
        type: 'error', 
        title: 'ข้อมูลไม่ครบถ้วน', 
        message: 'กรุณากรอกข้อมูลส่วนตัวและเลือกค่าทุกช่องให้ครบถ้วนก่อนบันทึกข้อมูล' 
      })
      setSaveLoading(false)
      return
    }

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
      setAlertConfig({ type: 'success', title: 'บันทึกสำเร็จ', message: 'บันทึกข้อมูลส่วนตัวเรียบร้อยแล้ว' })
      // Dispatch event to refresh Navbar
      window.dispatchEvent(new Event('profile-updated'))

      // If we are in setup mode, redirect to the booking page
      const params = new URLSearchParams(window.location.search)
      if (params.get('setup') === 'true') {
        const allowedAdminRoles = ['admin', 'subadmin', 'admin booking', 'Housekeeper']
        const nextUrl = allowedAdminRoles.includes(userRole) ? '/manage' : '/dashboard'
        setTimeout(() => {
          router.push(nextUrl)
        }, 1500)
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'เกิดข้อผิดพลาดในการบันทึกข้อมูล')
      setAlertConfig({ type: 'error', title: 'บันทึกไม่สำเร็จ', message: err.message || 'เกิดข้อผิดพลาดในการบันทึกข้อมูล' })
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
      setAlertConfig({ type: 'error', title: 'ขนาดไฟล์เกินกำหนด', message: 'ขนาดไฟล์ภาพต้องไม่เกิน 2MB' })
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

      // Update avatar in profiles table
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ avatar_url: publicUrl, updated_at: new Date().toISOString() })
        .eq('id', user.id)

      if (updateError) throw updateError

      setAvatarUrl(publicUrl)
      setSuccessMsg('อัปโหลดรูปภาพโปรไฟล์เรียบร้อยแล้ว')
      setAlertConfig({ type: 'success', title: 'อัปโหลดสำเร็จ', message: 'อัปโหลดรูปภาพโปรไฟล์เรียบร้อยแล้ว' })
      // Dispatch event to refresh Navbar
      window.dispatchEvent(new Event('profile-updated'))
    } catch (err: any) {
      setErrorMsg(err.message || 'เกิดข้อผิดพลาดในการอัปโหลดรูปภาพ')
      setAlertConfig({ type: 'error', title: 'อัปโหลดไม่สำเร็จ', message: err.message || 'เกิดข้อผิดพลาดในการอัปโหลดรูปภาพ' })
    } finally {
      setUploadLoading(false)
    }
  }

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setPasswordSuccessMsg(null)
    setPasswordErrorMsg(null)

    if (newPassword !== confirmPassword) {
      setPasswordErrorMsg('รหัสผ่านและการยืนยันไม่ตรงกัน')
      setAlertConfig({ type: 'error', title: 'รหัสผ่านไม่ตรงกัน', message: 'รหัสผ่านและการยืนยันรหัสผ่านไม่ตรงกัน' })
      return
    }

    if (newPassword.length < 6) {
      setPasswordErrorMsg('รหัสผ่านต้องมีความยาวอย่างน้อย 6 ตัวอักษร')
      setAlertConfig({ type: 'error', title: 'รหัสผ่านสั้นเกินไป', message: 'รหัสผ่านต้องมีความยาวอย่างน้อย 6 ตัวอักษร' })
      return
    }

    setPasswordLoading(true)

    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword
      })

      if (error) throw error

      setPasswordSuccessMsg('เปลี่ยนรหัสผ่านเรียบร้อยแล้ว')
      setAlertConfig({ type: 'success', title: 'เปลี่ยนรหัสผ่านสำเร็จ', message: 'เปลี่ยนรหัสผ่านใหม่เรียบร้อยแล้ว' })
      setNewPassword('')
      setConfirmPassword('')
    } catch (err: any) {
      setPasswordErrorMsg(err.message || 'เกิดข้อผิดพลาดในการเปลี่ยนรหัสผ่าน')
      setAlertConfig({ type: 'error', title: 'เปลี่ยนรหัสผ่านไม่สำเร็จ', message: err.message || 'เกิดข้อผิดพลาดในการเปลี่ยนรหัสผ่าน' })
    } finally {
      setPasswordLoading(false)
    }
  }

  const subscribeToPush = async () => {
    if (typeof window === 'undefined' || !('serviceWorker' in navigator) || !('PushManager' in window)) return
    try {
      const reg = await navigator.serviceWorker.ready
      
      // VAPID Public Key to identify this app
      const PUBLIC_VAPID_KEY = 'BCZY4R7Mpz3u_LQ39j-Mfm0J9-RFvZ9-rRjeQWuEVKcXd-4fxCq2l485VsWc51rVqoE-mHxCvlMu0O7YejpfSz0'
      
      // Convert urlsafe base64 to Uint8Array
      const padding = '='.repeat((4 - PUBLIC_VAPID_KEY.length % 4) % 4)
      const base64 = (PUBLIC_VAPID_KEY + padding).replace(/\-/g, '+').replace(/_/g, '/')
      const rawData = window.atob(base64)
      const outputArray = new Uint8Array(rawData.length)
      for (let i = 0; i < rawData.length; ++i) {
        outputArray[i] = rawData.charCodeAt(i)
      }

      let sub = await reg.pushManager.getSubscription()
      if (!sub) {
        sub = await reg.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: outputArray
        })
      }

      if (sub) {
        const subJson = sub.toJSON()
        if (subJson.endpoint && subJson.keys?.p256dh && subJson.keys?.auth) {
          const res = await savePushSubscription({
            endpoint: subJson.endpoint,
            keys: {
              p256dh: subJson.keys.p256dh,
              auth: subJson.keys.auth
            }
          })
          if (res.error) console.error('DB save subscription error:', res.error)
        }
      }
    } catch (err) {
      console.error('Failed to subscribe browser to push:', err)
    }
  }

  const handleRequestPushPermission = async () => {
    if (!('Notification' in window)) {
      setAlertConfig({ type: 'warning', title: 'ไม่รองรับการแจ้งเตือน', message: 'เบราว์เซอร์หรืออุปกรณ์ของคุณไม่รองรับการแจ้งเตือนระบบ' })
      return
    }
    const permission = await Notification.requestPermission()
    setPushPermission(permission)
    if (permission === 'granted') {
      setNotiSuccess('อนุญาตสิทธิ์การแจ้งเตือนสำเร็จ!')
      setAlertConfig({ type: 'success', title: 'อนุญาตสำเร็จ', message: 'อนุญาตสิทธิ์การแจ้งเตือนเรียบร้อยแล้ว!' })
      await subscribeToPush()
      setTimeout(() => setNotiSuccess(null), 3000)
    } else if (permission === 'denied') {
      setAlertConfig({ type: 'error', title: 'สิทธิ์ถูกปฏิเสธ', message: 'สิทธิ์การแจ้งเตือนถูกปฏิเสธ โปรดเปิดอนุญาตการตั้งค่าบนเบราว์เซอร์ของคุณ' })
    }
  }

  const handleSaveNotiSettings = (
    newSound: string, 
    newReminderSound: string, 
    newVolume: number, 
    newPopup: boolean,
    newVibrate: boolean
  ) => {
    localStorage.setItem('noti_sound_type', newSound)
    localStorage.setItem('reminder_sound_type', newReminderSound)
    localStorage.setItem('noti_sound_volume', newVolume.toString())
    localStorage.setItem('noti_show_popup', newPopup.toString())
    localStorage.setItem('noti_vibrate', newVibrate.toString())
    
    // Save to IndexedDB for service worker access
    if (typeof window !== 'undefined' && 'indexedDB' in window) {
      try {
        const req = indexedDB.open('NotiSettings', 1);
        req.onupgradeneeded = (e: any) => {
          const db = e.target.result;
          if (!db.objectStoreNames.contains('settings')) {
            db.createObjectStore('settings');
          }
        };
        req.onsuccess = (e: any) => {
          const db = e.target.result;
          const tx = db.transaction('settings', 'readwrite');
          tx.objectStore('settings').put(newVibrate, 'noti_vibrate');
        };
      } catch (err) {
        console.error('IndexedDB save failed:', err);
      }
    }

    setNotiSuccess('บันทึกการตั้งค่าการแจ้งเตือนแล้ว!')
    setAlertConfig({ type: 'success', title: 'บันทึกสำเร็จ', message: 'บันทึกการตั้งค่าการแจ้งเตือนและระบบสั่นเรียบร้อยแล้ว!' })
    setTimeout(() => setNotiSuccess(null), 3000)
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
      
      {/* LEFT COLUMN: Avatar, Password, & Notification Settings */}
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

        {/* Card 3: Notification Settings */}
        <div className="glass-panel" style={{ padding: '30px' }}>
          <h3 style={{ fontSize: '1.2rem', display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '20px' }}>
            <Bell size={18} style={{ color: 'var(--primary)' }} />
            การตั้งค่าการแจ้งเตือน
          </h3>

          {notiSuccess && (
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
              {notiSuccess}
            </div>
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            
            {/* System Notification Status & Request button */}
            <div style={{ 
              padding: '12px', 
              background: 'rgba(0,0,0,0.015)', 
              border: '1px solid var(--border-color)', 
              borderRadius: '8px',
              display: 'flex',
              flexDirection: 'column',
              gap: '6px'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.8rem', fontWeight: 600 }}>การแจ้งเตือนผ่านเบราว์เซอร์:</span>
                {pushPermission === 'granted' ? (
                  <span style={{ fontSize: '0.72rem', color: 'var(--success)', fontWeight: 700 }}>🟢 เปิดสิทธิ์แล้ว</span>
                ) : pushPermission === 'denied' ? (
                  <span style={{ fontSize: '0.72rem', color: 'var(--danger)', fontWeight: 700 }}>🔴 บล็อกสิทธิ์อยู่</span>
                ) : (
                  <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 700 }}>🟡 รอการอนุญาต</span>
                )}
              </div>
              <p style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', margin: 0, lineHeight: 1.35 }}>
                {pushPermission === 'granted' 
                  ? 'ระบบจะแสดงป๊อปอัปแจ้งเตือนบนหน้าจอมือถือหรือคอมพิวเตอร์ของคุณแม้จะปิดหน้าแอปอยู่'
                  : pushPermission === 'denied'
                    ? 'สิทธิ์การแจ้งเตือนถูกปิดกั้น กรุณาเปิดการอนุญาตในเมนูตั้งค่าของเบราว์เซอร์/มือถือของคุณ'
                    : 'อนุญาตสิทธิ์เพื่อให้ระบบสามารถส่งการแจ้งเตือนเด้งขึ้นบนอุปกรณ์ของคุณได้'
                }
              </p>
              {pushPermission !== 'granted' && (
                <button 
                  type="button" 
                  onClick={handleRequestPushPermission}
                  className="btn btn-secondary" 
                  style={{ width: '100%', padding: '6px 12px', fontSize: '0.78rem', marginTop: '4px' }}
                >
                  ขอสิทธิ์การแจ้งเตือน
                </button>
              )}
            </div>

            {/* Sound Style selection dropdown */}
            <div className="form-group">
              <label className="form-label" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span>เสียงแจ้งเตือนทั่วไป / บุ๊คกิ้งใหม่ (Ringtone)</span>
                <button 
                  type="button" 
                  onClick={() => playNotificationSound(soundType, soundVolume)}
                  style={{ background: 'none', border: 'none', color: 'var(--primary)', fontSize: '0.75rem', fontWeight: 600, cursor: 'pointer' }}
                >
                  🔊 ทดลองฟัง
                </button>
              </label>
              <select 
                className="form-input" 
                value={soundType}
                onChange={(e) => {
                  setSoundType(e.target.value)
                  handleSaveNotiSettings(e.target.value, reminderSoundType, soundVolume, showPopup, notiVibrate)
                  playNotificationSound(e.target.value, soundVolume)
                }}
                style={{ appearance: 'auto' }}
              >
                <option value="bell">เสียงกริ่งสดใส (Bright Bell)</option>
                <option value="chime">เสียงระฆังคู่ (Double Chime)</option>
                <option value="beep">เสียงดิจิตอลสั้น (Digital Beep)</option>
                <option value="siren">เสียงเตือนภัยเลื่อนถี่ (Siren Pulse)</option>
                <option value="melody">เสียงทำนองโรงแรมประสาน (Melody 2.2 วินาที)</option>
                <option value="long-bell">เสียงระฆังกังวานกึกก้อง (Long Bell 2.5 วินาที)</option>
                <option value="alarm-long">เสียงสัญญาณเตือนภัยยาว (Alarm 2.6 วินาที)</option>
                <option value="sparkle">เสียงประกายซินธิไซเซอร์ (Sparkle 2.0 วินาที)</option>
              </select>
            </div>

            {/* Pre-meeting sound selection dropdown */}
            <div className="form-group">
              <label className="form-label" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span>เสียงแจ้งเตือนก่อนเริ่มประชุม (Pre-Meeting Sound)</span>
                <button 
                  type="button" 
                  onClick={() => playNotificationSound(reminderSoundType, soundVolume)}
                  style={{ background: 'none', border: 'none', color: 'var(--primary)', fontSize: '0.75rem', fontWeight: 600, cursor: 'pointer' }}
                >
                  🔊 ทดลองฟัง
                </button>
              </label>
              <select 
                className="form-input" 
                value={reminderSoundType}
                onChange={(e) => {
                  setReminderSoundType(e.target.value)
                  handleSaveNotiSettings(soundType, e.target.value, soundVolume, showPopup, notiVibrate)
                  playNotificationSound(e.target.value, soundVolume)
                }}
                style={{ appearance: 'auto' }}
              >
                <option value="bell">เสียงกริ่งสดใส (Bright Bell)</option>
                <option value="chime">เสียงระฆังคู่ (Double Chime)</option>
                <option value="beep">เสียงดิจิตอลสั้น (Digital Beep)</option>
                <option value="siren">เสียงเตือนภัยเลื่อนถี่ (Siren Pulse)</option>
                <option value="melody">เสียงทำนองโรงแรมประสาน (Melody 2.2 วินาที)</option>
                <option value="long-bell">เสียงระฆังกังวานกึกก้อง (Long Bell 2.5 วินาที)</option>
                <option value="alarm-long">เสียงสัญญาณเตือนภัยยาว (Alarm 2.6 วินาที)</option>
                <option value="sparkle">เสียงประกายซินธิไซเซอร์ (Sparkle 2.0 วินาที)</option>
              </select>
            </div>

            {/* Volume level slider */}
            <div className="form-group">
              <label className="form-label" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span>ระดับความดังเสียง</span>
                <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--primary)' }}>
                  {Math.round(soundVolume * 100)}%
                </span>
              </label>
              <input 
                type="range" 
                min="0" 
                max="1" 
                step="0.05"
                value={soundVolume}
                onChange={(e) => {
                  setSoundVolume(parseFloat(e.target.value))
                }}
                onMouseUp={() => {
                  handleSaveNotiSettings(soundType, reminderSoundType, soundVolume, showPopup, notiVibrate)
                  playNotificationSound(soundType, soundVolume)
                }}
                onTouchEnd={() => {
                  handleSaveNotiSettings(soundType, reminderSoundType, soundVolume, showPopup, notiVibrate)
                  playNotificationSound(soundType, soundVolume)
                }}
                style={{
                  width: '100%',
                  accentColor: 'var(--primary)',
                  cursor: 'pointer'
                }}
              />
            </div>

            {/* In-app Popup toggle dropdown */}
            <div className="form-group">
              <label className="form-label">แสดงป๊อปอัปแจ้งเตือนในแอป (Toast Popup)</label>
              <select 
                className="form-input" 
                value={showPopup ? 'true' : 'false'}
                onChange={(e) => {
                  const val = e.target.value === 'true'
                  setShowPopup(val)
                  handleSaveNotiSettings(soundType, reminderSoundType, soundVolume, val, notiVibrate)
                }}
                style={{ appearance: 'auto' }}
              >
                <option value="true">เปิด (แนะนำ)</option>
                <option value="false">ปิด</option>
              </select>
            </div>

            {/* Vibration toggle */}
            <div className="form-group">
              <label className="form-label">ระบบสั่นเตือนบนอุปกรณ์มือถือ (Vibration Alert)</label>
              <select 
                className="form-input" 
                value={notiVibrate ? 'true' : 'false'}
                onChange={(e) => {
                  const val = e.target.value === 'true'
                  setNotiVibrate(val)
                  handleSaveNotiSettings(soundType, reminderSoundType, soundVolume, showPopup, val)
                  if (val && 'vibrate' in navigator) {
                    navigator.vibrate([200, 100, 200])
                  }
                }}
                style={{ appearance: 'auto' }}
              >
                <option value="true">เปิดระบบสั่น (แนะนำ)</option>
                <option value="false">ปิดระบบสั่น</option>
              </select>
            </div>

          </div>
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
              placeholder="0812345678"
            />
          </div>

          <div className="form-group">
            <label className="form-label">
              <Users size={12} style={{ marginRight: '4px', verticalAlign: 'middle' }} />
              กลุ่มสาระการเรียนรู้ (Learning Group)
            </label>
            <select 
              className="form-input" 
              value={learningGroup} 
              onChange={(e) => setLearningGroup(e.target.value)}
              style={{ appearance: 'auto' }}
            >
              <option value="">-- เลือกกลุ่มสาระ --</option>
              <option value="วิทยาศาสตร์และเทคโนโลยี">วิทยาศาสตร์และเทคโนโลยี</option>
              <option value="คณิตศาสตร์">คณิตศาสตร์</option>
              <option value="ภาษาไทย">ภาษาไทย</option>
              <option value="ภาษาต่างประเทศ">ภาษาต่างประเทศ</option>
              <option value="สังคมศึกษา ศาสนา และวัฒนธรรม">สังคมศึกษา ศาสนา และวัฒนธรรม</option>
              <option value="สุขศึกษาและพลศึกษา">สุขศึกษาและพลศึกษา</option>
              <option value="ศิลปะ">ศิลปะ</option>
              <option value="การงานอาชีพ">การงานอาชีพ</option>
              <option value="กิจกรรมพัฒนาผู้เรียน/แนะแนว">กิจกรรมพัฒนาผู้เรียน/แนะแนว</option>
              <option value="ฝ่ายธุรการ/สนับสนุน">ฝ่ายธุรการ/สนับสนุน</option>
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">
              <BookOpen size={12} style={{ marginRight: '4px', verticalAlign: 'middle' }} />
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
              <option value="กลุ่มบริหารงบประมาณและบุคคล">กลุ่มบริหารงบประมาณและบุคคล</option>
              <option value="กลุ่มบริหารงานทั่วไป">กลุ่มบริหารงานทั่วไป</option>
              <option value="กลุ่มบริหารกิจการนักเรียน">กลุ่มบริหารกิจการนักเรียน</option>
              <option value="ไม่มี (ครูผู้สอนอย่างเดียว)">ไม่มี (ครูผู้สอนอย่างเดียว)</option>
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
              <option value="">-- ไม่ระบุ / ไม่มี (ค่าว่าง) --</option>
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
      
      {/* Name Setup Popup Modal */}
      {showNamePopup && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.75)',
          backdropFilter: 'blur(8px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
          padding: '20px',
        }}>
          <div className="glass-panel animate-fade-in" style={{
            width: '100%',
            maxWidth: '680px',
            maxHeight: '90vh',
            overflowY: 'auto',
            padding: '35px',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            boxShadow: '0 20px 25px -5px rgba(0,0,0,0.3)',
          }}>
            <h3 style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '8px', textAlign: 'center' }}>
              ยินดีต้อนรับ! กรุณากรอกข้อมูลส่วนตัวของคุณ
            </h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem', marginBottom: '24px', textAlign: 'center', lineHeight: 1.45 }}>
              กรุณาระบุข้อมูลทุกช่องที่มีเครื่องหมายดอกจันสีแดง (<span style={{ color: 'var(--danger)' }}>*</span>) ให้ครบถ้วนเพื่อความถูกต้องในการจองห้องประชุม
            </p>

            {popupError && (
              <div style={{
                background: 'rgba(239, 68, 68, 0.1)',
                border: '1px solid rgba(239, 68, 68, 0.2)',
                borderRadius: '8px',
                color: 'var(--danger)',
                fontSize: '0.85rem',
                padding: '12px',
                marginBottom: '20px',
                textAlign: 'center',
              }}>
                {popupError}
              </div>
            )}

            <form onSubmit={handleSaveSetupPopup} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px 20px' }}>
              <div className="form-group">
                <label className="form-label">คำนำหน้าชื่อ <span style={{ color: 'var(--danger)' }}>*</span></label>
                <select
                  className="form-input"
                  value={popupPrefix}
                  onChange={(e) => {
                    setPopupPrefix(e.target.value)
                    if (e.target.value !== 'อื่นๆ') {
                      setCustomPrefix('')
                    }
                  }}
                  required
                  style={{ appearance: 'auto' }}
                >
                  <option value="">-- เลือกคำนำหน้าชื่อ --</option>
                  <option value="นาย">นาย</option>
                  <option value="นาง">นาง</option>
                  <option value="นางสาว">นางสาว</option>
                  <option value="ดร.">ดร.</option>
                  <option value="ครู">ครู</option>
                  <option value="อาจารย์">อาจารย์</option>
                  <option value="อื่นๆ">อื่นๆ</option>
                </select>
              </div>

              {popupPrefix === 'อื่นๆ' ? (
                <div className="form-group animate-fade-in">
                  <label className="form-label">ระบุคำนำหน้าชื่อ <span style={{ color: 'var(--danger)' }}>*</span></label>
                  <input
                    type="text"
                    className="form-input"
                    value={customPrefix}
                    onChange={(e) => setCustomPrefix(e.target.value)}
                    placeholder="เช่น คุณหญิง, ร.ต.อ."
                    required
                  />
                </div>
              ) : (
                <div className="form-group">
                  <label className="form-label">ชื่อจริง (First Name) <span style={{ color: 'var(--danger)' }}>*</span></label>
                  <input
                    type="text"
                    className="form-input"
                    value={popupFirstName}
                    onChange={(e) => setPopupFirstName(e.target.value)}
                    placeholder="สมชาย"
                    required
                  />
                </div>
              )}

              {popupPrefix === 'อื่นๆ' && (
                <div className="form-group animate-fade-in" style={{ gridColumn: 'span 2' }}>
                  <label className="form-label">ชื่อจริง (First Name) <span style={{ color: 'var(--danger)' }}>*</span></label>
                  <input
                    type="text"
                    className="form-input"
                    value={popupFirstName}
                    onChange={(e) => setPopupFirstName(e.target.value)}
                    placeholder="สมชาย"
                    required
                  />
                </div>
              )}

              <div className="form-group" style={{ gridColumn: 'span 2' }}>
                <label className="form-label">นามสกุลจริง (Last Name) <span style={{ color: 'var(--danger)' }}>*</span></label>
                <input
                  type="text"
                  className="form-input"
                  value={popupLastName}
                  onChange={(e) => setPopupLastName(e.target.value)}
                  placeholder="ใจดี"
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">เบอร์โทรศัพท์ (Phone) <span style={{ color: 'var(--danger)' }}>*</span></label>
                <input 
                  type="tel" 
                  className="form-input" 
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="0812345678"
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">ตำแหน่ง (Position) <span style={{ color: 'var(--danger)' }}>*</span></label>
                <select 
                  className="form-input" 
                  value={position} 
                  onChange={(e) => setPosition(e.target.value)}
                  style={{ appearance: 'auto' }}
                  required
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
                <label className="form-label">กลุ่มสาระการเรียนรู้ (Learning Group) <span style={{ color: 'var(--danger)' }}>*</span></label>
                <select 
                  className="form-input" 
                  value={learningGroup} 
                  onChange={(e) => setLearningGroup(e.target.value)}
                  style={{ appearance: 'auto' }}
                  required
                >
                  <option value="">-- เลือกกลุ่มสาระ --</option>
                  <option value="วิทยาศาสตร์และเทคโนโลยี">วิทยาศาสตร์และเทคโนโลยี</option>
                  <option value="คณิตศาสตร์">คณิตศาสตร์</option>
                  <option value="ภาษาไทย">ภาษาไทย</option>
                  <option value="ภาษาต่างประเทศ">ภาษาต่างประเทศ</option>
                  <option value="สังคมศึกษา ศาสนา และวัฒนธรรม">สังคมศึกษา ศาสนา และวัฒนธรรม</option>
                  <option value="สุขศึกษาและพลศึกษา">สุขศึกษาและพลศึกษา</option>
                  <option value="ศิลปะ">ศิลปะ</option>
                  <option value="การงานอาชีพ">การงานอาชีพ</option>
                  <option value="กิจกรรมพัฒนาผู้เรียน/แนะแนว">กิจกรรมพัฒนาผู้เรียน/แนะแนว</option>
                  <option value="ฝ่ายธุรการ/สนับสนุน">ฝ่ายธุรการ/สนับสนุน</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">กลุ่มงาน (Work Group) <span style={{ color: 'var(--danger)' }}>*</span></label>
                <select 
                  className="form-input" 
                  value={workGroup} 
                  onChange={(e) => setWorkGroup(e.target.value)}
                  style={{ appearance: 'auto' }}
                  required
                >
                  <option value="">-- เลือกกลุ่มงาน --</option>
                  <option value="กลุ่มบริหารวิชาการ">กลุ่มบริหารวิชาการ</option>
                  <option value="กลุ่มบริหารงบประมาณและบุคคล">กลุ่มบริหารงบประมาณและบุคคล</option>
                  <option value="กลุ่มบริหารงานทั่วไป">กลุ่มบริหารงานทั่วไป</option>
                  <option value="กลุ่มบริหารกิจการนักเรียน">กลุ่มบริหารกิจการนักเรียน</option>
                  <option value="ไม่มี (ครูผู้สอนอย่างเดียว)">ไม่มี (ครูผู้สอนอย่างเดียว)</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">วิทยฐานะ (Academic Standing)</label>
                <select 
                  className="form-input" 
                  value={academicStanding} 
                  onChange={(e) => setAcademicStanding(e.target.value)}
                  style={{ appearance: 'auto' }}
                >
                  <option value="">-- ไม่ระบุ / ไม่มี (ค่าว่าง) --</option>
                  <option value="ไม่มีวิทยฐานะ">ไม่มีวิทยฐานะ</option>
                  <option value="ครูชำนาญการ">ครูชำนาญการ</option>
                  <option value="ครูชำนาญการพิเศษ">ครูชำนาญการพิเศษ</option>
                  <option value="ครูเชี่ยวชาญ">ครูเชี่ยวชาญ</option>
                  <option value="ครูเชี่ยวชาญพิเศษ">ครูเชี่ยวชาญพิเศษ</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">ครูที่ปรึกษาชั้น/ห้อง (Advisor Role) <span style={{ color: 'var(--danger)' }}>*</span></label>
                <input 
                  type="text" 
                  className="form-input" 
                  value={advisorRole}
                  onChange={(e) => setAdvisorRole(e.target.value)}
                  placeholder="ม.1/1 (ระบุ 'ไม่มี' หากไม่ได้เป็น)"
                  required
                />
              </div>

              <div className="form-group" style={{ gridColumn: 'span 2' }}>
                <label className="form-label">ห้องที่รับผิดชอบ (Responsible Room) <span style={{ color: 'var(--danger)' }}>*</span></label>
                <input 
                  type="text" 
                  className="form-input" 
                  value={responsibleRoom}
                  onChange={(e) => setResponsibleRoom(e.target.value)}
                  placeholder="ห้อง 411 (ระบุ 'ไม่มี' หากไม่มี)"
                  required
                />
              </div>

              <button
                type="submit"
                className="btn btn-primary"
                style={{ gridColumn: 'span 2', padding: '14px', marginTop: '10px' }}
                disabled={popupLoading}
              >
                {popupLoading ? (
                  <>
                    <RefreshCw className="animate-spin" size={18} style={{ animation: 'spin 1s linear infinite' }} />
                    กำลังบันทึกข้อมูล...
                  </>
                ) : (
                  'บันทึกข้อมูลส่วนตัวทั้งหมด'
                )}
              </button>
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
