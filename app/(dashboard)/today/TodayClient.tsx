'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { RotateCcw, Plus, Clock, CheckCircle, SkipForward, Zap, ChevronDown, Play } from 'lucide-react'
import SessionTimer from './SessionTimer'

interface Block {
  id: string; order: number; startTime: string; endTime: string
  durationMinutes: number; blockType: string; label: string
  title: string; description?: string; topicId?: string
  activityType?: string; priorityScore: number; reasonJson: string
  status: string; understanding?: number; questionsAttempted?: number
  questionsCorrect?: number; actualMinutes?: number
  topic?: any; mastery?: number | null; subjectColor?: string; subjectName?: string
}

interface TodayClientProps {
  user: { id: string; name: string; accentColor: string; realityCheckStyle: string; realityCheckEnabled: boolean }
  checkIn: { availableMinutes: number; energyLevel: string } | null
  schedule: { id: string; availableMinutes: number; energyLevel: string; generatedAt: string } | null
  blocks: Block[]
  overtimeSlots: Array<{ id: string; startTime: string; endTime: string; purpose: string }>
  hasMissedYesterday: boolean
}

const ENERGY_OPTS = [
  { value: 'low', label: '😴 Low', desc: 'Tired, light tasks preferred' },
  { value: 'normal', label: '😊 Normal', desc: 'Ready to work' },
  { value: 'high', label: '⚡ High', desc: 'Let\'s go hard' },
]

const TIME_OPTS = [60, 90, 120, 150, 180, 240, 300, 360]

