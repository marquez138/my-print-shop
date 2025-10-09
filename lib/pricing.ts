import { PRINT_AREAS } from '@/config/print-areas'

export function computeSurcharges(uploads: Record<string, string>) {
  return PRINT_AREAS.filter((a) => uploads[a.id]).reduce(
    (sum, a) => sum + a.price,
    0
  )
}
