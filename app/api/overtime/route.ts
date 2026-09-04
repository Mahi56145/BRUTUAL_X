import { auth } from '@/auth'
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function POST(req: Request) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const { startTime, endTime, purpose, date: dateStr } = body
  const date = dateStr ? new Date(dateStr) : new Date()

  const slot = await prisma.overtimeSlot.create({
    data: {
      userId: session.user.id,
      date: new Date(date.toDateString()),
      startTime,
      endTime,
      purpose: purpose ?? 'anything',
    },
  })

  return NextResponse.json({ slot })
}
