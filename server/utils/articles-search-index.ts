import type { ArticleContentItem } from '../../types/articlesContent'

/** Nitro local search index entry (Phase 4B skeleton) */
export type ArticleSearchIndexEntry = {
  slug: string
  title: string
  summary: string
  category: string
  tags: string[]
  body: string
}

export type ArticleOpsFlags = {
  takedown?: boolean
}

/**
 * Build searchable index from Git articles.
 * Only includes status=published and takedown=false (when ops provided).
 */
export function buildArticlesSearchIndex(
  articles: ArticleContentItem[],
  opsBySlug: Map<string, ArticleOpsFlags> = new Map(),
): ArticleSearchIndexEntry[] {
  return articles
    .filter((article) => {
      if (article.status !== 'published') return false
      const ops = opsBySlug.get(article.slug)
      if (ops?.takedown) return false
      return true
    })
    .map((article) => ({
      slug: article.slug,
      title: article.title,
      summary: article.summary || '',
      category: article.category || '',
      tags: article.tags || [],
      body: article.content,
    }))
}

/**
 * Simple in-memory search over a pre-built index (Phase 1 — no Meilisearch).
 */
export function searchArticlesIndex(
  index: ArticleSearchIndexEntry[],
  keyword: string,
  limit = 20,
): ArticleSearchIndexEntry[] {
  const q = keyword.trim().toLowerCase()
  if (!q) return []

  return index
    .map((entry) => {
      const haystack = [
        entry.title,
        entry.summary,
        entry.category,
        ...entry.tags,
        entry.body,
      ].join('\n').toLowerCase()

      let score = 0
      if (entry.title.toLowerCase().includes(q)) score += 3
      if (entry.summary.toLowerCase().includes(q)) score += 2
      if (entry.tags.some((t) => t.toLowerCase().includes(q))) score += 2
      if (entry.category.toLowerCase().includes(q)) score += 1
      if (entry.body.toLowerCase().includes(q)) score += 1
      return { entry, score }
    })
    .filter((row) => row.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((row) => row.entry)
}
