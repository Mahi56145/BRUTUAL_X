import { auth } from '@/auth'
import { prisma } from '@/lib/db'

export default async function MLPage() {
  const session = await auth()
  if (!session?.user?.id) return null
  const userId = session.user.id

  const mlSubject = await prisma.subject.findUnique({
    where: { slug: 'ml' },
    include: {
      topics: {
        orderBy: { order: 'asc' },
        include: { masteryRecords: { where: { userId } } },
      },
    },
  })

  const sections = [
    { label: '📐 Mathematics', slugs: ['linear-algebra', 'probability', 'calculus'] },
    { label: '🤖 Core ML', slugs: ['ml-basics', 'decision-trees', 'svm-knn', 'pca-features', 'evaluation'] },
    { label: '🧠 Deep Learning', slugs: ['neural-nets', 'cnn', 'rnn', 'transformers'] },
    { label: '🛠 Engineering', slugs: ['numpy-pandas', 'sklearn-pytorch', 'mlops'] },
  ]

  const topics = mlSubject?.topics ?? []
  const avgMastery = topics.length > 0
    ? Math.round(topics.reduce((s, t) => s + (t.masteryRecords[0]?.mastery ?? 0), 0) / topics.length)
    : 0

  return (
    <div className="animate-fade-in">
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1 className="page-title">🤖 ML Track</h1>
          <p className="page-subtitle">Mathematics → ML → Deep Learning → Engineering</p>
        </div>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 4 }}>ML MASTERY</div>
          <div style={{ fontSize: 36, fontWeight: 900, fontFamily: 'var(--font-mono)', color: '#6c5ce7' }}>
            {avgMastery}%
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
        {sections.map(section => {
          const sectionTopics = topics.filter(t => section.slugs.includes(t.slug))
          return (
            <div key={section.label} className="card">
              <div className="card-header">
                <span style={{ fontSize: 16, fontWeight: 700 }}>{section.label}</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {sectionTopics.map(topic => {
                  const mastery = topic.masteryRecords[0]?.mastery ?? 0
                  return (
                    <div key={topic.id} className="topic-row">
                      <div className="topic-name" style={{ fontWeight: 600 }}>{topic.name}</div>
                      <div style={{ width: 140, height: 6, background: 'var(--bg-input)', borderRadius: 99, overflow: 'hidden' }}>
                        <div style={{ height: '100%', width: `${mastery}%`, background: '#6c5ce7', borderRadius: 99 }} />
                      </div>
                      <span style={{
                        fontFamily: 'var(--font-mono)', fontSize: 13, fontWeight: 700,
                        color: mastery >= 60 ? 'var(--accent-success)' : mastery >= 30 ? 'var(--accent-warning)' : 'var(--accent-danger)',
                        width: 36, textAlign: 'right'
                      }}>
                        {mastery > 0 ? `${Math.round(mastery)}%` : '—'}
                      </span>
                    </div>
                  )
                })}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
