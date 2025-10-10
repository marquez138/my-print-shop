// lib/api-guard.ts
import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { prisma } from '@/lib/db'

export async function ensureAdminOrJson() {
  const { userId } = await auth()
  if (!userId)
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const me = await prisma.customer.findFirst({
    where: { clerkUserId: userId },
    select: { role: true },
  })
  if (me?.role !== 'ADMIN')
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  return null // OK
}