export default function TodayClient({
  user, checkIn, schedule, blocks, overtimeSlots, hasMissedYesterday
}: TodayClientProps) {
  const router = useRouter()
  const [showCheckIn, setShowCheckIn] = useState(!checkIn && !schedule)
  const [showCompleteModal, setShowCompleteModal] = useState(false)
  const [showTimerModal, setShowTimerModal] = useState(false)
  const [showOvertimeModal, setShowOvertimeModal] = useState(false)
  const [activeBlock, setActiveBlock] = useState<Block | null>(null)
  const [completionData, setCompletionData] = useState({
    status: 'completed', understanding: 4,
    questionsAttempted: 0, questionsCorrect: 0, actualMinutes: 0,
  })
  const [checkInData, setCheckInData] = useState({
    availableMinutes: 240, energyLevel: 'normal'
  })
  const [overtimeData, setOvertimeData] = useState({
    startTime: '23:00', endTime: '00:00', purpose: 'anything'
  })
  const [loading, setLoading] = useState(false)
  const [recalculating, setRecalculating] = useState(false)

  const studyBlocks = blocks.filter(b => b.blockType === 'study')
  const completedCount = studyBlocks.filter(b => b.status === 'completed').length
  const totalStudyMin = studyBlocks.reduce((s, b) => s + b.durationMinutes, 0)

  async function handleCheckIn() {
    setLoading(true)
    try {
      // Save check-in
      await fetch('/api/checkin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...checkInData, date: new Date().toISOString() }),
      })
      // Generate schedule
      await fetch('/api/scheduler', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...checkInData, date: new Date().toISOString() }),
      })
      router.refresh()
      setShowCheckIn(false)
    } finally {
      setLoading(false)
    }
  }

  async function handleCompleteBlock() {
    if (!activeBlock) return
    setLoading(true)
    try {
      await fetch('/api/sessions/complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topicId: activeBlock.topicId,
          blockId: activeBlock.id,
          ...completionData,
          plannedMinutes: activeBlock.durationMinutes,
        }),
      })
      setShowCompleteModal(false)
      setActiveBlock(null)
      router.refresh()
    } finally {
      setLoading(false)
    }
  }

  async function handleRecalculate() {
    setRecalculating(true)
    try {
      await fetch('/api/scheduler', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          availableMinutes: schedule?.availableMinutes ?? 240,
          energyLevel: schedule?.energyLevel ?? 'normal',
        }),
      })
      router.refresh()
    } finally {
      setRecalculating(false)
    }
  }

  async function handleAddOvertime() {
    setLoading(true)
    try {
      await fetch('/api/overtime', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...overtimeData, date: new Date().toISOString() }),
      })
      await handleRecalculate()
      setShowOvertimeModal(false)
    } finally {
      setLoading(false)
    }
  }

  const getBlockBorderColor = (block: Block) => {
    if (block.blockType === 'break') return 'var(--border)'
    if (block.status === 'completed') return 'var(--accent-success)'
    if (block.status === 'skipped') return 'var(--text-muted)'
    return block.subjectColor ?? 'var(--accent-primary)'
  }

  return (
    <div className="animate-fade-in">
      {/* Header */}
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1 className="page-title">
            {schedule ? "TODAY'S MISSION" : 'Plan Your Day'}
          </h1>
          {schedule && (
            <p className="page-subtitle">
              {completedCount}/{studyBlocks.length} tasks complete ·{' '}
              {Math.floor(totalStudyMin / 60)}h {totalStudyMin % 60}m planned
            </p>
          )}
        </div>
        {schedule && (
          <div style={{ display: 'flex', gap: 8 }}>
            <button
              className="btn btn-secondary"
              onClick={() => setShowOvertimeModal(true)}
              id="add-overtime-btn"
            >
              <Plus size={14} />
              Add Overtime
            </button>
            <button
              className="btn btn-secondary"
              onClick={handleRecalculate}
              disabled={recalculating}
              id="recalculate-btn"
            >
              <RotateCcw size={14} className={recalculating ? 'animate-spin' : ''} />
              {recalculating ? 'Recalculating...' : 'Recalculate My Day'}
            </button>
          </div>
        )}
      </div>

      {/* Check-in modal / no schedule state */}
      {showCheckIn && (
        <div className="card" style={{ maxWidth: 540, marginBottom: 24 }}>
          <h2 style={{ fontSize: 22, fontWeight: 800, marginBottom: 8 }}>
            Good {new Date().getHours() < 12 ? 'morning' : 'evening'}, {user.name}! 👋
          </h2>
          <p style={{ color: 'var(--text-secondary)', marginBottom: 24, fontSize: 14 }}>
            Let's plan your day. How much time do you have, and how are you feeling?
          </p>

          <div style={{ marginBottom: 20 }}>
            <div className="form-label" style={{ marginBottom: 10 }}>
              Available study time today
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {TIME_OPTS.map(m => (
                <button
                  key={m}
                  className={`btn btn-sm ${checkInData.availableMinutes === m ? 'btn-primary' : 'btn-secondary'}`}
                  onClick={() => setCheckInData(d => ({ ...d, availableMinutes: m }))}
                  id={`time-opt-${m}`}
                >
                  {m >= 60 ? `${Math.floor(m / 60)}h${m % 60 ? ` ${m % 60}m` : ''}` : `${m}m`}
                </button>
              ))}
            </div>
          </div>

          <div style={{ marginBottom: 24 }}>
            <div className="form-label" style={{ marginBottom: 10 }}>Energy level</div>
            <div style={{ display: 'flex', gap: 8 }}>
              {ENERGY_OPTS.map(opt => (
                <button
                  key={opt.value}
                  className={`btn btn-sm ${checkInData.energyLevel === opt.value ? 'btn-primary' : 'btn-secondary'}`}
                  onClick={() => setCheckInData(d => ({ ...d, energyLevel: opt.value }))}
                  id={`energy-${opt.value}`}
                  style={{ flexDirection: 'column', height: 'auto', padding: '10px 14px' }}
                >
                  <span>{opt.label}</span>
                  <span style={{ fontSize: 11, opacity: 0.7, fontWeight: 400 }}>{opt.desc}</span>
                </button>
              ))}
            </div>
          </div>

          <button
            className="btn btn-primary btn-lg"
            onClick={handleCheckIn}
            disabled={loading}
            id="checkin-submit-btn"
          >
            {loading ? 'Generating your plan...' : '⚡ Generate Today\'s Adaptive Schedule'}
          </button>
        </div>
      )}

      {/* Schedule blocks */}
      {!showCheckIn && blocks.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, maxWidth: 720 }}>
          {blocks.map((block, idx) => {
            const isBreak = block.blockType === 'break'
            const isDone = block.status === 'completed' || block.status === 'skipped'
            const reasons: string[] = JSON.parse(block.reasonJson || '[]')

            if (isBreak) {
              return (
                <div key={block.id} style={{
                  display: 'flex', alignItems: 'center', gap: 12,
                  padding: '8px 16px', opacity: 0.6,
                }}>
                  <div style={{
                    fontFamily: 'var(--font-mono)', fontSize: 12,
                    color: 'var(--text-muted)', width: 48,
                  }}>
                    {block.startTime}
                  </div>
                  <div style={{ flex: 1, height: 1, background: 'var(--border)', borderStyle: 'dashed' }} />
                  <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>
                    {block.label} — {block.durationMinutes}m
                  </span>
                  <div style={{ flex: 1, height: 1, background: 'var(--border)', borderStyle: 'dashed' }} />
                </div>
              )
            }

            return (
              <div
                key={block.id}
                className={`schedule-block block-${block.blockType} status-${block.status}`}
                style={{
                  borderLeftColor: getBlockBorderColor(block),
                  borderLeftWidth: 3,
                  opacity: isDone ? 0.65 : 1,
                  cursor: isDone ? 'default' : 'pointer',
                  transition: 'all 0.2s ease',
                }}
                onClick={() => {
                  if (!isDone && block.topicId) {
                    setActiveBlock(block)
                    setCompletionData(d => ({ ...d, actualMinutes: block.durationMinutes }))
                    setShowCompleteModal(true)
                  }
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                      <span style={{
                        fontFamily: 'var(--font-mono)', fontSize: 12,
                        color: 'var(--text-muted)',
                      }}>
                        {block.startTime} — {block.endTime}
                      </span>
                      <span className="badge badge-primary" style={{ fontSize: 11 }}>
                        {block.durationMinutes}m
                      </span>
                    </div>

                    <div className="block-label" style={{ color: block.subjectColor ?? 'var(--accent-primary)' }}>
                      {block.label}
                    </div>
                    <div className="block-title">{block.title}</div>
                    <div className="block-subject">{block.subjectName ?? block.description}</div>

                    {block.mastery !== undefined && block.mastery !== null && block.mastery > 0 && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 8 }}>
                        <div style={{ width: 80, height: 4, background: 'var(--bg-input)', borderRadius: 99, overflow: 'hidden' }}>
                          <div style={{
                            height: '100%', width: `${block.mastery}%`,
                            background: block.subjectColor ?? 'var(--accent-primary)',
                            borderRadius: 99,
                          }} />
                        </div>
                        <span style={{ fontSize: 12, fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>
                          {Math.round(block.mastery)}% mastery
                        </span>
                      </div>
                    )}

                    {reasons.length > 0 && !isDone && (
                      <div style={{ marginTop: 8, display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                        {reasons.slice(0, 2).map((r, i) => (
                          <span key={i} style={{
                            fontSize: 11, color: 'var(--text-muted)',
                            background: 'var(--bg-input)', borderRadius: 4, padding: '2px 6px',
                          }}>
                            {r}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  <div style={{ marginLeft: 12, flexShrink: 0 }}>
                    {block.status === 'completed' && <CheckCircle size={20} color="var(--accent-success)" />}
                    {block.status === 'skipped' && <SkipForward size={20} color="var(--text-muted)" />}
                    {!isDone && block.topicId && (
                      <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                        <button
                          type="button"
                          className="btn btn-primary btn-sm"
                          style={{ padding: '6px 12px', fontSize: 12, display: 'flex', alignItems: 'center', gap: 4 }}
                          onClick={(e) => {
                            e.stopPropagation()
                            setActiveBlock(block)
                            setShowTimerModal(true)
                          }}
                          id={`timer-btn-${block.id}`}
                        >
                          <Play size={12} /> Focus
                        </button>
                        <button
                          type="button"
                          className="btn btn-secondary btn-sm"
                          style={{ padding: '6px 10px', fontSize: 12, display: 'flex', alignItems: 'center', gap: 4 }}
                          onClick={(e) => {
                            e.stopPropagation()
                            setActiveBlock(block)
                            setCompletionData(d => ({ ...d, actualMinutes: block.durationMinutes }))
                            setShowCompleteModal(true)
                          }}
                          id={`log-btn-${block.id}`}
                        >
                          <CheckCircle size={12} />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {!showCheckIn && blocks.length === 0 && (
        <div className="card" style={{ textAlign: 'center', padding: 48 }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>📅</div>
          <h3>No schedule yet</h3>
          <p style={{ color: 'var(--text-secondary)', marginTop: 8, marginBottom: 20 }}>
            Complete the check-in to generate your adaptive plan
          </p>
          <button className="btn btn-primary" onClick={() => setShowCheckIn(true)} id="start-checkin-btn">
            Start Check-In
          </button>
        </div>
      )}

      {/* Session completion modal */}
      {showCompleteModal && activeBlock && (
        <div className="modal-overlay" onClick={e => { if (e.target === e.currentTarget) setShowCompleteModal(false) }}>
          <div className="modal">
            <div style={{
              display: 'inline-block', padding: '4px 10px',
              background: (activeBlock.subjectColor ?? 'var(--accent-primary)') + '20',
              borderRadius: 6, fontSize: 12, fontWeight: 700,
              color: activeBlock.subjectColor ?? 'var(--accent-primary)',
              marginBottom: 12,
            }}>
              {activeBlock.subjectName}
            </div>
            <h2 className="modal-title">{activeBlock.title}</h2>
            <p className="modal-subtitle">How did this session go?</p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              {/* Status */}
              <div>
                <div className="form-label" style={{ marginBottom: 8 }}>Did you complete it?</div>
                <div style={{ display: 'flex', gap: 8 }}>
                  {['completed', 'partial', 'skipped'].map(s => (
                    <button
                      key={s}
                      className={`btn btn-sm ${completionData.status === s ? 'btn-primary' : 'btn-secondary'}`}
                      onClick={() => setCompletionData(d => ({ ...d, status: s }))}
                      id={`status-${s}`}
                    >
                      {s === 'completed' ? '✅ Completed' : s === 'partial' ? '⚡ Partial' : '⏭ Skipped'}
                    </button>
                  ))}
                </div>
              </div>

              {/* Understanding */}
              <div>
                <div className="form-label" style={{ marginBottom: 8 }}>Understanding (1–5)</div>
                <div style={{ display: 'flex', gap: 8 }}>
                  {[1, 2, 3, 4, 5].map(n => (
                    <button
                      key={n}
                      className={`btn btn-sm ${completionData.understanding === n ? 'btn-primary' : 'btn-secondary'}`}
                      onClick={() => setCompletionData(d => ({ ...d, understanding: n }))}
                      id={`understanding-${n}`}
                      style={{ width: 40 }}
                    >
                      {n}
                    </button>
                  ))}
                </div>
              </div>

              {/* Questions */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div className="form-group">
                  <label className="form-label" htmlFor="questions-attempted">Questions attempted</label>
                  <input
                    id="questions-attempted"
                    type="number"
                    className="form-input"
                    value={completionData.questionsAttempted}
                    onChange={e => setCompletionData(d => ({ ...d, questionsAttempted: +e.target.value }))}
                    min={0}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label" htmlFor="questions-correct">Correct</label>
                  <input
                    id="questions-correct"
                    type="number"
                    className="form-input"
                    value={completionData.questionsCorrect}
                    onChange={e => setCompletionData(d => ({ ...d, questionsCorrect: +e.target.value }))}
                    min={0}
                  />
                </div>
              </div>

              {/* Actual time */}
              <div className="form-group">
                <label className="form-label" htmlFor="actual-minutes">Actual time (minutes)</label>
                <input
                  id="actual-minutes"
                  type="number"
                  className="form-input"
                  value={completionData.actualMinutes}
                  onChange={e => setCompletionData(d => ({ ...d, actualMinutes: +e.target.value }))}
                  min={1}
                />
              </div>

              <div style={{ display: 'flex', gap: 8 }}>
                <button
                  className="btn btn-secondary"
                  onClick={() => setShowCompleteModal(false)}
                  style={{ flex: 1 }}
                  id="cancel-complete-btn"
                >
                  Cancel
                </button>
                <button
                  className="btn btn-primary"
                  onClick={handleCompleteBlock}
                  disabled={loading}
                  style={{ flex: 2 }}
                  id="submit-complete-btn"
                >
                  {loading ? 'Saving...' : '✓ Save & Update Mastery'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Overtime modal */}
      {showOvertimeModal && (
        <div className="modal-overlay" onClick={e => { if (e.target === e.currentTarget) setShowOvertimeModal(false) }}>
          <div className="modal">
            <h2 className="modal-title">Add Overtime</h2>
            <p className="modal-subtitle">
              Today's normal hours are already planned. Add extra time voluntarily.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div className="form-group">
                  <label className="form-label" htmlFor="overtime-start">Start time</label>
                  <input
                    id="overtime-start"
                    type="time"
                    className="form-input"
                    value={overtimeData.startTime}
                    onChange={e => setOvertimeData(d => ({ ...d, startTime: e.target.value }))}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label" htmlFor="overtime-end">End time</label>
                  <input
                    id="overtime-end"
                    type="time"
                    className="form-input"
                    value={overtimeData.endTime}
                    onChange={e => setOvertimeData(d => ({ ...d, endTime: e.target.value }))}
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Use this time for</label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {['anything', 'gate', 'dsa', 'ml', 'college', 'revision', 'project'].map(p => (
                    <button
                      key={p}
                      className={`btn btn-sm ${overtimeData.purpose === p ? 'btn-primary' : 'btn-secondary'}`}
                      onClick={() => setOvertimeData(d => ({ ...d, purpose: p }))}
                      id={`overtime-purpose-${p}`}
                    >
                      {p.charAt(0).toUpperCase() + p.slice(1)}
                    </button>
                  ))}
                </div>
              </div>

              <div style={{ display: 'flex', gap: 8 }}>
                <button className="btn btn-secondary" onClick={() => setShowOvertimeModal(false)} style={{ flex: 1 }} id="cancel-overtime-btn">
                  Cancel
                </button>
                <button
                  className="btn btn-primary"
                  onClick={handleAddOvertime}
                  disabled={loading}
                  style={{ flex: 2 }}
                  id="submit-overtime-btn"
                >
                  {loading ? 'Adding...' : '+ Add Overtime & Recalculate'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Focus Timer Overlay */}
      {showTimerModal && activeBlock && (
        <SessionTimer
          topicName={activeBlock.title}
          subjectName={activeBlock.subjectName || 'Deep Work'}
          subjectColor={activeBlock.subjectColor || 'var(--accent-primary)'}
          plannedMinutes={activeBlock.durationMinutes}
          onClose={() => setShowTimerModal(false)}
          onComplete={(elapsedMinutes) => {
            setShowTimerModal(false)
            setCompletionData(d => ({
              ...d,
              actualMinutes: elapsedMinutes,
              status: 'completed',
            }))
            setShowCompleteModal(true)
          }}
        />
      )}
    </div>
  )
}
