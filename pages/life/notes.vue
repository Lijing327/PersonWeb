<template>
  <div class="life-notes">
    <header>
      <h1>随笔</h1>
      <p class="life-notes-lead">想到什么，就写一点下来。</p>
    </header>

    <p v-if="!posts || posts.length === 0" class="life-empty">
      这里还没写东西。<br>
      以后想到什么，再慢慢放进来。
    </p>

    <div v-else class="life-note-list">
      <NuxtLink
        v-for="post in posts"
        :key="post._path"
        :to="post._path"
        class="life-note-item"
      >
        <time>{{ formatDate(post.date) }}</time>
        <h2>{{ post.title }}</h2>
        <p v-if="post.description">{{ post.description }}</p>
      </NuxtLink>
    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({
  layout: 'life'
})

type LifeNote = {
  _path: string
  title?: string
  description?: string
  date?: string
}

const { data: posts } = await useAsyncData('life-posts', () =>
  $fetch<LifeNote[]>('/api/content/life')
)

const formatDate = (dateString?: string) => {
  if (!dateString) return ''

  return new Date(dateString).toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
}

useHead({
  title: '随笔 - 溪午听风',
  meta: [
    {
      key: 'description',
      name: 'description',
      content: '溪午听风写下的生活随笔。'
    }
  ]
})
</script>
