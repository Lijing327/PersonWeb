import { existsSync, readdirSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'
import { WORK_MORE_NAV, WORK_PRIMARY_NAV } from '../../constants/work-ia'
import { collectNavPaths } from '../../constants/work-ia'

const root = resolve(__dirname, '../..')

describe('legacy / dead-code guards (Phase 6)', () => {
  it('does not resurrect deleted legacy home tree', () => {
    expect(existsSync(resolve(root, 'components/home'))).toBe(false)
    expect(existsSync(resolve(root, 'assets/css/home.css'))).toBe(false)
    expect(existsSync(resolve(root, 'assets/css/hero.css'))).toBe(false)
    expect(existsSync(resolve(root, 'assets/css/home-creative.css'))).toBe(false)
  })

  it('does not resurrect Work markdown content dirs or orphan content APIs', () => {
    expect(existsSync(resolve(root, 'content/projects'))).toBe(false)
    expect(existsSync(resolve(root, 'content/blog'))).toBe(false)
    expect(existsSync(resolve(root, 'content/tools'))).toBe(false)
    expect(existsSync(resolve(root, 'server/api/content/projects.get.ts'))).toBe(false)
    expect(existsSync(resolve(root, 'server/api/content/tools.get.ts'))).toBe(false)
    expect(existsSync(resolve(root, 'server/api/content/tools-search.get.ts'))).toBe(false)
  })

  it('keeps Life content and does not delete cognition content', () => {
    expect(existsSync(resolve(root, 'content/life'))).toBe(true)
    expect(existsSync(resolve(root, 'content/cognition'))).toBe(true)
  })

  it('does not resurrect retired Nitro admin markdown / orphan APIs', () => {
    for (const name of ['articles', 'projects', 'tools', 'stats', 'config', 'metrics', 'categories']) {
      expect(existsSync(resolve(root, `server/api/admin/${name}.ts`))).toBe(false)
    }
    expect(existsSync(resolve(root, 'server/api/projects.ts'))).toBe(false)
    expect(existsSync(resolve(root, 'server/api/views/index.get.ts'))).toBe(false)
    expect(existsSync(resolve(root, 'server/api/views/index.post.ts'))).toBe(false)
    expect(existsSync(resolve(root, 'pages/admin/edit.vue'))).toBe(false)
    expect(existsSync(resolve(root, 'pages/admin/theme-settings.vue'))).toBe(false)
    expect(existsSync(resolve(root, 'pages/admin/themes.vue'))).toBe(false)
    expect(existsSync(resolve(root, 'pages/admin/commercial/memberships.vue'))).toBe(false)
    expect(existsSync(resolve(root, 'server/api/github/stats.ts'))).toBe(false)
  })

  it('does not resurrect unused module-check middleware', () => {
    expect(existsSync(resolve(root, 'middleware/module-check.ts'))).toBe(false)
  })

  it('navigation does not include legacy showcase / ai-intro / dashboard', () => {
    const paths = [
      ...collectNavPaths(WORK_PRIMARY_NAV),
      ...collectNavPaths(WORK_MORE_NAV),
    ]
    expect(paths).not.toContain('/showcase')
    expect(paths).not.toContain('/ai-intro')
    expect(paths).not.toContain('/dashboard')
  })

  it('does not resurrect deleted home layout after Contact migration', () => {
    expect(existsSync(resolve(root, 'layouts/home.vue'))).toBe(false)
  })
})
