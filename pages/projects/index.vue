<template>
  <div class="projects-page">
    <div class="projects-background-noise"></div>
    <div class="projects-background">
      <div class="projects-background-blob projects-background-blob--blue"></div>
      <div class="projects-background-blob projects-background-blob--emerald"></div>
      <div class="projects-background-blob projects-background-blob--violet"></div>
      <div class="projects-background-grid"></div>
    </div>

    <div class="projects-view-toggle-container">
      <button
        v-if="viewMode === 'grid'"
        class="projects-view-toggle-button"
        title="切换到 3D 视图"
        @click.stop.prevent="handleToggle3DView"
      >
        <span class="projects-view-toggle-icon">◌</span>
        <span class="projects-view-toggle-text">3D 视图</span>
      </button>
    </div>

    <template v-if="viewMode === '3d' && !loading && projects.length > 0">
      <ClientOnly>
        <component
          :is="project3DSpaceComponent"
          v-if="project3DSpaceComponent"
          :projects="projects"
          @back-to-list="viewMode = 'grid'"
        />
      </ClientOnly>
    </template>

    <div v-else class="projects-shell">
      <section class="projects-hero">
        <div class="projects-hero-copy">
          <div class="projects-hero-badge">
            <span class="projects-hero-badge-dot"></span>
            项目案例
          </div>
          <h1 class="projects-title">我做过什么：真实项目与能力证明</h1>
          <p class="projects-subtitle">
            这里讲背景、角色、方案与结果。想直接使用成品，请去「产品」；轻量单功能工具在「工具」。
          </p>

          <div class="projects-hero-actions">
            <a href="#projects-grid" class="projects-hero-button projects-hero-button--primary">
              浏览项目
            </a>
            <button
              type="button"
              class="projects-hero-button projects-hero-button--secondary"
              @click.stop.prevent="handleToggle3DView"
            >
              进入 3D 展厅
            </button>
          </div>
        </div>

        <div class="projects-hero-panel">
          <div class="projects-hero-panel-head">
            <span class="projects-hero-panel-kicker">Snapshot</span>
            <span class="projects-hero-panel-status">Live</span>
          </div>
          <div class="projects-hero-metrics">
            <article class="projects-metric-card">
              <span class="projects-metric-value">{{ totalProjects }}</span>
              <span class="projects-metric-label">项目总数</span>
            </article>
            <article class="projects-metric-card">
              <span class="projects-metric-value">{{ activeProjects }}</span>
              <span class="projects-metric-label">持续维护</span>
            </article>
            <article class="projects-metric-card">
              <span class="projects-metric-value">{{ githubProjects }}</span>
              <span class="projects-metric-label">GitHub 仓库</span>
            </article>
            <article class="projects-metric-card">
              <span class="projects-metric-value">{{ techTagCount }}</span>
              <span class="projects-metric-label">技术标签</span>
            </article>
          </div>

          <div class="projects-hero-highlight" v-if="featuredProjects.length > 0">
            <p class="projects-hero-highlight-title">本页精选</p>
            <ul class="projects-hero-highlight-list">
              <li
                v-for="project in featuredProjects"
                :key="project.id"
                class="projects-hero-highlight-item"
              >
                <span class="projects-hero-highlight-name">{{ project.title }}</span>
                <span class="projects-hero-highlight-meta">{{ getPrimaryTech(project) }}</span>
              </li>
            </ul>
          </div>
        </div>
      </section>

      <section class="projects-showcase">
        <article class="projects-showcase-card">
          <span class="projects-showcase-label">Build</span>
          <h2 class="projects-showcase-title">项目列表不是堆卡片，而是一面技术能力墙</h2>
          <p class="projects-showcase-text">
            我把产品型项目、工具型项目和实验性项目放在同一张画布里，让用户一眼看到“做过什么”、“做到多深”、“现在还在不在继续做”。
          </p>
        </article>
        <article class="projects-showcase-card">
          <span class="projects-showcase-label">Depth</span>
          <h2 class="projects-showcase-title">从视觉到信息层次都更明确</h2>
          <p class="projects-showcase-text">
            顶部摘要先讲整体轮廓，列表卡片再讲每个项目的状态、技术栈、访问热度和代码活跃度，浏览路径会更顺。
          </p>
        </article>
      </section>

      <section class="projects-state" v-if="loading">
        <div class="projects-loading-spinner"></div>
        <p class="projects-state-title">项目正在加载中</p>
        <p class="projects-state-text">正在同步作品信息与活跃数据，请稍等片刻。</p>
      </section>

      <section v-else-if="error" class="projects-state projects-state--error">
        <p class="projects-state-title">加载失败</p>
        <p class="projects-state-text">{{ error }}</p>
      </section>

      <section v-else-if="projects.length === 0" class="projects-state">
        <div class="projects-empty-icon">⌁</div>
        <p class="projects-state-title">暂时还没有项目</p>
        <p class="projects-state-text">项目列表为空时，会在这里显示第一批作品。</p>
      </section>

      <section v-else id="projects-grid" class="projects-grid-section">
        <div class="projects-grid-head">
          <div>
            <p class="projects-grid-kicker">Project Index</p>
            <h2 class="projects-grid-title">正在公开展示的项目</h2>
          </div>
          <p class="projects-grid-summary">
            共 {{ projects.length }} 个项目，优先展示有持续维护迹象和明确技术栈的作品。
          </p>
        </div>

        <div class="projects-grid">
          <NuxtLink
            v-for="project in projects"
            :key="project.id"
            :to="getProjectDetailPath(project)"
            class="projects-card"
          >
            <div
              class="projects-card-cover"
              :class="getProjectToneClass(project)"
            >
              <img
                :src="project.coverUrl"
                :alt="`${project.title} 封面`"
                class="projects-card-cover-image"
                :class="{ 'projects-card-cover-image--designed': isDesignedCover(project.coverUrl) }"
                width="640"
                height="400"
                loading="lazy"
                decoding="async"
                @error="handleCoverError($event, project)"
              />

              <div class="projects-card-cover-overlay">
                <div class="projects-card-status" :class="getStatusClass(project.status)">
                  {{ getStatusText(project.status) }}
                </div>
                <div class="projects-card-cover-actions">
                  <a
                    v-if="project.demoUrl"
                    :href="project.demoUrl"
                    target="_blank"
                    rel="noopener noreferrer"
                    class="projects-card-cover-button projects-card-cover-button--light"
                    @click.stop
                  >
                    演示
                  </a>
                  <a
                    v-if="project.githubUrl"
                    :href="project.githubUrl"
                    target="_blank"
                    rel="noopener noreferrer"
                    class="projects-card-cover-button projects-card-cover-button--dark"
                    @click.stop
                  >
                    GitHub
                  </a>
                </div>
              </div>
            </div>

            <div class="projects-card-body">
              <div class="projects-card-header">
                <div>
                  <h3 class="projects-card-title">{{ project.title }}</h3>
                  <p class="projects-card-eyebrow">{{ getProjectEyebrow(project) }}</p>
                </div>
                <div class="projects-card-views">
                  <i class="fas fa-eye"></i>
                  {{ project.viewCount || 0 }}
                </div>
              </div>

              <p class="projects-card-description">
                {{ project.description || '这个项目正在持续完善中，稍后会补充更完整的介绍。' }}
              </p>

              <div class="projects-card-tech-section" v-if="project.techStack.length > 0">
                <div class="projects-card-tech-label">技术栈</div>
                <div class="projects-card-tech-stack">
                <span
                  v-for="tech in project.techStack.slice(0, 4)"
                  :key="tech"
                  class="projects-tech-tag"
                  :class="getTechTagClass(tech)"
                >
                  <span class="projects-tech-tag-icon">{{ getTechIcon(tech) }}</span>
                  {{ tech }}
                </span>
                  <span
                    v-if="project.techStack.length > 4"
                    class="projects-tech-tag projects-tech-tag--more"
                  >
                    +{{ project.techStack.length - 4 }}
                  </span>
                </div>
              </div>

              <div v-if="project.githubUrl && project.chartData" class="projects-card-chart">
                <div class="projects-card-chart-head">
                  <span class="projects-card-chart-label">GitHub Activity</span>
                  <span class="projects-card-chart-value">最近半年</span>
                </div>
                <div class="projects-card-chart-container">
                  <ClientOnly>
                    <ChartsAppEChart
                      :option="buildGithubChartOption(project.chartData)"
                      loading-text="图表加载中..."
                    />
                  </ClientOnly>
                </div>
              </div>

              <div class="projects-card-footer">
                <span class="projects-card-link-text">查看项目详情</span>
                <span class="projects-card-link-icon">→</span>
              </div>
            </div>
          </NuxtLink>
        </div>
      </section>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Component } from 'vue'
