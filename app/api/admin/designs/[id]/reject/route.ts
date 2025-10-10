// app/api/admin/designs/[id]/reject/route.ts
export const runtime = 'nodejs'

import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { prisma } from '@/lib/db'

async function ensureAdmin() {
  const { userId } = await auth()
  if (!userId) throw Object.assign(new Error('Unauthorized'), { status: 401 })
  const me = await prisma.customer.findFirst({ where: { clerkUserId: userId } })
  if (!me || me.role !== 'ADMIN') {
    throw Object.assign(new Error('Forbidden'), { status: 403 })
  }
  return userId
}

export async function POST(
  req: Request,
  ctx: { params: Promise<{ id: string }> }
) {
  try {
    await ensureAdmin()
    const { id } = await ctx.params

    const { reason } = (await req.json().catch(() => ({}))) as {
      reason?: string
    }
    if (!reason || !reason.trim()) {
      return NextResponse.json({ error: 'Missing reason' }, { status: 400 })
    }

    const design = await prisma.design.findUnique({ where: { id } })
    if (!design)
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    if (design.status !== 'submitted') {
      return NextResponse.json(
        { error: 'Invalid state: only submitted designs can be rejected' },
        { status: 400 }
      )
    }

    const updated = await prisma.design.update({
      where: { id },
      data: { status: 'rejected' },
    })

    // Optional: store a comment if the model exists (ignored if not present)
    try {
      await (prisma as any).designComment?.create({
        data: {
          designId: id,
          author: 'admin',
          body: `Rejected: ${reason}`,
        },
      })
    } catch {
      // no-op if table not present
    }

    return NextResponse.json({ design: updated })
  } catch (e: any) {
    const status = e?.status ?? 500
    return NextResponse.json(
      { error: e?.message ?? 'Server error' },
      { status }
    )
  }
}
