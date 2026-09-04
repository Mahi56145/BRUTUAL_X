import { auth } from '@/auth'
import { prisma } from '@/lib/db'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, BookOpen, Target, CheckCircle2 } from 'lucide-react'

export default async function SubjectDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const session = await auth()
  if (!session?.user?.id) return null

  const { slug } = await params
  const userId = session.user.id
  const subject = await prisma.subject.findUnique({
    where: { slug },
    include: {
      topics: {
        orderBy: { order: 'asc' },
        include: {
          masteryRecords: { where: { userId } },
          prerequisites: {
            include: { prerequisite: { select: { name: true } } },
          },
        },
      },
    },
  })

  if (!subject) notFound()

  const assessedTopics = subject.topics.filter(
    t => t.masteryRecords[0]?.mastery !== null && t.masteryRecords[0]?.mastery !== undefined
  )
  const assessedCount = assessedTopics.length
  const totalTopics = subject.topics.length

  const overallMastery =
    assessedCount >= 2
      ? Math.round(
          assessedTopics.reduce(
            (s, t) => s + (t.masteryRecords[0]?.mastery ?? 0),
            0
          ) / assessedCount
        )
      : null

  return (
    <div className="animate-fade-in">
      <div style={{ marginBottom: 16 }}>
        <Link
          href="/subjects"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            fontSize: 13,
            color: 'var(--text-secondary)',
            textDecoration: 'none',
          }}
        >
          <ArrowLeft size={14} /> Back to Subjects
        </Link>
      </div>

      <div className="page-header">
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 16,
            marginBottom: 8,
          }}
        >
          <span style={{ fontSize: 40 }}>{subject.icon}</span>
          <div>
            <h1 className="page-title">{subject.name}</h1>
            <p className="page-subtitle">{subject.description}</p>
          </div>
        </div>

        <div
          style={{
            height: 8,
            background: 'var(--bg-input)',
            borderRadius: 99,
            maxWidth: 300,
            marginTop: 12,
            overflow: 'hidden',
          }}
        >
          {overallMastery !== null ? (
            <div
              style={{
                height: '100%',
                width: `${overallMastery}%`,
                background: subject.color,
                borderRadius: 99,
              }}
            />
          ) : (
            <div
              style={{
                height: '100%',
                width: '100%',
                borderBottom: '1px dashed var(--border-strong)',
              }}
            />
          )}
        </div>

        <div
          style={{
            fontSize: 13,
            color: 'var(--text-muted)',
            marginTop: 6,
            fontFamily: 'var(--font-mono)',
          }}
        >
          {overallMastery !== null
            ? `Estimated Mastery: ${overallMastery}% (${assessedCount}/${totalTopics} assessed)`
            : `Estimated Mastery: Not enough data (${assessedCount}/${totalTopics} assessed)`}
        </div>
      </div>

      <div className="card">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {subject.topics.map(topic => {
            const record = topic.masteryRecords[0]
            const mastery = record?.mastery ?? null
            const selfAssess = record?.selfAssessScore ?? null
            const accuracy = record?.accuracy ?? 0
            const questionsAttempted = record?.questionsAttempted ?? 0
            const lastStudied = record?.lastStudiedAt

            const daysAgo = lastStudied
              ? Math.floor(
                  (Date.now() - new Date(lastStudied).getTime()) / 86400000
                )
              : null

            const masteryColor =
              mastery === null
                ? 'var(--text-muted)'
                : mastery >= 70
                ? 'var(--accent-success)'
                : mastery >= 40
                ? 'var(--accent-warning)'
                : 'var(--accent-danger)'

            const flag =
              mastery !== null && mastery < 20
                ? '🔴'
                : mastery !== null && mastery < 40
                ? '🟠'
                : mastery !== null && mastery >= 70
                ? '✅'
                : '⚪'

            return (
              <div key={topic.id} className="topic-row">
                <span className="topic-flag">{flag}</span>
                <div className="topic-name">
                  <div style={{ fontWeight: 600 }}>{topic.name}</div>
                  <div
                    style={{
                      fontSize: 11,
                      color: 'var(--text-muted)',
                      display: 'flex',
                      gap: 12,
                      marginTop: 2,
                      flexWrap: 'wrap',
                    }}
                  >
                    {daysAgo !== null && (
                      <span>
                        Studied {daysAgo === 0 ? 'today' : `${daysAgo}d ago`}
                      </span>
                    )}
                    {questionsAttempted > 0 && (
                      <span>
                        Accuracy: {Math.round(accuracy)}% ({record.questionsCorrect}/{questionsAttempted})
                      </span>
                    )}
                    {mastery === null && selfAssess !== null && (
                      <span style={{ color: 'var(--accent-info)' }}>
                        Self-rating: {selfAssess}/5
                      </span>
                    )}
                    {topic.gateRelevance >= 4 && (
                      <span style={{ color: 'var(--accent-primary)' }}>
                        🎯 GATE Essential
                      </span>
                    )}
                  </div>
                </div>

                <div className="topic-bar" style={{ width: 100 }}>
                  {mastery !== null ? (
                    <div
                      className="topic-bar-fill"
                      style={{ width: `${mastery}%`, background: masteryColor }}
                    />
                  ) : (
                    <div
                      style={{
                        height: 6,
                        borderBottom: '1px dashed var(--border)',
                      }}
                    />
                  )}
                </div>

                <div
                  className="topic-mastery-pct"
                  style={{
                    color: masteryColor,
                    fontSize: mastery !== null ? 14 : 12,
                  }}
                >
                  {mastery !== null ? `${Math.round(mastery)}%` : 'Not Assessed'}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
