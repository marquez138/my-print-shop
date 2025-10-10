// components/Design/DesignCanvas.tsx
import Image from 'next/image'

type Side = 'front' | 'back' | 'sleeve'

type PrintAreaLike = {
  id: string
  label: string
  side: Side
  // normalized safe-area box inside the canvas (0..1)
  box: { x: number; y: number; w: number; h: number }
  // optional mock background image for this side
  mock?: { src: string; alt?: string }
}

export default function DesignCanvas({
  area,
  artUrl,
  // normalized placement; default to “top” alignment
  x = 0,
  y = 0,
  scale = 1,
}: {
  area: PrintAreaLike
  artUrl?: string | null
  x?: number
  y?: number
  scale?: number
}) {
  const box = area.box

  return (
    <div className='relative mx-auto aspect-[4/5] w-full max-w-[700px] overflow-hidden rounded-xl bg-white'>
      {/* Base mockup for the side */}
      {area.mock ? (
        <Image
          src={area.mock.src}
          alt={area.mock.alt || `${area.side} mockup`}
          fill
          className='object-cover'
          priority
        />
      ) : (
        <div className='absolute inset-0 bg-gray-50' />
      )}

      {/* Safe-area outline */}
      <div
        className='absolute border-2 border-emerald-400/70'
        style={{
          left: `${box.x * 100}%`,
          top: `${box.y * 100}%`,
          width: `${box.w * 100}%`,
          height: `${box.h * 100}%`,
        }}
        title={`${area.label} safe area`}
      />

      {/* Artwork overlay within safe-area using normalized coords */}
      {artUrl ? (
        <div
          className='absolute'
          style={{
            left: `${(box.x + box.w * x) * 100}%`,
            top: `${(box.y + box.h * y) * 100}%`,
            width: `${box.w * scale * 100}%`,
          }}
        >
          <Image
            src={artUrl}
            alt='Artwork'
            width={1200}
            height={1200}
            className='h-auto w-full object-contain drop-shadow'
          />
        </div>
      ) : (
        <div className='absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded bg-white/80 px-3 py-1 text-xs text-gray-600'>
          No artwork in “{area.label}”
        </div>
      )}
    </div>
  )
}
