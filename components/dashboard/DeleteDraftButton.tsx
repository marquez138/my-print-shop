'use client'

import { useState, startTransition } from 'react'
import { useRouter } from 'next/navigation'

export default function DeleteDraftButton({ id }: { id: string }) {
  const router = useRouter()
  const [busy, setBusy] = useState(false)

  async function onDelete() {
    if (busy) return
    const ok = confirm('Delete this draft? This cannot be undone.')
    if (!ok) return

    try {
      setBusy(true)
      const res = await fetch(`/api/designs/${id}`, { method: 'DELETE' })
      if (!res.ok) {
        const text = await res.text()
        throw new Error(text || 'Delete failed')
      }
      // Refresh the server component list
      startTransition(() => router.refresh())
    } catch (e) {
      console.error(e)
      alert('Failed to delete draft.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <button
      type='button'
      onClick={onDelete}
      disabled={busy}
      className='inline-flex h-9 items-center rounded border px-3 text-sm text-red-600 border-red-300 hover:bg-red-50 disabled:opacity-60'
      aria-label='Delete draft'
      title='Delete draft'
    >
      {busy ? 'Deleting…' : 'Delete'}
    </button>
  )
}
