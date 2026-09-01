<template>
  <AdminModuleGuard module-key="about">
    <div class="about-page">
      <div class="about-background" aria-hidden="true">
        <div class="about-background-grid"></div>
        <div class="about-background-glow about-background-glow--blue"></div>
        <div class="about-background-glow about-background-glow--violet"></div>
      </div>

      <div class="about-shell">
        <section class="about-hero">
          <div class="about-hero-copy">
            <p class="about-eyebrow">{{ about.eyebrow }}</p>
            <h1 class="about-title">{{ about.title }}</h1>
            <p class="about-subtitle">{{ about.subtitle }}</p>
            <p class="about-description">{{ about.description }}</p>

            <div class="about-actions">
              <template v-for="action in about.actions" :key="action.label">
                <NuxtLink
                  v-if="action.to"
                  :to="action.to"
                  class="about-button"
                  :class="action.variant === 'primary' ? 'about-button--primary' : 'about-button--ghost'"
                >
                  {{ action.label }}
                  <i v-if="action.variant === 'primary'" class="fas fa-arrow-right"></i>
                </NuxtLink>
                <a
                  v-else-if="action.href"
                  :href="action.href"
                  class="about-button about-button--ghost"
                >
                  {{ action.label }}
                </a>
              </template>
            </div>

            <div class="about-socials" aria-label="社交链接">
              <a
                v-for="social in about.socials"
                :key="social.name || social.label"
                :href="social.href"
                class="about-social-link"
                target="_blank"
                rel="noopener noreferrer"
                :aria-label="social.name || social.label"
              >
                <i v-if="social.icon" :class="social.icon"></i>
                <span v-else>{{ social.label }}</span>
              </a>
            </div>
          </div>

          <aside class="about-profile-card">
            <div class="about-avatar">
              <img
                src="/images/avatar.webp"
                alt="溪午听风头像"
                width="160"
                height="160"
                decoding="async"
              />
            </div>
            <h2 class="about-profile-name">{{ about.title }}</h2>
            <p class="about-profile-location">
              <i class="fas fa-map-marker-alt"></i>
              {{ about.location }}
            </p>
            <p class="about-profile-summary">{{ about.summary }}</p>
            <div class="about-profile-tags">
              <span v-for="tag in about.tags" :key="tag">{{ tag }}</span>
            </div>
          </aside>
        </section>

        <section class="about-panel">
          <div class="about-section-head">
            <h2>{{ about.focus.heading }}</h2>
            <p>{{ about.focus.subheading }}</p>
          </div>
          <div class="about-focus-grid">
            <article
              v-for="item in about.focus.items"
              :key="item.title"
              class="about-focus-card"
            >
              <div class="about-icon" :class="`about-icon--${item.color}`">
                <i :class="item.icon"></i>
              </div>
              <h3>{{ item.title }}</h3>
              <ul>
                <li v-for="point in item.points" :key="point">{{ point }}</li>
              </ul>
            </article>
          </div>
        </section>

        <section class="about-panel about-path-panel">
          <div class="about-section-head">
            <h2>{{ about.path.heading }}</h2>
            <p>{{ about.path.subheading }}</p>
          </div>
          <div class="about-path">
            <article
              v-for="(step, index) in about.path.steps"
              :key="step.title"
              class="about-path-step"
            >
              <div class="about-path-marker" :class="`about-path-marker--${step.color}`">
                {{ index + 1 }}
              </div>
              <div class="about-path-icon" :class="`about-icon--${step.color}`">
                <i :class="step.icon"></i>
              </div>
              <h3>{{ step.title }}</h3>
              <p>{{ step.desc }}</p>
            </article>
          </div>
        </section>

        <section v-if="featuredProjects.length" class="about-panel">
          <div class="about-section-head">
            <h2>{{ about.featuredProjects.heading }}</h2>
            <p>{{ about.featuredProjects.subheading }}</p>
          </div>
          <div class="about-project-grid">
            <article
              v-for="project in featuredProjects"
              :key="project.id"
              class="about-project-card"
            >
              <div class="about-project-cover about-project-cover--brand">
                <div class="about-project-window">
                  <span></span>
                  <span></span>
                  <span></span>
                </div>
                <div class="about-project-visual">
                  <i class="fas fa-folder-open"></i>
                  <div class="about-project-lines">
                    <span></span>
                    <span></span>
                    <span></span>
                  </div>
                </div>
              </div>
              <div class="about-project-body">
                <h3>{{ project.title }}</h3>
                <p>{{ project.description }}</p>
                <div v-if="projectTags(project).length" class="about-project-tags">
                  <span v-for="tag in projectTags(project)" :key="tag">{{ tag }}</span>
                </div>
                <div class="about-project-status" :class="`about-project-status--${projectStatusTone(project)}`">
                  <span></span>
                  {{ projectStatusLabel(project) }}
                </div>
              </div>
            </article>
          </div>
          <div class="about-more-row">
            <NuxtLink to="/projects" class="about-button about-button--ghost">
              {{ about.featuredProjects.moreLabel }}
              <i class="fas fa-arrow-right"></i>
            </NuxtLink>
          </div>
        </section>

        <section class="about-panel">
          <div class="about-section-head">
            <h2>{{ about.workStyles.heading }}</h2>
            <p>{{ about.workStyles.subheading }}</p>
          </div>
          <div class="about-work-grid">
            <article
              v-for="item in about.workStyles.items"
              :key="item.title"
              class="about-work-card"
            >
              <i :class="item.icon"></i>
              <h3>{{ item.title }}</h3>
              <p>{{ item.desc }}</p>
            </article>
          </div>
        </section>

        <section class="about-cta">
          <div class="about-cta-icon">
            <i class="fas fa-paper-plane"></i>
          </div>
          <div class="about-cta-copy">
            <h2>{{ about.cta.title }}</h2>
            <p>{{ about.cta.description }}</p>
          </div>
          <div class="about-cta-actions">
            <template v-for="action in about.cta.actions" :key="action.label">
              <NuxtLink
                v-if="action.to"
                :to="action.to"
                class="about-button"
                :class="action.variant === 'white' ? 'about-button--white' : 'about-button--light'"
              >
                {{ action.label }}
              </NuxtLink>
              <a
                v-else-if="action.href"
                :href="action.href"
                class="about-button"
                :class="action.variant === 'white' ? 'about-button--white' : 'about-button--light'"
              >
                {{ action.label }}
              </a>
            </template>
          </div>
        </section>
      </div>
    </div>
  </AdminModuleGuard>
