<template>
  <div class="tools-page">
    <div class="tools-background-noise"></div>

    <div class="tools-background-container">
      <div class="tools-background-blob tools-background-blob--orange"></div>
      <div class="tools-background-blob tools-background-blob--red"></div>
      <div class="tools-background-blob tools-background-blob--amber"></div>
    </div>

    <div class="tools-content">
      <header class="tools-header">
        <div class="tools-header-icon">
          <span>🧰</span>
        </div>
        <div class="tools-hero-eyebrow">Tools Collection</div>
        <h1 class="tools-title">轻量工具：单功能、直接用</h1>
        <p class="tools-subtitle">
          与「产品」不同：这里是可获取的插件与脚本合集，解决具体效率问题；完整产品线请回产品中心。
        </p>

        <div class="tools-highlight-list">
          <span class="tools-highlight-pill">Revit / CAD 效率增强</span>
          <span class="tools-highlight-pill">前后端开发配套</span>
          <span class="tools-highlight-pill">支持定制化开发</span>
        </div>
      </header>

      <div class="tools-stats-grid">
        <div
          v-for="stat in toolStats"
          :key="stat.label"
          class="tools-stat-card"
        >
          <div class="tools-stat-value" :class="stat.valueClass">
            {{ stat.value }}
          </div>
          <div class="tools-stat-label">{{ stat.label }}</div>
          <p class="tools-stat-description">{{ stat.description }}</p>
        </div>
      </div>

      <section class="tools-section">
        <div class="tools-section-head">
          <div>
            <div class="tools-section-kicker">精选清单</div>
            <h2 class="tools-section-title">当前可用工具</h2>
          </div>
          <p class="tools-section-description">
            优先展示已经整理完说明与购买入口的工具，后续会持续补充更多专题工具包。
          </p>
        </div>

        <div v-if="pending" class="tools-loading">
          <div class="tools-loading-spinner"></div>
          <p class="tools-loading-text">正在整理工具清单...</p>
        </div>

        <div v-else-if="error" class="tools-error">
          <div class="tools-error-icon">:(</div>
          <h3 class="tools-error-title">工具列表加载失败</h3>
          <p class="tools-error-message">{{ error }}</p>
        </div>

        <div v-else-if="tools.length === 0" class="tools-empty">
          <div class="tools-empty-icon">📦</div>
          <h3 class="tools-empty-title">暂时还没有可展示的工具</h3>
          <p class="tools-empty-description">
            你可以先逛逛工具商城，或者联系我做定制开发。
          </p>
        </div>

        <div v-else class="tools-grid">
          <TransitionGroup name="tools-list">
            <article
              v-for="(tool, index) in tools"
              :key="tool.id"
              class="tools-card group"
              :style="{ transitionDelay: `${index * 50}ms` }"
            >
              <div class="tools-card-glow"></div>

              <div
                v-if="index === 0 || tool.isHot"
                class="tools-card-ribbon"
              >
                推荐
              </div>

              <div class="tools-card-header">
                <div class="tools-card-top">
                  <div class="tools-card-icon">
                    {{ tool.icon }}
                  </div>
                  <div class="tools-card-price">
                    <div class="tools-card-price-current">
                      {{ formatPrice(tool.price) }}
                    </div>
                    <div v-if="tool.price > 0" class="tools-card-price-original">
                      {{ formatPrice(Math.round(tool.price * 1.5)) }}
                    </div>
                    <div v-else class="tools-card-price-original tools-card-price-original--free">
                      可咨询授权
                    </div>
                  </div>
                </div>

                <div class="tools-card-meta">
                  <span class="tools-card-category">{{ tool.category }}</span>
                  <span class="tools-card-dot"></span>
                  <span class="tools-card-slug">{{ tool.slug }}</span>
                </div>

                <h3 class="tools-card-title">{{ tool.title }}</h3>

                <p class="tools-card-description">
                  {{ tool.description }}
                </p>

                <div class="tools-card-tags">
                  <span
                    v-for="tag in tool.tags"
                    :key="tag"
                    class="tools-card-tag"
                  >
                    {{ tag }}
                  </span>
                </div>
              </div>

              <div class="tools-card-footer">
                <div class="tools-card-actions">
                  <NuxtLink
                    :to="tool.detailPath"
                    class="tools-card-button tools-card-button--secondary"
                  >
                    查看详情
                  </NuxtLink>

                  <button
                    type="button"
                    class="tools-card-button tools-card-button--primary group/buy"
                    :class="{ 'tools-card-button--consult': !tool.buyLink }"
                    @click="handleAcquire(tool)"
                  >
                    <span>立即获取</span>
                    <svg
                      class="tools-card-button-icon"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        stroke-width="2"
                        d="M13 7h4m0 0v4m0-4L10 14"
                      ></path>
                    </svg>
                  </button>
                </div>
              </div>
            </article>
          </TransitionGroup>
        </div>
      </section>

      <div class="tools-navigation">
        <NuxtLink
          to="/tools/marketplace"
          class="tools-nav-button tools-nav-button--primary"
        >
          🛒 工具商城
        </NuxtLink>
        <NuxtLink
          to="/tools/collections"
          class="tools-nav-button tools-nav-button--secondary"
        >
          📦 工具合集
        </NuxtLink>
        <NuxtLink
          to="/tools/my-tools"
          class="tools-nav-button tools-nav-button--secondary"
        >
          🗂 我的工具
        </NuxtLink>
      </div>

      <section class="tools-cta">
        <div class="tools-cta-container">
          <div class="tools-cta-overlay"></div>

          <div class="tools-cta-content">
            <div class="tools-section-kicker">Custom Service</div>
            <h3 class="tools-cta-title">需要定制开发或专属工具？</h3>
            <p class="tools-cta-description">
              可以基于你的业务流程，定制 Revit / AutoCAD / Office / 浏览器插件、自动化脚本与内部效率工具，让重复工作真正交给工具完成。
            </p>

            <div class="tools-cta-points">
              <span>插件二开</span>
              <span>自动化脚本</span>
              <span>小型业务工具</span>
            </div>

            <button
              type="button"
              class="tools-cta-button"
              @click="showWeChatQR = true"
            >
              <span>💬</span>
              联系定制
            </button>
          </div>

          <div
            v-if="showWeChatQR"
            class="wechat-qr-modal"
            role="dialog"
            aria-modal="true"
            aria-label="微信联系二维码"
            @click="showWeChatQR = false"
          >
            <div class="wechat-qr-content" @click.stop>
              <button
                type="button"
                class="wechat-qr-close"
                aria-label="关闭微信二维码"
                @click="showWeChatQR = false"
              >
                <i class="fas fa-times" aria-hidden="true"></i>
              </button>

              <div class="wechat-qr-header">
                <h3 class="wechat-qr-title">联系定制开发</h3>
                <p class="wechat-qr-subtitle">扫码添加微信，详聊你的需求</p>
              </div>

              <div class="wechat-qr-image-wrapper">
                <img
                  src="/images/wechat-qr.png"
                  alt="微信二维码"
                  class="wechat-qr-image"
                  width="200"
                  height="200"
                  decoding="async"
                />
              </div>

              <div class="wechat-qr-info">
                <p class="wechat-qr-text">微信号：LinXi-5152</p>
                <p class="wechat-qr-hint">扫码加好友，请备注来源与需求方向</p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue'
import '~/assets/css/tools.css'

definePageMeta({
  layout: 'default'
})

interface RawToolItem {
  _path?: string
  title?: string
  name?: string
  slug?: string
  description?: string
  price?: number | string
  tags?: string[] | string | null
  buy_link?: string
  buyLink?: string
  isHot?: boolean
  hot?: boolean
  icon?: string
  category?: string
}

interface ToolItem {
  id: string
  title: string
  slug: string
  description: string
  price: number
  tags: string[]
  buyLink: string | null
  detailPath: string
  isHot: boolean
  icon: string
  category: string
}

const api = useApi()
usePageStyle('tools')

const tools = ref<ToolItem[]>([])
const pending = ref(true)
const error = ref<string | null>(null)
const showWeChatQR = ref(false)

const normalizeTags = (value: RawToolItem['tags']): string[] => {
  if (Array.isArray(value)) {
    return value.filter((tag): tag is string => Boolean(tag && tag.trim()))
  }

  if (typeof value === 'string' && value.trim()) {
    return value
      .split(/[,\u3001|/]/)
      .map(tag => tag.trim())
      .filter(Boolean)
  }

  return []
}

const normalizeTool = (tool: RawToolItem, index: number): ToolItem => {
  const slug = tool.slug || tool._path?.split('/').pop() || `tool-${index + 1}`
  const title = tool.title || tool.name || `工具 ${index + 1}`
  const tags = normalizeTags(tool.tags)
  const price = Number(tool.price) || 0
  const rawBuyLink = (tool.buy_link || tool.buyLink || '').trim()
  const buyLink = /^https?:\/\//i.test(rawBuyLink) ? rawBuyLink : null

  return {
    id: tool._path || slug,
    title,
    slug,
    description: tool.description?.trim() || '用于提升工作效率的实用工具，支持快速上手与按需扩展。',
    price,
    tags: tags.length > 0 ? tags.slice(0, 5) : ['效率工具', '工作流优化'],
    buyLink,
    detailPath: `/tools/${slug}`,
    isHot: Boolean(tool.isHot || tool.hot),
    icon: tool.icon || '🔧',
    category: tool.category || (tags[0] ?? '工具包')
  }
}

const fetchTools = async () => {
  try {
    pending.value = true
    error.value = null

    // PRIMARY: Toolbox marketplace (MySQL Tools). No markdown / MockData dual-track.
    const res = await api.get<any>('/Toolbox/marketplace', {
      params: { page: 1, pageSize: 100, sortBy: 'newest' },
    })
    const list = res?.tools || res?.Tools || (Array.isArray(res) ? res : [])
    if (Array.isArray(list) && list.length > 0) {
      tools.value = list.map((item: RawToolItem, index: number) => normalizeTool(item, index))
      return
    }

    tools.value = []
  } catch (e) {
    console.error('Failed to fetch tools:', e)
    error.value = e instanceof Error ? e.message : '工具列表加载失败，请稍后重试。'
    tools.value = []
  } finally {
    pending.value = false
  }
}

const handleAcquire = (tool: ToolItem) => {
  if (tool.buyLink) {
    window.open(tool.buyLink, '_blank', 'noopener,noreferrer')
    return
  }

  showWeChatQR.value = true
}

const uniqueTagCount = computed(() => {
  const tagSet = new Set<string>()
  tools.value.forEach(tool => {
    tool.tags.forEach(tag => tagSet.add(tag))
  })
  return tagSet.size
})

const toolStats = computed(() => [
  {
    label: '精选工具',
    value: `${tools.value.length}+`,
    description: '已整理好的可展示工具与工具包',
    valueClass: 'tools-stat-value--orange'
  },
  {
    label: '覆盖标签',
    value: `${uniqueTagCount.value}+`,
    description: '涵盖建模、开发、自动化等方向',
    valueClass: 'tools-stat-value--red'
  },
  {
    label: '支持方式',
    value: '1v1',
    description: '支持咨询、购买与定制开发沟通',
    valueClass: 'tools-stat-value--green'
  }
])

const formatPrice = (price: number) => {
  if (price <= 0) {
    return '咨询'
  }

  return `¥${price}`
}

const onWeChatKeydown = (event: KeyboardEvent) => {
  if (event.key === 'Escape') {
    showWeChatQR.value = false
  }
}

onMounted(() => {
  fetchTools()
  window.addEventListener('keydown', onWeChatKeydown)
})

onUnmounted(() => {
  window.removeEventListener('keydown', onWeChatKeydown)
})

usePageSeo({
  title: '插件工具 - 溪午听风',
  description: '轻量、单功能的插件与脚本：可获取、可定制，区别于完整产品线。',
  path: '/tools',
  world: 'work',
})
</script>

<style scoped>
.wechat-qr-modal {
  position: fixed;
  inset: 0;
  z-index: 9999;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(2, 6, 23, 0.72);
  backdrop-filter: blur(10px);
  animation: fadeIn 0.2s ease-out;
}

@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

.wechat-qr-content {
  position: relative;
  width: min(92vw, 420px);
  padding: 2rem;
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 1.5rem;
  background:
    linear-gradient(180deg, rgba(15, 23, 42, 0.96) 0%, rgba(15, 23, 42, 0.9) 100%);
  box-shadow:
    0 30px 60px rgba(2, 6, 23, 0.45),
    0 0 0 1px rgba(255, 255, 255, 0.03);
  color: #e2e8f0;
  animation: slideUp 0.28s ease-out;
}

@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.wechat-qr-close {
  position: absolute;
  top: 1rem;
  right: 1rem;
  width: 2.25rem;
  height: 2.25rem;
  border: 0;
  border-radius: 9999px;
  background: rgba(255, 255, 255, 0.06);
  color: rgba(226, 232, 240, 0.78);
  cursor: pointer;
  transition:
    background-color 0.2s ease,
    color 0.2s ease,
    transform 0.2s ease;
}

.wechat-qr-close:hover {
  background: rgba(255, 255, 255, 0.12);
  color: #fff;
  transform: rotate(90deg);
}

.wechat-qr-header,
.wechat-qr-info {
  text-align: center;
}

.wechat-qr-header {
  margin-bottom: 1.5rem;
}

.wechat-qr-title {
  margin: 0 0 0.5rem;
  font-size: 1.5rem;
  font-weight: 700;
  color: #f8fafc;
}

.wechat-qr-subtitle {
  margin: 0;
  font-size: 0.92rem;
  color: rgba(191, 219, 254, 0.72);
}

.wechat-qr-image-wrapper {
  display: flex;
  justify-content: center;
  margin-bottom: 1.5rem;
}

.wechat-qr-image {
  width: min(250px, 100%);
  border-radius: 1rem;
  border: 1px solid rgba(255, 255, 255, 0.08);
  background: #fff;
}

.wechat-qr-text {
  margin: 0 0 0.5rem;
  font-size: 1rem;
  font-weight: 600;
  color: #f8fafc;
}

.wechat-qr-hint {
  margin: 0;
  font-size: 0.875rem;
  color: rgba(148, 163, 184, 0.88);
}
</style>
