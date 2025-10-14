// app/admin/layout.tsx
import { auth } from '@clerk/nextjs/server'
import { prisma } from '@/lib/db'
import { redirect } from 'next/navigation'

export const dynamic = 'force-dynamic'

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { userId } = await auth()
  if (!userId) redirect('/sign-in?redirect_url=/admin')

  const me = await prisma.customer.findFirst({
    where: { clerkUserId: userId },
    select: { role: true },
  })

  if (me?.role !== 'ADMIN') redirect('/admin') // or a 404/notFound() if you prefer

  return <>{children}</>
}
