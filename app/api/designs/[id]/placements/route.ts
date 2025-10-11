import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { prisma } from '@/lib/db'
import { PRINT_AREAS } from '@/config/print-areas'
import { computeTotals } from '@/lib/pricing'

type Side = 'front' | 'back' | 'sleeve'

export async function POST(
  req: Request,
  ctx: { params: Promise<{ id: string }> }
) {
  const { userId } = await auth()
  const { id: designId } = await ctx.params

  try {
    const body = await req.json()
    const {
      side, // REQUIRED: 'front' | 'back' | 'sleeve'
      areaId, // id from PRINT_AREAS
      assetId,
      url,
      widthPx,
      heightPx,
      dpi,
    } = body as {
      side: Side
      areaId: string
      assetId: string
      url: string
      widthPx: number
      heightPx: number
      dpi?: number
    }

    // Validate area matches side
    const area = PRINT_AREAS.find((a) => a.id === areaId)
    if (!area)
      return NextResponse.json(
        { error: `Unknown areaId "${areaId}"` },
        { status: 400 }
      )
    if (area.side !== side) {
      return NextResponse.json(
        {
          error: `areaId "${areaId}" belongs to side "${area.side}", not "${side}"`,
        },
        { status: 400 }
      )
    }

    // Ownership + status checks
    const design = await prisma.design.findUnique({
      where: { id: designId },
      select: { id: true, userId: true, status: true, pricingBase: true },
    })
    if (!design)
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    if (design.userId && design.userId !== userId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }
    if (!['draft', 'changes_requested'].includes(design.status)) {
      return NextResponse.json(
        { error: `Design is not editable in status "${design.status}"` },
        { status: 400 }
      )
    }

    // ✅ One-per-side: upsert by composite key
    const placement = await prisma.designPlacement.upsert({
      where: { designId_side: { designId, side } }, // <-- key point
      update: {
        areaId,
        assetId,
        url,
        widthPx,
        heightPx,
        dpi,
        x: 0,
        y: 0,
        scale: 1,
        rotation: 0,
      },
      create: {
        designId,
        side,
        areaId,
        assetId,
        url,
        widthPx,
        heightPx,
        dpi,
        x: 0,
        y: 0,
        scale: 1,
        rotation: 0,
      },
    })

    // Recompute totals from all placements
    const all = await prisma.designPlacement.findMany({
      where: { designId },
      select: { areaId: true, url: true },
    })
    const uploads: Record<string, string> = {}
    for (const p of all) if (p.url) uploads[p.areaId] = p.url

    const totals = computeTotals(design.pricingBase, uploads)

    const updated = await prisma.design.update({
      where: { id: designId },
      data: { pricingFees: totals.fees, pricingTotal: totals.total },
      include: {
        placements: true,
        comments: { orderBy: { createdAt: 'asc' } },
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
      placement,
    })
  } catch (err: any) {
    console.error('[POST /api/designs/:id/placements]', err)
    return NextResponse.json(
      { error: 'Server error', detail: err.message },
      { status: 500 }
    )
  }
}
