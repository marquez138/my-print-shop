// app/admin/actions.ts
'use server'

import { requireAdmin } from '@/lib/authz'
import { prisma } from '@/lib/db'

export async function adminApproveDesign(id: string) {
  await requireAdmin()
  return prisma.design.update({
    where: { id },
    data: { status: 'approved' },
  })
}
