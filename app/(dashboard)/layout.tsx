import { auth } from '@/auth'
import { redirect } from 'next/navigation'
import Sidebar from '@/components/layout/Sidebar'
import { prisma } from '@/lib/db'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await auth()
  if (!session?.user?.id) redirect('/login')

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { onboardingDone: true },
  })

  if (!user?.onboardingDone) {
    redirect('/onboarding')
  }

  return (
    <div className="app-layout">
      <Sidebar userName={session.user.name || ''} userId={session.user.id || ''} />
      <main className="main-content">
        {children}
      </main>
    </div>
  )
}
