import { auth } from '@/auth'
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function POST(req: Request) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const userId = session.user.id
    const body = await req.json().catch(() => ({}))
    const resetType = body.type || 'calibration' // 'calibration' | 'full'

    // Delete existing progress for this user
    await prisma.masteryHistory.deleteMany({
      where: { mastery: { userId } },
    })
    await prisma.topicMastery.deleteMany({
      where: { userId },
    })
    await prisma.spacedRevision.deleteMany({
      where: { userId },
    })
    await prisma.scheduleBlock.deleteMany({
      where: { schedule: { userId } },
    })
    await prisma.dailySchedule.deleteMany({
      where: { userId },
    })
    await prisma.sessionItem.deleteMany({
      where: { session: { userId } },
    })
    await prisma.studySession.deleteMany({
      where: { userId },
    })
    await prisma.missedSession.deleteMany({
      where: { userId },
    })
    await prisma.streak.upsert({
      where: { userId },
      update: {
        currentStreak: 0,
        longestStreak: 0,
        totalActiveDays: 0,
        lastActiveDate: null,
      },
      create: {
        userId,
        currentStreak: 0,
        longestStreak: 0,
        totalActiveDays: 0,
        lastActiveDate: null,
      },
    })

    // Reset user flags to trigger onboarding
    await prisma.user.update({
      where: { id: userId },
      data: {
        onboardingDone: false,
        xp: 0,
        level: 1,
      },
    })

    return NextResponse.json({
      success: true,
      message: 'User progress reset. You will be redirected to initial calibration.',
    })
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to reset profile' }, { status: 500 })
  }
}
