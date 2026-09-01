<template>
  <div class="admin-dashboard-page">
    <!-- 顶部欢迎区 + 快捷入口 -->
    <AppCard class="dashboard-card hero-card mb-6">
      <div class="flex flex-col md:flex-row justify-between items-center gap-3">
        <div class="flex-1">
          <h2 class="text-2xl font-semibold mb-1">欢迎回来，Admin</h2>
          <p class="text-sm subtitle-text">
            今天是 {{ currentDate }}，共 {{ stats.articleCount }} 篇文章 / {{ stats.toolCount }} 个项目 / {{ stats.pendingConsultations }} 条咨询
          </p>
        </div>
        <div class="flex flex-wrap gap-2">
          <AppButton variant="primary" @click="navigateTo('/admin/analytics')">
            查看分析
          </AppButton>
          <AppButton variant="secondary" @click="navigateTo('/admin/content-hub')">
            内容中枢
          </AppButton>
          <AppButton variant="secondary" @click="navigateTo('/admin/consultations')">
            待处理咨询
          </AppButton>
        </div>
      </div>
    </AppCard>

    <!-- 加载状态 -->
    <div v-if="isLoading" class="flex items-center justify-center min-h-60">
      <div class="text-center">
        <div class="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary mb-4"></div>
        <p class="text-text-muted">加载中...</p>
      </div>
    </div>

    <template v-else>
      <!-- 核心指标区域 -->
      <div class="mt-8">
        <div class="flex items-center justify-between mb-4">
          <h3 class="text-base font-semibold text-main opacity-90">核心指标</h3>
          <AppButton variant="secondary" size="sm" @click="fetchStats">
            <i class="fas fa-sync-alt mr-1"></i>
            刷新数据
          </AppButton>
        </div>
        
        <div class="grid gap-5 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
          <AdminDashboardKpiCard
            v-for="kpi in kpiCards"
            :key="kpi.key"
            :label="kpi.label"
            :value="kpi.value"
            :trend="kpi.trend"
            :loading="isLoading"
          />
        </div>
      </div>

      <!-- 内容分析区域 -->
      <div class="mt-10">
        <div class="section-title">内容分析</div>
        <div class="grid gap-4 md:grid-cols-2">
          <AppCard class="dashboard-card">
            <template #header>
              <div class="chart-header">
                <h3 class="chart-title">访问趋势</h3>
              </div>
            </template>
            <div class="chart-container">
              <ClientOnly>
                <AdminDashboardTrendAndSource :visit-trend="visitTrend" />
              </ClientOnly>
            </div>
          </AppCard>
          <AppCard class="dashboard-card">
            <template #header>
              <div class="chart-header">
                <h3 class="chart-title">热门页面</h3>
              </div>
            </template>
            <div class="chart-container">
              <ClientOnly>
                <AdminDashboardTopPagesCard :top-paths="topPaths" />
              </ClientOnly>
            </div>
          </AppCard>
        </div>
      </div>

      <!-- 活动与待办区域 -->
      <div class="mt-10">
        <div class="section-title">活动与待办</div>
        <div class="grid gap-4 md:grid-cols-2">
          <AppCard class="dashboard-card">
            <template #header>
              <h3 class="chart-title">最近活动</h3>
            </template>
            <div class="chart-container">
              <AdminDashboardTimeline :items="timelineItems" />
            </div>
          </AppCard>
          <AppCard class="dashboard-card">
            <template #header>
              <h3 class="chart-title">待办事项</h3>
            </template>
            <div class="chart-container">
              <div class="todo-list">
                <div v-if="stats.pendingConsultations > 0" class="todo-item">
                  <div class="todo-content">
                    <div class="todo-title">待处理咨询</div>
                    <div class="todo-desc">{{ stats.pendingConsultations }} 条新咨询</div>
                  </div>
                  <div class="todo-actions">
                    <span class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-warning/20 text-warning">
                      {{ stats.pendingConsultations }}
                    </span>
                    <AppButton variant="secondary" size="sm" @click="navigateTo('/admin/consultations')">
                      查看
                    </AppButton>
                  </div>
                </div>
                <div v-if="stats.pendingOrders > 0" class="todo-item">
                  <div class="todo-content">
                    <div class="todo-title">待处理订单</div>
                    <div class="todo-desc">{{ stats.pendingOrders }} 个待处理订单</div>
                  </div>
                  <div class="todo-actions">
                    <span class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-warning/20 text-warning">
                      {{ stats.pendingOrders }}
                    </span>
                    <AppButton variant="secondary" size="sm" @click="navigateTo('/admin/orders')">
                      查看
                    </AppButton>
                  </div>
                </div>
                <div v-if="stats.pendingMessages > 0" class="todo-item">
                  <div class="todo-content">
                    <div class="todo-title">待审核留言</div>
                    <div class="todo-desc">{{ stats.pendingMessages }} 条新留言</div>
                  </div>
                  <div class="todo-actions">
                    <span class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-warning/20 text-warning">
                      {{ stats.pendingMessages }}
                    </span>
                    <AppButton variant="secondary" size="sm" @click="navigateTo('/admin/visitor-messages')">
                      查看
                    </AppButton>
                  </div>
                </div>
                <div v-if="stats.pendingConsultations === 0 && stats.pendingOrders === 0 && stats.pendingMessages === 0" class="todo-empty">
                  暂无待办事项
                </div>
              </div>
            </div>
          </AppCard>
        </div>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, defineAsyncComponent, onUnmounted } from 'vue'

