import { auth } from '@/auth'
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function GET() {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        id: true,
        name: true,
        gateTarget: true,
        careerPaths: true,
        realityCheckStyle: true,
        onboardingDone: true,
      },
    })

    const subjects = await prisma.subject.findMany({
      orderBy: { order: 'asc' },
      include: {
        topics: {
          orderBy: { order: 'asc' },
          select: {
            id: true,
            name: true,
            slug: true,
            importance: true,
            difficulty: true,
            gateRelevance: true,
            careerRelevance: true,
          },
        },
      },
    })

    return NextResponse.json({
      user,
      subjects,
    })
  } catch (err: any) {
    console.error('[Onboarding API] Failed to fetch data from database:', err)
    return NextResponse.json(
      { error: 'Failed to fetch database records', details: err?.message || String(err) },
      { status: 500 }
    )
  }
}

export async function POST(req: Request) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await req.json()
    const {
      assessments = {}, // { [topicId: string]: number (0-5) }
      gateTarget = 650,
      careerPaths = [],
      realityCheckStyle = 'savage',
      dailyStudyHours = 3,
    } = body

    const userId = session.user.id

    // 1. Process assessments into TopicMastery records
    // Only topics with selfAssessScore > 0 or explicit assessment get recorded
    const topicIds = Object.keys(assessments)
    for (const topicId of topicIds) {
      const score = Number(assessments[topicId])
      if (isNaN(score) || score < 0 || score > 5) continue

      await prisma.topicMastery.upsert({
        where: {
          userId_topicId: {
            userId,
            topicId,
          },
        },
        update: {
          selfAssessScore: score,
          confidence: Math.max(1, score),
          // Mastery remains NULL — honest system rule! Only real quiz/session data sets it.
        },
        create: {
          userId,
          topicId,
          selfAssessScore: score,
          confidence: Math.max(1, score),
          mastery: null, // Unassessed until real attempts
          isAssessed: false,
          accuracy: 0.0,
          questionsAttempted: 0,
          questionsCorrect: 0,
        },
      })
    }

    // 2. Ensure Streak record exists
    await prisma.streak.upsert({
      where: { userId },
      update: {},
      create: {
        userId,
        currentStreak: 0,
        longestStreak: 0,
        totalActiveDays: 0,
      },
    })

    // 3. Award 'first-assessment' achievement
    const ach = await prisma.achievement.findUnique({
      where: { slug: 'first-assessment' },
    })
    if (ach) {
      await prisma.userAchievement.upsert({
        where: {
          userId_achievementId: {
            userId,
            achievementId: ach.id,
          },
        },
        update: {},
        create: {
          userId,
          achievementId: ach.id,
        },
      })
    }

    // 4. Update user profile and mark onboardingDone = true
    await prisma.user.update({
      where: { id: userId },
      data: {
        onboardingDone: true,
        gateTarget: Number(gateTarget) || 650,
        careerPaths: JSON.stringify(careerPaths),
        realityCheckStyle: realityCheckStyle || 'savage',
        xp: { increment: ach?.xpReward || 75 },
      },
    })

    return NextResponse.json({
      success: true,
      message: 'Onboarding completed successfully',
      awardedXp: ach?.xpReward || 75,
    })
  } catch (error: any) {
    console.error('Onboarding error:', error)
    return NextResponse.json({ error: error.message || 'Failed to complete onboarding' }, { status: 500 })
  }
}
