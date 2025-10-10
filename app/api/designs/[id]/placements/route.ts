// app/api/designs/[id]/placements/route.ts  (POST: upsert placement per side)
export const runtime = 'nodejs'

import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { prisma } from '@/lib/db'
import { areaInfoOrThrow } from '@/lib/print-areas' // your server-side area map: { price, side }

export async function POST(
  req: Request,
  ctx: { params: Promise<{ id: string }> }
) {
  const { userId } = await auth()
  if (!userId)
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id: designId } = await ctx.params

  const body = await req.json()
  const { areaId, assetId, url, widthPx, heightPx } = body as {
    areaId: string
    assetId: string
    url: string
    widthPx: number
    heightPx: number
  }
  if (!areaId || !assetId || !url || !widthPx || !heightPx) {
    return NextResponse.json({ error: 'Missing fields' }, { status: 400 })
  }

  const info = areaInfoOrThrow(areaId)
  const side = info.side

  const design = await prisma.design.findUnique({ where: { id: designId } })
  if (!design || design.userId !== userId) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }
  if (!['draft', 'changes_requested'].includes(design.status)) {
    return NextResponse.json({ error: 'Design is locked' }, { status: 403 })
  }

  await prisma.designPlacement.upsert({
    where: { designId_side: { designId, side } },
    update: { areaId, assetId, url, widthPx, heightPx },
    create: { designId, side, areaId, assetId, url, widthPx, heightPx },
  })

  // recompute fees from all placements
  const placements = await prisma.designPlacement.findMany({
    where: { designId },
    select: { areaId: true },
  })
  const fees = placements.reduce(
    (sum, p) => sum + areaInfoOrThrow(p.areaId).price,
    0
  )

  const updated = await prisma.design.update({
    where: { id: designId },
    data: { pricingFees: fees, pricingTotal: design.pricingBase + fees },
  })

  return NextResponse.json({ design: updated })
}
