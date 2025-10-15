export const runtime = 'nodejs'

import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { prisma } from '@/lib/db'
import {
  SIZE_ORDER,
  type SizeCode,
  normalizeQuantities,
  summarizeQuantities,
  buildLineItems,
} from '@/lib/size-pricing'

type Ctx = { params: Promise<{ id: string }> }

/* ---------- Strongly typed gate ---------- */

type GateOk = {
  ok: true
  design: {
    id: string
    userId: string | null
    status: string
    pricingBase: number
    variantSku: string
  }
}

type GateFail = {
  ok: false
  status: 403 | 404
  error: string
}

/**
 * Allow owner or admin to access a design.
 * Returns a discriminated union so TS knows `design` exists when ok === true.
 */
async function assertOwnerOrAdmin(
  designId: string,
  userId?: string | null
): Promise<GateOk | GateFail> {
  const d = await prisma.design.findUnique({
    where: { id: designId },
    select: {
      id: true,
      userId: true,
      status: true,
      pricingBase: true,
      variantSku: true,
    },
  })
  if (!d) return { ok: false, status: 404, error: 'Design not found' }

  // Owner
  if (d.userId && userId && d.userId === userId) {
    return { ok: true, design: d }
  }

  // Admin
  if (userId) {
    const me = await prisma.customer.findFirst({
      where: { clerkUserId: userId },
      select: { role: true },
    })
    if (me?.role === 'ADMIN') {
      return { ok: true, design: d }
    }
  }

  return { ok: false, status: 403, error: 'Forbidden' }
}

/* ---------- GET: read quantities ---------- */

export async function GET(_req: Request, ctx: Ctx) {
  try {
    const { userId } = await auth()
    const { id: designId } = await ctx.params

    const gate = await assertOwnerOrAdmin(designId, userId)
    if (!gate.ok) {
      return NextResponse.json({ error: gate.error }, { status: gate.status })
    }
    const design = gate.design

    const items = await prisma.designLineItem.findMany({
      where: { designId },
      orderBy: { size: 'asc' },
      select: { size: true, qty: true, unitPrice: true, surcharge: true },
    })

    // Normalize to a full map for summary
    const qMap = Object.fromEntries(
      SIZE_ORDER.map((s) => [s, items.find((i) => i.size === s)?.qty ?? 0])
    ) as Record<SizeCode, number>

    const summary = summarizeQuantities(design.pricingBase, qMap)

    return NextResponse.json({ ok: true, items, summary })
  } catch (err: any) {
    console.error('[GET /api/designs/:id/quantities]', err)
    return NextResponse.json(
      { error: 'Server error', detail: err.message },
      { status: 500 }
    )
  }
}

/* ---------- PUT: upsert quantities ---------- */

export async function PUT(req: Request, ctx: Ctx) {
  try {
    const { userId } = await auth()
    if (!userId)
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { id: designId } = await ctx.params
    const gate = await assertOwnerOrAdmin(designId, userId)
    if (!gate.ok) {
      return NextResponse.json({ error: gate.error }, { status: gate.status })
    }
    const design = gate.design

    if (design.status !== 'approved') {
      return NextResponse.json(
        {
          error: `Quantities can only be set when design is approved (current: ${design.status}).`,
        },
        { status: 400 }
      )
    }

    const body = (await req.json()) as {
      quantities?: Record<string, number | string | null | undefined>
    }
    if (!body?.quantities) {
      return NextResponse.json(
        { error: 'quantities is required' },
        { status: 400 }
      )
    }

    // Validate & normalize
    const normalized = normalizeQuantities(body.quantities)

    // Build line items with surcharges & unit prices
    const upserts = buildLineItems(
      design.pricingBase,
      design.variantSku,
      normalized
    )

    // Apply transactionally
    await prisma.$transaction(async (tx) => {
      const zeroSizes = SIZE_ORDER.filter((s) => (normalized[s] ?? 0) === 0)
      if (zeroSizes.length) {
        await tx.designLineItem.deleteMany({
          where: { designId, size: { in: zeroSizes } },
        })
      }

      for (const item of upserts) {
        await tx.designLineItem.upsert({
          where: { designId_size: { designId, size: item.size } },
          update: {
            qty: item.qty,
            unitPrice: item.unitPrice,
            surcharge: item.surcharge,
            variantSku: item.variantSku,
          },
          create: {
            designId,
            size: item.size,
            qty: item.qty,
            unitPrice: item.unitPrice,
            surcharge: item.surcharge,
            variantSku: item.variantSku,
          },
        })
      }
    })

    // Read back and summarize
    const items = await prisma.designLineItem.findMany({
      where: { designId },
      orderBy: { size: 'asc' },
      select: { size: true, qty: true, unitPrice: true, surcharge: true },
    })

    const qMap = Object.fromEntries(
      SIZE_ORDER.map((s) => [s, items.find((i) => i.size === s)?.qty ?? 0])
    ) as Record<SizeCode, number>

    const summary = summarizeQuantities(design.pricingBase, qMap)

    return NextResponse.json({ ok: true, items, summary })
  } catch (err: any) {
    console.error('[PUT /api/designs/:id/quantities]', err)
    return NextResponse.json(
      { error: 'Server error', detail: err.message },
      { status: 500 }
    )
  }
}
