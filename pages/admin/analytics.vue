<template>
  <div class="admin-analytics-page" :data-module-theme="moduleTheme || undefined">
    <PageHeader
      title="访客分析"
      description="查看网站访问统计、访客结构和近期访问行为。"
      class="admin-analytics-header"
    >
      <template #actions>
        <n-space align="center" :size="12" wrap>
          <n-select
            v-model:value="selectedRange"
            class="analytics-range-select"
            :options="rangeOptions"
            size="medium"
          />
          <n-button type="primary" @click="refreshStats">
            刷新数据
          </n-button>
        </n-space>
      </template>
    </PageHeader>

    <n-card v-if="!initialLoadComplete" :bordered="false" class="analytics-loading-card">
      <div class="analytics-loading-state">
        <n-spin size="large" />
        <p>正在加载访客分析数据...</p>
      </div>
    </n-card>

    <template v-else>
      <n-alert
        v-if="showNoDataAlert"
        type="warning"
        class="analytics-empty-alert"
        :bordered="false"
      >
        当前还没有可展示的访客统计数据。你可以先访问前台页面，再回来刷新查看。
      </n-alert>

      <n-grid class="analytics-kpi-grid" cols="1 s:2 m:4" responsive="screen" :x-gap="16" :y-gap="16">
        <n-gi v-for="card in summaryCards" :key="card.label">
          <n-card :bordered="false" class="analytics-kpi-card" hoverable>
            <div class="analytics-kpi-head">
              <span class="analytics-kpi-label">{{ card.label }}</span>
              <span class="analytics-kpi-trend">{{ card.meta }}</span>
            </div>
            <div class="analytics-kpi-value" :class="card.tone">{{ card.value }}</div>
            <div class="analytics-kpi-footer">{{ card.caption }}</div>
          </n-card>
        </n-gi>
      </n-grid>

      <section class="analytics-main-grid">
        <n-card :bordered="false" class="analytics-panel analytics-panel--trend">
          <template #header>
            <div class="panel-heading">
              <div>
                <p class="panel-kicker">核心趋势</p>
                <h2>浏览量 / 访客数趋势</h2>
              </div>
              <n-button-group>
                <n-button
                  v-for="option in trendRangeOptions"
                  :key="option.value"
                  :type="trendRange === option.value ? 'primary' : 'default'"
                  secondary
                  @click="trendRange = option.value; selectedRange = option.value"
                >
                  {{ option.label }}
                </n-button>
              </n-button-group>
            </div>
          </template>

          <div v-if="trendLoading" class="analytics-chart-loading">
            <n-spin size="large" />
          </div>
          <div v-else-if="hasTrendData && trendChartData.labels.length > 0" class="analytics-line-chart">
            <ChartsAppEChart :option="trendEChartOption" loading-text="图表加载中..." />
          </div>
          <n-empty v-else class="analytics-empty-block" description="暂无趋势数据" />
        </n-card>

        <div class="analytics-side-stack">
          <n-card :bordered="false" class="analytics-panel analytics-panel--highlight">
            <template #header>
              <div class="panel-heading">
                <div>
                  <p class="panel-kicker">快速洞察</p>
                  <h2>热门页面</h2>
                </div>
                <n-tag size="small" type="info" round>{{ selectedRangeLabel }}</n-tag>
              </div>
            </template>

            <n-spin :show="topPagesLoading">
              <div v-if="topPages.length" class="analytics-ranked-list">
                <div v-for="(page, index) in topPages.slice(0, 6)" :key="`${page.url}-${index}`" class="ranked-item">
                  <div class="ranked-index">{{ index + 1 }}</div>
                  <div class="ranked-content">
                    <div class="ranked-title">{{ formatPageUrl(page.url) }}</div>
                    <div class="ranked-meta"><span>PV {{ page.pv }}</span><span>UV {{ page.uv }}</span></div>
                  </div>
                </div>
              </div>
              <n-empty v-else class="analytics-empty-block" description="暂无热门页面数据" />
            </n-spin>
          </n-card>

          <n-card :bordered="false" class="analytics-panel">
            <template #header>
              <div class="panel-heading">
                <div>
                  <p class="panel-kicker">来源洞察</p>
                  <h2>来源 / 搜索关键词</h2>
                </div>
              </div>
            </template>

            <n-tabs type="line" animated class="analytics-tabs">
              <n-tab-pane name="sources" tab="访问来源">
                <n-spin :show="sourcesLoading">
                  <div v-if="sources.items?.length" class="analytics-simple-list">
                    <div v-for="item in sources.items.slice(0, 6)" :key="item.name" class="simple-list-item">
                      <span>{{ item.name }}</span>
                      <strong>{{ item.count }}</strong>
                    </div>
                  </div>
                  <n-empty v-else class="analytics-empty-block" description="暂无来源数据" />
                </n-spin>
              </n-tab-pane>
              <n-tab-pane name="keywords" tab="搜索词">
                <n-spin :show="searchKeywordsLoading">
                  <div v-if="searchKeywords.length" class="analytics-simple-list">
                    <div v-for="item in searchKeywords.slice(0, 6)" :key="item.keyword" class="simple-list-item">
                      <span>{{ item.keyword || '未识别关键词' }}</span>
                      <strong>{{ item.count || 0 }}</strong>
                    </div>
                  </div>
                  <n-empty v-else class="analytics-empty-block" description="暂无搜索词数据" />
                </n-spin>
              </n-tab-pane>
            </n-tabs>
          </n-card>
        </div>
      </section>
      <section class="analytics-audience-grid">
        <n-card v-for="panel in audiencePanels" :key="panel.key" :bordered="false" class="analytics-panel analytics-panel--audience">
          <template #header>
            <div class="panel-heading panel-heading--compact">
              <div>
                <p class="panel-kicker">{{ panel.kicker }}</p>
                <h2>{{ panel.title }}</h2>
              </div>
            </div>
          </template>

          <div v-if="panel.loading" class="analytics-chart-loading"><n-spin size="small" /></div>
          <div v-else-if="panel.hasData" class="analytics-pie-chart">
            <ChartsAppEChart :option="panel.option" loading-text="图表加载中..." />
          </div>
          <n-empty v-else class="analytics-empty-block" :description="`暂无${panel.title}`" />
        </n-card>
      </section>

      <section class="analytics-detail-grid">
        <n-card :bordered="false" class="analytics-panel">
          <template #header>
            <div class="panel-heading">
              <div>
                <p class="panel-kicker">地域与路径</p>
                <h2>访问区域分布</h2>
              </div>
            </div>
          </template>

          <n-spin :show="regionsLoading">
            <div v-if="regions.items?.length" class="analytics-ranked-list analytics-ranked-list--compact">
              <div v-for="(region, index) in regions.items.slice(0, 8)" :key="`${region.country}-${region.province}-${index}`" class="ranked-item">
                <div class="ranked-index">{{ index + 1 }}</div>
                <div class="ranked-content">
                  <div class="ranked-title">{{ region.country || '未知地区' }}<span v-if="region.province"> / {{ region.province }}</span></div>
                  <div class="ranked-meta">
                    <span>{{ region.count || 0 }} 次访问</span>
                    <span>{{ totalRegionCount > 0 ? ((region.count / totalRegionCount) * 100).toFixed(1) : '0.0' }}%</span>
                  </div>
                </div>
              </div>
            </div>
            <n-empty v-else class="analytics-empty-block" description="暂无区域数据" />
          </n-spin>
        </n-card>

        <n-card :bordered="false" class="analytics-panel">
          <template #header>
            <div class="panel-heading">
              <div>
                <p class="panel-kicker">行为路径</p>
                <h2>访问流转</h2>
              </div>
            </div>
          </template>

          <n-spin :show="pageFlowLoading">
            <div v-if="pageFlow.edges?.length" class="analytics-simple-list">
              <div v-for="(edge, index) in pageFlow.edges.slice(0, 8)" :key="`${edge.from}-${edge.to}-${index}`" class="simple-list-item simple-list-item--flow">
                <div class="flow-path">
                  <span>{{ formatPathName(edge.from) }}</span>
                  <span class="flow-arrow">→</span>
                  <span>{{ formatPathName(edge.to) }}</span>
                </div>
                <strong>{{ edge.count }}</strong>
              </div>
            </div>
            <n-empty v-else class="analytics-empty-block" description="暂无访问流转数据" />
          </n-spin>
        </n-card>
      </section>

      <n-card :bordered="false" class="analytics-panel analytics-panel--visitors">
        <template #header>
          <div class="panel-heading">
            <div>
              <p class="panel-kicker">访客明细</p>
              <h2>最近访客记录</h2>
            </div>
            <n-space align="center" :size="12">
              <span class="visitors-switch-label">仅看在线</span>
              <n-switch v-model:value="onlineOnly" />
            </n-space>
          </div>
        </template>

        <n-data-table
          remote
          :columns="visitorColumns"
          :data="visitors"
          :loading="visitorsLoading"
          :pagination="visitorsPagination"
          :row-key="visitorRowKey"
          @update:page="changePage"
          @update:page-size="handlePageSizeChange"
        >
          <template #empty><n-empty description="暂无访客记录" /></template>
        </n-data-table>
      </n-card>
    </template>
  </div>
