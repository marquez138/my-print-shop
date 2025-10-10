// app/admin/orders/[id]/page.tsx
import { requireAdmin } from '@/lib/authz'
import { prisma } from '@/lib/db'

const usd = (cents?: number | null) =>
  typeof cents === 'number' ? `$${(cents / 100).toFixed(2)}` : '$0.00'

export default async function AdminOrderDetail(props: {
  params: Promise<{ id: string }>
}) {
  await requireAdmin()
  const { id } = await props.params

  const order = await prisma.order.findUnique({
    where: { id },
    include: {
      customer: { select: { id: true, email: true, name: true } },
      items: true,
    },
  })

  if (!order) {
    return (
      <main className='mx-auto max-w-4xl p-6'>
        <h1 className='text-xl font-semibold'>Order not found</h1>
      </main>
    )
  }

  return (
    <main className='mx-auto max-w-4xl p-6 space-y-6'>
      <div>
        <h1 className='text-xl font-semibold'>Order {order.id.slice(0, 8)}…</h1>
        <p className='text-gray-600'>
          {new Date(order.createdAt).toLocaleString()} •{' '}
          <span className='uppercase'>{order.status}</span>
        </p>
      </div>

      <section className='rounded-xl border'>
        <header className='border-b bg-gray-50 px-4 py-3 font-medium'>
          Items
        </header>
        <div className='divide-y'>
          {order.items.map((it) => (
            <div
              key={it.id}
              className='grid grid-cols-12 gap-4 px-4 py-3 text-sm'
            >
              <div className='col-span-6'>
                <div className='font-medium'>{it.name}</div>
                <div className='text-gray-500'>{it.sku}</div>
              </div>
              <div className='col-span-2'>Qty: {it.qty}</div>
              <div className='col-span-2 text-right'>{usd(it.unitPrice)}</div>
              <div className='col-span-2 text-right font-medium'>
                {usd((it.unitPrice ?? 0) * it.qty)}
              </div>
            </div>
          ))}
        </div>
        <footer className='flex justify-end gap-6 px-4 py-3 text-sm'>
          <div className='text-gray-600'>Total</div>
          <div className='font-semibold'>{usd(order.total)}</div>
        </footer>
      </section>

      <section className='rounded-xl border'>
        <header className='border-b bg-gray-50 px-4 py-3 font-medium'>
          Customer
        </header>
        <div className='px-4 py-3 text-sm'>
          <div>{order.customer?.name || '—'}</div>
          <div className='text-gray-600'>
            {order.customer?.email || order.email || '—'}
          </div>
        </div>
      </section>
    </main>
  )
}
