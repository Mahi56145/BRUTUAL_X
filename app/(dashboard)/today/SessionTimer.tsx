'use client'

import { useState, useEffect, useRef } from 'react'
import {
  Play,
  Pause,
  CheckCircle2,
  X,
  Volume2,
  VolumeX,
  RotateCcw,
  Sparkles,
  Zap,
} from 'lucide-react'

interface SessionTimerProps {
  topicName: string
  subjectName: string
  subjectColor?: string
  plannedMinutes: number
  onClose: () => void
  onComplete: (elapsedMinutes: number) => void
}

export default function SessionTimer({
  topicName,
  subjectName,
  subjectColor = '#6c63ff',
  plannedMinutes = 50,
  onClose,
  onComplete,
}: SessionTimerProps) {
  const totalSeconds = plannedMinutes * 60
  const [secondsRemaining, setSecondsRemaining] = useState(totalSeconds)
  const [isRunning, setIsRunning] = useState(true)
  const [elapsedSeconds, setElapsedSeconds] = useState(0)
  const timerRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    if (isRunning) {
      timerRef.current = setInterval(() => {
        setSecondsRemaining(prev => {
          if (prev <= 1) {
            clearInterval(timerRef.current!)
            setIsRunning(false)
            return 0
          }
          return prev - 1
        })
        setElapsedSeconds(prev => prev + 1)
      }, 1000)
    } else if (timerRef.current) {
      clearInterval(timerRef.current)
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [isRunning])

  const formatTime = (secs: number) => {
    const mins = Math.floor(secs / 60)
    const remSecs = secs % 60
    return `${String(mins).padStart(2, '0')}:${String(remSecs).padStart(2, '0')}`
  }

  const progressPct = ((totalSeconds - secondsRemaining) / totalSeconds) * 100
  const elapsedMinutes = Math.max(1, Math.round(elapsedSeconds / 60))

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        backgroundColor: 'rgba(8, 8, 15, 0.95)',
        backdropFilter: 'blur(16px)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        color: 'var(--text-primary)',
        animation: 'fadeIn 0.25s ease-out',
      }}
    >
      {/* Top Exit Bar */}
      <div
        style={{
          position: 'absolute',
          top: 24,
          left: 32,
          right: 32,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span
            style={{
              display: 'inline-block',
              width: 10,
              height: 10,
              borderRadius: '50%',
              backgroundColor: isRunning ? 'var(--accent-success)' : 'var(--accent-warning)',
              boxShadow: isRunning ? '0 0 10px var(--accent-success)' : 'none',
            }}
          />
          <span
            style={{
              fontSize: 13,
              fontWeight: 600,
              letterSpacing: '0.06em',
              textTransform: 'uppercase',
              color: 'var(--text-secondary)',
            }}
          >
            {isRunning ? 'Deep Work Session in Progress' : 'Session Paused'}
          </span>
        </div>

        <button
          onClick={onClose}
          style={{
            background: 'var(--bg-card)',
            border: '1px solid var(--border)',
            color: 'var(--text-secondary)',
            padding: '8px 14px',
            borderRadius: 'var(--radius-sm)',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            fontSize: 13,
          }}
        >
          <X size={16} /> Exit Focus Mode
        </button>
      </div>

      {/* Main Focus Dial */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          textAlign: 'center',
          maxWidth: 600,
          padding: '0 20px',
        }}
      >
        {/* Subject & Topic Badges */}
        <div
          style={{
            display: 'inline-block',
            padding: '6px 16px',
            borderRadius: 'var(--radius-full)',
            backgroundColor: `${subjectColor}1a`,
            color: subjectColor,
            border: `1px solid ${subjectColor}40`,
            fontSize: 13,
            fontWeight: 700,
            marginBottom: 12,
          }}
        >
          {subjectName}
        </div>

        <h1
          style={{
            fontSize: '36px',
            fontWeight: 800,
            marginBottom: 36,
            lineHeight: 1.2,
          }}
        >
          {topicName}
        </h1>

        {/* Circular Dial & Large Digits */}
        <div
          style={{
            position: 'relative',
            width: 280,
            height: 280,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: 40,
          }}
        >
          <svg
            width="280"
            height="280"
            viewBox="0 0 280 280"
            style={{ transform: 'rotate(-90deg)', position: 'absolute' }}
          >
            <circle
              cx="140"
              cy="140"
              r="120"
              stroke="var(--bg-input)"
              strokeWidth="10"
              fill="none"
            />
            <circle
              cx="140"
              cy="140"
              r="120"
              stroke={subjectColor}
              strokeWidth="10"
              fill="none"
              strokeDasharray={2 * Math.PI * 120}
              strokeDashoffset={2 * Math.PI * 120 * (1 - progressPct / 100)}
              strokeLinecap="round"
              style={{ transition: 'stroke-dashoffset 0.8s ease' }}
            />
          </svg>

          <div style={{ textAlign: 'center', zIndex: 1 }}>
            <div
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: '56px',
                fontWeight: 900,
                letterSpacing: '-0.02em',
                color: 'var(--text-primary)',
              }}
            >
              {formatTime(secondsRemaining)}
            </div>
            <div
              style={{
                fontSize: '13px',
                color: 'var(--text-muted)',
                marginTop: '4px',
              }}
            >
              {elapsedMinutes}m elapsed / {plannedMinutes}m target
            </div>
          </div>
        </div>

        {/* Controls */}
        <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
          <button
            onClick={() => setIsRunning(!isRunning)}
            style={{
              padding: '14px 28px',
              borderRadius: 'var(--radius-md)',
              backgroundColor: isRunning ? 'var(--bg-card)' : 'var(--accent-primary)',
              color: isRunning ? 'var(--text-primary)' : '#ffffff',
              border: '1px solid var(--border-strong)',
              fontSize: '15px',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              minWidth: 140,
              justifyContent: 'center',
              transition: 'all 0.15s ease',
            }}
          >
            {isRunning ? (
              <>
                <Pause size={18} /> Pause
              </>
            ) : (
              <>
                <Play size={18} /> Resume
              </>
            )}
          </button>

          <button
            onClick={() => onComplete(elapsedMinutes)}
            style={{
              padding: '14px 32px',
              borderRadius: 'var(--radius-md)',
              backgroundColor: 'var(--accent-success)',
              color: '#ffffff',
              border: 'none',
              fontSize: '15px',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              boxShadow: '0 4px 16px rgba(46, 213, 115, 0.4)',
              transition: 'all 0.15s ease',
            }}
          >
            <CheckCircle2 size={18} /> Complete Session
          </button>
        </div>
      </div>
    </div>
  )
}
