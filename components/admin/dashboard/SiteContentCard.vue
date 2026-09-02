<template>
  <AppCard class="dashboard-card site-content-card">
    <template #header>
      <div class="site-content-card-header">
        <div>
          <h3 class="chart-title">站点内容</h3>
          <p class="site-content-card-sub">前台工具与友情链接</p>
        </div>
        <AppButton variant="primary" size="sm" @click="navigateTo('/admin/content')">
          管理
        </AppButton>
      </div>
    </template>

    <div v-if="loading" class="site-content-loading">加载中…</div>
    <div v-else class="site-content-grid">
      <div class="site-content-block">
        <div class="site-content-block-head">
          <span><i class="fas fa-tools mr-2"></i>工具</span>
          <span class="site-content-count">{{ toolStats.published }}/{{ toolStats.total }} 已发布</span>
        </div>
        <ul v-if="previewTools.length" class="site-content-list">
          <li v-for="tool in previewTools" :key="tool.id">
            <span>{{ tool.icon || '🛠️' }} {{ tool.name }}</span>
            <span class="site-content-tag">{{ tool.isFree ? '免费' : '付费' }}</span>
          </li>
        </ul>
        <p v-else class="site-content-empty">暂无工具</p>
      </div>

      <div class="site-content-block">
        <div class="site-content-block-head">
          <span><i class="fas fa-link mr-2"></i>友情链接</span>
          <span class="site-content-count">{{ activeLinks }}/{{ friendLinks.length }} 启用</span>
        </div>
        <ul v-if="previewLinks.length" class="site-content-list">
          <li v-for="link in previewLinks" :key="link.id">
            <span>{{ link.name }}</span>
            <a :href="link.url" target="_blank" rel="noopener noreferrer" class="site-content-link">访问</a>
          </li>
        </ul>
        <p v-else class="site-content-empty">暂无友链</p>
      </div>
    </div>
  </AppCard>
</template>

<script setup lang="ts">
import AppCard from '~/components/ui/AppCard.vue'
import AppButton from '~/components/ui/AppButton.vue'

interface ToolPreview {
  id: number
  name: string
  icon?: string
  isFree: boolean
  status: string
}

interface LinkPreview {
  id: number
  name: string
  url: string
  status: number
}

const api = useApi()
const loading = ref(true)
const tools = ref<ToolPreview[]>([])
const friendLinks = ref<LinkPreview[]>([])

const toolStats = computed(() => {
  const total = tools.value.length
  const published = tools.value.filter(tool => tool.status === 'published').length
  return { total, published }
})

const activeLinks = computed(() => friendLinks.value.filter(link => link.status === 1).length)

const previewTools = computed(() =>
  tools.value.filter(tool => tool.status === 'published').slice(0, 4),
)

const previewLinks = computed(() =>
  friendLinks.value.filter(link => link.status === 1).slice(0, 4),
)

const fetchPreview = async () => {
  loading.value = true
  try {
    const [toolsRes, linksRes] = await Promise.all([
      api.get('/Toolbox/admin/list?pageSize=100', { silent: true }).catch(() => null),
      api.get<{ List?: LinkPreview[] }>('/FriendLinks/all', { silent: true }).catch(() => null),
    ])
    if (toolsRes?.tools) tools.value = toolsRes.tools
    else if (toolsRes?.data?.tools) tools.value = toolsRes.data.tools
    else if (Array.isArray(toolsRes)) tools.value = toolsRes
    friendLinks.value = linksRes?.List || []
  } finally {
    loading.value = false
  }
}

onMounted(fetchPreview)
</script>

<style scoped>
.site-content-card-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 1rem;
}

.site-content-card-sub {
  margin-top: 0.15rem;
  font-size: var(--font-size-xs);
  color: var(--color-text-muted);
}

.site-content-grid {
  display: grid;
  gap: 1rem;
  grid-template-columns: repeat(2, minmax(0, 1fr));
}

@media (max-width: 768px) {
  .site-content-grid {
    grid-template-columns: 1fr;
  }
}

.site-content-block {
  padding: 0.85rem 1rem;
  border-radius: var(--radius-md);
  border: 1px solid var(--color-border-subtle);
  background: var(--color-bg-elevated);
}

.site-content-block-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 0.65rem;
  font-size: var(--font-size-sm);
  font-weight: 600;
  color: var(--color-text-main);
}

.site-content-count {
  font-size: var(--font-size-xs);
  font-weight: 500;
  color: var(--color-text-muted);
}

.site-content-list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 0.45rem;
}

.site-content-list li {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem;
  font-size: var(--font-size-sm);
  color: var(--color-text-main);
}

.site-content-tag {
  font-size: var(--font-size-xs);
  color: var(--color-text-muted);
}

.site-content-link {
  font-size: var(--font-size-xs);
  color: var(--color-primary);
}

.site-content-empty,
.site-content-loading {
  font-size: var(--font-size-sm);
  color: var(--color-text-muted);
}
</style>
