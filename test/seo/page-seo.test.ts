import { describe, expect, it } from 'vitest'
import {
  resolvePageSeo,
  toAbsoluteUrlWithSite,
  toAbsoluteImageUrlWithSite,
  isPublicIndexablePath,
  normalizeSiteUrl,
} from '../../utils/page-seo'
import { SITE } from '../../constants/site'
import { resolveErrorWorld } from '../../utils/error-world'

describe('page SEO helpers', () => {
  const site = 'https://xifg.com.cn'

  it('normalizes siteUrl without trailing slash', () => {
    expect(normalizeSiteUrl('https://xifg.com.cn/')).toBe('https://xifg.com.cn')
  })

  it('builds absolute canonical and OG URLs', () => {
    const seo = resolvePageSeo(site, {
      title: '博客 - 溪午听风',
      description: '技术文章',
      path: '/blog',
      world: 'work',
    })

    expect(seo.canonical).toBe('https://xifg.com.cn/blog')
    expect(seo.ogUrl).toBe('https://xifg.com.cn/blog')
    expect(seo.image).toBe(`https://xifg.com.cn${SITE.defaultOgImage}`)
    expect(seo.robots).toBe('index,follow')
  })

  it('uses default OG image when cover missing (no fake URL)', () => {
    expect(toAbsoluteImageUrlWithSite(site, null)).toBe(`https://xifg.com.cn${SITE.defaultOgImage}`)
    expect(toAbsoluteImageUrlWithSite(site, undefined)).toBe(`https://xifg.com.cn${SITE.defaultOgImage}`)
  })

  it('keeps absolute image URLs as-is', () => {
    expect(toAbsoluteImageUrlWithSite(site, 'https://cdn.example.com/a.png')).toBe(
      'https://cdn.example.com/a.png',
    )
  })

  it('applies life world default OG image when no image provided', () => {
    const seo = resolvePageSeo(site, {
      title: 'Life',
      description: 'life desc',
      path: '/life',
      world: 'life',
    })
    expect(seo.image).toBe('https://xifg.com.cn/images/life/hero-desk.webp')
  })

  it('sets noindex robots when requested', () => {
    const seo = resolvePageSeo(site, {
      title: 'Admin',
      description: 'private',
      path: '/admin',
      noIndex: true,
    })
    expect(seo.robots).toBe('noindex, nofollow')
  })

  it('toAbsoluteUrl joins path correctly', () => {
    expect(toAbsoluteUrlWithSite(site, '/projects/abc')).toBe('https://xifg.com.cn/projects/abc')
    expect(toAbsoluteUrlWithSite(site, 'https://xifg.com.cn/x')).toBe('https://xifg.com.cn/x')
  })

  it('excludes admin/api/dashboard from public indexable paths', () => {
    expect(isPublicIndexablePath('/admin')).toBe(false)
    expect(isPublicIndexablePath('/admin/login')).toBe(false)
    expect(isPublicIndexablePath('/api/Articles')).toBe(false)
    expect(isPublicIndexablePath('/dashboard')).toBe(false)
    expect(isPublicIndexablePath('/blog/hello')).toBe(true)
  })
})

describe('error world routing', () => {
  it('maps paths to portal/work/life/admin', () => {
    expect(resolveErrorWorld('/')).toBe('portal')
    expect(resolveErrorWorld('/work')).toBe('work')
    expect(resolveErrorWorld('/blog/x')).toBe('work')
    expect(resolveErrorWorld('/life')).toBe('life')
    expect(resolveErrorWorld('/life/notes')).toBe('life')
    expect(resolveErrorWorld('/admin')).toBe('admin')
    expect(resolveErrorWorld('/admin/articles')).toBe('admin')
  })
})
