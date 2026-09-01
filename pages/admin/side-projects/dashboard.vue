<template>
  <div class="side-project-dashboard-page">
    <!-- 顶部：副业概览 + 时间筛选 -->
    <n-card class="dashboard-card hero-card mb-6">
      <div class="flex flex-col md:flex-row justify-between items-start gap-4">
        <div class="flex-1">
          <h1 class="text-2xl font-bold mb-2">副业数据看板</h1>
          <p class="text-sm opacity-70">最近12个月的副业收入、项目类型和技术栈一目了然</p>
        </div>
        <ClientOnly>
          <div class="flex flex-wrap items-center gap-3">
            <n-date-picker
              v-model:value="dateRange"
              type="daterange"
              clearable
              placeholder="选择时间范围"
              size="small"
              @update:value="handleDateRangeChange"
            />
            <n-select
              v-model:value="selectedIncomeType"
              placeholder="全部类型"
              clearable
              size="small"
              :options="incomeTypeOptions"
              style="width: 150px"
              @update:value="handleIncomeTypeChange"
            />
            <n-select
              v-model:value="selectedCategory"
              placeholder="全部类型"
              clearable
              size="small"
              :options="categoryOptions"
              style="width: 150px"
              @update:value="handleCategoryChange"
            />
            <n-button 
              type="primary" 
              size="small"
              @click="loadAllData" 
              :loading="loading"
              :disabled="loading"
            >
              刷新数据
            </n-button>
          </div>
          <template #fallback>
            <div class="flex gap-2">
              <div class="w-32 h-8 bg-gray-200 rounded animate-pulse"></div>
              <div class="w-32 h-8 bg-gray-200 rounded animate-pulse"></div>
            </div>
          </template>
        </ClientOnly>
      </div>
    </n-card>

    <!-- 数据提示 -->
    <ClientOnly>
      <n-alert
        v-if="!loading && hasNoData"
        type="info"
        title="暂无数据"
        class="mb-4"
      >
        <template #header>
          <span>暂无副业项目数据</span>
        </template>
        <div>
          <p>当前没有副业项目数据，可能的原因：</p>
          <ul style="margin-left: 20px; margin-top: 8px;">
            <li>数据库表 <code>side_project</code> 尚未创建</li>
            <li>数据库中还没有副业项目记录</li>
            <li>请先执行数据库脚本 <code>database/side_project_tables.sql</code> 创建表并插入示例数据</li>
          </ul>
        </div>
      </n-alert>
    </ClientOnly>

    <template v-if="!hasNoData">
      <!-- 第一行：副业 KPI 卡片 -->
      <div class="mb-4">
        <ClientOnly>
          <DashboardKpiCards :summary="summary" />
        </ClientOnly>
      </div>

      <!-- 第二行：收入趋势 + 订单数量趋势 -->
      <div class="grid gap-4 mb-4 md:grid-cols-2">
        <ClientOnly>
          <DashboardIncomeTrend :data="incomeTrend" :loading="loading" />
        </ClientOnly>
        <ClientOnly>
          <DashboardDurationBuckets :data="durationBuckets" />
        </ClientOnly>
      </div>

      <!-- 第三行：客户来源 + 项目类型占比 -->
      <div class="grid gap-4 mb-4 md:grid-cols-2">
        <ClientOnly>
          <DashboardClientSource :data="clientSource" />
        </ClientOnly>
        <ClientOnly>
          <DashboardCategoryChart :category-data="categoryDistribution" />
        </ClientOnly>
      </div>

      <!-- 第四行：项目时间线 + 最近项目列表 -->
      <div class="grid gap-4 md:grid-cols-2">
        <ClientOnly>
          <DashboardTimeline :items="recentProjects" :loading="loading" />
        </ClientOnly>
        <ClientOnly>
          <DashboardRecentProjects :items="recentProjects" :loading="loading" />
        </ClientOnly>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'

