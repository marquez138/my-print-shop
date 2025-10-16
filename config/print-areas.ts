export type Side = 'front' | 'back' | 'sleeve'

export type PrintArea = {
  id: string
  label: string
  side: Side
  box: { x: number; y: number; w: number; h: number } // required
  mock?: { src: string; alt?: string }
  price?: number
}

export const PRINT_AREAS: PrintArea[] = [
  // FRONT
  {
    id: 'front-jumbo',
    label: 'Jumbo Front',
    side: 'front',
    box: { x: 0.25, y: 0.24, w: 0.5, h: 0.55 },
    mock: { src: '/mockups/tee-front.png', alt: 'Front mockup' },
    price: 600,
  },
  {
    id: 'front-full',
    label: 'Full Front',
    side: 'front',
    box: { x: 0.3, y: 0.24, w: 0.4, h: 0.5 },
    mock: { src: '/mockups/tee-front.png', alt: 'Front mockup' },
    price: 600,
  },
  {
    id: 'front-center',
    label: 'Center Front',
    side: 'front',
    box: { x: 0.3, y: 0.24, w: 0.4, h: 0.175 },
    mock: { src: '/mockups/tee-front.png', alt: 'Front mockup' },
    price: 600,
  },
  {
    id: 'left-chest',
    label: 'Left Chest',
    side: 'front',
    box: { x: 0.6, y: 0.24, w: 0.15, h: 0.18 },
    mock: { src: '/mockups/tee-front.png' },
    price: 300,
  },
  {
    id: 'right-chest',
    label: 'Right Chest',
    side: 'front',
    box: { x: 0.25, y: 0.24, w: 0.15, h: 0.18 },
    mock: { src: '/mockups/tee-front.png' },
    price: 300,
  },
  // “Collar” mapped to FRONT to avoid enum migration

  // BACK
  {
    id: 'back-full',
    label: 'Full Back',
    side: 'back',
    box: { x: 0.28, y: 0.18, w: 0.43, h: 0.55 },
    mock: { src: '/mockups/tee-back.png', alt: 'Back mockup' },
    price: 600,
  },
  {
    id: 'back-upper',
    label: 'Upper Back',
    side: 'back',
    box: { x: 0.3, y: 0.18, w: 0.4, h: 0.15 },
    mock: { src: '/mockups/tee-back.png', alt: 'Back mockup' },
    price: 600,
  },
  {
    id: 'neck-tag',
    label: 'Neck Tag',
    side: 'back',
    box: { x: 0.43, y: 0.15, w: 0.15, h: 0.07 },
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
