// app/api/admin/designs/route.ts
export const runtime = 'nodejs'

import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { requireAdminAPI } from '@/lib/authz'

/**
 * GET /api/admin/designs?status=submitted
 * Lists designs for the admin dashboard (optionally filter by status)
 */
export async function GET(req: Request) {
  const gate = await requireAdminAPI()
  if (!gate.authorized) {
    const status = gate.status
    return NextResponse.json(
      { error: status === 401 ? 'Unauthorized' : 'Forbidden' },
      { status }
    )
  }

  const url = new URL(req.url)
  const statusFilter = url.searchParams.get('status') ?? undefined

  const designs = await prisma.design.findMany({
    where: statusFilter ? { status: statusFilter } : undefined,
    orderBy: { updatedAt: 'desc' },
    include: {
      placements: { select: { id: true, side: true, areaId: true } },
      comments: {
        select: { id: true, author: true, body: true, createdAt: true },
        orderBy: { createdAt: 'asc' },
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
