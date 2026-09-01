<template>
  <div class="error-logs-page">
    <PageHeader
      title="错误日志"
      description="集中查看异常、趋势变化和处理状态，便于快速定位高频问题。"
      class="error-logs-header"
    >
      <template #actions>
        <button @click="fetchErrorLogs" class="refresh-button">
          刷新
        </button>
      </template>
    </PageHeader>

    <section class="stats-grid">
      <article class="stat-card">
        <span class="stat-card__label">总错误数</span>
        <strong class="stat-card__value">{{ stats.Total || 0 }}</strong>
      </article>
      <article class="stat-card">
        <span class="stat-card__label">未处理</span>
        <strong class="stat-card__value stat-card__value--error">{{ stats.Unhandled || 0 }}</strong>
      </article>
      <article class="stat-card">
        <span class="stat-card__label">已处理</span>
        <strong class="stat-card__value stat-card__value--success">{{ stats.Handled || 0 }}</strong>
      </article>
      <article class="stat-card">
        <span class="stat-card__label">已忽略</span>
        <strong class="stat-card__value stat-card__value--muted">{{ stats.Ignored || 0 }}</strong>
      </article>
    </section>

    <section class="charts-grid">
      <article class="panel-card">
        <h2 class="panel-card__title">错误类型分布</h2>
        <div v-if="stats.ByType && stats.ByType.length > 0" class="chart-shell">
          <ChartsAppEChart :option="typeEChartOption" loading-text="图表加载中..." />
        </div>
        <div v-else class="empty-state">暂无数据</div>
      </article>

      <article class="panel-card">
        <h2 class="panel-card__title">最近 7 天错误趋势</h2>
        <div v-if="stats.RecentErrors && stats.RecentErrors.length > 0" class="chart-shell">
          <ChartsAppEChart :option="trendEChartOption" loading-text="图表加载中..." />
        </div>
        <div v-else class="empty-state">暂无数据</div>
      </article>
    </section>

    <section class="panel-card filters-card">
      <div class="filters-row">
        <select v-model="filters.errorType" @change="fetchErrorLogs" class="filter-select">
          <option value="">全部类型</option>
          <option value="JavaScript">JavaScript</option>
          <option value="Promise">Promise</option>
          <option value="Vue">Vue</option>
          <option value="API">API</option>
          <option value="Server">Server</option>
        </select>
        <select v-model="filters.status" @change="fetchErrorLogs" class="filter-select">
          <option :value="null">全部状态</option>
          <option :value="0">未处理</option>
          <option :value="1">已处理</option>
          <option :value="2">已忽略</option>
        </select>
      </div>
    </section>

    <section class="panel-card logs-card">
      <div v-if="loading" class="loading-state">
        <div class="loading-spinner"></div>
      </div>
      <div v-else-if="errorLogs.length === 0" class="empty-state">
        暂无错误日志
      </div>
      <div v-else class="logs-list">
        <article
          v-for="log in errorLogs"
          :key="log.id"
          class="log-item"
        >
          <div class="log-item__main">
            <div class="log-item__badges">
              <span
                class="status-badge"
                :class="{
                  'status-badge--error': log.status === 0,
                  'status-badge--success': log.status === 1,
                  'status-badge--muted': log.status === 2
                }"
              >
                {{ statusLabel(log.status) }}
              </span>
              <span class="type-badge">{{ log.errorType }}</span>
            </div>
            <h3 class="log-item__title">{{ log.errorMessage }}</h3>
            <p class="log-item__url">{{ log.errorUrl }}</p>
            <p class="log-item__meta">
              {{ formatDate(log.createdAt) }} | IP: {{ log.userIp || '未知' }}
            </p>
          </div>
          <div class="log-item__actions">
            <button
              @click="viewErrorLog(log.id)"
              class="action-button action-button--primary"
            >
              查看详情
            </button>
            <button
              v-if="log.status === 0"
              @click="updateStatus(log.id, 1)"
              class="action-button action-button--success"
            >
              标记已处理
            </button>
            <button
              v-if="log.status === 0"
              @click="updateStatus(log.id, 2)"
              class="action-button action-button--secondary"
            >
              忽略
            </button>
          </div>
        </article>
      </div>
    </section>

    <div v-if="total > pageSize" class="pagination">
      <button
        @click="page = Math.max(1, page - 1); fetchErrorLogs()"
        :disabled="page === 1"
        class="pagination-button"
      >
        上一页
      </button>
      <span class="pagination-text">
        第 {{ page }} 页，共 {{ Math.ceil(total / pageSize) }} 页
      </span>
      <button
        @click="page = Math.min(Math.ceil(total / pageSize), page + 1); fetchErrorLogs()"
        :disabled="page >= Math.ceil(total / pageSize)"
        class="pagination-button"
      >
        下一页
      </button>
    </div>

    <div
      v-if="showDetail"
      class="modal-overlay"
      @click.self="showDetail = false"
    >
      <div class="modal-content">
        <div class="modal-header">
          <h2>错误详情</h2>
          <button
            @click="showDetail = false"
            class="modal-close"
          >
            <i class="fas fa-times"></i>
          </button>
        </div>
        <div class="modal-body">
          <div v-if="detailLoading" class="loading-state">
            <div class="loading-spinner"></div>
          </div>
          <div v-else-if="errorDetail" class="detail-stack">
            <div class="detail-item">
              <h3 class="detail-item__label">错误类型</h3>
              <p class="detail-item__value">{{ errorDetail.errorType }}</p>
            </div>
            <div class="detail-item">
              <h3 class="detail-item__label">错误消息</h3>
              <p class="detail-item__value">{{ errorDetail.errorMessage }}</p>
            </div>
            <div class="detail-item">
              <h3 class="detail-item__label">错误堆栈</h3>
              <pre class="detail-code">{{ errorDetail.errorStack || '无' }}</pre>
            </div>
            <div class="detail-item">
              <h3 class="detail-item__label">错误 URL</h3>
              <p class="detail-item__value detail-item__value--break">{{ errorDetail.errorUrl }}</p>
            </div>
            <div class="detail-grid">
              <div class="detail-item">
                <h3 class="detail-item__label">用户 IP</h3>
                <p class="detail-item__value">{{ errorDetail.userIp || '未知' }}</p>
              </div>
              <div class="detail-item">
                <h3 class="detail-item__label">访客 ID</h3>
                <p class="detail-item__value">{{ errorDetail.visitorId || '未知' }}</p>
              </div>
            </div>
            <div class="detail-item">
              <h3 class="detail-item__label">用户代理</h3>
              <p class="detail-item__value detail-item__value--break">{{ errorDetail.userAgent || '未知' }}</p>
            </div>
            <div v-if="errorDetail.metadata" class="detail-item">
              <h3 class="detail-item__label">额外信息</h3>
              <pre class="detail-code">{{ errorDetail.metadata }}</pre>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useNotification } from '~/composables/useToast'
