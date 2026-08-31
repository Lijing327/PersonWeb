import type { H3Event } from 'h3'
import { createError, getRequestHeader, parseCookies } from 'h3'
import { verifyAdminToken } from './auth-token'

function extractBearerToken(authHeader: string | undefined): string | null {
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null
  }
  const token = authHeader.slice(7).trim()
  return token || null
}

export function checkAuth(event: H3Event): true {
  const cookies = parseCookies(event)
  const cookieToken = cookies.admin_token

  if (cookieToken && verifyAdminToken(cookieToken)) {
    return true
  }

  const bearerToken = extractBearerToken(getRequestHeader(event, 'Authorization'))
  if (bearerToken && verifyAdminToken(bearerToken)) {
    return true
  }

  throw createError({
    statusCode: 401,
    statusMessage: 'Unauthorized',
  })
}
