import { createAdminToken, getAdminPassword, AuthConfigurationError } from '../../utils/auth-token'
import { obtainBackendToken } from '../../utils/backend-jwt'

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
  const password = typeof body?.password === 'string' ? body.password.trim() : ''
  const username = typeof body?.username === 'string' && body.username.trim()
    ? body.username.trim()
    : 'admin'

  if (!password || password !== adminPassword.trim()) {
    throw createError({
      statusCode: 401,
      statusMessage: 'Unauthorized',
    })
  }

  const token = createAdminToken()
  const backendToken = await obtainBackendToken(username, password)

  setCookie(event, 'admin_token', token, {
    maxAge: 60 * 60 * 24,
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
  })

  // Remove legacy insecure cookie
  deleteCookie(event, 'admin_auth', { path: '/' })

  // Nitro cookie for module routes; backendToken for .NET API Bearer auth.
  return {
    success: true,
    username,
    role: 'admin',
    token,
    backendToken,
  }
})
