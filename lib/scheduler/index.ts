/**
 * Main Scheduler Orchestrator
 * Ties all engines together to produce a daily schedule from DB state
 */

import { prisma } from '@/lib/db'
import { rankTopics, type TopicPriorityInput } from './priority-engine'
import { generateDailySchedule, ensureVariety, calculateBurnoutRisk, type ScheduleWindow } from './schedule-generator'
import { getRevisionUrgency } from './revision-engine'
import { applyKnowledgeDecay } from './mastery-engine'

export interface SchedulerInput {
  userId: string
  date: Date
  availableMinutes: number
  energyLevel: 'low' | 'normal' | 'high'
  windows: ScheduleWindow[]
  overtimePurpose?: string
}

/**
 * Get the day's available windows based on day-of-week
 */
export function getAvailableWindows(
  userId: string,
  userName: string,
  date: Date,
  overtimeSlots: Array<{ startTime: string; endTime: string }>
): ScheduleWindow[] {
  const dayOfWeek = date.getDay() // 0=Sunday, 6=Saturday
  const isWeekend = dayOfWeek === 0 || dayOfWeek === 6

  let windows: ScheduleWindow[] = []

  if (userName === 'Mahipal') {
    if (isWeekend) {
      windows = [
        { startTime: '13:00', endTime: '16:00' },
        { startTime: '20:00', endTime: '23:00' },
      ]
    } else {
      windows = [{ startTime: '19:00', endTime: '23:00' }]
    }
  } else if (userName === 'Shivraj') {
    if (isWeekend) {
      windows = [
        { startTime: '13:00', endTime: '16:00' },
        { startTime: '19:00', endTime: '22:00' },
      ]
    } else {
      windows = [{ startTime: '19:00', endTime: '01:00' }] // crosses midnight
    }
  }

  // Add overtime slots
  for (const slot of overtimeSlots) {
    windows.push({ startTime: slot.startTime, endTime: slot.endTime })
  }

  return windows
}

/**
 * Main schedule generation function
 * Reads DB state and produces a fresh schedule
 */