</template>

<script setup lang="ts">
import { computed, h, onMounted, onUnmounted, ref, watch } from 'vue'
import type { DataTableColumns } from 'naive-ui'
import { NAlert, NButton, NButtonGroup, NCard, NDataTable, NEmpty, NGi, NGrid, NSelect, NSpace, NSpin, NSwitch, NTabPane, NTabs, NTag } from 'naive-ui'
import PageHeader from '~/components/admin/patterns/PageHeader.vue'

definePageMeta({
  layout: 'admin',
  middleware: 'admin-auth'
})

const { moduleTheme } = useModuleTheme('analytics_dashboard')
const api = useApi()

const initialLoadComplete = ref(false)
const selectedRange = ref<'today' | '7d' | '30d' | '90d'>('7d')
const trendRange = ref<'7d' | '30d' | '90d'>('7d')
const onlineOnly = ref(false)
const visitorsPage = ref(1)
const pageSize = ref(20)
const visitorsTotal = ref(0)

const overview = ref({ todayPv: 0, todayUv: 0, yesterdayPv: 0, yesterdayUv: 0, totalPv: 0, totalUv: 0, onlineUsers: 0, hotArticleCount: 0 })
const trendData = ref<any>({ points: [] })
const trendLoading = ref(false)
const topPages = ref<any[]>([])
const topPagesLoading = ref(false)
const sources = ref<any>({ total: 0, items: [], topReferrers: [] })
const sourcesLoading = ref(false)
const searchKeywords = ref<any[]>([])
const searchKeywordsLoading = ref(false)
const regions = ref<any>({ items: [] })
const regionsLoading = ref(false)
const clientDistribution = ref<any>({ devices: [], browsers: [], os: [] })
const clientDistributionLoading = ref(false)
const pageFlow = ref<any>({ nodes: [], edges: [] })
const pageFlowLoading = ref(false)
const visitors = ref<any[]>([])
const visitorsLoading = ref(false)

