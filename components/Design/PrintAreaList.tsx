// components/Design/PrintAreaList.tsx
import { PRINT_AREAS, type PrintArea } from '@/config/print-areas'

function selectedAreaIdBySide(
  uploads: Record<string, string>,
  side: PrintArea['side']
) {
  const entry = Object.keys(uploads).find((id) => {
    const a = PRINT_AREAS.find((x) => x.id === id)!
    return a.side === side
  })
  return entry // could be undefined
}

export default function PrintAreaList({
  active,
  onSelect,
  uploads,
}: {
  active: PrintArea
  onSelect: (a: PrintArea) => void
  uploads: Record<string, string>
}) {
  return (
    <div className='space-y-3'>
      <h3 className='text-lg font-semibold'>Select Print Area</h3>

      {(['front', 'back', 'sleeve'] as const).map((side) => {
        const chosenForSide = selectedAreaIdBySide(uploads, side)
        return (
          <div key={side} className='mt-4'>
            <div className='text-xs uppercase tracking-wide text-gray-500 mb-2'>
              {side}
            </div>
            <div className='space-y-2'>
              {PRINT_AREAS.filter((a) => a.side === side).map((area) => {
                const isActiveRow = area.id === active.id
                const isSelectedForSide = chosenForSide === area.id
                return (
                  <button
                    key={area.id}
                    onClick={() => onSelect(area)}
                    className={`w-full flex items-center justify-between rounded-lg border px-3 py-2 text-left ${
                      isActiveRow
                        ? 'border-black bg-gray-100'
                        : 'border-gray-200'
                    }`}
                  >
                    <span>{area.label}</span>
                    <span
                      className={`text-xs ${
                        isSelectedForSide ? 'text-green-600' : 'text-gray-400'
                      }`}
                    >
                      {isSelectedForSide ? 'Selected' : 'Empty'}
                    </span>
                  </button>
                )
              })}
            </div>
          </div>
        )
      })}
    </div>
  )
}
