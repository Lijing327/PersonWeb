<template>
  <div class="ps-showcase ps-showcase--compact">
    <div class="ps-showcase-bg">
      <div class="ps-showcase-bg-glow ps-showcase-bg-glow--blue"></div>
      <div class="ps-showcase-bg-glow ps-showcase-bg-glow--violet"></div>
    </div>

    <div class="ps-showcase-shell">
      <NuxtLink to="/projects" class="ps-showcase-back">
        <i class="fas fa-arrow-left"></i>
        返回项目展示
      </NuxtLink>

      <!-- 首屏：标题信息 + 大图封面 -->
      <section class="ps-showcase-hero ps-showcase-card">
        <div class="ps-showcase-hero-grid">
          <div class="ps-showcase-hero-body">
            <p v-if="showcase.heroEyebrow" class="ps-showcase-kicker">{{ showcase.heroEyebrow }}</p>
            <h1 class="ps-showcase-title">{{ project.title }}</h1>
            <p class="ps-showcase-lead">{{ heroTagline }}</p>

            <div class="ps-showcase-stat-inline">
              <div
                v-for="item in showcase.overview"
                :key="item.label"
                class="ps-showcase-stat-inline-item"
              >
                <span class="ps-showcase-stat-inline-value">{{ item.value }}</span>
                <span class="ps-showcase-stat-inline-label">{{ item.label }}</span>
              </div>
            </div>

            <div v-if="showcase.background.highlights?.length" class="ps-showcase-highlight-row">
              <span
                v-for="item in showcase.background.highlights.slice(0, 6)"
                :key="item"
                class="ps-showcase-background-highlight"
              >
                {{ item }}
              </span>
            </div>

            <div class="ps-showcase-hero-footer">
              <div v-if="techStack.length" class="ps-showcase-tags">
                <span v-for="tech in techStack" :key="tech" class="ps-showcase-tag">{{ tech }}</span>
              </div>
              <div class="ps-showcase-actions">
                <a
                  v-if="project.demoUrl"
                  :href="project.demoUrl"
                  target="_blank"
                  rel="noreferrer"
                  class="ps-showcase-btn ps-showcase-btn--primary"
                >
                  <i class="fas fa-external-link-alt"></i>
                  在线体验
                </a>
                <a
                  v-if="project.githubUrl"
                  :href="project.githubUrl"
                  target="_blank"
                  rel="noreferrer"
                  class="ps-showcase-btn ps-showcase-btn--ghost"
                >
                  <i class="fab fa-github"></i>
                  源码
                </a>
                <NuxtLink to="/projects" class="ps-showcase-btn ps-showcase-btn--ghost">
                  更多案例
                </NuxtLink>
              </div>
            </div>
          </div>

          <div v-if="coverUrl" class="ps-showcase-hero-cover">
            <img
              :src="coverUrl"
              :alt="`${project.title} 封面`"
              class="ps-showcase-hero-cover-image"
              :class="{ 'ps-showcase-hero-cover-image--designed': isDesignedCover }"
              width="960"
              height="600"
              fetchpriority="high"
              decoding="async"
              @error="handleCoverError"
            />
          </div>
        </div>
      </section>

      <!-- 项目价值：做什么 / 解决什么 / 达到什么效果 -->
      <section class="ps-showcase-pitch ps-showcase-card" aria-label="项目价值说明">
        <div class="ps-showcase-pitch-col">
          <h2 class="ps-showcase-pitch-heading">
            <span class="ps-showcase-pitch-num">01</span>
            这个项目做什么
          </h2>
          <p class="ps-showcase-pitch-text">{{ showcase.pitch.what }}</p>
        </div>

        <div class="ps-showcase-pitch-col">
          <h2 class="ps-showcase-pitch-heading">
            <span class="ps-showcase-pitch-num">02</span>
            解决什么问题
          </h2>
          <ul class="ps-showcase-pitch-list">
            <li v-for="item in showcase.pitch.problems" :key="item">{{ item }}</li>
          </ul>
        </div>

        <div class="ps-showcase-pitch-col">
          <h2 class="ps-showcase-pitch-heading">
            <span class="ps-showcase-pitch-num">03</span>
            达到什么效果
          </h2>
          <div class="ps-showcase-outcome-grid">
            <div
              v-for="item in showcase.pitch.outcomes"
              :key="item.label"
              class="ps-showcase-outcome-item"
            >
              <span class="ps-showcase-outcome-icon">{{ item.icon }}</span>
              <span class="ps-showcase-outcome-value">{{ item.value }}</span>
              <span class="ps-showcase-outcome-label">{{ item.label }}</span>
            </div>
          </div>
        </div>
      </section>

      <!-- 主体：功能 + 侧栏技术信息 -->
      <section class="ps-showcase-main">
        <div class="ps-showcase-main-content ps-showcase-card">
          <h2 class="ps-showcase-block-title">核心功能</h2>
          <ul class="ps-showcase-feature-list">
            <li
              v-for="feature in showcase.features.slice(0, 6)"
              :key="feature.title"
              class="ps-showcase-feature-item"
            >
              <span class="ps-showcase-feature-item-icon">{{ feature.icon }}</span>
              <div>
                <strong class="ps-showcase-feature-item-title">{{ feature.title }}</strong>
                <p class="ps-showcase-feature-item-desc">{{ feature.description }}</p>
              </div>
            </li>
          </ul>
        </div>

        <aside class="ps-showcase-aside">
          <div class="ps-showcase-aside-panel ps-showcase-card">
            <h3 class="ps-showcase-aside-title">技术架构</h3>
            <div class="ps-showcase-arch-compact">
              <span
                v-for="(layer, index) in showcase.architecture"
                :key="layer.label"
                class="ps-showcase-arch-chip"
              >
                <template v-if="index > 0">→</template>
                {{ layer.label }}
              </span>
            </div>
          </div>

          <div class="ps-showcase-aside-panel ps-showcase-card">
            <h3 class="ps-showcase-aside-title">项目状态</h3>
            <div class="ps-showcase-aside-meta">
              <span class="ps-showcase-status" :class="statusClass">{{ statusText }}</span>
              <span class="ps-showcase-pill">
                <i class="fas fa-eye"></i>
                {{ project.viewCount || 0 }} 次浏览
              </span>
            </div>
          </div>
        </aside>
      </section>

      <!-- 产品截图（仅有真实截图时） -->
      <section v-if="showcase.screenshots.length" class="ps-showcase-block">
        <h2 class="ps-showcase-block-title">产品截图</h2>
        <div class="ps-showcase-screenshot-row">
          <figure
            v-for="shot in showcase.screenshots"
            :key="shot.caption"
            class="ps-showcase-screenshot-card ps-showcase-card"
          >
            <img :src="shot.url" :alt="shot.caption" class="ps-showcase-screenshot-image" loading="lazy" />
            <figcaption class="ps-showcase-screenshot-caption">{{ shot.caption }}</figcaption>
          </figure>
        </div>
      </section>

      <!-- 次要信息：默认折叠，不强迫客户读完 -->
      <details class="ps-showcase-details ps-showcase-card">
        <summary class="ps-showcase-details-summary">
          <span>技术细节与版本规划</span>
          <span class="ps-showcase-details-hint">可选阅读</span>
        </summary>

        <div class="ps-showcase-details-body">
          <div v-if="extraIntro.length" class="ps-showcase-details-section">
            <h3 class="ps-showcase-details-title">背景补充</h3>
            <p v-for="(p, i) in extraIntro" :key="i" class="ps-showcase-paragraph">{{ p }}</p>
          </div>

          <div class="ps-showcase-details-section">
            <h3 class="ps-showcase-details-title">开发历程</h3>
            <div class="ps-showcase-timeline-compact">
              <span
                v-for="(item, index) in showcase.timeline"
                :key="`${item.date}-${item.title}`"
                class="ps-showcase-timeline-chip"
              >
                <template v-if="index > 0">·</template>
                {{ item.date }} {{ item.title }}
              </span>
            </div>
          </div>

          <div v-if="showcase.challenges.length" class="ps-showcase-details-section">
            <h3 class="ps-showcase-details-title">技术挑战</h3>
            <ul class="ps-showcase-challenge-list">
              <li v-for="item in showcase.challenges" :key="item.title">
                <strong>{{ item.title }}</strong>
                <span>{{ item.solution }}</span>
              </li>
            </ul>
          </div>

          <div v-if="showcase.roadmap.length" class="ps-showcase-details-section">
            <h3 class="ps-showcase-details-title">版本规划</h3>
            <div class="ps-showcase-roadmap-compact">
              <div
                v-for="item in showcase.roadmap"
                :key="item.version"
                class="ps-showcase-roadmap-compact-item"
              >
                <span class="ps-showcase-roadmap-version">{{ item.version }}</span>
                <span class="ps-showcase-roadmap-status">{{ item.statusLabel }}</span>
                <span class="ps-showcase-roadmap-points">{{ item.items.join(' / ') }}</span>
              </div>
            </div>
          </div>
        </div>
      </details>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Project } from '~/types/api'
