'use client'

import Image from 'next/image'
import type { PrintArea } from '@/config/print-areas'

// A sensible default safe-area box (center-ish, generous)
const DEFAULT_BOX: PrintArea['box'] = { x: 0.2, y: 0.18, w: 0.6, h: 0.6 }

// Accept either a full PrintArea or a partial with optional box
type AreaInput =
  | PrintArea
  | (Omit<PrintArea, 'box'> & { box?: PrintArea['box'] })

export default function DesignCanvas({
  area,
  artUrl,
  baseColorHex = '#ffffff',
}: {
  area: AreaInput
  artUrl?: string
  baseColorHex?: string
}) {
  // Normalize: always have a box
  const box = area.box ?? DEFAULT_BOX

  return (
    <div className='relative w-full aspect-[1/1] overflow-hidden bg-gray-50'>
      {/* 1) Garment color layer */}
      <div
        className='absolute inset-0'
        style={{ backgroundColor: baseColorHex }}
      />

      {/* 2) Transparent tee mockup on top of the color layer */}
      {!!area.mock && (
        <Image
          src={area.mock.src}
          alt={area.mock.alt ?? `${area.side} mockup`}
          fill
          priority
          sizes='(max-width: 1024px) 100vw, 50vw'
          className='object-contain pointer-events-none select-none'
        />
      )}

      {/* 3) Safe area dashed guide */}
      <div
        className='absolute border-2 border-dashed border-white/70'
        style={{
          left: `${box.x * 100}%`,
          top: `${box.y * 100}%`,
          width: `${box.w * 100}%`,
          height: `${box.h * 100}%`,
        }}
      />

      {/* 4) Artwork preview, auto-fit inside safe area (contain) */}
      {artUrl && (
        <div
          className='absolute overflow-hidden'
          style={{
            left: `${box.x * 100}%`,
            top: `${box.y * 100}%`,
            width: `${box.w * 100}%`,
            height: `${box.h * 100}%`,
          }}
        >
          <Image
            src={artUrl}
            alt='Artwork'
            fill
            sizes='(max-width: 1024px) 100vw, 50vw'
            className='object-contain'
          />
        </div>
      )}
    </div>
  )
}
