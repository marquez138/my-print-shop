// app/api/webhooks/clerk/route.ts
export const runtime = 'nodejs'

import { NextResponse } from 'next/server'
import { headers } from 'next/headers'
import { Webhook } from 'svix'
import { prisma } from '@/lib/db'

// Utility: safely pull first email or fallback
function primaryEmail(u: any): string | null {
  const fromList = u?.email_addresses?.[0]?.email_address ?? null
  if (fromList) return fromList
  if (u?.primary_email_address_id && Array.isArray(u?.email_addresses)) {
    const found = u.email_addresses.find(
      (e: any) => e.id === u.primary_email_address_id
    )
    return found?.email_address ?? null
  }
  return null
}

export async function POST(req: Request) {
  const body = await req.text()
  const hdrs = await headers() // ← Next 15: await it

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

  let evt: any
  try {
    const wh = new Webhook(secret)
    evt = wh.verify(body, {
      'svix-id': svixId,
      'svix-timestamp': svixTimestamp,
      'svix-signature': svixSignature,
    })
  } catch (e) {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  const type = evt?.type as string

  // Handle events
  if (type === 'user.created' || type === 'user.updated') {
    const u = evt.data
    const email = primaryEmail(u) ?? `${u.id}@example.invalid`
    const name =
      [u.first_name, u.last_name].filter(Boolean).join(' ') ||
      u.username ||
      null

    // Make first-ever customer ADMIN; others default CUSTOMER.
    // Keep existing role on update (don’t overwrite ADMIN by accident).
    const updated = await prisma.$transaction(async (tx) => {
      const existing = await tx.customer.findUnique({
        where: { clerkUserId: u.id },
        select: { id: true, role: true },
      })
      if (existing) {
        return tx.customer.update({
          where: { clerkUserId: u.id },
          data: { email, name: name ?? undefined },
        })
      }
      const count = await tx.customer.count()
      const role = count === 0 ? 'ADMIN' : 'CUSTOMER'
      return tx.customer.create({
        data: { clerkUserId: u.id, email, name, role },
      })
    })

    return NextResponse.json({ ok: true, id: updated.id })
  }

  if (type === 'user.deleted') {
    const u = evt.data
    // Soft-delete in real apps; hard delete here for brevity
    await prisma.customer.deleteMany({ where: { clerkUserId: u.id } })
    return NextResponse.json({ ok: true })
  }

  // Ignore other Clerk events
  return NextResponse.json({ ok: true })
}
