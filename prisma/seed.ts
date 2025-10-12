// prisma/seed.ts
import { prisma } from '@/lib/db'

async function seedProduct() {
  console.log('🌱 Seeding Unisex Jersey Tee...')
  const slug = 'unisex-jersey-tee'

  // Clean slate for this product
  await prisma.product.deleteMany({ where: { slug } })

  // 1) Create base product
  const product = await prisma.product.create({
    data: {
      slug,
      name: 'Unisex Jersey Tee',
      // brand/description not in your current Product model; add to schema later if you want
      basePrice: 2800, // cents
    },
  })

  // 2) Create variants (color x size)
  const colors = ['White', 'Black', 'Ash'] as const
  const sizes = ['S', 'M', 'L'] as const

  const variantData = []
  for (const c of colors) {
    for (const s of sizes) {
      variantData.push({
        productId: product.id,
        sku: `${slug}-${c.toLowerCase()}-${s}`,
        color: c,
        size: s,
        price: 2800,
        offerPrice: 2500,
      })
    }
  }
  // ✅ Use the correct model name from your schema: Variant
  await prisma.variant.createMany({ data: variantData })

  // 3) Create images for each color (keep colors consistent with variants)
  const imageSets = [
    {
      color: 'Black',
      images: [
        { url: '/media/black-front.jpg', tag: 'front', alt: 'Black Front' },
        { url: '/media/black-back.jpg', tag: 'back', alt: 'Black Back' },
      ],
    },
    {
      color: 'White',
      images: [
        { url: '/media/white-front.jpg', tag: 'front', alt: 'White Front' },
        { url: '/media/white-back.jpg', tag: 'back', alt: 'White Back' },
      ],
    },
    {
      color: 'Green',
      images: [
        { url: '/media/ash-front.jpg', tag: 'front', alt: 'Green Front' },
        { url: '/media/ash-back.jpg', tag: 'back', alt: 'Green Back' },
      ],
    },
  ] as const

  let pos = 0
  for (const set of imageSets) {
    for (const img of set.images) {
      await prisma.productImage.create({
        data: {
          productId: product.id,
          url: img.url,
          alt: img.alt,
          tag: img.tag,
          color: set.color, // allows filtering images by selected color
          position: pos++,
        },
      })
    }
  }

  console.log(
    `✅ Created ${product.name} with ${variantData.length} variants & ${pos} images.`
  )
}

async function main() {
  await seedProduct()
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
