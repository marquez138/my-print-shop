import { prisma } from '@/lib/db'

async function seedProduct() {
  console.log('🌱 Seeding Unisex Jersey Tee...')
  const slug = 'unisex-jersey-tee'

  // Wipe if exists
  await prisma.product.deleteMany({ where: { slug } })

  // 1️⃣ Create base product
  const product = await prisma.product.create({
    data: {
      slug,
      name: 'Unisex Jersey Tee',
      brand: 'Bella+Canvas',
      description:
        'Crafted from premium ring-spun cotton with a classic fit and soft-hand screen print.',
      basePrice: 2800, // cents
    },
  })

  // 2️⃣ Create variants (color x size)
  const colors = ['White', 'Black', 'Ash']
  const sizes = ['S', 'M', 'L']
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
  await prisma.productVariant.createMany({ data: variantData })

  // 3️⃣ Create images for each color
  const imageSets = [
    {
      color: 'Black',
      images: [
        { url: '/media/black-front.jpg', tag: 'front', alt: 'Black Front' },
        { url: '/media/black-back.jpg', tag: 'back', alt: 'Black Back' },
        // { url: '/media/black-detail.jpg', tag: 'detail', alt: 'Black Detail' },
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
        { url: '/media/green-front.jpg', tag: 'front', alt: 'Green Front' },
        { url: '/media/green-back.jpg', tag: 'back', alt: 'Green Back' },
      ],
    },
  ]

  let pos = 0
  for (const set of imageSets) {
    for (const img of set.images) {
      await prisma.productImage.create({
        data: {
          productId: product.id,
          ...img,
          color: set.color,
          position: pos++,
        },
      })
    }
  }

  console.log(`✅ Created ${product.name} with variants & images.`)
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
