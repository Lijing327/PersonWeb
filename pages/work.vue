<template>
  <div class="home-page public-site-shell">
    <header class="home-header">
      <div class="home-header-inner">
        <NuxtLink to="/work" class="home-brand" aria-label="溪午听风工作站首页">
          <SiteBrandLogo variant="favicon" />
          <span class="home-brand-text">
            <strong>{{ home.brand.name }}</strong>
            <small>{{ home.brand.tagline }}</small>
          </span>
        </NuxtLink>

        <nav class="home-nav" aria-label="首页导航">
          <NuxtLink
            v-for="item in navItems"
            :key="item.href"
            :to="item.href"
            :class="{ 'is-active': isNavActive(item.href) }"
            :aria-current="isNavActive(item.href) ? 'page' : undefined"
          >
            {{ item.label }}
          </NuxtLink>
          <NavMoreMenu variant="home" />
        </nav>

        <div class="home-header-actions">
          <div class="home-nav-compact">
            <NavMoreMenu variant="home" label="菜单" :primary-items="homePrimaryForMenu" />
          </div>
          <NuxtLink to="/search" class="home-icon-button" aria-label="搜索">
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M10.8 4.2a6.6 6.6 0 1 0 4.12 11.76l3.55 3.55a1 1 0 0 0 1.42-1.42l-3.55-3.55A6.6 6.6 0 0 0 10.8 4.2Zm0 2a4.6 4.6 0 1 1 0 9.2 4.6 4.6 0 0 1 0-9.2Z" />
            </svg>
          </NuxtLink>
          <NuxtLink to="/contact" class="home-platform-button">
            联系合作
            <span aria-hidden="true">→</span>
          </NuxtLink>
        </div>
      </div>
    </header>

    <main class="work-main">
      <div class="work-deco" aria-hidden="true">
        <div class="work-deco-grid" />
        <div class="work-deco-orbit" />
        <div class="work-deco-dots" />
      </div>

      <div class="work-shell">
        <section class="work-section work-hero" aria-labelledby="work-hero-title">
          <div class="work-split">
            <div class="work-hero-copy">
              <p class="work-hero-kicker">{{ home.hero.kicker }}</p>
              <h1 id="work-hero-title" class="work-hero-title">{{ home.hero.title }}</h1>
              <p class="work-hero-en">{{ home.hero.englishName }}</p>
              <p class="work-hero-role">{{ home.hero.role }}</p>
              <p class="work-hero-value">
                {{ home.hero.value }}
              </p>
              <div class="work-hero-actions">
                <template v-for="action in home.hero.actions" :key="action.label">
                  <a
                    v-if="action.href"
                    :href="action.href"
                    class="work-hero-btn"
                    :class="action.variant === 'primary' ? 'work-hero-btn--primary' : 'work-hero-btn--secondary'"
                  >{{ action.label }}</a>
                  <NuxtLink
                    v-else-if="action.to"
                    :to="action.to"
                    class="work-hero-btn"
                    :class="action.variant === 'primary' ? 'work-hero-btn--primary' : 'work-hero-btn--secondary'"
                  >{{ action.label }}</NuxtLink>
                </template>
              </div>
              <div class="work-hero-links">
                <a
                  v-for="link in home.hero.links"
                  :key="link.label"
                  :href="link.href"
                  :target="link.external ? '_blank' : undefined"
                  :rel="link.external ? 'noopener noreferrer' : undefined"
                >{{ link.label }}</a>
              </div>
            </div>

            <aside class="work-hero-panel" aria-label="工作身份摘要">
              <div class="work-hero-panel-top">
                <div class="work-hero-panel-block">
                  <h3>Focus</h3>
                  <ul class="work-focus-list">
                    <li v-for="item in focusItems" :key="item.label">
                      <component :is="item.icon" class="work-focus-icon" aria-hidden="true" />
                      {{ item.label }}
                    </li>
                  </ul>
                </div>
                <div class="work-hero-panel-block">
                  <h3>Status</h3>
                  <ul class="work-status-list">
                    <li v-for="item in home.panel.status" :key="item">
                      <span class="work-status-dot" aria-hidden="true" />
                      {{ item }}
                    </li>
                  </ul>
                </div>
              </div>

              <div class="work-hero-panel-block">
                <h3>Tools</h3>
                <div class="work-tool-tags">
                  <span v-for="tool in home.panel.tools" :key="tool" class="work-tool-tag">{{ tool }}</span>
                </div>
              </div>

              <div v-if="currentBuild" class="work-hero-current">
                <span class="work-hero-current-label">Current</span>
                <span class="work-hero-current-text">{{ currentBuild.title }} · {{ home.panel.currentSuffix }}</span>
              </div>
            </aside>
          </div>
        </section>

        <section id="featured-projects" class="work-section" aria-labelledby="work-featured-title">
          <div class="work-split">
            <header class="work-aside">
              <span class="work-section-num" aria-hidden="true">{{ home.sections.featured.number }}</span>
              <p class="work-aside-label">{{ home.sections.featured.label }}</p>
              <h2 id="work-featured-title" class="work-aside-title">{{ home.sections.featured.title }}</h2>
              <p class="work-aside-desc">{{ home.sections.featured.description }}</p>
              <NuxtLink :to="home.sections.featured.linkTo || '/projects'" class="work-aside-link">
                {{ home.sections.featured.linkText }}
              </NuxtLink>
            </header>

            <div class="work-featured-grid">
              <p v-if="loading" class="work-muted">正在整理项目。</p>
              <p v-else-if="featuredProjects.length === 0" class="work-muted">
                项目还在整理，请前往案例页查看。
              </p>
              <NuxtLink
                v-for="project in featuredProjects"
                v-else
                :key="project.id"
                :to="projectHref(project)"
                class="work-project-card"
              >
                <div
                  class="work-project-cover"
                  :class="{ 'is-fallback': coverFailed.has(project.id) }"
                >
                  <img
                    v-if="!coverFailed.has(project.id)"
                    :src="projectCover(project)"
                    alt=""
                    loading="lazy"
                    @error="onCoverError(project.id, $event, project)"
                  >
                </div>
                <div class="work-project-body">
                  <span class="work-project-title">{{ project.title }}</span>
                  <p class="work-project-desc">{{ oneLine(project.description, 64) }}</p>
                  <div v-if="projectTags(project).length" class="work-project-tags">
                    <span v-for="tag in projectTags(project)" :key="tag" class="work-project-tag">{{ tag }}</span>
                  </div>
                  <p class="work-project-role">{{ projectRole(project) }}</p>
                </div>
                <span class="work-project-arrow" aria-hidden="true">↗</span>
              </NuxtLink>
            </div>
          </div>
        </section>

        <section id="capabilities" class="work-section" aria-labelledby="work-cap-title">
          <div class="work-split">
            <header class="work-aside">
              <span class="work-section-num" aria-hidden="true">{{ home.sections.capabilities.number }}</span>
              <p class="work-aside-label">{{ home.sections.capabilities.label }}</p>
              <h2 id="work-cap-title" class="work-aside-title">{{ home.sections.capabilities.title }}</h2>
              <p class="work-aside-desc">{{ home.sections.capabilities.description }}</p>
              <NuxtLink :to="home.sections.capabilities.linkTo || '/about'" class="work-aside-link">
                {{ home.sections.capabilities.linkText }}
              </NuxtLink>
            </header>

            <div class="work-cap-grid">
              <article v-for="cap in capabilityAreas" :key="cap.title" class="work-cap-card">
                <component :is="cap.icon" class="work-cap-icon" aria-hidden="true" />
                <h3>{{ cap.title }}</h3>
                <ul>
                  <li v-for="item in cap.bullets" :key="item">{{ item }}</li>
                </ul>
              </article>
            </div>
          </div>
        </section>

        <section id="more-projects" class="work-section" aria-labelledby="work-more-title">
          <div class="work-split">
            <header class="work-aside">
              <span class="work-section-num" aria-hidden="true">{{ home.sections.more.number }}</span>
              <p class="work-aside-label">{{ home.sections.more.label }}</p>
              <h2 id="work-more-title" class="work-aside-title">{{ home.sections.more.title }}</h2>
              <p class="work-aside-desc">{{ home.sections.more.description }}</p>
              <NuxtLink :to="home.sections.more.linkTo || '/projects'" class="work-aside-link">
                {{ home.sections.more.linkText }}
              </NuxtLink>
            </header>

            <div class="work-more-grid">
              <p v-if="!loading && moreProjects.length === 0" class="work-muted">
                更多项目见案例页。
              </p>
              <article
                v-for="(project, index) in moreProjects"
                v-else
                :key="project.id"
                class="work-more-item"
              >
                <span class="work-more-index">{{ String(index + 1).padStart(2, '0') }}</span>
                <div class="work-more-main">
                  <NuxtLink :to="projectHref(project)">{{ project.title }}</NuxtLink>
                  <p>{{ oneLine(project.description, 48) }}</p>
                  <span class="work-more-meta">{{ moreItemMeta(project) }}</span>
                </div>
                <NuxtLink :to="projectHref(project)" class="work-more-arrow" aria-label="查看详情">→</NuxtLink>
              </article>
            </div>
          </div>
        </section>

        <section id="contact" class="work-section" aria-labelledby="work-contact-title">
          <div class="work-split">
            <header class="work-aside">
              <span class="work-section-num" aria-hidden="true">{{ home.sections.contact.number }}</span>
              <p class="work-aside-label">{{ home.sections.contact.label }}</p>
              <h2 id="work-contact-title" class="work-aside-title">{{ home.sections.contact.title }}</h2>
              <p class="work-aside-desc">{{ home.sections.contact.description }}</p>
            </header>

            <div class="work-contact-list">
              <template v-for="row in home.contact.rows" :key="row.label">
                <a
                  v-if="row.href"
                  :href="row.href"
                  class="work-contact-row"
                  :target="row.external ? '_blank' : undefined"
                  :rel="row.external ? 'noopener noreferrer' : undefined"
                >
                  <span class="work-contact-label">{{ row.label }}</span>
                  <span class="work-contact-value">{{ row.value || row.label }}</span>
                  <span class="work-contact-arrow" aria-hidden="true">→</span>
                </a>
                <NuxtLink v-else-if="row.to" :to="row.to" class="work-contact-row">
                  <span class="work-contact-label">{{ row.label }}</span>
                  <span class="work-contact-value">{{ row.value || row.label }}</span>
                  <span class="work-contact-arrow" aria-hidden="true">→</span>
                </NuxtLink>
              </template>
              <p class="work-contact-note">{{ home.contact.note }}</p>
            </div>
          </div>
        </section>
      </div>
    </main>

    <footer class="home-footer">
      <div class="home-shell home-footer-inner">
        <div class="home-footer-brand">
          <SiteBrandLogo variant="favicon" />
          <div>
            <strong>{{ home.footer.name }}</strong>
            <p>{{ home.footer.description }}</p>
          </div>
        </div>
        <div class="home-footer-links">
          <a
            v-for="row in home.contact.rows.filter(r => r.href && r.external)"
            :key="row.label"
            :href="row.href"
            target="_blank"
            rel="noreferrer"
          >{{ row.label }}</a>
          <NuxtLink to="/contact">微信</NuxtLink>
          <a
            v-for="row in home.contact.rows.filter(r => r.href && !r.external)"
            :key="`mail-${row.label}`"
            :href="row.href"
          >邮箱</a>
          <a :href="SITE_LEGAL.icpQueryUrl" target="_blank" rel="noopener noreferrer">{{ SITE_LEGAL.icp }}</a>
        </div>
      </div>
    </footer>

    <ClientOnly>
      <WorkAssistantHub />
    </ClientOnly>
  </div>
