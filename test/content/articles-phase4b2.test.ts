import { existsSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'
import {
  isEffectivePublished,
  toAggregatedArticle,
  toBlogArticleDto,
} from '../../types/articlesAggregate'
import { adaptArticlesToHomeCards } from '../../server/utils/home-articles-adapter'
import {
  buildArticlesSearchIndex,
  searchArticlesIndex,
} from '../../server/utils/articles-search-index'
import { listArticles, readArticleBySlug } from '../../server/utils/content-files'
import {
  collectArticlePathsFromGit,
  diffArticleSitemapPaths,
} from '../../scripts/lib/sitemap-builder.js'
import type { ArticleContentItem } from '../../types/articlesContent'
import type { BlogArticleDto } from '../../types/articlesAggregate'

const root = resolve(__dirname, '../..')
const readSrc = (relativePath: string) =>
  readFileSync(resolve(root, relativePath), 'utf8')

const sampleContent = (overrides: Partial<ArticleContentItem> = {}): ArticleContentItem => ({
  title: 'Hello',
  slug: 'hello',
  status: 'published',
  legacyId: 3,
  path: '/blog/hello',
  content: '# Hello\n\nBody',
  summary: 'Sum',
  category: 'tech',
  tags: ['nuxt'],
  ...overrides,
})

describe('Phase 4B-2 effectivePublished guards', () => {
  it('published + !takedown is public', () => {
    expect(isEffectivePublished('published', false)).toBe(true)
  })

  it('draft / archived / takedown are not public', () => {
    expect(isEffectivePublished('draft', false)).toBe(false)
    expect(isEffectivePublished('archived', false)).toBe(false)
    expect(isEffectivePublished('published', true)).toBe(false)
  })

  it('aggregated DTO does not expose DB content_md field name as source', () => {
    const agg = toAggregatedArticle(sampleContent(), {
      entityType: 'article',
      slug: 'hello',
      legacyId: '3',
      viewCount: 12,
      featured: false,
      sortOrder: null,
      takedown: false,
      sourceType: 'manual',
      contentHash: 'abc',
      syncedAt: null,
    }, '技术博客')
    expect(agg.effectivePublished).toBe(true)
    expect(agg.viewCount).toBe(12)
    expect(agg.body).toContain('Body')
    const dto = toBlogArticleDto(agg)
    expect(dto.contentMd).toBe(agg.body)
    expect(dto.canonicalUrl).toBe('/blog/hello')
    expect(dto.categoryName).toBe('技术博客')
  })
})

describe('Phase 4B-2 Blog cutover wiring', () => {
  it('blog pages use useArticlesRepository (central SoT)', () => {
    expect(readSrc('pages/blog/index.vue')).toMatch(/useArticlesRepository/)
    expect(readSrc('pages/blog/[id].vue')).toMatch(/useArticlesRepository/)
    expect(readSrc('pages/blog/[id].vue')).toMatch(/recordArticleView/)
    expect(readSrc('pages/blog/index.vue')).not.toMatch(/api\.get.*\/Articles/)
  })

  it('feature flag lives in nuxt runtimeConfig + repository', () => {
    expect(readSrc('nuxt.config.ts')).toMatch(/articlesSot/)
    expect(readSrc('composables/useArticlesRepository.ts')).toMatch(/CONTENT_ARTICLES_SOT|articlesSot/)
    expect(readSrc('composables/useArticlesRepository.ts')).toMatch(/mysql|git/)
  })

  it('Nitro article APIs exist', () => {
    for (const file of [
      'server/api/content/articles/index.get.ts',
      'server/api/content/articles/[slug].get.ts',
      'server/api/content/articles/[slug]/view.post.ts',
      'server/api/content/articles/by-legacy/[id].get.ts',
    ]) {
      expect(existsSync(resolve(root, file))).toBe(true)
    }
  })
})

describe('Phase 4B-2 Git content integrity', () => {
  it('filename === slug and legacyId unique for exported articles', () => {
    const articles = listArticles()
    expect(articles.length).toBe(51)
    const slugs = new Set<string>()
    const ids = new Set<number>()
    for (const a of articles) {
      expect(a.slug).toBeTruthy()
      expect(slugs.has(a.slug)).toBe(false)
      slugs.add(a.slug)
      expect(ids.has(a.legacyId)).toBe(false)
      ids.add(a.legacyId)
      expect(a.legacyId).not.toBe(75)
    }
  })

  it('welcome article readable without MySQL body', () => {
    const article = readArticleBySlug('welcome-to-my-site')
    expect(article?.title).toBeTruthy()
    expect(article?.content.length).toBeGreaterThan(0)
    expect(article?.legacyId).toBe(3)
  })
})

describe('Phase 4B-2 home adapter (not cut over)', () => {
  it('featured uses viewCount DESC', () => {
    const list: BlogArticleDto[] = [
      {
        id: 1, title: 'A', slug: 'a', summary: null, description: null,
        contentMd: '', content: '', body: '', coverUrl: null, categoryId: null,
        categoryName: 'tech', category: { name: 'tech' }, status: 1, tags: [],
        publishTime: '2026-01-01', createdAt: '2026-01-01', updatedAt: '2026-01-01',
        viewCount: 1, authorId: null, sourceType: null, featured: false,
        sortOrder: null, takedown: false, effectivePublished: true,
        canonicalUrl: '/blog/a', seoTitle: null, seoDescription: null,
      },
      {
        id: 2, title: 'B', slug: 'b', summary: null, description: null,
        contentMd: '', content: '', body: '', coverUrl: null, categoryId: null,
        categoryName: 'tech', category: { name: 'tech' }, status: 1, tags: [],
        publishTime: '2026-01-02', createdAt: '2026-01-02', updatedAt: '2026-01-02',
        viewCount: 99, authorId: null, sourceType: null, featured: false,
        sortOrder: null, takedown: false, effectivePublished: true,
        canonicalUrl: '/blog/b', seoTitle: null, seoDescription: null,
      },
    ]
    const { featuredArticle, latestArticles } = adaptArticlesToHomeCards(list)
    expect(featuredArticle?.slug).toBe('b')
    expect(latestArticles.map((a) => a.slug)).toEqual(['a'])
  })
})

describe('Phase 4B-2 sitemap Git capability', () => {
  it('collects only published slug paths from content/articles', () => {
    const paths = collectArticlePathsFromGit(resolve(root, 'content/articles'))
    expect(paths.length).toBeGreaterThan(0)
    expect(paths.every((p: string) => p.startsWith('/blog/'))).toBe(true)
    expect(paths.every((p: string) => !/\/blog\/\d+$/.test(p))).toBe(true)
  })

  it('diff explains api vs git sets', () => {
    const git = collectArticlePathsFromGit(resolve(root, 'content/articles'))
    const api = [...git.slice(0, 3), '/blog/99']
    const diff = diffArticleSitemapPaths(api, git)
    expect(diff.onlyInApi).toContain('/blog/99')
    expect(diff.gitCount).toBe(git.length)
  })
})

describe('Phase 4B-2 search index', () => {
  it('excludes draft archived takedown', () => {
    const articles: ArticleContentItem[] = [
      sampleContent({ slug: 'pub', status: 'published', title: 'Pub Nuxt' }),
      sampleContent({ slug: 'dr', status: 'draft', title: 'Draft Nuxt', legacyId: 4 }),
      sampleContent({ slug: 'ar', status: 'archived', title: 'Arch Nuxt', legacyId: 5 }),
    ]
    const ops = new Map([
      ['pub', { takedown: false }],
      ['dr', { takedown: false }],
      ['ar', { takedown: false }],
      ['gone', { takedown: true }],
    ])
    articles.push(sampleContent({ slug: 'gone', status: 'published', title: 'Gone Nuxt', legacyId: 6 }))
    const index = buildArticlesSearchIndex(articles, ops)
    expect(index.map((i) => i.slug)).toEqual(['pub'])
    expect(searchArticlesIndex(index, 'Nuxt')[0]?.slug).toBe('pub')
  })
})

describe('Phase 4B-2 seed script present', () => {
  it('has content_ops seed + schema', () => {
    expect(existsSync(resolve(root, 'scripts/migrate/seed-content-ops-articles.js'))).toBe(true)
    expect(existsSync(resolve(root, 'database/content_ops.sql'))).toBe(true)
  })
})
