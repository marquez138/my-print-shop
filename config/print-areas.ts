// config/print-areas.ts

export type Side = 'front' | 'back' | 'sleeve'

/** Every area must define its normalized safe-zone box inside the mockup canvas */
export type PrintArea = {
  id: string
  label: string
  side: Side
  /** Normalized safe-area in the mockup: 0..1 coordinates */
  box: { x: number; y: number; w: number; h: number }
  /** Optional mock image to show under the overlay in previews */
  mock?: { src: string; alt?: string }
}

/**
 * Example data — keep your existing `id`s, just add `box` (and mock if you have one).
 * Tweak x/y/w/h to match your artwork safe zones.
 */
export const PRINT_AREAS: PrintArea[] = [
  {
    id: 'fullFront',
    label: 'Full Front',
    side: 'front',
    box: { x: 0.2, y: 0.18, w: 0.6, h: 0.6 },
    mock: { src: '/images/mockups/tee-front.jpg', alt: 'Front mockup' },
  },
  {
    id: 'leftChest',
    label: 'Left Chest',
    side: 'front',
    box: { x: 0.62, y: 0.24, w: 0.18, h: 0.18 },
    mock: { src: '/images/mockups/tee-front.jpg', alt: 'Front mockup' },
  },
  {
    id: 'fullBack',
    label: 'Full Back',
    side: 'back',
    box: { x: 0.2, y: 0.18, w: 0.6, h: 0.6 },
    mock: { src: '/images/mockups/tee-back.jpg', alt: 'Back mockup' },
  },
  {
    id: 'rightSleeve',
    label: 'Right Sleeve',
    side: 'sleeve',
    box: { x: 0.65, y: 0.35, w: 0.2, h: 0.2 },
    mock: { src: '/images/mockups/tee-front.jpg', alt: 'Sleeve mockup' },
  },
]
