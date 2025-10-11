// app/api/designs/route.ts
export const runtime = 'nodejs'

import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { prisma } from '@/lib/db'

/**
 * POST /api/designs
 * Body: { productId: string; variantSku?: string; basePrice: number }
 * Creates a NEW draft design and returns { design }
 * Auth required (user must be signed in)
 */
export async function POST(req: Request) {
  const { userId } = await auth()
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await req.json()
    const { productId, variantSku, basePrice } = body as {
      productId: string
      variantSku?: string
      basePrice: number
    }

    if (!productId || typeof basePrice !== 'number') {
      return NextResponse.json(
        { error: 'productId and basePrice are required' },
        { status: 400 }
      )
    }

    // Optional: one-active-draft-per-product policy
    // await prisma.design.updateMany({
    //   where: { userId, productId, status: 'draft' },
    //   data: { status: 'archived' },
    // })

    const design = await prisma.design.create({
      data: {
        userId,
        productId,
        variantSku: variantSku ?? `${productId}-default`,
        status: 'draft',
        pricingBase: basePrice,
        pricingFees: 0,
        pricingTotal: basePrice,
        printSpec: {}, // start empty; fill later if needed
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
