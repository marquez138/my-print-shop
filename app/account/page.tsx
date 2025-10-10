// app/account/page.tsx
import { requireUser } from '@/lib/authz'

export default async function AccountPage() {
  const me = await requireUser() // redirects to /sign-in if not logged in

  return (
    <main className='mx-auto max-w-4xl p-6'>
      <h1 className='text-xl font-semibold'>Your account</h1>
      <p className='mt-2 text-gray-600'>
        Signed in as <span className='font-mono'>{me.email}</span>
      </p>
      {/* Add more account widgets / orders, etc. */}
    </main>
  )
}
