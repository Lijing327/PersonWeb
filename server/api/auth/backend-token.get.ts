import { verifyAdminToken } from '../../utils/auth-token'
import { createBackendJwt } from '../../utils/backend-jwt'

/**
 * Issue a .NET-compatible JWT when Nitro admin session is valid.
 * Used to restore backend API auth after refresh / new tab.
 */
export default defineEventHandler((event) => {
  const cookieToken = getCookie(event, 'admin_token')
  if (!cookieToken || !verifyAdminToken(cookieToken)) {
    throw createError({
      statusCode: 401,
      statusMessage: 'Unauthorized',
    })
  }

  return {
    backendToken: createBackendJwt(),
  }
})
