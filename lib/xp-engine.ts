import { prisma } from '@/lib/db'

export function calculateLevel(xp: number): number {
  // Level formula: Level = Math.floor(Math.sqrt(xp / 100)) + 1
  // Lvl 1: 0-99 XP
  // Lvl 2: 100-399 XP
  // Lvl 3: 400-899 XP
  // Lvl 4: 900-1599 XP
  // Lvl 5: 1600-2499 XP, etc.
  return Math.floor(Math.sqrt(Math.max(0, xp) / 100)) + 1
}

export function xpForNextLevel(currentLevel: number): number {
  return currentLevel * currentLevel * 100
}

export async function awardUserXP(userId: string, amount: number, reason?: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { xp: true, level: true },
  })
  if (!user) return null

  const newXP = user.xp + amount
  const newLevel = calculateLevel(newXP)
  const leveledUp = newLevel > user.level

  await prisma.user.update({
    where: { id: userId },
    data: {
      xp: newXP,
      level: newLevel,
    },
  })

  return {
    oldXP: user.xp,
    newXP,
    oldLevel: user.level,
    newLevel,
    leveledUp,
    gained: amount,
    reason,
  }
}

export async function unlockAchievement(userId: string, slug: string) {
  const ach = await prisma.achievement.findUnique({
    where: { slug },
  })
  if (!ach) return null

  const existing = await prisma.userAchievement.findUnique({
    where: {
      userId_achievementId: {
        userId,
        achievementId: ach.id,
      },
    },
  })

  if (existing) return null // Already unlocked

  const unlocked = await prisma.userAchievement.create({
    data: {
      userId,
      achievementId: ach.id,
    },
  })

  // Award XP for achievement
  if (ach.xpReward > 0) {
    await awardUserXP(userId, ach.xpReward, `Achievement: ${ach.title}`)
  }

  return {
    achievement: ach,
    unlockedAt: unlocked.unlockedAt,
  }
}
