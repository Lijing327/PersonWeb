import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import {
  WORK_ENTITY_CROSS_VIEWS,
  WORK_FOOTER_SECTIONS,
  WORK_HEADER_CTA,
  WORK_MORE_NAV,
  WORK_PRIMARY_NAV,
  WORK_PRIMARY_NAV_MAX,
  WORK_ROUTE_GOVERNANCE,
  WORK_WORLD_LINKS,
  assertWorkNavIntegrity,
  collectNavPaths,
  findDuplicatePaths,
} from '../../constants/work-ia'
import { STATIC_PATHS } from '../../scripts/lib/sitemap-builder.js'

describe('Work IA navigation', () => {
  it('keeps primary nav within limit and unique', () => {
    const paths = collectNavPaths(WORK_PRIMARY_NAV)
    expect(paths.length).toBeLessThanOrEqual(WORK_PRIMARY_NAV_MAX)
    expect(new Set(paths).size).toBe(paths.length)
    expect(paths).toEqual(['/work', '/projects', '/products', '/blog', '/about'])
  })

  it('does not duplicate primary paths in More or CTA', () => {
    const { duplicatesPrimaryMoreCta, moreContainsPrivate, primaryCount } = assertWorkNavIntegrity()
    expect(primaryCount).toBe(WORK_PRIMARY_NAV.length)
    expect(duplicatesPrimaryMoreCta).toEqual([])
    expect(moreContainsPrivate).toBe(false)
  })

  it('More excludes contact, dashboard, game, side-projects', () => {
    const paths = collectNavPaths(WORK_MORE_NAV)
    expect(paths).not.toContain('/contact')
    expect(paths).not.toContain('/dashboard')
    expect(paths).not.toContain('/game')
    expect(paths).not.toContain('/side-projects')
    expect(paths).toContain('/tools')
    expect(paths).toContain('/ai')
    expect(paths).toContain('/lab')
  })

  it('Footer has no duplicate paths within a section and includes world links', () => {
    for (const section of WORK_FOOTER_SECTIONS) {
      const paths = collectNavPaths(section.items)
      expect(new Set(paths).size).toBe(paths.length)
    }
    const all = WORK_FOOTER_SECTIONS.flatMap((s) => s.items)
    const paths = collectNavPaths(all)
    expect(paths).toContain(WORK_WORLD_LINKS.portal.path)
    expect(paths).toContain(WORK_WORLD_LINKS.life.path)
    expect(paths).toContain(WORK_WORLD_LINKS.work.path)
    expect(paths).toContain(WORK_HEADER_CTA.path)
  })

  it('defines MindTrace product ↔ project relationship', () => {
    const mind = WORK_ENTITY_CROSS_VIEWS.find((item) => item.id === 'mindtrace')
    expect(mind?.productPath).toBe('/products/mindtrace')
    expect(mind?.projectListBridge).toBe(true)
  })
})

describe('Work route governance', () => {
  it('redirects legacy showcase and ai-intro in source', () => {
    const showcase = readFileSync(resolve(__dirname, '../../pages/showcase.vue'), 'utf8')
    const aiIntro = readFileSync(resolve(__dirname, '../../pages/ai-intro.vue'), 'utf8')
    expect(showcase).toMatch(/redirectCode:\s*301/)
    expect(showcase).toMatch(/\/work/)
    expect(aiIntro).toMatch(/redirectCode:\s*301/)
    expect(aiIntro).toMatch(/\/ai/)
  })

  it('marks dashboard private/noindex', () => {
    const rule = WORK_ROUTE_GOVERNANCE.find((item) => item.path === '/dashboard')
    expect(rule?.action).toBe('PRIVATE')
    const src = readFileSync(resolve(__dirname, '../../pages/dashboard/index.vue'), 'utf8')
    expect(src).toMatch(/noindex/)
  })

  it('excludes private and legacy from sitemap static list', () => {
    expect(STATIC_PATHS).not.toContain('/dashboard')
    expect(STATIC_PATHS).not.toContain('/showcase')
    expect(STATIC_PATHS).not.toContain('/ai-intro')
    expect(STATIC_PATHS).toContain('/work')
    expect(STATIC_PATHS).toContain('/products/mindtrace')
  })

  it('Header and work page consume shared primary nav', () => {
    const header = readFileSync(resolve(__dirname, '../../components/layout/Header.vue'), 'utf8')
    const work = readFileSync(resolve(__dirname, '../../pages/work.vue'), 'utf8')
    expect(header).toMatch(/WORK_PRIMARY_NAV/)
    expect(work).toMatch(/WORK_PRIMARY_NAV/)
    expect(header).not.toMatch(/header-secondary-cta/)
  })
})

describe('nav path helper', () => {
  it('finds duplicates across groups', () => {
    expect(
      findDuplicatePaths([
        [{ title: 'A', path: '/a' }],
        [{ title: 'B', path: '/a' }],
      ]),
    ).toEqual(['/a'])
  })
})
