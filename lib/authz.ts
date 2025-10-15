// lib/authz.ts
import 'server-only'
import { auth, clerkClient } from '@clerk/nextjs/server'
import { prisma } from '@/lib/db'
import { redirect } from 'next/navigation'

function adminAllowlist(): Set<string> {
  const raw = process.env.ADMIN_EMAILS || ''
  return new Set(
    raw
      .split(',')
      .map((s) => s.trim().toLowerCase())
      .filter(Boolean)
  )
}

export async function currentCustomer() {
  const { userId } = await auth()
  if (!userId) return null

  // Try to find existing Customer
  let user = await prisma.customer.findFirst({
    where: { clerkUserId: userId },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      clerkUserId: true,
    },
  })
  if (user) return user

  // Auto-provision from Clerk if missing
  const cc = await clerkClient()
  const cUser = await cc.users.getUser(userId)
  const email =
    cUser.emailAddresses?.find((e) => e.id === cUser.primaryEmailAddressId)
      ?.emailAddress ||
    cUser.emailAddresses?.[0]?.emailAddress ||
    ''
  const name = `${cUser.firstName || ''} ${cUser.lastName || ''}`.trim()

  const isAdmin = adminAllowlist().has(email.toLowerCase())

  user = await prisma.customer.create({
    data: {
      clerkUserId: userId,
      email,
      name,
      role: isAdmin ? 'ADMIN' : 'CUSTOMER',
    },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      clerkUserId: true,
    },
  })

  return user
}

export async function requireUser() {
  const me = await currentCustomer()
  if (!me) redirect('/sign-in?redirect_url=/account')
  return me
}

export async function requireAdmin() {
  const me = await currentCustomer()
  if (!me) redirect('/sign-in?redirect_url=/admin')

  // Keep role in sync with allow-list on each hit
  const allow = adminAllowlist()
  const shouldBeAdmin = me.email && allow.has(me.email.toLowerCase())
  if (shouldBeAdmin && me.role !== 'ADMIN') {
    await prisma.customer.update({
      where: { clerkUserId: me.clerkUserId },
      data: { role: 'ADMIN' },
    })
    me.role = 'ADMIN'
  }

  if (me.role !== 'ADMIN') redirect('/account')
  return me
}