import '~/assets/css/projects.css'

definePageMeta({
  layout: 'default'
})

import type { Project } from '~/types/api'
import {
  getProjectDetailPath,
  mergeShowcaseProjects,
  type ShowcaseProject,
} from '~/constants/projects/showcaseExtras'
import { applyProjectCover, isDesignedProjectCover, resolveProjectCoverUrl } from '~/constants/projects/covers'

interface GithubChartDataset {
  label: string
  data: number[]
  backgroundColor: string
  hoverBackgroundColor: string
}

interface GithubChartData {
  labels: string[]
  datasets: GithubChartDataset[]
}

interface ProjectCard extends ShowcaseProject {
  techStack: string[]
  chartData?: GithubChartData
}

const api = useApi()
usePageStyle('projects')

const projects = ref<ProjectCard[]>([])
const loading = ref(false)
const error = ref('')
const viewMode = ref<'grid' | '3d'>('grid')
const project3DSpaceComponent = shallowRef<Component | null>(null)

const totalProjects = computed(() => projects.value.length)
const activeProjects = computed(() =>
  projects.value.filter(project => getStatusClass(project.status) === 'projects-card-status--active').length
)
const githubProjects = computed(() =>
  projects.value.filter(project => Boolean(project.githubUrl)).length
)
const techTagCount = computed(() => {
  const tags = new Set(projects.value.flatMap(project => project.techStack))
  return tags.size
})
const featuredProjects = computed(() =>
  [...projects.value]
    .sort((a, b) => (b.viewCount || 0) - (a.viewCount || 0))
    .slice(0, 3)
)

