'use client'

import Image from 'next/image'
import { useMemo, useState } from 'react'
import StartDesignButton from './StartDesignButton'
import ColorSwatchSelector from '@/components/common/ColorSwatchSelector'

type ProductImage = {
  url: string
  alt: string | null
  tag: string | null
  color: string | null
  position: number
}

type Variant = {
  sku: string
  color: string | null
  size: string | null
  price: number | null
  offerPrice: number | null
}

export default function ProductView({
  product,
}: {
  product: {
    id: string
    slug: string
    name: string
    brand?: string | null
    description?: string | null
    basePrice: number
    images: ProductImage[]
    variants: Variant[]
  }
}) {
  // derive available colors from images, fallback to variants
  const colorList = useMemo(() => {
    const imgColors = new Set(
      product.images.map((i) => i.color).filter((c): c is string => !!c)
    )
    const varColors = new Set(
      product.variants.map((v) => v.color).filter((c): c is string => !!c)
    )
    const unique = Array.from(imgColors.size ? imgColors : varColors)
    // normalize into selector items
    const hexMap: Record<string, string> = {
      white: '#ffffff',
      black: '#000000',
      ash: '#e1e1e1',
      gray: '#9ca3af',
      green: '#10b981',
      red: '#ef4444',
      blue: '#3b82f6',
    }
    return unique.map((name) => {
      const id = name.toLowerCase()
      return { id, name, hex: hexMap[id] }
    })
  }, [product.images, product.variants])

  const [color, setColor] = useState<string | undefined>(
    colorList[0]?.id ?? undefined
  )

  // build gallery filtered by selected color (if images are color-tagged)
  const gallery = useMemo(() => {
    const anyTagged = product.images.some((i) => !!i.color)
    let pool = product.images
    if (anyTagged && color) {
      // match case-insensitively
      pool = product.images.filter(
        (i) => i.color?.toLowerCase() === color.toLowerCase()
      )
      if (pool.length === 0) {
        // fallback to all if no images for this color yet
        pool = product.images
      }
    }
    const sorted = [...pool].sort((a, b) => {
      const af = a.tag === 'front' ? -1 : 0
      const bf = b.tag === 'front' ? -1 : 0
      return af - bf || a.position - b.position
    })
    return sorted
  }, [product.images, color])

  const priceCents = product.basePrice
  const usd = (c: number) => `$${(c / 100).toFixed(2)}`

  return (
    <div className='grid grid-cols-1 lg:grid-cols-12 gap-8'>
      {/* Gallery */}
      <section className='lg:col-span-7'>
        {gallery.length === 0 ? (
          <div className='aspect-[4/5] rounded-xl bg-gray-100' />
        ) : (
          <div className='grid grid-cols-1 sm:grid-cols-2 gap-3'>
            {gallery.map((img, i) => (
              <div
                key={`${img.url}-${i}`}
                className='relative aspect-[4/5] overflow-hidden bg-gray-50 rounded-xl'
              >
                <Image
                  src={img.url}
                  alt={img.alt ?? ''}
                  fill
                  priority={i < 2}
                  sizes='(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 33vw'
                  className='object-cover'
                />
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Info / Start design */}
      <aside className='lg:col-span-5 space-y-5'>
        <div>
          <h1 className='text-2xl font-semibold uppercase'>{product.name}</h1>
          {product.brand && (
            <div className='text-xs text-gray-500 mt-1'>{product.brand}</div>
          )}
        </div>

        <div className='text-sm text-gray-600'>Base from {usd(priceCents)}</div>

        {/* Color picker only if we have colors */}
        {colorList.length > 0 && (
          <div>
            <label className='block text-sm font-medium mb-2'>Color</label>
            <ColorSwatchSelector
              colors={colorList}
              value={color}
              onChange={setColor}
            />
          </div>
        )}

        {/* Start design — carries selected color */}
        <StartDesignButton
          slug={product.slug}
          basePrice={priceCents}
          color={color}
          className='inline-flex h-11 items-center justify-center rounded-lg bg-black px-5 text-white'
        />

        {product.description && (
          <p className='text-sm text-gray-600'>{product.description}</p>
        )}
      </aside>
    </div>
  )
}
