'use client'

interface Comment {
  id: string
  author: string
  body: string
  createdAt: string
}

export default function CommentsList({ comments }: { comments: Comment[] }) {
  if (!comments?.length)
    return <div className='text-sm text-gray-500 italic'>No comments yet.</div>

  return (
    <div className='space-y-3'>
      {comments.map((c) => (
        <div
          key={c.id}
          className='border border-gray-200 rounded-lg p-3 bg-gray-50'
        >
          <div className='text-xs text-gray-500 mb-1'>
            {c.author === 'admin' ? 'Admin' : 'You'} •{' '}
            {new Date(c.createdAt).toLocaleString()}
          </div>
          <div className='text-sm text-gray-800'>{c.body}</div>
        </div>
      ))}
    </div>
  )
}
