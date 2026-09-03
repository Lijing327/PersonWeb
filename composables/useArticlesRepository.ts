import type { BlogArticleDto } from '~/types/articlesAggregate'
import { fetchBackendApi, isNotFoundError } from '~/composables/useBackendFetch'

export type ArticlesSotMode = 'mysql' | 'git'

function unwrapArticleList(res: unknown): { total: number; list: BlogArticleDto[] } {
  if (!res || typeof res === 'string') {
    return { total: 0, list: [] }
  }
  const payload = res as {
    data?: { Total?: number; total?: number; List?: BlogArticleDto[]; list?: BlogArticleDto[] }
    Total?: number
    total?: number
    List?: BlogArticleDto[]
    list?: BlogArticleDto[]
  }
  const data = payload.data || payload
  const list = data.List ?? data.list ?? []
  return {
    total: Number(data.Total ?? data.total ?? list.length),
    list,
  }
}

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

  const listFromStaticIndex = async (): Promise<{ total: number; list: BlogArticleDto[] }> => {
    const res = await $fetch<unknown>('/data/articles-index.json')
    return unwrapArticleList(res)
  }

  const listFromNitro = async (params: {
    page?: number
    pageSize?: number
    category?: string
    search?: string
  }): Promise<{ total: number; list: BlogArticleDto[] }> => {
    const res = await $fetch<unknown>('/api/content/articles', {
      query: {
        page: params.page || 1,
        pageSize: params.pageSize || 100,
        category: params.category,
        search: params.search,
      },
    })
    return unwrapArticleList(res)
  }

  const listArticles = async (params: {
    page?: number
    pageSize?: number
    status?: number | string
    category?: string
    search?: string
  } = {}): Promise<{ total: number; list: BlogArticleDto[] }> => {
    if (isGitSot()) {
      // 静态托管（OSS）没有 Nitro，/api/content/* 会落到 200.html，列表变成 0 篇。
      // 开发走 Nitro 读即时 Markdown；生产优先静态 JSON。
      const loaders = import.meta.dev
        ? [() => listFromNitro(params), listFromStaticIndex]
        : [listFromStaticIndex, () => listFromNitro(params)]

      for (const load of loaders) {
        try {
          const result = await load()
          if (result.list.length > 0 || result.total > 0) return result
        } catch {
          // try next source
        }
      }
      return { total: 0, list: [] }
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

  const getArticleBySlug = async (slug: string): Promise<BlogArticleDto> => {
    const readNitro = async () => {
      const res = await $fetch<{ code?: number; data?: BlogArticleDto }>(
        `/api/content/articles/${encodeURIComponent(slug)}`,
      )
      return res?.data || (res as BlogArticleDto)
    }
    const readStatic = async () => {
      return await $fetch<BlogArticleDto>(
        `/data/articles/${encodeURIComponent(slug)}.json`,
      )
    }

    const loaders = import.meta.dev ? [readNitro, readStatic] : [readStatic, readNitro]
    for (const load of loaders) {
      try {
        const article = await load()
        if (article && typeof article === 'object' && (article as BlogArticleDto).slug) {
          return article as BlogArticleDto
        }
      } catch {
        // try next source
      }
    }
    throw createError({ statusCode: 404, statusMessage: 'Not Found' })
  }

  const getArticleByIdOrSlug = async (idOrSlug: string): Promise<BlogArticleDto> => {
    if (isGitSot()) {
      const isNumeric = /^\d+$/.test(idOrSlug)
      if (isNumeric) {
        const resolved = await $fetch<{
          code?: number
          data?: { slug: string; canonicalUrl: string }
        }>(`/api/content/articles/by-legacy/${idOrSlug}`).catch(() => null)
        const slug = resolved?.data?.slug
        if (!slug) {
          throw createError({ statusCode: 404, statusMessage: 'Not Found' })
        }
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

  /**
   * Client-only view increment (avoids SSR + hydration double count).
   * Returns updated viewCount when the Nitro/ops path succeeds.
   */
  const recordArticleView = async (slug: string): Promise<number | null> => {
    if (!isGitSot() || !slug || !import.meta.client) return null
    try {
      const res = await $fetch<{
        data?: { viewCount?: number }
        viewCount?: number
      }>(`/api/content/articles/${encodeURIComponent(slug)}/view`, {
        method: 'POST',
      })
      const count = res?.data?.viewCount ?? res?.viewCount
      return typeof count === 'number' ? count : null
    } catch {
      return null
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

