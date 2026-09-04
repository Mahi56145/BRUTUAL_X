import { auth } from '@/auth'
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function POST(req: Request) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const { availableMinutes, energyLevel, additionalNotes, date: dateStr } = body
  const date = dateStr ? new Date(dateStr) : new Date()

  await prisma.dailyCheckIn.upsert({
    where: { userId_date: { userId: session.user.id, date: new Date(date.toDateString()) } },
    update: { availableMinutes, energyLevel, additionalNotes },
    create: {
      userId: session.user.id,
      date: new Date(date.toDateString()),
      availableMinutes,
      energyLevel,
      additionalNotes,
    },
  })

  return NextResponse.json({ success: true })
}
