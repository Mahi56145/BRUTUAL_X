'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import {
  Sparkles,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  Brain,
  Target,
  Flame,
  ShieldAlert,
  GraduationCap,
  Briefcase,
  ChevronRight,
  BookOpen,
  Zap,
} from 'lucide-react'

interface Topic {
  id: string
  name: string
  slug: string
  importance: number
  difficulty: number
  gateRelevance: number
  careerRelevance: number
}

interface Subject {
  id: string
  name: string
  slug: string
  icon: string
  color: string
  topics: Topic[]
}

const SELF_ASSESS_LABELS: Record<number, { title: string; desc: string; color: string }> = {
  0: { title: 'Never Studied', desc: 'Complete beginner / clean slate', color: 'var(--text-muted)' },
  1: { title: 'Familiar', desc: 'Heard concepts, need full study', color: '#ff6b81' },
  2: { title: 'Basic Concept', desc: 'Know theoretical principles', color: 'var(--accent-warning)' },
  3: { title: 'Can Solve Basics', desc: 'Can tackle standard questions', color: 'var(--accent-info)' },
  4: { title: 'Strong & Confident', desc: 'Good speed and conceptual depth', color: 'var(--accent-primary)' },
  5: { title: 'Exam Ready / Master', desc: 'Can solve hard GATE & interview problems', color: 'var(--accent-secondary)' },
}

const REALITY_CHECK_STYLES = [
  {
    id: 'savage',
    title: 'Savage Truth',
    tag: 'Recommended',
    desc: 'Unfiltered, blunt accountability in Hinglish/English. No sugarcoating.',
    icon: '⚡',
    badge: 'Hardcore',
  },
  {
    id: 'motivational',
    title: 'Disciplined & Driven',
    tag: 'Focused',
    desc: 'Stoic, high-agency quotes on consistency, compounding, and hard work.',
    icon: '🛡️',
    badge: 'Disciplined',
  },
  {
    id: 'funny',
    title: 'Witty / Roasts',
    tag: 'Humor',
    desc: 'Lighthearted sarcasm, relatable engineering pain, and meme-worthy reality checks.',
    icon: '🔥',
    badge: 'Fun',
  },
  {
    id: 'gentle',
    title: 'Supportive & Calm',
    tag: 'Gentle',
    desc: 'Empathetic pacing, burnout prevention, and constructive steady encouragement.',
    icon: '🌱',
    badge: 'Balanced',
  },
]

const CAREER_OPTIONS = [
  { id: 'Backend Engineer', label: 'Backend Engineer (Go/Java/Node/Distributed Systems)' },
  { id: 'Systems Engineer', label: 'Systems & Embedded (C/C++/Linux/OS/Networking)' },
  { id: 'ML / AI Engineer', label: 'Machine Learning & AI (PyTorch/Math/Data Systems)' },
  { id: 'Full Stack Engineer', label: 'Full Stack Developer (Web/APIs/Modern UI)' },
  { id: 'DevOps / SRE', label: 'SRE & Cloud Infrastructure (Kubernetes/Docker/AWS)' },
]

