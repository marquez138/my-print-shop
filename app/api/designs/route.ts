// app/api/designs/route.ts
export const runtime = 'nodejs'

import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { prisma } from '@/lib/db'

/**
 * GET /api/designs?productId=...
 * Hydrate the most recent design for the signed-in user & product.
 */
export async function GET(req: Request) {
  const { userId } = await auth()
  if (!userId)
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const url = new URL(req.url)
  const productId = url.searchParams.get('productId')
  if (!productId) {
    return NextResponse.json({ error: 'Missing productId' }, { status: 400 })
  }

  // Prefer editable states first
  const preferred = await prisma.design.findFirst({
    where: {
      userId,
      productId,
      status: { in: ['draft', 'changes_requested'] },
    },
    orderBy: { updatedAt: 'desc' },
    include: {
      placements: true,
      comments: { orderBy: { createdAt: 'asc' } },
    },
  })
  if (preferred) return NextResponse.json({ design: preferred })

  const fallback = await prisma.design.findFirst({
    where: { userId, productId },
    orderBy: { updatedAt: 'desc' },
    include: {
      placements: true,
      comments: { orderBy: { createdAt: 'asc' } },
    },
  })
  return NextResponse.json({ design: fallback ?? null })
}

/**
 * POST /api/designs
 * Create a new draft design for the signed-in user.
 * Body: { productId: string, variantSku: string, basePrice: number }
 */
export async function POST(req: Request) {
  const { userId } = await auth()
  if (!userId)
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json().catch(() => ({}))
  const { productId, variantSku, basePrice } = body as {
    productId?: string
    variantSku?: string
    basePrice?: number
  }

  if (!productId || !variantSku || typeof basePrice !== 'number') {
    return NextResponse.json(
      { error: 'Missing productId, variantSku, or basePrice' },
      { status: 400 }
    )
  }

  const design = await prisma.design.create({
    data: {
      userId,
      productId,
      variantSku,
      status: 'draft',
      pricingBase: basePrice,
      pricingFees: 0,
      pricingTotal: basePrice,
      printSpec: {}, // required Json field
    },
  })

  return NextResponse.json({ design })
}
