<template>
  <div class="analytics-page">
    <n-card class="filter-card mb-4">
      <div class="filter-row">
        <n-select
          v-model:value="filters.timeRange"
          :options="timeRangeOptions"
          placeholder="时间范围"
          style="width: 150px"
          @update:value="handleTimeRangeChange"
        />
        <n-date-picker
          v-if="filters.timeRange === 'custom'"
          v-model:value="customDateRange"
          type="daterange"
          clearable
          placeholder="自定义日期范围"
          style="width: 300px"
          @update:value="handleCustomDateChange"
        />
        <n-select
          v-model:value="filters.projectType"
          :options="projectTypeOptions"
          placeholder="项目类型"
          style="width: 150px"
          clearable
          @update:value="handleFilterChange"
        />
        <n-select
          v-model:value="filters.isPublic"
          :options="isPublicOptions"
          placeholder="是否公开"
          style="width: 120px"
          clearable
          @update:value="handleFilterChange"
        />
        <n-button type="primary" @click="handleRefresh">刷新</n-button>
      </div>
    </n-card>

    <div class="kpi-cards mb-4">
      <n-card v-for="item in kpiItems" :key="item.label" class="kpi-card">
        <div class="kpi-content">
          <div class="kpi-label">{{ item.label }}</div>
          <div :class="['kpi-value', item.tone]">{{ item.value }}</div>
        </div>
      </n-card>
    </div>

    <div v-if="loading" class="loading-container">
      <n-spin size="large" />
    </div>

    <div v-else class="charts-grid">
      <n-card class="chart-card">
        <template #header><h3>项目状态分布</h3></template>
        <div v-if="!summary.statusAgg.length" class="chart-empty">暂无数据</div>
        <div v-else class="chart-container">
          <component :is="chartComponent" v-if="chartsReady && chartComponent" :option="statusChartOption" autoresize />
          <div v-else class="chart-skeleton">图表加载中...</div>
        </div>
      </n-card>

      <n-card class="chart-card">
        <template #header><h3>月度收入趋势</h3></template>
        <div v-if="!summary.monthlyRevenue.length" class="chart-empty">暂无数据</div>
        <div v-else class="chart-container">
          <component :is="chartComponent" v-if="chartsReady && chartComponent" :option="revenueChartOption" autoresize />
          <div v-else class="chart-skeleton">图表加载中...</div>
        </div>
      </n-card>

      <n-card class="chart-card">
        <template #header><h3>交付周期统计</h3></template>
        <div v-if="!summary.deliveryCycle.length" class="chart-empty">暂无数据</div>
        <div v-else class="chart-container">
          <component :is="chartComponent" v-if="chartsReady && chartComponent" :option="deliveryChartOption" autoresize />
          <div v-else class="chart-skeleton">图表加载中...</div>
        </div>
      </n-card>

      <n-card class="chart-card">
        <template #header><h3>客户贡献 Top 10</h3></template>
        <div v-if="!summary.customerTop.length" class="chart-empty">暂无数据</div>
        <div v-else class="chart-container">
          <component :is="chartComponent" v-if="chartsReady && chartComponent" :option="customerChartOption" autoresize />
          <div v-else class="chart-skeleton">图表加载中...</div>
        </div>
      </n-card>
    </div>

    <div class="risk-lists mt-4">
      <n-card class="risk-card mb-4">
        <template #header><h3>即将到期项目（7 天）</h3></template>
        <n-data-table
          :columns="dueSoonColumns"
          :data="summary.riskDueSoon || []"
          :loading="loading"
          :pagination="false"
          @row-click="handleRowClick"
        />
      </n-card>

      <n-card class="risk-card">
        <template #header><h3>逾期项目</h3></template>
        <n-data-table
          :columns="overdueColumns"
          :data="summary.riskOverdue || []"
          :loading="loading"
          :pagination="false"
          @row-click="handleRowClick"
        />
      </n-card>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, shallowRef } from 'vue'
