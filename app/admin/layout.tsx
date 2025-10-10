// app/admin/layout.tsx
import { requireAdmin } from '@/lib/authz'

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // Throws redirects if not admin
  await requireAdmin()

  return (
    <div className='mx-auto max-w-7xl p-6'>
      <header className='mb-6 flex items-center justify-between'>
        <h1 className='text-xl font-semibold'>Admin</h1>
      </header>
      {children}
    </div>
  )
}
