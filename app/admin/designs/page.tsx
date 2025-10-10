'use client'
import { useEffect, useState } from 'react'

export default function AdminDesignsPage() {
  const [designs, setDesigns] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const res = await fetch('/api/admin/designs?status=submitted')
      const data = await res.json()
      setDesigns(data.designs || [])
      setLoading(false)
    }
    load()
  }, [])

  if (loading) return <div className='p-8'>Loading submitted designs…</div>

  return (
    <div className='p-8'>
      <h1 className='text-2xl font-semibold mb-6'>Submitted Designs</h1>
      <table className='w-full text-sm border'>
        <thead className='bg-gray-100'>
          <tr>
            <th className='text-left p-2 border'>Design ID</th>
            <th className='text-left p-2 border'>Product</th>
            <th className='text-left p-2 border'>User</th>
            <th className='text-left p-2 border'>Placements</th>
            <th className='text-left p-2 border'>Status</th>
            <th className='text-left p-2 border'>Last Updated</th>
          </tr>
        </thead>
        <tbody>
          {designs.map((d) => (
            <tr key={d.id} className='hover:bg-gray-50'>
              <td className='p-2 border font-mono'>{d.id}</td>
              <td className='p-2 border'>{d.productId}</td>
              <td className='p-2 border'>{d.userId ?? 'Guest'}</td>
              <td className='p-2 border text-center'>{d.placementsCount}</td>
              <td className='p-2 border capitalize'>{d.status}</td>
              <td className='p-2 border text-gray-600'>
                {new Date(d.updatedAt).toLocaleString()}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
