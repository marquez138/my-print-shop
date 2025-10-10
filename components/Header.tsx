// e.g., app/HeaderAuth.tsx
'use client'
import Link from 'next/link'
import { SignedIn, SignedOut, UserButton } from '@clerk/nextjs'

export default function Header() {
  return (
    <div className='flex items-center gap-3'>
      <SignedOut>
        <Link href='/sign-in' className='text-sm underline'>
          Sign in
        </Link>
      </SignedOut>
      <SignedIn>
        <Link href='/account' className='text-sm underline'>
          Account
        </Link>
        <UserButton />
      </SignedIn>
    </div>
  )
}
