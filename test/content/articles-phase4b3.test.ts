import { existsSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'
import {
  collectArticlePathsFromGit,
  diffArticleSitemapPaths,
} from '../../scripts/lib/sitemap-builder.js'
import { isEffectivePublished } from '../../types/articlesAggregate'
import { listArticles } from '../../server/utils/content-files'

const root = resolve(__dirname, '../..')
const readSrc = (relativePath: string) =>
  readFileSync(resolve(root, relativePath), 'utf8')

describe('Phase 4B-3 Articles Git SoT cutover guards', () => {
  it('defaults articlesSot to git', () => {
    const src = readSrc('nuxt.config.ts')
    expect(src).toMatch(/articlesSot[\s\S]*\|\|\s*'git'/)
    expect(readSrc('composables/useArticlesRepository.ts')).toMatch(/LEGACY_ROLLBACK_ONLY|mysql/)
  })

  it('home overview uses Git articles aggregate by default', () => {
    const src = readSrc('server/api/home/overview.get.ts')
    expect(src).toMatch(/listAggregatedArticles|adaptArticlesToHomeCards/)
    expect(src).toMatch(/articlesSot/)
  })

  it('sitemap collects articles from Git not MySQL Articles API', () => {
    const src = readSrc('scripts/lib/sitemap-builder.js')
    expect(src).toMatch(/collectArticlePathsFromGit/)
    expect(src).not.toMatch(/\/Articles\?page=/)
  })

  it('public search page uses Nitro /api/search', () => {
    expect(readSrc('pages/search.vue')).toMatch(/\/api\/search/)
    expect(readSrc('pages/search.vue')).not.toMatch(/api\.get<SearchResults>\('\/Search'/)
    expect(existsSync(resolve(root, 'server/api/search.get.ts'))).toBe(true)
  })

  it('SearchController no longer reads ContentMd for article body', () => {
    const src = readSrc('backend/PersonalSite.Api/Controllers/SearchController.cs')
    expect(src).not.toMatch(/a\.ContentMd != null && a\.ContentMd\.Contains/)
    expect(src).toMatch(/LEGACY|Git/)
  })

  it('POST SaveArticle is forbidden / obsolete', () => {
    const src = readSrc('backend/PersonalSite.Api/Controllers/ArticlesController.cs')
    expect(src).toMatch(/Obsolete/)
    expect(src).toMatch(/403/)
    expect(src).toMatch(/Git SoT/)
  })

  it('restore remains forbidden', () => {
    const src = readSrc('backend/PersonalSite.Api/Controllers/ArticlesController.cs')
    expect(src).toMatch(/LEGACY_READONLY/)
    expect(src).toMatch(/版本恢复已退役/)
  })

  it('ContentAgentService does not write Article ContentMd', () => {
    const src = readSrc('backend/PersonalSite.Api/Services/ContentAgentService.cs')
    expect(src).toMatch(/Skip SaveDraftAsync/)
    expect(src).not.toMatch(/ContentMd = result\.Content\.Body/)
  })

  it('AI uses Articles catalog not DB body', () => {
    expect(readSrc('backend/PersonalSite.Api/Controllers/AIController.cs')).toMatch(/IArticlesCatalogService|_articlesCatalog/)
    expect(existsSync(resolve(root, 'content/articles/_catalog.json'))).toBe(true)
    expect(existsSync(resolve(root, 'backend/PersonalSite.Api/Services/ArticlesCatalogService.cs'))).toBe(true)
  })

  it('blog pages go through repository only', () => {
    expect(readSrc('pages/blog/index.vue')).toMatch(/useArticlesRepository/)
    expect(readSrc('pages/blog/[id].vue')).toMatch(/useArticlesRepository/)
    expect(readSrc('pages/blog/index.vue')).not.toMatch(/\/Articles/)
  })

  it('effectivePublished rules remain strict', () => {
    expect(isEffectivePublished('published', false)).toBe(true)
    expect(isEffectivePublished('published', true)).toBe(false)
    expect(isEffectivePublished('draft', false)).toBe(false)
  })

  it('sitemap Git paths are slug-only published (~50)', () => {
    const paths = collectArticlePathsFromGit(resolve(root, 'content/articles'))
    expect(paths.length).toBe(50)
    expect(paths.every((p: string) => /^\/blog\/[a-z0-9-]+$/i.test(p))).toBe(true)
    expect(paths.every((p: string) => !/\/blog\/\d+$/.test(p))).toBe(true)
    const diff = diffArticleSitemapPaths(paths, paths)
    expect(diff.equal).toBe(true)
  })

  it('legacyId 75 decision recorded as abandoned', () => {
    const doc = readSrc('migration/legacy-article-75.md')
    expect(doc).toMatch(/abandoned/i)
    expect(listArticles().every((a) => a.legacyId !== 75)).toBe(true)
  })

  it('Article model marked LEGACY_READONLY for body fields', () => {
    expect(readSrc('backend/PersonalSite.Api/Models/Article.cs')).toMatch(/LEGACY_READONLY/)
  })
})
