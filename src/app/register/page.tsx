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

  const handleSocialLogin = async (provider: 'google' | 'facebook' | 'line') => {
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

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
            {/* Facebook Button */}
            <button 
              type="button" 
              onClick={() => handleSocialLogin('facebook')}
              className="btn btn-secondary"
              style={{ 
                padding: '12px', 
                background: '#1877F2', 
                color: 'white',
                border: 'none',
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center',
                gap: '8px'
              }}
            >
              <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
                <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
              </svg>
              <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>Facebook</span>
            </button>

            {/* Line Button */}
            <button 
              type="button" 
              onClick={() => handleSocialLogin('line')}
              className="btn btn-secondary"
              style={{ 
                padding: '12px', 
                background: '#06C755', 
                color: 'white',
                border: 'none',
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center',
                gap: '8px'
              }}
            >
              <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
                <path d="M24 10.304c0-5.369-5.383-9.738-12-9.738s-12 4.369-12 9.738c0 4.814 4.269 8.843 10.048 9.596.391.084.922.258 1.057.592.12.3.078.766.038 1.08l-.164 1.022c-.049.3-.228 1.178 1.002.645 1.228-.533 6.626-3.896 9.038-6.671 2.05-2.361 2.981-4.715 2.981-6.534zm-14.793 2.923h-1.611c-.347 0-.63-.283-.63-.63v-3.324c0-.347.283-.63.63-.63s.63.283.63.63v2.694h.981c.347 0 .63.283.63.63s-.283.63-.63.63zm2.502-.63c0 .347-.283.63-.63.63s-.63-.283-.63-.63v-3.324c0-.347.283-.63.63-.63s.63.283.63.63v3.324zm3.626 0c0 .347-.283.63-.63.63s-.63-.283-.63-.63v-2.07l-.988 2.071c-.085.176-.263.29-.461.29-.199 0-.376-.114-.461-.29l-.988-2.071v2.07c0 .347-.283.63-.63.63s-.63-.283-.63-.63v-3.324c0-.222.115-.426.305-.536.19-.11.424-.11.613 0l1.762 3.693 1.762-3.693c.094-.055.2-.085.308-.085.109 0 .215.03.308.085.19.11.305.314.305.536v3.324zm3.433-1.261h-.981v-.63h.981c.347 0 .63-.283.63-.63s-.283-.63-.63-.63h-1.611c-.347 0-.63.283-.63.63v3.324c0 .347.283.63.63.63h1.611c.347 0 .63-.283.63-.63s-.283-.63-.63-.63z"/>
              </svg>
              <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>Line</span>
            </button>
          </div>
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
