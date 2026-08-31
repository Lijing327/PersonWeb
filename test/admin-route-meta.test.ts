import { describe, it, expect } from 'vitest'
import { readFileSync, readdirSync, statSync } from 'node:fs'
import path from 'node:path'

const ADMIN_PAGES_ROOT = path.resolve('pages/admin')

function collectVueFiles(dir: string): string[] {
  const entries = readdirSync(dir)
  const files: string[] = []
  for (const entry of entries) {
    const fullPath = path.join(dir, entry)
    const stat = statSync(fullPath)
    if (stat.isDirectory()) {
      files.push(...collectVueFiles(fullPath))
    } else if (entry.endsWith('.vue')) {
      files.push(fullPath)
    }
  }
  return files
}

function isLoginPage(filePath: string): boolean {
  return filePath.replace(/\\/g, '/').endsWith('pages/admin/login.vue')
}

describe('admin route meta', () => {
  const adminPages = collectVueFiles(ADMIN_PAGES_ROOT).filter((file) => !isLoginPage(file))

  it('every admin page except login declares admin layout and admin-auth middleware', () => {
    const missing: string[] = []

    for (const file of adminPages) {
      const source = readFileSync(file, 'utf-8')
      const hasMeta = source.includes('definePageMeta')
      const hasAdminLayout = /layout:\s*['"]admin['"]/.test(source)
      const hasMiddleware = /middleware:\s*['"]admin-auth['"]/.test(source)

      if (!hasMeta || !hasAdminLayout || !hasMiddleware) {
        missing.push(path.relative(process.cwd(), file))
      }
    }

    expect(missing).toEqual([])
  })

  it('login page does not require admin-auth middleware', () => {
    const loginSource = readFileSync(path.join(ADMIN_PAGES_ROOT, 'login.vue'), 'utf-8')
    expect(loginSource.includes("middleware: 'admin-auth'")).toBe(false)
    expect(loginSource.includes('middleware: "admin-auth"')).toBe(false)
  })
})

describe('admin API server auth coverage', () => {
  it('all admin API handlers import or rely on checkAuth', () => {
    const adminApiDir = path.resolve('server/api/admin')
    const files = readdirSync(adminApiDir).filter((file) => file.endsWith('.ts'))

    for (const file of files) {
      const source = readFileSync(path.join(adminApiDir, file), 'utf-8')
      expect(source.includes('checkAuth')).toBe(true)
    }
  })

  it('admin API middleware guards /api/admin routes', () => {
    const source = readFileSync('server/middleware/admin-api-auth.ts', 'utf-8')
    expect(source.includes("pathname.startsWith('/api/admin/')")).toBe(true)
    expect(source.includes('checkAuth(event)')).toBe(true)
  })
})

describe('module write API auth coverage', () => {
  const writeHandlers = [
    'server/api/modules/create.ts',
    'server/api/modules/uploads/index.ts',
    'server/api/modules/[moduleKey]/update.ts',
    'server/api/modules/[moduleKey]/enable.ts',
    'server/api/modules/[moduleKey]/versions/set-latest.ts',
  ]

  it('all admin-only module write handlers call checkAuth', () => {
    for (const relativePath of writeHandlers) {
      const source = readFileSync(relativePath, 'utf-8')
      expect(source.includes('checkAuth(event)')).toBe(true)
    }
  })

  it('public ratings POST does not require admin auth', () => {
    const source = readFileSync('server/api/modules/[moduleKey]/ratings/index.post.ts', 'utf-8')
    expect(source.includes('checkAuth')).toBe(false)
    expect(source.includes('assertRateLimit') || source.includes('RATE_MAX')).toBe(true)
  })
})