</template>

<script setup lang="ts">
import { defineAsyncComponent, h } from 'vue'
import NavMoreMenu from '~/components/layout/NavMoreMenu.vue'
import SiteBrandLogo from '~/components/layout/SiteBrandLogo.vue'
import { resolveProjectCoverUrl } from '~/constants/projects/covers'
import { SITE_LEGAL } from '~/constants/siteLegal'
import { WORK_PRIMARY_NAV } from '~/constants/work-ia'
import { isWorkNavActive } from '~/utils/work-nav-active'
import type { HomeProjectCard } from '~/types/home'

const WorkAssistantHub = defineAsyncComponent(() => import('~/components/work/WorkAssistantHub.vue'))

definePageMeta({
  layout: false,
})

const { data: homeData } = await useAsyncData('work-home', () =>
  $fetch('/api/content/work/home'),
)
const { data: capabilitiesData } = await useAsyncData('work-capabilities', () =>
  $fetch<{ areas: Array<{ id: string, title: string, bullets: string[] }> }>('/api/content/work/capabilities'),
)

if (!homeData.value) {
  throw createError({ statusCode: 500, statusMessage: 'Work home content missing' })
}

const home = computed(() => homeData.value!)

const { overview, loading } = useHomeOverview()
const route = useRoute()

const navItems = WORK_PRIMARY_NAV.map((item) => ({
  label: item.title,
  href: item.path,
  key: item.key || item.path,
}))

