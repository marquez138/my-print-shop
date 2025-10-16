export const runtime = 'nodejs'

import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { auth } from '@clerk/nextjs/server'

/**
 * POST /api/admin/designs/[id]/reject
 * Body: { message: string }
 */
export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  const { userId } = await auth()
  if (!userId)
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // ✅ Check admin via DB
  const me = await prisma.customer.findFirst({
    where: { clerkUserId: userId },
    select: { role: true },
  })
  if (me?.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const designId = params.id
  if (!designId) {
    return NextResponse.json({ error: 'Missing ID' }, { status: 400 })
  }

  const { message } = await req.json().catch(() => ({} as any))
  if (!message || typeof message !== 'string') {
    return NextResponse.json(
      { error: 'A rejection message is required.' },
      { status: 400 }
    )
  }

  try {
    const design = await prisma.design.findUnique({ where: { id: designId } })
    if (!design)
      return NextResponse.json({ error: 'Design not found' }, { status: 404 })
    if (design.status !== 'submitted') {
      return NextResponse.json(
        { error: 'Only submitted designs can be rejected.' },
        { status: 400 }
      )
    }

    const updated = await prisma.design.update({
      where: { id: designId },
      data: {
        status: 'rejected',
        updatedAt: new Date(),
        comments: { create: { author: 'admin', body: message } },
      },
      include: { comments: true, lineItems: true, placements: true },
    })

    return NextResponse.json({ design: updated })
  } catch (err: any) {
    console.error('[ADMIN_REJECT]', err)
    return NextResponse.json(
      { error: 'Server error', detail: err.message },
      { status: 500 }
    )
  }
}
