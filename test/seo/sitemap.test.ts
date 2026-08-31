import { describe, expect, it } from 'vitest'
import {
  canonicalizePath,
  isPublicIndexablePath,
  uniqPaths,
  buildSitemapXml,
  STATIC_PATHS,
} from '../../scripts/lib/sitemap-builder.js'

describe('sitemap builder', () => {
  it('excludes admin and api paths', () => {
    const paths = uniqPaths([
      ...STATIC_PATHS,
      '/admin/login',
      '/api/Articles',
      '/dashboard',
      '/blog/real-post',
    ])

    expect(paths.some((p) => p.startsWith('/admin'))).toBe(false)
    expect(paths.some((p) => p.startsWith('/api'))).toBe(false)
    expect(paths).toContain('/blog/real-post')
    expect(paths).toContain('/work')
  })

  it('canonicalizes legacy tools detail routes', () => {
    expect(canonicalizePath('/tools/detail-foo')).toBe('/tools/foo')
    expect(canonicalizePath('/projects/detail-old')).toBe('/projects')
  })

  it('deduplicates URLs', () => {
    const { paths } = buildSitemapXml('https://xifg.com.cn', [
      '/blog/a',
      '/blog/a/',
      '/blog/a',
    ])
    expect(paths.filter((p) => p.startsWith('/blog/a')).length).toBe(1)
  })

  it('includes at least one dynamic URL when provided', () => {
    const { xml, paths } = buildSitemapXml('https://xifg.com.cn', [
      ...STATIC_PATHS,
      '/projects/11111111-1111-1111-1111-111111111111',
    ])
    expect(paths).toContain('/projects/11111111-1111-1111-1111-111111111111')
    expect(xml).toContain('https://xifg.com.cn/projects/11111111-1111-1111-1111-111111111111')
    expect(xml).not.toContain('/admin/')
    expect(xml).not.toContain('/api/')
  })

  it('marks private paths as non-indexable', () => {
    expect(isPublicIndexablePath('/order/create')).toBe(false)
    expect(isPublicIndexablePath('/payment/cancel')).toBe(false)
  })
})