const rangeOptions = [
  { label: '今天', value: 'today' },
  { label: '近 7 天', value: '7d' },
  { label: '近 30 天', value: '30d' },
  { label: '近 90 天', value: '90d' }
]

const trendRangeOptions = [
  { label: '7天', value: '7d' },
  { label: '30天', value: '30d' },
  { label: '90天', value: '90d' }
]

const selectedRangeLabel = computed(() => rangeOptions.find((option) => option.value === selectedRange.value)?.label || '近 7 天')

const summaryCards = computed(() => [
  { label: '今日浏览量', value: overview.value.todayPv || 0, meta: `昨日 ${overview.value.yesterdayPv || 0}`, caption: `累计 ${overview.value.totalPv || 0}`, tone: 'tone-primary' },
  { label: '今日访客数', value: overview.value.todayUv || 0, meta: `昨日 ${overview.value.yesterdayUv || 0}`, caption: `累计 ${overview.value.totalUv || 0}`, tone: 'tone-success' },
  { label: '在线人数', value: overview.value.onlineUsers || 0, meta: '实时状态', caption: '最近 5 分钟活跃', tone: 'tone-warning' },
  { label: '热门文章数', value: overview.value.hotArticleCount || 0, meta: '内容热度', caption: '访问次数 > 1', tone: 'tone-accent' }
])
const getThemeColor = (cssVar: string, fallback = '#3b82f6') => {
  if (!process.client) return fallback
  return getComputedStyle(document.documentElement).getPropertyValue(cssVar).trim() || fallback
}

const standardColors = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4']
const generateColors = (count: number) => Array.from({ length: count }, (_, index) => standardColors[index % standardColors.length])

const chartOptions = computed(() => ({
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: { position: 'bottom' as const, labels: { padding: 14, usePointStyle: true, color: getThemeColor('--color-text-muted', '#94a3b8'), font: { size: 12 } } },
    tooltip: { backgroundColor: getThemeColor('--color-bg-card', '#0f172a'), borderColor: getThemeColor('--color-border-subtle', '#334155'), borderWidth: 1, titleColor: getThemeColor('--color-text-main', '#f8fafc'), bodyColor: getThemeColor('--color-text-main', '#f8fafc'), padding: 12 }
  }
}))

