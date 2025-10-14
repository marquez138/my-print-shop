// app/(auth)/sign-in/[[...sign-in]]/page.tsx
'use client'

import { SignedIn, SignedOut, SignIn } from '@clerk/nextjs'
import { redirect } from 'next/navigation'

export default function SignInPage() {
  return (
    <div className='mx-auto max-w-md p-6'>
      {/* Only render <SignIn /> if user is signed out */}
      <SignedOut>
        <SignIn fallbackRedirectUrl='/account' />
      </SignedOut>

      {/* If user is already signed in, redirect them immediately */}
      <SignedIn>{redirect('/account')}</SignedIn>
    </div>
  )
}
