import { auth } from '@/auth'
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { generateScheduleForUser, getAvailableWindows } from '@/lib/scheduler'

export async function POST(req: Request) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await req.json()
  const { availableMinutes, energyLevel, date: dateStr } = body

  const user = await prisma.user.findUnique({ where: { id: session.user.id } })
  if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 })

  const date = dateStr ? new Date(dateStr) : new Date()

  // Fetch overtime slots for today
  const overtimeSlots = await prisma.overtimeSlot.findMany({
    where: {
      userId: user.id,
      date: {
        gte: new Date(date.toDateString()),
        lt: new Date(new Date(date.toDateString()).getTime() + 86400000),
      },
    },
  })

  const windows = getAvailableWindows(user.id, user.name, date, overtimeSlots)

  const result = await generateScheduleForUser({
    userId: user.id,
    date,
    availableMinutes: availableMinutes ?? 240,
    energyLevel: energyLevel ?? 'normal',
    windows,
  })

  return NextResponse.json(result)
}

export async function GET(req: Request) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { searchParams } = new URL(req.url)
  const dateStr = searchParams.get('date')
  const date = dateStr ? new Date(dateStr) : new Date()

  const schedule = await prisma.dailySchedule.findUnique({
    where: {
      userId_date: {
        userId: session.user.id,
        date: new Date(date.toDateString()),
      },
    },
    include: {
      blocks: {
        orderBy: { order: 'asc' },
        include: {
          // Include topic info via a manual query below
        },
      },
    },
  })

  if (!schedule) {
    return NextResponse.json({ schedule: null })
  }

  // Enrich blocks with topic data
  const enrichedBlocks = await Promise.all(
    schedule.blocks.map(async (block) => {
      if (!block.topicId) return { ...block, topic: null }
      const topic = await prisma.topic.findUnique({
        where: { id: block.topicId },
        include: {
          subject: true,
          masteryRecords: { where: { userId: session.user.id } },
        },
      })
      return { ...block, topic }
    })
  )

  return NextResponse.json({ schedule: { ...schedule, blocks: enrichedBlocks } })
}
