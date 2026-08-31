<template>
  <div class="dashboard-page">
    <div class="dashboard-background" aria-hidden="true">
      <div class="dashboard-blob dashboard-blob--blue"></div>
      <div class="dashboard-blob dashboard-blob--violet"></div>
      <div class="dashboard-grid"></div>
    </div>

    <div class="dashboard-shell">
      <section class="dashboard-hero">
        <div class="dashboard-hero-copy">
          <p class="dashboard-kicker">Digital Twin Lab</p>
          <h1 class="dashboard-title">数字分身仪表盘</h1>
          <p class="dashboard-subtitle">
            用一页看清近期的精力、行动、体征和资产趋势，把零散记录整理成可回看的生活面板。
          </p>

          <div class="dashboard-hero-tags">
            <span class="dashboard-hero-tag">最近 {{ metrics.length || 0 }} 条记录</span>
            <span class="dashboard-hero-tag">最后更新 {{ latestDateText }}</span>
            <span class="dashboard-hero-tag">近 30 天趋势</span>
          </div>
        </div>

        <div class="dashboard-hero-panel">
          <div class="dashboard-hero-panel-head">
            <p class="dashboard-panel-kicker">Overview</p>
            <h2 class="dashboard-panel-title">本期概览</h2>
          </div>

          <div class="dashboard-overview-grid">
            <div class="dashboard-overview-item">
              <span class="dashboard-overview-label">健康节奏</span>
              <strong class="dashboard-overview-value">{{ healthStateLabel }}</strong>
            </div>
            <div class="dashboard-overview-item">
              <span class="dashboard-overview-label">行动完成度</span>
              <strong class="dashboard-overview-value">{{ stepCompletionText }}</strong>
            </div>
            <div class="dashboard-overview-item">
              <span class="dashboard-overview-label">体征观察</span>
              <strong class="dashboard-overview-value">BMI {{ bmiText }}</strong>
            </div>
            <div class="dashboard-overview-item">
              <span class="dashboard-overview-label">资产状态</span>
              <strong class="dashboard-overview-value">{{ wealthText }}</strong>
            </div>
          </div>
        </div>
      </section>

      <section class="dashboard-metrics-grid">
        <article class="dashboard-metric-card dashboard-metric-card--energy">
          <div class="dashboard-metric-icon" aria-hidden="true">
            <i class="fas fa-bolt"></i>
          </div>
          <p class="dashboard-metric-label">精力电量</p>
          <div class="dashboard-metric-value-row">
            <strong class="dashboard-metric-value">{{ latest.energy }}%</strong>
            <span class="dashboard-metric-unit">Energy</span>
          </div>
          <div class="dashboard-progress">
            <div class="dashboard-progress-bar dashboard-progress-bar--energy" :style="{ width: `${energyProgress}%` }"></div>
          </div>
          <p class="dashboard-metric-meta">睡眠 {{ latest.sleep }} 小时</p>
        </article>

        <article class="dashboard-metric-card dashboard-metric-card--activity">
          <div class="dashboard-metric-icon" aria-hidden="true">
            <i class="fas fa-person-walking"></i>
          </div>
          <p class="dashboard-metric-label">日常行动</p>
          <div class="dashboard-metric-value-row">
            <strong class="dashboard-metric-value">{{ latest.steps }}</strong>
            <span class="dashboard-metric-unit">Steps</span>
          </div>
          <div class="dashboard-progress">
            <div class="dashboard-progress-bar dashboard-progress-bar--activity" :style="{ width: `${stepsProgress}%` }"></div>
          </div>
          <p class="dashboard-metric-meta">目标 10,000 步</p>
        </article>

        <article class="dashboard-metric-card dashboard-metric-card--physique">
          <div class="dashboard-metric-icon" aria-hidden="true">
            <i class="fas fa-heart-pulse"></i>
          </div>
          <p class="dashboard-metric-label">体征状态</p>
          <div class="dashboard-metric-value-row">
            <strong class="dashboard-metric-value">{{ latest.weight }}</strong>
            <span class="dashboard-metric-unit">kg</span>
          </div>
          <div class="dashboard-metric-badge">BMI {{ bmiText }}</div>
          <p class="dashboard-metric-meta">以 175cm 估算的当前体质指数</p>
        </article>

        <article class="dashboard-metric-card dashboard-metric-card--wealth">
          <div class="dashboard-metric-icon" aria-hidden="true">
            <i class="fas fa-wallet"></i>
          </div>
          <p class="dashboard-metric-label">净资产</p>
          <div class="dashboard-metric-value-row">
            <strong class="dashboard-metric-value">¥{{ netWorthWanText }}</strong>
            <span class="dashboard-metric-unit">万</span>
          </div>
          <div class="dashboard-metric-badge dashboard-metric-badge--positive">
            <i class="fas fa-arrow-trend-up"></i>
            持续记录中
          </div>
          <p class="dashboard-metric-meta">更适合作为长期变化观察，而不是即时结论</p>
        </article>
      </section>

      <section class="dashboard-chart-grid">
        <article class="dashboard-chart-card">
          <div class="dashboard-chart-head">
            <div>
              <p class="dashboard-panel-kicker">Health Trends</p>
              <h2 class="dashboard-panel-title">健康趋势</h2>
            </div>
            <span class="dashboard-chart-note">步数 / 体重双轴观察</span>
          </div>

          <div v-if="metrics.length > 0" class="dashboard-chart-body">
            <ChartsAppEChart :option="healthChartOption" loading-text="图表加载中..." />
            <div v-if="false" class="dashboard-empty-state">
              <p>图表加载中...</p>
            </div>
          </div>
          <div v-else class="dashboard-empty-state">
            <i class="fas fa-chart-line"></i>
            <p>暂无健康趋势数据</p>
          </div>
        </article>

        <article class="dashboard-chart-card">
          <div class="dashboard-chart-head">
            <div>
              <p class="dashboard-panel-kicker">Wealth Growth</p>
              <h2 class="dashboard-panel-title">资产趋势</h2>
            </div>
            <span class="dashboard-chart-note">近 30 天净资产变化</span>
          </div>

          <div v-if="metrics.length > 0" class="dashboard-chart-body">
            <ChartsAppEChart :option="wealthChartOption" loading-text="图表加载中..." />
            <div v-if="false" class="dashboard-empty-state">
              <p>图表加载中...</p>
            </div>
          </div>
          <div v-else class="dashboard-empty-state">
            <i class="fas fa-coins"></i>
            <p>暂无资产趋势数据</p>
          </div>
        </article>
      </section>
    </div>
  </div>
