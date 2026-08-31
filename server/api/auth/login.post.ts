import { createAdminToken, getAdminPassword, AuthConfigurationError } from '../../utils/auth-token'

export default defineEventHandler(async (event) => {
  let adminPassword: string
  try {
    adminPassword = getAdminPassword()
  } catch (error) {
    if (error instanceof AuthConfigurationError) {
      throw createError({
        statusCode: 503,
        statusMessage: 'Admin authentication is not configured',
      })
    }
    throw error
  }

  const body = await readBody(event)
  const { password } = body ?? {}

  if (!password || password !== adminPassword) {
    throw createError({
      statusCode: 401,
      statusMessage: 'Unauthorized',
    })
  }

  const token = createAdminToken()

  setCookie(event, 'admin_token', token, {
    maxAge: 60 * 60 * 24,
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
  })

  // Remove legacy insecure cookie
  deleteCookie(event, 'admin_auth', { path: '/' })

  // Web Admin uses cookie auth only. Token is returned for API/CLI clients
  // that intentionally send Authorization: Bearer — Admin UI must NOT store it.
  return {
    success: true,
    username: 'admin',
    role: 'admin',
    token,
  }
})
