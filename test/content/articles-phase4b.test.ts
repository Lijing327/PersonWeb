import { existsSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'
import {
  ARTICLE_GIT_STATUSES,
  isArticleContentSlug,
  mapDbStatusToGit,
} from '../../constants/articles-content'
import {
  buildArticlesSearchIndex,
  searchArticlesIndex,
} from '../../server/utils/articles-search-index'
import {
  listArticles,
  readArticleBySlug,
  readArticleTaxonomy,
} from '../../server/utils/content-files'
import type { ArticleContentItem } from '../../types/articlesContent'

const root = resolve(__dirname, '../..')
const readSrc = (relativePath: string) =>
  readFileSync(resolve(root, relativePath), 'utf8')

describe('Articles public visibility guards (Phase 4B-preflight)', () => {
  it('blog index uses repository with published status filter', () => {
    const src = readSrc('pages/blog/index.vue')
    expect(src).toMatch(/useArticlesRepository/)
    expect(src).toMatch(/status:\s*1/)
    expect(readSrc('composables/useArticlesRepository.ts')).toMatch(/\/Articles/)
  })

  it('home overview supports Git articles path', () => {
    const src = readSrc('server/api/home/overview.get.ts')
    expect(src).toMatch(/listAggregatedArticles|adaptArticlesToHomeCards/)
  })

  it('sitemap builder uses Git article collector', () => {
    const src = readSrc('scripts/lib/sitemap-builder.js')
    expect(src).toMatch(/collectArticlePathsFromGit/)
  })

  it('ArticlesController applies public filter for unauthenticated list/detail', () => {
    const src = readSrc('backend/PersonalSite.Api/Controllers/ArticlesController.cs')
    expect(src).toMatch(/ApplyPublicArticleFilter/)
    expect(src).toMatch(/Status == 1 && a\.ParentId == null/)
    expect(src).toMatch(/LEGACY_READONLY/)
  })

  it('SearchController filters published articles without ContentMd body search', () => {
    const src = readSrc('backend/PersonalSite.Api/Controllers/SearchController.cs')
    expect(src).toMatch(/Status == 1/)
    expect(src).not.toMatch(/ContentMd\.Contains/)
  })
})

describe('Articles Git schema constants', () => {
  it('defines git statuses and db mapping', () => {
    expect(ARTICLE_GIT_STATUSES).toEqual(['draft', 'published', 'archived'])
    expect(mapDbStatusToGit(1)).toBe('published')
    expect(mapDbStatusToGit(0)).toBe('draft')
    expect(mapDbStatusToGit(2)).toBe('archived')
  })

  it('rejects reserved article slugs', () => {
    expect(isArticleContentSlug('_taxonomy')).toBe(false)
    expect(isArticleContentSlug('hello-world')).toBe(true)
  })
})

describe('Articles content files (Phase 4B-1)', () => {
  it('requires taxonomy file under content/articles', () => {
    expect(existsSync(resolve(root, 'content/articles/_taxonomy.yml'))).toBe(true)
  })

  it('reads taxonomy categories', () => {
    const tax = readArticleTaxonomy()
    expect(tax.categories.length).toBeGreaterThan(0)
    expect(tax.categories.some((c) => c.slug === 'tech')).toBe(true)
  })

  it('listArticles reads exported Git content', () => {
    const articles = listArticles()
    expect(articles.length).toBeGreaterThan(0)
    for (const article of articles) {
      expect(article.slug).toBeTruthy()
      expect(article.legacyId).toBeGreaterThan(0)
      expect(['draft', 'published', 'archived']).toContain(article.status)
    }
    const welcome = readArticleBySlug('welcome-to-my-site')
    expect(welcome?.title).toContain('欢迎')
    expect(welcome?.legacyId).toBe(3)
  })

  it('readArticleBySlug rejects unsafe slugs', () => {
    expect(readArticleBySlug('../etc')).toBeNull()
    expect(readArticleBySlug('_taxonomy')).toBeNull()
  })
})

describe('Articles search index skeleton', () => {
  const sample: ArticleContentItem[] = [
    {
      title: 'Published Post',
      slug: 'published-post',
      status: 'published',
      legacyId: 1,
      path: '/blog/published-post',
      content: 'Nuxt and TypeScript guide',
      summary: 'A guide',
      category: 'tech',
      tags: ['nuxt'],
    },
    {
      title: 'Draft Post',
      slug: 'draft-post',
      status: 'draft',
      legacyId: 2,
      path: '/blog/draft-post',
      content: 'secret draft',
    },
  ]

  it('indexes only published non-takedown articles', () => {
    const ops = new Map([['published-post', { takedown: false }]])
    const index = buildArticlesSearchIndex(sample, ops)
    expect(index).toHaveLength(1)
    expect(index[0].slug).toBe('published-post')
  })

  it('excludes takedown overrides', () => {
    const ops = new Map([['published-post', { takedown: true }]])
    const index = buildArticlesSearchIndex(sample, ops)
    expect(index).toHaveLength(0)
  })

  it('searches index in-memory', () => {
    const index = buildArticlesSearchIndex(sample)
    const hits = searchArticlesIndex(index, 'nuxt')
    expect(hits[0]?.slug).toBe('published-post')
  })
})

describe('Migration scripts exist', () => {
  it('includes audit, export, verify scripts', () => {
    for (const file of [
      'scripts/migrate/audit-articles-db.js',
      'scripts/migrate/export-articles-to-content.js',
      'scripts/migrate/verify-articles-export.js',
      'database/content_ops.sql',
    ]) {
      expect(existsSync(resolve(root, file))).toBe(true)
    }
  })
})
