'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth, useClerk } from '@clerk/nextjs'

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
  const { redirectToSignIn } = useClerk()
  const [busy, setBusy] = useState(false)

  async function start() {
    if (busy) return
    try {
      setBusy(true)

      if (!isSignedIn) {
        // ✅ use redirectUrl (or afterSignInUrl) instead of returnBackUrl
        await redirectToSignIn({ redirectUrl: `/products/${slug}` })
        return
      }

      const res = await fetch('/api/designs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productId: slug,
          variantSku: variantSku ?? `${slug}-default`,
          basePrice,
        }),
      })

      if (res.status === 401) {
        await redirectToSignIn({ redirectUrl: `/products/${slug}` })
        return
      }

      if (!res.ok) {
        const text = await res.text()
        throw new Error(text)
      }

      const data = await res.json()
      const designId: string | undefined = data?.design?.id
      if (!designId) throw new Error('Missing designId from API')

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
