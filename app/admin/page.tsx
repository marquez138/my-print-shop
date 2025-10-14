// app/admin/page.tsx
import Link from 'next/link'
import { requireAdmin } from '@/lib/authz'
import { prisma } from '@/lib/db'

export const dynamic = 'force-dynamic'

export default async function AdminDashboardPage() {
  const me = await requireAdmin()

  const [designCount, orderCount, userCount] = await Promise.all([
    prisma.design.count(),
    prisma.order.count(),
    prisma.customer.count(),
  ])

  return (
    <main className='mx-auto max-w-5xl p-8'>
      <h1 className='text-2xl font-semibold'>Admin Dashboard</h1>
      <p className='mt-2 text-gray-600'>
        Welcome back, <span className='font-medium'>{me.name || me.email}</span>
      </p>

      <div className='mt-8 grid grid-cols-1 sm:grid-cols-3 gap-6'>
        <DashboardCard
          label='Pending Designs'
          value={designCount}
          href='/admin/designs'
          description='Designs awaiting approval'
        />
        <DashboardCard
          label='Orders'
          value={orderCount}
          href='/admin/orders'
          description='Completed or approved orders'
        />
        <DashboardCard
          label='Users'
          value={userCount}
          href='/admin/customers'
          description='Registered customers'
        />
      </div>

      <section className='mt-10'>
        <h2 className='text-lg font-semibold'>Quick Actions</h2>
        <div className='mt-3 space-x-3'>
          <Link
            href='/admin/designs'
            className='inline-block rounded-md bg-black px-4 py-2 text-white text-sm'
          >
            Review Designs
          </Link>
          <Link
            href='/admin/orders'
            className='inline-block rounded-md bg-gray-800 px-4 py-2 text-white text-sm'
          >
            View Orders
          </Link>
          <Link
            href='/'
            className='inline-block rounded-md border px-4 py-2 text-sm'
          >
            Return to Site
          </Link>
        </div>
      </section>
    </main>
  )
}

function DashboardCard({
  label,
  value,
  href,
  description,
}: {
  label: string
  value: number
  href: string
  description: string
}) {
  return (
    <Link
      href={href}
      className='block rounded-xl border border-gray-200 p-6 hover:shadow-md transition'
    >
      <div className='text-sm text-gray-500'>{label}</div>
      <div className='mt-1 text-3xl font-semibold'>{value}</div>
      <div className='mt-1 text-xs text-gray-500'>{description}</div>
    </Link>
  )
}
