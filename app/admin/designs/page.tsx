import Link from 'next/link'
import { prisma } from '@/lib/db'
import { requireAdmin } from '@/lib/authz'

export const runtime = 'nodejs'

export default async function AdminDesignsPage() {
  await requireAdmin()

  // Fetch latest designs, most recent first
  const designs = await prisma.design.findMany({
    orderBy: { updatedAt: 'desc' },
    include: {
      user: {
        select: { email: true, name: true },
      },
      comments: {
        select: { id: true },
      },
    },
  })

  return (
    <main className='mx-auto max-w-6xl p-6'>
      <h1 className='text-2xl font-semibold mb-6'>Design Submissions</h1>

      {designs.length === 0 ? (
        <p className='text-gray-500'>No designs submitted yet.</p>
      ) : (
        <table className='w-full text-sm border-collapse border border-gray-200'>
          <thead className='bg-gray-50 text-left'>
            <tr>
              <th className='p-3 border-b'>ID</th>
              <th className='p-3 border-b'>User</th>
              <th className='p-3 border-b'>Status</th>
              <th className='p-3 border-b'>Updated</th>
              <th className='p-3 border-b'>Comments</th>
              <th className='p-3 border-b text-right'>Action</th>
            </tr>
          </thead>
          <tbody>
            {designs.map((d) => (
              <tr key={d.id} className='hover:bg-gray-50'>
                <td className='p-3 font-mono text-xs'>{d.id.slice(0, 8)}…</td>
                <td className='p-3'>
                  {d.user?.name || d.user?.email || 'Anonymous'}
                </td>
                <td className='p-3 capitalize'>
                  <span
                    className={`px-2 py-1 rounded-full text-xs ${
                      d.status === 'approved'
                        ? 'bg-green-100 text-green-700'
                        : d.status === 'rejected'
                        ? 'bg-red-100 text-red-700'
                        : d.status === 'submitted'
                        ? 'bg-blue-100 text-blue-700'
                        : 'bg-gray-100 text-gray-700'
                    }`}
                  >
                    {d.status}
                  </span>
                </td>
                <td className='p-3 text-gray-600'>
                  {new Date(d.updatedAt).toLocaleString()}
                </td>
                <td className='p-3 text-gray-600'>{d.comments.length}</td>
                <td className='p-3 text-right'>
                  <Link
                    href={`/admin/designs/${d.id}`}
                    className='inline-block rounded-lg bg-black text-white px-3 py-1 text-xs hover:bg-gray-800'
                  >
                    Review
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </main>
  )
}
