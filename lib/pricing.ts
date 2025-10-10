import { PRINT_AREAS } from '@/config/print-areas'

export function computeSurcharges(uploads: Record<string, string>) {
  // sum the per-area price for areas that have an uploaded asset
  return PRINT_AREAS.filter((a) => uploads[a.id]).reduce(
    (sum, a) => sum + (a.price ?? 0),
    0
  )
}

export function computeTotals(
  baseCents: number,
  uploads: Record<string, string>
) {
  const fees = computeSurcharges(uploads)
  return { base: baseCents, fees, total: baseCents + fees }
}
