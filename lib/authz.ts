// lib/authz.ts
import 'server-only'
import { auth, clerkClient as clerkClientFactory } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/db'

function adminAllowlist(): Set<string> {
  const raw = process.env.ADMIN_EMAILS || ''
  return new Set(
    raw
      .split(',')
      .map((s) => s.trim().toLowerCase())
      .filter(Boolean)
  )
}

export async function ensureCustomer() {
  const { userId } = await auth()
  if (!userId) return null

  let existing = await prisma.customer.findFirst({
    where: { clerkUserId: userId },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      clerkUserId: true,
    },
  })
  if (existing) return existing

  const clerkClient = await clerkClientFactory() // ✅ new factory pattern
  const cUser = await clerkClient.users.getUser(userId)

  const email =
    cUser.emailAddresses.find((e) => e.id === cUser.primaryEmailAddressId)
      ?.emailAddress ||
    cUser.emailAddresses[0]?.emailAddress ||
    ''
  const name = [cUser.firstName, cUser.lastName].filter(Boolean).join(' ') || ''

  const isAdmin = email ? adminAllowlist().has(email.toLowerCase()) : false

  existing = await prisma.customer.create({
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
  return existing
}

export async function currentCustomer() {
  return ensureCustomer()
}

export async function requireUser() {
  const me = await ensureCustomer()
  if (!me) redirect('/sign-in?redirect_url=/account')
  return me
}

export async function requireAdmin() {
  const me = await ensureCustomer()
  if (!me) redirect('/sign-in?redirect_url=/admin')

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

export async function requireAdminAPI() {
  const me = await ensureCustomer()
  if (!me) return { authorized: false as const, status: 401 as const }

  const allow = adminAllowlist()
  const shouldBeAdmin = me.email && allow.has(me.email.toLowerCase())
  if (shouldBeAdmin && me.role !== 'ADMIN') {
    await prisma.customer.update({
      where: { clerkUserId: me.clerkUserId },
      data: { role: 'ADMIN' },
    })
    me.role = 'ADMIN'
  }

  if (me.role !== 'ADMIN')
    return { authorized: false as const, status: 403 as const }

  return { authorized: true as const, me }
}
