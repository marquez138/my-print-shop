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
    const { body } = await req.json().catch(() => ({}))
    if (!body || typeof body !== 'string' || body.trim().length === 0) {
      return NextResponse.json({ error: 'Body required' }, { status: 400 })
    }

    const comment = await prisma.designComment.create({
      data: {
        designId: id,
        author: 'admin',
        body: body.trim(),
      },
    })

    return NextResponse.json({ ok: true, comment })
  } catch (err) {
    console.error('Add comment failed', err)
    return NextResponse.json(
      { error: 'Unable to add comment' },
      { status: 500 }
    )
  }
}
