export const runtime = 'nodejs'

import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { prisma } from '@/lib/db'

/**
 * GET /api/designs?productId=slug
 * Returns the most recent design for the signed-in user for this product
 * (draft/submitted/changes_requested/approved/ordered — adjust filter if desired)
 */
export async function GET(req: Request) {
  const { userId } = await auth()
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { searchParams } = new URL(req.url)
  const productId = searchParams.get('productId') || undefined
  if (!productId) {
    return NextResponse.json(
      { error: 'productId query param is required' },
      { status: 400 }
    )
  }

  try {
    // If you only want “editable” states, narrow to: ['draft','changes_requested','submitted']
    const design = await prisma.design.findFirst({
      where: {
        userId,
        productId,
        // status: { in: ['draft', 'changes_requested', 'submitted'] },
      },
      orderBy: { createdAt: 'desc' },
      include: {
        placements: true,
        comments: { orderBy: { createdAt: 'asc' } },
      },
    })

    return NextResponse.json({ design })
  } catch (err: any) {
    console.error('[GET /api/designs] hydrate error:', err)
    return NextResponse.json(
      { error: 'Server error', detail: err.message },
      { status: 500 }
    )
  }
}

/**
 * POST /api/designs
 * Body: {
 * productId: string;
 * variantSku?: string;
 * basePrice: number;
 * color?: string; // <-- NEW, persisted to Design.color
 * }
 * Creates a NEW draft design and returns { design }
 * Auth required (user must be signed in)
 */
export async function POST(req: Request) {
  const { userId } = await auth()
  if (!userId)
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const { productId, variantSku, basePrice, color } = body as {
    productId: string
    variantSku?: string
    basePrice: number
    color?: string
  }

  if (!productId || typeof basePrice !== 'number') {
    return NextResponse.json(
      { error: 'productId and basePrice are required' },
      { status: 400 }
    )
  }

  const design = await prisma.design.create({
    data: {
      userId,
      productId,
      variantSku: variantSku ?? `${productId}-${color ?? 'default'}`,
      color: color ?? null, // ← now valid
      status: 'draft',
      pricingBase: basePrice,
      pricingFees: 0,
      pricingTotal: basePrice,
      printSpec: {},
    },
    include: { placements: true, comments: true },
  })

  return NextResponse.json({ design })
}
