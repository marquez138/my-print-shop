import Image from 'next/image'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { prisma } from '@/lib/db'
import { requireAdmin } from '@/lib/authz'
import { PRINT_AREAS } from '@/config/print-areas'
import DesignActions from '@/components/admin/DesignActions'
import CommentsPanel from '@/components/admin/CommentsPanel'

const USD = (c?: number | null) =>
  typeof c === 'number' ? `$${(c / 100).toFixed(2)}` : '$0.00'

type Side = 'front' | 'back' | 'sleeve'
const SIDE_ORDER: Side[] = ['front', 'back', 'sleeve']

// Simple hex map for consistent color chips in admin
const COLOR_HEX: Record<string, string> = {
  black: '#000000',
  white: '#ffffff',
  ash: '#e1e1e1',
  green: '#1f7a41',
  // add more if needed…
}

/* ---------------- page ---------------- */

export default async function AdminDesignDetail(props: {
  params: Promise<{ id: string }>
  searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
  await requireAdmin()

  const { id } = await props.params
  const sp = await props.searchParams
  const side = (typeof sp.side === 'string' ? sp.side : 'front') as Side

  // 1) Load design (placements + comments)
  const design = await prisma.design.findUnique({
    where: { id },
    include: {
      placements: true,
      comments: {
        orderBy: { createdAt: 'asc' },
        select: { id: true, author: true, body: true, createdAt: true },
      },
    },
  })
  if (!design) notFound()

  // 2) Resolve displayColor (design.color → parse from SKU → variant.color)
  const parsedFromSku = parseColorFromSku(design.variantSku)
  const variant = await prisma.variant.findUnique({
    where: { sku: design.variantSku },
    select: { color: true },
  })
  const displayColor =
    normalizeColorName(design.color) ??
    normalizeColorName(parsedFromSku) ??
    normalizeColorName(variant?.color) ??
    null

  // 3) Try to load product images for that color (note: Design.productId stores slug)
  let colorImages:
    | {
        url: string
        alt: string | null
        tag: string | null
        position: number
      }[]
    | null = null
  const product =
    (await prisma.product.findUnique({
      where: { slug: design.productId },
      select: {
        id: true,
        images: {
          select: {
            url: true,
            alt: true,
            tag: true,
            color: true,
            position: true,
          },
        },
      },
    })) || null

  if (product && displayColor) {
    const target = displayColor.toLowerCase()
    colorImages = product.images
      .filter((img) => (img.color ?? '').toLowerCase() === target)
      .sort((a, b) => a.position - b.position)
      .map((i) => ({
        url: i.url,
        alt: i.alt,
        tag: i.tag,
        position: i.position,
      }))
  }

  const sidesWithArt = uniqSides(design.placements.map((p) => p.side as Side))
  const currentSide = (
    SIDES_HAS(side) ? side : sidesWithArt[0] ?? 'front'
  ) as Side

  const placement =
    design.placements.find((p) => p.side === currentSide) ?? null

  const sideAreas = PRINT_AREAS.filter((a) => a.side === currentSide)
  const area = ensureBox(
    sideAreas.find((a) => a.id === placement?.areaId) ?? sideAreas[0]
  )

  return (
    <main className='mx-auto max-w-6xl p-6 space-y-8'>
      {/* Title + meta */}
      <header className='flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between'>
        <div>
          <h1 className='text-xl font-semibold flex items-center gap-3'>
            <span>Design {design.id.slice(0, 8)}…</span>
            {displayColor && <ColorPill name={displayColor} />}
          </h1>
          <p className='text-gray-600'>
            Status:{' '}
            <span className='inline-flex items-center rounded-full border px-2 py-0.5 text-xs capitalize'>
              {design.status.toLowerCase()}
            </span>{' '}
            • Updated {new Date(design.updatedAt).toLocaleString()}
          </p>
          {/* Optional: small rail of product images for the color */}
          {!!colorImages?.length && (
            <div className='mt-3 flex gap-2'>
              {colorImages.slice(0, 4).map((img, i) => (
                <div
                  key={i}
                  className='relative h-16 w-14 overflow-hidden rounded-md border'
                >
                  <Image
                    src={img.url}
                    alt={img.alt ?? 'Preview'}
                    fill
                    className='object-cover'
                  />
                </div>
              ))}
            </div>
          )}
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

        {/* Right: actions + comments */}
        <aside className='lg:col-span-4 space-y-4'>
          <div className='rounded-2xl border p-4'>
            <h2 className='text-base font-semibold'>Actions</h2>
            <p className='mt-1 text-sm text-gray-600'>
              Approve if print-ready. Request changes if adjustments are needed.
              Reject if not printable.
            </p>

            <DesignActions designId={design.id} />
          </div>

          <CommentsPanel
            designId={design.id}
            initial={design.comments.map((c) => ({
              ...c,
              createdAt: c.createdAt.toISOString(),
            }))}
          />
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

function normalizeColorName(name?: string | null) {
  if (!name) return null
  return name.trim().toLowerCase()
}

function parseColorFromSku(sku?: string | null) {
  if (!sku) return null
  // Common pattern: slug-color-size OR slug-color
  const parts = sku.split('-')
  // find a token that matches known color keys
  for (const p of parts) {
    const token = p.toLowerCase()
    if (COLOR_HEX[token]) return token
  }
  return null
}

/* ---------------- side tabs (add this helper) ---------------- */

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
  const all: Side[] = SIDE_ORDER
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

function ensureBox<
  T extends {
    side: any
    id: string
    label: string
    mock?: { src: string; alt?: string }
  }
>(area: T & Partial<{ box: { x: number; y: number; w: number; h: number } }>) {
  return {
    ...area,
    box: area.box ?? { x: 0.2, y: 0.18, w: 0.6, h: 0.6 },
  }
}

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
    box: { x: number; y: number; w: number; h: number }
    mock?: { src: string; alt?: string }
  }
  artUrl: string | null
  x: number
  y: number
  scale: number
}) {
  const box = area.box
  return (
    <div className='relative mx-auto aspect-[4/5] w-full max-w-[700px] overflow-hidden rounded-xl bg-white'>
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
      {artUrl ? (
        <div
          className='absolute'
          style={{
            left: `${(box.x + box.w * x) * 100}%`,
            top: `${(box.y + box.h * y) * 100}%`,
            width: `${box.w * scale * 100}%`,
          }}
        >
          <Image
            src={artUrl}
            alt='Artwork'
            width={1200}
            height={1200}
            className='h-auto w-full object-contain drop-shadow'
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

/* Small color chip used next to the title */
function ColorPill({ name }: { name: string }) {
  const hex = COLOR_HEX[name] ?? '#bbb'
  const label = name.charAt(0).toUpperCase() + name.slice(1)
  const border = name === 'white' ? 'border-gray-300' : 'border-transparent'
  return (
    <span className='inline-flex items-center gap-2 text-xs text-gray-700'>
      <span
        className={`inline-block h-4 w-4 rounded-full border ${border}`}
        style={{ backgroundColor: hex }}
        aria-hidden
      />
      <span className='capitalize'>{label}</span>
    </span>
  )
}
