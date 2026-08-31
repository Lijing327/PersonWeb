import type { Project } from '~/types/api'
import type {
  ProjectShowcaseArchitectureLayer,
  ProjectShowcaseChallenge,
  ProjectShowcaseData,
  ProjectShowcaseFeature,
  ProjectShowcasePartial,
  ProjectShowcasePitch,
  ProjectShowcaseStat,
} from '~/types/projectShowcase'
import { getProjectShowcasePreset } from '~/constants/projects/showcasePresets'
import { normalizeProjectFields, resolveProjectCoverUrl } from '~/constants/projects/covers'

/**
 * COMPAT: allow legacy constants/projects/showcasePresets to fill gaps
 * when Project.Content has no showcase JSON yet.
 * Turn off after Admin can write ProjectShowcaseJson end-to-end.
 */
export const ENABLE_LEGACY_SHOWCASE_PRESETS = true

function parseTechStack(techStack: string | string[] | undefined): string[] {
  if (!techStack) return []
  if (Array.isArray(techStack)) {
    return techStack.filter((item): item is string => typeof item === 'string').map(item => item.trim()).filter(Boolean)
  }

  const trimmed = techStack.trim()
  if (trimmed.startsWith('[') && trimmed.endsWith(']')) {
    try {
      const parsed = JSON.parse(trimmed) as unknown[]
      if (Array.isArray(parsed)) {
        return parsed.filter((item): item is string => typeof item === 'string').map(item => item.trim()).filter(Boolean)
      }
    } catch {
      // fall through
    }
  }

  return trimmed.split(',').map(item => item.trim()).filter(Boolean)
}

function extractShowcaseFromContent(content?: string | null): ProjectShowcasePartial | null {
  if (!content?.trim()) return null

  const trimmed = content.trim()
  if (trimmed.startsWith('{')) {
    try {
      const parsed = JSON.parse(trimmed) as { showcase?: ProjectShowcasePartial } & ProjectShowcasePartial
      return parsed.showcase || parsed
    } catch {
      return null
    }
  }

  const fenced = trimmed.match(/```(?:json|showcase)\s*([\s\S]*?)```/i)
  if (fenced?.[1]) {
    try {
      const parsed = JSON.parse(fenced[1]) as { showcase?: ProjectShowcasePartial } & ProjectShowcasePartial
      return parsed.showcase || parsed
    } catch {
      return null
    }
  }

  return null
}

