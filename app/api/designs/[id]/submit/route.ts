// app/api/designs/[id]/submit/route.ts
export const runtime = 'nodejs'

import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { prisma } from '@/lib/db'

export async function POST(
  _req: Request,
  ctx: { params: Promise<{ id: string }> }
) {
  const { userId } = await auth()
  if (!userId)
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id: designId } = await ctx.params

  const design = await prisma.design.findUnique({
    where: { id: designId },
    include: { placements: true },
  })
  if (!design || design.userId !== userId) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  if (!['draft', 'changes_requested'].includes(design.status)) {
    return NextResponse.json({ error: 'Invalid state' }, { status: 400 })
  }

  if (design.placements.length === 0) {
    return NextResponse.json(
      { error: 'No print areas selected' },
      { status: 400 }
    )
  }

  const updated = await prisma.design.update({
    where: { id: designId },
    data: { status: 'submitted' },
  })

  return NextResponse.json({ design: updated })
}
