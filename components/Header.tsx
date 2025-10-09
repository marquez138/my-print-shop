import Link from 'next/link'

export default function Header() {
  return (
    <header className='border-b'>
      <div className='mx-auto max-w-[1500px] h-14 px-6 flex items-center justify-between'>
        <Link href='/' className='font-semibold tracking-wide'>
          MY-PRINT-SHOP
        </Link>
        <nav className='flex items-center gap-6 text-sm'>
          <Link href='/#how-it-works' className='hover:underline'>
            How it works
          </Link>
          <Link href='/#pricing' className='hover:underline'>
            Pricing
          </Link>
        </nav>
      </div>
    </header>
  )
}
