// app/products/[slug]/page.tsx
export const runtime = 'nodejs'

import { use } from 'react'
import { prisma } from '@/lib/db'
import ProductView from './ProductView'

export default async function ProductPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = use(params)

  try {
    const product = await prisma.product.findUnique({
      where: { slug },
      include: {
        images: {
          select: {
            url: true,
            alt: true,
            tag: true,
            color: true,
            position: true,
          },
          orderBy: { position: 'asc' },
        },
        variants: {
          select: {
            sku: true,
            color: true,
            size: true,
            price: true,
            offerPrice: true,
          },
        },
      },
    })

    if (!product) {
      return (
        <div className='py-24 text-center'>
          <h1 className='text-xl font-semibold'>Product not found</h1>
          <p className='text-sm text-gray-500 mt-2'>Slug: {slug}</p>
        </div>
      )
    }

    return <ProductView product={product} />
  } catch (err: any) {
    // This shows up in Vercel → Functions logs
    console.error('[ProductPage] Failed to load product', {
      slug,
      message: err?.message,
      stack: err?.stack,
    })
    return (
      <div className='py-24 text-center'>
        <h1 className='text-xl font-semibold'>Something went wrong</h1>
        <p className='text-sm text-gray-500 mt-2'>
          We couldn’t load this product.
        </p>
      </div>
    )
  }
}
