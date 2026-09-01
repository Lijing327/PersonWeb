import type { HomeArticleCard } from '../../types/home'
import type { BlogArticleDto } from '../../types/articlesAggregate'

/**
 * Adapter: Git/Blog Article DTO → home overview cards.
 * Featured = highest viewCount (same as blog hero), not Git frontmatter.
 */
export function adaptArticlesToHomeCards(articles: BlogArticleDto[]): {
  allArticles: HomeArticleCard[]
  featuredArticle: HomeArticleCard | null
  latestArticles: HomeArticleCard[]
} {
  const allArticles: HomeArticleCard[] = articles.map((a) => {
    const id = Number(a.id || 0)
    const slug = a.slug || null
    return {
      id,
      title: String(a.title || ''),
      slug,
      summary: a.summary ?? a.description ?? null,
      coverUrl: a.coverUrl ?? null,
      publishTime: a.publishTime ?? a.createdAt ?? null,
      viewCount: Number(a.viewCount ?? 0),
      categoryName: a.categoryName ?? a.category?.name ?? null,
      path: `/blog/${slug ?? id}`,
    }
  })

  const byViews = [...allArticles].sort((a, b) => b.viewCount - a.viewCount)
  const featuredArticle = byViews[0] ?? null
  const latestArticles = allArticles
    .filter((a) => a.id !== featuredArticle?.id)
    .slice(0, 4)

  return { allArticles, featuredArticle, latestArticles }
}