</template>

<script setup lang="ts">
import '~/assets/css/dashboard.css'

definePageMeta({
  ssr: false
})

usePageStyle('dashboard')

useHead({
  title: '数字分身仪表盘 - 溪午听风',
  meta: [
    { name: 'description', content: '个人精力、行动、体征与资产的私人回顾面板（非 Work 对外名片）。' },
    { key: 'robots', name: 'robots', content: 'noindex,nofollow' },
  ],
})

type MetricRecord = {
  date: string
  steps: number
  sleep: number
  weight: number
  netWorth: number
  energy: number
}

const api = useApi()
const metrics = ref<MetricRecord[]>([])
const latest = ref<MetricRecord>({
  steps: 0,
  sleep: 0,
  weight: 0,
  netWorth: 0,
  energy: 0,
  date: ''
})

const energyProgress = computed(() => Math.min(Math.max(latest.value.energy || 0, 0), 100))
const stepsProgress = computed(() => Math.min(Math.max((latest.value.steps / 10000) * 100, 0), 100))
const bmiText = computed(() => (latest.value.weight / (1.75 * 1.75)).toFixed(1))
const netWorthWanText = computed(() => (latest.value.netWorth / 10000).toFixed(1))

const latestDateText = computed(() => {
  if (!latest.value.date) return '暂无更新'

  return new Date(latest.value.date).toLocaleDateString('zh-CN', {
    month: 'numeric',
    day: 'numeric'
  })
})

const healthStateLabel = computed(() => {
  if (latest.value.energy >= 80) return '状态饱满'
  if (latest.value.energy >= 60) return '节奏稳定'
  if (latest.value.energy >= 40) return '需要恢复'
  return '低电量期'
})

const stepCompletionText = computed(() => `${Math.round(stepsProgress.value)}%`)
const wealthText = computed(() => `${netWorthWanText.value} 万`)

const chartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  interaction: {
    mode: 'index' as const,
    intersect: false
  },
  plugins: {
    legend: {
      position: 'top' as const,
      labels: {
        color: '#cbd5e1',
        usePointStyle: true,
        boxWidth: 10,
        boxHeight: 10
      }
    }
  },
  scales: {
    y: {
      grid: { color: 'rgba(148, 163, 184, 0.16)' },
      ticks: { color: '#94a3b8' }
    },
    y1: {
      position: 'right' as const,
      grid: { drawOnChartArea: false },
      ticks: { color: '#94a3b8' }
    },
    x: {
      grid: { display: false },
      ticks: { color: '#94a3b8' }
    }
  }
}