// 异步加载图表组件，减少初始包大小
const AdminDashboardTrendAndSource = defineAsyncComponent(() => 
  import('~/components/admin/dashboard/TrendAndSource.vue')
)
const AdminDashboardTopPagesCard = defineAsyncComponent(() => 
  import('~/components/admin/dashboard/TopPagesCard.vue')
)
const AdminDashboardTimeline = defineAsyncComponent(() => 
  import('~/components/admin/dashboard/Timeline.vue')
)
const AdminDashboardKpiCard = defineAsyncComponent(() => 
  import('~/components/admin/dashboard/KpiCard.vue')
)

definePageMeta({
  layout: 'admin',
  middleware: 'admin-auth',
  ssr: false
})

// 显式导入组件，确保 Nuxt 自动导入正常工作
import AppCard from '~/components/ui/AppCard.vue'
import AppButton from '~/components/ui/AppButton.vue'

const api = useApi()
const stats = ref({
  articleCount: 0,
  toolCount: 0,
  todayVisits: 0,
  totalVisits: 0,
  uniqueVisitors: 0,
  yesterdayVisits: 0,
  onlineCount: 0,
  pendingMessages: 0,
  pendingTasks: 0,
  pendingOrders: 0,
  pendingConsultations: 0,
  totalOrders: 0,
  totalConsultations: 0,
  todayOrders: 0,
  todayConsultations: 0
})

const topPaths = ref<any[]>([])
const visitTrend = ref<any[]>([])
const isLoading = ref(true)

// 计算当前日期
const currentDate = computed(() => {
  const now = new Date()
  return now.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    weekday: 'long'
  })
})

// 计算核心 KPI 数据（使用 shallowRef 优化，避免深度响应式）
const kpiCards = computed(() => {
  // 缓存计算结果，避免重复计算
  const yesterdayVisits = stats.value.yesterdayVisits
  const todayVisits = stats.value.todayVisits
  const todayVisitsTrend = yesterdayVisits > 0
    ? ((todayVisits - yesterdayVisits) / yesterdayVisits) * 100
    : null

  return [
    {
      key: 'articles',
      label: '总文章数',
      value: stats.value.articleCount,
      trend: null
    },
    {
      key: 'projects',
      label: '总项目数',
      value: stats.value.toolCount,
      trend: null
    },
    {
      key: 'todayVisits',
      label: '今日访问量',
      value: todayVisits,
      trend: todayVisitsTrend
    },
    {
      key: 'pending',
      label: '待处理事项',
      value: stats.value.pendingConsultations + stats.value.pendingOrders + stats.value.pendingMessages,
      trend: null
    }
  ]
})

