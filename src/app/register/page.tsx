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

  const handleSocialLogin = async (provider: 'google') => {
    setError(null)
    try {
      const { error: oauthError } = await supabase.auth.signInWithOAuth({
        provider: provider as any,
        options: {
          redirectTo: `${window.location.origin}/auth/callback`
        }
      })
      if (oauthError) throw oauthError
    } catch (err: any) {
      setError(err.message || 'เกิดข้อผิดพลาดในการเชื่อมต่อเพื่อสมัครสมาชิก')
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

        <div style={{ margin: '24px 0', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <hr style={{ flex: 1, border: 'none', borderTop: '1px solid var(--border-color)' }} />
          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontFamily: 'var(--font-display)', fontWeight: 500 }}>หรือดำเนินต่อด้วย</span>
          <hr style={{ flex: 1, border: 'none', borderTop: '1px solid var(--border-color)' }} />
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {/* Google Button */}
          <button 
            type="button" 
            onClick={() => handleSocialLogin('google')}
            className="btn btn-secondary"
            style={{ 
              width: '100%', 
              padding: '12px', 
              background: 'white', 
              color: '#374151',
              border: '1px solid #e5e7eb',
              boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              gap: '10px'
            }}
          >
            <svg viewBox="0 0 24 24" width="18" height="18" xmlns="http://www.w3.org/2000/svg">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" fill="#EA4335"/>
            </svg>
            <span style={{ fontSize: '0.9rem', fontWeight: 600 }}>ดำเนินการต่อด้วย Google</span>
          </button>


        </div>

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
