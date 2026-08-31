import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { createEvent } from 'h3'
import {
  AuthConfigurationError,
  createAdminToken,
  getAdminPassword,
  verifyAdminToken,
} from '~/server/utils/auth-token'
import { checkAuth } from '~/server/utils/auth'

const TEST_PASSWORD = 'test-admin-password-phase1'

function createAuthEvent(options?: {
  bearer?: string
  cookieToken?: string
}) {
  const headers: Record<string, string> = {}
  const cookieParts: string[] = []

  if (options?.bearer) {
    headers.authorization = `Bearer ${options.bearer}`
  }
  if (options?.cookieToken) {
    cookieParts.push(`admin_token=${options.cookieToken}`)
  }
  if (cookieParts.length > 0) {
    headers.cookie = cookieParts.join('; ')
  }

  return createEvent({
    method: 'GET',
    url: '/api/admin/articles',
    headers,
  })
}

describe('admin auth token', () => {
  beforeEach(() => {
    process.env.ADMIN_PASSWORD = TEST_PASSWORD
    delete process.env.ADMIN_AUTH_SECRET
  })

  afterEach(() => {
    delete process.env.ADMIN_PASSWORD
    delete process.env.ADMIN_AUTH_SECRET
  })

  it('requires ADMIN_PASSWORD to be configured', () => {
    delete process.env.ADMIN_PASSWORD
    expect(() => getAdminPassword()).toThrow(AuthConfigurationError)
  })

  it('creates and verifies a signed admin token', () => {
    const token = createAdminToken()
    expect(verifyAdminToken(token)).toBe(true)
  })

  it('rejects placeholder and arbitrary bearer tokens', () => {
    expect(verifyAdminToken('admin_token_placeholder')).toBe(false)
    expect(verifyAdminToken('not-a-valid-token')).toBe(false)
    expect(verifyAdminToken('')).toBe(false)
  })

  it('checkAuth accepts a valid bearer token', () => {
    const token = createAdminToken()
    expect(checkAuth(createAuthEvent({ bearer: token }))).toBe(true)
  })

  it('checkAuth accepts a valid httpOnly-style cookie token', () => {
    const token = createAdminToken()
    expect(checkAuth(createAuthEvent({ cookieToken: token }))).toBe(true)
  })

  it('checkAuth rejects missing and invalid credentials', () => {
    expect(() => checkAuth(createAuthEvent())).toThrowError(/Unauthorized/i)
    expect(() => checkAuth(createAuthEvent({ bearer: 'admin_token_placeholder' }))).toThrowError(
      /Unauthorized/i,
    )
    expect(() => checkAuth(createAuthEvent({ cookieToken: 'legacy-invalid' }))).toThrowError(
      /Unauthorized/i,
    )
  })
})
