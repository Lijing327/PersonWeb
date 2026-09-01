<template>
  <div class="blog-page">
    <div class="blog-background-noise"></div>
    <div class="blog-background-container">
      <div class="blog-background-blob blog-background-blob--blue"></div>
      <div class="blog-background-blob blog-background-blob--emerald"></div>
      <div class="blog-background-blob blog-background-blob--amber"></div>
      <div class="blog-background-grid"></div>
    </div>

    <div class="blog-shell">
      <section class="blog-hero">
        <div class="blog-hero-copy">
          <div class="blog-hero-badge">
            <span class="blog-hero-badge-dot"></span>
            Writing System
          </div>
          <h1 class="blog-title">我写了什么：公开长文与复盘</h1>
          <p class="blog-subtitle">
            技术实践、项目复盘与可检索的公开文章。系统化短笔记在「知识笔记」；个人方法论在「认知说明书」。
          </p>

          <div class="blog-hero-actions">
            <a href="#blog-posts" class="blog-hero-button blog-hero-button--primary">开始阅读</a>
            <button type="button" class="blog-hero-button blog-hero-button--secondary" @click="clearSearch">
              清空筛选
            </button>
          </div>
        </div>

        <div class="blog-hero-panel">
          <div class="blog-hero-panel-head">
            <span class="blog-hero-panel-kicker">Overview</span>
            <span class="blog-hero-panel-status">Updated</span>
          </div>

          <div class="blog-hero-metrics">
            <article class="blog-metric-card">
              <span class="blog-metric-value">{{ totalPosts }}</span>
              <span class="blog-metric-label">文章总数</span>
            </article>
            <article class="blog-metric-card">
              <span class="blog-metric-value">{{ categories.length - 1 }}</span>
              <span class="blog-metric-label">内容分类</span>
            </article>
            <article class="blog-metric-card">
              <span class="blog-metric-value">{{ popularTags.length }}</span>
              <span class="blog-metric-label">热门标签</span>
            </article>
            <article class="blog-metric-card">
              <span class="blog-metric-value">{{ totalViews }}</span>
              <span class="blog-metric-label">累计阅读</span>
            </article>
          </div>

          <div class="blog-hero-highlight" v-if="featuredPosts.length > 0">
            <p class="blog-hero-highlight-title">近期推荐</p>
            <ul class="blog-hero-highlight-list">
              <li v-for="post in featuredPosts" :key="post.id || post._path" class="blog-hero-highlight-item">
                <NuxtLink :to="getArticlePath(post)" class="blog-hero-highlight-link">
                  <span class="blog-hero-highlight-name">{{ post.title }}</span>
                  <span class="blog-hero-highlight-meta">{{ post.category }}</span>
                </NuxtLink>
              </li>
            </ul>
          </div>
        </div>
      </section>

      <section class="blog-toolbar">
        <div class="blog-toolbar-search">
          <div class="blog-search-wrapper">
            <div class="blog-search-icon">
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
              </svg>
            </div>
            <input
              v-model="searchKeyword"
              type="text"
              placeholder="搜索标题、摘要、标签或分类"
              class="blog-search-input"
            >
            <button
              v-if="searchKeyword"
              class="blog-search-clear"
              @click="clearSearch"
            >
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
              </svg>
            </button>
          </div>
        </div>

        <div class="blog-toolbar-info">
          <p class="blog-toolbar-summary">
            找到 <span class="blog-toolbar-summary-count">{{ filteredPosts.length }}</span> 篇文章
          </p>
          <div class="blog-page-size-container">
            <label class="blog-page-size-label">每页显示</label>
            <select v-model="pageSize" class="blog-page-size-select">
              <option :value="10">10</option>
              <option :value="20">20</option>
              <option :value="30">30</option>
            </select>
          </div>
        </div>
      </section>

      <section class="blog-categories-panel">
        <button
          v-for="category in categories"
          :key="category"
          class="blog-category-button"
          :class="category === selectedCategory ? 'blog-category-button--active' : 'blog-category-button--inactive'"
          @click="selectCategory(category)"
        >
          {{ category }}
        </button>
      </section>

      <section class="blog-layout">
        <div class="blog-main">
          <div class="blog-section-head">
            <div>
              <p class="blog-section-kicker">Article Index</p>
              <h2 class="blog-section-title">最新整理的内容</h2>
            </div>
            <p v-if="currentPage > 1" class="blog-section-page">
              第 {{ currentPage }} / {{ totalPages }} 页
            </p>
          </div>

          <div v-if="blogLoading" class="blog-loading-state">
            <div v-for="n in 5" :key="n" class="blog-skeleton-card"></div>
          </div>

          <div v-else-if="filteredPosts.length === 0" class="blog-empty">
            <div class="blog-empty-icon">⌁</div>
            <h3 class="blog-empty-title">没有找到匹配的文章</h3>
            <p class="blog-empty-text">换个关键词，或者切回“全部文章”看看。</p>
          </div>

          <div v-else id="blog-posts" class="blog-posts-list">
            <TransitionGroup name="blog-list" tag="div" class="blog-posts-stack">
              <article
                v-for="(post, index) in paginatedPosts"
                :key="post.id || post._path"
                class="blog-post-card"
                :style="{ transitionDelay: `${index * 40}ms` }"
              >
                <div class="blog-post-card-inner">
                  <NuxtLink :to="getArticlePath(post)" class="blog-post-icon-link">
                    <div class="blog-post-icon-container">
                      <div class="blog-post-icon-overlay"></div>
                      <span class="blog-post-icon-text">{{ getCategoryIcon(post.category) }}</span>
                    </div>
                  </NuxtLink>

                  <div class="blog-post-content">
                    <div class="blog-post-meta">
                      <NuxtLink
                        :to="`/blog?category=${encodeURIComponent(post.category)}`"
                        class="blog-post-category-link"
                        @click.stop
                      >
                        {{ post.category }}
                      </NuxtLink>
                      <span class="blog-post-meta-item">{{ formatDate(post.date) }}</span>
                      <span v-if="post.viewCount" class="blog-post-meta-item">{{ post.viewCount }} 阅读</span>
                    </div>

                    <NuxtLink :to="getArticlePath(post)" class="blog-post-title-link">
                      <h3 class="blog-post-title">{{ post.title }}</h3>
                      <p class="blog-post-description">
                        {{ post.description || '这篇文章正在完善摘要，点击后可查看完整内容。' }}
                      </p>
                    </NuxtLink>

                    <div class="blog-post-footer">
                      <div class="blog-post-tags">
                        <NuxtLink
                          v-for="tag in post.tags.slice(0, 4)"
                          :key="tag"
                          :to="`/blog?search=${encodeURIComponent(tag)}`"
                          class="blog-post-tag"
                          @click.stop
                        >
                          #{{ tag }}
                        </NuxtLink>
                      </div>
                      <NuxtLink :to="getArticlePath(post)" class="blog-post-read-more">
                        阅读全文 →
                      </NuxtLink>
                    </div>
                  </div>
                </div>
              </article>
            </TransitionGroup>
          </div>

          <div v-if="totalPages > 1" class="blog-pagination">
            <button
              class="blog-pagination-button"
              :disabled="currentPage === 1"
              @click="goToPage(currentPage - 1)"
            >
              上一页
            </button>

            <div class="blog-pagination-numbers">
              <template v-for="page in visiblePages" :key="`${page}-${currentPage}`">
                <button
                  v-if="page !== -1"
                  class="blog-pagination-button"
                  :class="page === currentPage ? 'blog-pagination-button--active' : ''"
                  @click="goToPage(page)"
                >
                  {{ page }}
                </button>
                <span v-else class="blog-pagination-ellipsis">...</span>
              </template>
            </div>

            <button
              class="blog-pagination-button"
              :disabled="currentPage === totalPages"
              @click="goToPage(currentPage + 1)"
            >
              下一页
            </button>
          </div>
        </div>

        <aside class="blog-sidebar">
          <div class="blog-sidebar-card">
            <h3 class="blog-sidebar-title">
              <span class="blog-sidebar-icon blog-sidebar-icon--blue">#</span>
              热门标签
            </h3>
            <div class="blog-tags">
              <NuxtLink
                v-for="tagInfo in popularTags"
                :key="tagInfo.tag"
                :to="`/blog?search=${encodeURIComponent(tagInfo.tag)}`"
                class="blog-tag-item"
              >
                {{ tagInfo.tag }} <span class="blog-tag-count">{{ tagInfo.count }}</span>
              </NuxtLink>
            </div>
          </div>

          <div class="blog-sidebar-card">
            <h3 class="blog-sidebar-title">
              <span class="blog-sidebar-icon blog-sidebar-icon--emerald">T</span>
              时间归档
            </h3>
            <ul class="blog-archive-list">
              <li v-for="archive in timeArchives.slice(0, 6)" :key="archive.period" class="blog-archive-item">
                <span>{{ archive.period }}</span>
                <span class="blog-archive-count">{{ archive.count }}</span>
              </li>
            </ul>
          </div>

          <div class="blog-sidebar-card">
            <h3 class="blog-sidebar-title">
              <span class="blog-sidebar-icon blog-sidebar-icon--purple">C</span>
              分类统计
            </h3>
            <ul class="blog-archive-list">
              <li
                v-for="cat in categories.filter(category => category !== '全部文章').slice(0, 6)"
                :key="cat"
                class="blog-archive-item blog-archive-item--clickable"
                @click="selectCategory(cat)"
              >
                <span>{{ cat }}</span>
                <span class="blog-archive-count">{{ getCategoryCount(cat) }}</span>
              </li>
            </ul>
          </div>

          <div class="blog-back-card" @click="navigateTo('/lab')">
            <div class="blog-back-card-icon">←</div>
            <h3 class="blog-back-card-title">返回 AI 实验室</h3>
            <p class="blog-back-card-subtitle">Back to AI Lab</p>
          </div>
        </aside>
      </section>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import '~/assets/css/blog.css'

