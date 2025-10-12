// app/products/[slug]/ProductView.tsx
'use client'

import Image from 'next/image'
import { useMemo, useState, useTransition } from 'react'

type Img = {
  url: string
  alt: string | null
  tag: string | null
  color: string | null
  position: number
}
type Var = {
  sku: string
  color: string | null
  size: string | null
  price: number | null
  offerPrice: number | null
}

type ProductVM = {
  id: string
  slug: string
  name: string
  brand?: string | null
  description?: string | null
  basePrice: number
  images: Img[]
  variants: Var[]
}

const usd = (cents?: number | null) =>
  typeof cents === 'number' ? `$${(cents / 100).toFixed(2)}` : '$0.00'

export default function ProductView({ product }: { product: ProductVM }) {
  // ------- derive distinct colors (prefer from images, fallback to variants)
  const colors = useMemo(() => {
    const imgColors = new Set(
      product.images.map((i) => i.color).filter(Boolean) as string[]
    )
    const varColors = new Set(
      product.variants.map((v) => v.color).filter(Boolean) as string[]
    )
    const out = Array.from(imgColors.size ? imgColors : varColors)
    return out.length ? out : (['Default'] as string[])
  }, [product.images, product.variants])

  const initialColor = colors.find((c) => c !== 'Default') ?? colors[0]
  const [color, setColor] = useState<string>(initialColor)
  const [size, setSize] = useState<string>(() => {
    const first =
      product.variants.find(
        (v) => (v.color ?? 'Default') === (initialColor ?? 'Default')
      )?.size ?? 'Std'
    return first
  })
  const [qty, setQty] = useState(1)
  const [isPending, start] = useTransition()

  // ------- gallery strictly for chosen color (or all if no color tags exist)
  const gallery = useMemo(() => {
    const anyTagged = product.images.some((i) => !!i.color)
    const pool = anyTagged
      ? product.images.filter((i) => i.color === color)
      : product.images
    return [...pool].sort((a, b) => {
      const aF = a.tag === 'front' ? -1 : 0
      const bF = b.tag === 'front' ? -1 : 0
      return aF - bF || a.position - b.position
    })
  }, [product.images, color])

  // ------- sizes for chosen color
  const sizes = useMemo(() => {
    const set = new Set(
      product.variants
        .filter((v) => (v.color ?? 'Default') === (color ?? 'Default'))
        .map((v) => v.size ?? 'Std')
    )
    const arr = Array.from(set)
    if (!arr.includes(size)) setSize(arr[0] ?? 'Std')
    return arr
  }, [product.variants, color]) // eslint-disable-line react-hooks/exhaustive-deps

  // ------- price: min of (offerPrice|price) for that color
  const price = useMemo(() => {
    const nums = product.variants
      .filter((v) => (v.color ?? 'Default') === (color ?? 'Default'))
      .map((v) => (typeof v.offerPrice === 'number' ? v.offerPrice : v.price))
      .filter((n): n is number => typeof n === 'number')
    return nums.length ? Math.min(...nums) : product.basePrice
  }, [product.variants, color, product.basePrice])

  // ------- find sku by color+size (for add-to-cart later)
  const sku = useMemo(() => {
    return (
      product.variants.find(
        (v) =>
          (v.color ?? 'Default') === (color ?? 'Default') &&
          (v.size ?? 'Std') === size
      )?.sku ?? ''
    )
  }, [product.variants, color, size])

  // ------- swatch thumbnail uses the “front” image of that color
  function thumbFor(c: string) {
    return (
      product.images.find((i) => i.color === c && i.tag === 'front')?.url ??
      product.images.find((i) => i.color === c)?.url ??
      '/images/placeholder.png'
    )
  }

  return (
    <main className='mx-auto max-w-[1500px] p-4 sm:p-6 lg:p-8'>
      <div className='grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-10'>
        {/* Gallery */}
        <section className='lg:col-span-7'>
          <div className='grid grid-cols-2 sm:grid-cols-3 gap-3'>
            {gallery.map((img, i) => (
              <div
                key={`${img.url}-${i}`}
                className='relative aspect-[4/5] overflow-hidden rounded-xl bg-gray-50'
              >
                <Image
                  src={img.url}
                  alt={img.alt ?? ''}
                  fill
                  priority={i < 2}
                  sizes='(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 33vw'
                  className='object-cover transition-transform duration-300 hover:scale-105'
                />
              </div>
            ))}
          </div>
        </section>

        {/* Buy box */}
        <aside className='lg:col-span-5 lg:sticky lg:top-8 h-fit'>
          <div className='rounded-2xl border p-4 sm:p-5 lg:p-6'>
            <div className='flex items-start justify-between gap-3'>
              <div>
                <h1 className='text-xl sm:text-2xl font-semibold leading-tight'>
                  {product.name}
                </h1>
                {product.brand && (
                  <div className='mt-1 text-xs text-gray-500'>
                    {product.brand}
                  </div>
                )}
              </div>
              <div className='text-right'>
                <div className='text-lg sm:text-xl font-semibold'>
                  {usd(price)}
                </div>
                <div className='text-[11px] text-gray-500'>
                  or 4 payments with Klarna
                </div>
              </div>
            </div>

            {/* Color swatches */}
            <div className='mt-6'>
              <label className='block text-sm font-medium text-gray-700 mb-2'>
                Color
              </label>
              <div className='flex flex-wrap gap-2'>
                {colors.map((c) => {
                  const active = c === color
                  return (
                    <button
                      key={c}
                      type='button'
                      onClick={() => setColor(c)}
                      aria-label={c}
                      title={c}
                      className={`relative h-16 w-14 overflow-hidden rounded-md border bg-white focus:outline-none focus:ring-2 focus:ring-black ${
                        active ? 'ring-1 ring-black' : ''
                      }`}
                    >
                      <Image
                        src={thumbFor(c)}
                        alt={`${c} front`}
                        fill
                        className='object-cover'
                      />
                      <span className='absolute bottom-0 inset-x-0 bg-white/70 text-[10px] text-center'>
                        {c}
                      </span>
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Size */}
            <div className='mt-4'>
              <div className='flex items-center justify-between mb-2'>
                <label className='text-sm font-medium text-gray-700'>
                  Size
                </label>
                <button className='text-xs underline'>Size Guide</button>
              </div>
              <div className='grid grid-cols-6 gap-2 sm:grid-cols-8'>
                {sizes.map((s) => {
                  const active = s === size
                  return (
                    <button
                      key={s}
                      type='button'
                      onClick={() => setSize(s)}
                      className={`h-9 rounded-lg border text-sm font-medium hover:bg-gray-50 ${
                        active ? 'ring-1 ring-black' : ''
                      }`}
                    >
                      {s}
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Qty + Add to cart (placeholder) */}
            <div className='mt-6 space-y-2'>
              <div className='flex items-center gap-2'>
                <label className='text-sm'>Qty</label>
                <select
                  value={qty}
                  onChange={(e) => setQty(Number(e.target.value))}
                  className='h-9 rounded-lg border px-2'
                >
                  {Array.from({ length: 10 }).map((_, i) => (
                    <option key={i + 1} value={i + 1}>
                      {i + 1}
                    </option>
                  ))}
                </select>
              </div>

              <button
                type='button'
                disabled={isPending || !sku}
                onClick={() =>
                  start(async () => {
                    // TODO: hook to your cart server action
                    console.log('addToCart', {
                      productId: product.id,
                      variantSku: sku,
                      qty,
                    })
                    alert('Add-to-cart wired later')
                  })
                }
                className='w-full rounded-xl bg-black px-5 py-3 text-white font-medium shadow-sm hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-black disabled:opacity-60'
              >
                {isPending ? 'Adding…' : `ADD TO CART • ${usd(price)}`}
              </button>

              <div className='text-[11px] text-gray-500'>
                Save with membership • Free shipping over $50
              </div>
            </div>

            {/* Details accordions under buy box */}
            <div className='mt-8 divide-y divide-gray-300 border-t border-gray-300'>
              <Accordion title='Details'>
                <p className='text-sm leading-6 text-gray-700'>
                  {product.description ??
                    'Premium ring-spun cotton with a classic fit. Soft-hand print and interior neck label.'}
                </p>
              </Accordion>
              <Accordion title='Shipping & Returns' isLast>
                <p className='text-sm leading-6 text-gray-700'>
                  Ships in 2–4 business days. Free returns within 30 days for
                  unworn items.
                </p>
              </Accordion>
            </div>
          </div>
        </aside>
      </div>
    </main>
  )
}

/* ---------- Small presentational helper ---------- */
function Accordion({
  title,
  children,
  isLast = false,
}: {
  title: string
  children: React.ReactNode
  isLast?: boolean
}) {
  return (
    <details
      className={`group py-6 ${isLast ? 'border-b border-gray-300' : ''}`}
    >
      <summary className='cursor-pointer select-none list-none font-medium flex items-center justify-between'>
        <span>{title}</span>
        <span className='text-gray-400 transition-transform duration-200 group-open:rotate-180'>
          ▾
        </span>
      </summary>
      <div className='mt-3'>{children}</div>
    </details>
  )
}
