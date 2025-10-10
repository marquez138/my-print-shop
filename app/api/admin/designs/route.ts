// app/api/admin/designs/route.ts
export const runtime = 'nodejs'

import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { prisma } from '@/lib/db'

/**
 * GET /api/admin/designs
 * Lists all designs (optionally filtered by status)
 * Example: /api/admin/designs?status=submitted
 */
export async function GET(req: Request) {
  const { userId } = await auth()
  if (!userId)
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // Verify user is ADMIN
  const me = await prisma.customer.findFirst({
    where: { clerkUserId: userId },
    select: { role: true },
  })
  if (me?.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
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
      // Fetch customer info for display
      // If you want to show their email in admin table
      // Add a join to Customer by userId:
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
