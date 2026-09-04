import { auth } from '@/auth'
import { prisma } from '@/lib/db'

const CAREER_PATHS = [
  {
    id: 'backend', title: 'Backend Engineer', icon: '⚙️',
    requiredSubjects: ['dsa', 'dbms', 'os', 'cn', 'system-design', 'programming'],
    description: 'Build scalable APIs, services, and backend systems',
  },
  {
    id: 'ml-engineer', title: 'ML Engineer', icon: '🤖',
    requiredSubjects: ['ml', 'dsa', 'programming', 'system-design'],
    description: 'Build and deploy machine learning models at scale',
  },
  {
    id: 'fullstack', title: 'Full Stack Engineer', icon: '🌐',
    requiredSubjects: ['dsa', 'dbms', 'cn', 'programming', 'se'],
    description: 'Build complete web applications end-to-end',
  },
  {
    id: 'systems', title: 'Systems Engineer', icon: '🔧',
    requiredSubjects: ['os', 'coa', 'cn', 'dsa', 'programming', 'system-design'],
    description: 'Build low-level systems, compilers, and infrastructure',
  },
  {
    id: 'research', title: 'AI/Research', icon: '🔬',
    requiredSubjects: ['ml', 'toc', 'dsa', 'programming'],
    description: 'Push the boundaries of AI and computer science',
  },
]

export default async function CareerPage() {
  const session = await auth()
  if (!session?.user?.id) return null
  const userId = session.user.id

  const user = await prisma.user.findUnique({ where: { id: userId } })
  const targetPaths: string[] = JSON.parse(user?.careerPaths ?? '[]')

  const subjects = await prisma.subject.findMany({ orderBy: { order: 'asc' } })
  const masteries = await prisma.topicMastery.findMany({
    where: { userId },
    include: { topic: { include: { subject: true } } },
  })

  const subjectMastery: Record<string, number> = {}
  for (const subject of subjects) {
    const sm = masteries.filter(m => m.topic.subjectId === subject.id && m.mastery !== null)
    subjectMastery[subject.slug] = sm.length > 0
      ? Math.round(sm.reduce((s, m) => s + (m.mastery ?? 0), 0) / sm.length)
      : 0
  }

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <h1 className="page-title">🗺 Career Roadmap</h1>
        <p className="page-subtitle">Your skill gaps and path to your target career</p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
        {CAREER_PATHS.map(path => {
          const isTarget = targetPaths.includes(path.title)
          const subjectScores = path.requiredSubjects.map(slug => ({
            slug, mastery: subjectMastery[slug] ?? 0,
            subject: subjects.find(s => s.slug === slug),
          }))
          const avgReadiness = Math.round(
            subjectScores.reduce((s, r) => s + r.mastery, 0) / subjectScores.length
          )
          const gaps = subjectScores.filter(s => s.mastery < 50)

          return (
            <div key={path.id} className="card" style={{
              borderColor: isTarget ? user?.accentColor + '40' : 'var(--border)',
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                  <span style={{ fontSize: 28 }}>{path.icon}</span>
                  <div>
                    <h3 style={{ fontSize: 18, fontWeight: 800 }}>{path.title}</h3>
                    <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>{path.description}</p>
                  </div>
                </div>
                <div style={{ textAlign: 'right', flexShrink: 0, marginLeft: 16 }}>
                  {isTarget && <span className="badge badge-primary" style={{ marginBottom: 4, display: 'block' }}>Your Target</span>}
                  <div style={{
                    fontSize: 24, fontWeight: 900, fontFamily: 'var(--font-mono)',
                    color: avgReadiness >= 70 ? 'var(--accent-success)' :
                      avgReadiness >= 40 ? 'var(--accent-warning)' : 'var(--accent-danger)',
                  }}>
                    {avgReadiness}%
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>readiness</div>
                </div>
              </div>

              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 12 }}>
                {subjectScores.map(s => (
                  <div key={s.slug} style={{
                    display: 'flex', alignItems: 'center', gap: 6,
                    padding: '4px 10px', borderRadius: 20,
                    background: s.mastery >= 50 ? 'var(--accent-success-dim)' : 'var(--accent-danger-dim)',
                    border: `1px solid ${s.mastery >= 50 ? 'var(--accent-success)' : 'var(--accent-danger)'}30`,
                  }}>
                    <span style={{ fontSize: 14 }}>{s.subject?.icon ?? '📚'}</span>
                    <span style={{ fontSize: 12, fontWeight: 600 }}>{s.subject?.name ?? s.slug}</span>
                    <span style={{
                      fontSize: 11, fontFamily: 'var(--font-mono)', fontWeight: 700,
                      color: s.mastery >= 50 ? 'var(--accent-success)' : 'var(--accent-danger)',
                    }}>
                      {s.mastery}%
                    </span>
                  </div>
                ))}
              </div>

              {gaps.length > 0 && (
                <div style={{ padding: '10px 14px', background: 'var(--bg-input)', borderRadius: 8 }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', marginBottom: 6 }}>
                    SKILL GAPS TO CLOSE
                  </div>
                  <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
                    {gaps.map(g => g.subject?.name ?? g.slug).join(' → ')}
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
