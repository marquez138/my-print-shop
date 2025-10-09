'use client'

import { useState, useRef } from 'react'

type Props = {
  onUploaded: (result: {
    secure_url: string
    public_id: string
    width: number
    height: number
  }) => void
  accept?: string
  label?: string
}

export default function UploadButton({
  onUploaded,
  accept = 'image/*',
  label = 'Upload Artwork',
}: Props) {
  const [busy, setBusy] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  async function handlePick() {
    inputRef.current?.click()
  }

  async function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    try {
      setBusy(true)

      // 1) get signed params from our API
      const sigRes = await fetch('/api/uploads/sign', {
        method: 'POST',
        body: JSON.stringify({}),
      })
      const sig = await sigRes.json()

      const endpoint = `https://api.cloudinary.com/v1_1/${sig.cloudName}/auto/upload`
      const fd = new FormData()
      fd.append('file', file)
      fd.append('api_key', sig.apiKey)
      fd.append('timestamp', String(sig.timestamp))
      fd.append('signature', sig.signature)
      fd.append('folder', sig.folder)

      // 2) direct upload to Cloudinary
      const upRes = await fetch(endpoint, { method: 'POST', body: fd })
      const data = await upRes.json()

      if (!upRes.ok) throw new Error(data?.error?.message || 'Upload failed')

      onUploaded({
        secure_url: data.secure_url,
        public_id: data.public_id,
        width: data.width,
        height: data.height,
      })
    } catch (err) {
      console.error(err)
      alert('Upload failed. Please try a different image.')
    } finally {
      setBusy(false)
      // reset input so same file can be re-chosen later
      if (inputRef.current) inputRef.current.value = ''
    }
  }

  return (
    <>
      <input
        ref={inputRef}
        type='file'
        accept={accept}
        className='hidden'
        onChange={handleChange}
      />
      <button
        type='button'
        onClick={handlePick}
        disabled={busy}
        className='w-full h-11 rounded-lg bg-black text-white disabled:opacity-60'
      >
        {busy ? 'Uploading…' : label}
      </button>
    </>
  )
}
