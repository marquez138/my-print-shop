// app/api/admin/designs/route.ts
export const runtime = 'nodejs'

import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { requireAdminAPI } from '@/lib/authz' // ← updated import

/**
 * GET /api/admin/designs?status=submitted
 */
export async function GET(req: Request) {
  const gate = await requireAdminAPI()
  if (!gate.ok) {
    const status = gate.status
    return NextResponse.json(
      { error: status === 401 ? 'Unauthorized' : 'Forbidden' },
      { status }
    )
  }

  const url = new URL(req.url)
  const status = url.searchParams.get('status')

  const designs = await prisma.design.findMany({
    where: status ? { status } : undefined,
    orderBy: { updatedAt: 'desc' },
    include: {
      placements: { select: { id: true, side: true, areaId: true } },
      comments: {
        select: { id: true, author: true, body: true, createdAt: true },
      },
    },
  })

  return NextResponse.json({
    designs: designs.map((d) => ({
      id: d.id,
      productId: d.productId,
      variantSku: d.variantSku,
      userId: d.userId,
      status: d.status,
      placementsCount: d.placements.length,
      updatedAt: d.updatedAt,
      comments: d.comments,
    })),
  })
}
