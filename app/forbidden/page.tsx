// app/forbidden/page.tsx
export const dynamic = 'force-static'

export default function ForbiddenPage() {
  return (
    <main className='mx-auto max-w-2xl p-8 text-center'>
      <h1 className='text-2xl font-semibold'>Forbidden</h1>
      <p className='mt-3 text-gray-600'>
        You don’t have permission to view this page.
      </p>
    </main>
  )
}
