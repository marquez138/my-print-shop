// app/(auth)/post-sign-in/route.ts
import { NextResponse } from 'next/server'
import { requireUser } from '@/lib/authz'

export async function GET() {
  const me = await requireUser()
  // send admins to /admin, everyone else to /account
  const to = me.role === 'ADMIN' ? '/admin' : '/account'
  return NextResponse.redirect(
    new URL(to, process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000')
  )
}
