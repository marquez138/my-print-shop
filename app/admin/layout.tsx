// app/admin/layout.tsx
import { requireAdmin } from '@/lib/authz'

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  await requireAdmin() // redirects if not admin
  return <>{children}</>
}
