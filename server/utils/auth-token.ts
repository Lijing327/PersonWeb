import { createHmac, randomBytes, timingSafeEqual } from 'node:crypto'

const TOKEN_TTL_SECONDS = 60 * 60 * 24

export class AuthConfigurationError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'AuthConfigurationError'
  }
}

export function getAdminPassword(): string {
  const password = process.env.ADMIN_PASSWORD
  if (!password || password.trim() === '') {
    throw new AuthConfigurationError('ADMIN_PASSWORD is not configured')
  }
  return password
}

function getAuthSecret(): string {
  const secret = process.env.ADMIN_AUTH_SECRET || process.env.ADMIN_PASSWORD
  if (!secret || secret.trim() === '') {
    throw new AuthConfigurationError('Admin auth secret is not configured')
  }
  return secret
}

export function createAdminToken(): string {
  const secret = getAuthSecret()
  const payload = {
    sub: 'admin',
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + TOKEN_TTL_SECONDS,
    nonce: randomBytes(16).toString('hex'),
  }
  const payloadB64 = Buffer.from(JSON.stringify(payload)).toString('base64url')
  const signature = createHmac('sha256', secret).update(payloadB64).digest('base64url')
  return `${payloadB64}.${signature}`
}

export function verifyAdminToken(token: string): boolean {
  if (!token || typeof token !== 'string') {
    return false
  }

  let secret: string
  try {
    secret = getAuthSecret()
  } catch {
    return false
  }

  const parts = token.split('.')
  if (parts.length !== 2) {
    return false
  }

  const [payloadB64, signature] = parts
  if (!payloadB64 || !signature) {
    return false
  }

  const expectedSignature = createHmac('sha256', secret).update(payloadB64).digest('base64url')
  const sigBuf = Buffer.from(signature)
  const expectedBuf = Buffer.from(expectedSignature)
  if (sigBuf.length !== expectedBuf.length || !timingSafeEqual(sigBuf, expectedBuf)) {
    return false
  }

  let payload: { sub?: string; exp?: number }
  try {
    payload = JSON.parse(Buffer.from(payloadB64, 'base64url').toString('utf-8'))
  } catch {
    return false
  }

  if (payload.sub !== 'admin') {
    return false
  }

  if (typeof payload.exp !== 'number' || payload.exp < Math.floor(Date.now() / 1000)) {
    return false
  }

  return true
}
