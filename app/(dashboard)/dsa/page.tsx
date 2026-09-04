import { auth } from '@/auth'
import { prisma } from '@/lib/db'

export default async function DSAPage() {
  const session = await auth()
  if (!session?.user?.id) return null
  const userId = session.user.id

  const dsaSubject = await prisma.subject.findUnique({
    where: { slug: 'dsa' },
    include: {
      topics: {
        orderBy: { order: 'asc' },
        include: { masteryRecords: { where: { userId } } },
      },
    },
  })

  const topics = dsaSubject?.topics ?? []
  const avgMastery = topics.length > 0
    ? Math.round(topics.reduce((s, t) => s + (t.masteryRecords[0]?.mastery ?? 0), 0) / topics.length)
    : 0

  const categories = [
    { label: '📦 Fundamentals', slugs: ['complexity', 'arrays', 'strings', 'linked-lists', 'stacks-queues', 'hash-tables'] },
    { label: '🌳 Trees & Graphs', slugs: ['trees', 'avl-heaps', 'tries', 'graph-bfs-dfs', 'topo-sort', 'shortest-paths', 'mst', 'dsu'] },
    { label: '🔍 Search & Sort', slugs: ['binary-search', 'sorting', 'two-pointers', 'divide-conquer'] },
    { label: '💡 Techniques', slugs: ['greedy', 'dp', 'backtracking', 'bit-manipulation'] },
    { label: '🎯 Practice', slugs: ['gate-dsa', 'interview-problems'] },
  ]

  return (
    <div className="animate-fade-in">
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1 className="page-title">⚔️ DSA</h1>
          <p className="page-subtitle">Data Structures & Algorithms — from basics to advanced</p>
        </div>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 4 }}>DSA MASTERY</div>
          <div style={{ fontSize: 36, fontWeight: 900, fontFamily: 'var(--font-mono)', color: '#00d4aa' }}>
            {avgMastery}%
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
        {categories.map(cat => {
          const catTopics = topics.filter(t => cat.slugs.includes(t.slug))
          return (
            <div key={cat.label} className="card">
              <div className="card-header">
                <span style={{ fontSize: 16, fontWeight: 700 }}>{cat.label}</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {catTopics.map(topic => {
                  const mastery = topic.masteryRecords[0]?.mastery ?? 0
                  return (
                    <div key={topic.id} className="topic-row">
                      <div className="topic-name" style={{ fontWeight: 600 }}>{topic.name}</div>
                      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                        {topic.gateRelevance >= 4 && <span className="badge badge-primary" style={{ fontSize: 10 }}>GATE</span>}
                        {topic.importance >= 4 && <span className="badge badge-secondary" style={{ fontSize: 10 }}>Interview</span>}
                      </div>
                      <div style={{ width: 100, height: 6, background: 'var(--bg-input)', borderRadius: 99, overflow: 'hidden' }}>
                        <div style={{ height: '100%', width: `${mastery}%`, background: '#00d4aa', borderRadius: 99 }} />
                      </div>
                      <span style={{
                        fontFamily: 'var(--font-mono)', fontSize: 13, fontWeight: 700,
                        color: mastery >= 60 ? 'var(--accent-success)' : mastery >= 30 ? 'var(--accent-warning)' : 'var(--accent-danger)',
                        width: 36, textAlign: 'right',
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
