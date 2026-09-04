'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  Target,
  Clock,
  TrendingUp,
  Zap,
  AlertTriangle,
  RotateCcw,
  BookOpen,
  Award,
  Brain,
  CheckCircle,
  Calendar,
  Flame,
  PauseCircle,
  Sparkles,
  Info,
} from 'lucide-react'
import type { StreakStatus } from '@/lib/streak-engine'
import type { RealityCheckResult } from '@/lib/reality-check'

interface DashboardClientProps {
  user: {
    id: string
    name: string
    avatarInitials: string
    accentColor: string
    gateTarget: number
    careerPaths: string[]
    xp: number
    level: number
  }
  focusTopic: {
    topicId: string
    topicName: string
    subjectName: string
    subjectColor: string
    mastery: number | null
    selfAssessScore: number | null
    importance: number
    gateRelevance: number
    blockId?: string
    label?: string
    reasons: string[]
    startTime?: string
    durationMinutes?: number
  } | null
  todayStats: {
    totalMinutes: number
    availableMinutes: number
    tasksTotal: number
    tasksCompleted: number
    energyLevel: string
    hasSchedule: boolean
    hasCheckIn: boolean
  }
  weeklyStats: {
    totalMinutes: number
    masteryGained: number
    daysStudied: number
    missedSessions: number
  }
  gateReadiness: number | null
  subjectMastery: Array<{
    id: string
    name: string
    slug: string
    icon: string
    color: string
    estimatedMastery: number | null
    topicsAssessed: number
    topicsTotal: number
    topicsWeak: number
    confidence: 'none' | 'low' | 'medium' | 'high'
    gateWeight: number
  }>
  weakAreas: Array<{
    topicId: string
    topicName: string
    subjectName: string
    mastery: number
    color: string
  }>
  revisionDue: Array<{
    topicId: string
    topicName: string
    subjectName: string
    daysOverdue: number
  }>
  streak: StreakStatus
  realityCheck: RealityCheckResult
  realityCheckEnabled: boolean
  totalAssessedCount: number
  totalTopicsCount: number
}

function MasteryBar({
  value,
  color,
}: {
  value: number | null
  color: string
}) {
  if (value === null) {
    return (
      <div
        className="progress-bar-container"
        style={{
          height: 8,
          backgroundColor: 'var(--bg-input)',
          border: '1px dashed var(--border-strong)',
        }}
      />
    )
  }

  return (
    <div className="progress-bar-container" style={{ height: 8 }}>
      <div
        className="progress-bar-fill"
        style={{
          width: `${Math.min(100, Math.max(0, value))}%`,
          background: `linear-gradient(90deg, ${color}88, ${color})`,
        }}
      />
    </div>
  )
}

function CircleProgress({
  value,
  color,
  size = 80,
}: {
  value: number | null
  color: string
  size?: number
}) {
  const r = (size - 8) / 2
  const circ = 2 * Math.PI * r
  const displayVal = value !== null ? Math.min(100, Math.max(0, value)) : 0
  const dash = (displayVal / 100) * circ

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        fill="none"
        stroke="var(--bg-input)"
        strokeWidth={6}
      />
      {value !== null && (
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={color}
          strokeWidth={6}
          strokeDasharray={`${dash} ${circ}`}
          strokeLinecap="round"
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
          style={{ transition: 'stroke-dasharray 1s ease' }}
        />
      )}
      <text
        x={size / 2}
        y={size / 2 + 5}
        textAnchor="middle"
        fill="var(--text-primary)"
        fontSize={value !== null ? size / 4.5 : size / 6.5}
        fontWeight="800"
        fontFamily="var(--font-mono)"
      >
        {value !== null ? `${value}%` : 'N/A'}
      </text>
    </svg>
  )
}

