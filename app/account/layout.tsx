// app/account/layout.tsx
import { requireUser } from '@/lib/authz'

export default async function AccountLayout({
  children,
}: {
  children: React.ReactNode
}) {
  await requireUser()
  return <>{children}</>
}
