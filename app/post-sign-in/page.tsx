// app/post-sign-in/page.tsx
import { redirect } from 'next/navigation'
import { currentCustomer } from '@/lib/authz'

export default async function PostSignIn() {
  const me = await currentCustomer()
  // Not signed in? Send to sign-in (shouldn't happen if using Clerk's redirect)
  if (!me) redirect('/sign-in?redirect_url=/post-sign-in')

  // Admins → Admin dashboard. Everyone else → Account.
  if (me.role === 'ADMIN') redirect('/admin')
  redirect('/account')
}
