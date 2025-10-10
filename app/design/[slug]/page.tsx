'use client'

import { use, useEffect, useState } from 'react'
import { PRINT_AREAS, type PrintArea } from '@/config/print-areas'
import DesignCanvas from '@/components/Design/DesignCanvas'
import PrintAreaList from '@/components/Design/PrintAreaList'
import PriceSummary from '@/components/Design/PriceSummary'
import UploadButton from '@/components/Design/UploadButton'

type ServerDesign = {
  id: string
  pricingBase: number
  pricingFees: number
  pricingTotal: number
  status: string
  placements?: { areaId: string; url: string }[]
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
  const [uploads, setUploads] = useState<Record<string, string>>({})
  const [design, setDesign] = useState<ServerDesign | null>(null)
  const [busy, setBusy] = useState(false)

  // 🌟 STEP 1: Try to hydrate an existing draft first
  useEffect(() => {
    let mounted = true
    ;(async () => {
      try {
        setBusy(true)
        // Check if a draft already exists for this product
        const existing = await fetch(`/api/designs?productId=${slug}`)
        if (existing.ok) {
          const data = await existing.json()
          if (data.design) {
            console.log('Hydrated existing design:', data.design.id)
            if (mounted) {
              setDesign(data.design)
              // preload any existing artwork previews
              const existingUploads: Record<string, string> = {}
              data.design.placements?.forEach((p: any) => {
                existingUploads[p.areaId] = p.url
              })
              setUploads(existingUploads)
              setBusy(false)
              return
            }
          }
        }

        // 🌟 STEP 2: No design found → create a new draft
        const res = await fetch('/api/designs', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            productId: slug,
            variantSku: `${slug}-default`,
            basePrice,
          }),
        })
        if (!res.ok) throw new Error(await res.text())
        const data = await res.json()
        if (mounted) setDesign(data.design)
      } catch (err) {
        console.error('Error creating or hydrating design:', err)
        alert('Failed to load design. Please refresh.')
      } finally {
        setBusy(false)
      }
    })()
    return () => {
      mounted = false
    }
  }, [slug, basePrice])

  // 🌟 Upload handler
  async function handleUploaded(r: {
    secure_url: string
    public_id: string
    width: number
    height: number
  }) {
    if (!design) {
      alert('Design not ready yet. Please wait a moment.')
      return
    }
    try {
      setBusy(true)
      setUploads((u) => ({ ...u, [activeArea.id]: r.secure_url }))
      const res = await fetch(`/api/designs/${design.id}/placements`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          areaId: activeArea.id,
          assetId: r.public_id,
          url: r.secure_url,
          widthPx: r.width,
          heightPx: r.height,
        }),
      })
      if (!res.ok) throw new Error(await res.text())
      const data = await res.json()
      setDesign(data.design)
    } catch (err) {
      console.error(err)
      alert('Failed to save placement.')
    } finally {
      setBusy(false)
    }
  }

  // 🌟 Remove artwork locally (optional)
  function clearActive() {
    setUploads((u) => {
      const next = { ...u }
      delete next[activeArea.id]
      return next
    })
  }

  const hasArt = !!uploads[activeArea.id]
  const effectiveBase = design?.pricingBase ?? basePrice
  const serverFees = design?.pricingFees ?? 0
  const serverTotal = design?.pricingTotal ?? effectiveBase

  return (
    <div className='grid grid-cols-1 lg:grid-cols-12 gap-8'>
      {/* Left panel */}
      <aside className='lg:col-span-3 space-y-6'>
        <h1 className='text-2xl font-semibold uppercase'>{slug}</h1>

        <PriceSummary basePrice={effectiveBase} uploads={uploads} />
        <div className='text-xs text-gray-500'>
          Server subtotal: ${(serverTotal / 100).toFixed(2)}
        </div>

        {hasArt ? (
          <button
            onClick={clearActive}
            disabled={busy}
            className='w-full h-11 rounded-lg border border-gray-300 disabled:opacity-60'
          >
            Remove artwork from “{activeArea.label}”
          </button>
        ) : (
          <UploadButton
            label={
              busy ? 'Please wait…' : `Upload artwork to “${activeArea.label}”`
            }
            onUploaded={handleUploaded}
          />
        )}

        <p className='text-sm text-gray-600'>
          Only one design per side is allowed. Uploading to another area on the
          same side will replace it.
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

      {/* Right area list */}
      <aside className='lg:col-span-3'>
        <PrintAreaList
          active={activeArea}
          onSelect={setActiveArea}
          uploads={uploads}
        />

        {/* Submit for approval */}
        <button
          className='w-full h-11 rounded-lg bg-black text-white disabled:opacity-60'
          disabled={!design || busy}
          onClick={async () => {
            if (!design) return
            const res = await fetch(`/api/designs/${design.id}/submit`, {
              method: 'POST',
            })
            const data = await res.json()
            if (!res.ok) {
              alert(data?.error || 'Submit failed')
              return
            }
            setDesign(data.design)
            alert('Submitted for approval!')
          }}
        >
          {busy
            ? 'Submitting…'
            : design?.status === 'submitted'
            ? 'Submitted'
            : 'Submit for approval'}
        </button>
      </aside>
    </div>
  )
}