export default function DashboardClient({
  user,
  focusTopic,
  todayStats,
  weeklyStats,
  gateReadiness,
  subjectMastery,
  weakAreas,
  revisionDue,
  streak,
  realityCheck,
  realityCheckEnabled,
  totalAssessedCount,
  totalTopicsCount,
}: DashboardClientProps) {
  const router = useRouter()
  const [generatingSchedule, setGeneratingSchedule] = useState(false)

  const hour = new Date().getHours()
  const greeting =
    hour < 12
      ? 'Good morning'
      : hour < 17
      ? 'Good afternoon'
      : 'Good evening'

  const progressPct =
    todayStats.tasksTotal > 0
      ? Math.round((todayStats.tasksCompleted / todayStats.tasksTotal) * 100)
      : 0

  async function handleGenerateSchedule() {
    setGeneratingSchedule(true)
    try {
      await fetch('/api/scheduler', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ availableMinutes: 240, energyLevel: 'normal' }),
      })
      router.push('/today')
    } finally {
      setGeneratingSchedule(false)
    }
  }

  return (
    <div className="animate-fade-in">
      {/* ── Header ── */}
      <div
        className="page-header"
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          flexWrap: 'wrap',
          gap: 16,
        }}
      >
        <div>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              marginBottom: 8,
            }}
          >
            <div
              style={{
                width: 48,
                height: 48,
                borderRadius: '50%',
                background: `linear-gradient(135deg, ${user.accentColor}88, ${user.accentColor})`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 18,
                fontWeight: 800,
                color: 'white',
              }}
            >
              {user.avatarInitials}
            </div>
            <div>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                }}
              >
                <span
                  style={{
                    fontSize: 13,
                    color: 'var(--text-muted)',
                    fontFamily: 'var(--font-mono)',
                  }}
                >
                  {greeting}
                </span>
                <span
                  style={{
                    fontSize: 11,
                    padding: '2px 8px',
                    borderRadius: 'var(--radius-full)',
                    backgroundColor: 'var(--accent-primary-dim)',
                    color: 'var(--accent-primary)',
                    fontWeight: 700,
                  }}
                >
                  LVL {user.level} ({user.xp} XP)
                </span>
              </div>
              <h1 className="page-title" style={{ fontSize: 28, marginTop: 2 }}>
                {user.name}
              </h1>
            </div>
          </div>
          <p className="page-subtitle">
            {todayStats.hasSchedule
              ? `${progressPct}% of today's plan complete`
              : "No schedule generated yet — let's build your day"}
          </p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button
            className="btn btn-secondary"
            onClick={() => router.push('/today')}
            id="view-today-btn"
          >
            <Calendar size={14} />
            View Today
          </button>
          {!todayStats.hasSchedule && (
            <button
              className="btn btn-primary"
              onClick={handleGenerateSchedule}
              disabled={generatingSchedule}
              id="generate-schedule-btn"
            >
              {generatingSchedule ? (
                <>
                  <div
                    className="spinner"
                    style={{ width: 14, height: 14, borderTopColor: 'white' }}
                  />{' '}
                  Generating...
                </>
              ) : (
                <>
                  <Zap size={14} /> Generate Today's Plan
                </>
              )}
            </button>
          )}
        </div>
      </div>

      {/* ── Reality Check Banner ── */}
      {realityCheckEnabled && (
        <div
          style={{
            padding: '16px 20px',
            borderRadius: 'var(--radius-md)',
            backgroundColor:
              realityCheck.tone === 'danger'
                ? 'rgba(255, 71, 87, 0.1)'
                : realityCheck.tone === 'warning'
                ? 'rgba(255, 140, 66, 0.1)'
                : realityCheck.tone === 'success'
                ? 'rgba(46, 213, 115, 0.1)'
                : 'var(--bg-card)',
            border: `1px solid ${
              realityCheck.tone === 'danger'
                ? 'rgba(255, 71, 87, 0.3)'
                : realityCheck.tone === 'warning'
                ? 'rgba(255, 140, 66, 0.3)'
                : realityCheck.tone === 'success'
                ? 'rgba(46, 213, 115, 0.3)'
                : 'var(--border)'
            }`,
            marginBottom: 24,
            display: 'flex',
            alignItems: 'flex-start',
            gap: 16,
          }}
        >
          <div style={{ fontSize: 28, lineHeight: 1 }}>
            {realityCheck.tone === 'danger'
              ? '🚨'
              : realityCheck.tone === 'warning'
              ? '⚠️'
              : realityCheck.tone === 'success'
              ? '🎯'
              : '⚡'}
          </div>
          <div style={{ flex: 1 }}>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                marginBottom: 4,
              }}
            >
              <strong style={{ fontSize: 15 }}>{realityCheck.headline}</strong>
              <span
                style={{
                  fontSize: 10,
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  padding: '1px 6px',
                  borderRadius: 4,
                  backgroundColor:
                    realityCheck.tone === 'danger'
                      ? 'var(--accent-danger)'
                      : realityCheck.tone === 'warning'
                      ? 'var(--accent-warning)'
                      : 'var(--accent-primary)',
                  color: '#ffffff',
                }}
              >
                {realityCheck.badge}
              </span>
            </div>
            <p
              style={{
                fontSize: 13,
                color: 'var(--text-primary)',
                lineHeight: 1.5,
                marginBottom: 4,
              }}
            >
              {realityCheck.message}
            </p>
            <div style={{ fontSize: 11, color: 'var(--text-secondary)' }}>
              {realityCheck.subtext}
            </div>
          </div>
        </div>
      )}

      {/* ── Top stats row ── */}
      <div className="grid-4" style={{ marginBottom: 24 }}>
        <div className="stat-card">
          <div className="stat-label">Today's Study</div>
          <div className="stat-value" style={{ color: user.accentColor }}>
            {Math.floor(todayStats.totalMinutes / 60)}h{' '}
            {todayStats.totalMinutes % 60}m
          </div>
          <div className="stat-change positive">
            <TrendingUp size={12} />
            of {Math.floor(todayStats.availableMinutes / 60)}h available
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-label">Tasks Today</div>
          <div
            className="stat-value"
            style={{ color: 'var(--accent-success)' }}
          >
            {todayStats.tasksCompleted}/{todayStats.tasksTotal}
          </div>
          <div className="stat-change positive">
            <CheckCircle size={12} />
            {progressPct}% complete
          </div>
        </div>

        {/* Real Streak Card */}
        <div className="stat-card">
          <div className="stat-label">Study Streak</div>
          <div
            className="stat-value"
            style={{
              color: streak.isFrozen
                ? 'var(--accent-info)'
                : streak.currentStreak > 0
                ? 'var(--accent-warning)'
                : 'var(--text-muted)',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
            }}
          >
            {streak.isFrozen ? (
              <>
                <PauseCircle size={22} />
                <span>Frozen</span>
              </>
            ) : (
              <>
                <Flame size={22} />
                <span>{streak.currentStreak}d</span>
              </>
            )}
          </div>
          <div className="stat-change">
            {streak.isFrozen
              ? streak.freezeReason || 'Exam Break'
              : `Best: ${streak.longestStreak} days (${streak.totalActiveDays} total)`}
          </div>
        </div>

        {/* Real GATE Readiness */}
        <div className="stat-card">
          <div className="stat-label">GATE Readiness</div>
          <div
            className="stat-value"
            style={{
              color:
                gateReadiness !== null
                  ? 'var(--accent-primary)'
                  : 'var(--text-muted)',
            }}
          >
            {gateReadiness !== null ? `${gateReadiness}%` : 'Not Assessed'}
          </div>
          <div className="stat-change">
            <Target size={12} />
            {gateReadiness !== null
              ? `Target: ${user.gateTarget}+`
              : 'Requires real quiz attempts'}
          </div>
        </div>
      </div>

      {/* ── Main content grid ── */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 340px',
          gap: 24,
        }}
      >
        {/* Left column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* Current Focus Card */}
          {focusTopic ? (
            <div
              className="card card-glow"
              style={{
                background: `linear-gradient(135deg, ${focusTopic.subjectColor}08, var(--bg-card))`,
                borderColor: focusTopic.subjectColor + '30',
              }}
            >
              <div className="card-header">
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Zap size={14} color="var(--accent-warning)" />
                  <span className="card-title">Current Focus</span>
                </div>
                <span className="badge badge-warning">{focusTopic.label}</span>
              </div>

              <div style={{ marginBottom: 20 }}>
                <div
                  style={{
                    fontSize: 13,
                    color: 'var(--text-muted)',
                    marginBottom: 4,
                    fontFamily: 'var(--font-mono)',
                  }}
                >
                  {focusTopic.subjectName}
                </div>
                <h2
                  style={{
                    fontSize: 26,
                    fontWeight: 800,
                    color: 'var(--text-primary)',
                    marginBottom: 12,
                  }}
                >
                  {focusTopic.topicName}
                </h2>

                <div
                  style={{
                    display: 'flex',
                    gap: 20,
                    alignItems: 'center',
                    marginBottom: 16,
                  }}
                >
                  <div style={{ flex: 1 }}>
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        fontSize: 11,
                        color: 'var(--text-muted)',
                        marginBottom: 4,
                      }}
                    >
                      <span>MASTERY</span>
                      <span>
                        {focusTopic.mastery !== null
                          ? `${Math.round(focusTopic.mastery)}%`
                          : focusTopic.selfAssessScore !== null
                          ? `Self-rating: ${focusTopic.selfAssessScore}/5 (Not assessed)`
                          : 'Not Assessed'}
                      </span>
                    </div>
                    <MasteryBar
                      value={focusTopic.mastery}
                      color={focusTopic.subjectColor}
                    />
                  </div>
                  <div style={{ textAlign: 'center' }}>
                    <div
                      style={{
                        fontSize: 11,
                        color: 'var(--text-muted)',
                      }}
                    >
                      START
                    </div>
                    <div
                      style={{
                        fontFamily: 'var(--font-mono)',
                        fontSize: 18,
                        fontWeight: 700,
                      }}
                    >
                      {focusTopic.startTime ?? '—'}
                    </div>
                  </div>
                  <div style={{ textAlign: 'center' }}>
                    <div
                      style={{
                        fontSize: 11,
                        color: 'var(--text-muted)',
                      }}
                    >
                      DURATION
                    </div>
                    <div
                      style={{
                        fontFamily: 'var(--font-mono)',
                        fontSize: 18,
                        fontWeight: 700,
                      }}
                    >
                      {focusTopic.durationMinutes}m
                    </div>
                  </div>
                </div>

                {/* Why this task */}
                {focusTopic.reasons.length > 0 && (
                  <div
                    style={{
                      background: 'var(--bg-input)',
                      borderRadius: 8,
                      padding: '10px 14px',
                      marginBottom: 16,
                    }}
                  >
                    <div
                      style={{
                        fontSize: 11,
                        fontWeight: 700,
                        color: 'var(--text-muted)',
                        letterSpacing: '0.5px',
                        marginBottom: 6,
                      }}
                    >
                      WHY THIS TASK?
                    </div>
                    {focusTopic.reasons.slice(0, 3).map((r, i) => (
                      <div
                        key={i}
                        style={{
                          fontSize: 13,
                          color: 'var(--text-secondary)',
                          display: 'flex',
                          gap: 6,
                          marginBottom: 2,
                        }}
                      >
                        <span style={{ color: 'var(--accent-success)' }}>
                          ✓
                        </span>
                        {r}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <button
                className="btn btn-primary w-full btn-lg"
                onClick={() => router.push('/today')}
                id="start-session-btn"
              >
                <Zap size={16} />
                Start Session
              </button>
            </div>
          ) : (
            <div className="card" style={{ textAlign: 'center', padding: 48 }}>
              <div style={{ fontSize: 48, marginBottom: 16 }}>🎯</div>
              <h3 style={{ fontSize: 20, fontWeight: 700, marginBottom: 8 }}>
                No schedule generated for today
              </h3>
              <p
                style={{
                  color: 'var(--text-secondary)',
                  marginBottom: 24,
                  fontSize: 14,
                }}
              >
                Let the adaptive scheduler calculate optimal study blocks based
                on your goals and forgetting curve.
              </p>
              <button
                className="btn btn-primary btn-lg"
                onClick={handleGenerateSchedule}
                disabled={generatingSchedule}
                id="generate-schedule-home-btn"
              >
                {generatingSchedule ? 'Generating...' : '⚡ Generate My Day'}
              </button>
            </div>
          )}

          {/* Subject Mastery Grid */}
          <div className="card">
            <div className="card-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <BookOpen size={14} color="var(--text-muted)" />
                <span className="card-title">Subject Mastery</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <span
                  style={{
                    fontSize: 12,
                    color: 'var(--text-muted)',
                    fontFamily: 'var(--font-mono)',
                  }}
                >
                  {totalAssessedCount}/{totalTopicsCount} topics assessed
                </span>
                <button
                  className="btn btn-secondary btn-sm"
                  onClick={() => router.push('/subjects')}
                  id="view-subjects-btn"
                >
                  View All
                </button>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {subjectMastery.map(s => (
                <div
                  key={s.id}
                  className="topic-row"
                  style={{ padding: '8px 0', cursor: 'pointer' }}
                  onClick={() => router.push(`/subjects/${s.slug}`)}
                >
                  <span
                    style={{
                      fontSize: 18,
                      width: 28,
                      textAlign: 'center',
                    }}
                  >
                    {s.icon}
                  </span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        marginBottom: 4,
                      }}
                    >
                      <span style={{ fontSize: 14, fontWeight: 600 }}>
                        {s.name}
                      </span>
                      <span
                        style={{
                          fontSize: 11,
                          color: 'var(--text-muted)',
                        }}
                      >
                        {s.topicsAssessed}/{s.topicsTotal} topics
                      </span>
                    </div>
                    <MasteryBar value={s.estimatedMastery} color={s.color} />
                  </div>
                  <div style={{ textAlign: 'right', flexShrink: 0, minWidth: 80 }}>
                    <div
                      style={{
                        fontSize: 13,
                        fontFamily: 'var(--font-mono)',
                        fontWeight: 700,
                        color:
                          s.estimatedMastery === null
                            ? 'var(--text-muted)'
                            : s.estimatedMastery >= 70
                            ? 'var(--accent-success)'
                            : s.estimatedMastery >= 40
                            ? 'var(--accent-warning)'
                            : 'var(--accent-danger)',
                      }}
                    >
                      {s.estimatedMastery !== null
                        ? `${s.estimatedMastery}%`
                        : 'Not Assessed'}
                    </div>
                    {s.topicsWeak > 0 && (
                      <div
                        style={{
                          fontSize: 11,
                          color: 'var(--accent-danger)',
                        }}
                      >
                        {s.topicsWeak} weak
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* GATE Readiness Ring */}
          <div className="card" style={{ textAlign: 'center' }}>
            <div className="card-title" style={{ marginBottom: 16 }}>
              GATE READINESS
            </div>
            <div
              style={{
                display: 'flex',
                justifyContent: 'center',
                marginBottom: 12,
              }}
            >
              <CircleProgress
                value={gateReadiness}
                color="var(--accent-primary)"
                size={100}
              />
            </div>
            <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
              {gateReadiness !== null ? (
                <>
                  Target:{' '}
                  <strong style={{ color: 'var(--accent-primary)' }}>
                    {user.gateTarget}+
                  </strong>
                </>
              ) : (
                <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                  Calibrating with diagnostic questions
                </span>
              )}
            </div>
            <button
              className="btn btn-secondary btn-sm w-full"
              style={{ marginTop: 12 }}
              onClick={() => router.push('/gate')}
              id="view-gate-btn"
            >
              GATE Dashboard
            </button>
          </div>

          {/* Weekly Progress */}
          <div className="card">
            <div className="card-header">
              <span className="card-title">This Week</span>
              <span
                style={{
                  fontSize: 11,
                  color: 'var(--text-muted)',
                  fontFamily: 'var(--font-mono)',
                }}
              >
                {weeklyStats.daysStudied}/7 days
              </span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
                  Study time
                </span>
                <span
                  style={{
                    fontFamily: 'var(--font-mono)',
                    fontWeight: 700,
                  }}
                >
                  {Math.round(weeklyStats.totalMinutes / 60)}h
                </span>
              </div>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
                  Mastery gained
                </span>
                <span
                  style={{
                    fontFamily: 'var(--font-mono)',
                    fontWeight: 700,
                    color:
                      weeklyStats.masteryGained > 0
                        ? 'var(--accent-success)'
                        : 'var(--text-muted)',
                  }}
                >
                  {weeklyStats.masteryGained > 0
                    ? `+${weeklyStats.masteryGained}%`
                    : '0%'}
                </span>
              </div>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
                  Missed sessions
                </span>
                <span
                  style={{
                    fontFamily: 'var(--font-mono)',
                    fontWeight: 700,
                    color:
                      weeklyStats.missedSessions > 2
                        ? 'var(--accent-danger)'
                        : 'var(--text-primary)',
                  }}
                >
                  {weeklyStats.missedSessions}
                </span>
              </div>
            </div>
          </div>

          {/* Weak Areas */}
          <div className="card">
            <div className="card-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <AlertTriangle size={14} color="var(--accent-danger)" />
                <span className="card-title">Weak Areas</span>
              </div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {weakAreas.length === 0 && (
                <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>
                  No weak areas detected! Real data will appear as you attempt
                  quizzes.
                </p>
              )}
              {weakAreas.map(area => (
                <div
                  key={area.topicId}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                    padding: '8px 10px',
                    background: 'var(--bg-input)',
                    borderRadius: 8,
                  }}
                >
                  <span
                    style={{
                      fontSize: 16,
                      color:
                        area.mastery < 20
                          ? 'var(--accent-danger)'
                          : 'var(--accent-warning)',
                    }}
                  >
                    {area.mastery < 20 ? '🔴' : '🟠'}
                  </span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div
                      style={{ fontSize: 13, fontWeight: 600 }}
                      className="truncate"
                    >
                      {area.topicName}
                    </div>
                    <div
                      style={{ fontSize: 11, color: 'var(--text-muted)' }}
                    >
                      {area.subjectName}
                    </div>
                  </div>
                  <div
                    style={{
                      fontFamily: 'var(--font-mono)',
                      fontSize: 13,
                      fontWeight: 700,
                      color: 'var(--accent-danger)',
                    }}
                  >
                    {area.mastery}%
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Revision Due */}
          {revisionDue.length > 0 && (
            <div className="card">
              <div className="card-header">
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <RotateCcw size={14} color="var(--accent-secondary)" />
                  <span className="card-title">Revision Due</span>
                </div>
              </div>
              <div
                style={{ display: 'flex', flexDirection: 'column', gap: 6 }}
              >
                {revisionDue.map(r => (
                  <div
                    key={r.topicId}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '6px 10px',
                      background: 'var(--bg-input)',
                      borderRadius: 8,
                    }}
                  >
                    <div style={{ minWidth: 0 }}>
                      <div
                        style={{ fontSize: 13, fontWeight: 500 }}
                        className="truncate"
                      >
                        {r.topicName}
                      </div>
                      <div
                        style={{ fontSize: 11, color: 'var(--text-muted)' }}
                      >
                        {r.subjectName}
                      </div>
                    </div>
                    <span
                      style={{
                        fontSize: 11,
                        fontWeight: 700,
                        color:
                          r.daysOverdue > 3
                            ? 'var(--accent-danger)'
                            : 'var(--accent-warning)',
                        whiteSpace: 'nowrap',
                        marginLeft: 8,
                      }}
                    >
                      {r.daysOverdue > 0
                        ? `${r.daysOverdue}d overdue`
                        : 'Due today'}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
