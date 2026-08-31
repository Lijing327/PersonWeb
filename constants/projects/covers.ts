import type { Project } from '~/types/api'

export type ProjectCoverKey =
  | 'mindtrace'
  | 'personweb'
  | 'personweb-system'
  | 'ai-service'
  | 'analytics'
  | 'tools'
  | 'labs'
  | 'ai-assistant'
  | 'tool-market'
  | 'theme-store'
  | 'love-cube'
  | 'investment-system'
  | 'iot-control'
  | 'finance-assistant'
  | 'variant-a'
  | 'variant-b'
  | 'variant-c'
  | 'variant-d'
  | 'default'

export const PROJECT_COVER_BASE = '/images/projects/covers'

/** 素材目录 WebP 封面位于 public/images/projects/covers/ */
export const PROJECT_COVER_PATHS: Record<ProjectCoverKey, string> = {
  mindtrace: `${PROJECT_COVER_BASE}/mindtrace.webp`,
  personweb: `${PROJECT_COVER_BASE}/personweb.webp`,
  'personweb-system': `${PROJECT_COVER_BASE}/personweb-system.webp`,
  'ai-service': `${PROJECT_COVER_BASE}/ai-service.webp`,
  analytics: `${PROJECT_COVER_BASE}/analytics.svg`,
  tools: `${PROJECT_COVER_BASE}/tools.webp`,
  labs: `${PROJECT_COVER_BASE}/labs.webp`,
  'ai-assistant': `${PROJECT_COVER_BASE}/ai-assistant.webp`,
  'tool-market': `${PROJECT_COVER_BASE}/tool-market.webp`,
  'theme-store': `${PROJECT_COVER_BASE}/theme-store.webp`,
  'love-cube': `${PROJECT_COVER_BASE}/variant-c.svg`,
  'investment-system': `${PROJECT_COVER_BASE}/investment-system.webp`,
  'iot-control': `${PROJECT_COVER_BASE}/iot-control.webp`,
  'finance-assistant': `${PROJECT_COVER_BASE}/finance-assistant.webp`,
  'variant-a': `${PROJECT_COVER_BASE}/variant-a.svg`,
  'variant-b': `${PROJECT_COVER_BASE}/variant-b.svg`,
  'variant-c': `${PROJECT_COVER_BASE}/variant-c.svg`,
  'variant-d': `${PROJECT_COVER_BASE}/variant-d.svg`,
  default: `${PROJECT_COVER_BASE}/default.svg`,
}

const VARIANT_KEYS: ProjectCoverKey[] = ['variant-a', 'variant-b', 'variant-c', 'variant-d']

function normalizeText(value: string | undefined): string {
  return (value || '').trim().toLowerCase()
}

function readField<T>(project: Record<string, unknown>, camel: string, pascal: string): T | undefined {
  if (project[camel] !== undefined && project[camel] !== null) {
    return project[camel] as T
  }
  if (project[pascal] !== undefined && project[pascal] !== null) {
    return project[pascal] as T
  }
  return undefined
}

/** 兼容后端 PascalCase / 前端 camelCase 字段 */
export function normalizeProjectFields(project: Project | Record<string, unknown>) {
  const raw = project as Record<string, unknown>
  const cover = readField<string | null | undefined>(raw, 'coverUrl', 'CoverUrl')
  return {
    id: String(readField<string | number>(raw, 'id', 'Id') ?? ''),
    title: String(readField<string>(raw, 'title', 'Title') ?? ''),
    techStack: readField<string | string[]>(raw, 'techStack', 'TechStack'),
    coverUrl: typeof cover === 'string' ? cover : undefined,
  }
}

function getTechText(techStack: string | string[] | undefined): string {
  if (Array.isArray(techStack)) {
    return techStack.join(' ').toLowerCase()
  }
  return String(techStack || '').toLowerCase()
}

function hashTitle(title: string): number {
  let hash = 0
  for (let index = 0; index < title.length; index += 1) {
    hash = (hash * 31 + title.charCodeAt(index)) >>> 0
  }
  return hash
}

