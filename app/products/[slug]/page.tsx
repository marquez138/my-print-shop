// app/products/[slug]/page.tsx
export const runtime = 'nodejs'

import { prisma } from '@/lib/db'
import ProductView from './ProductView'

export default async function ProductPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  // ✅ Unwrap the promise with await (not React.use)
  const { slug } = await params

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
          <p className='text-sm text-gray-500'>Slug: {slug}</p>
        </div>
      )
    }

    return <ProductView product={product} />
  } catch (err: any) {
    // Helpful server log for Vercel/Node
    console.error('[ProductPage error]', {
      slug,
      error: err?.message,
      stack: err?.stack,
    })
    return (
      <div className='py-24 text-center'>
        <h1 className='text-xl font-semibold'>Failed to load product</h1>
        <p className='text-sm text-gray-500'>Please try again in a moment.</p>
      </div>
    )
  }
}
