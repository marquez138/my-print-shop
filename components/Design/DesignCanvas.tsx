import Image from 'next/image'
import { type PrintArea } from '@/config/print-areas'

export default function DesignCanvas({
  area,
  artUrl,
}: {
  area: PrintArea
  artUrl?: string
}) {
  return (
    <div className='relative aspect-[4/5] bg-gray-50  overflow-hidden'>
      {/* Base mockup for the side */}
      <Image
        src={area.mockup}
        alt={`${area.side} mockup`}
        fill
        className='object-contain'
        priority
      />

      {/* Safe zone */}
      <div
        className='canvas-safe-zone absolute'
        style={{
          left: `${area.x * 100}%`,
          top: `${area.y * 100}%`,
          width: `${area.width * 100}%`,
          height: `${area.height * 100}%`,
        }}
      />

      {/* Auto-fit overlay: contain inside safe zone */}
      {artUrl && (
        <img
          src={artUrl}
          alt='Artwork'
          className='absolute'
          style={{
            left: `${area.x * 100}%`,
            top: `${area.y * 100}%`,
            width: `${area.width * 100}%`,
            height: `${area.height * 100}%`,
            objectFit: 'contain',
          }}
        />
      )}
    </div>
  )
}
