export default function Footer() {
  return (
    <footer className='border-t mt-12'>
      <div className='mx-auto max-w-[1500px] px-6 py-10 text-sm text-gray-600'>
        © {new Date().getFullYear()} My-Print-Shop
      </div>
    </footer>
  )
}
