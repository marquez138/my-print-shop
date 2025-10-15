'use client'

import { useMemo, useState } from 'react'

type LineItem = {
  size: string
  qty: number
  unitPrice: number
  surcharge: number
}

type Props = {
  designId: string
  /** e.g. ["S","M","L","XL","2XL"] */
  sizes: string[]
  /** Pre-saved items from the server (optional) */
  initial?: LineItem[]
  /** Base tee price (cents) used for display math only */
  basePriceCents: number
  /** Called after successful save */
  onSaved?: (items: LineItem[]) => void
  /** Disable editing (e.g. when design not approved) */
  disabled?: boolean
}

const usd = (c: number) => `$${(c / 100).toFixed(2)}`

export default function SizesForm({
  designId,
  sizes,
  initial = [],
  basePriceCents,
  onSaved,
  disabled = false,
}: Props) {
  const [busy, setBusy] = useState(false)

  // Build a map for quick editing
  const [items, setItems] = useState<Record<string, LineItem>>(() => {
    const map: Record<string, LineItem> = {}
    for (const s of sizes) {
      const found = initial.find((i) => i.size === s)
      map[s] = {
        size: s,
        qty: found?.qty ?? 0,
        unitPrice: found?.unitPrice ?? basePriceCents,
        surcharge: found?.surcharge ?? 0,
      }
    }
    return map
  })

  const rows = useMemo(() => sizes.map((s) => items[s]), [sizes, items])

  const totals = useMemo(() => {
    const units = rows.reduce((acc, r) => acc + (r?.qty ?? 0), 0)
    const merchandise = rows.reduce(
      (acc, r) => acc + r.qty * (r.unitPrice + r.surcharge),
      0
    )
    return { units, merchandise }
  }, [rows])

  function updateQty(size: string, next: number) {
    setItems((prev) => ({
      ...prev,
      [size]: { ...prev[size], qty: Math.max(0, Math.min(9999, next)) },
    }))
  }

  async function save() {
    try {
      setBusy(true)
      const payload = {
        items: rows
          .filter((r) => r.qty > 0)
          .map((r) => ({
            size: r.size,
            qty: r.qty,
            unitPrice: r.unitPrice,
            surcharge: r.surcharge,
            variantSku: '', // optional: fill if you map size->sku later
          })),
      }
      const res = await fetch(`/api/designs/${designId}/quantities`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      if (!res.ok) throw new Error(await res.text())
      const data = await res.json()
      // reflect server truth
      if (Array.isArray(data.items)) {
        const map: Record<string, LineItem> = { ...items }
        for (const s of sizes) {
          const found = data.items.find((i: any) => i.size === s)
          if (found) {
            map[s] = {
              size: found.size,
              qty: found.qty,
              unitPrice: found.unitPrice,
              surcharge: found.surcharge ?? 0,
            }
          } else {
            map[s] = { ...map[s], qty: 0 }
          }
        }
        setItems(map)
        onSaved?.(Object.values(map))
      }
      alert('Quantities saved')
    } catch (e) {
      console.error(e)
      alert('Failed to save quantities')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className='rounded-2xl border p-4'>
      <h3 className='text-base font-semibold'>Quantities by size</h3>
      <p className='mt-1 text-sm text-gray-600'>
        Set how many you want for each size. Pricing shown includes per-size
        surcharge (if any).
      </p>

      <div className='mt-4 overflow-x-auto'>
        <table className='w-full text-sm'>
          <thead className='text-left text-gray-500'>
            <tr className='border-b'>
              <th className='py-2 pr-3'>Size</th>
              <th className='py-2 pr-3'>Qty</th>
              <th className='py-2 pr-3'>Unit</th>
              <th className='py-2 pr-3'>Surcharge</th>
              <th className='py-2 pr-3 text-right'>Line Total</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.size} className='border-b last:border-0'>
                <td className='py-2 pr-3 font-medium'>{r.size}</td>
                <td className='py-2 pr-3'>
                  <div className='inline-flex items-center gap-1'>
                    <button
                      type='button'
                      disabled={disabled || busy}
                      onClick={() => updateQty(r.size, (r.qty ?? 0) - 1)}
                      className='h-8 w-8 rounded border'
                    >
                      −
                    </button>
                    <input
                      type='number'
                      min={0}
                      max={9999}
                      inputMode='numeric'
                      value={r.qty ?? 0}
                      onChange={(e) =>
                        updateQty(
                          r.size,
                          Number.parseInt(e.target.value || '0', 10)
                        )
                      }
                      disabled={disabled || busy}
                      className='h-8 w-20 rounded border px-2'
                    />
                    <button
                      type='button'
                      disabled={disabled || busy}
                      onClick={() => updateQty(r.size, (r.qty ?? 0) + 1)}
                      className='h-8 w-8 rounded border'
                    >
                      +
                    </button>
                  </div>
                </td>
                <td className='py-2 pr-3'>{usd(r.unitPrice)}</td>
                <td className='py-2 pr-3'>
                  {r.surcharge ? usd(r.surcharge) : '—'}
                </td>
                <td className='py-2 pl-3 text-right'>
                  {usd((r.qty ?? 0) * (r.unitPrice + r.surcharge))}
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className='border-t font-medium'>
              <td className='py-2 pr-3'>Totals</td>
              <td className='py-2 pr-3'>{totals.units}</td>
              <td className='py-2 pr-3' />
              <td className='py-2 pr-3' />
              <td className='py-2 pl-3 text-right'>
                {usd(totals.merchandise)}
              </td>
            </tr>
          </tfoot>
        </table>
      </div>

      <div className='mt-4 flex items-center gap-3'>
        <button
          type='button'
          onClick={save}
          disabled={disabled || busy}
          className='h-10 rounded-lg bg-black px-4 text-white disabled:opacity-60'
        >
          {busy ? 'Saving…' : 'Save quantities'}
        </button>
        {disabled && (
          <span className='text-xs text-gray-500'>
            Quantities are editable after your design is approved.
          </span>
        )}
      </div>
    </div>
  )
}