import { resolveProjectCoverUrl, isDesignedProjectCover } from '~/constants/projects/covers'
import {
  buildProjectShowcase,
  getProjectStatusClass,
  getProjectStatusText,
  parseProjectTechStack,
} from '~/composables/useProjectShowcase'
import '~/assets/css/project-showcase.css'
import '~/assets/css/project-showcase-compact.css'

const props = defineProps<{
  project: Project
}>()

const showcase = computed(() => buildProjectShowcase(props.project))
const techStack = computed(() => parseProjectTechStack(props.project))
const statusText = computed(() => getProjectStatusText(props.project.status))
const statusClass = computed(() => getProjectStatusClass(props.project.status))

const coverUrl = computed(() => resolveProjectCoverUrl(props.project))
const isDesignedCover = computed(() => isDesignedProjectCover(coverUrl.value))

const heroTagline = computed(() => {
  const desc = props.project.description?.trim()
  if (desc) {
    const first = desc.split(/(?<=[。！？])/)[0]?.trim()
    if (first) return first
    return desc
  }
  const what = showcase.value.pitch.what
  const sentence = what.split(/(?<=[。！？])/)[0]?.trim()
  return sentence || what
})

const primaryIntro = computed(() => showcase.value.pitch.what)

const extraIntro = computed(() => {
  const paragraphs = showcase.value.background.paragraphs
  if (paragraphs.length > 1) return paragraphs.slice(1)
  const desc = props.project.description?.trim()
  if (desc && desc !== primaryIntro.value) return [desc]
  return []
})

const handleCoverError = (event: Event) => {
  const target = event.target as HTMLImageElement | null
  if (!target || target.dataset.fallbackApplied === 'true') return
  target.dataset.fallbackApplied = 'true'
  target.src = resolveProjectCoverUrl({ ...props.project, coverUrl: undefined })
}
</script>
