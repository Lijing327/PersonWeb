import { createHmac, randomBytes } from 'node:crypto'
import { existsSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'

const DEFAULT_JWT_KEY = 'YourSuperSecretKeyHere_MustBeAtLeast32BytesLong'
const TOKEN_TTL_SECONDS = 60 * 60 * 24 * 7

function base64UrlEncode(value: string | Buffer): string {
  return Buffer.from(value).toString('base64url')
}

function readDotNetJwtKeyFromAppsettings(): string | null {
  const candidates = [
    resolve(process.cwd(), 'backend/PersonalSite.Api/appsettings.Development.json'),
    resolve(process.cwd(), 'backend/PersonalSite.Api/appsettings.json'),
  ]

  for (const filePath of candidates) {
    if (!existsSync(filePath)) {
      continue
    }
    try {
      const json = JSON.parse(readFileSync(filePath, 'utf8')) as {
        Jwt?: { Key?: string }
      }
      const key = json.Jwt?.Key?.trim()
      if (key) {
        return key
      }
    } catch {
      // ignore malformed appsettings
    }
  }

  return null
}

function getJwtConfig() {
  const key =
    process.env.DOTNET_JWT_KEY?.trim() ||
    process.env.JWT_KEY?.trim() ||
    readDotNetJwtKeyFromAppsettings() ||
    DEFAULT_JWT_KEY

  return {
    key,
    issuer: process.env.DOTNET_JWT_ISSUER?.trim() || 'PersonalSite.Api',
    audience: process.env.DOTNET_JWT_AUDIENCE?.trim() || 'PersonalSite.Web',
  }
}

/** Mint a JWT compatible with .NET JwtBearer validation. */
export function createBackendJwt(username = 'admin', userId = '1', role = 'admin'): string {
  const { key, issuer, audience } = getJwtConfig()
  const now = Math.floor(Date.now() / 1000)

  const header = base64UrlEncode(JSON.stringify({ alg: 'HS256', typ: 'JWT' }))
  const payload = base64UrlEncode(
    JSON.stringify({
      sub: userId,
      unique_name: username,
      'http://schemas.microsoft.com/ws/2008/06/identity/claims/role': role,
      jti: randomBytes(16).toString('hex'),
      iat: now,
      exp: now + TOKEN_TTL_SECONDS,
      iss: issuer,
      aud: audience,
    }),
  )

  const signingInput = `${header}.${payload}`
  const signature = createHmac('sha256', key).update(signingInput).digest('base64url')
  return `${signingInput}.${signature}`
}

type DotNetLoginResponse = {
  code?: number
  message?: string
  data?: {
    token?: string
    Token?: string
    username?: string
    Username?: string
    role?: string
    Role?: string
  }
}

/** Try .NET Auth/login; fall back to minted JWT when ADMIN_PASSWORD already validated. */
export async function obtainBackendToken(
  username: string,
  password: string,
): Promise<string> {
  const baseUrl =
    process.env.NUXT_BACKEND_API_BASE?.replace(/\/$/, '') ||
    process.env.NUXT_PUBLIC_API_BASE?.replace(/\/$/, '') ||
    'http://localhost:5234/api'

  try {
    const response = await $fetch<DotNetLoginResponse>(`${baseUrl}/Auth/login`, {
      method: 'POST',
      body: {
        username,
        password,
      },
    })

    const token = response?.data?.token || response?.data?.Token
    if (response?.code === 0 && token) {
      return token
    }
  } catch {
    // .NET unreachable or login failed — mint compatible JWT below
  }

  return createBackendJwt(username)
}
