import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { requireAdmin } from '@/lib/authz'

export async function POST(
  _: Request,
  ctx: { params: Promise<{ id: string }> }
) {
  await requireAdmin()
  const { id } = await ctx.params

  try {
    const design = await prisma.design.update({
      where: { id },
      data: { status: 'approved' },
    })

    await prisma.designComment.create({
      data: {
        designId: id,
        author: 'admin',
        body: 'Design approved for production.',
      },
    })

    return NextResponse.json({ ok: true, design })
  } catch (err) {
    console.error('Approve failed', err)
    return NextResponse.json(
      { error: 'Unable to approve design' },
      { status: 500 }
    )
  }
}
