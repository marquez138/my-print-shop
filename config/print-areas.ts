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
    x: 0.6,
    y: 0.3,
    width: 0.15,
    height: 0.15,
    price: 200,
  },
  {
    id: 'centerChest',
    label: 'Center Chest',
    side: 'front',
    mockup: '/mockups/front.png',
    x: 0.3,
    y: 0.3,
    width: 0.4,
    height: 0.14,
    price: 300,
  },
  {
    id: 'fullFront',
    label: 'Full Front',
    side: 'front',
    mockup: '/mockups/front.png',
    x: 0.3,
    y: 0.3,
    width: 0.4,
    height: 0.4,
    price: 500,
  },
  // {
  //   id: 'oversizeFront',
  //   label: 'Oversize Front',
  //   side: 'front',
  //   mockup: '/mockups/front.png',
  //   x: 0.12,
  //   y: 0.16,
  //   width: 0.76,
  //   height: 0.74,
  //   price: 1200,
  // },

  // Back
  {
    id: 'backCollar',
    label: 'Back Collar',
    side: 'back',
    mockup: '/mockups/back.png',
    x: 0.46,
    y: 0.21,
    width: 0.1,
    height: 0.06,
    price: 200,
  },
  {
    id: 'upperBack',
    label: 'Upper Back',
    side: 'back',
    mockup: '/mockups/back.png',
    x: 0.3,
    y: 0.23,
    width: 0.4,
    height: 0.14,
    price: 300,
  },
  {
    id: 'fullBack',
    label: 'Full Back',
    side: 'back',
    mockup: '/mockups/back.png',
    x: 0.3,
    y: 0.24,
    width: 0.4,
    height: 0.45,
    price: 500,
  },

  // Sleeve
  {
    id: 'leftSleeve',
    label: 'Left Sleeve',
    side: 'sleeve',
    mockup: '/mockups/sleeve-left.png',
    x: 0.28,
    y: 0.48,
    width: 0.45,
    height: 0.2,
    price: 200,
  },
  {
    id: 'rightSleeve',
    label: 'Right Sleeve',
    side: 'sleeve',
    mockup: '/mockups/sleeve-left.png',
    x: 0.28,
    y: 0.48,
    width: 0.45,
    height: 0.2,
    price: 200,
  },
]
