import { auth } from '@/auth'
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function GET() {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const periods = await prisma.relaxationPeriod.findMany({
    where: { userId: session.user.id },
    orderBy: { startDate: 'desc' },
  })

  return NextResponse.json({ periods })
}

export async function POST(req: Request) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await req.json()
    const { startDate, endDate, reason, examType = 'college_exam', mode = 'complete' } = body

    if (!startDate || !endDate || !reason) {
      return NextResponse.json({ error: 'Start date, end date, and reason are required' }, { status: 400 })
    }

    const period = await prisma.relaxationPeriod.create({
      data: {
        userId: session.user.id,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        reason,
        examType,
        mode,
        active: true,
      },
    })

    return NextResponse.json({ success: true, period })
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to create relaxation period' }, { status: 500 })
  }
}

export async function DELETE(req: Request) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { searchParams } = new URL(req.url)
    const id = searchParams.get('id')
    if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 })

    await prisma.relaxationPeriod.delete({
      where: { id, userId: session.user.id },
    })

    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to delete' }, { status: 500 })
  }
}
