'use client'

import React from 'react'
import clsx from 'clsx'

interface Props {
  status: string
}

export default function DesignStatusBanner({ status }: Props) {
  const color =
    status === 'approved'
      ? 'bg-green-100 text-green-700 border-green-300'
      : status === 'rejected'
      ? 'bg-red-100 text-red-700 border-red-300'
      : status === 'changes_requested'
      ? 'bg-yellow-100 text-yellow-700 border-yellow-300'
      : status === 'submitted'
      ? 'bg-blue-100 text-blue-700 border-blue-300'
      : 'bg-gray-100 text-gray-700 border-gray-300'

  const label =
    {
      draft: 'Draft – still editable',
      submitted: 'Submitted – waiting for approval',
      changes_requested: 'Changes requested – see admin notes',
      approved: 'Approved – ready for checkout',
      rejected: 'Rejected – cannot continue',
      ordered: 'Ordered – in production',
    }[status] ?? status

  return (
    <div
      className={clsx(
        'border rounded-md px-4 py-3 mb-4 text-sm font-medium',
        color
      )}
    >
      {label}
    </div>
  )
}
