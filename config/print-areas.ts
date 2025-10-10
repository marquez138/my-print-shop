export type Side = 'front' | 'back' | 'sleeve'
export type PrintArea = {
  id: string
  label: string
  side: 'front' | 'back' | 'sleeve'
  box: { x: number; y: number; w: number; h: number }
  mock?: { src: string; alt?: string }
  price?: number // <-- ensure this exists
}

export const PRINT_AREAS: PrintArea[] = [
  // FRONT
  {
    id: 'front-full',
    label: 'Full Front',
    side: 'front',
    box: { x: 0.15, y: 0.12, w: 0.7, h: 0.75 },
    mock: { src: '/mockups/tee-front.png', alt: 'Front mockup' },
    price: 600,
  },
  {
    id: 'left-chest',
    label: 'Left Chest',
    side: 'front',
    box: { x: 0.62, y: 0.2, w: 0.2, h: 0.2 },
    mock: { src: '/mockups/tee-front.png' },
    price: 300,
  },
  {
    id: 'right-chest',
    label: 'Right Chest',
    side: 'front',
    box: { x: 0.18, y: 0.2, w: 0.2, h: 0.2 },
    mock: { src: '/mockups/tee-front.png' },
    price: 300,
  },
  // “Collar” mapped to FRONT to avoid enum migration
  {
    id: 'collar',
    label: 'Collar',
    side: 'front', // ← map under an existing side
    box: { x: 0.38, y: 0.04, w: 0.24, h: 0.1 },
    mock: { src: '/mockups/tee-front.png' },
    price: 200,
  },

  // BACK
  {
    id: 'back-full',
    label: 'Full Back',
    side: 'back',
    box: { x: 0.15, y: 0.12, w: 0.7, h: 0.75 },
    mock: { src: '/mockups/tee-back.png', alt: 'Back mockup' },
    price: 600,
  },
  {
    id: 'neck-tag',
    label: 'Neck Tag',
    side: 'back',
    box: { x: 0.38, y: 0.06, w: 0.24, h: 0.12 },
    mock: { src: '/mockups/tee-back.png' },
    price: 250,
  },

  // SLEEVE
  {
    id: 'sleeve-left',
    label: 'Left Sleeve',
    side: 'sleeve',
    box: { x: 0.15, y: 0.3, w: 0.3, h: 0.3 },
    mock: { src: '/mockups/tee-sleeve-left.png' },
    price: 250,
  },
  {
    id: 'sleeve-right',
    label: 'Right Sleeve',
    side: 'sleeve',
    box: { x: 0.55, y: 0.3, w: 0.3, h: 0.3 },
    mock: { src: '/mockups/tee-sleeve-right.png' },
    price: 250,
  },
]
