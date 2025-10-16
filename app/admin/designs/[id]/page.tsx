'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import DesignCanvas from '@/components/Design/DesignCanvas'
import DesignStatusBanner from '@/components/Design/DesignStatusBanner'
import CommentsList from '@/components/Design/CommentsList'
import { useToast } from '@/components/common/Toast'

type AdminDesign = {
  id: string
  status: string
  pricingBase: number
  pricingFees: number
  pricingTotal: number
  color?: string
  placements: { areaId: string; url: string }[]
  comments: { id: string; author: string; body: string; createdAt: string }[]
}

export default function AdminDesignReview({
  params,
}: {
  params: { id: string }
}) {
  const { id } = params

  const router = useRouter()
  const { toast, Toast } = useToast()

  const [design, setDesign] = useState<AdminDesign | null>(null)
  const [busy, setBusy] = useState(false)
  const [rejectMessage, setRejectMessage] = useState('')
  const [showRejectBox, setShowRejectBox] = useState(false)

  // fetch design on mount
  useEffect(() => {
    ;(async () => {
      try {
        const res = await fetch(`/api/admin/designs?id=${id}`)
        if (!res.ok) throw new Error(await res.text())
        const data = await res.json()
        setDesign(data.designs?.[0] ?? null)
      } catch (err) {
        console.error(err)
        alert('Failed to load design.')
        router.push('/admin/designs')
      }
    })()
  }, [id, router])

  async function handleApprove() {
    if (!design) return
    setBusy(true)
    try {
      const res = await fetch(`/api/admin/designs/${design.id}/approve`, {
        method: 'POST',
      })
      const data = await res.json()
      if (!res.ok) {
        alert(data?.error || 'Approve failed.')
        return
      }
      setDesign(data.design)
      toast('Design approved')
    } catch (e) {
      console.error(e)
      alert('Approve failed.')
    } finally {
      setBusy(false)
    }
  }

  async function handleReject() {
    if (!design) return
    if (!rejectMessage.trim()) {
      alert('Please include a rejection note.')
      return
    }
    setBusy(true)
    try {
      const res = await fetch(`/api/admin/designs/${design.id}/reject`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: rejectMessage }),
      })
      const data = await res.json()
      if (!res.ok) {
        alert(data?.error || 'Reject failed.')
        return
      }
      setDesign(data.design)
      setShowRejectBox(false)
      setRejectMessage('')
      toast('Design rejected')
    } catch (e) {
      console.error(e)
      alert('Reject failed.')
    } finally {
      setBusy(false)
    }
  }

  if (!design)
    return <div className='p-10 text-gray-500 text-center'>Loading design…</div>

  const isFinal = design.status === 'approved' || design.status === 'rejected'

  return (
    <div className='grid grid-cols-1 lg:grid-cols-12 gap-8 p-6'>
      <aside className='lg:col-span-3 space-y-6'>
        <DesignStatusBanner status={design.status} />
        <div className='text-sm text-gray-600'>
          <p>ID: {design.id}</p>
          <p>Status: {design.status}</p>
          <p>Base: ${(design.pricingBase / 100).toFixed(2)}</p>
          <p>Total: ${(design.pricingTotal / 100).toFixed(2)}</p>
        </div>

        {!isFinal && (
          <div className='space-y-3'>
            <button
              onClick={handleApprove}
              disabled={busy}
              className='w-full h-11 rounded-lg bg-emerald-600 text-white disabled:opacity-60'
            >
              {busy ? 'Approving…' : 'Approve Design'}
            </button>

            {!showRejectBox ? (
              <button
                onClick={() => setShowRejectBox(true)}
                disabled={busy}
                className='w-full h-11 rounded-lg border border-red-500 text-red-600 disabled:opacity-60'
              >
                Reject Design
              </button>
            ) : (
              <div className='space-y-2'>
                <textarea
                  value={rejectMessage}
                  onChange={(e) => setRejectMessage(e.target.value)}
                  placeholder='Explain why this design was rejected…'
                  className='w-full border rounded-lg p-2 text-sm'
                  rows={3}
                />
                <div className='flex gap-2'>
                  <button
                    onClick={handleReject}
                    disabled={busy}
                    className='flex-1 h-10 rounded-lg bg-red-600 text-white disabled:opacity-60'
                  >
                    {busy ? 'Rejecting…' : 'Confirm Reject'}
                  </button>
                  <button
                    onClick={() => setShowRejectBox(false)}
                    className='flex-1 h-10 rounded-lg border text-gray-700'
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </aside>

      {/* Center preview */}
      <section className='lg:col-span-6'>
        {design.placements?.length ? (
          <DesignCanvas
            area={{ id: 'snapshot', label: 'Submitted', side: 'front' }}
            artUrl={design.placements[0].url}
            baseColorHex={design.color ?? '#ffffff'}
          />
        ) : (
          <div className='border rounded-lg h-96 flex items-center justify-center text-gray-500'>
            No artwork submitted.
          </div>
        )}
      </section>

      {/* Comments */}
      <aside className='lg:col-span-3'>
        {design.comments?.length > 0 && (
          <>
            <h3 className='font-semibold mb-2'>Comments</h3>
            <CommentsList
              comments={design.comments.map((c) => ({
                ...c,
                createdAt: c.createdAt.toString(),
              }))}
            />
          </>
        )}
      </aside>

      {Toast}
    </div>
  )
}
