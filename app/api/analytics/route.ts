import { auth } from '@/auth'
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function GET() {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const userId = session.user.id

  // Both users' data for shared dashboard
  const users = await prisma.user.findMany({
    select: { id: true, name: true, avatarInitials: true, accentColor: true, gateTarget: true, careerPaths: true },
  })

  // Analytics for each user
  const now = new Date()
  const sevenDaysAgo = new Date(now)
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)

  const analyticsData = await Promise.all(
    users.map(async (user) => {
      const [sessions, masteries, subjects] = await Promise.all([
        prisma.studySession.findMany({
          where: { userId: user.id, date: { gte: sevenDaysAgo } },
          include: { items: true },
        }),
        prisma.topicMastery.findMany({
          where: { userId: user.id },
          include: { topic: { include: { subject: true } } },
        }),
        prisma.subject.findMany({ orderBy: { order: 'asc' } }),
      ])

      const todayMinutes = sessions
        .filter(s => new Date(s.date).toDateString() === now.toDateString())
        .reduce((sum, s) => sum + s.totalMinutes, 0)

      const weeklyMinutes = sessions.reduce((sum, s) => sum + s.totalMinutes, 0)

      const todaySchedule = await prisma.dailySchedule.findUnique({
        where: {
          userId_date: { userId: user.id, date: new Date(now.toDateString()) },
        },
        include: { blocks: { orderBy: { order: 'asc' } } },
      })

      const todayTasks = todaySchedule?.blocks.filter(b => b.blockType === 'study') ?? []
      const completedTasks = todayTasks.filter(b => b.status === 'completed')

      // Subject-wise mastery
      const subjectMastery = subjects.map(subject => {
        const subjectMasteries = masteries.filter(m => m.topic.subjectId === subject.id && m.mastery !== null)
        const allSubjectTopics = masteries.filter(m => m.topic.subjectId === subject.id)
        const avg = subjectMasteries.length > 0
          ? subjectMasteries.reduce((sum, m) => sum + (m.mastery ?? 0), 0) / subjectMasteries.length
          : 0
        return {
          subjectId: subject.id,
          name: subject.name,
          slug: subject.slug,
          icon: subject.icon,
          color: subject.color,
          avgMastery: Math.round(avg),
          topicsTotal: allSubjectTopics.length,
          topicsWeak: subjectMasteries.filter(m => (m.mastery ?? 0) < 40).length,
        }
      })

      // Overall accuracy
      const totalAttempted = sessions.flatMap(s => s.items).reduce((sum, i) => sum + i.questionsAttempted, 0)
      const totalCorrect = sessions.flatMap(s => s.items).reduce((sum, i) => sum + i.questionsCorrect, 0)
      const accuracy = totalAttempted > 0 ? Math.round((totalCorrect / totalAttempted) * 100) : 0

      // GATE readiness (weighted by gateRelevance)
      const gateTopics = masteries.filter(m => m.topic.gateRelevance >= 4 && m.mastery !== null)
      const gateReadiness = gateTopics.length > 0
        ? Math.round(gateTopics.reduce((sum, m) => sum + (m.mastery ?? 0) * (m.topic.gateRelevance / 5), 0) / gateTopics.length)
        : 0

      // CS core mastery
      const coreTopics = masteries.filter(m =>
        ['os', 'dbms', 'cn', 'coa', 'toc', 'compiler'].includes(m.topic.subject.slug) && m.mastery !== null
      )
      const coreReadiness = coreTopics.length > 0
        ? Math.round(coreTopics.reduce((sum, m) => sum + (m.mastery ?? 0), 0) / coreTopics.length)
        : 0

      // ML mastery
      const mlTopics = masteries.filter(m => m.topic.subject.slug === 'ml' && m.mastery !== null)
      const mlReadiness = mlTopics.length > 0
        ? Math.round(mlTopics.reduce((sum, m) => sum + (m.mastery ?? 0), 0) / mlTopics.length)
        : 0

      // Weak areas
      const weakAreas = masteries
        .filter(m => m.mastery !== null && (m.mastery ?? 0) < 40 && (m.mastery ?? 0) > 0)
        .sort((a, b) => (a.mastery ?? 0) - (b.mastery ?? 0))
        .slice(0, 5)
        .map(m => ({
          topicName: m.topic.name,
          subjectName: m.topic.subject.name,
          mastery: Math.round(m.mastery ?? 0),
        }))

      return {
        userId: user.id,
        userName: user.name,
        avatarInitials: user.avatarInitials,
        accentColor: user.accentColor,
        todayMinutes,
        weeklyMinutes,
        tasksTotal: todayTasks.length,
        tasksCompleted: completedTasks.length,
        accuracy,
        gateReadiness,
        coreReadiness,
        mlReadiness,
        subjectMastery,
        weakAreas,
        isCurrentUser: user.id === userId,
      }
    })
  )

  // Shared messages
  const messages = await prisma.sharedMessage.findMany({
    where: {
      OR: [{ senderId: userId }, { receiverId: userId }],
    },
    include: { sender: { select: { name: true, avatarInitials: true, accentColor: true } } },
    orderBy: { createdAt: 'desc' },
    take: 10,
  })

  return NextResponse.json({ users: analyticsData, messages })
}
