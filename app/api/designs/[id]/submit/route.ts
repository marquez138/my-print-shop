import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { prisma } from '@/lib/db'

/**
 * POST /api/designs/:id/submit
 * Moves draft or changes_requested → submitted (if at least 1 placement exists)
 */
export async function POST(
  _req: Request,
  ctx: { params: Promise<{ id: string }> }
) {
  const { userId } = await auth()
  const { id } = await ctx.params

  try {
    const design = await prisma.design.findUnique({
      where: { id },
      include: { placements: true },
    })
    if (!design)
      return NextResponse.json({ error: 'Not found' }, { status: 404 })

    // owner check (admins can also submit on behalf if you want)
    if (design.userId && design.userId !== userId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // must be draft or changes_requested
    if (!['draft', 'changes_requested'].includes(design.status)) {
      return NextResponse.json(
        { error: `Cannot submit from status "${design.status}"` },
        { status: 400 }
      )
    }

    // require at least one placement
    if (design.placements.length === 0) {
      return NextResponse.json(
        { error: 'Add at least one artwork placement before submitting.' },
        { status: 400 }
      )
    }

    const updated = await prisma.design.update({
      where: { id },
      data: { status: 'submitted' },
      include: {
        placements: true,
        comments: { orderBy: { createdAt: 'asc' } },
      },
    })

    // Optional: append a system comment for audit
    await prisma.designComment.create({
      data: {
        designId: id,
        author: 'user',
        body: 'User submitted design for approval.',
      },
    })

    return NextResponse.json({
      ok: true,
      design: {
        ...updated,
        comments: updated.comments.map((c) => ({
          ...c,
          createdAt: c.createdAt.toISOString(),
        })),
      },
    })
  } catch (err: any) {
    console.error('[POST /api/designs/:id/submit]', err)
    return NextResponse.json(
      { error: 'Server error', detail: err.message },
      { status: 500 }
    )
  }
}
