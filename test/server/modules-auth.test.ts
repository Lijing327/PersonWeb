import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'

describe('module write API auth guards', () => {
  const writeHandlers = [
    'server/api/modules/create.ts',
    'server/api/modules/uploads/index.ts',
    'server/api/modules/[moduleKey]/update.ts',
    'server/api/modules/[moduleKey]/enable.ts',
    'server/api/modules/[moduleKey]/versions/set-latest.ts',
  ]

  it('all admin-only module write handlers call checkAuth before mutating state', () => {
    for (const relativePath of writeHandlers) {
      const source = readFileSync(relativePath, 'utf-8')
      expect(source.includes('checkAuth(event)')).toBe(true)
    }
  })

  it('public ratings POST remains unauthenticated at handler level', () => {
    const source = readFileSync('server/api/modules/[moduleKey]/ratings/index.post.ts', 'utf-8')
    expect(source.includes('checkAuth')).toBe(false)
  })

  it('module list read handler does not require auth at handler level', () => {
    const source = readFileSync('server/api/modules/index.ts', 'utf-8')
    expect(source.includes('checkAuth')).toBe(false)
  })

  it('module detail read handler does not require auth at handler level', () => {
    const source = readFileSync('server/api/modules/[moduleKey]/index.ts', 'utf-8')
    expect(source.includes('checkAuth')).toBe(false)
  })
})
