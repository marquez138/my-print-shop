// app/account/layout.tsx
import { requireUser } from '@/lib/authz'

export default async function AccountLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // Redirects to /sign-in if not logged in
  await requireUser()
  return <div className='mx-auto max-w-5xl p-6'>{children}</div>
}
