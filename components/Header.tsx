'use client'

import Link from 'next/link'
import { useUser, UserButton } from '@clerk/nextjs'

export default function Header() {
  const { isSignedIn, user } = useUser()

  return (
    <header className='flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-white'>
      <Link href='/' className='text-xl font-bold'>
        My Print Shop
      </Link>

      <nav className='flex items-center gap-6'>
        <Link href='/products' className='text-gray-700 hover:text-black'>
          Products
        </Link>

        {isSignedIn ? (
          <div className='flex items-center gap-3'>
            <span className='text-sm text-gray-600'>
              Hi, {user?.firstName || 'User'}
            </span>
            <UserButton afterSignOutUrl='/' />
          </div>
        ) : (
          <Link
            href='/sign-in'
            className='text-sm text-blue-600 hover:underline'
          >
            Sign in
          </Link>
        )}
      </nav>
    </header>
  )
}
