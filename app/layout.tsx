// app/layout.tsx
import type { Metadata } from 'next'
import './globals.css'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import { ClerkProvider } from '@clerk/nextjs'

export const metadata: Metadata = {
  title: 'My Print Shop',
  description: 'Upload artwork to specific print areas and order custom tees.',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <ClerkProvider
      // ✅ use modern props (avoid the warnings about afterSignIn/afterSignUp)
      signInFallbackRedirectUrl='/post-sign-in'
      signUpFallbackRedirectUrl='/post-sign-in'
    >
      <html lang='en'>
        <body className='min-h-dvh antialiased text-gray-900'>
          <Header />
          <main className='mx-auto max-w-[1600px] p-6'>{children}</main>
          <Footer />
        </body>
      </html>
    </ClerkProvider>
  )
}
