'use client'
import { useState, useEffect } from 'react'

export function useToast() {
  const [msg, setMsg] = useState<string | null>(null)
  useEffect(() => {
    if (!msg) return
    const t = setTimeout(() => setMsg(null), 3000)
    return () => clearTimeout(t)
  }, [msg])
  const Toast = msg ? (
    <div className='fixed bottom-4 left-1/2 -translate-x-1/2 rounded-md bg-black text-white px-3 py-2 text-sm shadow-lg'>
      {msg}
    </div>
  ) : null
  return { toast: setMsg, Toast }
}
