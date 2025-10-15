// app/api/designs/route.ts
export const runtime = 'nodejs'

import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { prisma } from '@/lib/db'

/**
 * GET /api/designs?productId=slug
 * Returns the most recent design for the signed-in user for this product.
 * You can narrow by editable states if desired.
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
    // If you only want “editable” states, uncomment the status filter below.
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
 * Body:
 * {
 *   productId: string;
 *   variantSku?: string;
 *   basePrice: number; // cents
 *   color?: string;    // ← persisted on Design.color (optional)
 * }
 * Creates a NEW draft design and returns { design }.
 */
export async function POST(req: Request) {
  const { userId } = await auth()
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
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

    // optional: simple color sanity trim
    const colorClean =
      typeof color === 'string' && color.trim().length ? color.trim() : null

    const design = await prisma.design.create({
      data: {
        userId,
        productId,
        variantSku: variantSku ?? `${productId}-${colorClean ?? 'default'}`,
        color: colorClean, // ← persist color on the Design row
        status: 'draft',
        pricingBase: basePrice,
        pricingFees: 0,
        pricingTotal: basePrice,
        printSpec: {},
      },
      include: { placements: true, comments: true },
    })

    return NextResponse.json({ design })
  } catch (err: any) {
    console.error('[POST /api/designs] create draft error:', err)
    return NextResponse.json(
      { error: 'Server error', detail: err.message },
      { status: 500 }
    )
  }
}
