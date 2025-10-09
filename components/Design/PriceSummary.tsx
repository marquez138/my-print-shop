import { PRINT_AREAS } from '@/config/print-areas'
import { computeSurcharges } from '@/lib/pricing'

export default function PriceSummary({
  basePrice,
  uploads,
}: {
  basePrice: number
  uploads: Record<string, string>
}) {
  const areasCount = Object.keys(uploads).length
  const surcharges = computeSurcharges(uploads)
  const total = basePrice + surcharges

  return (
    <div className='border rounded-xl p-4 space-y-2'>
      <div className='flex justify-between text-sm'>
        <span>Base garment</span>
        <span>${(basePrice / 100).toFixed(2)}</span>
      </div>
      <div className='flex justify-between text-sm'>
        <span>Print areas ({areasCount})</span>
        <span>${(surcharges / 100).toFixed(2)}</span>
      </div>
      <hr />
      <div className='flex justify-between font-semibold'>
        <span>Subtotal</span>
        <span>${(total / 100).toFixed(2)}</span>
      </div>
      <button
        className='w-full h-11 rounded-lg bg-black text-white mt-3 text-sm disabled:opacity-50'
        disabled={areasCount === 0}
      >
        Add to Cart
      </button>
    </div>
  )
}
