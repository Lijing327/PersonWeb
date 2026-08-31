<template>
  <div class="projects-detail-page">
    <section v-if="pending && !project" class="projects-detail-state">
      <div class="projects-loading-spinner"></div>
      <p class="projects-state-title">项目详情加载中</p>
      <p class="projects-state-text">正在整理项目资料、技术栈与正文内容，请稍候。</p>
    </section>

    <ProjectShowcasePage v-else-if="project" :project="project" />
  </div>
</template>

<script setup lang="ts">
import type { Project } from '~/types/api'
import { applyProjectCover } from '~/constants/projects/covers'
import ProjectShowcasePage from '~/components/projects/ProjectShowcasePage.vue'
import { fetchBackendApi, isNotFoundError } from '~/composables/useBackendFetch'
import { usePageSeo, useJsonLd, toAbsoluteUrl } from '~/composables/usePageSeo'
import '~/assets/css/projects.css'

definePageMeta({
  layout: 'default',
})

const route = useRoute()
usePageStyle('projects')

const projectId = String(route.params.id || '')

const { data: project, pending, error } = await useAsyncData(
  `project-${projectId}`,
  async () => {
    try {
      const response = await fetchBackendApi<Project>(`/Projects/${projectId}`)
      return applyProjectCover(response)
    } catch (e) {
      if (isNotFoundError(e)) {
        throw createError({ statusCode: 404, statusMessage: 'Not Found' })
      }
      throw createError({ statusCode: 502, statusMessage: 'Upstream error' })
    }
  },
)

if (error.value && isNotFoundError(error.value)) {
  throw createError({ statusCode: 404, statusMessage: 'Not Found' })
}

if (!project.value && !pending.value) {
  throw createError({ statusCode: 404, statusMessage: 'Not Found' })
}

onMounted(() => {
  if (!projectId) return
  fetchBackendApi(`/Projects/${projectId}/view`, { method: 'POST' }).catch(() => {})
})

usePageSeo(() => ({
  title: `${project.value?.title || '项目详情'} - 项目展示 - 溪午听风`,
  description: project.value?.description || '溪午听风的项目案例。',
  path: `/projects/${projectId}`,
  image: project.value?.coverUrl || null,
  type: 'website',
  world: 'work',
}))

useJsonLd(() => {
  if (!project.value) return null
  return {
    '@context': 'https://schema.org',
    '@type': 'CreativeWork',
    name: project.value.title,
    description: project.value.description || undefined,
    url: toAbsoluteUrl(`/projects/${projectId}`),
    image: project.value.coverUrl ? toAbsoluteUrl(project.value.coverUrl) : undefined,
    author: {
      '@type': 'Person',
      name: '溪午听风',
    },
  }
})
</script>

<style scoped>
.projects-detail-page {
  min-height: 100vh;
}

.projects-detail-state {
  position: relative;
  z-index: 1;
  width: min(var(--space-container), calc(100% - 32px));
  margin: 8rem auto 5rem;
  padding: 3rem 2rem;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  background: var(--color-surface);
  text-align: center;
}
</style>
