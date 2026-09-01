import { existsSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'
import { adminMenu, adminMenuPaths } from '../../constants/admin/menu'

const root = resolve(__dirname, '../..')

const readSrc = (relativePath: string) =>
  readFileSync(resolve(root, relativePath), 'utf8')

const adminPagesRoot = resolve(root, 'pages/admin')

const collectVueFiles = (dir: string): string[] => {
  if (!existsSync(dir)) return []
  const entries = require('node:fs').readdirSync(dir, { withFileTypes: true })
  return entries.flatMap((entry: { isDirectory: () => boolean, name: string }) => {
    const full = resolve(dir, entry.name)
    if (entry.isDirectory()) return collectVueFiles(full)
    if (entry.name.endsWith('.vue')) return [full]
    return []
  })
}

describe('Admin operations console guards (Phase 3)', () => {
  it('does not ship legacy CMS edit routes', () => {
    expect(existsSync(resolve(adminPagesRoot, 'articles/edit/index.vue'))).toBe(false)
    expect(existsSync(resolve(adminPagesRoot, 'articles/edit/[id].vue'))).toBe(false)
    expect(existsSync(resolve(adminPagesRoot, 'projects/edit/[[id]].vue'))).toBe(false)
  })

  it('does not ship Nitro plugin module CMS pages', () => {
    expect(existsSync(resolve(adminPagesRoot, 'modules/index.vue'))).toBe(false)
    expect(existsSync(resolve(adminPagesRoot, 'modules/upload.vue'))).toBe(false)
  })

  it('does not ship markdown CMS editor components', () => {
    expect(existsSync(resolve(root, 'components/admin/MarkdownEditor.vue'))).toBe(false)
    expect(existsSync(resolve(root, 'components/admin/SimpleMarkdownEditor.vue'))).toBe(false)
  })

  it('articles ops page has no edit route or new-article CMS entry', () => {
    const src = readSrc('pages/admin/articles/index.vue')
    expect(src).toMatch(/文章运营/)
    expect(src).not.toMatch(/articles\/edit/)
    expect(src).not.toMatch(/新增文章/)
    expect(src).not.toMatch(/SimpleMarkdownEditor/)
  })

  it('projects ops page has no edit route or AI body save', () => {
    const src = readSrc('pages/admin/projects/index.vue')
    expect(src).toMatch(/项目运营/)
    expect(src).not.toMatch(/projects\/edit/)
    expect(src).not.toMatch(/新建项目/)
    expect(src).not.toMatch(/\/ai\/demo\/describe/)
  })

  it('ai content preview does not POST Articles CMS payload', () => {
    const src = readSrc('pages/admin/ai/content.vue')
    expect(src).not.toMatch(/POST.*Articles|api\.post\(['"]\/Articles/)
    expect(src).not.toMatch(/articles\/edit/)
    expect(src).toMatch(/复制 Markdown/)
  })

  it('admin menu does not reference deleted CMS routes', () => {
    const menuSrc = readSrc('constants/admin/menu.ts')
    expect(menuSrc).not.toMatch(/articles\/edit/)
    expect(menuSrc).not.toMatch(/projects\/edit/)
    expect(menuSrc).not.toMatch(/\/admin\/modules/)
    expect(menuSrc).not.toMatch(/AI 内容/)
  })

  it('menu paths map to existing admin pages (no orphan menu entries)', () => {
    const vueFiles = collectVueFiles(adminPagesRoot)
    const pagePaths = new Set(
      vueFiles.map((file) => {
        const rel = file.replace(/\\/g, '/').split('pages/admin/')[1]?.replace(/\.vue$/, '') || ''
        if (rel === 'index') return '/admin'
        if (rel.endsWith('/index')) return `/admin/${rel.replace(/\/index$/, '')}`
        return `/admin/${rel}`
      }),
    )

    for (const path of adminMenuPaths) {
      const hasExact = pagePaths.has(path)
      const hasChild = [...pagePaths].some(p => p.startsWith(`${path}/`))
      expect(hasExact || hasChild, `menu path missing page: ${path}`).toBe(true)
    }
  })

  it('content-hub does not deep-link to CMS edit routes', () => {
    const src = readSrc('pages/admin/content-hub.vue')
    expect(src).not.toMatch(/articles\/edit/)
    expect(src).not.toMatch(/projects\/edit/)
    expect(src).toMatch(/content\/work/)
  })

  it('preserves work/life content SoT outside admin CMS', () => {
    expect(existsSync(resolve(root, 'content/work/home.yml'))).toBe(true)
    expect(existsSync(resolve(root, 'content/life/home.yml'))).toBe(true)
    const hub = readSrc('pages/admin/content-hub.vue')
    expect(hub).not.toMatch(/readWorkHome|edit.*about/i)
  })

  it('admin layout does not wrap page shell in ClientOnly', () => {
    const src = readSrc('layouts/admin.vue')
    const mainShell = src.match(/admin-main-scroll">([\s\S]*?)<\/div>\s*<\/main>/)?.[1] ?? ''
    expect(mainShell).toMatch(/admin-page-shell/)
    expect(mainShell).not.toMatch(/ClientOnly/)
  })

  it('admin pages do not disable SSR (avoids blank main content)', () => {
    const vueFiles = collectVueFiles(adminPagesRoot)
    const offenders: string[] = []
    for (const file of vueFiles) {
      const src = readFileSync(file, 'utf8')
      if (/ssr:\s*false/.test(src)) {
        offenders.push(path.relative(root, file))
      }
    }
    expect(offenders).toEqual([])
  })
})

describe('Admin menu structure', () => {
  it('uses operations-first groups', () => {
    const labels = adminMenu.map(g => g.label)
    expect(labels[0]).toBe('Dashboard')
    expect(labels).toContain('Analytics')
    expect(labels).toContain('Content Ops')
    expect(labels).toContain('System')
  })
})

describe('Admin legacy cleanup guards (Phase 3.1)', () => {
  it('removes toolbox dead stub index page', () => {
    expect(existsSync(resolve(adminPagesRoot, 'toolbox/index.vue'))).toBe(false)
  })

  it('keeps toolbox analytics as child route only', () => {
    expect(existsSync(resolve(adminPagesRoot, 'toolbox/[id]/analytics.vue'))).toBe(true)
    const tools = readSrc('pages/admin/tools.vue')
    expect(tools).toMatch(/\/admin\/toolbox\/\$\{tool\.id\}\/analytics/)
    expect(tools).not.toMatch(/to="\/admin\/toolbox"/)
  })

  it('has single orders entry in menu', () => {
    const orderPaths = adminMenuPaths.filter(p => p.includes('order'))
    expect(orderPaths).toEqual(['/admin/orders'])
    expect(existsSync(resolve(adminPagesRoot, 'commercial/orders.vue'))).toBe(false)
    expect(existsSync(resolve(adminPagesRoot, 'orders.vue'))).toBe(true)
  })

  it('ModuleCard settings points to real module config hub', () => {
    const src = readSrc('components/ModuleCard.vue')
    expect(src).toMatch(/\/admin\/settings\/modules/)
    expect(src).not.toMatch(/\/admin\/modules\//)
  })

  it('admin sources do not link to dead toolbox index or duplicate orders', () => {
    const sources = [
      'constants/admin/menu.ts',
      'pages/admin/content-hub.vue',
      'pages/admin/index.vue',
      'components/ModuleCard.vue',
    ]
    for (const file of sources) {
      const src = readSrc(file)
      expect(src, file).not.toMatch(/\/admin\/toolbox['"`]/)
      expect(src, file).not.toMatch(/commercial\/orders/)
    }
  })

  it('toolbox analytics back link returns to tools hub', () => {
    const src = readSrc('pages/admin/toolbox/[id]/analytics.vue')
    expect(src).toMatch(/to="\/admin\/tools"/)
    expect(src).not.toMatch(/to="\/admin\/toolbox"/)
  })
})
