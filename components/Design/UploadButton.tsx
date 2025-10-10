'use client'

import { useRef, useState } from 'react'

type UploadResult = {
  secure_url: string
  public_id: string
  width: number
  height: number
}

type Props = {
  label?: string
  onUploaded: (r: UploadResult) => void | Promise<void>
  disabled?: boolean
}

export default function UploadButton({
  label = 'Upload artwork',
  onUploaded,
  disabled,
}: Props) {
  const inputRef = useRef<HTMLInputElement | null>(null)
  const [busy, setBusy] = useState(false)

  async function handlePick() {
    if (disabled || busy) return
    inputRef.current?.click()
  }

  async function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    // ✅ Read public env vars at runtime (must start with NEXT_PUBLIC_)
    const cloud = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME
    const preset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET

    if (!cloud || !preset) {
      console.error('Cloudinary env vars missing', { cloud, preset })
      alert(
        'Upload not configured. Please set NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME and NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET in .env.local, then restart dev.'
      )
      // reset input so user can try again later
      e.target.value = ''
      return
    }

    try {
      setBusy(true)

      // --- Direct unsigned upload to Cloudinary (no widget) ---
      const form = new FormData()
      form.append('file', file)
      form.append('upload_preset', preset)
      // optional:
      // form.append('folder', 'my-print-shop/user_uploads')

      const res = await fetch(
        `https://api.cloudinary.com/v1_1/${cloud}/image/upload`,
        { method: 'POST', body: form }
      )

      // Cloudinary returns JSON even on error; surface a helpful message
      const info = await res.json()
      if (!res.ok) {
        console.error('Cloudinary upload failed:', info)
        const message =
          info?.error?.message ||
          `Upload failed (${res.status}) — check your unsigned preset is whitelisted.`
        throw new Error(message)
      }

      await onUploaded({
        secure_url: info.secure_url,
        public_id: info.public_id,
        width: info.width,
        height: info.height,
      })
    } catch (err: any) {
      alert(err?.message || 'Upload failed')
    } finally {
      setBusy(false)
      e.target.value = '' // reset input so subsequent selects fire onChange
    }
  }

  return (
    <>
      <input
        ref={inputRef}
        type='file'
        accept='image/*'
        className='hidden'
        onChange={handleChange}
        disabled={disabled}
      />
      <button
        type='button'
        onClick={handlePick}
        disabled={disabled || busy}
        className='w-full h-11 rounded-lg bg-black text-white disabled:opacity-60'
      >
        {busy ? 'Uploading…' : label}
      </button>
    </>
  )
}
