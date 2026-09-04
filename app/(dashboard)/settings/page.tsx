'use client'

import { useState, useEffect } from 'react'
import { signOut } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import {
  ShieldAlert,
  Calendar,
  Target,
  User as UserIcon,
  LogOut,
  RefreshCw,
  CheckCircle2,
  Sparkles,
  Zap,
} from 'lucide-react'
import RelaxationPeriodManager from '@/components/settings/RelaxationPeriodManager'

const STYLES = [
  {
    id: 'savage',
    title: 'Savage Truth',
    desc: 'Unfiltered, blunt accountability in Hinglish/English. No sugarcoating.',
    icon: '⚡',
  },
  {
    id: 'motivational',
    title: 'Disciplined & Stoic',
    desc: 'Focus, consistency, compounding effort, and mental clarity.',
    icon: '🛡️',
  },
  {
    id: 'funny',
    title: 'Witty / Roasts',
    desc: 'Lighthearted sarcasm, relatable pain, and humorous reality checks.',
    icon: '🔥',
  },
  {
    id: 'gentle',
    title: 'Calm & Supportive',
    desc: 'Empathetic guidance, burnout prevention, and constructive reassurance.',
    icon: '🌱',
  },
]

const CAREERS = [
  'Backend Engineer',
  'Systems Engineer',
  'ML / AI Engineer',
  'Full Stack Engineer',
  'DevOps / SRE',
]

