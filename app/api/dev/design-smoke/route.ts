import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export const runtime = 'nodejs'

export async function POST() {
  // Create a draft design
  const design = await prisma.design.create({
    data: {
      userId: null, // or set a Clerk user if signed in
      anonymousId: 'dev-anon', // simulate guest
      productId: 'prod_blank_tee',
      variantSku: 'UNISEX-TEE-BLACK-M',
      status: 'draft',
      pricingBase: 2500,
      pricingFees: 0,
      pricingTotal: 2500,
      printSpec: {}, // fill later when you finalize
    },
  })

  // Upsert a placement on 'front' side
  const placement1 = await prisma.designPlacement.upsert({
    where: { designId_side: { designId: design.id, side: 'front' } },
    update: {
      areaId: 'leftChest',
      assetId: 'demo_public_id_1',
      url: 'https://res.cloudinary.com/demo/image/upload/sample.png',
      widthPx: 1200,
      heightPx: 1200,
    },
    create: {
      designId: design.id,
      side: 'front',
      areaId: 'leftChest',
      assetId: 'demo_public_id_1',
      url: 'https://res.cloudinary.com/demo/image/upload/sample.png',
      widthPx: 1200,
      heightPx: 1200,
    },
  })

  // Try replacing same side: should UPDATE (not create a second row)
  const placement2 = await prisma.designPlacement.upsert({
    where: { designId_side: { designId: design.id, side: 'front' } },
    update: {
      areaId: 'fullFront', // replace area on same side
      assetId: 'demo_public_id_2',
      url: 'https://res.cloudinary.com/demo/image/upload/sample2.png',
      widthPx: 2000,
      heightPx: 2000,
    },
    create: {
      designId: design.id,
      side: 'front',
      areaId: 'fullFront',
      assetId: 'demo_public_id_2',
      url: 'https://res.cloudinary.com/demo/image/upload/sample2.png',
      widthPx: 2000,
      heightPx: 2000,
    },
  })

  const placements = await prisma.designPlacement.findMany({
    where: { designId: design.id },
  })

  return NextResponse.json({ design, placements })
}
