'use client'

import { use, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { PRINT_AREAS, type PrintArea } from '@/config/print-areas'
import { resolveHex } from '@/config/colors'
import DesignCanvas from '@/components/Design/DesignCanvas'
import PrintAreaList from '@/components/Design/PrintAreaList'
import PriceSummary from '@/components/Design/PriceSummary'
import UploadButton from '@/components/Design/UploadButton'
import DesignStatusBanner from '@/components/Design/DesignStatusBanner'
import CommentsList from '@/components/Design/CommentsList'
import { useToast } from '@/components/common/Toast'
import SizesForm from '@/components/Design/SizesForm'

type ServerDesign = {
  id: string
  pricingBase: number
  pricingFees: number
  pricingTotal: number
  status: string
  color?: string | null
  placements?: { areaId: string; url: string }[]
  comments?: {
    id: string
    author: string
    body: string
    createdAt: string
  }[]
  lineItems?: {
    size: string
    qty: number
    unitPrice: number
    surcharge: number
  }[]
}

export default function DesignPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>
  searchParams: Promise<{ base?: string; designId?: string; color?: string }>
}) {
  const router = useRouter()
  const { slug } = use(params)
  const q = use(searchParams)

  const designId = q?.designId
  const basePrice = Number.isFinite(Number(q?.base)) ? Number(q!.base) : 2500

  const selectedColorId = (q?.color ?? 'white').toLowerCase()
  const garmentHex = resolveHex(selectedColorId, '#ffffff')

  const [activeArea, setActiveArea] = useState<PrintArea>(PRINT_AREAS[0])
  const [uploads, setUploads] = useState<Record<string, string>>({})
  const [design, setDesign] = useState<ServerDesign | null>(null)
  const [busy, setBusy] = useState(false)
  const { toast, Toast } = useToast()

  // Controlled quantities (used only if approved, but harmless to keep)
  const [quantities, setQuantities] = useState<Record<string, number>>({})

  const canEdit =
    design?.status === 'draft' || design?.status === 'changes_requested'

  useEffect(() => {
    let mounted = true
    ;(async () => {
      try {
        setBusy(true)

        if (!designId) {
          router.replace(`/products/${slug}`)
          return
        }

        const res = await fetch(`/api/designs/${designId}`, {
          cache: 'no-store',
        })
        if (!res.ok) throw new Error(await res.text())
        const data = await res.json()
        const d: ServerDesign = data.design

        // 🚦 GUARD: if the design is NOT editable, bounce to dashboard detail
        // Editable = draft | changes_requested. Anything else redirects.
        if (d && !['draft', 'changes_requested'].includes(d.status)) {
          router.replace(`/dashboard/designs/${d.id}`)
          return
        }

        if (mounted) {
          setDesign(d)

          const existingUploads: Record<string, string> = {}
          d.placements?.forEach((p: any) => {
            existingUploads[p.areaId] = p.url
          })
          setUploads(existingUploads)

          const seed: Record<string, number> = {}
          d.lineItems?.forEach((li: any) => {
            seed[li.size] = li.qty
          })
          setQuantities(seed)
        }
      } catch (err) {
        console.error('Failed to load design by id:', err)
        router.replace(`/products/${slug}`)
      } finally {
        setBusy(false)
      }
    })()
    return () => {
      mounted = false
    }
  }, [designId, slug, router])

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
      const side = activeArea.side

      // One-per-side optimistic update
      setUploads((u) => {
        const next = { ...u }
        for (const area of PRINT_AREAS) {
          if (area.side === side) delete next[area.id]
        }
        next[activeArea.id] = r.secure_url
        return next
      })

      const res = await fetch(`/api/designs/${design.id}/placements`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          side,
          areaId: activeArea.id,
          assetId: r.public_id,
          url: r.secure_url,
          widthPx: r.width,
          heightPx: r.height,
        }),
      })
      if (!res.ok) throw new Error(await res.text())
      const data = await res.json()

      // Rebuild from server
      const serverUploads: Record<string, string> = {}
      for (const p of data.design.placements ?? []) {
        if (p.url && p.areaId) serverUploads[p.areaId] = p.url
      }
      setUploads(serverUploads)
      setDesign(data.design)
      toast('Artwork saved')
    } catch (err) {
      console.error(err)
      alert('Failed to save placement.')
    } finally {
      setBusy(false)
    }
  }

  function clearActive() {
    setUploads((u) => {
      const next = { ...u }
      delete next[activeArea.id]
      return next
    })
  }

  async function handleProceedToCheckout() {
    if (!design) return
    try {
      setBusy(true)
      const putRes = await fetch(`/api/designs/${design.id}/quantities`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ quantities }),
      })
      const putData = await putRes.json()
      if (!putRes.ok) {
        alert(putData?.error || 'Failed to save quantities.')
        return
      }

      const coRes = await fetch(`/api/checkout/design/${design.id}`, {
        method: 'POST',
      })
      const coData = await coRes.json()
      if (!coRes.ok) {
        alert(coData?.error || 'Unable to start checkout.')
        return
      }
      if (coData?.url) window.location.href = coData.url
      else router.push('/checkout/success')
    } catch (e) {
      console.error(e)
      alert('Checkout failed.')
    } finally {
      setBusy(false)
    }
  }

  const hasArt = !!uploads[activeArea.id]
  const canShowSubmit =
    !!design &&
    hasArt &&
    (design.status === 'draft' ||
      design.status === 'changes_requested' ||
      design.status === 'submitted')

  const effectiveBase = design?.pricingBase ?? basePrice
  const serverFees = design?.pricingFees ?? 0
  const serverTotal = design?.pricingTotal ?? effectiveBase

  return (
    <div className='grid grid-cols-1 lg:grid-cols-12 gap-8'>
      {/* Left panel */}
      <aside className='lg:col-span-2'>
        <PrintAreaList
          active={activeArea}
          onSelect={setActiveArea}
          uploads={uploads}
        />
      </aside>

      {/* Center canvas with garment color */}
      <section className='lg:col-span-7'>
        <DesignCanvas
          area={activeArea}
          artUrl={uploads[activeArea.id]}
          baseColorHex={garmentHex}
        />
        <div className='mt-3 text-sm text-gray-600'>
          Showing side:{' '}
          <span className='font-medium capitalize'>{activeArea.side}</span>
          <span className='ml-3 inline-flex items-center gap-2'>
            <span
              className='inline-block h-3 w-3 rounded-full border'
              style={{ backgroundColor: garmentHex }}
            />
            <span className='capitalize'>{selectedColorId}</span>
          </span>
        </div>
      </section>

      {/* Right column */}
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

        {/* Submit / Resubmit — only when ACTIVE area has art */}
        {canShowSubmit && (
          <button
            className='mt-4 w-full h-11 rounded-lg bg-black text-white disabled:opacity-60'
            disabled={busy || design?.status === 'submitted'}
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
                router.push('/dashboard/designs?submitted=1')
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
              : design?.status === 'changes_requested'
              ? 'Resubmit for review'
              : 'Submit for approval'}
          </button>
        )}

        {/* Quantities + Proceed (approved only) */}
        {design?.status === 'approved' && (
          <div className='mt-6 space-y-3'>
            <SizesForm
              sizes={['S', 'M', 'L', 'XL', '2XL']}
              basePriceCents={design.pricingBase}
              initial={
                design.lineItems?.map((li) => ({
                  size: li.size,
                  qty: li.qty,
                  unitPrice: li.unitPrice,
                  surcharge: li.surcharge ?? 0,
                })) ?? []
              }
              onChange={(map) => setQuantities(map)}
            />

            <button
              type='button'
              onClick={handleProceedToCheckout}
              disabled={busy}
              className='w-full h-11 rounded-lg bg-emerald-600 text-white disabled:opacity-60'
            >
              {busy ? 'Processing…' : 'Proceed to checkout'}
            </button>
          </div>
        )}
      </aside>

      {Toast}
    </div>
  )
}
