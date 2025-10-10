// app/admin/designs/page.tsx
import Link from 'next/link'
import { prisma } from '@/lib/db'
import { requireAdmin } from '@/lib/authz'

const usd = (c?: number | null) =>
  typeof c === 'number' ? `$${(c / 100).toFixed(2)}` : '$0.00'

const SIDE_ORDER: Array<'front' | 'back' | 'sleeve'> = [
  'front',
  'back',
  'sleeve',
]

export default async function AdminDesignsPage(props: {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
  // 🔒 protect whole page
  await requireAdmin()

  // Next 15: unwrap searchParams
  const sp = await props.searchParams
  const page = Math.max(1, Number(sp.page ?? '1'))
  const pageSize = 20
  const skip = (page - 1) * pageSize

  // Filters
  const status = typeof sp.status === 'string' ? sp.status : undefined
  // Default triage queue: submitted + changes_requested if no explicit filter
  const where = status
    ? { status }
    : { status: { in: ['submitted', 'changes_requested'] } }

  const [rows, total] = await Promise.all([
    prisma.design.findMany({
      where,
      orderBy: { updatedAt: 'desc' },
      skip,
      take: pageSize,
      select: {
        id: true,
        status: true,
        updatedAt: true,
        pricingTotal: true,
        productId: true,
        variantSku: true,
        placements: {
          select: { side: true },
        },
        // If you linked Design -> Customer, include a bit of identity:
        // customer: { select: { name: true, email: true } },
        // If not, and only Clerk userId is stored, omit this for now.
      },
    }),
    prisma.design.count({ where }),
  ])
  const totalPages = Math.max(1, Math.ceil(total / pageSize))

  return (
    <main className='mx-auto max-w-6xl p-6'>
      <header className='mb-6 flex items-center justify-between'>
        <div>
          <h1 className='text-xl font-semibold'>Designs</h1>
          <p className='mt-1 text-gray-600'>
            {total} total
            {status
              ? ` • filtered by “${status}”`
              : ' • submitted & changes requested'}
          </p>
        </div>
        <StatusFilter current={status} />
      </header>

      <div className='overflow-x-auto rounded-xl border'>
        <table className='min-w-full text-sm'>
          <thead className='bg-gray-50 text-left'>
            <tr>
              <Th>Design</Th>
              <Th>Updated</Th>
              <Th>Product / Variant</Th>
              <Th>Sides</Th>
              <Th>Status</Th>
              <Th className='text-right'>Total</Th>
              <Th />
            </tr>
          </thead>
          <tbody className='divide-y'>
            {rows.map((d) => {
              const sides = uniqSides(d.placements.map((p) => p.side as any))
              return (
                <tr key={d.id}>
                  <Td>
                    <code className='text-xs'>{d.id.slice(0, 8)}…</code>
                  </Td>
                  <Td>{new Date(d.updatedAt).toLocaleString()}</Td>
                  <Td>
                    <div className='text-gray-900'>{d.productId}</div>
                    <div className='text-gray-500 text-xs'>{d.variantSku}</div>
                  </Td>
                  <Td>
                    <div className='flex items-center gap-2'>
                      {sides.length === 0 ? (
                        <span className='text-gray-500'>—</span>
                      ) : (
                        sides.map((s) => <SideChip key={s} side={s} />)
                      )}
                    </div>
                  </Td>
                  <Td>
                    <StatusBadge status={d.status} />
                  </Td>
                  <Td className='text-right font-medium'>
                    {usd(d.pricingTotal)}
                  </Td>
                  <Td className='text-right'>
                    <Link
                      href={`/admin/designs/${d.id}`}
                      className='text-xs underline'
                    >
                      Open
                    </Link>
                  </Td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      <Pagination page={page} totalPages={totalPages} status={status} />
    </main>
  )
}

/* ---------- helpers & tiny components ---------- */

function uniqSides(input: string[]) {
  const set = new Set(input)
  const filtered = SIDE_ORDER.filter((s) => set.has(s))
  // if you ever add 'sleeve_left'/'sleeve_right', adapt rendering here
  return filtered
}

function SideChip({ side }: { side: 'front' | 'back' | 'sleeve' }) {
  const label = side === 'front' ? 'Front' : side === 'back' ? 'Back' : 'Sleeve'
  return (
    <span className='inline-flex items-center rounded-full border px-2 py-0.5 text-xs'>
      {label}
    </span>
  )
}

function StatusBadge({ status }: { status?: string | null }) {
  const s = (status || '').toLowerCase()
  const styles =
    s === 'approved'
      ? 'border-emerald-500 text-emerald-700'
      : s === 'submitted' || s === 'changes_requested'
      ? 'border-amber-500 text-amber-700'
      : s === 'rejected'
      ? 'border-rose-500 text-rose-700'
      : 'border-gray-400 text-gray-700'
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs capitalize ${styles}`}
    >
      {s || 'unknown'}
    </span>
  )
}

function StatusFilter({ current }: { current?: string }) {
  const base = '/admin/designs'
  const mk = (q?: string) =>
    q ? `${base}?status=${encodeURIComponent(q)}` : base
  const Btn = ({ label, q }: { label: string; q?: string }) => {
    const active = (current ?? '') === (q ?? '')
    return (
      <Link
        href={mk(q)}
        className={`inline-flex items-center rounded-full border px-3 py-1 text-xs ${
          active ? 'bg-black text-white border-black' : 'border-gray-300'
        }`}
      >
        {label}
      </Link>
    )
  }
  return (
    <div className='flex gap-2'>
      <Btn label='Submitted + Changes' />
      <Btn label='Submitted only' q='submitted' />
      <Btn label='Changes requested' q='changes_requested' />
      <Btn label='Approved' q='approved' />
      <Btn label='Rejected' q='rejected' />
    </div>
  )
}

function Pagination({
  page,
  totalPages,
  status,
}: {
  page: number
  totalPages: number
  status?: string
}) {
  if (totalPages <= 1) return null
  const mk = (p: number) =>
    `/admin/designs?page=${p}${
      status ? `&status=${encodeURIComponent(status)}` : ''
    }`
  return (
    <nav className='mt-6 flex items-center justify-between text-sm'>
      <Link
        href={page > 1 ? mk(page - 1) : '#'}
        aria-disabled={page <= 1}
        className={`rounded-md border px-3 py-2 ${
          page <= 1 ? 'pointer-events-none opacity-50' : ''
        }`}
      >
        ← Prev
      </Link>
      <div className='text-gray-600'>
        Page <span className='font-medium'>{page}</span> of{' '}
        <span className='font-medium'>{totalPages}</span>
      </div>
      <Link
        href={page < totalPages ? mk(page + 1) : '#'}
        aria-disabled={page >= totalPages}
        className={`rounded-md border px-3 py-2 ${
          page >= totalPages ? 'pointer-events-none opacity-50' : ''
        }`}
      >
        Next →
      </Link>
    </nav>
  )
}

function Th(props: React.ComponentProps<'th'>) {
  const { className = '', children, ...rest } = props
  return (
    <th className={`px-4 py-3 font-medium ${className}`} {...rest}>
      {children}
    </th>
  )
}

function Td(props: React.ComponentProps<'td'>) {
  const { className = '', children, ...rest } = props
  return (
    <td className={`px-4 py-3 align-top ${className}`} {...rest}>
      {children}
    </td>
  )
}