import type { Component } from 'vue'
import { useRouter } from 'vue-router'
import { NButton, NCard, NDataTable, NDatePicker, NSelect, NSpin } from 'naive-ui'
import type { DataTableColumns } from 'naive-ui'
import { useNotification } from '~/composables/useToast'
import { useApi } from '~/composables/useApi'
import { useEChartsTheme } from '~/composables/useEChartsTheme'
import type { ProjectBrief, SideProjectAnalyticsSummary } from '~/types/api'

definePageMeta({
  layout: 'admin',
  middleware: 'admin-auth'
})

type EChartOption = Record<string, any>

const router = useRouter()
const api = useApi()
const notification = useNotification()
const { isDark } = useEChartsTheme()

const chartComponent = shallowRef<Component | null>(null)
const chartsReady = ref(false)
const loading = ref(false)

const summary = ref<SideProjectAnalyticsSummary>({
  kpis: {
    totals: 0,
    inProgressCount: 0,
    overdueCount: 0,
    blockedCount: 0,
    receivedSum: 0,
    receivableSum: 0
  },
  statusAgg: [],
  monthlyRevenue: [],
  deliveryCycle: [],
  customerTop: [],
  riskDueSoon: [],
  riskOverdue: []
})

const filters = ref({
  timeRange: '30d',
  projectType: undefined as string | undefined,
  isPublic: undefined as string | undefined
})

const customDateRange = ref<[number, number] | null>(null)

const timeRangeOptions = [
  { label: '30 天', value: '30d' },
  { label: '90 天', value: '90d' },
  { label: '本年', value: 'year' },
  { label: '自定义', value: 'custom' }
]

const projectTypeOptions = [
  { label: '全部', value: undefined },
  { label: '软件开发', value: 'development' },
  { label: '网站', value: '网站' },
  { label: 'AI', value: 'AI' },
  { label: '脚本', value: '脚本' },
  { label: '投资', value: 'investment' }
]

const isPublicOptions = [
  { label: '全部', value: undefined },
  { label: '公开', value: 'true' },
  { label: '不公开', value: 'false' }
]

const kpiItems = computed(() => [
  { label: '项目总数', value: summary.value.kpis?.totals || 0, tone: '' },
  { label: '进行中项目', value: summary.value.kpis?.inProgressCount || 0, tone: '' },
  { label: '逾期项目', value: summary.value.kpis?.overdueCount || 0, tone: 'error' },
  { label: '卡住项目', value: summary.value.kpis?.blockedCount || 0, tone: 'warning' },
  { label: '本期已收金额', value: `¥${formatAmount(summary.value.kpis?.receivedSum || 0)}`, tone: 'success' },
  { label: '本期待收金额', value: `¥${formatAmount(summary.value.kpis?.receivableSum || 0)}`, tone: '' }
])

const chartTextColor = computed(() => (isDark.value ? 'var(--color-bg-light, white)' : 'var(--color-gray-700)'))

const ensureChartsReady = async () => {
  if (!process.client || chartsReady.value) return

  const [
    echartsCore,
    echartsRenderers,
    echartsCharts,
    echartsComponents,
    vueEchartsModule
  ] = await Promise.all([
    import('echarts/core'),
    import('echarts/renderers'),
    import('echarts/charts'),
    import('echarts/components'),
    import('vue-echarts')
  ])

  echartsCore.use([
    echartsRenderers.CanvasRenderer,
    echartsCharts.BarChart,
    echartsCharts.LineChart,
    echartsCharts.PieChart,
    echartsComponents.TitleComponent,
    echartsComponents.TooltipComponent,
    echartsComponents.LegendComponent,
    echartsComponents.GridComponent
  ])

  chartComponent.value = vueEchartsModule.default
  chartsReady.value = true
}

const getDateRange = () => {
  if (filters.value.timeRange === 'custom' && customDateRange.value) {
    return {
      start: new Date(customDateRange.value[0]),
      end: new Date(customDateRange.value[1])
    }
  }

  const now = new Date()
  let start: Date | null = null

  switch (filters.value.timeRange) {
    case '30d':
      start = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
      break
    case '90d':
      start = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000)
      break
    case 'year':
      start = new Date(now.getFullYear(), 0, 1)
      break
  }

  return { start, end: now }
}

