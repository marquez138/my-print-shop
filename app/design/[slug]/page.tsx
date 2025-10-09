// app/design/[slug]/page.tsx
'use client'

import { use, useMemo, useState } from 'react'
import { PRINT_AREAS, type PrintArea } from '@/config/print-areas'
import DesignCanvas from '@/components/Design/DesignCanvas'
import PrintAreaList from '@/components/Design/PrintAreaList'
import PriceSummary from '@/components/Design/PriceSummary'
import UploadButton from '@/components/Design/UploadButton'

// Helper: find area by id
function getArea(areaId: string): PrintArea {
  const found = PRINT_AREAS.find((a) => a.id === areaId)!
  return found
}

export default function DesignPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>
  searchParams: Promise<{ base?: string }>
}) {
  const { slug } = use(params)
  const resolvedSearch = use(searchParams)
  const basePrice = Number.isFinite(Number(resolvedSearch?.base))
    ? Number(resolvedSearch!.base)
    : 2500

  const [activeArea, setActiveArea] = useState<PrintArea>(PRINT_AREAS[0])
  // Record<areaId, artUrl>
  const [uploads, setUploads] = useState<Record<string, string>>({})

  // 🚫 Allow exactly ONE upload per side: uploading to another area on the same side replaces the previous one.
  function handleUploaded(r: { secure_url: string }) {
    setUploads((prev) => {
      const side = activeArea.side
      // remove any existing uploads on the same side
      const next: Record<string, string> = {}
      for (const [areaId, url] of Object.entries(prev)) {
        if (getArea(areaId).side !== side) next[areaId] = url
      }
      // set the newly uploaded art for the active area
      next[activeArea.id] = r.secure_url
      return next
    })
  }

  function clearActive() {
    setUploads((prev) => {
      const next = { ...prev }
      delete next[activeArea.id]
      return next
    })
  }

  const hasArt = !!uploads[activeArea.id]

  return (
    <div className='grid grid-cols-1 lg:grid-cols-12 gap-8'>
      {/* Left panel */}
      <aside className='lg:col-span-3 space-y-6'>
        <h1 className='text-2xl font-semibold uppercase'>{slug}</h1>
        <PriceSummary basePrice={basePrice} uploads={uploads} />

        {hasArt ? (
          <button
            onClick={clearActive}
            className='w-full h-11 rounded-lg border border-gray-300'
          >
            Remove artwork from “{activeArea.label}”
          </button>
        ) : (
          <UploadButton
            label={`Upload artwork to “${activeArea.label}”`}
            onUploaded={handleUploaded}
          />
        )}

        <p className='text-sm text-gray-600'>
          Only one design per side is allowed. Uploading to a different area on
          the same side will replace the existing design.
        </p>
      </aside>

      {/* Center canvas */}
      <section className='lg:col-span-6'>
        <DesignCanvas area={activeArea} artUrl={uploads[activeArea.id]} />
        <div className='mt-3 text-sm text-gray-600'>
          Showing side:{' '}
          <span className='font-medium capitalize'>{activeArea.side}</span>
        </div>
      </section>

      {/* Right panel */}
      <aside className='lg:col-span-3'>
        <PrintAreaList
          active={activeArea}
          onSelect={setActiveArea}
          uploads={uploads}
        />
      </aside>
    </div>
  )
}