const isNavActive = (href: string) => isWorkNavActive(route.path || '/', href)

const homePrimaryForMenu = computed(() =>
  navItems.map((item) => ({ label: item.label, href: item.href })),
)

/** PRESENTATION：SVG 图标留在页面，文案来自 content */
const focusIcon = (paths: string[]) => ({
  render: () => h('svg', { viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', 'stroke-width': '1.6' },
    paths.map((d) => h('path', { d }))),
})

const focusIconMap: Record<string, ReturnType<typeof focusIcon>> = {
  'AI 应用开发': focusIcon(['M12 3l2 4h4l-3 3 1 4-4-2-4 2 1-4-3-3h4l2-4z']),
  '产品设计': focusIcon(['M4 6h16v12H4z', 'M8 10h8']),
  '全栈工程': focusIcon(['M8 6h8l2 4v8H6V10l2-4z']),
  '自动化': focusIcon(['M12 6v12', 'M6 12h12', 'M8 8l8 8', 'M16 8l-8 8']),
}

const focusItems = computed(() =>
  home.value.panel.focus.map((label) => ({
    label,
    icon: focusIconMap[label] || focusIcon(['M12 6v12', 'M6 12h12']),
  })),
)

const capabilityIconMap: Record<string, ReturnType<typeof focusIcon>> = {
  '产品': focusIcon(['M4 5h16v14H4z', 'M8 9h8M8 13h5']),
  'AI 应用': focusIcon(['M12 3v2M12 19v2M3 12h2M19 12h2']),
  '工程实现': focusIcon(['M8 6h8l2 4v8H6V10l2-4z', 'M9 14h6']),
  '交付上线': focusIcon(['M12 3l8 4v10l-8 4-8-4V7l8-4z', 'M12 12l8-4M12 12v9M12 12L4 8']),
}

const capabilityAreas = computed(() =>
  (capabilitiesData.value?.areas || []).map((area) => ({
    title: area.title,
    bullets: area.bullets,
    icon: capabilityIconMap[area.title] || focusIcon(['M12 6v12', 'M6 12h12']),
  })),
)

const coverFailed = ref(new Set<string>())
const coverRetried = ref(new Set<string>())

const allProjects = computed(() => overview.value.featuredProjects || [])

const featuredProjects = computed(() => allProjects.value.slice(0, 3))

const currentBuild = computed(() => {
  const item = overview.value.nowBuilding?.[0]
  if (!item) return null
  return { title: item.title }
})

const moreProjects = computed(() => {
  const selectedIds = new Set(featuredProjects.value.map((item) => item.id))
  const restFeatured = allProjects.value.slice(3).filter((item) => !selectedIds.has(item.id))

  const fromBuilding = (overview.value.nowBuilding || [])
    .filter((item) => !selectedIds.has(item.id))
    .map((item) => ({
      id: item.id,
      title: item.title,
      description: item.description,
      techStack: item.techStack,
      coverUrl: null,
      demoUrl: null,
      githubUrl: null,
      status: item.status,
      viewCount: 0,
    } satisfies HomeProjectCard))

  const seen = new Set<string>()
  const merged: HomeProjectCard[] = []

  for (const project of [...restFeatured, ...fromBuilding]) {
    if (!project.id || seen.has(project.id)) continue
    seen.add(project.id)
    merged.push(project)
    if (merged.length >= 6) break
  }

  return merged
})

const projectHref = (project: HomeProjectCard) => {
  if (project.id) return `/projects/${project.id}`
  return '/projects'
}

const projectCover = (project: HomeProjectCard) => resolveProjectCoverUrl(project)

const onCoverError = (projectId: string, event: Event, project: HomeProjectCard) => {
  const target = event.target as HTMLImageElement | null
  if (!target) return

  const retryKey = `${projectId}:retry`
  if (!coverRetried.value.has(retryKey)) {
    coverRetried.value = new Set([...coverRetried.value, retryKey])
    const remapped = resolveProjectCoverUrl({ ...project, coverUrl: undefined })
    if (remapped !== target.src) {
      target.src = remapped
      return
    }
  }

  coverFailed.value = new Set([...coverFailed.value, projectId])
}

const oneLine = (text?: string, max = 56) => {
  if (!text) return ''
  const trimmed = text.replace(/\s+/g, ' ').trim()
  const stop = trimmed.search(/[。.!！]/)
  if (stop > 10 && stop < max) return trimmed.slice(0, stop + 1)
  return trimmed.length > max ? `${trimmed.slice(0, max).trim()}…` : trimmed
}

const projectTags = (project: HomeProjectCard) => (project.techStack || []).slice(0, 3)

const projectRole = (project: HomeProjectCard) => {
  const tech = (project.techStack || []).join(' ').toLowerCase()
  const parts = ['产品设计']

  if (tech.includes('openai') || tech.includes('llm') || tech.includes('ai')) {
    parts.push('AI 集成')
  }

  parts.push('全栈开发')

  if (project.demoUrl) {
    parts.push('发布上线')
  } else {
    parts.push('持续迭代')
  }

  return parts.join(' / ')
}

const projectStatus = (project: HomeProjectCard) => {
  if (project.demoUrl || project.status === 'Completed') return '已上线'
  if (project.status === 'Active') return '持续迭代'
  if (project.status === 'Archived') return '已归档'
  return '开发中'
}

const moreItemMeta = (project: HomeProjectCard) => {
  const tags = projectTags(project)
  if (tags.length) return tags.join(' · ')
  return projectStatus(project)
}

usePageSeo({
  title: home.value.seo.title || '溪午听风',
  description: home.value.seo.description || '',
  path: '/work',
  world: 'work',
})
</script>

<style scoped>
@import '~/assets/css/work-home.css';

.home-page {
  --home-bg: var(--color-bg);
  --home-card: rgba(93, 126, 215, 0.12);
  --home-card-hover: rgba(111, 145, 235, 0.17);
  --home-border: var(--site-shell-border-soft);
  --home-border-strong: var(--site-shell-border-strong);
  --home-text-main: var(--color-text);
  --home-text-muted: rgba(227, 235, 255, 0.76);
  --home-text-soft: rgba(227, 235, 255, 0.58);
  --home-accent: #91aaff;
  --home-radius: var(--radius-lg);
  --home-radius-lg: var(--radius-xl);
  --floating-dock-right: max(18px, env(safe-area-inset-right));
  --floating-dock-bottom: max(18px, calc(env(safe-area-inset-bottom) + 14px));
  min-height: 100vh;
  color: var(--home-text-main);
}

.home-page :global(a) {
  color: inherit;
  text-decoration: none;
}

.home-page :deep(.home-shell) {
  width: min(100% - 2rem, var(--space-container));
  margin-inline: auto;
}

.home-header {
  position: fixed;
  top: 1.7rem;
  left: 0;
  right: 0;
  z-index: 1000;
  height: 96px;
  pointer-events: none;
}

.home-header-inner {
  width: min(100% - 4.8rem, 1840px);
  height: 96px;
  display: grid;
  grid-template-columns: auto minmax(0, 1fr) auto;
  align-items: center;
  gap: 2rem;
  margin-inline: auto;
  padding: 0 2.45rem 0 3.15rem;
  border: 1px solid var(--home-border);
  border-radius: 1.85rem 1.85rem 0 0;
  background: rgba(8, 21, 49, 0.72);
  backdrop-filter: blur(22px);
  -webkit-backdrop-filter: blur(22px);
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.06);
  pointer-events: auto;
}

