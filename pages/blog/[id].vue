<template>
  <div class="blog-detail-page">
    <div class="blog-shell">
      <div v-if="pending && !article" class="blog-detail-loading">
        <div class="blog-detail-spinner"></div>
      </div>

      <div v-else-if="article" class="blog-layout">
        <div class="blog-detail-card">
          <header class="blog-detail-header">
            <h1 class="blog-detail-title">{{ article.title }}</h1>
            <div class="blog-detail-meta">
              <span class="blog-detail-meta-item">
                <span class="blog-detail-meta-icon">📅</span>
                {{ formatDate(article.publishTime || article.createdAt) }}
              </span>
              <span v-if="article.category" class="blog-detail-meta-item">
                <span class="blog-detail-meta-icon">📂</span>
                {{ article.category.name }}
              </span>
            </div>
          </header>

          <div v-if="toc.length > 0" class="lg:hidden blog-detail-toc-card">
            <header class="blog-detail-toc-header">
              <span class="blog-detail-toc-icon">📋</span>
              <h3 class="blog-detail-toc-title">目录</h3>
            </header>
            <nav class="blog-detail-toc-nav">
              <ul class="blog-detail-toc-list">
                <li v-for="item in toc" :key="item.id" class="blog-detail-toc-item">
                  <a
                    :href="`#${item.id}`"
                    @click.prevent="scrollTo(item.id)"
                    :class="['blog-detail-toc-link', `blog-detail-toc-link--level-${item.level}`]"
                  >
                    {{ item.text }}
                  </a>
                </li>
              </ul>
            </nav>
          </div>

          <article class="blog-detail-content prose dark:prose-invert max-w-none" v-html="renderedContent"></article>
        </div>

        <aside class="hidden lg:block w-80">
          <div class="sticky top-24">
            <div v-if="toc.length > 0" class="blog-detail-toc-card">
              <header class="blog-detail-toc-header">
                <span class="blog-detail-toc-icon">📋</span>
                <h3 class="blog-detail-toc-title">目录</h3>
              </header>
              <nav class="blog-detail-toc-nav">
                <ul class="blog-detail-toc-list">
                  <li v-for="item in toc" :key="item.id" class="blog-detail-toc-item">
                    <a
                      :href="`#${item.id}`"
                      @click.prevent="scrollTo(item.id)"
                      :class="['blog-detail-toc-link', `blog-detail-toc-link--level-${item.level}`]"
                      :title="item.text"
                    >
                      {{ item.text }}
                    </a>
                  </li>
                </ul>
              </nav>
            </div>

            <div class="blog-detail-back-card">
              <NuxtLink to="/blog" class="blog-detail-back-link">
                ← 返回博客列表
              </NuxtLink>
            </div>
          </div>
        </aside>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import MarkdownIt from 'markdown-it'
import { isNotFoundError } from '~/composables/useBackendFetch'
import { usePageSeo, useJsonLd, toAbsoluteUrl } from '~/composables/usePageSeo'
import '~/assets/css/blog.css'

definePageMeta({
  layout: 'default',
})

const route = useRoute()
const md = new MarkdownIt({
  html: true,
  linkify: true,
  typographer: true,
})

const idOrSlug = String(route.params.id || '')
const { getArticleByIdOrSlug, recordArticleView } = useArticlesRepository()

const { data: article, pending, error } = await useAsyncData(
  `blog-article-${idOrSlug}`,
  async () => {
    try {
      return await getArticleByIdOrSlug(idOrSlug)
    } catch (e) {
      if (isNotFoundError(e) || (e as any)?.statusCode === 404) {
        throw createError({ statusCode: 404, statusMessage: 'Not Found' })
      }
      throw createError({ statusCode: 502, statusMessage: 'Upstream error' })
    }
  },
)

if (error.value && isNotFoundError(error.value)) {
  throw createError({ statusCode: 404, statusMessage: 'Not Found' })
}

if (!article.value && !pending.value) {
  throw createError({ statusCode: 404, statusMessage: 'Not Found' })
}

// Client-only view count — avoids SSR + hydration double increment
onMounted(() => {
  const slug = article.value?.slug
  if (slug) recordArticleView(slug)
})

const renderArticle = (contentMd: string) => {
  const tokens = md.parse(contentMd, {})
  const tocList: Array<{ id: string; text: string; level: number }> = []
  let firstH1Index = -1

  for (let i = 0; i < tokens.length; i++) {
    const token = tokens[i]
    if (token.type === 'heading_open') {
      const level = parseInt(token.tag.slice(1))
      if (level === 1 && firstH1Index === -1) {
        firstH1Index = i
        break
      }
    }
  }

  const filteredTokens: typeof tokens = []
  for (let i = 0; i < tokens.length; i++) {
    if (firstH1Index !== -1) {
      if (i === firstH1Index) continue
      if (i === firstH1Index + 1) continue
      if (i === firstH1Index + 2 && tokens[i].type === 'heading_close') continue
    }
    filteredTokens.push(tokens[i])
  }

  filteredTokens.forEach((token, index) => {
    if (token.type === 'heading_open') {
      const level = parseInt(token.tag.slice(1))
      const contentToken = filteredTokens[index + 1]
      if (contentToken && contentToken.type === 'inline') {
        const text = contentToken.content
        const id = `h-${index}`
        token.attrSet('id', id)
        if (level >= 2 && level <= 3) {
          tocList.push({ id, text, level })
        }
      }
    }
  })

  return {
    html: md.renderer.render(filteredTokens, md.options, {}),
    toc: tocList,
  }
}

const rendered = computed(() => {
  if (!article.value?.contentMd) {
    return { html: '', toc: [] as Array<{ id: string; text: string; level: number }> }
  }
  return renderArticle(article.value.contentMd)
})

const renderedContent = computed(() => rendered.value.html)
const toc = computed(() => rendered.value.toc)

const formatDate = (dateStr: string) => {
  if (!dateStr) return ''
  return new Date(dateStr).toLocaleDateString()
}

const scrollTo = (id: string) => {
  const el = document.getElementById(id)
  if (el) {
    el.scrollIntoView({ behavior: 'smooth' })
  }
}

usePageSeo(() => ({
  title: `${article.value?.seoTitle || article.value?.title || '文章'} - 溪午听风`,
  description: article.value?.seoDescription || article.value?.summary || article.value?.description || '溪午听风的技术文章。',
  path: article.value?.canonicalUrl || `/blog/${article.value?.slug || idOrSlug}`,
  image: article.value?.coverUrl || null,
  type: 'article',
  world: 'work',
}))

useJsonLd(() => {
  if (!article.value) return null
  const path = article.value.canonicalUrl || `/blog/${article.value.slug || idOrSlug}`
  return {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: article.value.title,
    description: article.value.seoDescription || article.value.summary || article.value.description || undefined,
    datePublished: article.value.publishTime || article.value.createdAt || undefined,
    author: {
      '@type': 'Person',
      name: '溪午听风',
    },
    mainEntityOfPage: toAbsoluteUrl(path),
    image: article.value.coverUrl ? toAbsoluteUrl(article.value.coverUrl) : undefined,
  }
})
</script>

<style>
html {
  scroll-behavior: smooth;
}
</style>
