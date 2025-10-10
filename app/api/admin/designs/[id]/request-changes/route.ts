import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { requireAdmin } from '@/lib/authz'

export async function POST(
  req: Request,
  ctx: { params: Promise<{ id: string }> }
) {
  await requireAdmin()
  const { id } = await ctx.params

  try {
    const { message } = await req.json().catch(() => ({}))
    if (!message || message.trim().length === 0) {
      return NextResponse.json({ error: 'Message required' }, { status: 400 })
    }

    const design = await prisma.design.update({
      where: { id },
      data: { status: 'changes_requested' },
    })

    await prisma.designComment.create({
      data: {
        designId: id,
        author: 'admin',
        body: message.trim(),
      },
    })

    return NextResponse.json({ ok: true, design })
  } catch (err) {
    console.error('Request changes failed', err)
    return NextResponse.json(
      { error: 'Unable to request changes' },
      { status: 500 }
    )
  }
}