// 异步加载图表组件，减少初始包大小
const DashboardKpiCards = defineAsyncComponent(() => 
  import('~/components/side-projects/DashboardKpiCards.vue')
)
const DashboardIncomeTrend = defineAsyncComponent(() => 
  import('~/components/side-projects/DashboardIncomeTrend.vue')
)
const DashboardCategoryChart = defineAsyncComponent(() => 
  import('~/components/side-projects/DashboardCategoryChart.vue')
)
const DashboardClientSource = defineAsyncComponent(() => 
  import('~/components/side-projects/DashboardClientSource.vue')
)
const DashboardDurationBuckets = defineAsyncComponent(() => 
  import('~/components/side-projects/DashboardDurationBuckets.vue')
)
const DashboardTimeline = defineAsyncComponent(() => 
  import('~/components/side-projects/DashboardTimeline.vue')
)
const DashboardRecentProjects = defineAsyncComponent(() => 
  import('~/components/side-projects/DashboardRecentProjects.vue')
)
import { useApi } from '~/composables/useApi'
import type {
  ProjectDashboardSummaryDto,
  IncomeTrendPointDto,
  CategoryDistributionItemDto,
  TechStackDistributionItemDto,
  ClientSourceItemDto,
  DurationBucketItemDto,
  SideProject,
  SideProjectListResponse
} from '~/types/api'

definePageMeta({
  layout: 'admin',
  middleware: 'admin-auth'
})

const api = useApi()
const router = useRouter()

// 数据状态
const loading = ref(false)
const summary = ref<ProjectDashboardSummaryDto | null>(null)
const incomeTrend = ref<IncomeTrendPointDto[]>([])
const categoryDistribution = ref<CategoryDistributionItemDto[]>([])
const techDistribution = ref<TechStackDistributionItemDto[]>([])
const clientSource = ref<ClientSourceItemDto[]>([])
const durationBuckets = ref<DurationBucketItemDto[]>([])
const recentProjects = ref<SideProject[]>([])

// 筛选条件
const dateRange = ref<[number, number] | null>(null)
const selectedIncomeType = ref<string | null>(null)
const selectedCategory = ref<string | null>(null)

// 收入类型选项
const incomeTypeOptions = [
  { label: '全部类型', value: null },
  { label: '软件开发', value: 'development' },
  { label: '投资', value: 'investment' }
]

// 检查是否有数据
const hasNoData = computed(() => {
  const hasSummaryData = summary.value && summary.value.totalProjects > 0
  return !hasSummaryData
})

// 计算时间范围
const timeRange = computed(() => {
  if (dateRange.value) {
    return {
      from: new Date(dateRange.value[0]),
      to: new Date(dateRange.value[1])
    }
  }
  return { from: null, to: null }
})

// 项目类型选项
const categoryOptions = computed(() => {
  const categories = new Set<string>()
  categoryDistribution.value.forEach(item => {
    if (item.category) {
      categories.add(item.category)
    }
  })
  return Array.from(categories).map(cat => ({
    label: cat,
    value: cat
  }))
})

// API 调用函数
const fetchSummary = async () => {
  try {
    const params: any = {}
    if (timeRange.value.from && timeRange.value.to) {
      params.from = timeRange.value.from.toISOString()
      params.to = timeRange.value.to.toISOString()
    }
    if (selectedIncomeType.value) {
      params.incomeType = selectedIncomeType.value
    }
    
    const res = await api.get<any>('/side-projects/dashboard/summary', { params })
    
    if (res && typeof res === 'object') {
      summary.value = {
        totalIncome: res.totalIncome ?? res.TotalIncome ?? 0,
        totalProjects: res.totalProjects ?? res.TotalProjects ?? 0,
        avgProjectPrice: res.avgProjectPrice ?? res.AvgProjectPrice ?? 0,
        avgDurationDays: res.avgDurationDays ?? res.AvgDurationDays ?? 0,
        developmentIncome: res.developmentIncome ?? res.DevelopmentIncome ?? 0,
        developmentProjects: res.developmentProjects ?? res.DevelopmentProjects ?? 0,
        investmentIncome: res.investmentIncome ?? res.InvestmentIncome ?? 0,
        investmentProjects: res.investmentProjects ?? res.InvestmentProjects ?? 0
      }
    } else {
      summary.value = null
    }
  } catch (e: any) {
    console.error('获取汇总数据失败:', e)
    summary.value = null
  }
}

const fetchIncomeTrend = async () => {
  try {
    const params: any = { granularity: 'month' }
    if (timeRange.value.from && timeRange.value.to) {
      params.from = timeRange.value.from.toISOString()
      params.to = timeRange.value.to.toISOString()
    }
    if (selectedIncomeType.value) {
      params.incomeType = selectedIncomeType.value
    }
    const res = await api.get<any>('/side-projects/dashboard/income-trend', { params })
    if (Array.isArray(res)) {
      incomeTrend.value = res.map(item => ({
        date: item.date ?? item.Date ?? '',
        income: item.income ?? item.Income ?? 0
      }))
    } else if (res && Array.isArray(res.data)) {
      incomeTrend.value = res.data.map((item: any) => ({
        date: item.date ?? item.Date ?? '',
        income: item.income ?? item.Income ?? 0
      }))
    } else {
      incomeTrend.value = []
    }
  } catch (e) {
    console.error('获取收入趋势失败:', e)
    incomeTrend.value = []
  }
}

