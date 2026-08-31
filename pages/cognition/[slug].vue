<template>
  <AdminModuleGuard module-key="cognition">
    <div class="cognition-page">
      <div class="cognition-background-noise"></div>

      <div class="cognition-background-container">
        <div class="cognition-background-blob cognition-background-blob--blue"></div>
        <div class="cognition-background-blob cognition-background-blob--purple"></div>
        <div class="cognition-background-blob cognition-background-blob--emerald"></div>
      </div>

      <div class="cognition-content">
        <header class="cognition-header">
          <div class="cognition-header-left">
            <div class="cognition-header-icon">🧠</div>
            <h1 class="cognition-title">认知说明书</h1>
          </div>
          <NuxtLink to="/cognition" class="cognition-back-link">
            <i class="fas fa-arrow-left"></i>
            返回列表
          </NuxtLink>
        </header>

        <div v-if="pending && !doc" class="cognition-loading">
          <div class="cognition-loading-spinner"></div>
          <p class="cognition-loading-text">加载中...</p>
        </div>

        <article v-else-if="doc" class="cognition-article">
          <header class="cognition-article-header">
            <h1 class="cognition-article-title">{{ doc.title }}</h1>
            <div v-if="doc.summary" class="cognition-article-summary">
              {{ doc.summary }}
            </div>
            <div class="cognition-article-meta">
              <span class="cognition-article-date">
                <i class="fas fa-calendar mr-2"></i>
                {{ formatDate(doc.updatedAt) }}
              </span>
            </div>
          </header>

          <div class="cognition-prose" v-html="renderedContent"></div>
        </article>
      </div>
    </div>
  </AdminModuleGuard>
</template>

<script setup lang="ts">
import { fetchBackendApi, isNotFoundError } from '~/composables/useBackendFetch'
import { usePageSeo, useJsonLd, toAbsoluteUrl } from '~/composables/usePageSeo'
import '~/assets/css/cognition.css'

definePageMeta({
  layout: 'default',
})

const route = useRoute()
const { parse } = useMarkdown()
const slug = String(route.params.slug || '')

const { data: doc, pending, error } = await useAsyncData(
  `cognition-${slug}`,
  async () => {
    try {
      const res = await fetchBackendApi<any>(`/CognitionDocs/by-slug/${slug}`)
      if (!res) {
        throw createError({ statusCode: 404, statusMessage: 'Not Found' })
      }
      return {
        id: res.Id || res.id,
        title: res.Title || res.title,
        slug: res.Slug || res.slug,
        summary: res.Summary || res.summary,
        contentMd: res.ContentMd || res.contentMd,
        updatedAt: res.UpdatedAt || res.updatedAt,
      }
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

if (!doc.value && !pending.value) {
  throw createError({ statusCode: 404, statusMessage: 'Not Found' })
}

const renderedContent = computed(() => parse(doc.value?.contentMd || ''))

const formatDate = (dateString?: string | Date) => {
  if (!dateString) return ''
  const date = typeof dateString === 'string' ? new Date(dateString) : dateString
  return date.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

usePageSeo(() => ({
  title: `${doc.value?.title || '认知说明书'} - 溪午听风`,
  description: doc.value?.summary || '个人认知使用说明书',
  path: `/cognition/${slug}`,
  type: 'article',
  world: 'work',
}))

useJsonLd(() => {
  if (!doc.value) return null
  return {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: doc.value.title,
    description: doc.value.summary || undefined,
    dateModified: doc.value.updatedAt || undefined,
    author: { '@type': 'Person', name: '溪午听风' },
    mainEntityOfPage: toAbsoluteUrl(`/cognition/${slug}`),
  }
})
</script>

<style scoped>
/* 样式已移至 assets/css/cognition.css */
</style>
