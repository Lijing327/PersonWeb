<template>
  <div class="life-home">
    <section class="life-hero" aria-labelledby="life-intro-title">
      <div class="life-hero-copy">
        <div class="life-hero-decorations" aria-hidden="true">
          <aside class="life-scrap">
            <span class="life-tape life-tape--scrap"></span>
            <div class="life-scrap-paper">
              <LifeIcon name="branch" />
            </div>
          </aside>
          <svg class="life-title-seal" viewBox="0 0 88 88">
            <circle cx="44" cy="44" r="40" />
            <circle cx="44" cy="44" r="34" />
            <path d="M32 58c10-4 16-14 18-28-12 2-20 10-22 24Z" />
            <path d="M44 32c6-8 14-12 22-8" />
            <path d="M36 48c8-6 14-10 22-12" />
          </svg>
        </div>

        <div class="life-hero-content">
          <p class="life-intro-kicker">{{ home.hero.kicker }}</p>
          <p class="life-intro-hello">{{ home.hero.greeting }}</p>
          <div class="life-hero-heading">
            <h1 id="life-intro-title">{{ home.hero.name }}</h1>
            <span class="life-title-rule">
              <span></span>
              <LifeIcon name="leaf" />
            </span>
          </div>
          <p
            v-for="line in home.hero.lines"
            :key="line"
            class="life-intro-lead"
          >
            {{ line }}
          </p>
        </div>
      </div>

      <div class="life-hero-scene">
        <p class="life-intro-stamp">
          {{ lifeHomeStamp }}
          <span class="life-intro-stamp-rule" aria-hidden="true">
            <span></span>
            <LifeIcon name="leaf" />
          </span>
        </p>
        <div class="life-scene-frame">
          <img
            src="/images/life/hero-desk.webp"
            alt=""
            width="1200"
            height="900"
            decoding="async"
            fetchpriority="high"
          >
          <div class="life-scene-light" aria-hidden="true"></div>
        </div>
      </div>
    </section>

    <div class="life-sheet">
      <section class="life-row life-row--now" aria-labelledby="life-now-title">
        <span class="life-num">{{ home.sections.now.number }}</span>
        <div class="life-row-body">
          <h2 id="life-now-title">{{ home.sections.now.title }}</h2>
          <div class="life-now-grid">
            <template v-for="item in lifeNow" :key="item.title">
              <NuxtLink
                v-if="item.href"
                :to="item.href"
                class="life-now-item"
              >
                <LifeIcon :name="nowIconOf(item)" />
                <strong>{{ item.title }}</strong>
                <p>{{ item.description }}</p>
              </NuxtLink>
              <article
                v-else
                class="life-now-item"
              >
                <LifeIcon :name="nowIconOf(item)" />
                <strong>{{ item.title }}</strong>
                <p>{{ item.description }}</p>
              </article>
            </template>
          </div>
        </div>
      </section>

      <section
        class="life-row"
        :class="{ 'life-row--empty': latelyMoments.length === 0 }"
        aria-labelledby="life-lately-title"
      >
        <span class="life-num">{{ home.sections.moments.number }}</span>
        <div class="life-row-body">
          <div class="life-row-line">
            <LifeIcon name="bubble" />
            <h2 id="life-lately-title">{{ home.sections.moments.title }}</h2>
            <p v-if="latelyMoments.length === 0" class="life-row-desc">
              {{ home.empty.moments }}
            </p>
          </div>

          <div v-if="latelyMoments.length" class="life-lately-list">
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
        </div>
      </section>

      <section
        class="life-row"
        :class="{ 'life-row--empty': !latestNotes.length }"
        aria-labelledby="life-recent-title"
      >
        <span class="life-num">{{ home.sections.notes.number }}</span>
        <div class="life-row-body">
          <div class="life-row-line">
            <LifeIcon name="pencil" />
            <h2 id="life-recent-title">{{ home.sections.notes.title }}</h2>
            <p v-if="!latestNotes.length" class="life-row-desc">
              {{ home.empty.notes }}
            </p>
          </div>

          <div v-if="latestNotes.length" class="life-recent-list">
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
        </div>
      </section>

      <section class="life-row life-row--about" aria-labelledby="life-about-title">
        <span class="life-num">{{ home.sections.about.number }}</span>
        <div class="life-row-body">
          <div class="life-row-line">
            <LifeIcon name="vase" />
            <h2 id="life-about-title">{{ home.sections.about.title }}</h2>
            <p class="life-row-desc">{{ home.about.description }}</p>
          </div>
          <NuxtLink to="/life/about" class="life-end-link">{{ home.about.linkText }}</NuxtLink>
        </div>
      </section>

      <p class="life-end-close">
        <span class="life-tape life-tape--close" aria-hidden="true"></span>
        {{ home.closing }}
      </p>
    </div>
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
    about: { number: string, title: string }
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
  icon?: string
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

const nowIconOf = (item: LifeNowItem) => {
  if (item.icon) return item.icon

  const title = item.title || ''
  if (title.includes('运动')) return 'sneaker'
  if (title.includes('三国') || title.includes('茶')) return 'cards'
  if (title.includes('骑')) return 'bike'
  return 'leaf'
}

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

usePageSeo({
  title: `${home.hero.name} - 生活`,
  description: home.hero.current || home.hero.lines[0] || '溪午听风的生活一面。',
  path: '/life',
  world: 'life',
})
</script>
