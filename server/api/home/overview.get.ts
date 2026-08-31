import { parseTechStack } from '../../utils/parseTechStack'
import { PROJECT_PROGRESS, DEFAULT_PROGRESS } from '../../../constants/nowBuilding'
import type {
  HomeOverview, HomeProjectCard, HomeArticleCard,
  HomeJourneyItem, HomeNowBuildingItem, HomeStats
} from '../../../types/home'

export default defineEventHandler(async (event) => {
  setHeader(event, 'Cache-Control', 'public, max-age=300, s-maxage=300')

  const config = useRuntimeConfig()
  const base = (config.backendApiBase as string) || 'http://localhost:5234/api'

  // 并发拉取：Projects / Articles / Timeline / Toolbox count
  const [rawProjects, rawArticlesRes, rawTimeline, rawTools] = await Promise.allSettled([
    $fetch<{ code: number; data: any[] }>(`${base}/Projects`, { timeout: 5000 }),
    $fetch<{ code: number; data: { List: any[]; Total: number } }>(
      `${base}/Articles`,
      { query: { status: 1, pageSize: 50, page: 1 }, timeout: 5000 }
    ),
    $fetch<{ code: number; data: any[] }>(`${base}/Timeline`, { timeout: 5000 }),
    $fetch<{ code: number; data: any }>(
      `${base}/Toolbox/marketplace`,
      { query: { page: 1, pageSize: 1 }, timeout: 5000 },
    ),
  ])

  const projects: any[] = rawProjects.status === 'fulfilled'
    ? (Array.isArray(rawProjects.value?.data) ? rawProjects.value.data : [])
    : []

  const articles: any[] = rawArticlesRes.status === 'fulfilled'
    ? (rawArticlesRes.value?.data?.List ?? [])
    : []

  const timeline: any[] = rawTimeline.status === 'fulfilled'
    ? (Array.isArray(rawTimeline.value?.data) ? rawTimeline.value.data : [])
    : []

  let toolsCount = 0
  if (rawTools.status === 'fulfilled') {
    const toolsData = rawTools.value?.data
    toolsCount = Number(
      toolsData?.total
      ?? toolsData?.Total
      ?? (Array.isArray(toolsData?.tools) ? toolsData.tools.length : 0)
      ?? (Array.isArray(toolsData?.Tools) ? toolsData.Tools.length : 0)
      ?? 0,
    )
  }

  // 处理 Projects
  const allProjects: HomeProjectCard[] = projects.map((p: any) => ({
    id: String(p.Id ?? p.id ?? ''),
    title: String(p.Title ?? p.title ?? ''),
    description: String(p.Description ?? p.description ?? ''),
    techStack: parseTechStack(p.TechStack ?? p.techStack),
    coverUrl: p.CoverUrl ?? p.coverUrl ?? null,
    demoUrl: p.DemoUrl ?? p.demoUrl ?? null,
    githubUrl: p.GithubUrl ?? p.githubUrl ?? null,
    status: String(p.Status ?? p.status ?? 'Active'),
    viewCount: Number(p.ViewCount ?? p.viewCount ?? 0),
  }))

  const featuredProjects: HomeProjectCard[] = [...allProjects]
    .filter(p => p.status !== 'Archived')
    .sort((a, b) => b.viewCount - a.viewCount)
    .slice(0, 5)

  // nowBuilding: Active 项目，UpdatedAt DESC 排序，取前 4
  const nowBuilding: HomeNowBuildingItem[] = projects
    .filter((p: any) => String(p.Status ?? p.status) === 'Active')
    .sort((a: any, b: any) => {
      const aT = new Date(a.UpdatedAt ?? a.updatedAt ?? 0).getTime()
      const bT = new Date(b.UpdatedAt ?? b.updatedAt ?? 0).getTime()
      return bT - aT
    })
    .slice(0, 4)
    .map((p: any) => {
      const title = String(p.Title ?? p.title ?? '')
      return {
        id: String(p.Id ?? p.id ?? ''),
        title,
        description: String(p.Description ?? p.description ?? ''),
        techStack: parseTechStack(p.TechStack ?? p.techStack),
        status: String(p.Status ?? p.status ?? 'Active'),
        progress: PROJECT_PROGRESS[title] ?? DEFAULT_PROGRESS,
      }
    })

  // 处理 Articles
  const allArticles: HomeArticleCard[] = articles.map((a: any) => {
    const id = Number(a.Id ?? a.id ?? 0)
    const slug = a.Slug ?? a.slug ?? null
    return {
      id,
      title: String(a.Title ?? a.title ?? ''),
      slug,
      summary: a.Summary ?? a.summary ?? null,
      coverUrl: a.CoverUrl ?? a.coverUrl ?? null,
      publishTime: a.PublishTime ?? a.publishTime ?? a.CreatedAt ?? a.createdAt ?? null,
      viewCount: Number(a.ViewCount ?? a.viewCount ?? 0),
      categoryName: a.CategoryName ?? a.categoryName ?? null,
      path: `/blog/${slug ?? id}`,
    }
  })

  const featuredArticle: HomeArticleCard | null = allArticles[0] ?? null
  // 按 id 排除精选文章（不用数组下标）
  const latestArticles: HomeArticleCard[] = allArticles
    .filter(a => a.id !== featuredArticle?.id)
    .slice(0, 4)

  // 处理 Timeline
  const currentYear = new Date().getFullYear()
  const journey: HomeJourneyItem[] = timeline.map((t: any) => ({
    id: Number(t.Id ?? t.id ?? 0),
    year: Number(t.Year ?? t.year ?? 0),
    title: String(t.Title ?? t.title ?? ''),
    description: t.Description ?? t.description ?? null,
    icon: t.Icon ?? t.icon ?? null,
    color: t.Color ?? t.color ?? null,
    isNow: Number(t.Year ?? t.year) === currentYear,
  }))

  // Stats
  const stats: HomeStats = {
    projects: allProjects.filter(p => p.status !== 'Archived').length,
    articles: allArticles.length,
    tools: toolsCount,
  }

  return {
    stats,
    featuredProjects,
    featuredArticle,
    latestArticles,
    nowBuilding,
    journey,
  } satisfies HomeOverview
})
