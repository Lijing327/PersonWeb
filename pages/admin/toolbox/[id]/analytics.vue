<template>
  <div class="space-y-6">
    <div class="page-header">
      <div class="flex items-center gap-4">
        <NuxtLink to="/admin/tools" class="text-gray-400 hover:text-var(--color-bg-light, white)">
          ← 返回工具列表
        </NuxtLink>
        <h1 class="page-title">工具使用统计</h1>
      </div>
    </div>

    <div v-if="loading" class="text-center py-12">
      <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
    </div>

    <div v-else-if="analytics">
      <!-- 汇总统计 -->
      <div class="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div class="card p-4">
          <div class="text-sm text-gray-500 dark:text-gray-400 mb-1">总使用次数</div>
          <div class="text-2xl font-bold">{{ analytics.summary.totalUses }}</div>
        </div>
        <div class="card p-4">
          <div class="text-sm text-gray-500 dark:text-gray-400 mb-1">API调用次数</div>
          <div class="text-2xl font-bold">{{ analytics.summary.totalApiCalls }}</div>
        </div>
        <div class="card p-4">
          <div class="text-sm text-gray-500 dark:text-gray-400 mb-1">总购买数</div>
          <div class="text-2xl font-bold">{{ analytics.summary.totalPurchases }}</div>
        </div>
        <div class="card p-4">
          <div class="text-sm text-gray-500 dark:text-gray-400 mb-1">总收入</div>
          <div class="text-2xl font-bold text-green-600 dark:text-green-400">¥{{ analytics.summary.totalRevenue.toFixed(2) }}</div>
        </div>
      </div>

      <!-- 每日统计图表 -->
      <div class="card p-6">
        <h2 class="text-xl font-bold mb-4">每日统计</h2>
        <div class="overflow-x-auto">
          <table class="w-full">
            <thead>
              <tr class="border-b border-gray-700">
                <th class="text-left p-3 text-sm font-medium">日期</th>
                <th class="text-right p-3 text-sm font-medium">查看</th>
                <th class="text-right p-3 text-sm font-medium">使用</th>
                <th class="text-right p-3 text-sm font-medium">API调用</th>
                <th class="text-right p-3 text-sm font-medium">购买</th>
                <th class="text-right p-3 text-sm font-medium">收入</th>
                <th class="text-right p-3 text-sm font-medium">平均耗时</th>
                <th class="text-right p-3 text-sm font-medium">错误数</th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="day in analytics.daily"
                :key="day.date"
                class="border-b border-gray-700 hover:bg-gray-800/50"
              >
                <td class="p-3 text-sm">{{ formatDate(day.date) }}</td>
                <td class="p-3 text-sm text-right">{{ day.viewCount }}</td>
                <td class="p-3 text-sm text-right">{{ day.useCount }}</td>
                <td class="p-3 text-sm text-right">{{ day.apiCallCount }}</td>
                <td class="p-3 text-sm text-right">{{ day.purchaseCount }}</td>
                <td class="p-3 text-sm text-right text-green-400">¥{{ day.revenue.toFixed(2) }}</td>
                <td class="p-3 text-sm text-right">{{ day.avgExecutionTime ? `${day.avgExecutionTime}ms` : '-' }}</td>
                <td class="p-3 text-sm text-right text-red-400">{{ day.errorCount }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({
  layout: 'admin',
  middleware: 'admin-auth'
})

const route = useRoute()
const api = useApi()

interface Analytics {
  summary: {
    totalViews: number
    totalUses: number
    totalApiCalls: number
    totalPurchases: number
    totalRevenue: number
    avgExecutionTime: number
    totalErrors: number
  }
  daily: Array<{
    date: string
    viewCount: number
    useCount: number
    apiCallCount: number
    purchaseCount: number
    revenue: number
    avgExecutionTime?: number
    errorCount: number
  }>
}

const analytics = ref<Analytics | null>(null)
const loading = ref(false)

// 获取统计信息
const fetchAnalytics = async () => {
  const toolId = parseInt(route.params.id as string)
  if (!toolId) return

  loading.value = true
  try {
    const res = await api.post('/Toolbox/analytics', {
      toolId,
      startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      endDate: new Date().toISOString().split('T')[0]
    })

    if (res) {
      analytics.value = res as Analytics
    }
  } catch (e) {
    console.error('获取统计信息失败', e)
  } finally {
    loading.value = false
  }
}

const formatDate = (dateString: string) => {
  const date = new Date(dateString)
  return date.toLocaleDateString('zh-CN', { year: 'numeric', month: 'short', day: 'numeric' })
}

onMounted(() => {
  fetchAnalytics()
})
</script>

<style scoped>
/* 使用 admin layout 的样式 */
</style>

