import Link from 'next/link'
import { Calendar, Users, Shield, Clock, Sparkles } from 'lucide-react'

export default function Home() {
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      minHeight: '100vh',
    }}>
      {/* Header / Nav */}
      <nav className="navbar">
        <div className="nav-container">
          <Link href="/" className="nav-brand">
            <Calendar size={24} />
            <span>BOOKING SPACE</span>
          </Link>
          <div style={{ display: 'flex', gap: '12px' }}>
            <Link href="/login" className="btn btn-secondary" style={{ padding: '8px 20px', fontSize: '0.9rem' }}>
              เข้าสู่ระบบ
            </Link>
            <Link href="/register" className="btn btn-primary" style={{ padding: '8px 20px', fontSize: '0.9rem' }}>
              สมัครสมาชิก
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <main style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '60px 20px',
        textAlign: 'center',
        maxWidth: '1000px',
        margin: '0 auto',
      }} className="animate-fade-in">
        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '8px',
          background: 'rgba(255, 255, 255, 0.03)',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          borderRadius: '9999px',
          padding: '6px 16px',
          fontSize: '0.85rem',
          color: 'var(--text-secondary)',
          marginBottom: '24px',
          fontFamily: 'var(--font-display)',
        }}>
          <Sparkles size={14} style={{ color: 'var(--accent)' }} />
          <span>ระบบจองห้องประชุมรูปแบบใหม่ ป้องกันคิวชนกัน 100%</span>
        </div>

        <h1 style={{
          fontSize: '3.5rem',
          fontWeight: 800,
          lineHeight: 1.15,
          marginBottom: '20px',
          background: 'linear-gradient(135deg, #ffffff 30%, #93c5fd 70%, #c084fc 100%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          fontFamily: 'var(--font-display)',
          maxWidth: '800px',
        }}>
          ระบบจองห้องประชุมออนไลน์ ร่วมกับ Vercel & Supabase
        </h1>

        <p style={{
          fontSize: '1.25rem',
          color: 'var(--text-secondary)',
          maxWidth: '650px',
          lineHeight: 1.6,
          marginBottom: '40px',
        }}>
          ค้นหาความว่างของห้อง คัดกรองสิ่งอำนวยความสะดวก และจองตารางเวลาของคุณได้อย่างแม่นยำ พร้อมระบบจัดการสิทธิ์ผู้ใช้งานและระบบล็อกอินอย่างปลอดภัย
        </p>

        <div style={{
          display: 'flex',
          gap: '16px',
          justifyContent: 'center',
          flexWrap: 'wrap',
          marginBottom: '64px',
        }}>
          <Link href="/login" className="btn btn-primary" style={{ padding: '16px 36px', fontSize: '1.05rem' }}>
            เริ่มต้นใช้งานระบบฟรี
          </Link>
          <Link href="/register" className="btn btn-secondary" style={{ padding: '16px 36px', fontSize: '1.05rem' }}>
            สร้างบัญชีใหม่
          </Link>
        </div>

        {/* Feature Grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: '24px',
          width: '100%',
          textAlign: 'left',
        }}>
          <div className="glass-panel" style={{ padding: '28px' }}>
            <div style={{
              width: '40px',
              height: '40px',
              borderRadius: '8px',
              background: 'rgba(59, 130, 246, 0.1)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '16px',
              color: 'var(--primary)',
            }}>
              <Clock size={20} />
            </div>
            <h3 style={{ fontSize: '1.15rem', marginBottom: '8px' }}>ตรวจคิวห้องว่างแบบ Real-time</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: 1.5 }}>
              แสดงตารางความว่างของห้องจองแต่ละห้องแบบรายวัน เพื่อให้พนักงานวางแผนการประชุมและเลือกเวลาได้แม่นยำที่สุด
            </p>
          </div>

          <div className="glass-panel" style={{ padding: '28px' }}>
            <div style={{
              width: '40px',
              height: '40px',
              borderRadius: '8px',
              background: 'rgba(168, 85, 247, 0.1)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '16px',
              color: 'var(--accent)',
            }}>
              <Shield size={20} />
            </div>
            <h3 style={{ fontSize: '1.15rem', marginBottom: '8px' }}>ระบบแยกสิทธิ์ตามบทบาท (Role-based)</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: 1.5 }}>
              แบ่งระดับบัญชีผู้ใช้เป็น User เพื่อทำการจองห้อง และ Admin สำหรับการควบคุม สั่งเปิด-ปิดห้องประชุม หรือกดอนุมัติการจอง
            </p>
          </div>

          <div className="glass-panel" style={{ padding: '28px' }}>
            <div style={{
              width: '40px',
              height: '40px',
              borderRadius: '8px',
              background: 'rgba(34, 197, 94, 0.1)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '16px',
              color: 'var(--success)',
            }}>
              <Users size={20} />
            </div>
            <h3 style={{ fontSize: '1.15rem', marginBottom: '8px' }}>คัดกรองห้องประชุมตามขนาด</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: 1.5 }}>
              สามารถค้นหาห้องประชุมแยกตามจำนวนที่นั่งและอุปกรณ์อำนวยความสะดวก เช่น โปรเจกเตอร์, เครื่องเสียง หรืออุปกรณ์ประชุมออนไลน์
            </p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer style={{
        padding: '30px 20px',
        textAlign: 'center',
        borderTop: '1px solid var(--border-color)',
        color: 'var(--text-muted)',
        fontSize: '0.85rem',
      }}>
        © 2026 BOOKING SPACE. พัฒนาด้วย Next.js และ Supabase. สงวนลิขสิทธิ์ทั้งหมด
      </footer>
    </div>
  )
}

