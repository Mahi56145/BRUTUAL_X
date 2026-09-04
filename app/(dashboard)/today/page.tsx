import { auth } from '@/auth'
import { prisma } from '@/lib/db'
import TodayClient from './TodayClient'

export default async function TodayPage() {
  const session = await auth()
  if (!session?.user?.id) return null

  const userId = session.user.id
  const now = new Date()
  const todayStr = now.toDateString()

  const user = await prisma.user.findUnique({ where: { id: userId } })
  if (!user) return null

  const checkIn = await prisma.dailyCheckIn.findUnique({
    where: { userId_date: { userId, date: new Date(todayStr) } },
  })

  const schedule = await prisma.dailySchedule.findUnique({
    where: { userId_date: { userId, date: new Date(todayStr) } },
    include: { blocks: { orderBy: { order: 'asc' } } },
  })

  // Enrich blocks with topic data
  let enrichedBlocks: any[] = []
  if (schedule) {
    enrichedBlocks = await Promise.all(
      schedule.blocks.map(async (block) => {
        if (!block.topicId) return { ...block, topic: null, mastery: null }
        const topic = await prisma.topic.findUnique({
          where: { id: block.topicId },
          include: {
            subject: true,
            masteryRecords: { where: { userId } },
          },
        })
        return {
          ...block,
          topic,
          mastery: topic?.masteryRecords[0]?.mastery ?? 0,
          subjectColor: topic?.subject.color ?? '#6c63ff',
          subjectName: topic?.subject.name ?? '',
        }
      })
    )
  }

  // Overtime slots today
  const overtimeSlots = await prisma.overtimeSlot.findMany({
    where: {
      userId,
      date: {
        gte: new Date(todayStr),
        lt: new Date(new Date(todayStr).getTime() + 86400000),
      },
    },
  })

  const missedYesterday = await prisma.missedSession.findFirst({
    where: {
      userId,
      date: {
        gte: new Date(new Date().setDate(new Date().getDate() - 1)),
        lt: new Date(todayStr),
      },
    },
  })

  return (
    <TodayClient
      user={{ id: user.id, name: user.name, accentColor: user.accentColor, realityCheckStyle: user.realityCheckStyle, realityCheckEnabled: user.realityCheckEnabled }}
      checkIn={checkIn ? { availableMinutes: checkIn.availableMinutes, energyLevel: checkIn.energyLevel } : null}
      schedule={schedule ? {
        id: schedule.id,
        availableMinutes: schedule.availableMinutes,
        energyLevel: schedule.energyLevel,
        generatedAt: schedule.generatedAt.toISOString(),
      } : null}
      blocks={enrichedBlocks}
      overtimeSlots={overtimeSlots.map(o => ({ id: o.id, startTime: o.startTime, endTime: o.endTime, purpose: o.purpose }))}
      hasMissedYesterday={!!missedYesterday}
    />
  )
}