const trendChartOptions = computed(() => ({
  responsive: true,
  maintainAspectRatio: false,
  interaction: { mode: 'index' as const, intersect: false },
  plugins: {
    legend: { position: 'top' as const, labels: { padding: 14, usePointStyle: true, color: getThemeColor('--color-text-muted', '#94a3b8'), font: { size: 12 } } },
    tooltip: { backgroundColor: getThemeColor('--color-bg-card', '#0f172a'), borderColor: getThemeColor('--color-border-subtle', '#334155'), borderWidth: 1, titleColor: getThemeColor('--color-text-main', '#f8fafc'), bodyColor: getThemeColor('--color-text-main', '#f8fafc'), padding: 12 }
  },
  scales: {
    x: { grid: { display: false }, ticks: { color: getThemeColor('--color-text-muted', '#94a3b8'), maxRotation: 0, font: { size: 11 } }, border: { display: false } },
    y: { beginAtZero: true, grid: { color: 'rgba(148, 163, 184, 0.18)', drawBorder: false }, ticks: { color: getThemeColor('--color-text-muted', '#94a3b8'), font: { size: 11 } }, border: { display: false } }
  }
}))

const buildPieData = (items: any[], labelKey = 'name') => {
  if (!items?.length) return { labels: [], datasets: [] }
  return {
    labels: items.map((item) => item[labelKey] || '未知'),
    datasets: [{ data: items.map((item) => item.count || 0), backgroundColor: generateColors(items.length), borderColor: getThemeColor('--color-bg-card', '#0f172a'), borderWidth: 2 }]
  }
}

const regionChartData = computed(() => {
  const items = regions.value.items || []
  if (!items.length) return { labels: [], datasets: [] }
  return {
    labels: items.map((item: any) => item.province ? `${item.country || '未知'} / ${item.province}` : (item.country || '未知')),
    datasets: [{ data: items.map((item: any) => item.count || 0), backgroundColor: generateColors(items.length), borderColor: getThemeColor('--color-bg-card', '#0f172a'), borderWidth: 2 }]
  }
})

const deviceChartData = computed(() => buildPieData(clientDistribution.value.devices || []))
const browserChartData = computed(() => buildPieData(clientDistribution.value.browsers || []))
const osChartData = computed(() => buildPieData(clientDistribution.value.os || []))

const trendChartData = computed(() => {
  const points = trendData.value?.points || trendData.value?.Points || []
  if (!points.length) return { labels: [], datasets: [] }
  const pvColor = getThemeColor('--color-primary', '#2997ff')
  const uvColor = '#22c55e'
  const labels = points.map((point: any, index: number) => {
    const raw = point.date || point.Date
    if (!raw) return `第${index + 1}个点`
    if (typeof raw === 'string' && raw.includes(' ')) {
      const [, time] = raw.split(' ')
      return time?.slice(0, 5) || raw
    }
    const date = new Date(raw)
    return !Number.isNaN(date.getTime()) ? `${date.getMonth() + 1}/${date.getDate()}` : raw
  })
  return {
    labels,
    datasets: [
      { label: '浏览量', data: points.map((point: any) => point.pv || point.Pv || 0), borderColor: pvColor, backgroundColor: `${pvColor}22`, borderWidth: 3, fill: true, tension: 0.36, pointRadius: 3, pointHoverRadius: 5 },
      { label: '访客数', data: points.map((point: any) => point.uv || point.Uv || 0), borderColor: uvColor, backgroundColor: `${uvColor}18`, borderWidth: 3, fill: true, tension: 0.36, pointRadius: 3, pointHoverRadius: 5 }
    ]
  }
})

