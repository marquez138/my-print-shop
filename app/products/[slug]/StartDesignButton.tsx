'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@clerk/nextjs'

export default function StartDesignButton({
  slug,
  basePrice,
  variantSku,
  className = '',
}: {
  slug: string
  basePrice: number // cents
  variantSku?: string
  className?: string
}) {
  const router = useRouter()
  const { isSignedIn } = useAuth()
  const [busy, setBusy] = useState(false)

  // Explicit Clerk sign-in path with redirect back to product page
  function goToSignIn() {
    router.push(`/sign-in?redirect_url=/products/${slug}`)
  }

  async function start() {
    if (busy) return
    try {
      setBusy(true)

      // 1) If not signed in, go to sign in FIRST — do NOT call the API yet.
      if (!isSignedIn) {
        goToSignIn()
        return
      }

      // 2) Create a brand-new draft
      const res = await fetch('/api/designs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productId: slug,
          variantSku: variantSku ?? `${slug}-default`,
          basePrice,
        }),
      })

      // 3) If session expired between click and request, send to sign in
      if (res.status === 401) {
        goToSignIn()
        return
      }

      if (!res.ok) {
        const text = await res.text()
        console.error('[POST /api/designs] failed:', text)
        throw new Error(text)
      }

      const data = await res.json()
      const designId: string | undefined = data?.design?.id
      if (!designId) throw new Error('Missing designId in API response')

      // 4) Navigate to clean design page with designId
      router.push(`/design/${slug}?designId=${designId}`)
    } catch (e) {
      console.error(e)
      alert('Unable to start a design right now.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <button
      type='button'
      onClick={start}
      disabled={busy}
      className={`h-11 rounded-lg bg-black text-white px-5 disabled:opacity-60 ${className}`}
    >
      {busy ? 'Starting…' : 'Start design'}
    </button>
  )
}
