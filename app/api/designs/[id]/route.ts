// app/api/designs/[id]/route.ts
export const runtime = 'nodejs'

import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { prisma } from '@/lib/db'

/**
 * GET /api/designs/:id
 * Returns one design with placements and comments (comments are ISO-string dates for client use)
 */
export async function GET(
  _req: Request,
  ctx: { params: Promise<{ id: string }> }
) {
  const { userId } = await auth()
  const { id: designId } = await ctx.params

  try {
    const design = await prisma.design.findUnique({
      where: { id: designId },
      include: {
        placements: true,
        comments: {
          orderBy: { createdAt: 'asc' },
          select: { id: true, author: true, body: true, createdAt: true },
        },
        lineItems: { orderBy: { size: 'asc' } }, // 👈 add this
      },
    })

    if (!design) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }

    // Only allow owner or admin to view
    if (design.userId && design.userId !== userId) {
      const me = await prisma.customer.findFirst({
        where: { clerkUserId: userId ?? '' },
        select: { role: true },
      })
      if (me?.role !== 'ADMIN') {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
      }
    }

    // 🔧 Serialize Date → string for client components that expect strings
    const payload = {
      ...design,
      comments: design.comments.map((c) => ({
        ...c,
        createdAt: c.createdAt.toISOString(),
      })),
      // (If you ever need to serialize placement dates, do it here too.)
    }

    return NextResponse.json({ design: payload })
  } catch (err: any) {
    console.error('[GET /api/designs/:id]', err)
    return NextResponse.json(
      { error: 'Server error', detail: err.message },
      { status: 500 }
    )
  }
}

export async function DELETE(
  _req: Request,
  ctx: { params: Promise<{ id: string }> }
) {
  const { userId } = await auth()
  if (!userId)
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await ctx.params

  try {
    const design = await prisma.design.findUnique({
      where: { id },
      select: { id: true, userId: true, status: true },
    })
    if (!design)
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    if (design.userId !== userId)
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    // ✅ Business rule:
    // Users can delete: draft, changes_requested, submitted
    // Users cannot delete: approved, ordered  (adjust to taste)
    const deletable = ['draft', 'changes_requested', 'submitted', 'approved']
    if (!deletable.includes(design.status)) {
      return NextResponse.json(
        { error: `Design in status "${design.status}" cannot be deleted.` },
        { status: 400 }
      )
    }

    // If relations aren’t cascading in schema, uncomment:
    // await prisma.designPlacement.deleteMany({ where: { designId: id } })
    // await prisma.designComment.deleteMany({ where: { designId: id } })

    await prisma.design.delete({ where: { id } })
    return NextResponse.json({ ok: true })
  } catch (err: any) {
    console.error('[DELETE /api/designs/:id]', err)
    return NextResponse.json(
      { error: 'Server error', detail: err.message },
      { status: 500 }
    )
  }
}
