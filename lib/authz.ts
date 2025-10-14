// lib/authz.ts
import 'server-only'
import { auth, currentUser } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/db'

/**
 * Ensure there's a Customer row for the current Clerk user.
 * Creates one on first sign-in if missing.
 */
export async function ensureCustomer() {
  const { userId } = await auth()
  if (!userId) return null

  // Already exists?
  const existing = await prisma.customer.findFirst({
    where: { clerkUserId: userId },
    select: { id: true, email: true, name: true, role: true },
  })
  if (existing) return existing

  // Create from Clerk's currentUser() data
  const u = await currentUser()
  const email =
    u?.primaryEmailAddress?.emailAddress ||
    u?.emailAddresses?.[0]?.emailAddress ||
    ''
  const name =
    [u?.firstName, u?.lastName].filter(Boolean).join(' ') ||
    u?.username ||
    email

  const created = await prisma.customer.create({
    data: {
      clerkUserId: userId,
      email,
      name,
      role: 'CUSTOMER',
    },
    select: { id: true, email: true, name: true, role: true },
  })
  return created
}

export async function currentCustomer() {
  const { userId } = await auth()
  if (!userId) return null
  // also auto-provision to be safe
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
  if (me.role !== 'ADMIN') redirect('/forbidden')
  return me
}

/**
 * For API routes: returns a small gate object instead of redirecting.
 */
export async function requireAdminAPI() {
  const { userId } = await auth()
  if (!userId) return { ok: false as const, status: 401 as const }

  // auto-provision if needed
  const me = await ensureCustomer()
  if (!me) return { ok: false as const, status: 401 as const }
  if (me.role !== 'ADMIN') return { ok: false as const, status: 403 as const }

  return { ok: true as const, me }
}