export async function generateScheduleForUser(input: SchedulerInput) {
  const { userId, date, availableMinutes, energyLevel, windows } = input

  // 1. Fetch user with goals and settings
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { goals: true },
  })
  if (!user) throw new Error('User not found')

  // Check active relaxation period for this date
  const activeRelaxation = await prisma.relaxationPeriod.findFirst({
    where: {
      userId,
      active: true,
      startDate: { lte: date },
      endDate: { gte: date },
    },
  })

  // If complete relaxation period active, generate break schedule
  if (activeRelaxation && activeRelaxation.mode === 'complete') {
    const scheduleDate = new Date(date.toDateString())
    const saved = await prisma.dailySchedule.upsert({
      where: { userId_date: { userId, date: scheduleDate } },
      update: { availableMinutes, energyLevel },
      create: { userId, date: scheduleDate, availableMinutes, energyLevel },
    })

    await prisma.scheduleBlock.deleteMany({ where: { scheduleId: saved.id } })

    await prisma.scheduleBlock.create({
      data: {
        scheduleId: saved.id,
        order: 0,
        startTime: '09:00',
        endTime: '21:00',
        durationMinutes: availableMinutes,
        blockType: 'break',
        label: '⏸ Relaxation Period',
        title: activeRelaxation.reason,
        description: `Strategic pause for ${activeRelaxation.reason}. Study streak is protected.`,
        priorityScore: 0,
        reasonJson: JSON.stringify([`Active relaxation: ${activeRelaxation.reason}`]),
        status: 'completed',
      },
    })

    const fullSchedule = await prisma.dailySchedule.findUnique({
      where: { id: saved.id },
      include: { blocks: { orderBy: { order: 'asc' } } },
    })

    return {
      schedule: fullSchedule,
      burnoutRisk: { score: 0, level: 'low' as const, warning: null },
      varietyScore: 100,
      totalStudyMinutes: 0,
      rankedTopics: [],
    }
  }

  // 2. Fetch all topics with mastery records
  const allTopics = await prisma.topic.findMany({
    include: {
      subject: true,
      masteryRecords: {
        where: { userId },
      },
      spacedRevisions: {
        where: { userId },
      },
      prerequisites: {
        include: {
          prerequisite: {
            include: {
              masteryRecords: { where: { userId } },
            },
          },
        },
      },
      dependents: true,
    },
  })

  // 3. Fetch college deadlines in next 7 days
  const upcoming = new Date(date)
  upcoming.setDate(upcoming.getDate() + 7)
  const deadlines = await prisma.collegeDeadline.findMany({
    where: {
      userId,
      completed: false,
      dueDate: { lte: upcoming },
    },
  })

  // 4. Fetch recent sessions for burnout calculation
  const sevenDaysAgo = new Date(date)
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
  const recentSessions = await prisma.studySession.findMany({
    where: { userId, date: { gte: sevenDaysAgo } },
    include: { items: true },
  })

  const recentOvertimeCount = await prisma.overtimeSlot.count({
    where: { userId, date: { gte: sevenDaysAgo }, used: true },
  })

  const weeklyMinutes = recentSessions.reduce((sum, s) => sum + s.totalMinutes, 0)
  const consecutiveDays = recentSessions.length // simplified

  const burnoutRisk = calculateBurnoutRisk(
    consecutiveDays,
    weeklyMinutes / 60,
    recentOvertimeCount,
    availableMinutes / Math.max(1, recentSessions.length)
  )

  // 5. Build topic priority inputs
  const priorityInputs: TopicPriorityInput[] = []

  for (const topic of allTopics) {
    const mastery = topic.masteryRecords[0]
    const revision = topic.spacedRevisions[0]

    // Check if prerequisites are met (prereq mastery or self-rating >= 30%)
    const prereqsMet = topic.prerequisites.every(p => {
      const rec = p.prerequisite.masteryRecords[0]
      const prereqMastery =
        rec?.mastery !== null && rec?.mastery !== undefined
          ? rec.mastery
          : (rec?.selfAssessScore ?? 0) * 20
      return prereqMastery >= 30
    })

    // Deadline urgency for this topic's subject
    const topicDeadlines = deadlines.filter(d =>
      d.title.toLowerCase().includes(topic.subject.slug.toLowerCase())
    )
    const hasDeadlineToday = topicDeadlines.some(d => {
      const dDate = new Date(d.dueDate)
      return dDate.toDateString() === date.toDateString()
    })
    const collegeDeadlineUrgency = topicDeadlines.length > 0
      ? Math.min(10, 10 - Math.floor((new Date(topicDeadlines[0].dueDate).getTime() - date.getTime()) / 86400000))
      : 0

    const isUnassessed = mastery?.mastery === null || mastery?.mastery === undefined
    const currentMastery =
      !isUnassessed
        ? (mastery?.mastery ?? 0)
        : (mastery?.selfAssessScore ? mastery.selfAssessScore * 20 : 0)

    const daysSinceStudy = mastery?.lastStudiedAt
      ? Math.floor((date.getTime() - new Date(mastery.lastStudiedAt).getTime()) / 86400000)
      : 999

    priorityInputs.push({
      topicId: topic.id,
      topicName: topic.name,
      subjectName: topic.subject.name,
      mastery: currentMastery,
      confidence: mastery?.confidence ?? 1,
      accuracy: mastery?.accuracy ?? 0,
      importance: topic.importance,
      gateRelevance: topic.gateRelevance,
      careerRelevance: topic.careerRelevance,
      difficulty: topic.difficulty,
      estimatedMinutes: topic.estimatedMinutes,
      lastStudiedAt: mastery?.lastStudiedAt ? new Date(mastery.lastStudiedAt) : null,
      nextRevisionDue: revision?.dueDate ? new Date(revision.dueDate) : null,
      revisionInterval: revision?.interval ?? 2,
      hasPrerequisitesMet: prereqsMet,
      prerequisiteImpact: topic.dependents?.length ?? 0,
      collegeDeadlineUrgency,
      hasDeadlineToday,
      isUnassessed,
    })
  }

  // 6. Rank topics by priority
  const ranked = rankTopics(priorityInputs, {
    energyLevel,
    availableMinutes,
    gateTargetScore: user.gateTarget,
    careerPaths: JSON.parse(user.careerPaths),
    recentBurnoutRisk: burnoutRisk,
    consecutiveStudyDays: consecutiveDays,
  })

  // 7. Generate schedule blocks
  const rawBlocks = generateDailySchedule(ranked, windows, availableMinutes, energyLevel)
  const blocks = ensureVariety(rawBlocks)

  // 8. Save to DB
  await prisma.dailySchedule.upsert({
    where: {
      userId_date: {
        userId,
        date: new Date(date.toDateString()),
      },
    },
    update: {
      availableMinutes,
      energyLevel,
      recalculatedAt: new Date(),
      blocks: {
        deleteMany: {},
        create: blocks.map(b => ({
          order: b.order,
          startTime: b.startTime,
          endTime: b.endTime,
          durationMinutes: b.durationMinutes,
          blockType: b.blockType,
          label: b.label,
          title: b.title,
          description: b.description ?? '',
          topicId: b.topicId,
          activityType: b.activityType,
          priorityScore: b.priorityScore,
          reasonJson: b.reasonJson,
        })),
      },
    },
    create: {
      userId,
      date: new Date(date.toDateString()),
      availableMinutes,
      energyLevel,
      blocks: {
        create: blocks.map(b => ({
          order: b.order,
          startTime: b.startTime,
          endTime: b.endTime,
          durationMinutes: b.durationMinutes,
          blockType: b.blockType,
          label: b.label,
          title: b.title,
          description: b.description ?? '',
          topicId: b.topicId,
          activityType: b.activityType,
          priorityScore: b.priorityScore,
          reasonJson: b.reasonJson,
        })),
      },
    },
  })

  return { blocks, ranked: ranked.slice(0, 10), burnoutRisk }
}