const fetchData = async () => {
  loading.value = true
  try {
    const { start, end } = getDateRange()
    const params: Record<string, any> = {}

    if (start) params.start = start.toISOString().split('T')[0]
    if (end) params.end = end.toISOString().split('T')[0]
    if (filters.value.projectType) params.type = filters.value.projectType
    if (filters.value.isPublic !== undefined) {
      params.isPublic = filters.value.isPublic === 'true'
    }

    summary.value = await api.get<SideProjectAnalyticsSummary>('/side-projects/analytics/summary', { params })
  } catch (error: any) {
    console.error('获取项目分析失败:', error)
    notification.error(`获取项目分析失败: ${error?.message || '未知错误'}`)
  } finally {
    loading.value = false
  }
}

const buildCommonAxis = (): EChartOption => ({
  axisLabel: { color: chartTextColor.value }
})

const statusChartOption = computed<EChartOption>(() => ({
  backgroundColor: 'transparent',
  tooltip: {
    trigger: 'item',
    formatter: '{b}: <br/>{c} ({d}%) <br>金额: ¥{@amountSum}'
  },
  legend: {
    orient: 'vertical',
    left: 'left',
    textStyle: { color: chartTextColor.value }
  },
  series: [
    {
      type: 'pie',
      radius: '60%',
      data: summary.value.statusAgg.map(item => ({
        value: item.count,
        name: item.statusName,
        amountSum: item.amountSum
      }))
    }
  ]
}))

const revenueChartOption = computed<EChartOption>(() => ({
  backgroundColor: 'transparent',
  tooltip: {
    trigger: 'axis',
    formatter: (params: any[]) => {
      const param = params[0]
      return `${param.name}<br/>收入: ¥${formatAmount(param.value)}`
    }
  },
  xAxis: {
    ...buildCommonAxis(),
    type: 'category',
    data: summary.value.monthlyRevenue.map(item => item.month)
  },
  yAxis: {
    ...buildCommonAxis(),
    type: 'value',
    axisLabel: {
      color: chartTextColor.value,
      formatter: (value: number) => `¥${(value / 1000).toFixed(0)}k`
    }
  },
  series: [
    {
      type: 'line',
      smooth: true,
      areaStyle: { opacity: 0.28 },
      data: summary.value.monthlyRevenue.map(item => item.receivedSum)
    }
  ]
}))

const deliveryChartOption = computed<EChartOption>(() => ({
  backgroundColor: 'transparent',
  tooltip: {
    trigger: 'axis',
    formatter: (params: any[]) => {
      const param = params[0]
      return `${param.name}<br/>平均天数: ${param.value.toFixed(1)} 天<br/>项目数: ${param.data.count}`
    }
  },
  xAxis: {
    ...buildCommonAxis(),
    type: 'category',
    data: summary.value.deliveryCycle.map(item => item.groupName),
    axisLabel: {
      color: chartTextColor.value,
      rotate: 45
    }
  },
  yAxis: {
    ...buildCommonAxis(),
    type: 'value',
    name: '天数'
  },
  series: [
    {
      type: 'bar',
      data: summary.value.deliveryCycle.map(item => ({
        value: item.avgDays,
        count: item.count
      }))
    }
  ]
}))

const customerChartOption = computed<EChartOption>(() => ({
  backgroundColor: 'transparent',
  tooltip: {
    trigger: 'axis',
    formatter: (params: any[]) => {
      const param = params[0]
      return `${param.name}<br/>金额: ¥${formatAmount(param.value)}<br/>项目数: ${param.data.count}`
    }
  },
  xAxis: {
    ...buildCommonAxis(),
    type: 'value',
    axisLabel: {
      color: chartTextColor.value,
      formatter: (value: number) => `¥${(value / 1000).toFixed(0)}k`
    }
  },
  yAxis: {
    ...buildCommonAxis(),
    type: 'category',
    data: summary.value.customerTop.map(item => item.customerName)
  },
  series: [
    {
      type: 'bar',
      label: {
        show: true,
        position: 'right',
        formatter: (params: any) => `¥${formatAmount(params.value)}`
      },
      data: summary.value.customerTop.map(item => ({
        value: item.receivedSum,
        count: item.projectCount
      }))
    }
  ]
}))