@media (prefers-reduced-motion: reduce) {
  .home-header-inner {
    backdrop-filter: none;
    -webkit-backdrop-filter: none;
    background: rgba(8, 21, 49, 0.94);
  }
}

.home-brand,
.home-footer-brand {
  display: inline-flex;
  align-items: center;
  gap: 0.8rem;
  min-width: 0;
}

.home-brand-text {
  display: grid;
  gap: 0.18rem;
}

.home-brand-text strong,
.home-footer-brand strong {
  color: var(--home-text-main);
  font-size: 1.14rem;
  font-weight: 780;
  line-height: 1;
}

.home-brand-text small {
  color: var(--home-text-soft);
  font-size: 0.76rem;
  white-space: nowrap;
}

.home-nav {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: clamp(1.45rem, 3.6vw, 3.8rem);
}

.home-nav a {
  position: relative;
  min-width: 3.8rem;
  padding: 0.85rem 0.35rem;
  color: var(--home-text-muted);
  text-align: center;
  font-size: 0.96rem;
  transition: color 0.22s ease, background 0.22s ease;
}

.home-nav a:hover,
.home-nav a.is-active {
  color: var(--home-text-main);
}

.home-nav a.is-active {
  border-radius: 0.45rem;
  background: rgba(67, 103, 255, 0.07);
}

