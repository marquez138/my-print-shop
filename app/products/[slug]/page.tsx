'use client'

import { use, useState } from 'react'
import ColorSwatchSelector from '@/components/common/ColorSwatchSelector'
import StartDesignButton from './StartDesignButton'

export default function ProductPage({
params,
}: {
// In the App Router, params is a Promise; we unwrap with React.use()
params: Promise<{ slug: string }>
}) {
const { slug } = use(params)

// TODO: replace this with a real DB fetch by slug
const product = {
slug,
name: 'Unisex Jersey Tee',
basePrice: 800, // cents
colors: [
{ id: 'white', name: 'White', hex: '#ffffff' },
{ id: 'black', name: 'Black', hex: '#000000' },
{ id: 'ash', name: 'Ash', hex: '#e1e1e1' },
],
}

const [color, setColor] = useState<string | undefined>(
product.colors[0]?.id
)

return (
<div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
{/* Gallery placeholder */}
<section className="lg:col-span-7">
<div className="aspect-[4/5] bg-gray-100 rounded-xl" />
</section>

{/* Buy box */}
<aside className="lg:col-span-5 space-y-5">
<h1 className="text-2xl font-semibold uppercase">{product.name}</h1>
<div className="text-sm text-gray-600">
Base from ${(product.basePrice / 100).toFixed(2)}
</div>

{/* Color picker */}
<div>
<label className="block text-sm font-medium mb-2">Color</label>
<ColorSwatchSelector
colors={product.colors}
value={color}
onChange={setColor}
/>
</div>

{/* Start design — carries selected color */}
<StartDesignButton
slug={product.slug}
basePrice={product.basePrice}
color={color}
className="inline-flex h-11 items-center justify-center rounded-lg bg-black px-5 text-white"
/>

<p className="text-sm text-gray-600">
Choose your print areas and upload your artwork. We’ll auto-fit it to
each safe zone.
</p>
</aside>
</div>
)
}