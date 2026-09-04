import { prisma } from '@/lib/db'

export interface StreakStatus {
  currentStreak: number
  longestStreak: number
  totalActiveDays: number
  lastActiveDate: Date | null
  isFrozen: boolean
  freezeReason?: string
  freezeEnd?: Date
}

export async function getUserStreakStatus(userId: string): Promise<StreakStatus> {
  const streak = await prisma.streak.findUnique({
    where: { userId },
  })

  const now = new Date()
  const today = new Date(now.toDateString())

  // Check active relaxation period
  const activeRelaxation = await prisma.relaxationPeriod.findFirst({
    where: {
      userId,
      active: true,
      startDate: { lte: now },
      endDate: { gte: now },
    },
  })

  if (!streak) {
    return {
      currentStreak: 0,
      longestStreak: 0,
      totalActiveDays: 0,
      lastActiveDate: null,
      isFrozen: !!activeRelaxation,
      freezeReason: activeRelaxation?.reason,
      freezeEnd: activeRelaxation?.endDate,
    }
  }

  // Check if streak broke (unless frozen)
  let currentStreak = streak.currentStreak
  if (streak.lastActiveDate && !activeRelaxation) {
    const lastDate = new Date(new Date(streak.lastActiveDate).toDateString())
    const diffDays = Math.floor((today.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24))

    // If more than 1 full day missed without relaxation
    if (diffDays > 1) {
      currentStreak = 0
      // Persist reset if not yet recorded
      await prisma.streak.update({
        where: { userId },
        data: { currentStreak: 0 },
      })
    }
  }

  return {
    currentStreak,
    longestStreak: streak.longestStreak,
    totalActiveDays: streak.totalActiveDays,
    lastActiveDate: streak.lastActiveDate,
    isFrozen: !!activeRelaxation,
    freezeReason: activeRelaxation?.reason,
    freezeEnd: activeRelaxation?.endDate,
  }
}

export async function recordUserActivity(userId: string): Promise<StreakStatus> {
  const now = new Date()
  const today = new Date(now.toDateString())

  let streak = await prisma.streak.findUnique({
    where: { userId },
  })

  if (!streak) {
    streak = await prisma.streak.create({
      data: {
        userId,
        currentStreak: 1,
        longestStreak: 1,
        totalActiveDays: 1,
        lastActiveDate: now,
      },
    })
    return {
      currentStreak: 1,
      longestStreak: 1,
      totalActiveDays: 1,
      lastActiveDate: now,
      isFrozen: false,
    }
  }

  // Check if already recorded today
  if (streak.lastActiveDate) {
    const lastDate = new Date(new Date(streak.lastActiveDate).toDateString())
    if (lastDate.getTime() === today.getTime()) {
      return {
        currentStreak: streak.currentStreak,
        longestStreak: streak.longestStreak,
        totalActiveDays: streak.totalActiveDays,
        lastActiveDate: streak.lastActiveDate,
        isFrozen: false,
      }
    }
  }

  // Check if yesterday or within allowable freeze
  let newStreak = 1
  if (streak.lastActiveDate) {
    const lastDate = new Date(new Date(streak.lastActiveDate).toDateString())
    const diffDays = Math.floor((today.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24))

    if (diffDays === 1) {
      newStreak = streak.currentStreak + 1
    } else {
      // Check if intermediate days were covered by an active relaxation period
      const coveredRelaxation = await prisma.relaxationPeriod.findFirst({
        where: {
          userId,
          startDate: { lte: today },
          endDate: { gte: lastDate },
        },
      })

      if (coveredRelaxation) {
        newStreak = streak.currentStreak + 1
      } else {
        newStreak = 1
      }
    }
  }

  const newLongest = Math.max(streak.longestStreak, newStreak)
  const newTotalDays = streak.totalActiveDays + 1

  const updated = await prisma.streak.update({
    where: { userId },
    data: {
      currentStreak: newStreak,
      longestStreak: newLongest,
      totalActiveDays: newTotalDays,
      lastActiveDate: now,
    },
  })

  // Check streak milestone achievements
  if (newStreak >= 7) {
    const ach7 = await prisma.achievement.findUnique({ where: { slug: 'first-7-day-streak' } })
    if (ach7) {
      await prisma.userAchievement.upsert({
        where: { userId_achievementId: { userId, achievementId: ach7.id } },
        update: {},
        create: { userId, achievementId: ach7.id },
      })
    }
  }
  if (newStreak >= 30) {
    const ach30 = await prisma.achievement.findUnique({ where: { slug: 'first-30-day-streak' } })
    if (ach30) {
      await prisma.userAchievement.upsert({
        where: { userId_achievementId: { userId, achievementId: ach30.id } },
        update: {},
        create: { userId, achievementId: ach30.id },
      })
    }
  }

  return {
    currentStreak: updated.currentStreak,
    longestStreak: updated.longestStreak,
    totalActiveDays: updated.totalActiveDays,
    lastActiveDate: updated.lastActiveDate,
    isFrozen: false,
  }
}
