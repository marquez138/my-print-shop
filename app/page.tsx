import Link from 'next/link'

const featured = [
  { slug: 'unisex-tee', name: 'Unisex Jersey Tee' },
  { slug: 'heavyweight-tee', name: 'Heavyweight Tee' },
]

export default function Home() {
  return (
    <section className='space-y-6'>
      <h1 className='text-2xl font-semibold tracking-tight'>Featured Blanks</h1>
      <ul className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4'>
        {featured.map((p) => (
          <li key={p.slug} className='border rounded-xl p-4'>
            <div className='aspect-[4/5] bg-gray-100 rounded-lg mb-3' />
            <div className='flex items-center justify-between'>
              <div className='font-medium'>{p.name}</div>
              <Link
                href={`/products/${p.slug}`}
                className='text-sm underline underline-offset-4'
              >
                View
              </Link>
            </div>
          </li>
        ))}
      </ul>
    </section>
  )
}
