<template>
  <div class="life-home">
    <section class="life-intro" aria-labelledby="life-intro-title">
      <div class="life-intro-meta">
        <p class="life-intro-kicker">{{ home.hero.kicker }}</p>
        <p class="life-intro-stamp">{{ lifeHomeStamp }}</p>
      </div>

      <div class="life-intro-copy">
        <p class="life-intro-hello">{{ home.hero.greeting }}</p>
        <h1 id="life-intro-title">
          {{ home.hero.name }}
          <svg class="life-intro-mark" viewBox="0 0 120 18" aria-hidden="true">
            <path d="M2 11c18-8 38 6 56-2 16-7 28 5 44 1 6-1 12-4 16-7" />
          </svg>
        </h1>
        <p v-if="home.hero.lines.length" class="life-intro-lead">
          <template v-for="(line, index) in home.hero.lines" :key="line">
            <br v-if="index > 0">{{ line }}
          </template>
        </p>
        <p v-if="home.hero.current" class="life-intro-aside">{{ home.hero.current }}</p>
      </div>
    </section>

    <section class="life-block life-block--now" aria-labelledby="life-now-title">
      <header class="life-block-head">
        <span class="life-block-index">{{ home.sections.now.number }}</span>
        <h2 id="life-now-title">{{ home.sections.now.title }}</h2>
      </header>

      <div class="life-now-grid">
        <template v-for="item in lifeNow" :key="item.title">
          <NuxtLink
            v-if="item.href"
            :to="item.href"
            class="life-now-item"
          >
            <strong>{{ item.title }}</strong>
            <p>{{ item.description }}</p>
          </NuxtLink>
          <article
            v-else
            class="life-now-item"
          >
            <strong>{{ item.title }}</strong>
            <p>{{ item.description }}</p>
          </article>
        </template>
      </div>
    </section>

    <section
      class="life-block life-block--lately"
      :class="{ 'life-block--lately-empty': latelyMoments.length === 0 }"
      aria-labelledby="life-lately-title"
    >
      <header class="life-block-head life-block-head--plain">
        <span class="life-block-index">{{ home.sections.moments.number }}</span>
        <h2 id="life-lately-title">{{ home.sections.moments.title }}</h2>
      </header>

      <p v-if="latelyMoments.length === 0" class="life-lately-empty">
        {{ home.empty.moments }}
      </p>

      <div v-else class="life-lately-list">
        <article
          v-for="item in latelyMoments"
          :key="`${item.date}-${item.content}`"
          class="life-lately-item"
        >
          <time :datetime="item.date">{{ formatShortDate(item.date) }}</time>
          <div class="life-lately-body">
            <NuxtLink
              v-if="item.note"
              :to="item.note"
              class="life-lately-text"
            >
              {{ item.content }}
            </NuxtLink>
            <p v-else class="life-lately-text">{{ item.content }}</p>
            <img
              v-if="item.image"
              :src="item.image"
              alt=""
              class="life-lately-photo"
            >
          </div>
        </article>
      </div>
    </section>

    <section
      class="life-block life-block--recent"
      :class="{ 'life-block--recent-empty': !latestNotes.length }"
      aria-labelledby="life-recent-title"
    >
      <header class="life-block-head life-block-head--plain">
        <span class="life-block-index">{{ home.sections.notes.number }}</span>
        <h2 id="life-recent-title">{{ home.sections.notes.title }}</h2>
      </header>

      <p v-if="!latestNotes.length" class="life-recent-empty">
        {{ home.empty.notes }}
      </p>

      <div v-else class="life-recent-list">
        <NuxtLink
          v-for="post in latestNotes"
          :key="post._path"
          :to="post._path"
          class="life-recent-item"
        >
          <time>{{ formatShortDate(post.date) }}</time>
          <span>
            <strong>{{ post.title }}</strong>
            <em v-if="post.description">{{ post.description }}</em>
          </span>
        </NuxtLink>
      </div>
    </section>

    <section class="life-end" aria-labelledby="life-about-title">
      <div class="life-end-about">
        <h2 id="life-about-title">{{ home.sections.about.title }}</h2>
        <p>{{ home.about.description }}</p>
        <NuxtLink to="/life/about" class="life-end-link">{{ home.about.linkText }}</NuxtLink>
      </div>

      <p class="life-end-close">{{ home.closing }}</p>
    </section>
  </div>
</template>

<script setup lang="ts">
definePageMeta({
  layout: 'life'
})

type LifeHomeContent = {
  hero: {
    kicker: string
    greeting: string
    name: string
    lines: string[]
    current: string
  }
  sections: {
    now: { number: string, title: string }
    moments: { number: string, title: string }
    notes: { number: string, title: string }
    about: { title: string }
  }
  empty: {
    moments: string
    notes: string
  }
  about: {
    description: string
    linkText: string
  }
  closing: string
}

type LifeNowItem = {
  title: string
  description: string
  href?: string
}

type LifeNowContent = {
  items: LifeNowItem[]
}

type LifeMoment = {
  date: string
  content: string
  image?: string
  note?: string
}

type LifeNote = {
  _path: string
  title?: string
  description?: string
  date?: string
}

const LATEST_MOMENT_LIMIT = 6

const [{ data: homeData }, { data: now }, { data: moments }, { data: posts }] = await Promise.all([
  useAsyncData('life-home', () => $fetch<LifeHomeContent>('/api/content/life/home')),
  useAsyncData('life-now', () => $fetch<LifeNowContent>('/api/content/life/now')),
  useAsyncData('life-moments', () => $fetch<LifeMoment[]>('/api/content/life/moments')),
  useAsyncData('life-posts', () => $fetch<LifeNote[]>('/api/content/life'))
])

if (!homeData.value) {
  throw createError({ statusCode: 404, statusMessage: 'Life 首页文案不存在' })
}

const home = homeData.value
const lifeNow = computed(() => now.value?.items || [])
const latelyMoments = computed(() => (moments.value || []).slice(0, LATEST_MOMENT_LIMIT))
const latestNotes = computed(() => (posts.value || []).slice(0, 5))

const lifeHomeStamp = (() => {
  const current = new Date()
  const year = current.getFullYear()
  const month = current.getMonth() + 1
  const day = current.getDate()

  let season = '冬天'
  if (month === 3 || month === 4 || month === 5) {
    season = month === 5 ? '春末' : month === 3 && day < 20 ? '初春' : '春天'
  } else if (month === 6 || month === 7 || month === 8) {
    season = month === 8 && day >= 20 ? '夏末' : month === 6 ? '初夏' : '夏天'
  } else if (month === 9 || month === 10 || month === 11) {
    season = month === 11 ? '秋末' : month === 9 ? '初秋' : '秋天'
  } else if (month === 12) {
    season = '初冬'
  } else if (month === 2) {
    season = '冬末'
  }

  return `${year} / ${season}`
})()

const formatShortDate = (dateString?: string) => {
  if (!dateString) return ''

  const date = new Date(dateString)
  if (Number.isNaN(date.getTime())) return ''

  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${month}.${day}`
}

useHead({
  title: `${home.hero.name} - 生活`,
  meta: [
    {
      key: 'description',
      name: 'description',
      content: home.hero.current || home.hero.lines[0] || '溪午听风的生活一面。'
    }
  ]
})
</script>
