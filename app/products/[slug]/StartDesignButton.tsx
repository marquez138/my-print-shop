// app/products/[slug]/StartDesignButton.tsx
'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { SignedIn, SignedOut, SignInButton, useAuth } from '@clerk/nextjs'

export default function StartDesignButton({
  slug,
  basePrice,
  color, // optional (e.g., "black")
  className = '',
}: {
  slug: string
  basePrice: number // cents
  color?: string
  className?: string
}) {
  const router = useRouter()
  const { isSignedIn } = useAuth()
  const [busy, setBusy] = useState(false)
  const FLAG_KEY = `startDesign:${slug}`

  const createDraft = useCallback(async () => {
    try {
      setBusy(true)
      const variantSku = color ? `${slug}-${color}` : `${slug}-default`

      const res = await fetch('/api/designs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productId: slug,
          variantSku,
          color, // optional: if your Design model includes it
          basePrice,
        }),
      })
      if (!res.ok) throw new Error(await res.text())
      const data = await res.json()
      const designId: string | undefined = data?.design?.id
      if (!designId) throw new Error('Missing designId in response')

      const qs = new URLSearchParams()
      qs.set('base', String(basePrice))
      if (color) qs.set('color', color)
      qs.set('designId', designId)

      router.push(`/design/${slug}?${qs.toString()}`)
    } catch (e) {
      console.error(e)
      alert('Unable to start a design right now.')
    } finally {
      setBusy(false)
      try {
        localStorage.removeItem(FLAG_KEY)
      } catch {}
    }
  }, [slug, basePrice, color, router])

  // If the user clicked while signed out, we flag it & auto-continue after sign-in.
  useEffect(() => {
    if (!isSignedIn) return
    try {
      const pending = localStorage.getItem(FLAG_KEY)
      if (pending === '1') createDraft()
    } catch {}
  }, [isSignedIn, createDraft])

  return (
    <>
      <SignedIn>
        <button
          type='button'
          onClick={createDraft}
          disabled={busy}
          className={`h-11 rounded-lg bg-black text-white px-5 disabled:opacity-60 ${className}`}
        >
          {busy ? 'Starting…' : 'Start design'}
        </button>
      </SignedIn>

      <SignedOut>
        <SignInButton mode='modal' fallbackRedirectUrl='/post-sign-in'>
          <button
            type='button'
            onClick={() => {
              try {
                localStorage.setItem(FLAG_KEY, '1')
              } catch {}
            }}
            disabled={busy}
            className={`h-11 rounded-lg bg-black text-white px-5 disabled:opacity-60 ${className}`}
          >
            {busy ? 'Starting…' : 'Start design'}
          </button>
        </SignInButton>
      </SignedOut>
    </>
  )
}