const trendEChartOption = computed(() => ({
  tooltip: { trigger: 'axis' },
  legend: {
    top: 0,
    textStyle: {
      color: getThemeColor('--color-text-muted', '#94a3b8')
    }
  },
  grid: { left: 12, right: 12, top: 44, bottom: 16, containLabel: true },
  xAxis: {
    type: 'category',
    boundaryGap: false,
    data: trendChartData.value.labels,
    axisLine: { show: false },
    axisTick: { show: false },
    splitLine: { show: false },
    axisLabel: { color: getThemeColor('--color-text-muted', '#94a3b8') }
  },
  yAxis: {
    type: 'value',
    min: 0,
    splitLine: { lineStyle: { color: 'rgba(148, 163, 184, 0.18)' } },
    axisLabel: { color: getThemeColor('--color-text-muted', '#94a3b8') }
  },
  series: trendChartData.value.datasets.map((dataset: any) => ({
    name: dataset.label,
    type: 'line',
    smooth: true,
    symbol: 'circle',
    symbolSize: 6,
    lineStyle: { color: dataset.borderColor, width: dataset.borderWidth || 3 },
    areaStyle: { color: dataset.backgroundColor },
    data: dataset.data || []
  }))
}))

const buildPieOption = (chartData: { labels: string[]; datasets: Array<{ data: number[]; backgroundColor?: string[] }> }) => ({
  tooltip: { trigger: 'item' },
  legend: {
    bottom: 0,
    textStyle: {
      color: getThemeColor('--color-text-muted', '#94a3b8')
    }
  },
  series: [
    {
      type: 'pie',
      radius: ['42%', '72%'],
      center: ['50%', '42%'],
      itemStyle: {
        borderColor: getThemeColor('--color-bg-card', '#0f172a'),
        borderWidth: 2
      },
      data: chartData.labels.map((label, index) => ({
        name: label,
        value: chartData.datasets[0]?.data?.[index] || 0,
        itemStyle: {
          color: chartData.datasets[0]?.backgroundColor?.[index]
        }
      }))
    }
  ]
})

const hasTrendData = computed(() => (trendData.value?.points || trendData.value?.Points || []).length > 0)
const hasRegionData = computed(() => (regions.value.items?.length || 0) > 0)
const hasDeviceData = computed(() => (clientDistribution.value.devices?.length || 0) > 0)
const hasBrowserData = computed(() => (clientDistribution.value.browsers?.length || 0) > 0)
const hasOsData = computed(() => (clientDistribution.value.os?.length || 0) > 0)
const hasClientDistributionData = computed(() => hasDeviceData.value || hasBrowserData.value || hasOsData.value)

const audiencePanels = computed(() => [
  { key: 'region', kicker: '地理分布', title: '访问区域', data: regionChartData.value, option: buildPieOption(regionChartData.value), hasData: hasRegionData.value, loading: regionsLoading.value },
  { key: 'device', kicker: '终端结构', title: '设备类型', data: deviceChartData.value, option: buildPieOption(deviceChartData.value), hasData: hasDeviceData.value, loading: clientDistributionLoading.value },
  { key: 'browser', kicker: '终端结构', title: '浏览器分布', data: browserChartData.value, option: buildPieOption(browserChartData.value), hasData: hasBrowserData.value, loading: clientDistributionLoading.value },
  { key: 'os', kicker: '终端结构', title: '操作系统分布', data: osChartData.value, option: buildPieOption(osChartData.value), hasData: hasOsData.value, loading: clientDistributionLoading.value }
])

const totalRegionCount = computed(() => (regions.value.items || []).reduce((sum: number, item: any) => sum + (item.count || 0), 0) || 1)

const showNoDataAlert = computed(() => {
  if (!initialLoadComplete.value) return false
  if (topPagesLoading.value || trendLoading.value || regionsLoading.value || clientDistributionLoading.value || visitorsLoading.value || pageFlowLoading.value || sourcesLoading.value || searchKeywordsLoading.value) {
    return false
  }
  const hasOverviewData = (overview.value.todayPv ?? 0) > 0 || (overview.value.todayUv ?? 0) > 0 || (overview.value.totalPv ?? 0) > 0 || (overview.value.totalUv ?? 0) > 0
  return !(hasOverviewData || hasTrendData.value || hasRegionData.value || hasClientDistributionData.value || topPages.value.length || (sources.value.items?.length || 0) || searchKeywords.value.length || (pageFlow.value.edges?.length || 0) || visitors.value.length)
})

const formatPathName = (path: string) => {
  if (!path || path === '/') return '首页'
  return path.replace(/^\/+/, '').split('?')[0].split('/').filter(Boolean).slice(0, 3).join(' / ') || '首页'
}

const formatPageUrl = (url: string) => (!url || url === '/') ? '首页' : (url.length > 40 ? `${url.slice(0, 40)}...` : url)