.home-nav a.is-active::after {
  content: '';
  position: absolute;
  left: 50%;
  bottom: 0.55rem;
  width: 1.25rem;
  height: 1.5px;
  transform: translateX(-50%);
  background: rgba(142, 160, 255, 0.9);
  border-radius: 1px;
}

.home-header-actions {
  display: flex;
  align-items: center;
  gap: 0.55rem;
}

.home-nav-compact {
  display: none;
}

.home-icon-button,
.home-platform-button {
  min-height: 3rem;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  border: 1px solid var(--home-border);
  border-radius: 999px;
  color: var(--home-text-main);
  background: rgba(255, 255, 255, 0.04);
  transition: transform 0.24s ease, border-color 0.24s ease, background 0.24s ease, box-shadow 0.24s ease;
}

.home-icon-button {
  width: 3rem;
  padding: 0;
}

.home-icon-button svg {
  width: 1.08rem;
  height: 1.08rem;
  fill: currentColor;
}

.home-platform-button {
  padding: 0 1.55rem;
  font-size: 0.9rem;
  font-weight: 690;
  border-color: rgba(112, 157, 255, 0.44);
  background: linear-gradient(135deg, rgba(39, 105, 255, 0.95), rgba(92, 80, 225, 0.92));
  box-shadow: 0 14px 36px rgba(45, 100, 255, 0.25);
}

