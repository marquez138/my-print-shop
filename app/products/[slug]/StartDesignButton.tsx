'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { SignedIn, SignedOut, SignInButton, useAuth } from '@clerk/nextjs'

/**
 * Modal sign-in flow with auto-continue:
 * - If signed out, we set a localStorage flag and open Clerk modal.
 * - After sign-in (modal closes), effect sees the flag and creates the draft.
 * - If already signed in, we create the draft immediately.
 */
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

  const FLAG_KEY = `startDesign:${slug}`

  const createDraft = useCallback(async () => {
    try {
      setBusy(true)
      const res = await fetch('/api/designs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productId: slug,
          variantSku: variantSku ?? `${slug}-default`,
          basePrice,
        }),
      })

      if (!res.ok) {
        const text = await res.text()
        console.error('[POST /api/designs] failed:', text)
        throw new Error(text)
      }

      const data = await res.json()
      const designId: string | undefined = data?.design?.id
      if (!designId) throw new Error('Missing designId in API response')

      router.push(`/design/${slug}?designId=${designId}`)
    } catch (e) {
      console.error(e)
      alert('Unable to start a design right now.')
    } finally {
      setBusy(false)
      try {
        localStorage.removeItem(FLAG_KEY)
      } catch {}
    }
  }, [slug, variantSku, basePrice, router])

  // If user just signed in via modal and we left a "pending" flag, auto-continue
  useEffect(() => {
    if (!isSignedIn) return
    try {
      const pending = localStorage.getItem(FLAG_KEY)
      if (pending === '1') {
        createDraft()
      }
    } catch {}
  }, [isSignedIn, createDraft])

  return (
    <>
      {/* Signed-in: just create the draft */}
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

      {/* Signed-out: open Clerk modal; set a flag so we auto-continue after sign-in */}
      <SignedOut>
        <SignInButton mode='modal'>
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