const formatTime = (timeStr: string) => {
  if (!timeStr) return '-'
  const date = new Date(timeStr)
  if (Number.isNaN(date.getTime())) return timeStr
  const diff = Date.now() - date.getTime()
  const minutes = Math.floor(diff / 60000)
  if (minutes < 1) return '刚刚'
  if (minutes < 60) return `${minutes} 分钟前`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours} 小时前`
  const days = Math.floor(hours / 24)
  if (days < 7) return `${days} 天前`
  return date.toLocaleString('zh-CN', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })
}

const visitorRowKey = (row: any) => row.visitorId || row.VisitorId || row.id || row.Id || `${row.path || row.Path}-${row.updatedAt || row.UpdatedAt}`

const visitorColumns = computed<DataTableColumns<any>>(() => [
  { title: '访客路径', key: 'path', minWidth: 260, ellipsis: { tooltip: true }, render: (row: any) => { const path = (row.path || row.Path || '/') as string; return h('div', { class: 'visitor-path-cell' }, [h('div', { class: 'visitor-path-title' }, formatPathName(path)), h('div', { class: 'visitor-path-subtitle' }, path)]) } },
  { title: 'IP', key: 'ip', width: 150, ellipsis: { tooltip: true }, render: (row: any) => row.ip || row.Ip || row.ipAddress || row.IpAddress || '-' },
  { title: '设备 / 浏览器', key: 'client', minWidth: 180, render: (row: any) => { const device = row.deviceType || row.DeviceType || '未知设备'; const browser = row.browser || row.Browser || '未知浏览器'; return h('div', { class: 'visitor-path-cell' }, [h('div', { class: 'visitor-path-title' }, device), h('div', { class: 'visitor-path-subtitle' }, browser)]) } },
  { title: '浏览页数', key: 'pageViews', width: 100, render: (row: any) => row.pageViews || row.PageViews || 1 },
  { title: '最后活跃', key: 'updatedAt', width: 140, render: (row: any) => formatTime(row.updatedAt || row.UpdatedAt) },
  { title: '状态', key: 'status', width: 96, render: (row: any) => h(NTag, { size: 'small', round: true, type: (row.isOnline ?? row.IsOnline) === true ? 'success' : 'default' }, { default: () => ((row.isOnline ?? row.IsOnline) === true ? '在线' : '离线') }) }
])

const visitorsPagination = computed(() => ({ page: visitorsPage.value, pageSize: pageSize.value, itemCount: visitorsTotal.value, showSizePicker: true, pageSizes: [10, 20, 50], prefix: ({ itemCount }: { itemCount: number }) => `共 ${itemCount} 条` }))
const fetchOverview = async () => { try { const res = await api.get<any>('/Analytics/overview'); if (res) overview.value = res } catch {} }

const fetchTrend = async () => {
  try {
    trendLoading.value = true
    const res = await api.get<any>('/Analytics/trend', { params: { range: trendRange.value, granularity: 'day' } })
    trendData.value = res || { points: [] }
  } catch {
    trendData.value = { points: [] }
  } finally {
    trendLoading.value = false
  }
}

const fetchTopPages = async () => {
  try {
    topPagesLoading.value = true
    const res = await api.get<any>(`/Analytics/top-pages?range=${selectedRange.value}`)
    topPages.value = res?.items || []
  } catch {
    topPages.value = []
  } finally {
    topPagesLoading.value = false
  }
}

const fetchSources = async () => {
  try {
    sourcesLoading.value = true
    const res = await api.get<any>(`/Analytics/sources?range=${selectedRange.value}`)
    sources.value = res || { total: 0, items: [], topReferrers: [] }
  } catch {
    sources.value = { total: 0, items: [], topReferrers: [] }
  } finally {
    sourcesLoading.value = false
  }
}

const fetchSearchKeywords = async () => {
  try {
    searchKeywordsLoading.value = true
    const res = await api.get<any>(`/Analytics/search-keywords?range=${selectedRange.value}`)
    searchKeywords.value = res?.items || []
  } catch {
    searchKeywords.value = []
  } finally {
    searchKeywordsLoading.value = false
  }
}

const fetchRegions = async () => {
  try {
    regionsLoading.value = true
    const res = await api.get<any>(`/Analytics/regions?range=${selectedRange.value}`)
    regions.value = { items: res?.items || [] }
  } catch {
    regions.value = { items: [] }
  } finally {
    regionsLoading.value = false
  }
}

const fetchClientDistribution = async () => {
  try {
    clientDistributionLoading.value = true
    const res = await api.get<any>(`/Analytics/client-distribution?range=${selectedRange.value}`)
    clientDistribution.value = { devices: res?.devices || [], browsers: res?.browsers || [], os: res?.os || [] }
  } catch {
    clientDistribution.value = { devices: [], browsers: [], os: [] }
  } finally {
    clientDistributionLoading.value = false
  }
}

const fetchPageFlow = async () => {
  try {
    pageFlowLoading.value = true
    const res = await api.get<any>(`/Analytics/page-flow?range=${selectedRange.value}`)
    pageFlow.value = res || { nodes: [], edges: [] }
  } catch {
    pageFlow.value = { nodes: [], edges: [] }
  } finally {
    pageFlowLoading.value = false
  }
}

const fetchVisitors = async () => {
  try {
    visitorsLoading.value = true
    const res = await api.get<any>('/Analytics/visitors', { params: { page: visitorsPage.value, pageSize: pageSize.value, onlineOnly: onlineOnly.value } })
    const list = res?.visitors || res?.Visitors || (Array.isArray(res) ? res : [])
    visitors.value = Array.isArray(list) ? list : []
    visitorsTotal.value = res?.total ?? res?.Total ?? visitors.value.length
  } catch {
    visitors.value = []
    visitorsTotal.value = 0
  } finally {
    visitorsLoading.value = false
  }
}

const loadPrimaryData = async () => {
  await Promise.all([fetchOverview(), fetchTrend(), fetchTopPages(), fetchRegions(), fetchClientDistribution()])
}

const loadSecondaryData = async () => {
  await Promise.allSettled([fetchSources(), fetchSearchKeywords(), fetchPageFlow(), fetchVisitors()])
}

const refreshAll = async () => {
  // 立即标记为加载完成，让页面先显示出来
  initialLoadComplete.value = true
  // 并行加载所有数据
  await Promise.allSettled([loadPrimaryData(), loadSecondaryData()])
}

const refreshStats = () => {
  visitorsPage.value = 1
  refreshAll()
}

const changePage = (page: number) => {
  visitorsPage.value = page
  fetchVisitors()
}

const handlePageSizeChange = (size: number) => {
  pageSize.value = size
  visitorsPage.value = 1
  fetchVisitors()
}

watch(selectedRange, (newRange) => {
  trendRange.value = newRange === 'today' ? '7d' : (newRange as '7d' | '30d' | '90d')
  void loadPrimaryData()
  void Promise.allSettled([fetchSources(), fetchSearchKeywords(), fetchPageFlow()])
})

watch(onlineOnly, () => {
  visitorsPage.value = 1
  fetchVisitors()
})

const autoRefreshInterval = ref<NodeJS.Timeout | null>(null)
let visibilityHandler: (() => void) | null = null

const startAutoRefresh = () => {
  if (!process.client || autoRefreshInterval.value) return

  autoRefreshInterval.value = setInterval(() => {
    if (document.hidden) return
    fetchOverview()
    fetchVisitors()
  }, 60000)
}

const stopAutoRefresh = () => {
  if (autoRefreshInterval.value) {
    clearInterval(autoRefreshInterval.value)
    autoRefreshInterval.value = null
  }
}

onMounted(() => {
  refreshAll()
  if (process.client) {
    visibilityHandler = () => {
      if (document.hidden) {
        stopAutoRefresh()
        return
      }

      fetchOverview()
      fetchVisitors()
      startAutoRefresh()
    }

    document.addEventListener('visibilitychange', visibilityHandler)
    startAutoRefresh()
  }
})

onUnmounted(() => {
  stopAutoRefresh()
  if (visibilityHandler && process.client) {
    document.removeEventListener('visibilitychange', visibilityHandler)
  }
})
</script>

<style scoped>
.admin-analytics-page { display: flex; flex-direction: column; gap: var(--spacing-lg); padding-bottom: var(--spacing-2xl); }
.admin-analytics-header { padding-bottom: 0; }
.analytics-range-select { width: 132px; }
.analytics-loading-card,
.analytics-panel,
.analytics-kpi-card { overflow: hidden; border: 1px solid var(--color-border-subtle); background: linear-gradient(180deg, var(--color-bg-card), var(--color-bg-elevated)); }
.analytics-loading-card { min-height: 360px; }
.analytics-loading-state,
.analytics-chart-loading { display: flex; min-height: 220px; align-items: center; justify-content: center; flex-direction: column; gap: var(--spacing-md); color: var(--color-text-muted); }
.analytics-empty-alert { border-radius: var(--radius-xl); }
.analytics-kpi-grid { margin-top: 4px; }
.analytics-kpi-card { min-height: 156px; }
.analytics-kpi-head { display: flex; align-items: center; justify-content: space-between; gap: var(--spacing-md); margin-bottom: var(--spacing-lg); }
.analytics-kpi-label,
.analytics-kpi-trend,
.panel-kicker,
.visitors-switch-label { color: var(--color-text-muted); font-size: var(--font-size-xs); letter-spacing: 0.08em; text-transform: uppercase; }
.analytics-kpi-value { margin-bottom: var(--spacing-sm); font-size: clamp(2rem, 3vw, 2.6rem); line-height: 1; font-weight: 800; color: var(--color-text-main); }
.analytics-kpi-value.tone-primary { color: var(--color-primary); }
.analytics-kpi-value.tone-success { color: var(--color-success, #22c55e); }
.analytics-kpi-value.tone-warning { color: var(--color-warning, #f59e0b); }
.analytics-kpi-value.tone-accent { color: var(--color-chart-quinary, #8b5cf6); }
.analytics-kpi-footer { color: var(--color-text-muted); font-size: var(--font-size-sm); }
.analytics-main-grid { display: grid; grid-template-columns: minmax(0, 1.55fr) minmax(320px, 0.95fr); gap: var(--spacing-lg); }
.analytics-side-stack,
.analytics-detail-grid { display: grid; gap: var(--spacing-lg); }
.analytics-audience-grid { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: var(--spacing-lg); }
.analytics-detail-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
.panel-heading { display: flex; align-items: flex-start; justify-content: space-between; gap: var(--spacing-md); }
.panel-heading--compact { min-height: 42px; }
.panel-heading h2 { margin: 4px 0 0; color: var(--color-text-main); font-size: var(--font-size-h3); line-height: 1.2; }
.analytics-line-chart { height: 360px; }
.analytics-pie-chart { height: 250px; }
.analytics-empty-block { min-height: 180px; }
.analytics-tabs { margin-top: calc(var(--spacing-xs) * -1); }
.analytics-ranked-list,
.analytics-simple-list { display: flex; flex-direction: column; gap: var(--spacing-sm); }
.ranked-item,
.simple-list-item { display: flex; align-items: center; justify-content: space-between; gap: var(--spacing-md); padding: 12px 14px; border: 1px solid var(--color-border-subtle); border-radius: var(--radius-lg); background: var(--color-bg-card); }
.ranked-item { align-items: flex-start; }
.ranked-index { display: inline-flex; align-items: center; justify-content: center; width: 28px; height: 28px; border-radius: 999px; background: var(--color-bg-elevated); color: var(--color-text-main); font-size: var(--font-size-sm); font-weight: 700; flex-shrink: 0; }
.ranked-content { display: flex; flex: 1; min-width: 0; flex-direction: column; gap: 6px; }
.ranked-title,
.flow-path,
.visitor-path-title { color: var(--color-text-main); font-size: var(--font-size-sm); font-weight: 600; }
.ranked-meta,
.visitor-path-subtitle { display: flex; gap: var(--spacing-md); color: var(--color-text-muted); font-size: var(--font-size-xs); flex-wrap: wrap; }
.simple-list-item strong,
.ranked-meta strong { color: var(--color-text-main); }
.simple-list-item--flow { align-items: center; }
.flow-path { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
.flow-arrow { color: var(--color-text-muted); }
.visitor-path-cell { display: flex; flex-direction: column; gap: 4px; min-width: 0; }
.analytics-panel--visitors :deep(.n-data-table) { margin-top: 4px; }
.analytics-panel--visitors :deep(.n-data-table-th) { font-size: var(--font-size-xs); letter-spacing: 0.06em; text-transform: uppercase; }
.analytics-panel--visitors :deep(.n-data-table-td) { vertical-align: top; }
@media (max-width: 1400px) { .analytics-audience-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); } }
@media (max-width: 1200px) { .analytics-main-grid, .analytics-detail-grid { grid-template-columns: 1fr; } }
@media (max-width: 768px) {
  .analytics-audience-grid { grid-template-columns: 1fr; }
  .panel-heading { flex-direction: column; align-items: flex-start; }
  .analytics-range-select { width: 100%; min-width: 0; }
  .analytics-line-chart { height: 300px; }
}
</style>
