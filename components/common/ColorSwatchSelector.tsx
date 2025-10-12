'use client'

import Image from 'next/image'
import { useId } from 'react'

type Color = {
  id: string          // e.g. "black"
  name: string        // e.g. "Black"
  hex?: string        // optional fallback if you don't have thumbs
  thumbSrc?: string   // optional thumb image to show in the swatch
}

export default function ColorSwatchSelector({
  colors,
  value,
  onChange,
  className = '',
}: {
  colors: Color[]
  value?: string
  onChange: (id: string) => void
  className?: string
}) {
  const name = useId()

  return (
    <div className={className}>
      <div className="flex flex-wrap gap-2">
        {colors.map((c) => {
          const active = c.id === value
          return (
            <button
              key={c.id}
              type="button"
              aria-pressed={active}
              aria-label={c.name}
              onClick={() => onChange(c.id)}
              className={`relative h-12 w-10 overflow-hidden rounded border focus:outline-none ${
                active ? 'ring-2 ring-black' : ''
              }`}
              title={c.name}
            >
              {c.thumbSrc ? (
                <Image src={c.thumbSrc} alt={c.name} fill className="object-cover" />
              ) : (
                <span
                  className="absolute inset-0"
                  style={{ backgroundColor: c.hex ?? '#e5e7eb' }}
                />
              )}
            </button>
          )
        })}
      </div>

      {value && (
        <div className="mt-2 text-xs text-gray-600">
          Selected: <span className="font-medium">{colors.find(x => x.id === value)?.name}</span>
        </div>
      )}
    </div>
  )
}
