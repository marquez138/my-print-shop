// app/api/admin/designs/[id]/approve/route.ts
export const runtime = 'nodejs'

import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { auth } from '@clerk/nextjs/server'

async function ensureAdmin() {
  const { userId, sessionClaims } = await auth()
  if (!userId) throw new Error('Unauthorized')
  // adapt this check to your role source (Prisma Customer.role or Clerk org/metadata)
  // For MVP, assume you have a Customer row:
  const customer = await prisma.customer.findFirst({
    where: { clerkUserId: userId },
  })
  if (!customer || customer.role !== 'ADMIN') throw new Error('Forbidden')
  return userId
}

export async function POST(
  req: Request,
  ctx: { params: Promise<{ id: string }> }
) {
  try {
    await ensureAdmin()
    const { id } = await ctx.params
    const design = await prisma.design.update({
      where: { id },
      data: { status: 'approved' },
    })
    return NextResponse.json({ design })
  } catch (e: any) {
    const msg = e.message || 'Error'
    const code = msg === 'Unauthorized' ? 401 : msg === 'Forbidden' ? 403 : 400
    return NextResponse.json({ error: msg }, { status: code })
  }
}
