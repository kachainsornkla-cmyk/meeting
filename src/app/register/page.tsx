'use client'

import { useState } from 'react'
import { createClient } from '@/utils/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { UserPlus, User, Mail, Key, RefreshCw } from 'lucide-react'

export default function RegisterPage() {
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const router = useRouter()
  const supabase = createClient()

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    if (password !== confirmPassword) {
      setError('รหัสผ่านและการยืนยันรหัสผ่านไม่ตรงกัน')
      setLoading(false)
      return
    }

    if (password.length < 6) {
      setError('รหัสผ่านต้องมีความยาวอย่างน้อย 6 ตัวอักษร')
      setLoading(false)
      return
    }

    try {
      const { data, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
          },
        },
      })

      if (signUpError) {
        throw new Error(signUpError.message)
      }

      setSuccess(true)
      setLoading(false)
      
      // Auto-redirect to login after 3 seconds
      setTimeout(() => {
        router.push('/login')
      }, 3000)
    } catch (err: any) {
      setError(err.message || 'เกิดข้อผิดพลาดในการสมัครสมาชิก')
      setLoading(false)
    }
  }

  return (
    <main style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '100vh',
      padding: '20px',
    }}>
      <div className="glass-panel animate-fade-in" style={{
        width: '100%',
        maxWidth: '450px',
        padding: '40px',
        border: '1px solid rgba(255, 255, 255, 0.08)',
      }}>
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <h1 style={{ 
            fontSize: '2rem', 
            fontWeight: 800, 
            marginBottom: '8px',
            background: 'linear-gradient(to right, #60a5fa, #c084fc)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent'
          }}>
            CREATE ACCOUNT
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>
            สมัครสมาชิกเพื่อเริ่มใช้งานระบบจองห้องประชุม
          </p>
        </div>

        {error && (
          <div style={{
            background: 'rgba(239, 68, 68, 0.1)',
            border: '1px solid rgba(239, 68, 68, 0.2)',
            borderRadius: '10px',
            color: 'var(--danger)',
            fontSize: '0.9rem',
            padding: '12px 16px',
            marginBottom: '24px',
            textAlign: 'center'
          }}>
            {error}
          </div>
        )}

        {success ? (
          <div style={{
            background: 'rgba(34, 197, 94, 0.1)',
            border: '1px solid rgba(34, 197, 94, 0.2)',
            borderRadius: '10px',
            color: 'var(--success)',
            fontSize: '0.95rem',
            padding: '20px',
            marginBottom: '24px',
            textAlign: 'center'
          }}>
            <p style={{ fontWeight: 600, marginBottom: '8px' }}>สมัครสมาชิกสำเร็จ!</p>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
              ระบบกำลังนำคุณไปยังหน้าเข้าสู่ระบบใน 3 วินาที...
            </p>
          </div>
        ) : (
          <form onSubmit={handleRegister} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div className="form-group">
              <label className="form-label" htmlFor="fullName">
                <User size={14} style={{ marginRight: '6px', verticalAlign: 'middle' }} />
                ชื่อ-นามสกุล (Full Name)
              </label>
              <input
                id="fullName"
                type="text"
                className="form-input"
                placeholder="สมชาย ใจดี"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="email">
                <Mail size={14} style={{ marginRight: '6px', verticalAlign: 'middle' }} />
                อีเมล (Email)
              </label>
              <input
                id="email"
                type="email"
                className="form-input"
                placeholder="name@company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="password">
                <Key size={14} style={{ marginRight: '6px', verticalAlign: 'middle' }} />
                รหัสผ่าน (Password)
              </label>
              <input
                id="password"
                type="password"
                className="form-input"
                placeholder="อย่างน้อย 6 ตัวอักษร"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="confirmPassword">
                <Key size={14} style={{ marginRight: '6px', verticalAlign: 'middle' }} />
                ยืนยันรหัสผ่าน (Confirm Password)
              </label>
              <input
                id="confirmPassword"
                type="password"
                className="form-input"
                placeholder="ยืนยันรหัสผ่านอีกครั้ง"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
              />
            </div>

            <button 
              type="submit" 
              className="btn btn-primary" 
              disabled={loading}
              style={{ width: '100%', padding: '14px', marginTop: '10px' }}
            >
              {loading ? (
                <>
                  <RefreshCw className="animate-spin" size={18} style={{ animation: 'spin 1s linear infinite' }} />
                  กำลังลงทะเบียน...
                </>
              ) : (
                <>
                  <UserPlus size={18} />
                  สมัครสมาชิก
                </>
              )}
            </button>
          </form>
        )}

        <div style={{ 
          marginTop: '24px', 
          textAlign: 'center', 
          fontSize: '0.9rem', 
          color: 'var(--text-muted)' 
        }}>
          มีบัญชีผู้ใช้อยู่แล้ว?{' '}
          <Link href="/login" style={{ 
            color: 'var(--primary)', 
            textDecoration: 'none',
            fontWeight: 500
          }}>
            เข้าสู่ระบบที่นี่
          </Link>
        </div>
      </div>

      <style jsx global>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .animate-spin {
          animation: spin 1s linear infinite;
        }
      `}</style>
    </main>
  )
}
