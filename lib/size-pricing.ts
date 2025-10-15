// lib/size-pricing.ts

/**
 * Canonical size order you want to display/save in.
 * Keep this list in sync with your Variant sizes.
 */
export const SIZE_ORDER = [
  'XS',
  'S',
  'M',
  'L',
  'XL',
  '2XL',
  '3XL',
  '4XL',
  '5XL',
] as const
export type SizeCode = (typeof SIZE_ORDER)[number]

/**
 * Per-size surcharge, in cents.
 * e.g. 2XL +$1.75 → 175, 3XL +$3.70 → 370
 * Sizes not present are treated as 0.
 */
export const SIZE_SURCHARGE_CENTS: Record<SizeCode, number> = {
  XS: 0,
  S: 0,
  M: 0,
  L: 0,
  XL: 0,
  '2XL': 175,
  '3XL': 370,
  '4XL': 575,
  '5XL': 790,
}

/**
 * Returns the *unit price* (base + surcharge) for a given size.
 */
export function unitPriceForSize(
  basePriceCents: number,
  size: SizeCode
): number {
  const bump = SIZE_SURCHARGE_CENTS[size] ?? 0
  return basePriceCents + bump
}

/**
 * Validate that all keys are known sizes and values are non-negative integers.
 * Returns a normalized map (only known sizes) or throws an Error for invalid input.
 */
export function normalizeQuantities(
  input: Record<string, number | string | null | undefined>
): Record<SizeCode, number> {
  const out = {} as Record<SizeCode, number>

  for (const s of SIZE_ORDER) {
    const raw = input[s]
    if (raw === undefined || raw === null || raw === '') {
      out[s] = 0
      continue
    }
    const n = typeof raw === 'string' ? Number(raw) : raw
    if (!Number.isFinite(n) || n < 0 || Math.floor(n) !== n) {
      throw new Error(`Invalid qty for size "${s}"`)
    }
    out[s] = n
  }

  // Also ensure no *extra* keys were provided
  for (const k of Object.keys(input)) {
    if (!SIZE_ORDER.includes(k as SizeCode)) {
      throw new Error(`Unknown size key "${k}"`)
    }
  }

  return out
}

/**
 * Compute a quick summary: total quantity and extended total in cents.
 * Accepts normalized quantities.
 */
export function summarizeQuantities(
  basePriceCents: number,
  q: Record<SizeCode, number>
): { totalQty: number; totalCents: number } {
  let totalQty = 0
  let totalCents = 0

  for (const s of SIZE_ORDER) {
    const qty = q[s] ?? 0
    if (!qty) continue
    totalQty += qty
    totalCents += unitPriceForSize(basePriceCents, s) * qty
  }

  return { totalQty, totalCents }
}

/**
 * Produce payloads suitable for creating/upserting DesignLineItem rows.
 * (You’ll still set `designId` at write time in your API.)
 */
export function buildLineItems(
  basePriceCents: number,
  variantSku: string,
  q: Record<SizeCode, number>
): Array<{
  size: SizeCode
  variantSku: string
  qty: number
  unitPrice: number
  surcharge: number
}> {
  const items: Array<{
    size: SizeCode
    variantSku: string
    qty: number
    unitPrice: number
    surcharge: number
  }> = []

  for (const s of SIZE_ORDER) {
    const qty = q[s] ?? 0
    if (!qty) continue
    const surcharge = SIZE_SURCHARGE_CENTS[s] ?? 0
    items.push({
      size: s,
      variantSku,
      qty,
      unitPrice: basePriceCents + surcharge,
      surcharge,
    })
  }
  return items
}

/**
 * Convenience: render a display string like "+$1.75" for a size.
 */
export function displaySurcharge(size: SizeCode): string {
  const c = SIZE_SURCHARGE_CENTS[size] ?? 0
  if (!c) return '+$0.00'
  return `+${formatUSD(c)}`
}

/**
 * Format cents → USD (e.g. 175 → "$1.75")
 */
export function formatUSD(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`
}
