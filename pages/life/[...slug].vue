<template>
  <article class="life-note-article">
    <NuxtLink to="/life/notes" class="life-note-back">← 返回随笔</NuxtLink>

    <header>
      <p>{{ formatDate(post.date) }}<template v-if="post.category"> · {{ post.category }}</template></p>
      <h1>{{ post.title }}</h1>
      <div v-if="post.cover" class="life-note-cover">
        <img :src="post.cover" :alt="post.title" />
      </div>
    </header>

    <div class="life-note-body" v-html="renderedContent"></div>

    <div v-if="post.tags?.length" class="life-note-tags">
      <span v-for="tag in post.tags" :key="tag">#{{ tag }}</span>
    </div>
  </article>
</template>

<script setup lang="ts">
import { isLifeNoteSlug } from '~/constants/life-content'
import { usePageSeo, useJsonLd } from '~/composables/usePageSeo'

definePageMeta({
  layout: 'life'
})

const route = useRoute()
const slug = route.params.slug
const { parse } = useMarkdown()

const slugString = Array.isArray(slug) ? slug[0] : String(slug || '')

if (!isLifeNoteSlug(slugString)) {
  throw createError({ statusCode: 404, statusMessage: 'Not Found' })
}

const { data: post } = await useAsyncData(`life-${slugString}`, async () => {
  try {
    return await $fetch(`/api/content/life/${slugString}`)
  } catch (error: unknown) {
    const status = typeof error === 'object' && error !== null
      ? Number((error as { statusCode?: number, status?: number }).statusCode
        ?? (error as { statusCode?: number, status?: number }).status
        ?? 0)
      : 0
    if (status === 404) return null
    throw error
  }
})

const renderedContent = computed(() => parse(post.value?.content || ''))

if (!post.value) {
  throw createError({ statusCode: 404, statusMessage: 'Not Found' })
}

const formatDate = (dateString?: string) => {
  if (!dateString) return ''

  return new Date(dateString).toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
}

usePageSeo(() => ({
  title: `${post.value.title} - 溪午听风 · Life`,
  description: post.value.description || '溪午听风的一篇生活随笔。',
  path: `/life/${slugString}`,
  image: post.value.cover || null,
  type: 'article',
  world: 'life',
}))

useJsonLd(() => {
  if (!post.value) return null
  return {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: post.value.title,
    description: post.value.description || undefined,
    datePublished: post.value.date || undefined,
    image: post.value.cover || undefined,
    author: { '@type': 'Person', name: '溪午听风' },
  }
})
</script>
