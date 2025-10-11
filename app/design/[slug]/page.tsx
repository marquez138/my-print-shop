'use client'

import { use, useEffect, useMemo, useState } from 'react'
import { PRINT_AREAS, type PrintArea } from '@/config/print-areas'
import DesignCanvas from '@/components/Design/DesignCanvas'
import PrintAreaList from '@/components/Design/PrintAreaList'
import PriceSummary from '@/components/Design/PriceSummary'
import UploadButton from '@/components/Design/UploadButton'
import DesignStatusBanner from '@/components/Design/DesignStatusBanner'
import CommentsList from '@/components/Design/CommentsList'
import { useToast } from '@/components/common/Toast'

type ServerDesign = {
  id: string
  pricingBase: number
  pricingFees: number
  pricingTotal: number
  status: string
  placements?: { areaId: string; url: string }[]
  comments?: {
    id: string
    author: string
    body: string
    createdAt: string
  }[]
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
  const canEdit =
    design?.status === 'draft' || design?.status === 'changes_requested'
  const [busy, setBusy] = useState(false)
  const { toast, Toast } = useToast()

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
  // app/design/[slug]/page.tsx — replace your current handleUploaded with this one
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

      // 1) Optimistic UI: purge any other upload on the SAME SIDE,
      //    then set the new one for the active area.
      const side = activeArea.side
      setUploads((u) => {
        const next = { ...u }
        // remove any existing upload from the same side
        for (const area of PRINT_AREAS) {
          if (area.side === side) delete next[area.id]
        }
        // set the new upload for the active area
        next[activeArea.id] = r.secure_url
        return next
      })

      // 2) Persist on server — this REPLACES the placement for this side (upsert)
      const res = await fetch(`/api/designs/${design.id}/placements`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          side, // ✅ crucial for composite key (designId, side)
          areaId: activeArea.id,
          assetId: r.public_id,
          url: r.secure_url,
          widthPx: r.width,
          heightPx: r.height,
        }),
      })
      if (!res.ok) throw new Error(await res.text())
      const data = await res.json()

      // 3) Authoritative re-sync: rebuild uploads map from server placements
      const serverUploads: Record<string, string> = {}
      for (const p of data.design.placements ?? []) {
        if (p.url && p.areaId) serverUploads[p.areaId] = p.url
      }
      setUploads(serverUploads)
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

  const areaById = useMemo(() => {
    const m = new Map<string, PrintArea>()
    for (const a of PRINT_AREAS) m.set(a.id, a)
    return m
  }, [])

  const hasArt = !!uploads[activeArea.id]
  const effectiveBase = design?.pricingBase ?? basePrice
  const serverFees = design?.pricingFees ?? 0
  const serverTotal = design?.pricingTotal ?? effectiveBase

  return (
    <div className='grid grid-cols-1 lg:grid-cols-12 gap-8'>
      {/* Left panel */}
      <aside className='lg:col-span-3 space-y-6'>
        {design && <DesignStatusBanner status={design.status} />}
        <h1 className='text-2xl font-semibold uppercase'>{slug}</h1>

        <PriceSummary basePrice={effectiveBase} uploads={uploads} />
        <div className='text-xs text-gray-500'>
          Server subtotal: ${(serverTotal / 100).toFixed(2)}
        </div>

        {hasArt ? (
          <button
            onClick={clearActive}
            disabled={busy || !canEdit}
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
            disabled={!canEdit || busy}
          />
        )}
        {!canEdit && (
          <p className='mt-2 text-xs text-gray-500'>
            Editing is disabled while your design is <b>{design?.status}</b>.
          </p>
        )}
        <p className='text-sm text-gray-600'>
          Only one design per side is allowed. Uploading to another area on the
          same side will replace it.
        </p>

        {design?.comments && design.comments.length > 0 && (
          <div className='mt-8'>
            <h3 className='font-semibold mb-2'>Admin Comments</h3>
            <CommentsList
              comments={design.comments.map((c) => ({
                ...c,
                createdAt: c.createdAt.toString(),
              }))}
            />
          </div>
        )}
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

        {/* ✅ Single submit/resubmit button */}
        <button
          className='mt-4 w-full h-11 rounded-lg bg-black text-white disabled:opacity-60'
          disabled={!design || busy || design.status === 'submitted'}
          onClick={async () => {
            if (!design) return
            setBusy(true)
            try {
              const res = await fetch(`/api/designs/${design.id}/submit`, {
                method: 'POST',
              })
              const data = await res.json()
              if (!res.ok) {
                alert(data?.error || 'Submit failed')
                return
              }
              setDesign(data.design)
              toast(
                design.status === 'changes_requested'
                  ? 'Resubmitted for review'
                  : 'Submitted for approval'
              )
            } catch (e) {
              console.error(e)
              alert('Submit failed')
            } finally {
              setBusy(false)
            }
          }}
        >
          {busy
            ? 'Submitting…'
            : design?.status === 'submitted'
            ? 'Submitted'
            : design?.status === 'changes_requested'
            ? 'Resubmit for review'
            : 'Submit for approval'}
        </button>
      </aside>

      {/* toasts */}
      {Toast}
    </div>
  )
}
