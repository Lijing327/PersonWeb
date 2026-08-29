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

definePageMeta({
  layout: 'life'
})

const route = useRoute()
const slug = route.params.slug
const { parse } = useMarkdown()

const slugString = Array.isArray(slug) ? slug[0] : String(slug || '')

if (!isLifeNoteSlug(slugString)) {
  throw createError({ statusCode: 404, statusMessage: '文章不存在' })
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
  throw createError({ statusCode: 404, statusMessage: '文章不存在' })
}

const formatDate = (dateString?: string) => {
  if (!dateString) return ''

  return new Date(dateString).toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
}

useHead({
  title: `${post.value.title} - 溪午听风`,
  meta: [
    { key: 'description', name: 'description', content: post.value.description || '溪午听风的一篇生活随笔。' }
  ]
})
</script>