.home-icon-button:hover,
.home-platform-button:hover {
  transform: translateY(-0.14rem);
  border-color: var(--home-border-strong);
  box-shadow: 0 18px 38px rgba(36, 82, 210, 0.18);
}

.home-footer {
  border-top: 1px solid var(--home-border);
  background: rgba(7, 19, 44, 0.66);
}

.home-footer-inner {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 2rem;
  padding: 2rem 0;
}

.home-footer-brand p {
  margin: 0.35rem 0 0;
  color: var(--home-text-soft);
  font-size: 0.9rem;
}

.home-footer-links {
  display: flex;
  flex-wrap: wrap;
  justify-content: flex-end;
  gap: 1rem;
  color: var(--home-text-soft);
  font-size: 0.9rem;
}

.home-footer-links a:hover {
  color: var(--home-text-main);
}

@media (max-width: 1100px) {
  .home-header-inner {
    grid-template-columns: auto auto;
  }

  .home-nav {
    display: none;
  }

  .home-nav-compact {
    display: block;
  }
}

@media (max-width: 680px) {
  .home-header {
    top: 0.65rem;
    height: 72px;
  }

  .home-header-inner {
    width: min(100% - 1rem, var(--space-container));
    height: 72px;
    gap: 0.75rem;
    padding: 0 0.75rem;
    border-radius: 1.25rem;
  }

  .home-brand-text small {
    display: none;
  }

  .home-icon-button {
    display: none;
  }

  .home-footer-inner {
    align-items: flex-start;
    flex-direction: column;
  }

  .home-footer-links {
    justify-content: flex-start;
  }
}
</style>
