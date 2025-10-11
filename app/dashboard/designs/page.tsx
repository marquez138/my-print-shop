import Link from 'next/link'
import Image from 'next/image'
import { auth } from '@clerk/nextjs/server'
import { prisma } from '@/lib/db'
import DesignStatusBadge from '@/components/dashboard/DesignStatusBadge'

function pickThumb(d: {
  placements: { areaId: string; url: string | null }[]
}) {
  // prefer any front, then back, else first with url
  const front = d.placements.find((p) => p.areaId.includes('front') && p.url)
  if (front?.url) return front.url
  const back = d.placements.find((p) => p.areaId.includes('back') && p.url)
  if (back?.url) return back.url
  const any = d.placements.find((p) => p.url)
  return any?.url ?? null
}

export default async function DesignsDashboardPage() {
  const { userId } = await auth()
  if (!userId) {
    // middleware should prevent this, but just in case
    return (
      <div className='text-sm text-gray-600'>
        You must be signed in to view your designs.
      </div>
    )
  }

  const designs = await prisma.design.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      productId: true, // we use as slug in your scaffold
      status: true,
      pricingTotal: true,
      createdAt: true,
      updatedAt: true,
      placements: {
        select: { areaId: true, url: true },
      },
    },
  })

  if (designs.length === 0) {
    return (
      <div className='rounded-lg border p-6'>
        <p className='text-sm text-gray-700'>You don’t have any designs yet.</p>
        <div className='mt-3'>
          <Link
            href='/products'
            className='inline-flex h-10 items-center rounded bg-black px-4 text-white'
          >
            Start your first design
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className='grid gap-4'>
      {designs.map((d) => {
        const thumb = pickThumb(d)
        const href = `/design/${d.productId}?designId=${d.id}`
        const isEditable =
          d.status === 'draft' || d.status === 'changes_requested'

        return (
          <div
            key={d.id}
            className='flex items-center gap-4 rounded-lg border p-4'
          >
            <div className='relative h-20 w-16 overflow-hidden rounded bg-gray-50'>
              {thumb ? (
                <Image
                  src={thumb}
                  alt='Design preview'
                  fill
                  className='object-cover'
                />
              ) : (
                <div className='flex h-full w-full items-center justify-center text-xs text-gray-400'>
                  No preview
                </div>
              )}
            </div>

            <div className='flex-1'>
              <div className='flex items-center gap-2'>
                <h3 className='font-medium'>#{d.id.slice(0, 8)}</h3>
                <DesignStatusBadge status={d.status} />
              </div>
              <div className='mt-1 text-xs text-gray-500'>
                Product: <span className='font-mono'>{d.productId}</span>
              </div>
              <div className='text-xs text-gray-500'>
                Updated: {new Date(d.updatedAt).toLocaleString()}
              </div>
            </div>

            <div className='flex items-center gap-2'>
              <Link
                href={href}
                className='inline-flex h-9 items-center rounded border px-3 text-sm'
              >
                {isEditable ? 'Continue design' : 'View'}
              </Link>
              {isEditable ? null : (
                <span className='text-sm text-gray-600'>
                  ${(d.pricingTotal / 100).toFixed(2)}
                </span>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}