definePageMeta({
  layout: 'default'
})

usePageStyle('blog')
const { listArticles } = useArticlesRepository()

const { data: allPosts, pending: blogLoading } = useLazyAsyncData('blog-posts', async () => {
  const { list } = await listArticles({ page: 1, pageSize: 100, status: 1 })

  return list.map((article: any) => {
    const articleId = article.id || article.Id
    const articleSlug = article.slug || article.Slug
    const pathSegment = articleSlug || articleId

    return {
      ...article,
      id: articleId,
      slug: articleSlug,
      _path: pathSegment ? `/blog/${pathSegment}` : '#',
      date: article.publishTime || article.createdAt,
      category: article.categoryName || article.category?.name || '未分类',
      description: article.summary || article.description,
      tags: article.tags
        ? (Array.isArray(article.tags) ? article.tags : article.tags.split(',').filter((tag: string) => tag.trim()))
        : []
    }
  })
})

const selectedCategory = ref('全部文章')
const searchKeyword = ref('')
const currentPage = ref(1)
const pageSize = ref(10)

const totalPosts = computed(() => allPosts.value?.length || 0)
const totalViews = computed(() =>
  (allPosts.value || []).reduce((sum: number, post: any) => sum + Number(post.viewCount || 0), 0)
)
const featuredPosts = computed(() =>
  [...(allPosts.value || [])]
    .sort((a: any, b: any) => Number(b.viewCount || 0) - Number(a.viewCount || 0))
    .slice(0, 3)
)

