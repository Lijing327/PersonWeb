import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

describe('admin noindex source', () => {
  it('admin layout sets robots noindex,nofollow', () => {
    const src = readFileSync(resolve(__dirname, '../../layouts/admin.vue'), 'utf8')
    expect(src).toMatch(/noindex\s*,?\s*nofollow/i)
  })

  it('admin-content-only layout sets robots noindex,nofollow', () => {
    const src = readFileSync(resolve(__dirname, '../../layouts/admin-content-only.vue'), 'utf8')
    expect(src).toMatch(/noindex\s*,?\s*nofollow/i)
  })
})

describe('duplicate detail route canonical strategy', () => {
  it('projects detail-[slug] permanently redirects', () => {
    const src = readFileSync(resolve(__dirname, '../../pages/projects/detail-[slug].vue'), 'utf8')
    expect(src).toMatch(/redirectCode:\s*301/)
    expect(src).toMatch(/\/projects/)
  })

  it('tools detail-[slug] permanently redirects to /tools/:slug', () => {
    const src = readFileSync(resolve(__dirname, '../../pages/tools/detail-[slug].vue'), 'utf8')
    expect(src).toMatch(/redirectCode:\s*301/)
    expect(src).toMatch(/`\/tools\/\$\{slug\}`/)
  })
})

describe('dynamic detail SSR + hard 404', () => {
  const pages = [
    'pages/blog/[id].vue',
    'pages/projects/[id].vue',
    'pages/tools/[slug].vue',
    'pages/cognition/[slug].vue',
  ]

  it.each(pages)('%s uses useAsyncData and createError 404', (file) => {
    const src = readFileSync(resolve(__dirname, '../..', file), 'utf8')
    expect(src).toMatch(/useAsyncData/)
    expect(src).toMatch(/createError\(\{\s*statusCode:\s*404/)
    expect(src).not.toMatch(/onMounted\(\s*async\s*\(\)\s*=>\s*\{[\s\S]*fetchBackendApi/)
  })
})

describe('error.vue', () => {
  it('exists and sets noindex without exposing stack', () => {
    const src = readFileSync(resolve(__dirname, '../../error.vue'), 'utf8')
    expect(src).toMatch(/noIndex:\s*true/)
    expect(src).not.toMatch(/error\.stack/)
    expect(src).not.toMatch(/error\.message/)
    expect(src).toMatch(/resolveErrorWorld/)
  })
})

describe('robots.txt', () => {
  it('disallows admin and api and points to sitemap', () => {
    const src = readFileSync(resolve(__dirname, '../../public/robots.txt'), 'utf8')
    expect(src).toMatch(/Disallow:\s*\/admin\//)
    expect(src).toMatch(/Disallow:\s*\/api\//)
    expect(src).toMatch(/Sitemap:\s*https:\/\/xifg\.com\.cn\/sitemap\.xml/)
  })
})
