// middleware.ts
import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'

const protectedRoutes = createRouteMatcher([
  '/design(.*)',
  '/api/design(.*)',
  '/api/uploads(.*)',
  '/account(.*)',
  '/admin(.*)',
  '/api/admin(.*)',
])

export default clerkMiddleware(async (auth, req) => {
  if (protectedRoutes(req)) await auth.protect()
})

export const config = {
  matcher: [
    '/design(.*)',
    '/api/design(.*)',
    '/api/uploads(.*)',
    '/account(.*)',
    '/admin(.*)',
    '/api/admin(.*)',
    // ❌ do NOT add /api/webhooks/*
  ],
}
