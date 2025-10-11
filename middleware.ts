// middleware.ts
import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'

// ✅ Define which routes require authentication
const protectedRoutes = createRouteMatcher([
  '/account(.*)',
  '/checkout(.*)',
  '/api/checkout(.*)',
  '/admin(.*)',
  '/api/admin(.*)',
  '/dashboard(.*)', // ← add this
])

export default clerkMiddleware(async (auth, req) => {
  // Skip webhooks & static files
  const path = req.nextUrl.pathname
  if (path.startsWith('/api/webhooks')) return

  // 🔒 Protect only selected routes
  if (protectedRoutes(req)) {
    await auth()
  }
})

// ✅ Configure where middleware runs
export const config = {
  matcher: [
    // These paths require Clerk session handling
    '/((?!_next|.*\\..*|api/webhooks).*)',
  ],
}