</template>

<script setup lang="ts">
import '~/assets/css/about.css'
import type { HomeProjectCard } from '~/types/home'

definePageMeta({
  layout: 'default'
})

const { data: aboutData } = await useAsyncData('work-about', () =>
  $fetch('/api/content/work/about'),
)

if (!aboutData.value) {
  throw createError({ statusCode: 404, statusMessage: 'Work about content missing' })
}

const about = computed(() => aboutData.value!)
const { overview } = useHomeOverview()

const featuredProjects = computed(() => overview.value.featuredProjects.slice(0, 5))

const projectTags = (project: HomeProjectCard) => (project.techStack || []).slice(0, 3)

const projectStatusLabel = (project: HomeProjectCard) => {
  if (project.demoUrl || project.status === 'Completed') return '已上线'
  if (project.status === 'Active') return '持续迭代'
  if (project.status === 'Archived') return '已归档'
  return '开发中'
}

const projectStatusTone = (project: HomeProjectCard) => {
  if (project.status === 'Active') return 'active'
  if (project.demoUrl || project.status === 'Completed') return 'building'
  return 'planned'
}

usePageSeo({
  title: about.value.seo.title || '关于我 - 溪午听风',
  description: about.value.seo.description || '',
  path: '/about',
  type: 'profile',
  world: 'work',
})

useJsonLd(() => ({
  '@context': 'https://schema.org',
  '@type': 'Person',
  name: about.value.title,
  url: toAbsoluteUrl('/about'),
  jobTitle: about.value.jsonLd.jobTitle || '独立开发者',
  description: about.value.jsonLd.description || about.value.seo.description,
}))
</script>
