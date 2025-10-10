// app/admin/orders/page.tsx
import Link from 'next/link'
import { requireAdmin } from '@/lib/authz'
import { prisma } from '@/lib/db'

const usd = (cents?: number | null) =>
  typeof cents === 'number' ? `$${(cents / 100).toFixed(2)}` : '$0.00'

export default async function AdminOrdersPage(props: {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
  // 🔒 Protect whole page
  await requireAdmin()

  // Next.js 15: unwrap searchParams (async)
  const sp = await props.searchParams
  const page = Math.max(1, Number(sp.page ?? '1'))
  const pageSize = 20
  const skip = (page - 1) * pageSize

  // Optional status filter (?status=approved/submitted/…)
  const status = typeof sp.status === 'string' ? sp.status : undefined
  const where = status ? { status } : {}

  const [orders, total] = await Promise.all([
    prisma.order.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip,
      take: pageSize,
      select: {
        id: true,
        createdAt: true,
        status: true,
        total: true,
        currency: true,
        email: true,
        customer: { select: { id: true, email: true, name: true } },
        _count: { select: { items: true } },
      },
    }),
    prisma.order.count({ where }),
  ])

  const totalPages = Math.max(1, Math.ceil(total / pageSize))

  return (
    <main className='mx-auto max-w-6xl p-6'>
      <header className='mb-6 flex items-center justify-between'>
        <div>
          <h1 className='text-xl font-semibold'>Orders</h1>
          <p className='mt-1 text-gray-600'>
            {total} total {status ? `• filtered by “${status}”` : ''}
          </p>
        </div>

        <StatusFilter current={status} />
      </header>

      <div className='overflow-x-auto rounded-xl border'>
        <table className='min-w-full text-sm'>
          <thead className='bg-gray-50 text-left'>
            <tr>
              <Th>Order</Th>
              <Th>Date</Th>
              <Th>Customer</Th>
              <Th>Status</Th>
              <Th className='text-right'>Items</Th>
              <Th className='text-right'>Total</Th>
              <Th />
            </tr>
          </thead>
          <tbody className='divide-y'>
            {orders.map((o) => {
              const custLabel =
                o.customer?.name || o.customer?.email || o.email || '—'
              return (
                <tr key={o.id}>
                  <Td>
                    <code className='text-xs'>{o.id.slice(0, 8)}…</code>
                  </Td>
                  <Td>{new Date(o.createdAt).toLocaleString()}</Td>
                  <Td title={o.customer?.email ?? o.email ?? undefined}>
                    {custLabel}
                  </Td>
                  <Td>
                    <StatusBadge status={o.status} />
                  </Td>
                  <Td className='text-right'>{o._count.items}</Td>
                  <Td className='text-right font-medium'>
                    {usd(o.total)} {o.currency?.toUpperCase()}
                  </Td>
                  <Td className='text-right'>
                    <Link
                      href={`/admin/orders/${o.id}`}
                      className='text-xs underline'
                    >
                      View
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
function StatusBadge({ status }: { status?: string | null }) {
  const s = (status || '').toLowerCase()
  const styles =
    s === 'paid' || s === 'approved'
      ? 'border-emerald-500 text-emerald-700'
      : s === 'awaiting_payment' || s === 'submitted'
      ? 'border-amber-500 text-amber-700'
      : s === 'rejected' || s === 'canceled'
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
  const base = '/admin/orders'
  const link = (label?: string, q?: string) => {
    const isActive = (current ?? '') === (q ?? '')
    const href = q ? `${base}?status=${encodeURIComponent(q)}` : base
    return (
      <Link
        href={href}
        className={`inline-flex items-center rounded-full border px-3 py-1 text-xs ${
          isActive ? 'bg-black text-white border-black' : 'border-gray-300'
        }`}
      >
        {label ?? 'All'}
      </Link>
    )
  }
  return (
    <div className='flex gap-2'>
      {link('All')}
      {link('Awaiting payment', 'AWAITING_PAYMENT')}
      {link('Approved', 'APPROVED')}
      {link('Paid', 'PAID')}
      {link('Canceled', 'CANCELED')}
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
    `/admin/orders?page=${p}${
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
