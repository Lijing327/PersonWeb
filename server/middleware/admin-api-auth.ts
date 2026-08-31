import { checkAuth } from '../utils/auth'

/**
 * Server-side guard for all /api/admin/** routes.
 * Vue route middleware is not a security boundary.
 */
export default defineEventHandler((event) => {
  const pathname = getRequestURL(event).pathname
  if (pathname === '/api/admin' || pathname.startsWith('/api/admin/')) {
    checkAuth(event)
  }
})
