// middleware.ts
import { clerkMiddleware } from '@clerk/nextjs/server'

// Minimal Clerk middleware: let server components & layouts guard pages.
// Important: don't match webhooks/static so they stay public.
export default clerkMiddleware()

export const config = {
  matcher: [
    // run Clerk on everything except _next, static assets, and webhooks
    '/((?!_next|.*\\..*|api/webhooks).*)',
  ],
}
