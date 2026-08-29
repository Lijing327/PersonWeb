<template>
  <div class="life-about">
    <header class="life-about-head">
      <p class="life-about-kicker">{{ profile.kicker }}</p>
      <h1>{{ profile.title }}</h1>
    </header>

    <div class="life-about-layout">
      <article class="life-about-essay">
        <p
          v-for="(block, index) in essayBlocks"
          :key="index"
          :class="{ 'life-about-emphasis': block.kind === 'emphasis' }"
        >
          <template v-if="block.kind === 'mixed'">
            {{ block.before }}<span class="life-about-emphasis">{{ block.text }}</span>{{ block.after }}
          </template>
          <template v-else>{{ block.text }}</template>
        </p>
      </article>

      <aside v-if="profile.asides.length" class="life-about-aside" aria-label="近况旁注">
        <p v-for="item in profile.asides" :key="item.label">
          <span>{{ item.label }}</span>
          {{ item.text }}
        </p>
      </aside>
    </div>

    <p class="life-about-back">
      <NuxtLink to="/life" class="life-note-back">← 返回 Life</NuxtLink>
    </p>
  </div>
</template>

<script setup lang="ts">
definePageMeta({
  layout: 'life'
})

type LifeProfile = {
  title: string
  kicker: string
  description: string
  emphasis?: string
  asides: { label: string, text: string }[]
  paragraphs: string[]
}

type EssayBlock = {
  kind: 'plain' | 'emphasis' | 'mixed'
  text: string
  before?: string
  after?: string
}

const { data: profile } = await useAsyncData('life-profile', () =>
  $fetch<LifeProfile>('/api/content/life/profile')
)

if (!profile.value) {
  throw createError({ statusCode: 404, statusMessage: '关于我还不存在' })
}

const essayBlocks = computed((): EssayBlock[] => {
  const emphasis = profile.value?.emphasis
  return (profile.value?.paragraphs || []).map((paragraph) => {
    if (!emphasis) return { kind: 'plain', text: paragraph }
    if (paragraph === emphasis) return { kind: 'emphasis', text: paragraph }

    const index = paragraph.indexOf(emphasis)
    if (index === -1) return { kind: 'plain', text: paragraph }

    return {
      kind: 'mixed',
      text: emphasis,
      before: paragraph.slice(0, index),
      after: paragraph.slice(index + emphasis.length)
    }
  })
})

useHead({
  title: `${profile.value.title} - 溪午听风`,
  meta: [
    {
      key: 'description',
      name: 'description',
      content: profile.value.description || '溪午听风的生活一面。'
    }
  ]
})
</script>
