// app/api/designs/[id]/route.ts
export const runtime = 'nodejs'

import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { prisma } from '@/lib/db'

/**
 * GET /api/designs/:id
 * Returns one design with all placements and comments
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
        },
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

    return NextResponse.json({ design })
  } catch (err: any) {
    console.error('[GET /api/designs/:id]', err)
    return NextResponse.json(
      { error: 'Server error', detail: err.message },
      { status: 500 }
    )
  }
}
