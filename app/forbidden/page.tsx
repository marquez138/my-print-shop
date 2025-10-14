// app/forbidden/page.tsx
export default function ForbiddenPage() {
  return (
    <main className='mx-auto max-w-xl p-8 text-center'>
      <h1 className='text-2xl font-semibold'>Access denied</h1>
      <p className='mt-2 text-gray-600'>
        You don’t have permission to view this page.
      </p>
    </main>
  )
}
