import { auth } from '@/auth'
import { NextResponse } from 'next/server'
import { getUserStreakStatus } from '@/lib/streak-engine'

export async function GET() {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const streak = await getUserStreakStatus(session.user.id)
  return NextResponse.json(streak)
}
