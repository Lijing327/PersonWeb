import type { ArticleContentItem } from './articlesContent'
import type { ArticleGitStatus } from '../constants/articles-content'

export type ContentOpsRow = {
  entityType: 'article' | 'project'
  slug: string
  legacyId: string
  viewCount: number
  featured: boolean
  sortOrder: number | null
  takedown: boolean
  sourceType: string | null
  contentHash: string | null
  syncedAt: string | null
}

export type AggregatedArticle = {
  title: string
  slug: string
  summary: string | null
  body: string
  category: string | null
  categoryLabel: string | null
  tags: string[]
  cover: string | null
  author: string | null
  publishAt: string | null
  date: string | null
  status: ArticleGitStatus
  seoTitle: string | null
  seoDescription: string | null
  legacyId: number
  source: string | null
  viewCount: number
  featured: boolean
  sortOrder: number | null
  takedown: boolean
  effectivePublished: boolean
  canonicalUrl: string
}

export type BlogArticleDto = {
  id: number
  title: string
  slug: string
  summary: string | null
  description: string | null
  contentMd: string
  content: string
  body: string
  coverUrl: string | null
  categoryId: null
  categoryName: string | null
  category: { name: string } | null
  status: number
  tags: string[]
  publishTime: string | null
  createdAt: string | null
  updatedAt: string | null
  viewCount: number
  authorId: null
  sourceType: string | null
  featured: boolean
  sortOrder: number | null
  takedown: boolean
  effectivePublished: boolean
  canonicalUrl: string
  seoTitle: string | null
  seoDescription: string | null
}

export function isEffectivePublished(
  status: ArticleGitStatus,
  takedown: boolean,
): boolean {
  return status === 'published' && !takedown
}

export function toAggregatedArticle(
  content: ArticleContentItem,
  ops: ContentOpsRow | null,
  categoryLabel?: string | null,
): AggregatedArticle {
  const takedown = ops?.takedown ?? false
  const status = content.status
  return {
    title: content.title,
    slug: content.slug,
    summary: content.summary ?? null,
    body: content.content,
    category: content.category ?? null,
    categoryLabel: categoryLabel ?? content.category ?? null,
    tags: content.tags || [],
    cover: content.cover ?? null,
    author: content.author ?? null,
    publishAt: content.publishAt ?? null,
    date: content.date ?? null,
    status,
    seoTitle: content.seoTitle ?? null,
    seoDescription: content.seoDescription ?? null,
    legacyId: content.legacyId,
    source: content.source ?? null,
    viewCount: ops?.viewCount ?? 0,
    featured: ops?.featured ?? false,
    sortOrder: ops?.sortOrder ?? null,
    takedown,
    effectivePublished: isEffectivePublished(status, takedown),
    canonicalUrl: `/blog/${content.slug}`,
  }
}

/** Blog / home compatible shape (camelCase, mirrors .NET Article fields) */
export function toBlogArticleDto(article: AggregatedArticle): BlogArticleDto {
  const statusMap: Record<ArticleGitStatus, number> = {
    draft: 0,
    published: 1,
    archived: 2,
  }
  const label = article.categoryLabel || article.category
  return {
    id: article.legacyId,
    title: article.title,
    slug: article.slug,
    summary: article.summary,
    description: article.summary,
    contentMd: article.body,
    content: article.body,
    body: article.body,
    coverUrl: article.cover,
    categoryId: null,
    categoryName: label,
    category: label ? { name: label } : null,
    status: statusMap[article.status],
    tags: article.tags,
    publishTime: article.publishAt || article.date,
    createdAt: article.publishAt || article.date,
    updatedAt: article.publishAt || article.date,
    viewCount: article.viewCount,
    authorId: null,
    sourceType: article.source,
    featured: article.featured,
    sortOrder: article.sortOrder,
    takedown: article.takedown,
    effectivePublished: article.effectivePublished,
    canonicalUrl: article.canonicalUrl,
    seoTitle: article.seoTitle,
    seoDescription: article.seoDescription,
  }
}
