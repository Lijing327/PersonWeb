import { verifyAdminToken } from '../../utils/auth-token'

/**
 * Lightweight session probe for Admin UI middleware.
 * Relies on httpOnly admin_token cookie (credentials: include).
 */
export default defineEventHandler((event) => {
  const cookies = parseCookies(event)
  const cookieToken = cookies.admin_token
  const authenticated = Boolean(cookieToken && verifyAdminToken(cookieToken))

  return {
    authenticated,
    username: authenticated ? 'admin' : null,
    role: authenticated ? 'admin' : null,
  }
})
