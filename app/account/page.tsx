// app/account/page.tsx
import { requireUser } from '@/lib/authz'
import { prisma } from '@/lib/db'

const usd = (cents: number | null | undefined) =>
  typeof cents === 'number' ? `$${(cents / 100).toFixed(2)}` : '$0.00'

export default async function AccountPage() {
  const me = await requireUser()

  // Fetch recent orders for this customer
  const orders = await prisma.order.findMany({
    where: {
      customer: { clerkUserId: me.id ? undefined : undefined },
      customerId: me.id,
    }, // fallback explained below
    orderBy: { createdAt: 'desc' },
    include: {
      items: {
        select: { id: true, name: true, sku: true, qty: true, unitPrice: true },
      },
    },
    take: 20,
  })

  // NOTE:
  // If your earlier data has some orders without `customerId` but with `email` only,
  // you can add a fallback query to also fetch by email. For pure new data, the above is enough.

  return (
    <main className='mx-auto max-w-4xl p-6'>
      <h1 className='text-xl font-semibold'>Your account</h1>
      <p className='mt-2 text-gray-600'>
        Signed in as <span className='font-mono'>{me.email}</span>
      </p>

      <section className='mt-8'>
        <h2 className='text-lg font-semibold'>Orders</h2>

        {orders.length === 0 ? (
          <p className='mt-3 text-gray-600'>No orders yet.</p>
        ) : (
          <div className='mt-4 overflow-x-auto rounded-lg border'>
            <table className='min-w-full text-sm'>
              <thead className='bg-gray-50 text-left'>
                <tr>
                  <th className='px-4 py-3 font-medium'>Order</th>
                  <th className='px-4 py-3 font-medium'>Date</th>
                  <th className='px-4 py-3 font-medium'>Status</th>
                  <th className='px-4 py-3 font-medium'>Items</th>
                  <th className='px-4 py-3 font-medium text-right'>Total</th>
                </tr>
              </thead>
              <tbody className='divide-y'>
                {orders.map((o) => (
                  <tr key={o.id}>
                    <td className='px-4 py-3'>
                      <div className='font-mono text-xs'>
                        {o.id.slice(0, 8)}…
                      </div>
                    </td>
                    <td className='px-4 py-3'>
                      {new Date(o.createdAt).toLocaleDateString()}
                    </td>
                    <td className='px-4 py-3'>
                      <span className='inline-flex items-center rounded-full border px-2 py-0.5 text-xs capitalize'>
                        {o.status.toLowerCase()}
                      </span>
                    </td>
                    <td className='px-4 py-3'>
                      <div className='space-y-1'>
                        {o.items.map((it) => (
                          <div key={it.id} className='text-gray-700'>
                            {it.qty}× {it.name}{' '}
                            <span className='text-gray-500'>({it.sku})</span>
                          </div>
                        ))}
                      </div>
                    </td>
                    <td className='px-4 py-3 text-right font-medium'>
                      {usd(o.total)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </main>
  )
}
