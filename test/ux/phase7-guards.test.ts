import { existsSync, readFileSync, statSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'
import {
  isWorkAmbientRoute,
  isWorkContentFocusRoute,
  shouldShowWorkDeferredChrome,
  shouldShowWorkParticleLayer,
} from '../../utils/work-layout-effects'

const root = resolve(__dirname, '../..')

describe('Phase 7 UX / performance guards', () => {
  it('contact uses default layout; home layout is removed', () => {
    expect(existsSync(resolve(root, 'layouts/home.vue'))).toBe(false)
    const contact = readFileSync(resolve(root, 'pages/contact.vue'), 'utf8')
    expect(contact).toMatch(/layout:\s*['"]default['"]/)
    expect(contact).not.toMatch(/layout:\s*['"]home['"]/)
  })

  it('Life does not load blocking Google Fonts stylesheet', () => {
    const lifeLayout = readFileSync(resolve(root, 'layouts/life.vue'), 'utf8')
    expect(lifeLayout).not.toMatch(/fonts\.googleapis\.com/)
    expect(lifeLayout).not.toMatch(/fonts\.gstatic\.com/)
  })

  it('global focus-visible and reduced-motion baselines exist', () => {
    const mainCss = readFileSync(resolve(root, 'assets/css/main.css'), 'utf8')
    expect(mainCss).toMatch(/:focus-visible/)
    expect(mainCss).toMatch(/prefers-reduced-motion:\s*reduce/)
    // reduced-motion must not be nested only under mobile max-width
    const reduceIdx = mainCss.indexOf('prefers-reduced-motion')
    const mobileBlock = mainCss.indexOf('@media (max-width: 768px)')
    expect(reduceIdx).toBeGreaterThan(-1)
    // Prefer global rule after mobile block (Phase 7 moved it out)
    expect(reduceIdx).toBeGreaterThan(mobileBlock)
  })

  it('Header / Footer icon-only controls expose aria-label', () => {
    const header = readFileSync(resolve(root, 'components/layout/Header.vue'), 'utf8')
    const footer = readFileSync(resolve(root, 'components/layout/Footer.vue'), 'utf8')
    expect(header).toMatch(/aria-label="搜索站点内容"/)
    expect(header).toMatch(/aria-label="打开或关闭菜单"/)
    expect(footer).toMatch(/aria-label="GitHub/)
    expect(footer).toMatch(/aria-label="显示微信二维码"/)
    expect(footer).toMatch(/aria-label="关闭微信二维码"/)
    expect(footer).toMatch(/rel="noopener noreferrer"/)
  })

  it('optimized content images exist and are smaller than legacy sources', () => {
    const thermalWebp = resolve(root, 'public/images/blog/thermal-circulation.webp')
    const thermalPng = resolve(root, 'public/images/blog/thermal-circulation.png')
    const avatarWebp = resolve(root, 'public/images/avatar.webp')
    const heroWebp = resolve(root, 'public/images/life/hero-desk.webp')
    expect(existsSync(thermalWebp)).toBe(true)
    expect(existsSync(avatarWebp)).toBe(true)
    expect(existsSync(heroWebp)).toBe(true)
    expect(statSync(thermalWebp).size).toBeLessThan(80 * 1024)
    expect(statSync(thermalWebp).size).toBeLessThan(statSync(thermalPng).size)
  })

  it('ACTIVE pages prefer webp for avatar / life hero', () => {
    const about = readFileSync(resolve(root, 'pages/about.vue'), 'utf8')
    const lifeHome = readFileSync(resolve(root, 'pages/life/index.vue'), 'utf8')
    expect(about).toMatch(/avatar\.webp/)
    expect(lifeHome).toMatch(/hero-desk\.webp/)
  })

  it('Work heavy effects are route-gated', () => {
    expect(isWorkContentFocusRoute('/blog/hello')).toBe(true)
    expect(isWorkContentFocusRoute('/projects/finance-assistant')).toBe(true)
    expect(isWorkContentFocusRoute('/tools/foo')).toBe(true)
    expect(isWorkContentFocusRoute('/work')).toBe(false)
    expect(isWorkAmbientRoute('/work')).toBe(true)
    expect(isWorkAmbientRoute('/blog')).toBe(false)

    const opts = { deferred: true, lowPower: false }
    expect(shouldShowWorkParticleLayer('/work', opts)).toBe(true)
    expect(shouldShowWorkParticleLayer('/blog/x', opts)).toBe(false)
    expect(shouldShowWorkParticleLayer('/projects', opts)).toBe(false)
    expect(shouldShowWorkDeferredChrome('/blog/x', opts)).toBe(false)
    expect(shouldShowWorkDeferredChrome('/projects', opts)).toBe(true)
  })

  it('breakpoint tokens are documented in tokens.css', () => {
    const tokens = readFileSync(resolve(root, 'assets/styles/tokens.css'), 'utf8')
    expect(tokens).toMatch(/--bp-md:\s*768px/)
    expect(tokens).toMatch(/--bp-lg:\s*900px/)
  })

  it('html lang is zh-CN', () => {
    const nuxt = readFileSync(resolve(root, 'nuxt.config.ts'), 'utf8')
    expect(nuxt).toMatch(/lang:\s*['"]zh-CN['"]/)
  })
})