import { useErrorHandler } from '~/composables/useErrorHandler'
import { useTheme } from '~/composables/useTheme'
import PageHeader from '~/components/admin/patterns/PageHeader.vue'

definePageMeta({
  layout: 'admin',
  middleware: 'admin-auth'
})

type ErrorLogItem = {
  id: number
  status: number
  errorType: string
  errorMessage: string
  errorUrl: string
  userIp?: string
  createdAt: string
}

type ErrorLogDetail = ErrorLogItem & {
  errorStack?: string
  visitorId?: string
  userAgent?: string
  metadata?: string
}

const api = useApi()
const { success } = useNotification()
const { handleError } = useErrorHandler()
const { currentTheme } = useTheme()

const errorLogs = ref<ErrorLogItem[]>([])
const loading = ref(true)
const stats = ref<Record<string, any>>({})
const page = ref(1)
const pageSize = ref(20)
const total = ref(0)
const showDetail = ref(false)
const detailLoading = ref(false)
const errorDetail = ref<ErrorLogDetail | null>(null)

const filters = ref({
  errorType: '',
  status: null as number | null
})

const getCssColor = (name: string, fallback: string) => {
  if (!process.client) return fallback
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim() || fallback
}

const chartPalette = computed(() => ({
  text: getCssColor('--color-text-main', currentTheme.value === 'dark' ? '#f8fafc' : '#0f172a'),
  muted: getCssColor('--color-text-muted', currentTheme.value === 'dark' ? '#94a3b8' : '#64748b'),
  border: getCssColor('--color-border', currentTheme.value === 'dark' ? 'rgba(148,163,184,0.18)' : 'rgba(148,163,184,0.28)'),
  error: getCssColor('--color-error', '#ef4444')
}))

const typeChartSeries = computed(() => {
  const items = stats.value.ByType || []
  const colors = [
    'rgba(239, 68, 68, 0.82)',
    'rgba(59, 130, 246, 0.82)',
    'rgba(16, 185, 129, 0.82)',
    'rgba(245, 158, 11, 0.82)',
    'rgba(139, 92, 246, 0.82)',
    'rgba(236, 72, 153, 0.82)'
  ]

  return items.map((item: any, index: number) => ({
    name: item.Type || item.type,
    value: item.Count || item.count || 0,
    itemStyle: {
      color: colors[index % colors.length]
    }
  }))
})

const trendChartData = computed(() => {
  const items = stats.value.RecentErrors || []
  return {
    labels: items.map((item: any) => {
      const date = new Date(item.Date || item.date)
      return date.toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' })
    }),
    values: items.map((item: any) => item.Count || item.count || 0)
  }
})

