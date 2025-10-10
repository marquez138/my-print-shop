'use client'

import { useState, FormEvent } from 'react'
import { useRouter } from 'next/navigation'

export default function DesignActions({ designId }: { designId: string }) {
  const router = useRouter()
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState('')
  const [reason, setReason] = useState('')

  async function postJSON(url: string, body?: any) {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: body ? JSON.stringify(body) : undefined,
    })
    if (!res.ok) throw new Error(await res.text())
    return res.json()
  }

  return (
    <div className='mt-4 grid grid-cols-1 gap-3'>
      <button
        disabled={busy}
        onClick={async () => {
          try {
            setBusy(true)
            await postJSON(`/api/admin/designs/${designId}/approve`)
            router.refresh()
          } catch (e) {
            console.error(e)
            alert('Approve failed')
          } finally {
            setBusy(false)
          }
        }}
        className='h-10 rounded-md bg-emerald-600 text-white hover:opacity-90 disabled:opacity-60'
      >
        {busy ? 'Working…' : 'Approve'}
      </button>

      <form
        onSubmit={async (e: FormEvent) => {
          e.preventDefault()
          try {
            setBusy(true)
            await postJSON(`/api/admin/designs/${designId}/request-changes`, {
              message: msg,
            })
            setMsg('')
            router.refresh()
          } catch (e) {
            console.error(e)
            alert('Request changes failed')
          } finally {
            setBusy(false)
          }
        }}
        className='space-y-2'
      >
        <textarea
          value={msg}
          onChange={(e) => setMsg(e.target.value)}
          placeholder='Describe requested changes…'
          className='w-full rounded-md border p-2 text-sm'
          rows={3}
        />
        <button
          className='h-10 w-full rounded-md border hover:bg-gray-50 disabled:opacity-60'
          disabled={busy || !msg.trim()}
        >
          Request changes
        </button>
      </form>

      <form
        onSubmit={async (e: FormEvent) => {
          e.preventDefault()
          try {
            setBusy(true)
            await postJSON(`/api/admin/designs/${designId}/reject`, {
              reason,
            })
            setReason('')
            router.refresh()
          } catch (e) {
            console.error(e)
            alert('Reject failed')
          } finally {
            setBusy(false)
          }
        }}
        className='space-y-2'
      >
        <textarea
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder='Reason for rejection…'
          className='w-full rounded-md border p-2 text-sm'
          rows={2}
        />
        <button
          className='h-10 w-full rounded-md border border-rose-300 text-rose-700 hover:bg-rose-50 disabled:opacity-60'
          disabled={busy || !reason.trim()}
        >
          Reject
        </button>
      </form>
    </div>
  )
}
