'use client'

import { useState, FormEvent } from 'react'
import { useRouter } from 'next/navigation'

type Comment = { id: string; author: string; body: string; createdAt: string }

export default function CommentsPanel({
  designId,
  initial,
}: {
  designId: string
  initial: Comment[]
}) {
  const router = useRouter()
  const [items, setItems] = useState<Comment[]>(initial)
  const [body, setBody] = useState('')
  const [busy, setBusy] = useState(false)

  async function submit(e: FormEvent) {
    e.preventDefault()
    if (!body.trim()) return
    try {
      setBusy(true)
      const res = await fetch(`/api/admin/designs/${designId}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ body }),
      })
      if (!res.ok) throw new Error(await res.text())
      const data = await res.json()
      setItems((prev) => [...prev, data.comment])
      setBody('')
      router.refresh()
    } catch (e) {
      console.error(e)
      alert('Failed to add comment')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className='rounded-2xl border p-4'>
      <h3 className='text-base font-semibold'>Comments</h3>

      <div className='mt-3 space-y-3'>
        {items.length === 0 ? (
          <div className='text-sm text-gray-500'>No comments yet.</div>
        ) : (
          items.map((c) => (
            <div key={c.id} className='rounded-md border p-2 text-sm'>
              <div className='flex items-center justify-between'>
                <span className='font-medium capitalize'>{c.author}</span>
                <span className='text-xs text-gray-500'>
                  {new Date(c.createdAt).toLocaleString()}
                </span>
              </div>
              <div className='mt-1 text-gray-800 whitespace-pre-wrap'>
                {c.body}
              </div>
            </div>
          ))
        )}
      </div>

      <form onSubmit={submit} className='mt-4 space-y-2'>
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder='Add an internal note to the customer thread…'
          className='w-full rounded-md border p-2 text-sm'
          rows={3}
        />
        <button
          disabled={busy || !body.trim()}
          className='h-10 w-full rounded-md bg-black text-white disabled:opacity-60'
        >
          {busy ? 'Posting…' : 'Add comment'}
        </button>
      </form>
    </div>
  )
}
