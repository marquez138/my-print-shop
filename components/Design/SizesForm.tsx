// components/Design/SizesForm.tsx
'use client'

import { useEffect, useMemo, useState } from 'react'

type Row = { size: string; qty: number; unitPrice: number; surcharge: number }

export default function SizesForm({
  sizes,
  basePriceCents,
  initial,
  onChange,
  className = '',
}: {
  sizes: string[]
  basePriceCents: number
  initial?: Row[]
  onChange?: (q: Record<string, number>) => void
  className?: string
}) {
  // internal table state
  const [rows, setRows] = useState<Row[]>(
    sizes.map((s) => {
      const found = initial?.find((r) => r.size === s)
      return {
        size: s,
        qty: found?.qty ?? 0,
        unitPrice: found?.unitPrice ?? basePriceCents,
        surcharge: found?.surcharge ?? 0,
      }
    })
  )

  // bubble up a simple { size: qty } map whenever rows change
  useEffect(() => {
    if (!onChange) return
    const map: Record<string, number> = {}
    for (const r of rows) map[r.size] = r.qty || 0
    onChange(map)
  }, [rows, onChange])

  const totalQty = useMemo(
    () =>
      rows.reduce((sum, r) => sum + (Number.isFinite(r.qty) ? r.qty : 0), 0),
    [rows]
  )
  const estSubtotal = useMemo(
    () => rows.reduce((sum, r) => sum + r.qty * r.unitPrice, 0),
    [rows]
  )

  return (
    <div className={className}>
      <h3 className='font-semibold'>Quantities</h3>
      <div className='mt-3 rounded-xl border'>
        <div className='grid grid-cols-4 gap-3 p-3 text-xs text-gray-500'>
          <div>Size</div>
          <div className='text-right'>Unit</div>
          <div className='text-right'>Qty</div>
          <div className='text-right'>Line</div>
        </div>
        <div className='divide-y'>
          {rows.map((r, idx) => {
            const line = r.qty * r.unitPrice
            return (
              <div
                key={r.size}
                className='grid grid-cols-4 gap-3 p-3 items-center'
              >
                <div className='font-medium'>{r.size}</div>
                <div className='text-right tabular-nums'>
                  ${(r.unitPrice / 100).toFixed(2)}
                </div>
                <div className='text-right'>
                  <input
                    type='number'
                    min={0}
                    step={1}
                    value={Number.isFinite(r.qty) ? r.qty : 0}
                    onChange={(e) => {
                      const v = Math.max(
                        0,
                        Math.floor(Number(e.target.value || 0))
                      )
                      setRows((prev) => {
                        const copy = [...prev]
                        copy[idx] = { ...copy[idx], qty: v }
                        return copy
                      })
                    }}
                    className='h-9 w-20 rounded border px-2 text-right'
                  />
                </div>
                <div className='text-right tabular-nums'>
                  ${(line / 100).toFixed(2)}
                </div>
              </div>
            )
          })}
        </div>

        <div className='flex items-center justify-between p-3 text-sm'>
          <div className='text-gray-600'>
            Total qty: <span className='font-medium'>{totalQty}</span>
          </div>
          <div className='text-gray-900'>
            Subtotal:&nbsp;
            <span className='font-semibold'>
              ${(estSubtotal / 100).toFixed(2)}
            </span>
          </div>
        </div>
      </div>

      {/* No Save button here — parent will handle PUT + Checkout */}
    </div>
  )
}
