// app/admin/layout.tsx
import { requireAdmin } from '@/lib/authz'

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  await requireAdmin()
  return (
    <div className='min-h-screen bg-gray-50'>
      <div className='mx-auto max-w-7xl p-6'>{children}</div>
    </div>
  )
}
