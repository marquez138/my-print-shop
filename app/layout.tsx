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
    <ClerkProvider>
      <html lang='en'>
        <body className='min-h-dvh antialiased text-gray-900'>
          <Header />
          <main className='mx-auto max-w-[1500px] p-6'>{children}</main>
          <Footer />
        </body>
      </html>
    </ClerkProvider>
  )
}
