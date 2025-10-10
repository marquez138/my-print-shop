// lib/authz.ts
import 'server-only'
import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/db'

export async function currentCustomer() {
  const { userId } = await auth()
  if (!userId) return null
  return prisma.customer.findFirst({
    where: { clerkUserId: userId },
    select: { id: true, email: true, name: true, role: true },
  })
}

export async function requireUser() {
  const me = await currentCustomer()
  if (!me) redirect('/sign-in?redirect_url=/account')
  return me
}

export async function requireAdmin() {
  const me = await currentCustomer()
  if (!me) redirect('/sign-in?redirect_url=/admin')
  if (me.role !== 'ADMIN') redirect('/forbidden')
  return me
}
