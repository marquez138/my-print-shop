// app/products/[slug]/page.tsx
import { use } from 'react'
import { prisma } from '@/lib/db'
import ProductView from './ProductView'

export default async function ProductPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = use(params)

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
      </div>
    )
  }

  return <ProductView product={product} />
}
