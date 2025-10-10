// app/api/webhooks/clerk/route.ts
export const runtime = 'nodejs'

import { NextResponse } from 'next/server'
import { headers } from 'next/headers'
import { Webhook } from 'svix'
import { prisma } from '@/lib/db'

// ✅ Health check (GET)
// Visit http://localhost:3000/api/webhooks/clerk to confirm the endpoint is live
export async function GET() {
  return NextResponse.json({
    ok: true,
    message: 'Clerk webhook endpoint active',
  })
}

/** Try to extract a primary email from Clerk's payload */
function getPrimaryEmail(u: any): string | null {
  const list = Array.isArray(u?.email_addresses) ? u.email_addresses : []
  const byIndex = list[0]?.email_address ?? null
  if (byIndex) return byIndex

  if (u?.primary_email_address_id) {
    const found = list.find((e: any) => e.id === u.primary_email_address_id)
    if (found?.email_address) return found.email_address
  }
  return null
}

function logDev(...args: any[]) {
  if (process.env.NODE_ENV !== 'production')
    console.log('[clerk-webhook]', ...args)
}

// 🔽 (keep your POST handler here exactly as we defined earlier)
export async function POST(req: Request) {
  const hdrs = await headers()
  const svixId = hdrs.get('svix-id')
  const svixTimestamp = hdrs.get('svix-timestamp')
  const svixSignature = hdrs.get('svix-signature')

  if (!svixId || !svixTimestamp || !svixSignature) {
    return NextResponse.json({ error: 'Missing Svix headers' }, { status: 400 })
  }

  const secret = process.env.CLERK_WEBHOOK_SECRET
  if (!secret) {
    return NextResponse.json(
      { error: 'Missing CLERK_WEBHOOK_SECRET' },
      { status: 500 }
    )
  }

  const payload = await req.text()

  let event: any
  try {
    const wh = new Webhook(secret)
    event = wh.verify(payload, {
      'svix-id': svixId,
      'svix-timestamp': svixTimestamp,
      'svix-signature': svixSignature,
    })
  } catch (err) {
    logDev('invalid signature', err)
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  const type = event?.type as string
  const user = event?.data

  try {
    if (type === 'user.created' || type === 'user.updated') {
      const email = getPrimaryEmail(user) ?? `${user.id}@example.invalid`
      const name =
        [user.first_name, user.last_name].filter(Boolean).join(' ') ||
        user.username ||
        null

      const updated = await prisma.$transaction(async (tx) => {
        const existing = await tx.customer.findUnique({
          where: { clerkUserId: user.id },
          select: { id: true, role: true },
        })

        if (existing) {
          return tx.customer.update({
            where: { clerkUserId: user.id },
            data: { email, name: name ?? undefined },
          })
        }

        const count = await tx.customer.count()
        const role = count === 0 ? 'ADMIN' : 'CUSTOMER'

        return tx.customer.create({
          data: { clerkUserId: user.id, email, name, role },
        })
      })

      logDev('upserted customer', { id: updated.id, role: updated.role })
      return NextResponse.json({ ok: true, id: updated.id })
    }

    if (type === 'user.deleted') {
      await prisma.customer.deleteMany({ where: { clerkUserId: user.id } })
      logDev('deleted customer', user.id)
      return NextResponse.json({ ok: true })
    }

    return NextResponse.json({ ok: true })
  } catch (err: any) {
    logDev('handler error', err)
    return NextResponse.json(
      { error: 'Server error', detail: err?.message ?? String(err) },
      { status: 500 }
    )
  }
}