const categories = computed(() => {
  if (!allPosts.value) return ['全部文章']
  const categorySet = new Set(allPosts.value.map((post: any) => post.category))
  return ['全部文章', ...Array.from(categorySet)]
})

const filteredPosts = computed(() => {
  if (!allPosts.value) return []

  let posts = allPosts.value

  if (selectedCategory.value !== '全部文章') {
    posts = posts.filter((post: any) => post.category === selectedCategory.value)
  }

  if (searchKeyword.value.trim()) {
    const keyword = searchKeyword.value.toLowerCase()
    posts = posts.filter((post: any) => {
      const searchFields = [
        post.title,
        post.description,
        post.category,
        post.author,
        ...(post.tags || [])
      ]
        .join(' ')
        .toLowerCase()

      return searchFields.includes(keyword)
    })
  }

  return posts
})

const paginatedPosts = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value
  const end = start + pageSize.value
  return filteredPosts.value.slice(start, end)
})

const totalPages = computed(() => Math.ceil(filteredPosts.value.length / pageSize.value))

const visiblePages = computed(() => {
  const pages: number[] = []
  const total = totalPages.value
  const current = currentPage.value

  if (total <= 7) {
    for (let index = 1; index <= total; index += 1) {
      pages.push(index)
    }
  } else if (current <= 4) {
    for (let index = 1; index <= 5; index += 1) {
      pages.push(index)
    }
    pages.push(-1, total)
  } else if (current >= total - 3) {
    pages.push(1, -1)
    for (let index = total - 4; index <= total; index += 1) {
      pages.push(index)
    }
  } else {
    pages.push(1, -1, current - 1, current, current + 1, -1, total)
  }

  return pages
})

