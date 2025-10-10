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
    try {
      setBusy(true)
      // --- Direct unsigned upload to Cloudinary (no widget) ---
      const form = new FormData()
      form.append('file', file)
      form.append(
        'upload_preset',
        process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET!
      )
      // optional: form.append('folder', 'my-print-shop/user_uploads')

      const cloud = process.env.CLOUDINARY_CLOUD_NAME!
      const res = await fetch(
        `https://api.cloudinary.com/v1_1/${cloud}/image/upload`,
        {
          method: 'POST',
          body: form,
        }
      )
      if (!res.ok) throw new Error(await res.text())
      const info = await res.json()
      await onUploaded({
        secure_url: info.secure_url,
        public_id: info.public_id,
        width: info.width,
        height: info.height,
      })
    } finally {
      setBusy(false)
      e.target.value = '' // reset
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
