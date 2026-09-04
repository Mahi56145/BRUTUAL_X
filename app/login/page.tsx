'use client'

import { useState } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
  const [name, setName] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const result = await signIn('credentials', {
        name,
        password,
        redirect: false,
      })

      if (result?.error) {
        setError('Invalid credentials. Password is engineering123')
      } else {
        router.push('/dashboard')
        router.refresh()
      }
    } catch (err: any) {
      console.error('Sign-in error:', err)
      setError('Connection error or invalid credentials. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="login-page">
      <div className="login-bg-grid" />
      <div className="login-orbs">
        <div className="orb orb-1" />
        <div className="orb orb-2" />
      </div>

      <div className="login-container">
        {/* Left side - branding */}
        <div className="login-brand">
          <div className="brand-logo">
            <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
              <rect width="48" height="48" rx="12" fill="url(#logoGrad)" />
              <path d="M12 24L20 16L28 24L20 32L12 24Z" fill="white" opacity="0.9" />
              <path d="M24 16L36 24L24 32" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" opacity="0.7" />
              <defs>
                <linearGradient id="logoGrad" x1="0" y1="0" x2="48" y2="48">
                  <stop offset="0%" stopColor="#6c63ff" />
                  <stop offset="100%" stopColor="#00d4aa" />
                </linearGradient>
              </defs>
            </svg>
          </div>
          <h1 className="brand-title">Engineering OS</h1>
          <p className="brand-tagline">
            Adaptive study planner that thinks with you,<br />
            not just for you.
          </p>

          <div className="brand-features">
            <div className="brand-feature">
              <span className="feature-icon">🧠</span>
              <div>
                <div className="feature-title">Adaptive Scheduling</div>
                <div className="feature-desc">Recalculates your plan every day based on real progress</div>
              </div>
            </div>
            <div className="brand-feature">
              <span className="feature-icon">🎯</span>
              <div>
                <div className="feature-title">GATE + Career Ready</div>
                <div className="feature-desc">Simultaneous preparation for GATE, ML, and placements</div>
              </div>
            </div>
            <div className="brand-feature">
              <span className="feature-icon">🤝</span>
              <div>
                <div className="feature-title">Shared Progress</div>
                <div className="feature-desc">See each other's journey, stay accountable together</div>
              </div>
            </div>
          </div>
        </div>

        {/* Right side - login form */}
        <div className="login-form-panel">
          <div className="login-form-card">
            <div className="form-header">
              <h2>Welcome back</h2>
              <p>Sign in to your Engineering OS</p>
            </div>

            <div className="user-selector">
              <button
                type="button"
                className={`user-btn ${name === 'Shivraj' ? 'selected' : ''}`}
                onClick={() => setName('Shivraj')}
                id="select-shivraj"
              >
                <div className="user-btn-avatar" style={{ background: 'linear-gradient(135deg, #6c63ff, #a29bfe)' }}>SJ</div>
                <div className="user-btn-name">Shivraj</div>
              </button>
              <button
                type="button"
                className={`user-btn ${name === 'Mahipal' ? 'selected' : ''}`}
                onClick={() => setName('Mahipal')}
                id="select-mahipal"
              >
                <div className="user-btn-avatar" style={{ background: 'linear-gradient(135deg, #00d4aa, #00b894)' }}>MP</div>
                <div className="user-btn-name">Mahipal</div>
              </button>
            </div>

            <form onSubmit={handleSubmit} className="login-form">
              <div className="form-group">
                <label className="form-label" htmlFor="password-input">Password</label>
                <input
                  id="password-input"
                  type="password"
                  className="form-input"
                  placeholder="Enter password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                />
              </div>

              {error && (
                <div className="login-error">
                  {error}
                </div>
              )}

              <button
                type="submit"
                className="btn btn-primary w-full btn-lg"
                id="login-submit"
                disabled={loading || !name}
              >
                {loading ? (
                  <><div className="spinner" style={{ borderTopColor: 'white' }} /> Signing in...</>
                ) : (
                  <>Sign In to Engineering OS</>
                )}
              </button>

              <p className="login-hint">
                Demo password: <code>engineering123</code>
              </p>
            </form>
          </div>
        </div>
      </div>

      <style jsx>{`
        .login-page {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          position: relative;
          overflow: hidden;
          background: var(--bg-primary);
        }

        .login-bg-grid {
          position: absolute;
          inset: 0;
          background-image:
            linear-gradient(rgba(108, 99, 255, 0.03) 1px, transparent 1px),
            linear-gradient(90deg, rgba(108, 99, 255, 0.03) 1px, transparent 1px);
          background-size: 60px 60px;
          pointer-events: none;
        }

        .login-orbs {
          position: absolute;
          inset: 0;
          pointer-events: none;
        }

        .orb {
          position: absolute;
          border-radius: 50%;
          filter: blur(80px);
          opacity: 0.12;
        }

        .orb-1 {
          width: 500px;
          height: 500px;
          background: var(--accent-primary);
          top: -200px;
          left: -100px;
        }

        .orb-2 {
          width: 400px;
          height: 400px;
          background: var(--accent-secondary);
          bottom: -150px;
          right: -100px;
        }

        .login-container {
          display: grid;
          grid-template-columns: 1fr 1fr;
          max-width: 960px;
          width: 100%;
          margin: var(--space-8);
          gap: var(--space-12);
          position: relative;
          z-index: 1;
          align-items: center;
        }

        .brand-logo {
          margin-bottom: var(--space-5);
        }

        .brand-title {
          font-size: 36px;
          font-weight: 900;
          background: linear-gradient(135deg, var(--accent-primary), var(--accent-secondary));
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          margin-bottom: var(--space-3);
          letter-spacing: -1px;
        }

        .brand-tagline {
          font-size: 16px;
          color: var(--text-secondary);
          line-height: 1.6;
          margin-bottom: var(--space-8);
        }

        .brand-features {
          display: flex;
          flex-direction: column;
          gap: var(--space-5);
        }

        .brand-feature {
          display: flex;
          gap: var(--space-4);
          align-items: flex-start;
        }

        .feature-icon {
          font-size: 24px;
          flex-shrink: 0;
        }

        .feature-title {
          font-size: 15px;
          font-weight: 700;
          color: var(--text-primary);
          margin-bottom: 2px;
        }

        .feature-desc {
          font-size: 13px;
          color: var(--text-muted);
          line-height: 1.5;
        }

        .login-form-panel {
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .login-form-card {
          background: var(--bg-card);
          border: 1px solid var(--border-strong);
          border-radius: var(--radius-xl);
          padding: var(--space-8);
          width: 100%;
          max-width: 400px;
          box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
        }

        .form-header {
          margin-bottom: var(--space-6);
        }

        .form-header h2 {
          font-size: 24px;
          font-weight: 800;
          margin-bottom: var(--space-1);
        }

        .form-header p {
          font-size: 14px;
          color: var(--text-secondary);
        }

        .user-selector {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: var(--space-3);
          margin-bottom: var(--space-6);
        }

        .user-btn {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: var(--space-2);
          padding: var(--space-4);
          border-radius: var(--radius-md);
          border: 2px solid var(--border);
          background: var(--bg-input);
          cursor: pointer;
          transition: all var(--transition-fast);
        }

        .user-btn:hover {
          border-color: var(--accent-primary);
          background: var(--accent-primary-dim);
        }

        .user-btn.selected {
          border-color: var(--accent-primary);
          background: var(--accent-primary-dim);
          box-shadow: 0 0 0 3px var(--accent-primary-dim);
        }

        .user-btn-avatar {
          width: 48px;
          height: 48px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 16px;
          font-weight: 800;
          color: white;
        }

        .user-btn-name {
          font-size: 14px;
          font-weight: 700;
          color: var(--text-primary);
        }

        .login-form {
          display: flex;
          flex-direction: column;
          gap: var(--space-4);
        }

        .login-error {
          background: var(--accent-danger-dim);
          border: 1px solid var(--accent-danger);
          border-radius: var(--radius-md);
          padding: var(--space-3) var(--space-4);
          font-size: 13px;
          color: var(--accent-danger);
        }

        .login-hint {
          text-align: center;
          font-size: 12px;
          color: var(--text-muted);
        }

        .login-hint code {
          font-family: var(--font-mono);
          background: var(--bg-input);
          padding: 2px 6px;
          border-radius: 4px;
          color: var(--accent-secondary);
        }

        @media (max-width: 768px) {
          .login-container {
            grid-template-columns: 1fr;
            margin: var(--space-4);
          }

          .login-brand { display: none; }
        }
      `}</style>
    </div>
  )
}
