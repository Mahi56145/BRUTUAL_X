import { auth } from '@/auth'
import { prisma } from '@/lib/db'

export default async function SharedPage() {
  const session = await auth()
  if (!session?.user?.id) return null

  const userId = session.user.id
  const now = new Date()
  const sevenDaysAgo = new Date(now)
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)

  const users = await prisma.user.findMany()

  const analyticsData = await Promise.all(users.map(async (user) => {
    const sessions = await prisma.studySession.findMany({
      where: { userId: user.id, date: { gte: sevenDaysAgo } },
      include: { items: true },
    })

    const masteries = await prisma.topicMastery.findMany({
      where: { userId: user.id },
      include: { topic: { include: { subject: true } } },
    })

    const todayStr = now.toDateString()
    const todayMinutes = sessions
      .filter(s => new Date(s.date).toDateString() === todayStr)
      .reduce((s, sess) => s + sess.totalMinutes, 0)

    const todaySchedule = await prisma.dailySchedule.findUnique({
      where: { userId_date: { userId: user.id, date: new Date(todayStr) } },
      include: { blocks: { orderBy: { order: 'asc' } } },
    })

    const todayTasks = todaySchedule?.blocks.filter(b => b.blockType === 'study') ?? []
    const completedTasks = todayTasks.filter(b => b.status === 'completed')

    const totalAttempted = sessions.flatMap(s => s.items).reduce((s, i) => s + i.questionsAttempted, 0)
    const totalCorrect = sessions.flatMap(s => s.items).reduce((s, i) => s + i.questionsCorrect, 0)
    const accuracy = totalAttempted > 0 ? Math.round((totalCorrect / totalAttempted) * 100) : 0

    const gateTopics = masteries.filter(m => m.topic.gateRelevance >= 4 && m.mastery !== null)
    const gateReadiness = gateTopics.length > 0
      ? Math.round(gateTopics.reduce((s, m) => s + (m.mastery ?? 0), 0) / gateTopics.length)
      : 0

    const coreTopics = masteries.filter(m => ['os', 'dbms', 'cn', 'coa', 'toc', 'compiler'].includes(m.topic.subject.slug) && m.mastery !== null)
    const coreReadiness = coreTopics.length > 0
      ? Math.round(coreTopics.reduce((s, m) => s + (m.mastery ?? 0), 0) / coreTopics.length)
      : 0

    const mlTopics = masteries.filter(m => m.topic.subject.slug === 'ml' && m.mastery !== null)
    const mlReadiness = mlTopics.length > 0
      ? Math.round(mlTopics.reduce((s, m) => s + (m.mastery ?? 0), 0) / mlTopics.length)
      : 0

    const weakAreas = masteries
      .filter(m => m.mastery !== null && (m.mastery ?? 0) > 0 && (m.mastery ?? 0) < 40)
      .sort((a, b) => (a.mastery ?? 0) - (b.mastery ?? 0))
      .slice(0, 4)
      .map(m => ({ name: m.topic.name, mastery: Math.round(m.mastery ?? 0) }))

    // Biggest improvement: compare history
    const masteryWithHistory = await prisma.topicMastery.findMany({
      where: { userId: user.id },
      include: {
        history: { orderBy: { recordedAt: 'asc' }, take: 6 },
        topic: { include: { subject: true } },
      },
    })

    let biggestImprovement = { topic: '', gain: 0, subject: '' }
    for (const m of masteryWithHistory) {
      if (m.history.length >= 2) {
        const gain = m.history[m.history.length - 1].masteryValue - m.history[0].masteryValue
        if (gain > biggestImprovement.gain) {
          biggestImprovement = { topic: m.topic.name, gain: Math.round(gain), subject: m.topic.subject.name }
        }
      }
    }

    return {
      userId: user.id, userName: user.name,
      avatarInitials: user.name === 'Shivraj' ? 'SJ' : 'MP',
      accentColor: user.accentColor, isCurrentUser: user.id === userId,
      todayMinutes, tasksTotal: todayTasks.length, tasksCompleted: completedTasks.length,
      accuracy, gateReadiness, coreReadiness, mlReadiness, weakAreas, biggestImprovement,
      weeklyMinutes: sessions.reduce((s, sess) => s + sess.totalMinutes, 0),
    }
  }))

  const messages = await prisma.sharedMessage.findMany({
    include: { sender: { select: { name: true, avatarInitials: true, accentColor: true } } },
    orderBy: { createdAt: 'desc' },
    take: 10,
  })

  const [userA, userB] = analyticsData

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <h1 className="page-title">🤝 Shared Progress</h1>
        <p className="page-subtitle">Side-by-side view — same goals, different paths</p>
      </div>

      {/* Side-by-side comparison */}
      <div className="grid-2" style={{ marginBottom: 24 }}>
        {[userA, userB].map(u => u && (
          <div key={u.userId} className="card" style={{
            borderColor: u.isCurrentUser ? u.accentColor + '40' : 'var(--border)',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
              <div style={{
                width: 52, height: 52, borderRadius: '50%',
                background: `linear-gradient(135deg, ${u.accentColor}88, ${u.accentColor})`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 18, fontWeight: 800, color: 'white',
              }}>
                {u.avatarInitials}
              </div>
              <div>
                <div style={{ fontSize: 18, fontWeight: 800 }}>{u.userName}</div>
                {u.isCurrentUser && <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>● You</div>}
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {[
                { label: 'Today', value: `${Math.floor(u.todayMinutes / 60)}h ${u.todayMinutes % 60}m`, sub: `${u.tasksCompleted}/${u.tasksTotal} tasks` },
                { label: 'This week', value: `${Math.round(u.weeklyMinutes / 60)}h`, sub: 'total study' },
                { label: 'Accuracy', value: `${u.accuracy}%`, sub: '7-day average' },
                { label: 'GATE', value: `${u.gateReadiness}%`, sub: 'readiness' },
                { label: 'Core CS', value: `${u.coreReadiness}%`, sub: 'mastery' },
                { label: 'ML', value: `${u.mlReadiness}%`, sub: 'mastery' },
              ].map(stat => (
                <div key={stat.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{stat.label}</div>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{stat.sub}</div>
                  </div>
                  <div style={{
                    fontSize: 20, fontWeight: 800, fontFamily: 'var(--font-mono)',
                    color: u.accentColor,
                  }}>
                    {stat.value}
                  </div>
                </div>
              ))}
            </div>

            <div style={{ marginTop: 16, paddingTop: 16, borderTop: '1px solid var(--border)' }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', marginBottom: 8 }}>
                WEAK AREAS
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                {u.weakAreas.map((area: any, i: number) => (
                  <div key={i} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
                    <span style={{ color: 'var(--text-secondary)' }}>
                      {area.mastery < 20 ? '🔴' : '🟠'} {area.name}
                    </span>
                    <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--accent-danger)', fontWeight: 700 }}>
                      {area.mastery}%
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {u.biggestImprovement.gain > 0 && (
              <div style={{
                marginTop: 12, padding: '10px 12px',
                background: 'var(--accent-success-dim)', borderRadius: 8,
              }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--accent-success)', marginBottom: 2 }}>
                  🚀 BIGGEST IMPROVEMENT
                </div>
                <div style={{ fontSize: 13 }}>
                  {u.biggestImprovement.topic}{' '}
                  <strong style={{ color: 'var(--accent-success)' }}>+{u.biggestImprovement.gain}%</strong>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Messages */}
      <div className="card">
        <div className="card-header">
          <span className="card-title">💬 Messages</span>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {messages.map(msg => (
            <div key={msg.id} style={{
              display: 'flex', gap: 10, padding: '10px 12px',
              background: 'var(--bg-input)', borderRadius: 10,
            }}>
              <div style={{
                width: 32, height: 32, borderRadius: '50%', flexShrink: 0,
                background: msg.sender.accentColor,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 12, fontWeight: 700, color: 'white',
              }}>
                {msg.sender.avatarInitials}
              </div>
              <div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 2 }}>
                  {msg.sender.name}
                </div>
                <div style={{ fontSize: 14 }}>{msg.content}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
