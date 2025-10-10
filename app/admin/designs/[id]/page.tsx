// app/admin/designs/[id]/page.tsx
import Image from 'next/image'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { prisma } from '@/lib/db'
import { requireAdmin } from '@/lib/authz'
import { PRINT_AREAS } from '@/config/print-areas'

const USD = (c?: number | null) =>
  typeof c === 'number' ? `$${(c / 100).toFixed(2)}` : '$0.00'

type Side = 'front' | 'back' | 'sleeve'
const SIDE_ORDER: Side[] = ['front', 'back', 'sleeve']

export default async function AdminDesignDetail(props: {
  params: Promise<{ id: string }>
  searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
  // 🔒 admin gate
  await requireAdmin()

  const { id } = await props.params
  const sp = await props.searchParams
  const side = (typeof sp.side === 'string' ? sp.side : 'front') as Side

  const design = await prisma.design.findUnique({
    where: { id },
    include: {
      placements: true, // id, side, areaId, url, x,y,scale,widthPx,heightPx,dpi
      // If you linked a Customer to a Design, you could include minimal identity here too.
    },
  })
  if (!design) notFound()

  // Available sides for quick nav
  const sidesWithArt = uniqSides(design.placements.map((p) => p.side as Side))
  const currentSide = (
    SIDES_HAS(side) ? side : sidesWithArt[0] ?? 'front'
  ) as Side

  // Pick the placement for the chosen side (one-per-side enforced by schema)
  const placement =
    design.placements.find((p) => p.side === currentSide) ?? null

  // Area metadata (safe-zone) for that placement (fallback to first area of that side)
  const sideAreas = PRINT_AREAS.filter((a) => a.side === currentSide)
  const area = sideAreas.find((a) => a.id === placement?.areaId) ?? sideAreas[0]

  return (
    <main className='mx-auto max-w-6xl p-6 space-y-8'>
      {/* Title + meta */}
      <header className='flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between'>
        <div>
          <h1 className='text-xl font-semibold'>
            Design {design.id.slice(0, 8)}…
          </h1>
          <p className='text-gray-600'>
            Status:{' '}
            <span className='inline-flex items-center rounded-full border px-2 py-0.5 text-xs capitalize'>
              {design.status.toLowerCase()}
            </span>{' '}
            • Updated {new Date(design.updatedAt).toLocaleString()}
          </p>
        </div>
        <div className='text-sm text-right'>
          <div>
            Total:{' '}
            <span className='font-semibold'>{USD(design.pricingTotal)}</span>
          </div>
          <div className='text-gray-500'>
            Base {USD(design.pricingBase)} + Fees {USD(design.pricingFees)}
          </div>
        </div>
      </header>

      <div className='grid grid-cols-1 lg:grid-cols-12 gap-8'>
        {/* Left: side nav + canvas */}
        <section className='lg:col-span-8 space-y-4'>
          <SideTabs
            id={design.id}
            current={currentSide}
            available={sidesWithArt}
          />

          <div className='rounded-2xl border p-4'>
            <PreviewCanvas
              side={currentSide}
              areaLabel={area.label}
              area={area}
              artUrl={placement?.url ?? null}
              x={placement?.x ?? 0}
              y={placement?.y ?? 0}
              scale={placement?.scale ?? 1}
            />
            <div className='mt-3 text-sm text-gray-600'>
              Side:{' '}
              <span className='font-medium capitalize'>{currentSide}</span> •
              Area: <span className='font-medium'>{area.label}</span>
            </div>

            {/* Quick QC notes */}
            {placement ? (
              <ul className='mt-3 text-xs text-gray-600 space-y-1'>
                <li>
                  Asset: {placement.widthPx}×{placement.heightPx}px
                  {placement.dpi ? ` • ${placement.dpi} DPI` : ''}
                </li>
                <li>
                  Placement: x={placement.x.toFixed(2)} y=
                  {placement.y.toFixed(2)} scale={placement.scale.toFixed(2)}
                </li>
              </ul>
            ) : (
              <div className='mt-3 text-sm text-gray-500'>
                No artwork placed on this side.
              </div>
            )}
          </div>
        </section>

        {/* Right: actions + (optional) comments shell */}
        <aside className='lg:col-span-4 space-y-4'>
          <div className='rounded-2xl border p-4'>
            <h2 className='text-base font-semibold'>Actions</h2>
            <p className='mt-1 text-sm text-gray-600'>
              Approve if print-ready. Request changes if adjustments are needed.
              Reject if not printable.
            </p>

            <div className='mt-4 grid grid-cols-1 gap-2'>
              {/* Phase 3 will wire these to POST /api/admin/designs/[id]/* */}
              <form
                action={`/api/admin/designs/${design.id}/approve`}
                method='post'
              >
                <button className='w-full h-10 rounded-md bg-emerald-600 text-white hover:opacity-90'>
                  Approve
                </button>
              </form>

              <form
                action={`/api/admin/designs/${design.id}/request-changes`}
                method='post'
                className='space-y-2'
              >
                <textarea
                  name='message'
                  placeholder='Describe requested changes…'
                  className='w-full rounded-md border p-2 text-sm'
                  rows={3}
                />
                <button className='w-full h-10 rounded-md border hover:bg-gray-50'>
                  Request changes
                </button>
              </form>

              <form
                action={`/api/admin/designs/${design.id}/reject`}
                method='post'
                className='space-y-2'
              >
                <textarea
                  name='reason'
                  placeholder='Reason for rejection…'
                  className='w-full rounded-md border p-2 text-sm'
                  rows={2}
                />
                <button className='w-full h-10 rounded-md border border-rose-300 text-rose-700 hover:bg-rose-50'>
                  Reject
                </button>
              </form>
            </div>
          </div>

          {/* Optional: comments thread shell (Phase 3 can populate) */}
          <div className='rounded-2xl border p-4'>
            <h3 className='text-base font-semibold'>Comments</h3>
            <p className='mt-2 text-sm text-gray-600'>
              Conversation between admin and customer will appear here.
            </p>
            <div className='mt-3 text-sm text-gray-500'>No comments yet.</div>
          </div>
        </aside>
      </div>
    </main>
  )
}

/* ---------------- helpers ---------------- */

function SIDES_HAS(s: string): s is Side {
  return s === 'front' || s === 'back' || s === 'sleeve'
}

function uniqSides(input: Side[]) {
  const set = new Set(input)
  return SIDE_ORDER.filter((s) => set.has(s))
}

function SideTabs({
  id,
  current,
  available,
}: {
  id: string
  current: Side
  available: Side[]
}) {
  const mk = (s: Side) => `/admin/designs/${id}?side=${s}`
  const all: Side[] = SIDE_ORDER // show tabs in fixed order
  return (
    <nav className='flex gap-2'>
      {all.map((s) => {
        const exists = available.includes(s)
        const active = current === s
        const base =
          'inline-flex items-center rounded-full border px-3 py-1 text-xs capitalize'
        if (!exists) {
          return (
            <span key={s} className={`${base} border-dashed text-gray-400`}>
              {s}
            </span>
          )
        }
        return (
          <Link
            key={s}
            href={mk(s)}
            className={`${base} ${
              active ? 'bg-black text-white border-black' : 'border-gray-300'
            }`}
          >
            {s}
          </Link>
        )
      })}
    </nav>
  )
}

/**
 * Simple server-rendered canvas with a static mockup background and
 * the artwork image overlaid inside the safe-area box for the given side.
 * Assumes PRINT_AREAS contains an entry for the chosen side.
 */
function PreviewCanvas({
  side,
  areaLabel,
  area,
  artUrl,
  x,
  y,
  scale,
}: {
  side: Side
  areaLabel: string
  area: {
    id: string
    label: string
    side: Side
    // normalized safe-area box within the canvas (0..1)
    box: { x: number; y: number; w: number; h: number }
    // base mockup image for this side (you can set in PRINT_AREAS)
    mock?: { src: string; alt?: string }
  }
  artUrl: string | null
  x: number
  y: number
  scale: number
}) {
  // Canvas aspect: use a fixed 4:5 for apparel mockups (tweak as needed)
  // We'll position safe-area using absolute % from PRINT_AREAS.box
  const box = area.box

  return (
    <div className='relative mx-auto aspect-[4/5] w-full max-w-[700px] overflow-hidden rounded-xl bg-white'>
      {/* Mockup background (static per side) — configure in PRINT_AREAS.mock */}
      {area.mock ? (
        <Image
          src={area.mock.src}
          alt={area.mock.alt || `${side} mockup`}
          fill
          className='object-cover'
          priority
        />
      ) : (
        <div className='absolute inset-0 bg-gray-50' />
      )}

      {/* Safe-area outline */}
      <div
        className='absolute border-2 border-emerald-400/70'
        style={{
          left: `${box.x * 100}%`,
          top: `${box.y * 100}%`,
          width: `${box.w * 100}%`,
          height: `${box.h * 100}%`,
        }}
        title={`${areaLabel} safe area`}
      />

      {/* Artwork overlay, positioned within safe area using normalized coords */}
      {artUrl ? (
        <div
          className='absolute'
          style={{
            left: `${(box.x + box.w * x) * 100}%`,
            top: `${(box.y + box.h * y) * 100}%`,
            width: `${box.w * scale * 100}%`,
            // lock aspect by using width-only; image will scale to fit width
          }}
        >
          <Image
            src={artUrl}
            alt='Artwork'
            width={1200}
            height={1200}
            className='h-auto w-full object-contain drop-shadow'
            // If your Cloudinary plan supports transformations, consider a smaller thumb here.
          />
        </div>
      ) : (
        <div className='absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded bg-white/80 px-3 py-1 text-xs text-gray-600'>
          No artwork on this side
        </div>
      )}
    </div>
  )
}
