'use client'

import Image from 'next/image'
import type { PrintArea } from '@/config/print-areas'

export default function DesignCanvas({
  area,
  artUrl,
  baseColorHex = '#ffffff', // ← NEW
}: {
  area: PrintArea
  artUrl?: string
  baseColorHex?: string
}) {
  return (
    <div className='relative w-full aspect-[4/5] rounded-xl overflow-hidden border bg-gray-50'>
      {/* 1) Garment color layer (sits at the very back) */}
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
          left: `${area.box.x * 100}%`,
          top: `${area.box.y * 100}%`,
          width: `${area.box.w * 100}%`,
          height: `${area.box.h * 100}%`,
        }}
      />

      {/* 4) Artwork preview, auto-fit inside safe area (cover) */}
      {artUrl && (
        <div
          className='absolute overflow-hidden'
          style={{
            left: `${area.box.x * 100}%`,
            top: `${area.box.y * 100}%`,
            width: `${area.box.w * 100}%`,
            height: `${area.box.h * 100}%`,
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
