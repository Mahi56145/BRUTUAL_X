import { auth } from '@/auth'
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { calculateNewMastery } from '@/lib/scheduler/mastery-engine'
import { calculateNextRevision } from '@/lib/scheduler/revision-engine'
import { recordUserActivity } from '@/lib/streak-engine'
import { awardUserXP, unlockAchievement } from '@/lib/xp-engine'

export async function POST(req: Request) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const userId = session.user.id
  const body = await req.json()
  const {
    topicId,
    blockId,
    status,
    understanding,
    questionsAttempted = 0,
    questionsCorrect = 0,
    actualMinutes = 60,
    plannedMinutes = 60,
  } = body

  // 1. Update schedule block status if blockId provided
  if (blockId) {
    await prisma.scheduleBlock.update({
      where: { id: blockId },
      data: {
        status: status || 'completed',
        understanding,
        questionsAttempted,
        questionsCorrect,
        actualMinutes,
        completedAt: status !== 'skipped' ? new Date() : null,
      },
    })
  }

  if (!topicId || status === 'skipped') {
    return NextResponse.json({ success: true })
  }

  // 2. Get or create mastery record
  let masteryRecord = await prisma.topicMastery.findUnique({
    where: { userId_topicId: { userId, topicId } },
  })

  if (!masteryRecord) {
    masteryRecord = await prisma.topicMastery.create({
      data: {
        userId,
        topicId,
        mastery: null,
        confidence: 1,
        accuracy: 0,
        isAssessed: false,
      },
    })
  }

  const oldMastery = masteryRecord.mastery

  // 3. Calculate new mastery
  const newValues = calculateNewMastery(masteryRecord, {
    status: status || 'completed',
    understanding: understanding ?? 3,
    questionsAttempted,
    questionsCorrect,
    actualMinutes,
    plannedMinutes,
  })

  const updatedMastery = await prisma.topicMastery.update({
    where: { id: masteryRecord.id },
    data: {
      ...newValues,
      isAssessed: true,
      lastStudiedAt: new Date(),
    },
  })

  // 4. Add to history if mastery is calculated
  if (updatedMastery.mastery !== null) {
    await prisma.masteryHistory.create({
      data: {
        masteryId: masteryRecord.id,
        masteryValue: updatedMastery.mastery,
      },
    })
  }

  // 5. Update spaced revision schedule
  const quality = understanding ?? 3
  const revision = await prisma.spacedRevision.findUnique({
    where: { userId_topicId: { userId, topicId } },
  })

  const currentRevision = {
    interval: revision?.interval ?? 2,
    ease: revision?.ease ?? 2.5,
    repetitions: revision?.repetitions ?? 0,
    dueDate: revision?.dueDate ? new Date(revision.dueDate) : new Date(),
  }

  const nextRevision = calculateNextRevision(currentRevision, quality)

  await prisma.spacedRevision.upsert({
    where: { userId_topicId: { userId, topicId } },
    update: {
      dueDate: nextRevision.dueDate,
      interval: nextRevision.interval,
      ease: nextRevision.ease,
      repetitions: nextRevision.repetitions,
      lastScore: questionsAttempted > 0 ? questionsCorrect / questionsAttempted : 0.6,
    },
    create: {
      userId,
      topicId,
      dueDate: nextRevision.dueDate,
      interval: nextRevision.interval,
      ease: nextRevision.ease,
      repetitions: nextRevision.repetitions,
      lastScore: questionsAttempted > 0 ? questionsCorrect / questionsAttempted : 0.6,
    },
  })

  // 6. Record real study session for study minutes stats
  const today = new Date(new Date().toDateString())
  let studySession = await prisma.studySession.findFirst({
    where: {
      userId,
      date: today,
    },
  })

  if (!studySession) {
    studySession = await prisma.studySession.create({
      data: {
        userId,
        date: today,
        totalMinutes: actualMinutes,
      },
    })
  } else {
    studySession = await prisma.studySession.update({
      where: { id: studySession.id },
      data: {
        totalMinutes: { increment: actualMinutes },
      },
    })
  }

  await prisma.sessionItem.create({
    data: {
      sessionId: studySession.id,
      topicId,
      activityType: 'learn',
      plannedMinutes: actualMinutes,
      actualMinutes: actualMinutes,
      status: 'completed',
      understanding: understanding ?? 3,
      questionsAttempted,
      questionsCorrect,
    },
  })

  // 7. Update real streak!
  const streakStatus = await recordUserActivity(userId)

  // 8. Gamification: Award XP and unlock achievements
  const baseXP = 50
  const bonusXP = (questionsAttempted > 0 && (questionsCorrect / questionsAttempted) >= 0.8) ? 30 : 0
  await awardUserXP(userId, baseXP + bonusXP, 'Completed study session')

  // Achievement: First Session
  await unlockAchievement(userId, 'first-session')

  // Achievement: Sharp Mind (80%+ accuracy)
  if (questionsAttempted >= 3 && (questionsCorrect / questionsAttempted) >= 0.8) {
    await unlockAchievement(userId, 'accuracy-80')
  }

  // Achievement: Weakness Conquered
  if (oldMastery !== null && oldMastery < 40 && (updatedMastery.mastery ?? 0) >= 70) {
    await unlockAchievement(userId, 'first-weak-topic-mastered')
  }

  return NextResponse.json({
    success: true,
    mastery: updatedMastery,
    nextRevision,
    streak: streakStatus,
    xpAwarded: baseXP + bonusXP,
  })
}