export default function SettingsPage() {
  const router = useRouter()
  const [tab, setTab] = useState<'reality' | 'relaxation' | 'goals' | 'account'>('reality')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [resetting, setResetting] = useState(false)

  const [user, setUser] = useState<any>(null)
  const [realityStyle, setRealityStyle] = useState('savage')
  const [realityEnabled, setRealityEnabled] = useState(true)
  const [gateTarget, setGateTarget] = useState(650)
  const [careerPaths, setCareerPaths] = useState<string[]>([])
  const [saveSuccess, setSaveSuccess] = useState(false)

  useEffect(() => {
    async function loadSettings() {
      try {
        const res = await fetch('/api/settings')
        if (res.ok) {
          const data = await res.json()
          if (data.user) {
            setUser(data.user)
            setRealityStyle(data.user.realityCheckStyle || 'savage')
            setRealityEnabled(data.user.realityCheckEnabled ?? true)
            setGateTarget(data.user.gateTarget || 650)
            try {
              setCareerPaths(JSON.parse(data.user.careerPaths || '[]'))
            } catch {
              setCareerPaths([])
            }
          }
        }
      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    }
    loadSettings()
  }, [])

  const handleSave = async () => {
    setSaving(true)
    try {
      const res = await fetch('/api/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          realityCheckStyle: realityStyle,
          realityCheckEnabled: realityEnabled,
          gateTarget,
          careerPaths,
        }),
      })

      if (res.ok) {
        setSaveSuccess(true)
        setTimeout(() => setSaveSuccess(false), 2500)
      }
    } finally {
      setSaving(false)
    }
  }

  const handleResetCalibration = async () => {
    if (
      !confirm(
        'Are you sure you want to reset your calibration? All study history and mastery scores will be wiped and you will re-calibrate from scratch.'
      )
    ) {
      return
    }

    setResetting(true)
    try {
      const res = await fetch('/api/admin/reset', { method: 'POST' })
      if (res.ok) {
        router.push('/onboarding')
      }
    } finally {
      setResetting(false)
    }
  }

  const toggleCareer = (c: string) => {
    setCareerPaths(prev =>
      prev.includes(c) ? prev.filter(x => x !== c) : [...prev, c]
    )
  }

  return (
    <div className="animate-fade-in" style={{ maxWidth: 840 }}>
      <div className="page-header">
        <h1 className="page-title">Settings & System Preferences</h1>
        <p className="page-subtitle">
          Configure adaptive scheduling, relaxation breaks, and accountability personas
        </p>
      </div>

      {/* Tabs */}
      <div
        style={{
          display: 'flex',
          gap: 8,
          borderBottom: '1px solid var(--border)',
          marginBottom: 24,
          paddingBottom: 4,
          overflowX: 'auto',
        }}
      >
        <button
          className={`btn btn-sm ${tab === 'reality' ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => setTab('reality')}
          id="tab-reality"
        >
          <ShieldAlert size={14} /> Reality Check Persona
        </button>
        <button
          className={`btn btn-sm ${tab === 'relaxation' ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => setTab('relaxation')}
          id="tab-relaxation"
        >
          <Calendar size={14} /> Relaxation & Exams
        </button>
        <button
          className={`btn btn-sm ${tab === 'goals' ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => setTab('goals')}
          id="tab-goals"
        >
          <Target size={14} /> Goals & Career
        </button>
        <button
          className={`btn btn-sm ${tab === 'account' ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => setTab('account')}
          id="tab-account"
        >
          <UserIcon size={14} /> Account & Reset
        </button>
      </div>

      {/* TAB 1: REALITY CHECK */}
      {tab === 'reality' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div className="card">
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: 16,
              }}
            >
              <div>
                <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 4 }}>
                  Reality Check System
                </h3>
                <p style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
                  Controls whether honest accountability banners appear on the dashboard.
                </p>
              </div>

              <label
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  cursor: 'pointer',
                }}
              >
                <input
                  type="checkbox"
                  checked={realityEnabled}
                  onChange={e => setRealityEnabled(e.target.checked)}
                  style={{ width: 18, height: 18, accentColor: 'var(--accent-primary)' }}
                />
                <span style={{ fontSize: 13, fontWeight: 600 }}>
                  {realityEnabled ? 'Enabled' : 'Disabled'}
                </span>
              </label>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {STYLES.map(s => {
                const isSelected = realityStyle === s.id
                return (
                  <div
                    key={s.id}
                    onClick={() => setRealityStyle(s.id)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 14,
                      padding: '14px 16px',
                      borderRadius: 'var(--radius-md)',
                      backgroundColor: isSelected ? 'var(--bg-card-hover)' : 'var(--bg-surface)',
                      border: isSelected
                        ? '2px solid var(--accent-primary)'
                        : '1px solid var(--border)',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                    }}
                  >
                    <span style={{ fontSize: 24 }}>{s.icon}</span>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 14, fontWeight: 700 }}>{s.title}</div>
                      <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 2 }}>
                        {s.desc}
                      </div>
                    </div>
                    <input
                      type="radio"
                      name="realityStyle"
                      checked={isSelected}
                      onChange={() => setRealityStyle(s.id)}
                      style={{ accentColor: 'var(--accent-primary)' }}
                    />
                  </div>
                )
              })}
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, alignItems: 'center' }}>
            {saveSuccess && (
              <span style={{ color: 'var(--accent-success)', fontSize: 13, display: 'flex', alignItems: 'center', gap: 6 }}>
                <CheckCircle2 size={16} /> Saved!
              </span>
            )}
            <button
              className="btn btn-primary"
              onClick={handleSave}
              disabled={saving}
              id="save-reality-btn"
            >
              {saving ? 'Saving...' : 'Save Preferences'}
            </button>
          </div>
        </div>
      )}

      {/* TAB 2: RELAXATION PERIODS */}
      {tab === 'relaxation' && (
        <div className="card">
          <RelaxationPeriodManager />
        </div>
      )}

      {/* TAB 3: GOALS & CAREER */}
      {tab === 'goals' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div className="card">
            <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 8 }}>
              Target GATE Score
            </h3>
            <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 16 }}>
              Influences topic importance and weighting in schedule generation.
            </p>

            <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 10 }}>
              <input
                type="range"
                min="400"
                max="950"
                step="25"
                value={gateTarget}
                onChange={e => setGateTarget(Number(e.target.value))}
                style={{ flex: 1, accentColor: 'var(--accent-primary)' }}
              />
              <span
                style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: 20,
                  fontWeight: 800,
                  color: 'var(--accent-primary)',
                  minWidth: 90,
                  textAlign: 'right',
                }}
              >
                {gateTarget} / 1000
              </span>
            </div>
          </div>

          <div className="card">
            <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 8 }}>
              Target Career Tracks
            </h3>
            <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 16 }}>
              Select tracks to prioritize practical engineering topics alongside GATE.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {CAREERS.map(c => {
                const isSelected = careerPaths.includes(c)
                return (
                  <button
                    key={c}
                    type="button"
                    onClick={() => toggleCareer(c)}
                    style={{
                      textAlign: 'left',
                      padding: '10px 14px',
                      borderRadius: 'var(--radius-sm)',
                      backgroundColor: isSelected ? 'var(--accent-secondary-dim)' : 'var(--bg-surface)',
                      border: isSelected ? '1px solid var(--accent-secondary)' : '1px solid var(--border)',
                      color: isSelected ? 'var(--accent-secondary)' : 'var(--text-primary)',
                      fontSize: 13,
                      fontWeight: 600,
                      cursor: 'pointer',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                    }}
                  >
                    <span>{c}</span>
                    {isSelected && <CheckCircle2 size={16} />}
                  </button>
                )
              })}
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, alignItems: 'center' }}>
            {saveSuccess && (
              <span style={{ color: 'var(--accent-success)', fontSize: 13, display: 'flex', alignItems: 'center', gap: 6 }}>
                <CheckCircle2 size={16} /> Saved!
              </span>
            )}
            <button
              className="btn btn-primary"
              onClick={handleSave}
              disabled={saving}
              id="save-goals-btn"
            >
              {saving ? 'Saving...' : 'Save Goals'}
            </button>
          </div>
        </div>
      )}

      {/* TAB 4: ACCOUNT & RESET */}
      {tab === 'account' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div className="card">
            <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 16 }}>User Profile</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
              <div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Name</div>
                <div style={{ fontSize: 15, fontWeight: 600 }}>{user?.name || '—'}</div>
              </div>
              <div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Email</div>
                <div style={{ fontSize: 15, fontWeight: 600 }}>{user?.email || '—'}</div>
              </div>
              <div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Level & XP</div>
                <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--accent-primary)' }}>
                  Level {user?.level || 1} ({user?.xp || 0} XP)
                </div>
              </div>
              <div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Calibration State</div>
                <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--accent-success)' }}>
                  {user?.onboardingDone ? 'Calibrated' : 'Pending'}
                </div>
              </div>
            </div>
          </div>

          {/* Reset Calibration Card */}
          <div
            className="card"
            style={{
              borderColor: 'rgba(255, 140, 66, 0.3)',
              backgroundColor: 'rgba(255, 140, 66, 0.05)',
            }}
          >
            <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 6, color: 'var(--accent-warning)' }}>
              Re-run Calibration Wizard
            </h3>
            <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 16, lineHeight: 1.5 }}>
              Want to re-rate your topics or restart with a clean slate?
              This will clear past sessions and redirect you back to the initial 0–5 calibration wizard.
            </p>

            <button
              className="btn btn-secondary"
              onClick={handleResetCalibration}
              disabled={resetting}
              style={{ color: 'var(--accent-warning)', borderColor: 'var(--accent-warning)' }}
              id="re-calibrate-btn"
            >
              <RefreshCw size={14} className={resetting ? 'animate-spin' : ''} />
              {resetting ? 'Resetting...' : 'Reset & Re-Calibrate'}
            </button>
          </div>

          <div className="card">
            <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 16 }}>Sign Out</h3>
            <button
              className="btn btn-danger"
              onClick={() => signOut({ callbackUrl: '/login' })}
              id="settings-signout-btn"
            >
              <LogOut size={14} /> Sign Out of Engineering OS
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
