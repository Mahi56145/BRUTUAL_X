import { auth } from '@/auth'
import { prisma } from '@/lib/db'
import { GATE_WEIGHTS } from '@/lib/scheduler/progress-analyzer'

export default async function GatePage() {
  const session = await auth()
  if (!session?.user?.id) return null

  const userId = session.user.id
  const user = await prisma.user.findUnique({ where: { id: userId } })

  const subjects = await prisma.subject.findMany({ orderBy: { order: 'asc' } })
  const masteries = await prisma.topicMastery.findMany({
    where: { userId },
    include: { topic: { include: { subject: true } } },
  })

  const gatePYQs = await prisma.question.findMany({
    where: { isGatePYQ: true },
    include: {
      topic: { include: { subject: true } },
      attempts: { where: { userId } },
    },
  })

  const subjectData = subjects.map(subject => {
    const sTopics = masteries.filter(m => m.topic.subjectId === subject.id && m.topic.gateRelevance >= 3 && m.mastery !== null)
    const avg = sTopics.length > 0
      ? sTopics.reduce((s, m) => s + (m.mastery ?? 0) * (m.topic.gateRelevance / 5), 0) / sTopics.length
      : 0
    const weak = sTopics.filter(m => (m.mastery ?? 0) < 40)
    const gateWeight = GATE_WEIGHTS[subject.name] ?? 0.05

    return {
      name: subject.name, slug: subject.slug, icon: subject.icon, color: subject.color,
      gateWeight, avgMastery: Math.round(avg),
      totalTopics: sTopics.length, weakTopics: weak.length,
      weightedScore: Math.round(avg * gateWeight * 100) / 100,
    }
  })

  const overallReadiness = Math.round(
    subjectData.reduce((s, d) => s + d.avgMastery * d.gateWeight, 0) /
    subjectData.reduce((s, d) => s + d.gateWeight, 0)
  )

  const pyqStats = {
    total: gatePYQs.length,
    attempted: gatePYQs.filter(q => q.attempts.length > 0).length,
    correct: gatePYQs.flatMap(q => q.attempts).filter(a => a.isCorrect).length,
    accuracy: gatePYQs.flatMap(q => q.attempts).length > 0
      ? Math.round((gatePYQs.flatMap(q => q.attempts).filter(a => a.isCorrect).length / gatePYQs.flatMap(q => q.attempts).length) * 100)
      : 0,
  }

  const weakGateTopics = masteries
    .filter(m => m.topic.gateRelevance >= 4 && m.mastery !== null && (m.mastery ?? 0) < 50)
    .sort((a, b) => (a.mastery ?? 0) - (b.mastery ?? 0))
    .slice(0, 8)

  return (
    <div className="animate-fade-in">
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1 className="page-title">🎯 GATE Dashboard</h1>
          <p className="page-subtitle">Target: {user?.gateTarget ?? 650}+ · Estimated readiness below</p>
        </div>
        <div style={{
          textAlign: 'center', background: 'var(--bg-card)', border: '1px solid var(--border)',
          borderRadius: 16, padding: '16px 24px',
        }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', letterSpacing: '0.8px', marginBottom: 4 }}>
            GATE READINESS
          </div>
          <div style={{
            fontSize: 48, fontWeight: 900, fontFamily: 'var(--font-mono)',
            color: overallReadiness >= 70 ? 'var(--accent-success)' :
              overallReadiness >= 45 ? 'var(--accent-warning)' : 'var(--accent-danger)',
          }}>
            {overallReadiness}%
          </div>
        </div>
      </div>

      {/* PYQ stats */}
      <div className="grid-4" style={{ marginBottom: 24 }}>
        <div className="stat-card">
          <div className="stat-label">PYQs Available</div>
          <div className="stat-value">{pyqStats.total}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">PYQs Attempted</div>
          <div className="stat-value" style={{ color: 'var(--accent-primary)' }}>{pyqStats.attempted}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Correct</div>
          <div className="stat-value" style={{ color: 'var(--accent-success)' }}>{pyqStats.correct}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">PYQ Accuracy</div>
          <div className="stat-value" style={{ color: 'var(--accent-warning)' }}>{pyqStats.accuracy}%</div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: 20 }}>
        {/* Subject-wise table */}
        <div className="card">
          <div className="card-header"><span className="card-title">Subject Readiness</span></div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {subjectData
              .filter(s => s.gateWeight > 0.03)
              .sort((a, b) => b.avgMastery - a.avgMastery)
              .map(s => (
              <div key={s.slug} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <span style={{ fontSize: 20, width: 28, flexShrink: 0 }}>{s.icon}</span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                    <span style={{ fontSize: 14, fontWeight: 600 }}>{s.name}</span>
                    <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                      <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                        Weight: {Math.round(s.gateWeight * 100)}%
                      </span>
                      <span style={{
                        fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: 14,
                        color: s.avgMastery >= 70 ? 'var(--accent-success)' :
                          s.avgMastery >= 40 ? 'var(--accent-warning)' : 'var(--accent-danger)',
                      }}>
                        {s.avgMastery}%
                      </span>
                    </div>
                  </div>
                  <div style={{ height: 6, background: 'var(--bg-input)', borderRadius: 99, overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${s.avgMastery}%`, background: s.color, borderRadius: 99 }} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Weak GATE topics */}
        <div className="card">
          <div className="card-header">
            <span className="card-title">Critical Weak Areas</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {weakGateTopics.length === 0 && (
              <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>No critical weak areas! 🎉</p>
            )}
            {weakGateTopics.map(m => (
              <div key={m.id} style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '8px 10px', background: 'var(--bg-input)', borderRadius: 8,
              }}>
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 600 }} className="truncate">{m.topic.name}</div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{m.topic.subject.name}</div>
                </div>
                <div style={{ flexShrink: 0, marginLeft: 8 }}>
                  <span style={{
                    fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: 13,
                    color: (m.mastery ?? 0) < 20 ? 'var(--accent-danger)' : 'var(--accent-warning)',
                  }}>
                    {Math.round(m.mastery ?? 0)}%
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
