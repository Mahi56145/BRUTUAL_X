'use client'

import { useState, useEffect } from 'react'
import { Plus, Trash2, Calendar, ShieldCheck, PauseCircle, CheckCircle2 } from 'lucide-react'

interface Period {
  id: string
  startDate: string
  endDate: string
  reason: string
  examType: string | null
  mode: string
  active: boolean
}

export default function RelaxationPeriodManager() {
  const [periods, setPeriods] = useState<Period[]>([])
  const [loading, setLoading] = useState(true)
  const [showAdd, setShowAdd] = useState(false)
  const [formData, setFormData] = useState({
    startDate: new Date().toISOString().split('T')[0],
    endDate: new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0],
    reason: '',
    examType: 'college_exam',
    mode: 'complete',
  })
  const [submitting, setSubmitting] = useState(false)

  const loadPeriods = async () => {
    try {
      const res = await fetch('/api/relaxation')
      if (res.ok) {
        const data = await res.json()
        setPeriods(data.periods || [])
      }
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadPeriods()
  }, [])

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.reason) return
    setSubmitting(true)
    try {
      const res = await fetch('/api/relaxation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })
      if (res.ok) {
        setShowAdd(false)
        setFormData({
          startDate: new Date().toISOString().split('T')[0],
          endDate: new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0],
          reason: '',
          examType: 'college_exam',
          mode: 'complete',
        })
        await loadPeriods()
      }
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Remove this relaxation period?')) return
    try {
      const res = await fetch(`/api/relaxation?id=${id}`, { method: 'DELETE' })
      if (res.ok) {
        setPeriods(prev => prev.filter(p => p.id !== id))
      }
    } catch (err) {
      console.error(err)
    }
  }

  const now = new Date()

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 4 }}>
            Strategic Relaxation & Exam Breaks
          </h3>
          <p style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
            Schedule semester exams, college submissions, or recovery breaks.
            During active periods, your study streak is frozen and protected from reset.
          </p>
        </div>
        <button
          className="btn btn-primary btn-sm"
          onClick={() => setShowAdd(!showAdd)}
          id="add-relaxation-period-btn"
        >
          <Plus size={14} /> Schedule Break
        </button>
      </div>

      {/* Add Form */}
      {showAdd && (
        <form
          onSubmit={handleAdd}
          className="card"
          style={{
            backgroundColor: 'var(--bg-surface)',
            border: '1px solid var(--accent-primary-dim)',
            padding: 20,
          }}
        >
          <h4 style={{ fontSize: 14, fontWeight: 700, marginBottom: 14 }}>
            New Relaxation Period
          </h4>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
            <div className="form-group">
              <label className="form-label">Start Date</label>
              <input
                type="date"
                className="form-input"
                value={formData.startDate}
                onChange={e => setFormData(d => ({ ...d, startDate: e.target.value }))}
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label">End Date</label>
              <input
                type="date"
                className="form-input"
                value={formData.endDate}
                onChange={e => setFormData(d => ({ ...d, endDate: e.target.value }))}
                required
              />
            </div>
          </div>

          <div className="form-group" style={{ marginBottom: 12 }}>
            <label className="form-label">Reason / Exam Title</label>
            <input
              type="text"
              className="form-input"
              placeholder="e.g. 5th Sem End-Semester Exams, Major Project Submission"
              value={formData.reason}
              onChange={e => setFormData(d => ({ ...d, reason: e.target.value }))}
              required
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
            <div className="form-group">
              <label className="form-label">Category</label>
              <select
                className="form-input"
                value={formData.examType}
                onChange={e => setFormData(d => ({ ...d, examType: e.target.value }))}
              >
                <option value="college_exam">Semester Exams</option>
                <option value="gate_mock">GATE Full Mock Week</option>
                <option value="project">College Project/Lab</option>
                <option value="travel">Travel / Family</option>
                <option value="burnout_prevention">Recovery / Burnout Prevention</option>
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Mode</label>
              <select
                className="form-input"
                value={formData.mode}
                onChange={e => setFormData(d => ({ ...d, mode: e.target.value }))}
              >
                <option value="complete">Complete Break (0 study blocks)</option>
                <option value="light">Light Maintenance (1 short revision block/day)</option>
              </select>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={() => setShowAdd(false)}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary btn-sm"
              disabled={submitting}
            >
              {submitting ? 'Saving...' : 'Save & Protect Streak'}
            </button>
          </div>
        </form>
      )}

      {/* List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {loading && <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>Loading periods...</p>}
        {!loading && periods.length === 0 && (
          <div
            style={{
              padding: 24,
              textAlign: 'center',
              borderRadius: 'var(--radius-md)',
              border: '1px dashed var(--border)',
              color: 'var(--text-muted)',
              fontSize: 13,
            }}
          >
            No scheduled relaxation periods. Add one before your semester exams to protect your streak.
          </div>
        )}

        {periods.map(period => {
          const start = new Date(period.startDate)
          const end = new Date(period.endDate)
          const isCurrentlyActive = now >= start && now <= end && period.active

          return (
            <div
              key={period.id}
              style={{
                padding: '14px 18px',
                borderRadius: 'var(--radius-md)',
                backgroundColor: isCurrentlyActive ? 'rgba(108, 99, 255, 0.08)' : 'var(--bg-surface)',
                border: isCurrentlyActive
                  ? '1px solid var(--accent-primary)'
                  : '1px solid var(--border)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                gap: 16,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                <div style={{ fontSize: 24 }}>
                  {isCurrentlyActive ? '⏸' : '📅'}
                </div>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <strong style={{ fontSize: 14 }}>{period.reason}</strong>
                    {isCurrentlyActive && (
                      <span
                        style={{
                          fontSize: 11,
                          padding: '1px 6px',
                          borderRadius: 4,
                          backgroundColor: 'var(--accent-primary)',
                          color: '#ffffff',
                          fontWeight: 700,
                        }}
                      >
                        Active Now · Streak Frozen
                      </span>
                    )}
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>
                    {start.toLocaleDateString()} — {end.toLocaleDateString()} ·{' '}
                    <span style={{ textTransform: 'capitalize' }}>{period.examType?.replace('_', ' ')}</span> ·{' '}
                    <span>{period.mode === 'complete' ? 'Complete Pause' : 'Light Mode'}</span>
                  </div>
                </div>
              </div>

              <button
                className="btn btn-secondary btn-sm"
                onClick={() => handleDelete(period.id)}
                style={{ color: 'var(--accent-danger)' }}
                title="Delete period"
              >
                <Trash2 size={14} />
              </button>
            </div>
          )
        })}
      </div>
    </div>
  )
}