const typeEChartOption = computed(() => ({
  tooltip: { trigger: 'item' },
  legend: {
    bottom: 0,
    textStyle: {
      color: chartPalette.value.text
    }
  },
  series: [
    {
      type: 'pie',
      radius: ['44%', '72%'],
      center: ['50%', '42%'],
      itemStyle: {
        borderColor: currentTheme.value === 'dark' ? '#0f172a' : '#ffffff',
        borderWidth: 2
      },
      data: typeChartSeries.value
    }
  ]
}))

const trendEChartOption = computed(() => ({
  tooltip: { trigger: 'axis' },
  grid: { left: 12, right: 12, top: 20, bottom: 16, containLabel: true },
  xAxis: {
    type: 'category',
    boundaryGap: false,
    data: trendChartData.value.labels,
    axisLabel: { color: chartPalette.value.muted },
    splitLine: { show: false },
    axisLine: { show: false },
    axisTick: { show: false }
  },
  yAxis: {
    type: 'value',
    min: 0,
    minInterval: 1,
    axisLabel: { color: chartPalette.value.muted },
    splitLine: { lineStyle: { color: chartPalette.value.border } }
  },
  series: [
    {
      name: '错误数量',
      type: 'line',
      smooth: true,
      symbol: 'none',
      lineStyle: { color: chartPalette.value.error, width: 3 },
      areaStyle: { color: 'rgba(239, 68, 68, 0.1)' },
      data: trendChartData.value.values
    }
  ]
}))

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleString('zh-CN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

const statusLabel = (status: number) => {
  if (status === 1) return '已处理'
  if (status === 2) return '已忽略'
  return '未处理'
}

const fetchErrorLogs = async () => {
  loading.value = true
  try {
    const params: Record<string, any> = { page: page.value, pageSize: pageSize.value }
    if (filters.value.errorType) params.errorType = filters.value.errorType
    if (filters.value.status !== null) params.status = filters.value.status

    const res = await api.get<any>('/ErrorLog', { params })
    if (res) {
      errorLogs.value = res.list || res.List || []
      total.value = res.total || res.Total || 0
    }
  } catch (e: unknown) {
    handleError(e, '获取错误日志失败')
  } finally {
    loading.value = false
  }
}

const fetchStats = async () => {
  try {
    const res = await api.get<any>('/ErrorLog/stats')
    if (res) {
      stats.value = res
    }
  } catch (e: unknown) {
    handleError(e, '获取统计失败')
  }
}

const viewErrorLog = async (id: number) => {
  detailLoading.value = true
  showDetail.value = true
  try {
    const res = await api.get<any>(`/ErrorLog/${id}`)
    errorDetail.value = res
  } catch (e: unknown) {
    handleError(e, '获取错误详情失败')
    showDetail.value = false
  } finally {
    detailLoading.value = false
  }
}

const updateStatus = async (id: number, status: number) => {
  try {
    await api.put(`/ErrorLog/${id}/status`, { status })
    success('状态已更新')
    await fetchErrorLogs()
    await fetchStats()
  } catch (e: unknown) {
    handleError(e, '更新状态失败')
  }
}

onMounted(() => {
  fetchErrorLogs()
  fetchStats()
})
</script>

<style scoped>
.error-logs-page {
  width: 100%;
}

.refresh-button {
  padding: 0.65rem 1rem;
  border: 1px solid var(--color-primary);
  border-radius: var(--radius-md);
  background: var(--color-primary);
  color: #fff;
  font-weight: 600;
  transition: background 0.2s ease;
}

.refresh-button:hover {
  background: var(--color-primary-hover);
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 1rem;
  margin-bottom: 1.5rem;
}

.stat-card,
.panel-card {
  background: var(--admin-surface-1, var(--color-bg-card));
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-sm);
}

.stat-card {
  padding: 1.2rem;
}

.stat-card__label {
  display: block;
  margin-bottom: 0.55rem;
  color: var(--color-text-muted);
  font-size: 0.85rem;
}

.stat-card__value {
  color: var(--color-text-main);
  font-size: 2rem;
  font-weight: 700;
}

.stat-card__value--error {
  color: var(--color-error);
}

.stat-card__value--success {
  color: var(--color-success);
}

.stat-card__value--muted {
  color: var(--color-text-muted);
}

.charts-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 1.5rem;
  margin-bottom: 1.5rem;
}

.panel-card {
  padding: 1.5rem;
}

.panel-card__title {
  margin-bottom: 1rem;
  color: var(--color-text-main);
  font-size: 1.2rem;
  font-weight: 700;
}

.chart-shell {
  height: 18rem;
}

.filters-card,
.logs-card {
  margin-bottom: 1.5rem;
}

.filters-row {
  display: flex;
  gap: 1rem;
  flex-wrap: wrap;
}