const fetchCategoryDistribution = async () => {
  try {
    const params: any = {}
    if (timeRange.value.from && timeRange.value.to) {
      params.from = timeRange.value.from.toISOString()
      params.to = timeRange.value.to.toISOString()
    }
    if (selectedIncomeType.value) {
      params.incomeType = selectedIncomeType.value
    }
    const res = await api.get<any>('/side-projects/dashboard/category-distribution', { params })
    if (Array.isArray(res)) {
      categoryDistribution.value = res.map((item: any) => ({
        category: item.category ?? item.Category ?? '',
        count: item.count ?? item.Count ?? 0,
        income: item.income ?? item.Income ?? 0
      }))
    } else {
      categoryDistribution.value = []
    }
  } catch (e) {
    console.error('获取类型分布失败:', e)
    categoryDistribution.value = []
  }
}

const fetchClientSource = async () => {
  try {
    const params: any = {}
    if (timeRange.value.from && timeRange.value.to) {
      params.from = timeRange.value.from.toISOString()
      params.to = timeRange.value.to.toISOString()
    }
    if (selectedIncomeType.value) {
      params.incomeType = selectedIncomeType.value
    }
    const res = await api.get<any>('/side-projects/dashboard/client-source', { params })
    if (Array.isArray(res)) {
      clientSource.value = res.map((item: any) => ({
        source: item.source ?? item.Source ?? '',
        count: item.count ?? item.Count ?? 0,
        income: item.income ?? item.Income ?? 0
      }))
    } else {
      clientSource.value = []
    }
  } catch (e) {
    console.error('获取客户来源失败:', e)
    clientSource.value = []
  }
}

const fetchDurationBuckets = async () => {
  try {
    const params: any = {}
    if (timeRange.value.from && timeRange.value.to) {
      params.from = timeRange.value.from.toISOString()
      params.to = timeRange.value.to.toISOString()
    }
    const res = await api.get<any>('/side-projects/dashboard/duration-buckets', { params })
    if (Array.isArray(res)) {
      durationBuckets.value = res.map((item: any) => ({
        bucketName: item.bucketName ?? item.BucketName ?? '',
        count: item.count ?? item.Count ?? 0
      }))
    } else {
      durationBuckets.value = []
    }
  } catch (e) {
    console.error('获取周期分布失败:', e)
    durationBuckets.value = []
  }
}

const fetchRecentProjects = async () => {
  try {
    const params: any = {
      page: 1,
      pageSize: 10
    }
    if (selectedIncomeType.value) {
      params.incomeType = selectedIncomeType.value
    }
    if (selectedCategory.value) {
      params.category = selectedCategory.value
    }
    const res = await api.get<any>('/side-projects', { params })
    
    if (res && typeof res === 'object') {
      if ('list' in res && Array.isArray(res.list)) {
        recentProjects.value = res.list
      } else if ('List' in res && Array.isArray(res.List)) {
        recentProjects.value = res.List
      } else if (Array.isArray(res)) {
        recentProjects.value = res
      } else {
        const arrayKey = Object.keys(res).find(key => Array.isArray(res[key]))
        if (arrayKey) {
          recentProjects.value = res[arrayKey]
        } else {
          recentProjects.value = []
        }
      }
    } else {
      recentProjects.value = []
    }
  } catch (e) {
    console.error('获取最近项目失败:', e)
    recentProjects.value = []
  }
}

// 加载所有数据
const loadAllData = async () => {
  loading.value = true
  try {
    await Promise.all([
      fetchSummary(),
      fetchIncomeTrend(),
      fetchCategoryDistribution(),
      fetchClientSource(),
      fetchDurationBuckets(),
      fetchRecentProjects()
    ])
  } finally {
    loading.value = false
  }
}

// 筛选变化处理
const handleDateRangeChange = () => {
  loadAllData()
}

const handleIncomeTypeChange = () => {
  loadAllData()
}

const handleCategoryChange = () => {
  fetchRecentProjects()
}

// 生命周期
onMounted(() => {
  loadAllData()
})
</script>

<style scoped>
/* 只保留布局相关的样式，不写颜色 */
.side-project-dashboard-page {
  padding: var(--spacing-lg);
}

@media (min-width: 768px) {
  .side-project-dashboard-page {
    padding: var(--spacing-xl);
  }
}
</style>
