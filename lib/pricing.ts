// lib/pricing.ts
import { PRINT_AREAS } from '@/config/print-areas'

export function computeSurcharges(uploads: Record<string, string>) {
  // uploads is a map of { areaId: artUrl }
  let sum = 0
  for (const areaId of Object.keys(uploads)) {
    const area = PRINT_AREAS.find((a) => a.id === areaId)
    sum += area?.surchargeCents ?? 0
  }
  return sum
}

export function computeTotals(
  basePriceCents: number,
  uploads: Record<string, string>
) {
  const fees = computeSurcharges(uploads)
  return {
    base: basePriceCents,
    fees,
    total: basePriceCents + fees,
  }
}