function stripHtml(html: string): string {
  return html
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function looksLikeMarkdown(text: string): boolean {
  return /(^|\n)\s*#{1,6}\s/m.test(text)
    || /(^|\n)\s*[-*+]\s/m.test(text)
    || /\*\*[^*]+\*\*/.test(text)
    || /(^|\n)\s*\d+\.\s/m.test(text)
    || text.includes('```')
}

function extractReadableParagraphs(project: Project): string[] {
  if (project.contentHtml?.trim()) {
    const plain = stripHtml(project.contentHtml)
    if (plain && !looksLikeMarkdown(plain)) {
      return splitParagraphs(plain, 4).filter(item => !looksLikeMarkdown(item))
    }
  }

  if (project.content?.trim() && !project.content.trim().startsWith('{')) {
    const cleaned = project.content.replace(/```[\s\S]*?```/g, '').trim()
    if (cleaned && !looksLikeMarkdown(cleaned)) {
      return splitParagraphs(cleaned, 4).filter(item => !looksLikeMarkdown(item))
    }
  }

  return []
}

function splitParagraphs(text: string, max = 4): string[] {
  return text
    .split(/\n{2,}|(?<=[。！？])\s+/)
    .map(item => item.trim())
    .filter(Boolean)
    .slice(0, max)
}

function getStatusLabel(status?: string): string {
  const value = (status || '').toLowerCase()
  if (value.includes('complete') || value.includes('done') || value.includes('finished')) return '已完成'
  if (value.includes('beta') || value.includes('测试')) return '测试阶段'
  if (value.includes('plan') || value.includes('draft')) return '规划中'
  if (value.includes('active') || value.includes('维护') || value.includes('online')) return '持续维护'
  return status || '进行中'
}

function formatMonth(date?: string): string {
  if (!date) return '—'
  const parsed = new Date(date)
  if (Number.isNaN(parsed.getTime())) return '—'
  const year = parsed.getFullYear()
  const month = String(parsed.getMonth() + 1).padStart(2, '0')
  return `${year}.${month}`
}

function techIcon(label: string): string {
  const value = label.toLowerCase()
  if (value.includes('vue') || value.includes('nuxt')) return 'V'
  if (value.includes('react')) return 'R'
  if (value.includes('node')) return 'N'
  if (value.includes('express')) return 'Ex'
  if (value.includes('redis')) return 'Re'
  if (value.includes('mysql') || value.includes('postgresql')) return 'DB'
  if (value.includes('python') || value.includes('fastapi')) return 'Py'
  if (value.includes('spring')) return 'Sp'
  if (value.includes('mybatis')) return 'MB'
  if (value.includes('小程序') || value.includes('wechat')) return 'MP'
  if (value.includes('stm32') || value.includes('embedded')) return 'MCU'
  if (value.includes('mqtt')) return 'MQ'
  if (value.includes('网关') || value.includes('gateway')) return 'GW'
  if (value.includes('云') || value.includes('cloud')) return '☁'
  if (value.includes('控制台') || value.includes('web')) return 'UI'
  return label.slice(0, 2).toUpperCase()
}

function buildArchitectureLayers(techStack: string[]): ProjectShowcaseArchitectureLayer[] {
  if (techStack.length === 0) {
    return [
      { label: '前端界面', icon: 'UI' },
      { label: '业务服务', icon: 'API' },
      { label: '数据存储', icon: 'DB' },
    ]
  }

  return techStack.slice(0, 6).map(label => ({
    label,
    icon: techIcon(label),
  }))
}

function buildDefaultFeatures(project: Project, techStack: string[]): ProjectShowcaseFeature[] {
  const icons = ['🎯', '⚡', '🧩', '📊', '🔒', '🚀']
  const fromTech = techStack.slice(0, 4).map((tech, index) => ({
    icon: icons[index] || '✨',
    title: `${tech} 能力`,
    description: `围绕 ${tech} 构建稳定、可扩展的项目模块，支撑 ${project.title} 的核心体验。`,
  }))

  if (fromTech.length >= 4) {
    return fromTech.slice(0, 6)
  }

  const base: ProjectShowcaseFeature[] = [
    {
      icon: '🎯',
      title: '核心体验',
      description: project.description || '围绕用户场景设计核心功能闭环，保证主流程清晰可用。',
    },
    {
      icon: '⚡',
      title: '性能与稳定',
      description: '关键链路优化与异常兜底，保障日常使用中的响应速度与可靠性。',
    },
    {
      icon: '🧩',
      title: '模块化设计',
      description: '业务与基础设施解耦，便于后续迭代新功能与替换底层实现。',
    },
    {
      icon: '📊',
      title: '数据驱动',
      description: '通过指标与日志追踪使用行为，为产品优化提供可量化依据。',
    },
    {
      icon: '🔒',
      title: '安全合规',
      description: '鉴权、输入校验与敏感数据保护，降低线上风险面。',
    },
    {
      icon: '🚀',
      title: '持续演进',
      description: '按阶段交付版本规划，逐步扩展能力边界与商业化可能。',
    },
  ]

  return [...fromTech, ...base].slice(0, 6)
}

function buildDefaultOverview(project: Project, techStack: string[]): ProjectShowcaseStat[] {
  const platform = techStack.find(item => item.includes('小程序')) || techStack[0] || 'Web'
  return [
    { icon: '👥', value: `${Math.max(project.viewCount || 0, 1)}+`, label: '关注热度', tone: 'blue' },
    { icon: '🛠️', value: getStatusLabel(project.status), label: '项目状态', tone: 'green' },
    { icon: '🏷️', value: formatMonth(project.updatedAt || project.createdAt), label: '最近更新', tone: 'purple' },
    { icon: '📱', value: platform, label: '技术平台', tone: 'cyan' },
  ]
}

function parseDescriptionHighlights(description: string): string[] {
  const match = description.match(/(?:包括|涵盖|功能)[：:](.+)$/)
  if (!match?.[1]) return []

  return match[1]
    .replace(/[。.!！?？]/g, '')
    .split(/[、,，]/)
    .map(item => item.trim())
    .filter(Boolean)
    .slice(0, 6)
}

function ensureBackgroundParagraphs(project: Project, paragraphs: string[]): string[] {
  if (paragraphs.length > 0) {
    return paragraphs
  }

  const desc = project.description?.trim()
  if (desc) {
    return splitParagraphs(desc, 3)
  }

  return ['该项目正在持续完善介绍内容，后续会补充更完整的背景说明与实现细节。']
}

function buildBackgroundHighlights(
  project: Project,
  techStack: string[],
  preset: ProjectShowcasePartial,
  custom: ProjectShowcasePartial | null,
): string[] {
  if (custom?.background?.highlights?.length) {
    return custom.background.highlights
  }
  if (preset.background?.highlights?.length) {
    return preset.background.highlights
  }

  const fromDescription = project.description ? parseDescriptionHighlights(project.description) : []
  if (fromDescription.length > 0) {
    return fromDescription
  }

  if (techStack.length > 0) {
    return techStack.slice(0, 6)
  }

  return ['核心功能', '稳定架构', '持续迭代']
}

function buildDefaultPitch(
  project: Project,
  paragraphs: string[],
  achievements: ProjectShowcaseStat[],
  challenges: ProjectShowcaseChallenge[],
): ProjectShowcasePitch {
  const what = paragraphs[0]
    || project.description?.trim()
    || `${project.title} 面向真实业务场景开发，聚焦可用性与可维护性。`

  const fromChallenges = challenges
    .map(item => item.challenge.trim())
    .filter(Boolean)
    .slice(0, 3)

  const problems = fromChallenges.length > 0
    ? fromChallenges
    : [
      '现有工具或流程分散，使用与维护成本偏高',
      '关键数据难以汇总，决策与复盘缺少依据',
      '体验与扩展性不足，难以支撑持续迭代',
    ]

  const outcomes = achievements.length > 0
    ? achievements.slice(0, 4)
    : [
      { icon: '✅', value: '可落地', label: '完整交付', tone: 'green' as const },
      { icon: '🛠️', value: '可维护', label: '清晰架构', tone: 'blue' as const },
      { icon: '📈', value: '可扩展', label: '持续迭代', tone: 'purple' as const },
      { icon: '⚡', value: '可体验', label: '核心闭环', tone: 'cyan' as const },
    ]

  return { what, problems, outcomes }
}

function mergePitch(
  project: Project,
  paragraphs: string[],
  achievements: ProjectShowcaseStat[],
  challenges: ProjectShowcaseChallenge[],
  preset: ProjectShowcasePartial,
  custom: ProjectShowcasePartial | null,
): ProjectShowcasePitch {
  const fallback = buildDefaultPitch(project, paragraphs, achievements, challenges)
  const legacy = ENABLE_LEGACY_SHOWCASE_PRESETS ? preset : {}

  return {
    // PRIMARY: custom JSON → DB description/paragraphs → legacy preset → generic
    what: custom?.pitch?.what
      || paragraphs[0]
      || project.description?.trim()
      || legacy.pitch?.what
      || fallback.what,
    problems: custom?.pitch?.problems?.length
      ? custom.pitch.problems
      : challenges.length > 0
        ? challenges.map(item => item.challenge).filter(Boolean).slice(0, 3)
        : legacy.pitch?.problems?.length
          ? legacy.pitch.problems
          : fallback.problems,
    outcomes: custom?.pitch?.outcomes?.length
      ? custom.pitch.outcomes
      : achievements.length > 0
        ? achievements.slice(0, 4)
        : legacy.pitch?.outcomes?.length
          ? legacy.pitch.outcomes
          : fallback.outcomes,
  }
}

function mergeShowcase(
  project: Project,
  techStack: string[],
  preset: ProjectShowcasePartial,
  custom: ProjectShowcasePartial | null,
): ProjectShowcaseData {
  const resolvedCover = resolveProjectCoverUrl(project)
  const legacy = ENABLE_LEGACY_SHOWCASE_PRESETS ? preset : {}
  const dbParagraphs = extractReadableParagraphs(project)

  const mergedBackgroundParagraphs = ensureBackgroundParagraphs(
    project,
    custom?.background?.paragraphs
      || (dbParagraphs.length ? dbParagraphs : undefined)
      || legacy.background?.paragraphs
      || [],
  )

  const backgroundHighlights = buildBackgroundHighlights(project, techStack, legacy, custom)

  const backgroundTitle = custom?.background?.title
    || '项目背景'

  // CONTENT priority: custom → DB-derived → legacy preset → presentation defaults
  const features = custom?.features?.length
    ? custom.features
    : techStack.length >= 2
      ? buildDefaultFeatures(project, techStack)
      : legacy.features?.length
        ? legacy.features
        : buildDefaultFeatures(project, techStack)

  const overview = custom?.overview?.length
    ? custom.overview
    : buildDefaultOverview(project, techStack)

  const achievements = custom?.achievements?.length
    ? custom.achievements
    : legacy.achievements?.length
      ? legacy.achievements
      : overview

  const timeline = custom?.timeline?.length
    ? custom.timeline
    : [
        { date: formatMonth(project.createdAt), title: '项目启动' },
        { date: formatMonth(project.updatedAt || project.createdAt), title: '最近更新' },
      ]

  // Do not invent narrative challenges when DB/custom has none — legacy preset only as COMPAT fill
  const challenges = custom?.challenges?.length
    ? custom.challenges
    : legacy.challenges?.length
      ? legacy.challenges
      : []

  const roadmap = custom?.roadmap?.length
    ? custom.roadmap
    : legacy.roadmap?.length
      ? legacy.roadmap
      : []

  const architecture = custom?.architecture?.length
    ? custom.architecture
    : techStack.length > 0
      ? buildArchitectureLayers(techStack)
      : legacy.architecture?.length
        ? legacy.architecture
        : buildArchitectureLayers(techStack)

  const screenshots = custom?.screenshots?.length
    ? custom.screenshots
    : legacy.screenshots?.length
      ? legacy.screenshots
      : []

  const backgroundImage = custom?.background?.imageUrl
    || resolvedCover
    || legacy.background?.imageUrl

  const pitch = mergePitch(
    project,
    mergedBackgroundParagraphs,
    achievements,
    challenges,
    legacy,
    custom,
  )

  return {
    heroEyebrow: custom?.heroEyebrow || legacy.heroEyebrow,
    heroFloats: custom?.heroFloats || legacy.heroFloats,
    pitch,
    overview,
    background: {
      title: backgroundTitle,
      paragraphs: mergedBackgroundParagraphs,
      imageUrl: backgroundImage,
      highlights: backgroundHighlights,
    },
    features,
    screenshots,
    architecture,
    timeline,
    challenges,
    achievements,
    roadmap,
    cta: custom?.cta || legacy.cta || {
      title: `准备好体验 ${project.title} 了吗？`,
      subtitle: project.demoUrl
        ? '点击演示链接，亲自感受项目的核心能力与交互细节。'
        : '欢迎联系获取演示说明与更多项目资料。',
    },
  }
}

export function buildProjectShowcase(project: Project): ProjectShowcaseData {
  const fields = normalizeProjectFields(project)
  const normalizedProject: Project = {
    ...project,
    title: fields.title || project.title,
    coverUrl: project.coverUrl,
  }

  const techStack = parseTechStack(fields.techStack ?? project.techStack)
  const preset = getProjectShowcasePreset(normalizedProject)
  const custom = extractShowcaseFromContent(project.content)

  return mergeShowcase(normalizedProject, techStack, preset, custom)
}

export function parseProjectTechStack(project: Project): string[] {
  const fields = normalizeProjectFields(project)
  return parseTechStack(fields.techStack ?? project.techStack)
}

export function getProjectStatusText(status: string | undefined): string {
  return getStatusLabel(status)
}

export function getProjectStatusClass(status: string | undefined): string {
  const value = (status || '').toLowerCase()

  if (value.includes('active') || value.includes('running') || value.includes('online') || value.includes('维护')) {
    return 'ps-showcase-status--active'
  }
  if (value.includes('beta') || value.includes('测试')) {
    return 'ps-showcase-status--beta'
  }
  if (value.includes('done') || value.includes('complete') || value.includes('finished')) {
    return 'ps-showcase-status--done'
  }

  return 'ps-showcase-status--default'
}

export const useProjectShowcase = () => ({
  buildProjectShowcase,
  parseProjectTechStack,
  getProjectStatusText,
  getProjectStatusClass,
})
