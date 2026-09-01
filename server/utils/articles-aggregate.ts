import {
  listArticles,
  readArticleBySlug,
  readArticleTaxonomy,
} from './content-files'
import {
  getArticleOpsByLegacyId,
  getArticleOpsBySlug,
  listArticleOps,
  opsMapBySlug,
} from './content-ops'
import {
  toAggregatedArticle,
  toBlogArticleDto,
  type AggregatedArticle,
  type BlogArticleDto,
} from '../../types/articlesAggregate'
import { buildArticlesSearchIndex, searchArticlesIndex } from './articles-search-index'

function categoryLabelMap() {
  const tax = readArticleTaxonomy()
  const map = new Map<string, string>()
  for (const cat of tax.categories) {
    if (cat.slug) map.set(cat.slug, cat.label || cat.slug)
  }
  return map
}

export async function listAggregatedArticles(options: {
  publicOnly?: boolean
  status?: string
  category?: string
  search?: string
  page?: number
  pageSize?: number
} = {}): Promise<{ total: number; list: AggregatedArticle[]; blogList: BlogArticleDto[] }> {
  const publicOnly = options.publicOnly !== false
  const page = Math.max(1, options.page || 1)
  const pageSize = Math.min(100, Math.max(1, options.pageSize || 20))
  const labels = categoryLabelMap()
  const ops = opsMapBySlug(await listArticleOps())

  let items = listArticles().map((article) =>
    toAggregatedArticle(article, ops.get(article.slug) || null, labels.get(article.category || '') || null),
  )

  if (publicOnly) {
    items = items.filter((a) => a.effectivePublished)
  } else if (options.status) {
    items = items.filter((a) => a.status === options.status)
  }

  if (options.category) {
    const cat = options.category.trim()
    items = items.filter(
      (a) => a.category === cat || a.categoryLabel === cat,
    )
  }

  if (options.search?.trim()) {
    const index = buildArticlesSearchIndex(
      items.map((a) => ({
        title: a.title,
        slug: a.slug,
        summary: a.summary || undefined,
        date: a.date || undefined,
        publishAt: a.publishAt || undefined,
        status: a.status,
        category: a.category || undefined,
        tags: a.tags,
        cover: a.cover || undefined,
        author: a.author || undefined,
        source: a.source || undefined,
        seoTitle: a.seoTitle || undefined,
        seoDescription: a.seoDescription || undefined,
        legacyId: a.legacyId,
        path: a.canonicalUrl,
        content: a.body,
      })),
      new Map(items.map((a) => [a.slug, { takedown: a.takedown }])),
    )
    const hits = new Set(searchArticlesIndex(index, options.search).map((h) => h.slug))
    items = items.filter((a) => hits.has(a.slug))
  }

  // Featured first, then viewCount, then publish time
  items.sort((a, b) => {
    if (a.featured !== b.featured) return a.featured ? -1 : 1
    if (b.viewCount !== a.viewCount) return b.viewCount - a.viewCount
    const aT = new Date(a.publishAt || a.date || 0).getTime()
    const bT = new Date(b.publishAt || b.date || 0).getTime()
    return bT - aT
  })

  const total = items.length
  const slice = items.slice((page - 1) * pageSize, page * pageSize)

  return {
    total,
    list: slice,
    blogList: slice.map(toBlogArticleDto),
  }
}

export async function getAggregatedArticleBySlug(
  slug: string,
  options: { publicOnly?: boolean } = {},
): Promise<AggregatedArticle | null> {
  const publicOnly = options.publicOnly !== false
  const content = readArticleBySlug(slug)
  if (!content) return null

  const ops = await getArticleOpsBySlug(slug)
  const labels = categoryLabelMap()
  const article = toAggregatedArticle(
    content,
    ops,
    labels.get(content.category || '') || null,
  )

  if (publicOnly && !article.effectivePublished) return null
  return article
}

export async function resolveArticleSlugByLegacyId(
  legacyId: string | number,
): Promise<string | null> {
  const ops = await getArticleOpsByLegacyId(legacyId)
  if (ops?.slug) return ops.slug

  // Fallback: Git frontmatter legacyId (ops not seeded yet)
  const hit = listArticles().find((a) => a.legacyId === Number(legacyId))
  return hit?.slug || null
}

export async function getBlogArticleBySlug(
  slug: string,
  options: { publicOnly?: boolean } = {},
): Promise<BlogArticleDto | null> {
  const article = await getAggregatedArticleBySlug(slug, options)
  return article ? toBlogArticleDto(article) : null
}

/** Collect published canonical blog paths for sitemap */
export async function listPublicArticleSitemapPaths(): Promise<string[]> {
  const { list } = await listAggregatedArticles({ publicOnly: true, page: 1, pageSize: 1000 })
  return list.map((a) => a.canonicalUrl)
}