// 时间线数据
const timelineItems = computed(() => {
  const now = new Date()
  const formatDate = (date: Date) => {
    return date.toLocaleDateString('zh-CN', {
      month: 'short',
      day: 'numeric'
    })
  }
  
  return [
    {
      path: '/admin/articles',
      icon: '📝',
      title: '文章管理',
      desc: '管理你的文章内容',
      color: 'blue' as const,
      date: formatDate(now)
    },
    {
      path: '/admin/visitor-messages',
      icon: '💬',
      title: '访客留言',
      desc: stats.value.pendingMessages > 0 ? `${stats.value.pendingMessages} 条待审核留言` : '审核访客留言',
      color: 'purple' as const,
      date: formatDate(now)
    },
    {
      path: '/admin/time-capsules',
      icon: '⏰',
      title: '时间胶囊',
      desc: '管理时间胶囊内容',
      color: 'purple' as const,
      date: formatDate(now)
    },
    {
      path: '/admin/orders',
      icon: '🛒',
      title: '订单管理',
      desc: stats.value.pendingOrders > 0 ? `${stats.value.pendingOrders} 个待处理` : '管理所有订单',
      color: 'yellow' as const,
      date: formatDate(now)
    },
    {
      path: '/admin/consultations',
      icon: '💬',
      title: '咨询管理',
      desc: stats.value.pendingConsultations > 0 ? `${stats.value.pendingConsultations} 条新咨询` : '管理客户咨询',
      color: 'teal' as const,
      date: formatDate(now)
    }
  ]
})

const formatValue = (value: number) => {
  // Deprecated: KpiCard handles formatting now
  if (value >= 10000) {
    return (value / 10000).toFixed(1) + 'w'
  }
  return value.toLocaleString('zh-CN')
}

const fetchStats = async () => {
  try {
    isLoading.value = true
    const res = await api.get<any>('/Stats')
    if (res) {
      stats.value.todayVisits = res.TodayVisits ?? res.todayVisits ?? 0
      stats.value.articleCount = res.ArticleCount ?? res.articleCount ?? 0
      stats.value.toolCount = res.ProjectCount ?? res.projectCount ?? 0
      stats.value.totalVisits = res.TotalVisits ?? res.totalVisits ?? 0
      stats.value.uniqueVisitors = res.UniqueVisitors ?? res.uniqueVisitors ?? 0
      stats.value.yesterdayVisits = res.YesterdayVisits ?? res.yesterdayVisits ?? 0
      stats.value.onlineCount = res.OnlineCount ?? res.onlineCount ?? 0
      stats.value.pendingMessages = res.PendingMessages ?? res.pendingMessages ?? 0
      stats.value.pendingTasks = res.PendingTasks ?? res.pendingTasks ?? 0
      
      const topPathsData = res.TopPaths ?? res.topPaths ?? []
      topPaths.value = Array.isArray(topPathsData) 
        ? topPathsData.filter((p: any) => p && (p.Path || p.path))
        : []
      
      const visitTrendData = res.VisitTrend ?? res.visitTrend ?? []
      visitTrend.value = Array.isArray(visitTrendData) ? visitTrendData : []
      
      await Promise.all([
        fetchOrderStats(),
        fetchConsultationStats()
      ])
    }
  } catch (e: any) {
    console.error('Failed to fetch stats:', e)
  } finally {
    isLoading.value = false
  }
}

const fetchOrderStats = async () => {
  try {
    // 只请求一次，获取所有需要的数据
    const res = await api.get<any>('/admin/orders', {
      params: { page: 1, pageSize: 50 }
    })
    
    if (res) {
      const total = res.Total ?? res.total ?? 0
      const list = res.List ?? res.list ?? (Array.isArray(res) ? res : [])
      
      // 计算待处理订单数（status === 0）
      const pendingOrders = list.filter((order: any) => (order.Status ?? order.status) === 0)
      stats.value.pendingOrders = pendingOrders.length
      
      // 总订单数
      stats.value.totalOrders = total
      
      // 今日订单数
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      const todayOrders = list.filter((order: any) => {
        if (!order.CreatedAt && !order.createdAt) return false
        const orderDate = new Date(order.CreatedAt || order.createdAt)
        return orderDate >= today
      })
      stats.value.todayOrders = todayOrders.length
    }
  } catch (e: any) {
    if (process.dev) {
      console.warn('获取订单统计数据失败:', e)
    }
  }
}

