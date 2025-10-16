export const runtime = 'nodejs'

import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { prisma } from '@/lib/db'

/**
 * POST /api/designs/[id]/submit
 * Transitions a design from draft/changes_requested → submitted
 * and captures a snapshot of current artwork, color, and pricing.
 */
export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { userId } = await auth()
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await params

  try {
    const design = await prisma.design.findUnique({
      where: { id },
      include: { placements: true },
    })

    if (!design) {
      return NextResponse.json({ error: 'Design not found' }, { status: 404 })
    }

    // Allow only owner to submit
    if (design.userId !== userId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Only allow submission from editable states
    if (!['draft', 'changes_requested'].includes(design.status)) {
      return NextResponse.json(
        { error: `Cannot submit while status is '${design.status}'` },
        { status: 400 }
      )
    }

    // ---- Build snapshot ----
    const snapshot = {
      productId: design.productId,
      color: design.color,
      pricing: {
        base: design.pricingBase,
        fees: design.pricingFees,
        total: design.pricingTotal,
      },
      placements: design.placements.map((p) => ({
        side: p.side,
        areaId: p.areaId,
        url: p.url,
        x: p.x,
        y: p.y,
        scale: p.scale,
        rotation: p.rotation,
        widthPx: p.widthPx,
        heightPx: p.heightPx,
      })),
    }

    // ---- Update design ----
    const updated = await prisma.design.update({
      where: { id },
      data: {
        status: 'submitted',
        submittedAt: new Date(),
        submittedSnapshot: snapshot,
      },
      include: { placements: true, comments: true },
    })

    return NextResponse.json({ design: updated })
  } catch (err: any) {
    console.error('[POST /api/designs/:id/submit]', err)
    return NextResponse.json(
      { error: 'Server error', detail: err.message },
      { status: 500 }
    )
  }
}
