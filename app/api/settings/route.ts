import { auth } from '@/auth'
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function GET() {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      id: true,
      name: true,
      email: true,
      accentColor: true,
      gateTarget: true,
      careerPaths: true,
      realityCheckStyle: true,
      realityCheckEnabled: true,
      xp: true,
      level: true,
      onboardingDone: true,
    },
  })

  return NextResponse.json({ user })
}

export async function PATCH(req: Request) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await req.json()
    const {
      realityCheckStyle,
      realityCheckEnabled,
      gateTarget,
      careerPaths,
    } = body

    const updateData: any = {}
    if (realityCheckStyle !== undefined) updateData.realityCheckStyle = realityCheckStyle
    if (realityCheckEnabled !== undefined) updateData.realityCheckEnabled = realityCheckEnabled
    if (gateTarget !== undefined) updateData.gateTarget = Number(gateTarget)
    if (careerPaths !== undefined) updateData.careerPaths = JSON.stringify(careerPaths)

    const updated = await prisma.user.update({
      where: { id: session.user.id },
      data: updateData,
    })

    return NextResponse.json({ success: true, user: updated })
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to update settings' }, { status: 500 })
  }
}
