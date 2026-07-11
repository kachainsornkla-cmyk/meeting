'use client'

import { useState, useEffect } from 'react'
import { getSystemSetting, updateSystemSetting } from '@/app/actions/settings'
import { Shield, Bell, CheckCircle, AlertCircle, RefreshCw, Save, Lock } from 'lucide-react'
import AlertModal from '@/components/AlertModal'

export default function SystemSettings() {
  const [selectedRoles, setSelectedRoles] = useState<string[]>([])
  const [editApprovedRoles, setEditApprovedRoles] = useState<string[]>([])
  const [reminderBeforeMins, setReminderBeforeMins] = useState(15)
  const [loading, setLoading] = useState(true)
  const [saveLoading, setSaveLoading] = useState(false)
  const [successMsg, setSuccessMsg] = useState<string | null>(null)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [alertConfig, setAlertConfig] = useState<{ type: 'success' | 'error' | 'warning' | 'info'; title: string; message: string } | null>(null)

  const rolesList = [
    { key: 'admin', label: 'ผู้ดูแลระบบ (Admin)' },
    { key: 'subadmin', label: 'ผู้ช่วยผู้ดูแลระบบ (Subadmin)' },
    { key: 'admin booking', label: 'ผู้ดูแลการจอง (Booking Admin)' },
    { key: 'Housekeeper', label: 'แม่บ้าน / ผู้ดูแลความสะอาด (Housekeeper)' },
    { key: 'teacher', label: 'คุณครู (Teacher)' },
    { key: 'user', label: 'ผู้ใช้งานทั่วไป (User)' }
  ]

  useEffect(() => {
    async function loadSettings() {
      // Load booking notification roles
      const res = await getSystemSetting('notify_new_booking_roles')
      if (res.error) {
        setErrorMsg(res.error)
      } else if (res.value) {
        setSelectedRoles(res.value)
      } else {
        setSelectedRoles(['admin', 'subadmin', 'admin booking'])
      }

      // Load edit approved booking roles
      const resEdit = await getSystemSetting('edit_approved_booking_roles')
      if (resEdit.error) {
        setErrorMsg(resEdit.error)
      } else if (resEdit.value) {
        setEditApprovedRoles(resEdit.value)
      } else {
        setEditApprovedRoles(['admin', 'subadmin', 'admin booking'])
      }

      // Load pre-meeting warning minutes
      const resRemind = await getSystemSetting('reminder_before_minutes')
      if (resRemind.error) {
        setErrorMsg(resRemind.error)
      } else if (resRemind.value !== null) {
        setReminderBeforeMins(Number(resRemind.value))
      }

      setLoading(false)
    }
    loadSettings()
  }, [])

  const handleCheckboxChange = (roleKey: string) => {
    setSelectedRoles((prev) => {
      if (prev.includes(roleKey)) {
        return prev.filter((r) => r !== roleKey)
      } else {
        return [...prev, roleKey]
      }
    })
  }

  const handleEditApprovedRoleChange = (roleKey: string) => {
    setEditApprovedRoles((prev) => {
      if (prev.includes(roleKey)) {
        return prev.filter((r) => r !== roleKey)
      } else {
        return [...prev, roleKey]
      }
    })
  }

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaveLoading(true)
    setSuccessMsg(null)
    setErrorMsg(null)

    const res1 = await updateSystemSetting('notify_new_booking_roles', selectedRoles)
    if (res1.error) {
      setErrorMsg(res1.error)
      setAlertConfig({ type: 'error', title: 'บันทึกไม่สำเร็จ', message: res1.error })
      setSaveLoading(false)
      return
    }

    const resEdit = await updateSystemSetting('edit_approved_booking_roles', editApprovedRoles)
    if (resEdit.error) {
      setErrorMsg(resEdit.error)
      setAlertConfig({ type: 'error', title: 'บันทึกไม่สำเร็จ', message: resEdit.error })
      setSaveLoading(false)
      return
    }

    const res2 = await updateSystemSetting('reminder_before_minutes', reminderBeforeMins)
    setSaveLoading(false)

    if (res2.error) {
      setErrorMsg(res2.error)
      setAlertConfig({ type: 'error', title: 'บันทึกไม่สำเร็จ', message: res2.error })
    } else {
      setSuccessMsg('บันทึกการตั้งค่าระบบและสิทธิ์การจองเรียบร้อยแล้ว')
      setAlertConfig({ type: 'success', title: 'บันทึกสำเร็จ', message: 'บันทึกการตั้งค่าระบบและสิทธิ์การจองเรียบร้อยแล้ว' })
    }
  }

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '50vh', gap: '8px' }}>
        <RefreshCw className="animate-spin" size={24} style={{ color: 'var(--primary)', animation: 'spin 1s linear infinite' }} />
        <span>กำลังโหลดการตั้งค่าระบบ...</span>
      </div>
    )
  }

  return (
    <div style={{ maxWidth: '600px', margin: '24px auto 0 auto' }} className="animate-fade-in">
      <div className="glass-panel" style={{ padding: '36px', border: '1px solid rgba(0,0,0,0.06)' }}>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '24px', borderBottom: '1px solid var(--border-color)', paddingBottom: '16px' }}>
          <Shield size={24} style={{ color: 'var(--primary)' }} />
          <h2 style={{ fontSize: '1.4rem', fontWeight: 800, margin: 0 }}>ตั้งค่าการแจ้งเตือนระบบ (แอดมิน)</h2>
        </div>

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

        <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '24px', lineHeight: 1.5 }}>
          กำหนดว่าบทบาท (Roles) ใดบ้างที่จะได้รับการแจ้งเตือนทั้งผ่านระบบกระดิ่ง 🔔, การแจ้งเตือนเบราว์เซอร์ และ Push Notifications เมื่อมีผู้ใช้ส่งคำขอจองห้องประชุมใหม่เข้ามาในระบบ
        </p>

        <form onSubmit={handleSaveSettings}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginBottom: '28px' }}>
            {rolesList.map((role) => {
              const isChecked = selectedRoles.includes(role.key)
              return (
                <label 
                  key={role.key}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    padding: '14px 16px',
                    borderRadius: '10px',
                    border: isChecked ? '1px solid rgba(255, 182, 193, 0.4)' : '1px solid var(--border-color)',
                    background: isChecked ? 'rgba(255, 182, 193, 0.04)' : 'transparent',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = 'var(--primary)'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = isChecked ? 'rgba(255, 182, 193, 0.4)' : 'var(--border-color)'
                  }}
                >
                  <input
                    type="checkbox"
                    checked={isChecked}
                    onChange={() => handleCheckboxChange(role.key)}
                    style={{
                      width: '18px',
                      height: '18px',
                      accentColor: 'var(--primary)',
                      cursor: 'pointer'
                    }}
                  />
                  <div>
                    <span style={{ display: 'block', fontSize: '0.9rem', fontWeight: isChecked ? 700 : 500, color: 'var(--text-primary)' }}>
                      {role.label}
                    </span>
                  </div>
                </label>
              )
            })}
          </div>

          {/* Approved Booking Edit Role Settings Card */}
          <div style={{ marginBottom: '28px', background: 'rgba(0,0,0,0.01)', border: '1px solid var(--border-color)', borderRadius: '12px', padding: '20px' }}>
            <h3 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Lock size={18} style={{ color: 'var(--primary)' }} />
              สิทธิ์การแก้ไข/ยกเลิกการจองที่อนุมัติแล้ว
            </h3>
            <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginBottom: '16px', lineHeight: 1.4 }}>
              เลือกบทบาท (Roles) ที่ได้รับอนุญาตให้แก้ไขหรือยกเลิกการจองห้องประชุมที่ได้รับการอนุมัติเรียบร้อยแล้วได้
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {rolesList.map((role) => {
                const isChecked = editApprovedRoles.includes(role.key)
                return (
                  <label
                    key={`edit-${role.key}`}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                      padding: '12px 14px',
                      borderRadius: '8px',
                      border: isChecked ? '1px solid rgba(255, 182, 193, 0.4)' : '1px solid var(--border-color)',
                      background: isChecked ? 'rgba(255, 182, 193, 0.04)' : 'transparent',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = 'var(--primary)'
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = isChecked ? 'rgba(255, 182, 193, 0.4)' : 'var(--border-color)'
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={() => handleEditApprovedRoleChange(role.key)}
                      style={{
                        width: '16px',
                        height: '16px',
                        accentColor: 'var(--primary)',
                        cursor: 'pointer'
                      }}
                    />
                    <span style={{ fontSize: '0.85rem', fontWeight: isChecked ? 600 : 500, color: 'var(--text-primary)' }}>
                      {role.label}
                    </span>
                  </label>
                )
              })}
            </div>
          </div>

          {/* Pre-Meeting Reminder Settings Card */}
          <div style={{ marginBottom: '28px', background: 'rgba(0,0,0,0.01)', border: '1px solid var(--border-color)', borderRadius: '12px', padding: '20px' }}>
            <h3 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Bell size={18} style={{ color: 'var(--primary)' }} />
              ตั้งค่าการแจ้งเตือนก่อนการเริ่มประชุม (Pre-Meeting Reminder)
            </h3>
            <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginBottom: '16px', lineHeight: 1.4 }}>
              กำหนดเวลาในการส่งสัญญาณเตือน/ข้อความไปยังผู้จองและผู้รับผิดชอบห้องประชุม ก่อนที่จะถึงเวลาเริ่มต้นประชุมจริง
            </p>
            <div className="form-group" style={{ margin: 0 }}>
              <label className="form-label" htmlFor="reminder_mins" style={{ fontSize: '0.8rem', fontWeight: 600 }}>ระยะเวลาแจ้งเตือนล่วงหน้า</label>
              <select
                id="reminder_mins"
                className="form-input"
                value={reminderBeforeMins}
                onChange={(e) => setReminderBeforeMins(Number(e.target.value))}
                style={{ appearance: 'auto', background: 'white' }}
              >
                <option value={5}>5 นาที ก่อนเริ่มประชุม</option>
                <option value={10}>10 นาที ก่อนเริ่มประชุม</option>
                <option value={15}>15 นาที ก่อนเริ่มประชุม (แนะนำ)</option>
                <option value={30}>30 นาที ก่อนเริ่มประชุม</option>
                <option value={60}>60 นาที (1 ชั่วโมง) ก่อนเริ่มประชุม</option>
                <option value={0}>🚫 ปิดการแจ้งเตือนล่วงหน้า</option>
              </select>
            </div>
          </div>

          <button 
            type="submit" 
            className="btn btn-primary" 
            style={{ width: '100%', padding: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
            disabled={saveLoading}
          >
            {saveLoading ? (
              <>
                <RefreshCw className="animate-spin" size={18} style={{ animation: 'spin 1s linear infinite' }} />
                กำลังบันทึกการตั้งค่า...
              </>
            ) : (
              <>
                <Save size={18} />
                บันทึกการตั้งค่าระบบ
              </>
            )}
          </button>
        </form>

      </div>
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