const dueSoonColumns: DataTableColumns<ProjectBrief> = [
  { title: '项目名称', key: 'title', width: 200 },
  { title: '客户', key: 'clientName', width: 150 },
  {
    title: '截止日期',
    key: 'deadlineAt',
    width: 120,
    render: row => (row.deadlineAt ? new Date(row.deadlineAt).toLocaleDateString('zh-CN') : '-')
  },
  {
    title: '剩余天数',
    key: 'daysRemaining',
    width: 100,
    render: row => (row.daysRemaining !== undefined ? `${row.daysRemaining} 天` : '-')
  },
  { title: '下一步行动', key: 'nextAction', width: 200 },
  {
    title: '金额',
    key: 'totalAmount',
    width: 120,
    render: row => (row.totalAmount ? `¥${formatAmount(row.totalAmount)}` : '-')
  }
]

const overdueColumns: DataTableColumns<ProjectBrief> = [
  { title: '项目名称', key: 'title', width: 200 },
  {
    title: '逾期天数',
    key: 'overdueDays',
    width: 100,
    render: row => (row.overdueDays !== undefined ? `${row.overdueDays} 天` : '-')
  },
  { title: '阻塞原因', key: 'blockReason', width: 300 },
  {
    title: '金额',
    key: 'totalAmount',
    width: 120,
    render: row => (row.totalAmount ? `¥${formatAmount(row.totalAmount)}` : '-')
  }
]

const handleTimeRangeChange = () => {
  if (filters.value.timeRange !== 'custom') {
    customDateRange.value = null
  }
  fetchData()
}

const handleCustomDateChange = () => {
  fetchData()
}

const handleFilterChange = () => {
  fetchData()
}

const handleRefresh = () => {
  fetchData()
}

const handleRowClick = (row: ProjectBrief) => {
  router.push(`/admin/side-projects/projects/${row.id}`)
}

function formatAmount(amount: number) {
  return amount.toFixed(2)
}

onMounted(() => {
  ensureChartsReady()
  fetchData()
})
</script>

<style scoped>
.analytics-page {
  padding: var(--spacing-lg);
}

.filter-card,
.kpi-card,
.chart-card,
.risk-card {
  background: var(--color-bg-card);
  border: 1px solid var(--color-border-subtle);
}

.filter-row {
  display: flex;
  gap: var(--spacing-md);
  align-items: center;
  flex-wrap: wrap;
}

.kpi-cards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: var(--spacing-md);
}

.kpi-content {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-xs);
}

.kpi-label {
  font-size: 14px;
  color: var(--color-text-muted);
}

.kpi-value {
  font-size: 24px;
  font-weight: 600;
  color: var(--color-text-main);
}

.kpi-value.success {
  color: var(--color-success);
}

.kpi-value.error {
  color: var(--color-error);
}

.kpi-value.warning {
  color: var(--color-warning);
}

.charts-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(420px, 1fr));
  gap: var(--spacing-lg);
}

.chart-container,
.chart-empty,
.chart-skeleton {
  height: 400px;
  width: 100%;
}

.chart-empty,
.chart-skeleton,
.loading-container {
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--color-text-muted);
}

.loading-container {
  min-height: 400px;
}

.risk-card :deep(.n-data-table) {
  cursor: pointer;
}

.risk-card :deep(.n-data-table tr:hover) {
  background-color: var(--color-bg-hover);
}

@media (max-width: 768px) {
  .analytics-page {
    padding: var(--spacing-md);
  }

  .charts-grid {
    grid-template-columns: 1fr;
  }

  .chart-container,
  .chart-empty,
  .chart-skeleton {
    height: 320px;
  }
}
</style>
