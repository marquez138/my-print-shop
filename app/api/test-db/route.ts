import { prisma } from '@/lib/db'
import { NextResponse } from 'next/server'

export async function GET() {
  const version = await prisma.$queryRaw`SELECT version()`
  return NextResponse.json({ version })
}
