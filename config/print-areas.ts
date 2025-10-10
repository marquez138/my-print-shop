// config/print-areas.ts
export type Side = 'front' | 'back' | 'sleeve'

export type PrintArea = {
  id: string
  label: string
  side: Side
  box: { x: number; y: number; w: number; h: number }
  mock?: { src: string; alt?: string }
  /** Optional per-side surcharge (in cents) applied when this area has an upload */
  surchargeCents?: number
}

export const PRINT_AREAS: PrintArea[] = [
  {
    id: 'fullFront',
    label: 'Full Front',
    side: 'front',
    box: { x: 0.2, y: 0.18, w: 0.6, h: 0.6 },
    mock: { src: '/images/mockups/tee-front.jpg' },
    surchargeCents: 1000, // $10
  },
  {
    id: 'leftChest',
    label: 'Left Chest',
    side: 'front',
    box: { x: 0.62, y: 0.24, w: 0.18, h: 0.18 },
    mock: { src: '/images/mockups/tee-front.jpg' },
    surchargeCents: 500, // $5
  },
  {
    id: 'fullBack',
    label: 'Full Back',
    side: 'back',
    box: { x: 0.2, y: 0.18, w: 0.6, h: 0.6 },
    mock: { src: '/images/mockups/tee-back.jpg' },
    surchargeCents: 1000,
  },
  {
    id: 'rightSleeve',
    label: 'Right Sleeve',
    side: 'sleeve',
    box: { x: 0.65, y: 0.35, w: 0.2, h: 0.2 },
    mock: { src: '/images/mockups/tee-front.jpg' },
    surchargeCents: 400, // $4
  },
]
