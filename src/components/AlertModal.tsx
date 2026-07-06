'use client'

import { useEffect } from 'react'
import { CheckCircle, XCircle, AlertTriangle, Info, X } from 'lucide-react'

interface AlertModalProps {
  type: 'success' | 'error' | 'warning' | 'info'
  title: string
  message: string
  onClose: () => void
  autoCloseMs?: number
}

export default function AlertModal({ type, title, message, onClose, autoCloseMs }: AlertModalProps) {
  // Handle escape key to close
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handleKeyDown)
    
    let timer: NodeJS.Timeout
    if (autoCloseMs) {
      timer = setTimeout(() => {
        onClose()
      }, autoCloseMs)
    }

    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      if (timer) clearTimeout(timer)
    }
  }, [onClose, autoCloseMs])

  const renderIcon = () => {
    switch (type) {
      case 'success':
        return <CheckCircle size={48} style={{ color: 'var(--success)' }} />
      case 'error':
        return <XCircle size={48} style={{ color: 'var(--danger)' }} />
      case 'warning':
        return <AlertTriangle size={48} style={{ color: 'var(--warning)' }} />
      case 'info':
      default:
        return <Info size={48} style={{ color: 'var(--accent)' }} />
    }
  };

  const getBorderColor = () => {
    switch (type) {
      case 'success':
        return 'rgba(34, 197, 94, 0.4)'
      case 'error':
        return 'rgba(239, 68, 68, 0.4)'
      case 'warning':
        return 'rgba(245, 158, 11, 0.4)'
      case 'info':
      default:
        return 'rgba(147, 197, 253, 0.4)'
    }
  };

  const getButtonGradient = () => {
    switch (type) {
      case 'success':
        return 'linear-gradient(135deg, var(--success), #16a34a)'
      case 'error':
        return 'linear-gradient(135deg, var(--danger), #dc2626)'
      case 'warning':
        return 'linear-gradient(135deg, var(--warning), #ea580c)'
      case 'info':
      default:
        return 'linear-gradient(135deg, var(--accent), #2563eb)'
    }
  };

  const getButtonShadow = () => {
    switch (type) {
      case 'success':
        return '0 4px 12px var(--success-glow)'
      case 'error':
        return '0 4px 12px var(--danger-glow)'
      case 'warning':
        return '0 4px 12px rgba(245, 158, 11, 0.25)'
      case 'info':
      default:
        return '0 4px 12px var(--accent-glow)'
    }
  };

  return (
    <div 
      className="alert-modal-overlay"
      onClick={onClose}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.25)',
        backdropFilter: 'blur(6px)',
        WebkitBackdropFilter: 'blur(6px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 99999,
        animation: 'fadeInOverlay 0.2s ease-out'
      }}
    >
      <div 
        className="alert-modal-content glass-panel"
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '90%',
          maxWidth: '420px',
          padding: '28px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          textAlign: 'center',
          position: 'relative',
          border: `1px solid ${getBorderColor()}`,
          boxShadow: '0 20px 40px rgba(0, 0, 0, 0.15), var(--glass-shadow)',
          animation: 'scaleUpContent 0.25s cubic-bezier(0.34, 1.56, 0.64, 1)'
        }}
      >
        <button 
          onClick={onClose}
          style={{
            position: 'absolute',
            top: '16px',
            right: '16px',
            background: 'none',
            border: 'none',
            color: 'var(--text-muted)',
            cursor: 'pointer',
            padding: '4px',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'background-color 0.2s'
          }}
          className="alert-close-btn"
        >
          <X size={16} />
        </button>

        <div style={{ marginBottom: '18px', display: 'flex', justifyContent: 'center' }}>
          {renderIcon()}
        </div>

        <h3 style={{ 
          fontSize: '1.25rem', 
          fontWeight: 800, 
          color: 'var(--text-primary)', 
          marginBottom: '10px',
          fontFamily: 'var(--font-display)'
        }}>
          {title}
        </h3>

        <p style={{ 
          fontSize: '0.88rem', 
          color: 'var(--text-secondary)', 
          lineHeight: 1.5,
          marginBottom: '24px',
          whiteSpace: 'pre-wrap'
        }}>
          {message}
        </p>

        <button 
          onClick={onClose}
          className="btn"
          style={{
            width: '100%',
            background: getButtonGradient(),
            color: 'white',
            boxShadow: getButtonShadow(),
            padding: '12px 24px',
            borderRadius: '10px',
            border: 'none',
            fontWeight: 700,
            cursor: 'pointer',
            transition: 'all 0.2s'
          }}
        >
          ตกลง
        </button>
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes fadeInOverlay {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes scaleUpContent {
          from { transform: translateY(-50px) scale(0.95); opacity: 0; }
          to { transform: translateY(0) scale(1); opacity: 1; }
        }
        .alert-close-btn:hover {
          background-color: rgba(0, 0, 0, 0.05);
          color: var(--text-primary);
        }
      ` }} />
    </div>
  )
}