const goToPage = (page: number) => {
  if (page < 1 || page > totalPages.value || page === currentPage.value) return
  currentPage.value = page
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

watch([selectedCategory, searchKeyword], () => {
  currentPage.value = 1
})

watch(pageSize, () => {
  currentPage.value = 1
})

const formatDate = (dateString: string) => {
  if (!dateString) return ''

  return new Date(dateString).toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
}

const getCategoryIcon = (category: string) => {
  const icons: Record<string, string> = {
    技术文章: '⌘',
    理财笔记: '¥',
    项目总结: '◧',
    生活随笔: '✦',
    运维部署: '⌥'
  }

  return icons[category] || '✎'
}

const selectCategory = (category: string) => {
  selectedCategory.value = category
  currentPage.value = 1
}

const clearSearch = () => {
  searchKeyword.value = ''
}

const timeArchives = computed(() => {
  if (!allPosts.value) return []

  const archives: Record<string, number> = {}
  allPosts.value.forEach((post: any) => {
    if (!post.date) return
    const date = new Date(post.date)
    const yearMonth = `${date.getFullYear()}年 ${date.getMonth() + 1}月`
    archives[yearMonth] = (archives[yearMonth] || 0) + 1
  })

  return Object.entries(archives)
    .map(([period, count]) => ({ period, count }))
    .sort((a, b) => b.period.localeCompare(a.period))
})

const popularTags = computed(() => {
  if (!allPosts.value) return []

  const tagCounts: Record<string, number> = {}
  allPosts.value.forEach((post: any) => {
    if (!post.tags) return
    post.tags.forEach((tag: string) => {
      tagCounts[tag] = (tagCounts[tag] || 0) + 1
    })
  })

  return Object.entries(tagCounts)
    .map(([tag, count]) => ({ tag, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10)
})

const getCategoryCount = (category: string) => {
  if (!allPosts.value) return 0
  return allPosts.value.filter((post: any) => post.category === category).length
}

const getArticlePath = (post: any) => {
  const pathSegment = post.slug || post.id
  return pathSegment ? `/blog/${pathSegment}` : '/blog'
}

usePageSeo({
  title: '技术博客 - 溪午听风',
  description: '公开长文：技术实践、项目复盘与工程经验。',
  path: '/blog',
  world: 'work',
})
</script>

<style scoped>
/* 页面主要样式已移至 assets/css/blog.css */
</style>
