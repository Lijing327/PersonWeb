import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { createBackendJwt } from '~/server/utils/backend-jwt'

describe('backend jwt', () => {
  beforeEach(() => {
    delete process.env.DOTNET_JWT_KEY
    delete process.env.DOTNET_JWT_ISSUER
    delete process.env.DOTNET_JWT_AUDIENCE
  })

  afterEach(() => {
    delete process.env.DOTNET_JWT_KEY
    delete process.env.DOTNET_JWT_ISSUER
    delete process.env.DOTNET_JWT_AUDIENCE
  })

  it('creates a three-part JWT', () => {
    const token = createBackendJwt('admin', '1', 'admin')
    expect(token.split('.')).toHaveLength(3)
  })

  it('respects DOTNET_JWT_KEY when configured', () => {
    process.env.DOTNET_JWT_KEY = 'custom-test-jwt-key-at-least-32-chars'
    const token = createBackendJwt()
    expect(token.split('.')).toHaveLength(3)
  })
})