export default function OnboardingPage() {
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [userName, setUserName] = useState('Engineer')
  const [subjects, setSubjects] = useState<Subject[]>([])
  
  // Form State
  const [assessments, setAssessments] = useState<Record<string, number>>({})
  const [selectedSubjectIdx, setSelectedSubjectIdx] = useState(0)
  const [gateTarget, setGateTarget] = useState(700)
  const [selectedCareers, setSelectedCareers] = useState<string[]>(['Backend Engineer'])
  const [dailyHours, setDailyHours] = useState(3)
  const [realityStyle, setRealityStyle] = useState('savage')

  useEffect(() => {
    async function loadData() {
      try {
        const res = await fetch('/api/onboarding')
        if (res.status === 401) {
          router.push('/login')
          return
        }
        const data = await res.json()
        if (data.user) {
          setUserName(data.user.name || 'Engineer')
          if (data.user.onboardingDone) {
            router.push('/dashboard')
            return
          }
          if (data.user.gateTarget) setGateTarget(data.user.gateTarget)
          if (data.user.realityCheckStyle) setRealityStyle(data.user.realityCheckStyle)
          if (data.user.careerPaths) {
            try {
              const cp = JSON.parse(data.user.careerPaths)
              if (Array.isArray(cp) && cp.length > 0) setSelectedCareers(cp)
            } catch {}
          }
        }
        if (data.subjects) {
          setSubjects(data.subjects)
          // Default initial assessments to 0
          const initial: Record<string, number> = {}
          data.subjects.forEach((s: Subject) => {
            s.topics.forEach((t: Topic) => {
              initial[t.id] = 0
            })
          })
          setAssessments(initial)
        }
      } catch (err) {
        console.error('Failed to load onboarding data:', err)
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [router])

  const handleTopicScoreChange = (topicId: string, score: number) => {
    setAssessments(prev => ({ ...prev, [topicId]: score }))
  }

  const handleSetAllInSubject = (subject: Subject, score: number) => {
    setAssessments(prev => {
      const updated = { ...prev }
      subject.topics.forEach(t => {
        updated[t.id] = score
      })
      return updated
    })
  }

  const toggleCareer = (careerId: string) => {
    setSelectedCareers(prev =>
      prev.includes(careerId)
        ? prev.filter(c => c !== careerId)
        : [...prev, careerId]
    )
  }

  const handleSubmit = async () => {
    setSubmitting(true)
    try {
      const res = await fetch('/api/onboarding', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          assessments,
          gateTarget,
          careerPaths: selectedCareers,
          realityCheckStyle: realityStyle,
          dailyStudyHours: dailyHours,
        }),
      })

      if (res.ok) {
        router.push('/dashboard')
      } else {
        const errorData = await res.json()
        alert(errorData.error || 'Failed to save setup')
      }
    } catch (err) {
      console.error(err)
      alert('Network error submitting calibration')
    } finally {
      setSubmitting(false)
    }
  }

  const activeSubject = subjects[selectedSubjectIdx]
  const ratedCount = Object.values(assessments).filter(v => v > 0).length
  const totalTopics = subjects.reduce((acc, s) => acc + s.topics.length, 0)

  if (loading) {
    return (
      <div style={{
        display: 'flex',
        minHeight: '100vh',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'var(--bg-primary)',
        color: 'var(--text-secondary)',
      }}>
        <div style={{ textAlign: 'center' }}>
          <Sparkles className="animate-spin" size={36} color="var(--accent-primary)" style={{ margin: '0 auto 16px' }} />
          <p>Initializing your engineering workspace...</p>
        </div>
      </div>
    )
  }

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: 'var(--bg-primary)',
      color: 'var(--text-primary)',
      padding: '32px 20px',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
    }}>
      <div style={{
        width: '100%',
        maxWidth: '900px',
        backgroundColor: 'var(--bg-card)',
        border: '1px solid var(--border-strong)',
        borderRadius: 'var(--radius-lg)',
        boxShadow: 'var(--shadow-lg)',
        overflow: 'hidden',
      }}>
        {/* Top Header Progress Bar */}
        <div style={{
          padding: '24px 32px',
          borderBottom: '1px solid var(--border)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          backgroundColor: 'var(--bg-surface)',
        }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
              <span style={{ fontSize: '18px' }}>⚡</span>
              <span style={{ fontSize: '13px', letterSpacing: '0.08em', fontWeight: 700, color: 'var(--accent-secondary)', textTransform: 'uppercase' }}>
                Engineering OS System Initialization
              </span>
            </div>
            <h1 style={{ fontSize: '20px', fontWeight: 700 }}>
              {step === 1 && 'Welcome & System Truth'}
              {step === 2 && 'Calibrate Knowledge Baseline'}
              {step === 3 && 'Target Outcomes & Ambition'}
              {step === 4 && 'Reality Check Tone'}
              {step === 5 && 'Verify & Launch'}
            </h1>
          </div>

          {/* Stepper Dots */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {[1, 2, 3, 4, 5].map(s => (
              <div
                key={s}
                style={{
                  width: '28px',
                  height: '28px',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '12px',
                  fontWeight: 600,
                  backgroundColor: step === s ? 'var(--accent-primary)' : step > s ? 'var(--accent-secondary-dim)' : 'var(--bg-input)',
                  color: step === s ? '#ffffff' : step > s ? 'var(--accent-secondary)' : 'var(--text-muted)',
                  border: step === s ? '2px solid var(--accent-primary-glow)' : '1px solid var(--border)',
                  transition: 'all 0.2s ease',
                }}
              >
                {step > s ? '✓' : s}
              </div>
            ))}
          </div>
        </div>

        {/* Step Content */}
        <div style={{ padding: '36px 32px' }}>
          {/* STEP 1: WELCOME */}
          {step === 1 && (
            <div>
              <div style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '6px 14px',
                borderRadius: 'var(--radius-full)',
                backgroundColor: 'var(--accent-primary-dim)',
                color: 'var(--accent-primary)',
                fontSize: '13px',
                fontWeight: 600,
                marginBottom: '16px',
              }}>
                <Sparkles size={16} /> Welcome {userName}
              </div>
              
              <h2 style={{ fontSize: '28px', fontWeight: 800, marginBottom: '14px', lineHeight: 1.25 }}>
                A Real Adaptive Operating System for Computer Engineers
              </h2>

              <p style={{ color: 'var(--text-secondary)', fontSize: '15px', lineHeight: 1.6, marginBottom: '28px' }}>
                Engineering OS is built on a non-negotiable principle: <strong style={{ color: 'var(--text-primary)' }}>Zero Fake Data</strong>.
                Unlike typical dashboards with hardcoded 70% mastery and fake streaks, your metrics here are 100% computed from your actual test results, study completions, and spaced retention.
              </p>

              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
                gap: '16px',
                marginBottom: '32px',
              }}>
                <div style={{
                  padding: '18px',
                  borderRadius: 'var(--radius-md)',
                  backgroundColor: 'var(--bg-surface)',
                  border: '1px solid var(--border)',
                }}>
                  <div style={{ fontSize: '24px', marginBottom: '8px' }}>📊</div>
                  <h3 style={{ fontSize: '15px', fontWeight: 700, marginBottom: '6px' }}>Zero-Fabrication Policy</h3>
                  <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                    Unassessed topics stay labeled as <span style={{ color: 'var(--text-muted)' }}>Not Assessed</span> until you complete real sessions and quizzes.
                  </p>
                </div>

                <div style={{
                  padding: '18px',
                  borderRadius: 'var(--radius-md)',
                  backgroundColor: 'var(--bg-surface)',
                  border: '1px solid var(--border)',
                }}>
                  <div style={{ fontSize: '24px', marginBottom: '8px' }}>🧠</div>
                  <h3 style={{ fontSize: '15px', fontWeight: 700, marginBottom: '6px' }}>Adaptive Scheduling</h3>
                  <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                    Daily study blocks dynamically calculate based on subject priority, your GATE target, and forgetting curve retention.
                  </p>
                </div>

                <div style={{
                  padding: '18px',
                  borderRadius: 'var(--radius-md)',
                  backgroundColor: 'var(--bg-surface)',
                  border: '1px solid var(--border)',
                }}>
                  <div style={{ fontSize: '24px', marginBottom: '8px' }}>🔥</div>
                  <h3 style={{ fontSize: '15px', fontWeight: 700, marginBottom: '6px' }}>Honest Accountability</h3>
                  <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                    Reality check cards deliver blunt, context-aware analysis when you miss slots or lag behind schedule.
                  </p>
                </div>
              </div>

              <div style={{
                padding: '14px 18px',
                borderRadius: 'var(--radius-md)',
                backgroundColor: 'rgba(255, 140, 66, 0.08)',
                border: '1px solid rgba(255, 140, 66, 0.25)',
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                marginBottom: '32px',
              }}>
                <ShieldAlert size={20} color="var(--accent-warning)" />
                <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
                  In the next step, you will do a quick 0–5 self-rating on topics to seed initial schedule priorities.
                </span>
              </div>
            </div>
          )}

          {/* STEP 2: TOPIC SELF-ASSESSMENT */}
          {step === 2 && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
                <div>
                  <h2 style={{ fontSize: '22px', fontWeight: 700, marginBottom: '4px' }}>Initial Self-Assessment Calibration</h2>
                  <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
                    Rate your comfort with each topic from 0 (Never studied) to 5 (Exam ready).
                  </p>
                </div>
                <div style={{
                  backgroundColor: 'var(--bg-surface)',
                  padding: '6px 14px',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--border)',
                  fontSize: '13px',
                }}>
                  <span style={{ color: 'var(--accent-secondary)', fontWeight: 700 }}>{ratedCount}</span>
                  <span style={{ color: 'var(--text-secondary)' }}> of {totalTopics} topics rated &gt; 0</span>
                </div>
              </div>

              {/* Subject Tabs */}
              <div style={{
                display: 'flex',
                gap: '8px',
                overflowX: 'auto',
                paddingBottom: '12px',
                marginBottom: '20px',
                borderBottom: '1px solid var(--border)',
              }}>
                {subjects.map((sub, idx) => {
                  const isSelected = idx === selectedSubjectIdx
                  const subRated = sub.topics.filter(t => (assessments[t.id] || 0) > 0).length
                  return (
                    <button
                      key={sub.id}
                      onClick={() => setSelectedSubjectIdx(idx)}
                      style={{
                        padding: '8px 14px',
                        borderRadius: 'var(--radius-md)',
                        backgroundColor: isSelected ? 'var(--bg-card-hover)' : 'var(--bg-surface)',
                        border: isSelected ? `1px solid ${sub.color || 'var(--accent-primary)'}` : '1px solid var(--border)',
                        color: isSelected ? 'var(--text-primary)' : 'var(--text-secondary)',
                        fontSize: '13px',
                        fontWeight: isSelected ? 600 : 400,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      <span>{sub.icon}</span>
                      <span>{sub.name}</span>
                      <span style={{
                        fontSize: '11px',
                        padding: '1px 6px',
                        borderRadius: '10px',
                        backgroundColor: isSelected ? 'rgba(255,255,255,0.1)' : 'var(--bg-input)',
                        color: subRated > 0 ? 'var(--accent-secondary)' : 'var(--text-muted)',
                      }}>
                        {subRated}/{sub.topics.length}
                      </span>
                    </button>
                  )
                })}
              </div>

              {/* Active Subject Topics */}
              {activeSubject && (
                <div>
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: '16px',
                    padding: '10px 14px',
                    borderRadius: 'var(--radius-sm)',
                    backgroundColor: 'var(--bg-surface)',
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontSize: '20px' }}>{activeSubject.icon}</span>
                      <strong style={{ fontSize: '15px' }}>{activeSubject.name}</strong>
                      <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>({activeSubject.topics.length} topics)</span>
                    </div>

                    <div style={{ display: 'flex', gap: '6px' }}>
                      <button
                        onClick={() => handleSetAllInSubject(activeSubject, 0)}
                        style={{
                          fontSize: '11px',
                          padding: '4px 8px',
                          borderRadius: 'var(--radius-sm)',
                          border: '1px solid var(--border)',
                          backgroundColor: 'var(--bg-input)',
                          color: 'var(--text-secondary)',
                          cursor: 'pointer',
                        }}
                      >
                        All 0 (New)
                      </button>
                      <button
                        onClick={() => handleSetAllInSubject(activeSubject, 2)}
                        style={{
                          fontSize: '11px',
                          padding: '4px 8px',
                          borderRadius: 'var(--radius-sm)',
                          border: '1px solid var(--border)',
                          backgroundColor: 'var(--bg-input)',
                          color: 'var(--text-secondary)',
                          cursor: 'pointer',
                        }}
                      >
                        All 2 (Basic)
                      </button>
                    </div>
                  </div>

                  <div style={{
                    maxHeight: '380px',
                    overflowY: 'auto',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '10px',
                    paddingRight: '6px',
                  }}>
                    {activeSubject.topics.map(topic => {
                      const currentScore = assessments[topic.id] || 0
                      const labelInfo = SELF_ASSESS_LABELS[currentScore]
                      return (
                        <div
                          key={topic.id}
                          style={{
                            padding: '12px 16px',
                            borderRadius: 'var(--radius-md)',
                            backgroundColor: 'var(--bg-surface)',
                            border: '1px solid var(--border)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            gap: '16px',
                          }}
                        >
                          <div style={{ flex: 1, minWidth: '180px' }}>
                            <div style={{ fontWeight: 600, fontSize: '14px', marginBottom: '2px' }}>
                              {topic.name}
                            </div>
                            <div style={{ fontSize: '11px', color: labelInfo.color, fontWeight: 500 }}>
                              Level {currentScore}: {labelInfo.title}
                            </div>
                          </div>

                          {/* 0 to 5 score chips */}
                          <div style={{ display: 'flex', gap: '6px' }}>
                            {[0, 1, 2, 3, 4, 5].map(score => {
                              const isPicked = currentScore === score
                              return (
                                <button
                                  key={score}
                                  type="button"
                                  onClick={() => handleTopicScoreChange(topic.id, score)}
                                  style={{
                                    width: '34px',
                                    height: '34px',
                                    borderRadius: 'var(--radius-sm)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    fontSize: '13px',
                                    fontWeight: 700,
                                    backgroundColor: isPicked ? 'var(--accent-primary)' : 'var(--bg-input)',
                                    color: isPicked ? '#ffffff' : 'var(--text-secondary)',
                                    border: isPicked ? '1px solid var(--accent-primary-glow)' : '1px solid var(--border)',
                                    cursor: 'pointer',
                                    transition: 'all 0.15s ease',
                                  }}
                                  title={`${score} - ${SELF_ASSESS_LABELS[score].title}`}
                                >
                                  {score}
                                </button>
                              )
                            })}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* STEP 3: TARGET OUTCOMES */}
          {step === 3 && (
            <div>
              <h2 style={{ fontSize: '22px', fontWeight: 700, marginBottom: '6px' }}>Define Target Outcomes</h2>
              <p style={{ fontSize: '14px', color: 'var(--text-secondary)', marginBottom: '28px' }}>
                Engineering OS balances your daily schedule between GATE preparation and high-impact software engineering skills.
              </p>

              {/* GATE Target */}
              <div style={{
                padding: '20px',
                borderRadius: 'var(--radius-md)',
                backgroundColor: 'var(--bg-surface)',
                border: '1px solid var(--border)',
                marginBottom: '24px',
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 700, fontSize: '15px' }}>
                      <GraduationCap size={18} color="var(--accent-primary)" /> Target GATE Score
                    </div>
                    <p style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                      Used to determine subject weights and question difficulty in your schedule.
                    </p>
                  </div>
                  <span style={{
                    fontSize: '22px',
                    fontWeight: 800,
                    color: 'var(--accent-primary)',
                    fontFamily: 'var(--font-mono)',
                  }}>
                    {gateTarget} / 1000
                  </span>
                </div>

                <input
                  type="range"
                  min="400"
                  max="950"
                  step="25"
                  value={gateTarget}
                  onChange={e => setGateTarget(Number(e.target.value))}
                  style={{
                    width: '100%',
                    accentColor: 'var(--accent-primary)',
                    cursor: 'pointer',
                  }}
                />
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: 'var(--text-muted)', marginTop: '6px' }}>
                  <span>400 (Qualify)</span>
                  <span>650 (IIT / PSU Tier)</span>
                  <span>750+ (Top IISc/IITs)</span>
                </div>
              </div>

              {/* Career Paths */}
              <div style={{
                padding: '20px',
                borderRadius: 'var(--radius-md)',
                backgroundColor: 'var(--bg-surface)',
                border: '1px solid var(--border)',
                marginBottom: '24px',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 700, fontSize: '15px', marginBottom: '8px' }}>
                  <Briefcase size={18} color="var(--accent-secondary)" /> Target Engineering Roles
                </div>
                <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '14px' }}>
                  Select one or more paths. Topics relevant to these roles will be emphasized in DSA and Systems.
                </p>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {CAREER_OPTIONS.map(career => {
                    const isSelected = selectedCareers.includes(career.id)
                    return (
                      <button
                        key={career.id}
                        type="button"
                        onClick={() => toggleCareer(career.id)}
                        style={{
                          textAlign: 'left',
                          padding: '12px 16px',
                          borderRadius: 'var(--radius-sm)',
                          backgroundColor: isSelected ? 'var(--accent-secondary-dim)' : 'var(--bg-input)',
                          border: isSelected ? '1px solid var(--accent-secondary)' : '1px solid var(--border)',
                          color: isSelected ? 'var(--accent-secondary)' : 'var(--text-secondary)',
                          fontSize: '13px',
                          fontWeight: isSelected ? 600 : 400,
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          transition: 'all 0.15s ease',
                        }}
                      >
                        <span>{career.label}</span>
                        {isSelected && <CheckCircle2 size={16} />}
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Daily Study Target */}
              <div style={{
                padding: '20px',
                borderRadius: 'var(--radius-md)',
                backgroundColor: 'var(--bg-surface)',
                border: '1px solid var(--border)',
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 700, fontSize: '15px' }}>
                      <Target size={18} color="var(--accent-warning)" /> Daily Self-Study Hours
                    </div>
                    <p style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                      Excluding college/class hours. Used to plan daily study blocks.
                    </p>
                  </div>
                  <span style={{
                    fontSize: '22px',
                    fontWeight: 800,
                    color: 'var(--accent-warning)',
                    fontFamily: 'var(--font-mono)',
                  }}>
                    {dailyHours}h / day
                  </span>
                </div>

                <div style={{ display: 'flex', gap: '10px' }}>
                  {[2, 3, 4, 5, 6].map(hours => (
                    <button
                      key={hours}
                      type="button"
                      onClick={() => setDailyHours(hours)}
                      style={{
                        flex: 1,
                        padding: '10px',
                        borderRadius: 'var(--radius-sm)',
                        backgroundColor: dailyHours === hours ? 'var(--accent-warning-dim)' : 'var(--bg-input)',
                        border: dailyHours === hours ? '1px solid var(--accent-warning)' : '1px solid var(--border)',
                        color: dailyHours === hours ? 'var(--accent-warning)' : 'var(--text-secondary)',
                        fontSize: '14px',
                        fontWeight: 700,
                        cursor: 'pointer',
                      }}
                    >
                      {hours}h
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* STEP 4: REALITY CHECK PERSONA */}
          {step === 4 && (
            <div>
              <h2 style={{ fontSize: '22px', fontWeight: 700, marginBottom: '6px' }}>Select Reality Check Tone</h2>
              <p style={{ fontSize: '14px', color: 'var(--text-secondary)', marginBottom: '24px' }}>
                When you lag behind or skip blocks, the system confronts you. Choose how you want to be kept accountable.
              </p>

              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
                gap: '16px',
              }}>
                {REALITY_CHECK_STYLES.map(persona => {
                  const isSelected = realityStyle === persona.id
                  return (
                    <div
                      key={persona.id}
                      onClick={() => setRealityStyle(persona.id)}
                      style={{
                        padding: '20px',
                        borderRadius: 'var(--radius-md)',
                        backgroundColor: isSelected ? 'var(--bg-card-hover)' : 'var(--bg-surface)',
                        border: isSelected ? '2px solid var(--accent-primary)' : '1px solid var(--border)',
                        cursor: 'pointer',
                        transition: 'all 0.15s ease',
                        position: 'relative',
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                        <span style={{ fontSize: '28px' }}>{persona.icon}</span>
                        <span style={{
                          fontSize: '11px',
                          fontWeight: 700,
                          padding: '2px 8px',
                          borderRadius: 'var(--radius-full)',
                          backgroundColor: isSelected ? 'var(--accent-primary)' : 'var(--bg-input)',
                          color: isSelected ? '#ffffff' : 'var(--text-muted)',
                        }}>
                          {persona.badge}
                        </span>
                      </div>
                      <h3 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '6px' }}>{persona.title}</h3>
                      <p style={{ fontSize: '12px', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                        {persona.desc}
                      </p>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* STEP 5: VERIFY & LAUNCH */}
          {step === 5 && (
            <div>
              <div style={{ textAlign: 'center', marginBottom: '28px' }}>
                <div style={{
                  width: '64px',
                  height: '64px',
                  borderRadius: '50%',
                  backgroundColor: 'var(--accent-success-dim)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 16px',
                  color: 'var(--accent-success)',
                }}>
                  <CheckCircle2 size={36} />
                </div>
                <h2 style={{ fontSize: '24px', fontWeight: 800, marginBottom: '8px' }}>
                  Calibration Complete
                </h2>
                <p style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>
                  Here is your baseline setup before entering your adaptive dashboard.
                </p>
              </div>

              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                gap: '14px',
                marginBottom: '28px',
              }}>
                <div style={{
                  padding: '16px',
                  borderRadius: 'var(--radius-md)',
                  backgroundColor: 'var(--bg-surface)',
                  border: '1px solid var(--border)',
                }}>
                  <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '4px' }}>Topics Rated &gt; 0</div>
                  <div style={{ fontSize: '20px', fontWeight: 800, color: 'var(--accent-primary)' }}>
                    {ratedCount} <span style={{ fontSize: '13px', fontWeight: 400, color: 'var(--text-muted)' }}>/ {totalTopics}</span>
                  </div>
                </div>

                <div style={{
                  padding: '16px',
                  borderRadius: 'var(--radius-md)',
                  backgroundColor: 'var(--bg-surface)',
                  border: '1px solid var(--border)',
                }}>
                  <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '4px' }}>Target GATE Score</div>
                  <div style={{ fontSize: '20px', fontWeight: 800, color: 'var(--accent-warning)' }}>
                    {gateTarget}
                  </div>
                </div>

                <div style={{
                  padding: '16px',
                  borderRadius: 'var(--radius-md)',
                  backgroundColor: 'var(--bg-surface)',
                  border: '1px solid var(--border)',
                }}>
                  <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '4px' }}>Daily Study Hours</div>
                  <div style={{ fontSize: '20px', fontWeight: 800, color: 'var(--accent-secondary)' }}>
                    {dailyHours}h
                  </div>
                </div>

                <div style={{
                  padding: '16px',
                  borderRadius: 'var(--radius-md)',
                  backgroundColor: 'var(--bg-surface)',
                  border: '1px solid var(--border)',
                }}>
                  <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '4px' }}>Reality Check Style</div>
                  <div style={{ fontSize: '16px', fontWeight: 700, textTransform: 'capitalize' }}>
                    {realityStyle}
                  </div>
                </div>
              </div>

              {/* Achievement Badge Preview */}
              <div style={{
                padding: '16px 20px',
                borderRadius: 'var(--radius-md)',
                backgroundColor: 'rgba(108, 99, 255, 0.1)',
                border: '1px solid rgba(108, 99, 255, 0.3)',
                display: 'flex',
                alignItems: 'center',
                gap: '14px',
              }}>
                <div style={{ fontSize: '32px' }}>🔍</div>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <strong style={{ fontSize: '14px' }}>Achievement Unlocked: Self Aware</strong>
                    <span style={{
                      fontSize: '11px',
                      padding: '2px 6px',
                      borderRadius: '4px',
                      backgroundColor: 'var(--accent-primary)',
                      color: '#ffffff',
                      fontWeight: 700,
                    }}>
                      +75 XP
                    </span>
                  </div>
                  <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '2px' }}>
                    You completed the initial calibration. Real mastery numbers will now accumulate honestly.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer Navigation */}
        <div style={{
          padding: '20px 32px',
          borderTop: '1px solid var(--border)',
          backgroundColor: 'var(--bg-surface)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}>
          {step > 1 ? (
            <button
              type="button"
              onClick={() => setStep(s => s - 1)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '10px 18px',
                borderRadius: 'var(--radius-sm)',
                border: '1px solid var(--border)',
                backgroundColor: 'var(--bg-card)',
                color: 'var(--text-secondary)',
                fontSize: '13px',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              <ArrowLeft size={16} /> Back
            </button>
          ) : <div />}

          {step < 5 ? (
            <button
              type="button"
              onClick={() => setStep(s => s + 1)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '10px 22px',
                borderRadius: 'var(--radius-sm)',
                backgroundColor: 'var(--accent-primary)',
                color: '#ffffff',
                border: 'none',
                fontSize: '13px',
                fontWeight: 600,
                cursor: 'pointer',
                boxShadow: '0 2px 10px var(--accent-primary-glow)',
              }}
            >
              Continue <ArrowRight size={16} />
            </button>
          ) : (
            <button
              type="button"
              onClick={handleSubmit}
              disabled={submitting}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '12px 28px',
                borderRadius: 'var(--radius-sm)',
                backgroundColor: 'var(--accent-success)',
                color: '#ffffff',
                border: 'none',
                fontSize: '14px',
                fontWeight: 700,
                cursor: submitting ? 'not-allowed' : 'pointer',
                boxShadow: '0 2px 14px rgba(46, 213, 115, 0.4)',
                opacity: submitting ? 0.7 : 1,
              }}
            >
              {submitting ? 'Launching...' : 'Enter Engineering OS'} <Zap size={18} />
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
