import { MIND_TRACE } from '~/constants/products/mindTrace'
import { PROJECT_COVER_PATHS } from '~/constants/projects/covers'
import type { Project } from '~/types/api'

export interface ShowcaseProject extends Project {
  /** 自定义详情页路径，优先于 /projects/:id */
  detailPath?: string
}

/** 不在后端 Projects 表、但需要出现在案例墙的产品型项目（DERIVED / COMPAT bridge → Product view）
 * MindTrace：案例墙回答「做过什么能力」的入口，详情落在产品页回答「怎么用」。
 */
export const SHOWCASE_PROJECT_EXTRAS: ShowcaseProject[] = [
  {
    id: 'mindtrace',
    title: 'MindTrace 思考轨迹',
    description:
      'Chrome 浏览器扩展：浏览网页时快速记录灵感，自动保留页面上下文，把零散想法串成可追溯的思考轨迹。已上架 Chrome 网上应用店。',
    demoUrl: MIND_TRACE.chromeWebStoreUrl,
    coverUrl: PROJECT_COVER_PATHS.mindtrace,
    status: 'Active',
    techStack: ['Chrome Extension', 'TypeScript', 'Manifest V3', 'Browser APIs'],
    viewCount: 0,
    createdAt: '2025-01-01T00:00:00',
    updatedAt: new Date().toISOString(),
    detailPath: '/products/mindtrace',
  },
]

export function mergeShowcaseProjects<T extends Project>(projects: T[]): (T & ShowcaseProject)[] {
  const merged = [...projects] as (T & ShowcaseProject)[]
  const normalizedTitles = new Set(
    projects.map(project => project.title.trim().toLowerCase()),
  )

  for (const extra of SHOWCASE_PROJECT_EXTRAS) {
    const key = extra.title.trim().toLowerCase()
    const exists = normalizedTitles.has(key)
      || [...normalizedTitles].some(title => title.includes('mindtrace'))
    if (exists) {
      continue
    }
    merged.unshift(extra as T & ShowcaseProject)
    normalizedTitles.add(key)
  }

  return merged
}

export function getProjectDetailPath(project: ShowcaseProject): string {
  if (project.detailPath) {
    return project.detailPath
  }
  return `/projects/${project.id}`
}