.filter-select {
  min-width: 150px;
  padding: 0.7rem 0.9rem;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  background: var(--admin-surface-2, var(--color-bg-elevated));
  color: var(--color-text-main);
}

.loading-state,
.empty-state {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 10rem;
  color: var(--color-text-muted);
}

.loading-spinner {
  width: 2rem;
  height: 2rem;
  border-radius: 999px;
  border: 2px solid color-mix(in srgb, var(--color-primary) 20%, transparent);
  border-top-color: var(--color-primary);
  animation: spin 0.8s linear infinite;
}

.logs-list {
  display: flex;
  flex-direction: column;
}

.log-item + .log-item {
  border-top: 1px solid var(--color-border);
}

.log-item {
  display: flex;
  justify-content: space-between;
  gap: 1rem;
  padding: 1.5rem;
}

.log-item__badges {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
  margin-bottom: 0.8rem;
}

.status-badge,
.type-badge {
  display: inline-flex;
  align-items: center;
  padding: 0.28rem 0.55rem;
  border-radius: 999px;
  font-size: 0.75rem;
  font-weight: 600;
}

.status-badge--error {
  background: color-mix(in srgb, var(--color-error) 14%, transparent);
  color: var(--color-error);
}

.status-badge--success {
  background: color-mix(in srgb, var(--color-success) 14%, transparent);
  color: var(--color-success);
}

.status-badge--muted {
  background: color-mix(in srgb, var(--color-border) 65%, transparent);
  color: var(--color-text-muted);
}

.type-badge {
  background: color-mix(in srgb, var(--color-primary) 12%, transparent);
  color: var(--color-primary-hover);
}

.log-item__title {
  color: var(--color-text-main);
  font-size: 1.2rem;
  font-weight: 700;
}

.log-item__url {
  margin-top: 0.35rem;
  color: var(--color-text-muted);
  word-break: break-all;
}

.log-item__meta {
  margin-top: 0.55rem;
  color: var(--color-text-muted);
  font-size: 0.82rem;
}

.log-item__actions {
  display: flex;
  gap: 0.7rem;
  align-items: flex-start;
  flex-wrap: wrap;
}

.action-button,
.pagination-button {
  padding: 0.6rem 0.9rem;
  border-radius: var(--radius-md);
  border: 1px solid transparent;
  font-weight: 600;
  transition: all 0.2s ease;
}

.action-button--primary {
  background: var(--color-primary);
  color: #fff;
}

.action-button--success {
  background: color-mix(in srgb, var(--color-success) 18%, transparent);
  border-color: color-mix(in srgb, var(--color-success) 42%, transparent);
  color: var(--color-success);
}

.action-button--secondary,
.pagination-button {
  background: var(--admin-surface-2, var(--color-bg-elevated));
  border-color: var(--color-border);
  color: var(--color-text-main);
}

.pagination {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 0.75rem;
  flex-wrap: wrap;
}

.pagination-text {
  color: var(--color-text-muted);
}

.pagination-button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.modal-overlay {
  position: fixed;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1rem;
  background: rgba(0, 0, 0, 0.55);
  z-index: 1000;
}

.modal-content {
  width: min(960px, 100%);
  max-height: 90vh;
  overflow: hidden;
  background: var(--admin-surface-1, var(--color-bg-card));
  border: 1px solid var(--color-border);
  border-radius: var(--radius-xl);
  box-shadow: var(--shadow-xl);
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.25rem 1.5rem;
  border-bottom: 1px solid var(--color-border);
}

.modal-header h2 {
  color: var(--color-text-main);
  font-size: 1.2rem;
  font-weight: 700;
}

.modal-close {
  width: 2.25rem;
  height: 2.25rem;
  border-radius: 999px;
  border: 1px solid var(--color-border);
  background: var(--admin-surface-2, var(--color-bg-elevated));
  color: var(--color-text-main);
}

.modal-body {
  max-height: calc(90vh - 72px);
  overflow: auto;
  padding: 1.5rem;
}

.detail-stack {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.detail-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 1rem;
}

.detail-item__label {
  margin-bottom: 0.4rem;
  color: var(--color-text-muted);
  font-size: 0.85rem;
}

.detail-item__value {
  color: var(--color-text-main);
  line-height: 1.7;
}

.detail-item__value--break {
  word-break: break-all;
}

.detail-code {
  padding: 1rem;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  background: var(--admin-surface-2, var(--color-bg-elevated));
  color: var(--color-text-main);
  white-space: pre-wrap;
  word-break: break-word;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

@media (max-width: 1024px) {
  .stats-grid,
  .charts-grid,
  .detail-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 768px) {
  .log-item {
    flex-direction: column;
  }

  .log-item__actions,
  .filters-row {
    width: 100%;
  }
}
</style>