const buildGithubChartOption = (chartData?: GithubChartData) => ({
  animation: false,
  tooltip: { trigger: 'axis' },
  grid: { left: 0, right: 0, top: 8, bottom: 0, containLabel: false },
  xAxis: {
    type: 'category',
    data: chartData?.labels || [],
    show: false
  },
  yAxis: {
    type: 'value',
    show: false
  },
  series: [
    {
      type: 'bar',
      barWidth: '48%',
      itemStyle: {
        color: chartData?.datasets?.[0]?.backgroundColor || 'rgba(96, 165, 250, 0.88)',
        borderRadius: [99, 99, 99, 99]
      },
      emphasis: {
        itemStyle: {
          color: chartData?.datasets?.[0]?.hoverBackgroundColor || 'rgba(52, 211, 153, 0.96)'
        }
      },
      data: chartData?.datasets?.[0]?.data || []
    }
  ]
})

const handleToggle3DView = () => {
  if (!project3DSpaceComponent.value) {
    import('~/components/three/Project3DSpace.vue').then(module => {
      project3DSpaceComponent.value = module.default
    })
  }

  viewMode.value = '3d'
}

const normalizeTechStack = (techStack: unknown): string[] => {
  const cleanTechTag = (value: string) => value
    .replace(/^[\[\(\{'"`\s]+/, '')
    .replace(/[\]\)\}'"`\s]+$/, '')
    .replace(/^["']+|["']+$/g, '')
    .replace(/^["']|["']$/g, '') // 去除首尾单个引号（如 JSON 解析残留）
    .trim()

  if (typeof techStack === 'string') {
    // 尝试解析 JSON 数组（如 "[\"TypeScript\", \"Vue 3\"]"）
    const trimmed = techStack.trim()
    if (trimmed.startsWith('[') && trimmed.endsWith(']')) {
      try {
        const parsed = JSON.parse(trimmed) as unknown[]
        return (Array.isArray(parsed) ? parsed : [])
          .filter((item): item is string => typeof item === 'string')
          .map(item => cleanTechTag(item))
          .filter(Boolean)
      } catch {
        // 解析失败则按逗号分割
      }
    }
    return techStack
      .split(',')
      .map(item => cleanTechTag(item))
      .filter(Boolean)
  }

  if (Array.isArray(techStack)) {
    return techStack
      .filter((item): item is string => typeof item === 'string')
      .map(item => cleanTechTag(item))
      .filter(Boolean)
  }

  return []
}

const normalizeTitleKey = (title: string | undefined) => (title || '').trim().toLowerCase().replace(/\s+/g, '')

const duplicateMap: Record<string, string[]> = {
  '个人数字资产平台': ['个人网站系统', '个人网站v2'],
  'ai创作助手': ['ai智能助手'],
  '访客分析系统（analytics）': ['访客分析系统']
}

const dedupeProjects = (items: ProjectCard[]) => {
  const titleMap = new Map<string, ProjectCard>()

  items.forEach(project => {
    const normalizedTitle = normalizeTitleKey(project.title)
    if (!normalizedTitle) {
      return
    }

    const current = titleMap.get(normalizedTitle)
    if (!current) {
      titleMap.set(normalizedTitle, project)
      return
    }

    const currentDate = new Date(project.createdAt || 0)
    const existingDate = new Date(current.createdAt || 0)

    if (currentDate < existingDate) {
      titleMap.set(normalizedTitle, project)
    }
  })

  const uniqueProjects = Array.from(titleMap.values())
  const finalProjects: ProjectCard[] = []
  const seenTitles = new Set<string>()

  uniqueProjects.forEach(project => {
    const normalizedTitle = normalizeTitleKey(project.title)

    let shouldExclude = false
    for (const [keepTitle, excludeTitles] of Object.entries(duplicateMap)) {
      const keepNormalized = normalizeTitleKey(keepTitle)
      const isExcluded = excludeTitles.some(exclude =>
        normalizedTitle.includes(normalizeTitleKey(exclude))
      )
      const isKept = seenTitles.has(keepNormalized) || normalizedTitle.includes(keepNormalized)

      if (isExcluded && isKept) {
        shouldExclude = true
        break
      }
    }

    if (!shouldExclude) {
      finalProjects.push(project)
      seenTitles.add(normalizedTitle)
    }
  })

  return finalProjects
}

const fetchProjects = async () => {
  try {
    loading.value = true
    error.value = ''

    const response = await api.get<Project[]>('/Projects')

    if (!Array.isArray(response)) {
      projects.value = []
      error.value = 'API 返回格式错误'
      return
    }

    const processedProjects: ProjectCard[] = response.map(project => applyProjectCover({
      ...project,
      techStack: normalizeTechStack(project.techStack),
    }))

    projects.value = dedupeProjects(mergeShowcaseProjects(processedProjects)).map(project => applyProjectCover(project))
  } catch (fetchError: unknown) {
    const message = fetchError instanceof Error ? fetchError.message : 'Failed to load projects'
    error.value = message
    projects.value = []
  } finally {
    loading.value = false
  }
}

const getTechTagClass = (tech: string) => {
  const value = tech.toLowerCase()

  if (value.includes('vue') || value.includes('react') || value.includes('angular') || value.includes('nuxt') || value.includes('next')) {
    return 'projects-tech-tag--vue'
  }
  if (value.includes('javascript') || value.includes('typescript') || value.includes(' js') || value.includes(' ts')) {
    return 'projects-tech-tag--js'
  }
  if (value.includes('python')) {
    return 'projects-tech-tag--python'
  }
  if (value.includes('node') || value.includes('express')) {
    return 'projects-tech-tag--node'
  }
  if (value.includes('mysql') || value.includes('postgresql') || value.includes('mongodb') || value.includes('redis')) {
    return 'projects-tech-tag--database'
  }
  if (value.includes('spring') || value.includes('fastapi') || value.includes('django') || value.includes('flask') || value.includes('.net')) {
    return 'projects-tech-tag--framework'
  }
  if (value.includes('小程序') || value.includes('wechat') || value.includes('miniprogram')) {
    return 'projects-tech-tag--miniprogram'
  }
  if (value.includes('chrome') || value.includes('extension') || value.includes('manifest')) {
    return 'projects-tech-tag--js'
  }
  if (value.includes('ai') || value.includes('ml') || value.includes('langchain') || value.includes('openai')) {
    return 'projects-tech-tag--ai'
  }

  return 'projects-tech-tag--default'
}

const getTechIcon = (tech: string) => {
  const value = tech.toLowerCase()

  if (value.includes('vue')) return 'V'
  if (value.includes('react')) return 'R'
  if (value.includes('python')) return 'Py'
  if (value.includes('node')) return 'N'
  if (value.includes('mysql')) return 'DB'
  if (value.includes('redis')) return 'Re'
  if (value.includes('小程序')) return 'MP'
  if (value.includes('ai') || value.includes('langchain')) return 'AI'
  if (value.includes('spring')) return 'Sp'
  if (value.includes('docker')) return 'Dc'
  if (value.includes('git')) return 'Gt'

  return '•'
}

const getStatusText = (status: string | undefined) => {
  const value = (status || '').toLowerCase()

  if (!value) return '进行中'
  if (value.includes('active') || value.includes('running') || value.includes('online') || value.includes('维护')) return '持续维护'
  if (value.includes('beta') || value.includes('测试')) return '测试阶段'
  if (value.includes('done') || value.includes('complete') || value.includes('finished')) return '已完成'
  if (value.includes('plan') || value.includes('draft')) return '规划中'

  return status || '进行中'
}

const getStatusClass = (status: string | undefined) => {
  const value = (status || '').toLowerCase()

  if (value.includes('active') || value.includes('running') || value.includes('online') || value.includes('维护')) {
    return 'projects-card-status--active'
  }
  if (value.includes('beta') || value.includes('测试')) {
    return 'projects-card-status--beta'
  }
  if (value.includes('done') || value.includes('complete') || value.includes('finished')) {
    return 'projects-card-status--done'
  }

  return 'projects-card-status--default'
}

const getPrimaryTech = (project: ProjectCard) => project.techStack[0] || 'Project'

const getProjectToneClass = (project: ProjectCard) => {
  const tech = project.techStack.join(' ').toLowerCase()
  const title = (project.title || '').toLowerCase()
  const id = String(project.id).toLowerCase()

  if (id === 'mindtrace' || tech.includes('chrome') || tech.includes('extension')) {
    return 'projects-card-cover--extension'
  }
  if (tech.includes('three') || tech.includes('webgl') || title.includes('实验室') || title.includes('lab')) {
    return 'projects-card-cover--lab'
  }
  if (tech.includes('ai') || title.includes('ai')) return 'projects-card-cover--ai'
  if (tech.includes('vue') || tech.includes('react') || tech.includes('nuxt')) return 'projects-card-cover--web'
  if (tech.includes('.net') || tech.includes('mysql') || tech.includes('redis')) return 'projects-card-cover--data'

  return 'projects-card-cover--default'
}

const getProjectEyebrow = (project: ProjectCard) => {
  const parts = [getStatusText(project.status)]
  if (project.githubUrl) parts.push('开源')
  if (project.demoUrl) parts.push('可体验')
  return parts.join(' · ')
}

const isDesignedCover = (coverUrl?: string) => isDesignedProjectCover(coverUrl)

const handleCoverError = (event: Event, project: ProjectCard) => {
  const target = event.target as HTMLImageElement | null
  if (!target || target.dataset.fallbackApplied === 'true') {
    return
  }
  target.dataset.fallbackApplied = 'true'
  target.src = resolveProjectCoverUrl({
    ...project,
    coverUrl: undefined,
  })
}

const githubStatsCache = useState<Record<string, { total: number; week: number }[]>>(
  'github-stats-cache',
  () => ({})
)

const loadGithubStats = async () => {
  // 提取每个项目对应的 repo slug，过滤无效项
  const repoMap = projects.value.reduce<{ project: typeof projects.value[0]; repo: string }[]>((acc, project) => {
    if (!project.githubUrl) return acc
    const match = project.githubUrl.match(/github\.com\/([^/]+\/[^/?#]+)/)
    if (match) acc.push({ project, repo: match[1] })
    return acc
  }, [])

  // 只请求未缓存的 repo（去重 + 跳过已有数据）
  const uncachedRepos = [...new Set(repoMap.map(r => r.repo))].filter(repo => !githubStatsCache.value[repo])

  await Promise.allSettled(
    uncachedRepos.map(async (repo) => {
      const stats = await api.get<{ total: number; week: number }[]>(`/github/stats?repo=${repo}`)
      if (Array.isArray(stats)) {
        githubStatsCache.value[repo] = stats
      }
    })
  )

  // 从缓存写入 chartData
  for (const { project, repo } of repoMap) {
    const stats = githubStatsCache.value[repo]
    if (!stats) continue
    const recentStats = stats.slice(-26)
    project.chartData = {
      labels: recentStats.map(item => new Date(item.week * 1000).toLocaleDateString()),
      datasets: [
        {
          label: 'Commits',
          data: recentStats.map(item => item.total),
          backgroundColor: 'rgba(96, 165, 250, 0.88)',
          hoverBackgroundColor: 'rgba(52, 211, 153, 0.96)'
        }
      ]
    }
  }
}

await fetchProjects()

onMounted(async () => {
  void loadGithubStats()
})

usePageSeo({
  title: '项目案例 - 溪午听风',
  description: '真实项目与案例：背景、角色、技术方案与能力证明。',
  path: '/projects',
  world: 'work',
})
</script>

<style scoped>
/* 页面主要样式已移至 assets/css/projects.css */
</style>
