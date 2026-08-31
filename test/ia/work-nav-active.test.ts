import { describe, expect, it } from 'vitest'
import { WORK_PRIMARY_NAV } from '../../constants/work-ia'
import {
  isWorkNavActive,
  resolveActiveWorkNavPath,
} from '../../utils/work-nav-active'

describe('Work nav active matcher', () => {
  const paths = WORK_PRIMARY_NAV.map((item) => item.path)

  function activesOn(route: string) {
    return paths.filter((path) => isWorkNavActive(route, path))
  }

  it('marks only 首页 on /work', () => {
    expect(activesOn('/work')).toEqual(['/work'])
    expect(resolveActiveWorkNavPath('/work', WORK_PRIMARY_NAV)).toBe('/work')
  })

  it('does not treat / as Work home', () => {
    expect(isWorkNavActive('/', '/work')).toBe(false)
    expect(activesOn('/')).toEqual([])
  })

  it('marks only 案例 on /projects and /projects/:id', () => {
    expect(activesOn('/projects')).toEqual(['/projects'])
    expect(activesOn('/projects/123')).toEqual(['/projects'])
    expect(isWorkNavActive('/projects/123', '/work')).toBe(false)
  })

  it('marks only 产品 on product detail', () => {
    expect(activesOn('/products/mindtrace')).toEqual(['/products'])
  })

  it('marks only 文章 on blog detail', () => {
    expect(activesOn('/blog/test')).toEqual(['/blog'])
  })

  it('marks only 关于 on /about, not Life about', () => {
    expect(activesOn('/about')).toEqual(['/about'])
    expect(isWorkNavActive('/life/about', '/about')).toBe(false)
    expect(activesOn('/life/about')).toEqual([])
  })

  it('never activates home via startsWith("/work") for nested paths', () => {
    expect(isWorkNavActive('/work/extra', '/work')).toBe(false)
  })

  it('Header source uses shared matcher for desktop and mobile', () => {
    const src = require('node:fs').readFileSync(
      require('node:path').resolve(__dirname, '../../components/layout/Header.vue'),
      'utf8',
    )
    expect(src).toMatch(/isWorkNavActive/)
    expect(src).toMatch(/isActiveRoute\(item\.path\)/)
    expect(src).toMatch(/aria-current/)
    // single helper — desktop + mobile both call isActiveRoute
    expect(src.match(/isActiveRoute\(item\.path\)/g)?.length).toBeGreaterThanOrEqual(2)
  })
})
