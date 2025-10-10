// app/lib/print-areas.ts
// Minimal server-side map that mirrors your client config IDs.
// Keep this in sync with /config/print-areas.ts

export type PrintSide = 'front' | 'back' | 'sleeve'

export const PRINT_AREA_MAP: Record<
  string,
  { side: PrintSide; price: number }
> = {
  leftChest: { side: 'front', price: 200 },
  centerChest: { side: 'front', price: 300 },
  fullFront: { side: 'front', price: 500 },
  oversizeFront: { side: 'front', price: 700 },

  backCollar: { side: 'back', price: 200 },
  upperBack: { side: 'back', price: 300 },
  fullBack: { side: 'back', price: 500 },

  leftSleeve: { side: 'sleeve', price: 200 },
}

export function areaInfoOrThrow(areaId: string) {
  const info = PRINT_AREA_MAP[areaId]
  if (!info) throw new Error(`Unknown areaId: ${areaId}`)
  return info
}
