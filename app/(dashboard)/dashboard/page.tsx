import { auth } from '@/auth'
import { prisma } from '@/lib/db'
import DashboardClient from './DashboardClient'
import { GATE_WEIGHTS } from '@/lib/scheduler/progress-analyzer'
import { getUserStreakStatus } from '@/lib/streak-engine'
import { generateRealityCheck } from '@/lib/reality-check'

export default async function DashboardPage() {
  const session = await auth()
  if (!session?.user?.id) return null

  const userId = session.user.id
  const now = new Date()
  const sevenDaysAgo = new Date(now)
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
  const todayStr = now.toDateString()

  // Fetch user with streak & achievements
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      goals: true,
      userAchievements: {
        include: { achievement: true },
        take: 3,
        orderBy: { unlockedAt: 'desc' },
      },
    },
  })
  if (!user) return null

  // Today's schedule
  const todaySchedule = await prisma.dailySchedule.findUnique({
    where: { userId_date: { userId, date: new Date(todayStr) } },
    include: {
      blocks: {
        orderBy: { order: 'asc' },
      },
    },
  })

  // Get first pending study block for "Current Focus"
  const firstPending = todaySchedule?.blocks.find(
    b => b.blockType === 'study' && b.status === 'pending'
  )

  let focusTopic = null
  if (firstPending?.topicId) {
    focusTopic = await prisma.topic.findUnique({
      where: { id: firstPending.topicId },
      include: {
        subject: true,
        masteryRecords: { where: { userId } },
      },
    })
  }

  // Weekly study sessions
  const weeklySessions = await prisma.studySession.findMany({
    where: { userId, date: { gte: sevenDaysAgo } },
    include: { items: true },
  })
  const weeklyMinutes = weeklySessions.reduce((s, sess) => s + sess.totalMinutes, 0)
  const todayMinutes = weeklySessions
    .filter(s => new Date(s.date).toDateString() === todayStr)
    .reduce((s, sess) => s + sess.totalMinutes, 0)

  // All topic masteries
  const masteries = await prisma.topicMastery.findMany({
    where: { userId },
    include: {
      topic: { include: { subject: true } },
      history: { orderBy: { recordedAt: 'asc' }, take: 5 },
    },
  })

  // Total topics count in DB
  const allSubjects = await prisma.subject.findMany({
    orderBy: { order: 'asc' },
    include: { topics: true },
  })

  // Subject mastery summary — Honest data:
  // mastery is null until real quizzes/sessions are completed.
  const subjectMastery = allSubjects.map(subject => {
    const subjectMasteryRecords = masteries.filter(m => m.topic.subjectId === subject.id)
    const assessedRecords = subjectMasteryRecords.filter(m => m.mastery !== null)

    const topicsTotal = subject.topics.length
    const topicsAssessed = assessedRecords.length

    // Estimated mastery is ONLY computed if at least 2 topics are assessed
    const estimatedMastery =
      topicsAssessed >= 2
        ? Math.round(assessedRecords.reduce((s, m) => s + (m.mastery ?? 0), 0) / topicsAssessed)
        : null

    const topicsWeak = assessedRecords.filter(m => (m.mastery ?? 0) < 40).length
    const gateWeight = GATE_WEIGHTS[subject.name] || 0.05

    let confidence: 'none' | 'low' | 'medium' | 'high' = 'none'
    if (topicsAssessed === 0) confidence = 'none'
    else if (topicsAssessed / topicsTotal < 0.3) confidence = 'low'
    else if (topicsAssessed / topicsTotal < 0.7) confidence = 'medium'
    else confidence = 'high'

    return {
      id: subject.id,
      name: subject.name,
      slug: subject.slug,
      icon: subject.icon,
      color: subject.color,
      estimatedMastery,
      topicsAssessed,
      topicsTotal,
      topicsWeak,
      confidence,
      gateWeight,
    }
  })

  // Assessed topics count overall
  const totalAssessedCount = masteries.filter(m => m.mastery !== null).length
  const totalTopicsCount = allSubjects.reduce((sum, s) => sum + s.topics.length, 0)

  // GATE readiness: Only calculated if at least 3 GATE topics are assessed
  const assessedGateTopics = masteries.filter(
    m => m.topic.gateRelevance >= 4 && m.mastery !== null
  )

  const gateReadiness: number | null =
    assessedGateTopics.length >= 3
      ? Math.round(
          assessedGateTopics.reduce(
            (s, m) => s + (m.mastery ?? 0) * (m.topic.gateRelevance / 5),
            0
          ) / assessedGateTopics.length
        )
      : null

  // Weak areas (strictly real data: mastery is not null and < 40)
  const weakAreas = masteries
    .filter(m => m.mastery !== null && (m.mastery ?? 0) < 40)
    .sort((a, b) => (a.mastery ?? 0) - (b.mastery ?? 0))
    .slice(0, 5)
    .map(m => ({
      topicId: m.topicId,
      topicName: m.topic.name,
      subjectName: m.topic.subject.name,
      mastery: Math.round(m.mastery ?? 0),
      color: m.topic.subject.color,
    }))

  // Revision due topics
  const revisionDue = await prisma.spacedRevision.findMany({
    where: { userId, dueDate: { lte: now } },
    include: { topic: { include: { subject: true } } },
    take: 5,
  })

  // Today tasks stats
  const todayBlocks = todaySchedule?.blocks.filter(b => b.blockType === 'study') ?? []
  const completedBlocks = todayBlocks.filter(b => b.status === 'completed')

  // Weekly mastery gain (compare first and last history points)
  const weeklyMasteryGain = masteries.reduce((sum, m) => {
    if (m.history.length >= 2) {
      return sum + (m.history[m.history.length - 1].masteryValue - m.history[0].masteryValue)
    }
    return sum
  }, 0)

  // Missed sessions this week
  const missedCount = await prisma.missedSession.count({
    where: { userId, date: { gte: sevenDaysAgo } },
  })

  // Check-in done today?
  const checkInToday = await prisma.dailyCheckIn.findUnique({
    where: { userId_date: { userId, date: new Date(todayStr) } },
  })

  // Streak status
  const streakStatus = await getUserStreakStatus(userId)

  // Reality check
  const realityCheck = generateRealityCheck({
    userName: user.name,
    style: user.realityCheckStyle,
    currentStreak: streakStatus.currentStreak,
    missedSessionsThisWeek: missedCount,
    hasActiveRelaxation: streakStatus.isFrozen,
    relaxationReason: streakStatus.freezeReason,
    topicsAssessedCount: totalAssessedCount,
    totalTopicsCount,
    gateReadiness,
    gateTarget: user.gateTarget,
    weakTopicsCount: weakAreas.length,
  })

  // Safe career paths parsing
  let careerPaths: string[] = []
  try {
    careerPaths = JSON.parse(user.careerPaths)
  } catch {
    careerPaths = []
  }

  return (
    <DashboardClient
      user={{
        id: user.id,
        name: user.name,
        avatarInitials: user.name === 'Shivraj' ? 'SJ' : 'MP',
        accentColor: user.accentColor,
        gateTarget: user.gateTarget,
        careerPaths,
        xp: user.xp,
        level: user.level,
      }}
      focusTopic={
        focusTopic
          ? {
              topicId: focusTopic.id,
              topicName: focusTopic.name,
              subjectName: focusTopic.subject.name,
              subjectColor: focusTopic.subject.color,
              mastery: focusTopic.masteryRecords[0]?.mastery ?? null,
              selfAssessScore: focusTopic.masteryRecords[0]?.selfAssessScore ?? null,
              importance: focusTopic.importance,
              gateRelevance: focusTopic.gateRelevance,
              blockId: firstPending?.id,
              label: firstPending?.label ?? '🧠 Deep Dive',
              reasons: JSON.parse(firstPending?.reasonJson ?? '[]'),
              startTime: firstPending?.startTime,
              durationMinutes: firstPending?.durationMinutes,
            }
          : null
      }
      todayStats={{
        totalMinutes: todayMinutes,
        availableMinutes: todaySchedule?.availableMinutes ?? 240,
        tasksTotal: todayBlocks.length,
        tasksCompleted: completedBlocks.length,
        energyLevel: todaySchedule?.energyLevel ?? 'normal',
        hasSchedule: !!todaySchedule,
        hasCheckIn: !!checkInToday,
      }}
      weeklyStats={{
        totalMinutes: weeklyMinutes,
        masteryGained: Math.round(weeklyMasteryGain * 10) / 10,
        daysStudied: weeklySessions.length,
        missedSessions: missedCount,
      }}
      gateReadiness={gateReadiness}
      subjectMastery={subjectMastery}
      weakAreas={weakAreas}
      revisionDue={revisionDue.map(r => ({
        topicId: r.topicId,
        topicName: r.topic.name,
        subjectName: r.topic.subject.name,
        daysOverdue: Math.floor((now.getTime() - new Date(r.dueDate).getTime()) / 86400000),
      }))}
      streak={streakStatus}
      realityCheck={realityCheck}
      realityCheckEnabled={user.realityCheckEnabled}
      totalAssessedCount={totalAssessedCount}
      totalTopicsCount={totalTopicsCount}
    />
  )
}
