// app/products/[slug]/page.tsx
import Link from 'next/link'
import { use } from 'react'

export default function ProductPage({
  params,
}: {
  // 👇 params is a Promise in App Router
  params: Promise<{ slug: string }>
}) {
  // ✅ unwrap it with React.use()
  const { slug } = use(params)

  // placeholder product data for Phase 1
  const product = { slug, name: 'Unisex Jersey Tee', basePrice: 800 }

  return (
    <div className='grid grid-cols-1 lg:grid-cols-12 gap-8'>
      <section className='lg:col-span-7'>
        <div className='aspect-[4/5] bg-gray-100 rounded-xl' />
      </section>

      <aside className='lg:col-span-5 space-y-4'>
        <h1 className='text-2xl font-semibold uppercase'>{product.name}</h1>
        <div className='text-sm text-gray-600'>
          Base from ${(product.basePrice / 100).toFixed(2)}
        </div>

        <Link
          href={`/design/${product.slug}?base=${product.basePrice}`}
          className='inline-flex h-11 items-center justify-center rounded-lg bg-black px-5 text-white'
        >
          Start Design
        </Link>

        <p className='text-sm text-gray-600'>
          Choose your print areas and upload your artwork. We’ll auto-fit it to
          each safe zone.
        </p>
      </aside>
    </div>
  )
}
