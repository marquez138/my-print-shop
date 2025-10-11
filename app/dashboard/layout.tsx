export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className='mx-auto max-w-[1100px] w-full space-y-6'>
      <header className='pt-2'>
        <h1 className='text-2xl font-semibold'>Your Designs</h1>
        <p className='text-sm text-gray-600'>
          Track status, open drafts, and view approvals.
        </p>
      </header>
      {children}
    </div>
  )
}
