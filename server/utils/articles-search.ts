import {
  listArticles,
  readArticleTaxonomy,
} from '../utils/content-files'
import { listArticleOps, opsMapBySlug } from '../utils/content-ops'
import {
  buildArticlesSearchIndex,
  searchArticlesIndex,
} from '../utils/articles-search-index'
import type { ArticleContentItem } from '../../types/articlesContent'

function toSearchItem(entry: {
  slug: string
  title: string
  summary: string
  category: string
  tags: string[]
  body: string
}, scoreBoost = 0) {
  const labels = readArticleTaxonomy().categories
  const label = labels.find((c) => c.slug === entry.category)?.label || entry.category
  return {
    id: entry.slug,
    title: entry.title,
    summary: entry.summary || '',
    content: entry.body.slice(0, 500),
    type: 'article',
    url: `/blog/${entry.slug}`,
    createdAt: null as string | null,
    category: label || null,
    _score: scoreBoost,
  }
}

/**
 * Search published Git articles (excludes draft/archived/takedown).
 */
export async function searchGitArticles(
  keyword: string,
  options: { page?: number; pageSize?: number; sort?: string } = {},
) {
  const page = Math.max(1, options.page || 1)
  const pageSize = Math.min(50, Math.max(1, options.pageSize || 20))
  const ops = opsMapBySlug(await listArticleOps())
  const articles: ArticleContentItem[] = listArticles()
  const index = buildArticlesSearchIndex(
    articles,
    new Map([...ops.entries()].map(([slug, row]) => [slug, { takedown: row.takedown }])),
  )

  let hits = searchArticlesIndex(index, keyword, 200)
  if (options.sort === 'time') {
    const bySlug = new Map(articles.map((a) => [a.slug, a]))
    hits = [...hits].sort((a, b) => {
      const aT = new Date(bySlug.get(a.slug)?.publishAt || bySlug.get(a.slug)?.date || 0).getTime()
      const bT = new Date(bySlug.get(b.slug)?.publishAt || bySlug.get(b.slug)?.date || 0).getTime()
      return bT - aT
    })
  }

  const total = hits.length
  const slice = hits.slice((page - 1) * pageSize, page * pageSize)
  return {
    total,
    items: slice.map((entry) => toSearchItem(entry)),
  }
}
