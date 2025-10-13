import Image from 'next/image'
import Link from 'next/link'
import { prisma } from '@/lib/db'

// Revalidate this page every 60s (tune as you like)
export const revalidate = 60

const usd = (cents: number) => `$${(cents / 100).toFixed(2)}`

export default async function Home() {
  // Grab a few products with their "front" image as the card thumb
  const products = await prisma.product.findMany({
    take: 12,
    orderBy: { name: 'asc' },
    select: {
      slug: true,
      name: true,
      basePrice: true,
      images: {
        where: { tag: 'front' },
        orderBy: { position: 'asc' },
        take: 1,
        select: { url: true, alt: true },
      },
    },
  })

  return (
    <section className='space-y-6'>
      <h1 className='text-2xl font-semibold tracking-tight'>Featured Blanks</h1>

      <ul className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4'>
        {products.map((p) => {
          const thumb = p.images[0]
          return (
            <li key={p.slug} className='border rounded-xl p-4'>
              <div className='relative aspect-[4/5] rounded-lg overflow-hidden bg-gray-100 mb-3'>
                {thumb ? (
                  <Image
                    src={thumb.url}
                    alt={thumb.alt ?? `${p.name} front`}
                    fill
                    className='object-cover'
                    sizes='(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw'
                    priority={false}
                  />
                ) : null}
              </div>

              <div className='flex items-center justify-between'>
                <div>
                  <div className='font-medium'>{p.name}</div>
                  <div className='text-sm text-gray-600'>
                    From {usd(p.basePrice)}
                  </div>
                </div>

                <Link
                  href={`/products/${p.slug}`}
                  className='text-sm underline underline-offset-4'
                >
                  View
                </Link>
              </div>
            </li>
          )
        })}
      </ul>

      {products.length === 0 && (
        <p className='text-sm text-gray-600'>
          No products found. Seed your database and refresh.
        </p>
      )}
    </section>
  )
}
