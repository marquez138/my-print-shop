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
    const { reason } = await req.json().catch(() => ({}))
    if (!reason || reason.trim().length === 0) {
      return NextResponse.json({ error: 'Reason required' }, { status: 400 })
    }

    const design = await prisma.design.update({
      where: { id },
      data: { status: 'rejected' },
    })

    await prisma.designComment.create({
      data: {
        designId: id,
        author: 'admin',
        body: `Rejected: ${reason.trim()}`,
      },
    })

    return NextResponse.json({ ok: true, design })
  } catch (err) {
    console.error('Reject failed', err)
    return NextResponse.json(
      { error: 'Unable to reject design' },
      { status: 500 }
    )
  }
}
