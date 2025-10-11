export default function DesignStatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    draft: 'bg-gray-100 text-gray-800',
    submitted: 'bg-blue-100 text-blue-800',
    changes_requested: 'bg-amber-100 text-amber-900',
    approved: 'bg-emerald-100 text-emerald-800',
    ordered: 'bg-purple-100 text-purple-800',
    archived: 'bg-gray-100 text-gray-500',
  }
  const cls = map[status] ?? 'bg-gray-100 text-gray-800'
  return (
    <span
      className={`inline-flex items-center rounded px-2 py-1 text-xs font-medium ${cls}`}
    >
      {status.replace('_', ' ')}
    </span>
  )
}
