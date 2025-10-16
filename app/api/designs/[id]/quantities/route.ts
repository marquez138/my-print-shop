// app/api/designs/[id]/quantities/route.ts
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

/* ---------- Gate (owner or admin) ---------- */

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

  // Owner check
  if (d.userId && userId && d.userId === userId) return { ok: true, design: d }

  // Admin check
  if (userId) {
    const me = await prisma.customer.findFirst({
      where: { clerkUserId: userId },
      select: { role: true },
    })
    if (me?.role === 'ADMIN') return { ok: true, design: d }
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

/* ---------- Shared writer (PUT/POST) ---------- */

async function writeQuantities(
  req: Request,
  ctx: Ctx,
  methodLabel: 'PUT' | 'POST'
) {
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

    const body = (await req.json()) as
      | { quantities?: Record<string, number | string | null | undefined> }
      | {
          items?: Array<{
            size: string
            qty: number
            unitPrice?: number
            surcharge?: number
          }>
        }

    // Accept either "quantities" map OR "items" array
    let normalized: Record<SizeCode, number>
    if ('quantities' in body && body.quantities) {
      normalized = normalizeQuantities(body.quantities)
    } else if ('items' in body && Array.isArray(body.items)) {
      const map: Partial<Record<SizeCode, number>> = {}
      for (const s of SIZE_ORDER) map[s] = 0
      for (const it of body.items) {
        const size = (it.size?.toUpperCase?.() as SizeCode) || 'M'
        if (SIZE_ORDER.includes(size))
          map[size] = Math.max(0, Number(it.qty) || 0)
      }
      normalized = map as Record<SizeCode, number>
    } else {
      return NextResponse.json(
        { error: 'Provide either "quantities" map or "items" array' },
        { status: 400 }
      )
    }

    // Build line items with pricing
    const lineItems = buildLineItems(
      design.pricingBase,
      design.variantSku,
      normalized
    )

    // Apply transactionally (delete zeroes, upsert > 0)
    await prisma.$transaction(async (tx) => {
      const zeroSizes = SIZE_ORDER.filter((s) => (normalized[s] ?? 0) === 0)
      if (zeroSizes.length) {
        await tx.designLineItem.deleteMany({
          where: { designId, size: { in: zeroSizes } },
        })
      }

      for (const item of lineItems) {
        if (item.qty <= 0) continue
        await tx.designLineItem.upsert({
          where: { designId_size: { designId, size: item.size } }, // composite uniq key
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

    // Return fresh items + summary
    const items = await prisma.designLineItem.findMany({
      where: { designId },
      orderBy: { size: 'asc' },
      select: { size: true, qty: true, unitPrice: true, surcharge: true },
    })
    const qMap = Object.fromEntries(
      SIZE_ORDER.map((s) => [s, items.find((i) => i.size === s)?.qty ?? 0])
    ) as Record<SizeCode, number>
    const summary = summarizeQuantities(design.pricingBase, qMap)

    return NextResponse.json({ ok: true, method: methodLabel, items, summary })
  } catch (err: any) {
    console.error(`[${methodLabel} /api/designs/:id/quantities]`, err)
    return NextResponse.json(
      { error: 'Server error', detail: err.message },
      { status: 500 }
    )
  }
}

export async function PUT(req: Request, ctx: Ctx) {
  return writeQuantities(req, ctx, 'PUT')
}

export async function POST(req: Request, ctx: Ctx) {
  // Kept for clients that send POST; identical behavior to PUT
  return writeQuantities(req, ctx, 'POST')
}