const fetchConsultationStats = async () => {
  try {
    // 只请求一次，获取所有需要的数据
    const res = await api.get<any>('/admin/consultations', {
      params: { page: 1, pageSize: 50 }
    })
    
    if (res) {
      const total = res.Total ?? res.total ?? 0
      const list = res.List ?? res.list ?? (Array.isArray(res) ? res : [])
      
      // 计算待处理咨询数（status === 0）
      const pendingConsultations = list.filter((consultation: any) => (consultation.Status ?? consultation.status) === 0)
      stats.value.pendingConsultations = pendingConsultations.length
      
      // 总咨询数
      stats.value.totalConsultations = total
      
      // 今日咨询数
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      const todayConsultations = list.filter((consultation: any) => {
        if (!consultation.CreatedAt && !consultation.createdAt) return false
        const consultationDate = new Date(consultation.CreatedAt || consultation.createdAt)
        return consultationDate >= today
      })
      stats.value.todayConsultations = todayConsultations.length
    }
  } catch (e: any) {
    if (process.dev) {
      console.warn('获取咨询统计数据失败:', e)
    }
  }
}

onMounted(() => {
  fetchStats()
  setInterval(fetchStats, 30000)
})
</script>

<style scoped>
/* 布局由 layouts/admin.vue 的 .admin-page-shell 统一内边距（全宽，不居中限宽） */
.admin-dashboard-page {
  padding: 0;
}

/* Section Title */
.section-title {
  font-size: var(--font-size-sm);
  font-weight: 600;
  margin-bottom: var(--spacing-sm);
  letter-spacing: 0.02em;
  color: var(--color-text-main);
  opacity: 0.88;
}

/* KPI 卡片 */
.kpi-card-inner {
  padding: 20px 24px;
  position: relative;
}

/* KPI 卡片右上角柔光小圆点 */
.kpi-glow-dot {
  position: absolute;
  top: 12px;
  right: 12px;
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: var(--n-primary-color, #3b82f6);
  box-shadow: var(--shadow-primary, 0 0 8px rgba(59, 130, 246, 0.6));
  opacity: 0.7;
}

.kpi-label {
  font-size: 12px;
  margin-bottom: 12px;
  opacity: 0.7;
  color: var(--color-text-sub);
}

.kpi-value-row {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  gap: 8px;
}

.kpi-value {
  font-size: 36px;
  font-weight: 600;
  line-height: 1;
  flex: 1;
  color: var(--color-text-main);
}

.kpi-trend {
  font-size: 12px;
  font-weight: 500;
  white-space: nowrap;
  color: var(--color-text-sub);
}

.kpi-trend-up {
  /* 使用 Naive UI 的 success 颜色 */
  color: var(--n-success-color);
}

.kpi-trend-down {
  /* 使用 Naive UI 的 error 颜色 */
  color: var(--n-error-color);
}

.subtitle-text {
  opacity: 0.7;
  color: var(--color-text-sub);
}

.kpi-trend-empty {
  font-size: 12px;
  opacity: 0.5;
  white-space: nowrap;
}

/* 图表卡片 */
.chart-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.chart-title {
  font-size: 16px;
  font-weight: 600;
  color: var(--color-text-main);
}

.chart-actions {
  display: flex;
  gap: 8px;
}

.chart-container {
  min-height: 320px;
  padding: 16px;
}

/* 待办列表 */
.todo-list {
  display: flex;
  flex-direction: column;
}

.todo-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 48px;
  padding: 0 4px;
  border-bottom: 1px solid var(--color-border-subtle, rgba(148, 163, 184, 0.20));
  transition: background-color 0.2s ease;
}

.todo-item:hover {
  background-color: var(--color-bg-elevated, rgba(148, 163, 184, 0.06));
}

.todo-item:last-child {
  border-bottom: none;
}

.todo-content {
  flex: 1;
  min-width: 0;
}

.todo-title {
  font-size: 14px;
  font-weight: 500;
  margin-bottom: 2px;
}

.todo-desc {
  font-size: 12px;
  opacity: 0.7;
}

.todo-actions {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-shrink: 0;
}

.todo-empty {
  text-align: center;
  padding: 32px 16px;
  opacity: 0.5;
  font-size: 14px;
}
</style>
