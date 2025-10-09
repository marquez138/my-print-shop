export type PrintArea = {
  id: string
  label: string
  side: 'front' | 'back' | 'sleeve'
  mockup: string // path to flat outline image for that side
  x: number // normalized 0..1
  y: number
  width: number
  height: number
  price: number // surcharge in cents
}

export const PRINT_AREAS: PrintArea[] = [
  // Front
  {
    id: 'leftChest',
    label: 'Left Chest',
    side: 'front',
    mockup: '/mockups/front.png',
    x: 0.63,
    y: 0.23,
    width: 0.18,
    height: 0.18,
    price: 800,
  },
  {
    id: 'centerChest',
    label: 'Center Chest',
    side: 'front',
    mockup: '/mockups/front.png',
    x: 0.3,
    y: 0.26,
    width: 0.4,
    height: 0.14,
    price: 900,
  },
  {
    id: 'fullFront',
    label: 'Full Front',
    side: 'front',
    mockup: '/mockups/front.png',
    x: 0.2,
    y: 0.22,
    width: 0.6,
    height: 0.62,
    price: 1000,
  },
  {
    id: 'oversizeFront',
    label: 'Oversize Front',
    side: 'front',
    mockup: '/mockups/front.png',
    x: 0.12,
    y: 0.16,
    width: 0.76,
    height: 0.74,
    price: 1200,
  },

  // Back
  {
    id: 'backCollar',
    label: 'Back Collar',
    side: 'back',
    mockup: '/mockups/back.png',
    x: 0.46,
    y: 0.16,
    width: 0.1,
    height: 0.06,
    price: 600,
  },
  {
    id: 'upperBack',
    label: 'Upper Back',
    side: 'back',
    mockup: '/mockups/back.png',
    x: 0.3,
    y: 0.28,
    width: 0.4,
    height: 0.14,
    price: 800,
  },
  {
    id: 'fullBack',
    label: 'Full Back',
    side: 'back',
    mockup: '/mockups/back.png',
    x: 0.22,
    y: 0.26,
    width: 0.56,
    height: 0.6,
    price: 1000,
  },

  // Sleeve
  {
    id: 'leftSleeve',
    label: 'Left Sleeve',
    side: 'sleeve',
    mockup: '/mockups/sleeve-left.png',
    x: 0.62,
    y: 0.51,
    width: 0.2,
    height: 0.12,
    price: 700,
  },
]
