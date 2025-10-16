export const runtime = 'nodejs'

import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { prisma } from '@/lib/db'

// Optional Stripe
let stripe: any = null
const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY
if (STRIPE_SECRET_KEY) {
  // Lazy import to keep edge-safe
  // @ts-ignore
  const Stripe = require('stripe').default
  stripe = new Stripe(STRIPE_SECRET_KEY, {
    apiVersion: '2024-06-20',
  })
}

/**
 * POST /api/checkout/design/:id
 * Creates a draft Order for an approved design and (optionally) a Stripe Checkout session.
 * Returns: { url } to redirect the user to checkout/success page.
 */
export async function POST(
  req: Request,
  ctx: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id: designId } = await ctx.params

    // Get request origin for redirects
    const origin =
      (req.headers.get('origin') ??
        (req.headers
          .get('x-forwarded-proto')
          ?.concat('://', req.headers.get('x-forwarded-host') || '') ||
          '')) ||
      'http://localhost:3000'

    // Load design + verify ownership + that it’s approved
    const design = await prisma.design.findUnique({
      where: { id: designId },
      select: {
        id: true,
        userId: true,
        status: true,
        pricingBase: true,
        pricingFees: true,
        pricingTotal: true,
        productId: true,
        variantSku: true,
        color: true,
      },
    })
    if (!design) {
      return NextResponse.json({ error: 'Design not found' }, { status: 404 })
    }
    if (design.userId !== userId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }
    if (design.status !== 'approved') {
      return NextResponse.json(
        {
          error: `Design must be approved before checkout (current: ${design.status}).`,
        },
        { status: 400 }
      )
    }

    // Fetch quantities (line items)
    const lineItems = await prisma.designLineItem.findMany({
      where: { designId },
      select: {
        size: true,
        qty: true,
        unitPrice: true,
        surcharge: true,
        variantSku: true,
      },
      orderBy: { size: 'asc' },
    })
    const totalQty = lineItems.reduce((sum, li) => sum + (li.qty || 0), 0)
    if (totalQty <= 0) {
      return NextResponse.json(
        { error: 'Please enter quantities before proceeding to checkout.' },
        { status: 400 }
      )
    }

    // Ensure we have a Customer record (link to Clerk user)
    const customer = await prisma.customer.upsert({
      where: { clerkUserId: userId },
      create: {
        clerkUserId: userId,
        email: '', // can be filled via Clerk session or webhook if you store it
        role: 'CUSTOMER',
      },
      update: {},
      select: { id: true, email: true },
    })

    // Create a draft Order + OrderItems
    // Compute order total from designLineItem rows (unitPrice includes base+surcharge)
    const orderTotal = lineItems.reduce(
      (sum, li) => sum + li.unitPrice * li.qty,
      0
    )

    const order = await prisma.order.create({
      data: {
        customerId: customer.id,
        email: customer.email ?? null,
        total: orderTotal,
        currency: 'usd',
        status: 'AWAITING_PAYMENT',
        items: {
          create: lineItems
            .filter((li) => li.qty > 0)
            .map((li) => ({
              name: `${design.productId} • ${li.size}${
                design.color ? ` • ${design.color}` : ''
              }`,
              sku: li.variantSku || `${design.variantSku}-${li.size}`,
              qty: li.qty,
              unitPrice: li.unitPrice, // cents
            })),
        },
      },
      select: { id: true, total: true, currency: true },
    })

    // If Stripe is configured, create a Checkout Session
    if (stripe) {
      const stripeLineItems = lineItems
        .filter((li) => li.qty > 0)
        .map((li) => ({
          quantity: li.qty,
          price_data: {
            currency: 'usd',
            unit_amount: li.unitPrice, // cents
            product_data: {
              name: `Custom ${design.productId}`,
              description: `Size ${li.size}${
                design.color ? ` • ${design.color}` : ''
              }`,
              metadata: {
                designId: design.id,
                sku: li.variantSku || `${design.variantSku}-${li.size}`,
              },
            },
          },
        }))

      const session = await stripe.checkout.sessions.create({
        mode: 'payment',
        line_items: stripeLineItems,
        success_url: `${origin}/checkout/success?orderId=${order.id}`,
        cancel_url: `${origin}/checkout/cancel?orderId=${order.id}`,
        metadata: {
          orderId: order.id,
          designId: design.id,
        },
      })

      return NextResponse.json({ url: session.url }, { status: 200 })
    }

    // Fallback (no Stripe): send to a fake success page so you can test flow
    return NextResponse.json(
      { url: `${origin}/checkout/success?orderId=${order.id}` },
      { status: 200 }
    )
  } catch (err: any) {
    console.error('[POST /api/checkout/design/:id]', err)
    return NextResponse.json(
      { error: 'Server error', detail: err?.message ?? String(err) },
      { status: 500 }
    )
  }
}
