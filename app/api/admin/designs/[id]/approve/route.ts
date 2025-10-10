// app/api/admin/designs/[id]/approve/route.ts
export const runtime = 'nodejs'

import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { prisma } from '@/lib/db'

async function ensureAdmin() {
  const { userId } = await auth()
  if (!userId) throw Object.assign(new Error('Unauthorized'), { status: 401 })
  const me = await prisma.customer.findFirst({
    where: { clerkUserId: userId },
    select: { role: true },
  })
  if (me?.role !== 'ADMIN')
    throw Object.assign(new Error('Forbidden'), { status: 403 })
  return userId
}

export async function POST(
  _req: Request,
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
    const status = e?.status ?? 500
    return NextResponse.json(
      { error: e?.message || 'Server error' },
      { status }
    )
  }
}
