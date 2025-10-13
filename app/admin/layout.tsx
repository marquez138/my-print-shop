// app/admin/layout.tsx (or /page.tsx)
import { auth } from '@clerk/nextjs/server'
import { prisma } from '@/lib/db'
import { redirect } from 'next/navigation'

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { userId } = await auth()
  if (!userId) redirect('/sign-in') // middleware should handle, but safe

  const me = await prisma.customer.findFirst({
    where: { clerkUserId: userId },
    select: { role: true },
  })

  if (me?.role !== 'ADMIN') redirect('/account') // not an admin

  return <>{children}</>
}