/** 本地 SVG 占位封面，应被素材 WebP 或标题映射覆盖 */
function isPlaceholderCoverUrl(coverUrl: string | undefined): boolean {
  if (!coverUrl?.trim()) {
    return true
  }

  const normalized = coverUrl.trim().toLowerCase()
  if (normalized.includes('placeholder')) {
    return true
  }

  if (!normalized.startsWith(`${PROJECT_COVER_BASE}/`.toLowerCase())) {
    if (/^\/images\/projects\/[^/]+\.(png|jpe?g|webp)$/i.test(normalized)) {
      return true
    }
    return false
  }

  return (
    normalized.endsWith('/default.svg')
    || /\/variant-[a-d]\.svg$/i.test(normalized)
    || normalized.endsWith('.svg')
  )
}

export function resolveProjectCoverKey(
  project: Pick<Project, 'id' | 'title' | 'techStack'> | Record<string, unknown>,
): ProjectCoverKey {
  const fields = normalizeProjectFields(project)
  const id = normalizeText(fields.id)
  const title = normalizeText(fields.title)
  const tech = getTechText(fields.techStack)

  if (
    id === 'mindtrace'
    || title.includes('mindtrace')
    || title.includes('思考轨迹')
    || tech.includes('chrome extension')
  ) {
    return 'mindtrace'
  }
  if (
    title.includes('个人数字资产')
    || title.includes('本网站')
    || title.includes('数字资产平台')
  ) {
    return 'personweb'
  }
  if (title.includes('个人网站系统')) {
    return 'personweb-system'
  }
  if (title.includes('个人网站') && !title.includes('系统')) {
    return 'personweb'
  }
  if (title.includes('实验室') || title.includes('labs') || tech.includes('three.js') || tech.includes('webgl')) {
    return 'labs'
  }
  if (
    title.includes('ai service')
    || title.includes('python 服务')
    || (tech.includes('fastapi') && tech.includes('python'))
  ) {
    return 'ai-service'
  }
  if (title.includes('访客分析') || title.includes('analytics') || title.includes('访问分析')) {
    return 'analytics'
  }
  if (title.includes('开发者工具') || title.includes('工具箱') || title.includes('dev tools')) {
    return 'tools'
  }
  if (title.includes('工具市场') || title.includes('tool market')) {
    return 'tool-market'
  }
  if (title.includes('主题商店') || title.includes('theme store') || title.includes('主题市场')) {
    return 'theme-store'
  }
  if (
    title.includes('ai创作')
    || title.includes('ai 创作助手')
    || title.includes('ai智能助手')
    || title.includes('ai 助手')
    || title.includes('ai助手')
  ) {
    return 'ai-assistant'
  }
  if (title.includes('恋爱魔方') || title.includes('love cube')) {
    return 'love-cube'
  }
  if (title.includes('智能物联网') || title.includes('物联网') || title.includes('iot')) {
    return 'iot-control'
  }
  if (title.includes('智能理财') || title.includes('理财助手') || title.includes('finance assistant')) {
    return 'finance-assistant'
  }
  if (title.includes('投资管理') || title.includes('investment')) {
    return 'investment-system'
  }

  if (fields.title) {
    const variantIndex = hashTitle(fields.title) % VARIANT_KEYS.length
    return VARIANT_KEYS[variantIndex] ?? 'default'
  }

  return 'default'
}

export function resolveProjectCoverUrl(
  project: Pick<Project, 'id' | 'title' | 'techStack' | 'coverUrl'> | Record<string, unknown>,
): string {
  const fields = normalizeProjectFields(project)
  const key = resolveProjectCoverKey(fields)
  const mapped = PROJECT_COVER_PATHS[key] || PROJECT_COVER_PATHS.default

  const existing = fields.coverUrl?.trim()
  if (existing && !isPlaceholderCoverUrl(existing)) {
    return existing
  }

  return mapped
}

export function applyProjectCover<T extends Project>(project: T): T {
  const fields = normalizeProjectFields(project)
  return {
    ...project,
    title: fields.title || project.title,
    coverUrl: resolveProjectCoverUrl(fields),
  }
}

export function isDesignedProjectCover(coverUrl: string | undefined): boolean {
  return Boolean(coverUrl?.startsWith(`${PROJECT_COVER_BASE}/`))
}
