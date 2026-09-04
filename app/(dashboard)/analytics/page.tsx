import { auth } from '@/auth'
import { prisma } from '@/lib/db'

export default async function AnalyticsPage() {
  const session = await auth()
  if (!session?.user?.id) return null
  const userId = session.user.id

  const now = new Date()
  const thirtyDaysAgo = new Date(now)
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

  const sessions = await prisma.studySession.findMany({
    where: { userId, date: { gte: thirtyDaysAgo } },
    include: { items: true },
    orderBy: { date: 'asc' },
  })

  // Daily study hours for last 30 days
  const dailyData: Record<string, { minutes: number; accuracy: number }> = {}
  for (let i = 0; i < 30; i++) {
    const d = new Date(now)
    d.setDate(d.getDate() - (29 - i))
    const key = d.toDateString()
    dailyData[key] = { minutes: 0, accuracy: 0 }
  }

  for (const s of sessions) {
    const key = new Date(s.date).toDateString()
    if (dailyData[key] !== undefined) {
      dailyData[key].minutes += s.totalMinutes
      const attempted = s.items.reduce((sum, i) => sum + i.questionsAttempted, 0)
      const correct = s.items.reduce((sum, i) => sum + i.questionsCorrect, 0)
      dailyData[key].accuracy = attempted > 0 ? Math.round((correct / attempted) * 100) : 0
    }
  }

  const dailyArr = Object.values(dailyData)
  const totalMinutes = dailyArr.reduce((s, d) => s + d.minutes, 0)
  const activeDays = dailyArr.filter(d => d.minutes > 0).length
  const avgDailyMinutes = activeDays > 0 ? Math.round(totalMinutes / activeDays) : 0

  // Subject trends
  const masteries = await prisma.topicMastery.findMany({
    where: { userId },
    include: {
      topic: { include: { subject: true } },
      history: { orderBy: { recordedAt: 'asc' }, take: 5 },
    },
  })

  const subjects = await prisma.subject.findMany({ orderBy: { order: 'asc' } })
  const subjectTrends = subjects.map(s => {
    const sTopics = masteries.filter(m => m.topic.subjectId === s.id && m.mastery !== null)
    const avg = sTopics.length > 0
      ? Math.round(sTopics.reduce((sum, m) => sum + (m.mastery ?? 0), 0) / sTopics.length)
      : 0

    // Compute gain from history
    let totalGain = 0
    for (const m of sTopics) {
      if (m.history.length >= 2) {
        totalGain += m.history[m.history.length - 1].masteryValue - m.history[0].masteryValue
      }
    }
    const avgGain = sTopics.length > 0 ? Math.round(totalGain / sTopics.length * 10) / 10 : 0

    return { name: s.name, icon: s.icon, color: s.color, mastery: avg, gain: avgGain }
  })

  const maxMinutes = Math.max(...dailyArr.map(d => d.minutes), 60)

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <h1 className="page-title">📊 Analytics</h1>
        <p className="page-subtitle">30-day performance overview</p>
      </div>

      {/* Summary stats */}
      <div className="grid-4" style={{ marginBottom: 24 }}>
        <div className="stat-card">
          <div className="stat-label">Total Study (30d)</div>
          <div className="stat-value">{Math.round(totalMinutes / 60)}h</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Active Days</div>
          <div className="stat-value" style={{ color: 'var(--accent-success)' }}>{activeDays}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Daily Average</div>
          <div className="stat-value" style={{ color: 'var(--accent-primary)' }}>
            {Math.floor(avgDailyMinutes / 60)}h {avgDailyMinutes % 60}m
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Sessions</div>
          <div className="stat-value" style={{ color: 'var(--accent-warning)' }}>{sessions.length}</div>
        </div>
      </div>

      {/* 30-day heatmap chart */}
      <div className="card" style={{ marginBottom: 20 }}>
        <div className="card-header"><span className="card-title">Daily Study Time — Last 30 Days</span></div>
        <div style={{ display: 'flex', alignItems: 'flex-end', gap: 4, height: 80 }}>
          {dailyArr.map((d, i) => (
            <div
              key={i}
              title={`${Math.floor(d.minutes / 60)}h ${d.minutes % 60}m`}
              style={{
                flex: 1, borderRadius: '3px 3px 0 0',
                height: d.minutes > 0 ? `${Math.max(6, (d.minutes / maxMinutes) * 80)}px` : '4px',
                background: d.minutes > 0
                  ? `linear-gradient(to top, var(--accent-primary), var(--accent-secondary))`
                  : 'var(--bg-input)',
                cursor: 'pointer',
                transition: 'height 0.5s ease',
              }}
            />
          ))}
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6, fontSize: 11, color: 'var(--text-muted)' }}>
          <span>30 days ago</span>
          <span>Today</span>
        </div>
      </div>

      {/* Subject mastery progression */}
      <div className="card">
        <div className="card-header"><span className="card-title">Subject Mastery & Progress</span></div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {subjectTrends.map(s => (
            <div key={s.name} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <span style={{ fontSize: 20, width: 28, flexShrink: 0 }}>{s.icon}</span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                  <span style={{ fontSize: 14, fontWeight: 600 }}>{s.name}</span>
                  <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                    {s.gain !== 0 && (
                      <span style={{ fontSize: 12, fontWeight: 700, color: s.gain > 0 ? 'var(--accent-success)' : 'var(--accent-danger)' }}>
                        {s.gain > 0 ? '+' : ''}{s.gain}%
                      </span>
                    )}
                    <span style={{
                      fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: 14,
                      color: s.mastery >= 70 ? 'var(--accent-success)' :
                        s.mastery >= 40 ? 'var(--accent-warning)' : 'var(--accent-danger)',
                    }}>
                      {s.mastery}%
                    </span>
                  </div>
                </div>
                <div style={{ height: 6, background: 'var(--bg-input)', borderRadius: 99, overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${s.mastery}%`, background: s.color, borderRadius: 99 }} />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