const healthChartData = computed(() => {
  const recent = metrics.value.slice(-30)

  return {
    labels: recent.map(item => item.date.slice(5)),
    datasets: [
      {
        label: '步数',
        data: recent.map(item => item.steps),
        borderColor: '#38bdf8',
        backgroundColor: 'rgba(56, 189, 248, 0.12)',
        yAxisID: 'y',
        fill: true,
        tension: 0.38
      },
      {
        label: '体重',
        data: recent.map(item => item.weight),
        borderColor: '#f59e0b',
        backgroundColor: 'rgba(245, 158, 11, 0.1)',
        yAxisID: 'y1',
        fill: true,
        tension: 0.38
      }
    ]
  }
})

const wealthChartData = computed(() => {
  const recent = metrics.value.slice(-30)

  return {
    labels: recent.map(item => item.date.slice(5)),
    datasets: [
      {
        label: '净资产',
        data: recent.map(item => item.netWorth),
        borderColor: '#a78bfa',
        backgroundColor: 'rgba(167, 139, 250, 0.14)',
        fill: true,
        tension: 0.38
      }
    ]
  }
})

const healthChartOption = computed(() => ({
  textStyle: { color: '#cbd5e1' },
  tooltip: { trigger: 'axis' },
  legend: { top: 0, textStyle: { color: '#cbd5e1' } },
  grid: { left: 12, right: 12, top: 48, bottom: 16, containLabel: true },
  xAxis: {
    type: 'category',
    boundaryGap: false,
    data: healthChartData.value.labels,
    axisLine: { show: false },
    axisTick: { show: false },
    splitLine: { show: false },
    axisLabel: { color: '#94a3b8' }
  },
  yAxis: [
    {
      type: 'value',
      splitLine: { lineStyle: { color: 'rgba(148, 163, 184, 0.16)' } },
      axisLabel: { color: '#94a3b8' }
    },
    {
      type: 'value',
      position: 'right',
      splitLine: { show: false },
      axisLabel: { color: '#94a3b8' }
    }
  ],
  series: [
    {
      name: '姝ユ暟',
      type: 'line',
      smooth: true,
      symbol: 'none',
      yAxisIndex: 0,
      lineStyle: { color: '#38bdf8', width: 3 },
      areaStyle: { color: 'rgba(56, 189, 248, 0.12)' },
      data: healthChartData.value.datasets[0]?.data || []
    },
    {
      name: '浣撻噸',
      type: 'line',
      smooth: true,
      symbol: 'none',
      yAxisIndex: 1,
      lineStyle: { color: '#f59e0b', width: 3 },
      areaStyle: { color: 'rgba(245, 158, 11, 0.1)' },
      data: healthChartData.value.datasets[1]?.data || []
    }
  ]
}))

const wealthChartOption = computed(() => ({
  textStyle: { color: '#cbd5e1' },
  tooltip: { trigger: 'axis' },
  legend: { top: 0, textStyle: { color: '#cbd5e1' } },
  grid: { left: 12, right: 12, top: 48, bottom: 16, containLabel: true },
  xAxis: {
    type: 'category',
    boundaryGap: false,
    data: wealthChartData.value.labels,
    axisLine: { show: false },
    axisTick: { show: false },
    splitLine: { show: false },
    axisLabel: { color: '#94a3b8' }
  },
  yAxis: {
    type: 'value',
    splitLine: { lineStyle: { color: 'rgba(148, 163, 184, 0.16)' } },
    axisLabel: { color: '#94a3b8' }
  },
  series: [
    {
      name: '鍑€璧勪骇',
      type: 'line',
      smooth: true,
      symbol: 'none',
      lineStyle: { color: '#a78bfa', width: 3 },
      areaStyle: { color: 'rgba(167, 139, 250, 0.14)' },
      data: wealthChartData.value.datasets[0]?.data || []
    }
  ]
}))

onMounted(async () => {
  try {
    const res = await api.get<MetricRecord[]>('/Metrics')

    metrics.value = [...res]
      .map(item => ({
        ...item,
        date: item.date?.split('T')[0] || ''
      }))
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())

    if (metrics.value.length > 0) {
      latest.value = metrics.value[metrics.value.length - 1]
    }
  } catch (error) {
    console.error(error)
  }
})
</script>
