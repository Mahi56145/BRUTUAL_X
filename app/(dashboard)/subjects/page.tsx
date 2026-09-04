import { auth } from '@/auth'
import { prisma } from '@/lib/db'
import Link from 'next/link'

export default async function SubjectsPage() {
  const session = await auth()
  if (!session?.user?.id) return null

  const userId = session.user.id
  const subjects = await prisma.subject.findMany({
    orderBy: { order: 'asc' },
    include: {
      topics: {
        include: { masteryRecords: { where: { userId } } },
      },
    },
  })

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <h1 className="page-title">Subjects</h1>
        <p className="page-subtitle">Your real, data-driven knowledge map across Computer Science domains</p>
      </div>

      <div className="grid-3">
        {subjects.map(subject => {
          const totalTopics = subject.topics.length
          const assessedRecords = subject.topics
            .map(t => t.masteryRecords[0])
            .filter(r => r && r.mastery !== null && r.mastery !== undefined)

          const assessedCount = assessedRecords.length
          const avg =
            assessedCount >= 2
              ? Math.round(
                  assessedRecords.reduce((sum, r) => sum + (r.mastery ?? 0), 0) /
                    assessedCount
                )
              : null

          const weakCount = assessedRecords.filter(r => (r.mastery ?? 0) < 40).length

          return (
            <Link key={subject.id} href={`/subjects/${subject.slug}`}>
              <div
                className="card"
                style={{
                  cursor: 'pointer',
                  borderColor:
                    avg !== null && avg >= 60
                      ? subject.color + '30'
                      : 'var(--border)',
                  transition: 'all 0.2s ease',
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'flex-start',
                    marginBottom: 12,
                  }}
                >
                  <span style={{ fontSize: 32 }}>{subject.icon}</span>
                  <span
                    style={{
                      fontFamily: 'var(--font-mono)',
                      fontWeight: 800,
                      fontSize: 16,
                      color:
                        avg === null
                          ? 'var(--text-muted)'
                          : avg >= 70
                          ? 'var(--accent-success)'
                          : avg >= 40
                          ? 'var(--accent-warning)'
                          : 'var(--accent-danger)',
                    }}
                  >
                    {avg !== null ? `${avg}%` : 'Not Assessed'}
                  </span>
                </div>

                <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 4 }}>
                  {subject.name}
                </h3>
                <p
                  style={{
                    fontSize: 12,
                    color: 'var(--text-muted)',
                    marginBottom: 12,
                    lineHeight: 1.4,
                  }}
                >
                  {subject.description}
                </p>

                <div
                  style={{
                    height: 6,
                    background: 'var(--bg-input)',
                    borderRadius: 99,
                    marginBottom: 10,
                    overflow: 'hidden',
                  }}
                >
                  {avg !== null ? (
                    <div
                      style={{
                        height: '100%',
                        width: `${avg}%`,
                        background: `linear-gradient(90deg, ${subject.color}88, ${subject.color})`,
                        borderRadius: 99,
                        transition: 'width 1s ease',
                      }}
                    />
                  ) : (
                    <div
                      style={{
                        height: '100%',
                        width: '100%',
                        background: 'transparent',
                        borderBottom: '1px dashed var(--border-strong)',
                      }}
                    />
                  )}
                </div>

                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    fontSize: 12,
                    color: 'var(--text-muted)',
                  }}
                >
                  <span>
                    {assessedCount}/{totalTopics} assessed
                  </span>
                  {weakCount > 0 ? (
                    <span style={{ color: 'var(--accent-danger)' }}>
                      ⚠ {weakCount} weak
                    </span>
                  ) : assessedCount === 0 ? (
                    <span style={{ color: 'var(--text-muted)' }}>Calibrating</span>
                  ) : null}
                </div>
              </div>
            </Link>
          )
        })}
      </div>
    </div>
  )
}
