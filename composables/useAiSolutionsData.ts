/**
 * AI 解决方案页配置类型。
 * PRIMARY SoT: content/work/ai.yml via /api/content/work/ai
 */

export interface SolutionScenario {
  id: string
  title: string
  icon: string
  description: string
  examples?: string[]
}

export interface Capability {
  id: string
  title: string
  icon: string
  features?: string[]
}

export interface FeaturedProject {
  id: string
  title: string
  icon: string
  description: string
  highlights?: string[]
  status?: string
  path: string | null
}

export interface TechStackCategory {
  name: string
  icon: string
  items: string[]
}

export interface CooperationStep {
  title: string
  description: string
}

export interface WorkAssistantCopy {
  hub: {
    title: string
    triggerLabel: string
    items: Array<{
      id: string
      title: string
      description: string
      icon: string
      action: string
    }>
  }
  chat: {
    name: string
    statusOnline: string
    statusThinking: string
    welcome: {
      eyebrow: string
      title: string
      description: string
    }
    quickActions: Array<{ text: string, icon: string }>
    systemAbout: string
  }
}

export interface AiSolutionsPageConfig {
  badge: { text: string }
  title: string
  subtitle: string
  description: string
  heroActions: Array<{ label: string, href?: string, to?: string, variant?: string }>
  seo: {
    title: string
    description: string
  }
  scenarios: SolutionScenario[]
  capabilities: Capability[]
  featuredProjects: FeaturedProject[]
  techStackCategories: TechStackCategory[]
  cooperationSteps: CooperationStep[]
  cta: {
    text: string
    primaryButton: { text: string; path: string; icon: string }
    secondaryButton: { text: string; anchor: string; icon: string }
  }
  sectionTitles: {
    scenarios: string
    scenariosIcon: string
    scenariosNote: string
    capabilities: string
    capabilitiesIcon: string
    projects: string
    projectsIcon: string
    projectsNote: string
    projectsDescription: string
    techStack: string
    techStackIcon: string
    cooperation: string
    cooperationIcon: string
  }
  assistant: WorkAssistantCopy
}

/** 从 Work SoT 加载 AI 方案页（含 assistant UI 文案）。 */
export async function fetchAiSolutionsData(): Promise<AiSolutionsPageConfig> {
  return await $fetch<AiSolutionsPageConfig>('/api/content/work/ai')
}
