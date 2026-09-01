import type { BlogArticleDto } from '~/types/articlesAggregate'
import { fetchBackendApi, isNotFoundError } from '~/composables/useBackendFetch'

export type ArticlesSotMode = 'mysql' | 'git'

/**
 * Central Articles SoT switch.
 * Default: git (Phase 4B-3).
 * mysql = LEGACY_ROLLBACK_ONLY — temporary rollback path.
 */
export function useArticlesRepository() {
  const config = useRuntimeConfig()

  const getSot = (): ArticlesSotMode => {
    const raw = String(config.public.articlesSot || 'git').toLowerCase()
    return raw === 'mysql' ? 'mysql' : 'git'
  }

  const isGitSot = () => getSot() === 'git'

  const listArticles = async (params: {
    page?: number
    pageSize?: number
    status?: number | string
    category?: string
    search?: string
  } = {}): Promise<{ total: number; list: BlogArticleDto[] }> => {
    if (isGitSot()) {
      const res = await $fetch<{
        code?: number
        data?: { Total?: number; total?: number; List?: BlogArticleDto[]; list?: BlogArticleDto[] }
      }>('/api/content/articles', {
        query: {
          page: params.page || 1,
          pageSize: params.pageSize || 100,
          category: params.category,
          search: params.search,
        },
      })
      const data = res?.data || (res as any)
      return {
        total: Number(data?.Total ?? data?.total ?? 0),
        list: data?.List ?? data?.list ?? [],
      }
    }

    const api = useApi()
    const res = await api.get<any>('/Articles', {
      params: {
        page: params.page || 1,
        pageSize: params.pageSize || 100,
        status: params.status ?? 1,
      },
    })
    const list = (res?.List ?? res?.list ?? []).map((article: any) => ({
      ...article,
      id: article.id ?? article.Id,
      slug: article.slug ?? article.Slug,
      title: article.title ?? article.Title,
      summary: article.summary ?? article.Summary,
      coverUrl: article.coverUrl ?? article.CoverUrl,
      status: article.status ?? article.Status,
      publishTime: article.publishTime ?? article.PublishTime,
      createdAt: article.createdAt ?? article.CreatedAt,
      categoryName: article.categoryName ?? article.CategoryName,
      viewCount: article.viewCount ?? article.ViewCount ?? 0,
      tags: article.tags ?? [],
      contentMd: article.contentMd ?? article.ContentMd,
    }))
    return {
      total: Number(res?.Total ?? res?.total ?? list.length),
      list,
    }
  }

  const getArticleByIdOrSlug = async (idOrSlug: string): Promise<BlogArticleDto> => {
    if (isGitSot()) {
      const isNumeric = /^\d+$/.test(idOrSlug)
      if (isNumeric) {
        const resolved = await $fetch<{
          code?: number
          data?: { slug: string; canonicalUrl: string }
        }>(`/api/content/articles/by-legacy/${idOrSlug}`)
        const slug = resolved?.data?.slug
        if (!slug) {
          throw createError({ statusCode: 404, statusMessage: 'Not Found' })
        }
        // Server: true 301. Client: soft navigate to canonical slug URL.
        await navigateTo(`/blog/${slug}`, {
          redirectCode: import.meta.server ? 301 : undefined,
          replace: true,
        })
        return await getArticleBySlug(slug)
      }
      return await getArticleBySlug(idOrSlug)
    }

    try {
      if (/^\d+$/.test(idOrSlug)) {
        return await fetchBackendApi<BlogArticleDto>(`/Articles/${idOrSlug}`)
      }
      try {
        return await fetchBackendApi<BlogArticleDto>(`/Articles/slug/${idOrSlug}`)
      } catch (slugError) {
        if (!isNotFoundError(slugError)) throw slugError
        return await fetchBackendApi<BlogArticleDto>(`/Articles/${idOrSlug}`)
      }
    } catch (e) {
      if (isNotFoundError(e)) {
        throw createError({ statusCode: 404, statusMessage: 'Not Found' })
      }
      throw createError({ statusCode: 502, statusMessage: 'Upstream error' })
    }
  }

  const getArticleBySlug = async (slug: string): Promise<BlogArticleDto> => {
    const res = await $fetch<{ code?: number; data?: BlogArticleDto }>(
      `/api/content/articles/${encodeURIComponent(slug)}`,
    )
    const article = res?.data || (res as any)
    if (!article?.slug) {
      throw createError({ statusCode: 404, statusMessage: 'Not Found' })
    }
    return article
  }

  /**
   * Client-only view increment (avoids SSR + hydration double count).
   * No-op on mysql path (legacy Articles GET never reliably incremented either).
   */
  const recordArticleView = async (slug: string) => {
    if (!isGitSot() || !slug || !import.meta.client) return
    try {
      await $fetch(`/api/content/articles/${encodeURIComponent(slug)}/view`, {
        method: 'POST',
      })
    } catch {
      // silent — analytics must not break reading
    }
  }

  return {
    getSot,
    isGitSot,
    listArticles,
    getArticleByIdOrSlug,
    getArticleBySlug,
    recordArticleView,
  }
}
