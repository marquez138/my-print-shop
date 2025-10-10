// app/api/admin/designs/[id]/request-changes/route.ts
export const runtime = 'nodejs'

import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { prisma } from '@/lib/db'

async function ensureAdmin() {
  const { userId } = await auth()
  if (!userId) throw Object.assign(new Error('Unauthorized'), { status: 401 })
  const me = await prisma.customer.findFirst({ where: { clerkUserId: userId } })
  if (!me || me.role !== 'ADMIN') {
    throw Object.assign(new Error('Forbidden'), { status: 403 })
  }
  return userId
}

export async function POST(
  req: Request,
  ctx: { params: Promise<{ id: string }> }
) {
  try {
    await ensureAdmin()
    const { id } = await ctx.params

    const { message } = (await req.json().catch(() => ({}))) as {
      message?: string
    }
    if (!message || !message.trim()) {
      return NextResponse.json({ error: 'Missing message' }, { status: 400 })
    }

    const design = await prisma.design.findUnique({ where: { id } })
    if (!design)
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    if (design.status !== 'submitted') {
      return NextResponse.json(
        {
          error:
            'Invalid state: only submitted designs can receive change requests',
        },
        { status: 400 }
      )
    }

    // Update status → changes_requested
    const updated = await prisma.design.update({
      where: { id },
      data: { status: 'changes_requested' },
    })

    // Optional: store a comment if the model exists (ignored if not present)
    try {
      // If you have this model in your schema:
      // model DesignComment { id String @id @default(cuid()) designId String author String body String createdAt DateTime @default(now()) }
      await (prisma as any).designComment?.create({
        data: {
          designId: id,
          author: 'admin',
          body: message,
        },
      })
    } catch {
      // no-op if table not present
    }

    return NextResponse.json({ design: updated })
  } catch (e: any) {
    const status = e?.status ?? 500
    return NextResponse.json(
      { error: e?.message ?? 'Server error' },
      { status }
    )
  }
}
