'use client'

import { useState } from 'react'

type UploadResult = {
  secure_url: string
  public_id: string
  width: number
  height: number
}

type Props = {
  label?: string
  onUploaded: (r: UploadResult) => void | Promise<void>
  /** When true, the button is disabled and no upload flow starts */
  disabled?: boolean
}

/**
 * Minimal upload trigger with disabled support.
 * Replace the stubbed `startUpload()` with your Cloudinary widget or input flow.
 */
export default function UploadButton({
  label = 'Upload artwork',
  onUploaded,
  disabled = false,
}: Props) {
  const [busy, setBusy] = useState(false)

  async function startUpload() {
    // 🔒 respect disabled flag
    if (disabled || busy) return

    try {
      setBusy(true)

      // TODO: swap this stub with your Cloudinary widget callback
      // Example Cloudinary widget usage (pseudo):
      //   const result = await openCloudinaryWidget()
      //   if (result.event === 'success') onUploaded({
      //     secure_url: result.info.secure_url,
      //     public_id: result.info.public_id,
      //     width: result.info.width,
      //     height: result.info.height,
      //   })

      // --- demo stub so the component compiles even without the widget:
      // throw new Error('Hook up Cloudinary widget here')

      // If you’re using a plain <input type="file"> approach, you can instead render it below.
    } catch (e) {
      // optional: surface toasts
      console.error(e)
    } finally {
      setBusy(false)
    }
  }

  return (
    <button
      type='button'
      onClick={startUpload}
      disabled={disabled || busy}
      aria-disabled={disabled || busy}
      className='w-full h-11 rounded-lg bg-black text-white disabled:opacity-60'
    >
      {busy ? 'Uploading…' : label}
    </button>
  )
}
