import { searchGitArticles } from '../utils/articles-search'

/**
 * Unified search: Articles from Git index; other entities from .NET /Search.
 * Replaces MySQL content_md as article body source (Phase 4B-3).
 */
export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const keyword = String(query.keyword || '').trim()
  const type = String(query.type || 'all')
  const page = Number(query.page || 1)
  const pageSize = Number(query.pageSize || 20)
  const sort = String(query.sort || 'relevance')

  if (!keyword) {
    return { code: 400, message: '搜索关键词不能为空', data: null }
  }

  const config = useRuntimeConfig()
  const base = String(config.backendApiBase || 'http://localhost:5234/api').replace(/\/$/, '')
  const articlesSot = String(config.public.articlesSot || 'git').toLowerCase()

  const empty = {
    Keyword: keyword,
    Type: type,
    Total: 0,
    Articles: [] as any[],
    Projects: [] as any[],
    KnowledgeBases: [] as any[],
    Tools: [] as any[],
    Themes: [] as any[],
  }

  // Articles from Git
  if (type === 'all' || type === 'articles') {
    if (articlesSot === 'git') {
      const git = await searchGitArticles(keyword, { page, pageSize, sort })
      empty.Articles = git.items
      empty.Total += git.total
    }
  }

  // Other entity types from .NET (never request articles body from MySQL when git)
  const backendType =
    type === 'all'
      ? 'all'
      : type === 'articles'
        ? null
        : type

  if (backendType) {
    try {
      // When type=all and git articles already filled, ask backend for non-article types via parallel calls
      if (backendType === 'all' && articlesSot === 'git') {
        const kinds = ['projects', 'knowledge', 'tools', 'themes'] as const
        const results = await Promise.allSettled(
          kinds.map((kind) =>
            $fetch<any>(`${base}/Search`, {
              query: { keyword, type: kind, page, pageSize, sort },
              timeout: 8000,
            }),
          ),
        )
        for (let i = 0; i < kinds.length; i++) {
          const kind = kinds[i]
          const res = results[i]
          if (res.status !== 'fulfilled') continue
          const data = res.value?.data ?? res.value
          if (kind === 'projects') {
            empty.Projects = data?.Projects || data?.projects || []
            empty.Total += Number(data?.Total ?? data?.total ?? empty.Projects.length)
          }
          if (kind === 'knowledge') {
            empty.KnowledgeBases = data?.KnowledgeBases || data?.knowledgeBases || []
            empty.Total += empty.KnowledgeBases.length
          }
          if (kind === 'tools') {
            empty.Tools = data?.Tools || data?.tools || []
            empty.Total += empty.Tools.length
          }
          if (kind === 'themes') {
            empty.Themes = data?.Themes || data?.themes || []
            empty.Total += empty.Themes.length
          }
        }
      } else if (backendType !== 'articles') {
        const res = await $fetch<any>(`${base}/Search`, {
          query: { keyword, type: backendType, page, pageSize, sort },
          timeout: 8000,
        })
        const data = res?.data ?? res
        empty.Projects = data?.Projects || data?.projects || []
        empty.KnowledgeBases = data?.KnowledgeBases || data?.knowledgeBases || []
        empty.Tools = data?.Tools || data?.tools || []
        empty.Themes = data?.Themes || data?.themes || []
        if (articlesSot !== 'git') {
          empty.Articles = data?.Articles || data?.articles || []
        }
        empty.Total = Number(data?.Total ?? data?.total ?? 0)
        if (articlesSot === 'git' && (type === 'all' || type === 'articles')) {
          // Total already includes git articles; backend total may include mysql articles — recompute
          empty.Total =
            empty.Articles.length
            + empty.Projects.length
            + empty.KnowledgeBases.length
            + empty.Tools.length
            + empty.Themes.length
        }
      }
    } catch (e: any) {
      console.error('[api/search] backend search failed:', e?.message || e)
    }
  }

  // LEGACY_ROLLBACK_ONLY: mysql SoT still uses .NET articles search
  if (articlesSot === 'mysql' && (type === 'all' || type === 'articles')) {
    try {
      const res = await $fetch<any>(`${base}/Search`, {
        query: { keyword, type: type === 'all' ? 'articles' : type, page, pageSize, sort },
        timeout: 8000,
      })
      const data = res?.data ?? res
      empty.Articles = data?.Articles || data?.articles || []
      empty.Total += Number(data?.Total ?? empty.Articles.length)
    } catch (e: any) {
      console.error('[api/search] mysql articles search failed:', e?.message || e)
    }
  }

  return { code: 0, message: 'ok', data: empty }
})
