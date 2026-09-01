<template>
  <div class="space-y-6">
    <div class="page-header">
      <h1 class="page-title">工具运营</h1>
      <button class="btn-primary" @click="openModal()">
        <i class="fas fa-plus mr-2"></i>
        新增工具
      </button>
    </div>

    <div class="grid grid-cols-1 gap-4 mb-6 md:grid-cols-4">
      <div class="card p-4">
        <div class="text-sm text-gray-500 dark:text-gray-400 mb-1">工具总数</div>
        <div class="text-2xl font-bold text-gray-800 dark:text-white">{{ stats.total }}</div>
      </div>
      <div class="card p-4">
        <div class="text-sm text-gray-500 dark:text-gray-400 mb-1">已发布</div>
        <div class="text-2xl font-bold text-green-600 dark:text-green-400">{{ stats.published }}</div>
      </div>
      <div class="card p-4">
        <div class="text-sm text-gray-500 dark:text-gray-400 mb-1">草稿</div>
        <div class="text-2xl font-bold text-yellow-600 dark:text-yellow-400">{{ stats.draft }}</div>
      </div>
      <div class="card p-4">
        <div class="text-sm text-gray-500 dark:text-gray-400 mb-1">已归档</div>
        <div class="text-2xl font-bold text-gray-600 dark:text-gray-400">{{ stats.archived }}</div>
      </div>
    </div>

    <div class="grid grid-cols-1 gap-6 mb-6 md:grid-cols-2">
      <div class="card p-6">
        <h3 class="text-lg font-bold text-gray-800 dark:text-white mb-4">状态分布</h3>
        <ClientOnly>
          <div
            v-if="statusChartOption && chartsReady && chartComponent"
            class="h-64"
          >
            <component
              :is="chartComponent"
              :option="statusChartOption"
              autoresize
              class="w-full h-full"
            />
          </div>
          <div
            v-else
            class="h-64 flex items-center justify-center text-gray-500 dark:text-gray-400"
          >
            图表加载中...
          </div>
        </ClientOnly>
      </div>

      <div class="card p-6">
        <h3 class="text-lg font-bold text-gray-800 dark:text-white mb-4">价格分布</h3>
        <ClientOnly>
          <div
            v-if="priceChartOption && chartsReady && chartComponent"
            class="h-64"
          >
            <component
              :is="chartComponent"
              :option="priceChartOption"
              autoresize
              class="w-full h-full"
            />
          </div>
          <div
            v-else
            class="h-64 flex items-center justify-center text-gray-500 dark:text-gray-400"
          >
            图表加载中...
          </div>
        </ClientOnly>
      </div>
    </div>

    <div class="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
      <div
        v-for="tool in tools"
        :key="tool.id"
        class="card p-6 flex flex-col"
      >
        <div class="flex items-start justify-between mb-4">
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-lg bg-gray-100 dark:bg-gray-700 flex items-center justify-center text-2xl">
              {{ tool.icon || '🛠️' }}
            </div>
            <div>
              <h3 class="font-bold text-gray-800 dark:text-white">{{ tool.name }}</h3>
              <div class="flex items-center gap-2 mt-1">
                <span class="text-xs px-2 py-1 rounded" :class="statusTagClass(tool.status)">
                  {{ statusLabelMap[tool.status] || tool.status }}
                </span>
                <span
                  v-if="tool.category"
                  class="text-xs text-gray-500 dark:text-gray-400"
                >
                  {{ tool.category.name }}
                </span>
              </div>
            </div>
          </div>

          <div class="flex gap-2">
            <NuxtLink
              v-if="tool.id"
              :to="`/admin/toolbox/${tool.id}/analytics`"
              class="text-gray-400 hover:text-purple-600 dark:hover:text-purple-400 transition-colors"
              title="使用统计"
            >
              <span class="sr-only">统计</span>
              <i class="fas fa-chart-bar"></i>
            </NuxtLink>
            <button
              class="text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
              @click="openModal(tool)"
            >
              <span class="sr-only">编辑</span>
              <i class="fas fa-edit"></i>
            </button>
            <button
              class="text-gray-400 hover:text-red-600 dark:hover:text-red-400 transition-colors"
              @click="handleDelete(tool)"
            >
              <span class="sr-only">删除</span>
              <i class="fas fa-trash"></i>
            </button>
          </div>
        </div>

        <p class="text-gray-600 dark:text-gray-400 text-sm mb-4 flex-1">
          {{ tool.description || '暂无工具描述' }}
        </p>

        <div class="flex items-center justify-between text-xs text-gray-500 dark:text-gray-500">
          <span>价格: {{ tool.isFree ? '免费' : `¥${Number(tool.price || 0).toFixed(2)}` }}</span>
          <a
            v-if="tool.demoUrl"
            :href="tool.demoUrl"
            target="_blank"
            rel="noopener noreferrer"
            class="btn-link btn-link--blue"
          >
            演示
          </a>
        </div>
      </div>

      <div
        v-if="!loading && tools.length === 0"
        class="col-span-full text-center py-12 empty-state card border-dashed"
      >
        暂无工具数据
      </div>
    </div>

    <div v-if="showModal" class="modal-overlay">
      <div class="modal-content max-w-lg max-h-[90vh] overflow-y-auto">
        <div class="modal-header">
          <h3 class="modal-title">{{ isEdit ? '编辑工具' : '新增工具' }}</h3>
        </div>

        <div class="modal-body space-y-4">
          <div class="form-group">
            <label class="form-label">工具名称 *</label>
            <input
              v-model="form.name"
              type="text"
              class="form-input"
              placeholder="例如：JSON 格式化工具"
              required
            >
          </div>

          <div class="grid grid-cols-2 gap-4">
            <div class="form-group">
              <label class="form-label">工具标识 (Slug) *</label>
              <input
                v-model="form.slug"
                type="text"
                class="form-input"
                placeholder="json-formatter"
                required
              >
            </div>
            <div class="form-group">
              <label class="form-label">图标 (Emoji)</label>
              <input
                v-model="form.icon"
                type="text"
                class="form-input"
                placeholder="🛠️"
              >
            </div>
          </div>

          <div class="form-group">
            <label class="form-label">描述</label>
            <textarea
              v-model="form.description"
              class="form-textarea h-24"
              placeholder="输入工具简介、适用场景和核心能力..."
            ></textarea>
          </div>

          <div class="form-group">
            <label class="form-label">演示链接</label>
            <input
              v-model="form.demoUrl"
              type="text"
              class="form-input"
              placeholder="https://..."
            >
          </div>

          <div class="grid grid-cols-2 gap-4">
            <div class="form-group">
              <label class="form-label">售价</label>
              <input
                v-model.number="form.price"
                type="number"
                step="0.01"
                class="form-input"
                placeholder="0.00"
              >
            </div>
            <div class="form-group">
              <label class="form-label">原价</label>
              <input
                v-model.number="form.originalPrice"
                type="number"
                step="0.01"
                class="form-input"
                placeholder="0.00"
              >
            </div>
          </div>

          <div class="grid grid-cols-2 gap-4">
            <div class="form-group">
              <label class="form-label">状态</label>
              <select v-model="form.status" class="form-input">
                <option value="draft">草稿</option>
                <option value="published">已发布</option>
                <option value="archived">已归档</option>
              </select>
            </div>

            <div class="form-group">
              <label class="flex items-center gap-2">
                <input v-model="form.isFree" type="checkbox" class="form-checkbox">
                <span>免费工具</span>
              </label>
              <label class="flex items-center gap-2 mt-2">
                <input v-model="form.isPremium" type="checkbox" class="form-checkbox">
                <span>精品工具</span>
              </label>
            </div>
          </div>
        </div>

        <div class="modal-footer">
          <button class="btn-secondary" @click="showModal = false">取消</button>
          <button class="btn-primary" @click="handleSave">保存</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, shallowRef } from 'vue'
import type { Component } from 'vue'
import { useErrorHandler } from '~/composables/useErrorHandler'
import { useNotification } from '~/composables/useToast'

interface Tool {
  id: number
  name: string
  slug: string
  icon?: string
  description?: string
  demoUrl?: string
  price: number
  originalPrice?: number
  isFree: boolean
  isPremium: boolean
  status: string
  category?: {
    id: number
    name: string
    slug: string
  }
}

type EChartOption = Record<string, any>

const statusLabelMap: Record<string, string> = {
  published: '已发布',
  draft: '草稿',
  archived: '已归档'
}

definePageMeta({
  layout: 'admin',
  middleware: 'admin-auth'
})

const api = useApi()
const chartComponent = shallowRef<Component | null>(null)
const chartsReady = ref(false)
const showModal = ref(false)
const isEdit = ref(false)
const editingToolId = ref<number | null>(null)

const form = ref({
  name: '',
  slug: '',
  icon: '',
  description: '',
  demoUrl: '',
  price: 0,
  originalPrice: null as number | null,
  isFree: false,
  isPremium: false,
  status: 'draft'
})

const { data: toolsData, pending: toolsPending, refresh: refreshTools } = useAsyncData(
  'admin-tools-list',
  async () => {
    try {
      const res = await api.get('/Toolbox/admin/list?pageSize=1000', { silent: true })
      if (res?.tools) return res.tools as Tool[]
      if (res?.data?.tools) return res.data.tools as Tool[]
      if (Array.isArray(res)) return res as Tool[]
      return [] as Tool[]
    } catch (error) {
      if (process.dev) {
        console.error('Failed to fetch tools:', error)
      }
      return [] as Tool[]
    }
  },
  {
    server: false,
    default: () => [] as Tool[]
  }
)

const tools = computed(() => toolsData.value || [])
const loading = computed(() => toolsPending.value)

const stats = computed(() => {
  const total = tools.value.length
  const published = tools.value.filter(tool => tool.status === 'published').length
  const draft = tools.value.filter(tool => tool.status === 'draft').length
  const archived = tools.value.filter(tool => tool.status === 'archived').length
  return { total, published, draft, archived }
})

const getCssVar = (varName: string): string => {
  if (!process.client) return ''
  return getComputedStyle(document.documentElement).getPropertyValue(varName).trim()
}

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
    echartsCharts.PieChart,
    echartsCharts.BarChart,
    echartsComponents.TitleComponent,
    echartsComponents.TooltipComponent,
    echartsComponents.LegendComponent,
    echartsComponents.GridComponent
  ])

  chartComponent.value = vueEchartsModule.default
  chartsReady.value = true
}

const statusChartOption = computed<EChartOption | null>(() => {
  if (!stats.value.total) return null

  const textColor = getCssVar('--color-text-main') || getCssVar('--n-text-color') || '#e5e7eb'
  const bgColor = getCssVar('--color-bg-card') || getCssVar('--n-card-color') || '#111827'

  return {
    tooltip: {
      trigger: 'item',
      formatter: '{b}: {c} ({d}%)'
    },
    legend: {
      orient: 'vertical',
      left: 'left',
      textStyle: { color: textColor }
    },
    series: [
      {
        type: 'pie',
        radius: ['40%', '70%'],
        itemStyle: {
          borderRadius: 8,
          borderColor: bgColor,
          borderWidth: 2
        },
        data: [
          { value: stats.value.published, name: '已发布', itemStyle: { color: getCssVar('--color-success') || '#22c55e' } },
          { value: stats.value.draft, name: '草稿', itemStyle: { color: getCssVar('--color-warning') || '#f59e0b' } },
          { value: stats.value.archived, name: '已归档', itemStyle: { color: getCssVar('--color-text-muted') || '#94a3b8' } }
        ]
      }
    ]
  }
})

const priceChartOption = computed<EChartOption | null>(() => {
  if (!tools.value.length) return null

  const textColor = getCssVar('--color-text-main') || getCssVar('--n-text-color') || '#e5e7eb'
  const gridColor = getCssVar('--color-border-subtle') || getCssVar('--n-border-color') || '#334155'
  const freeCount = tools.value.filter(tool => tool.isFree).length
  const paidTools = tools.value.filter(tool => !tool.isFree && Number(tool.price) > 0)
  const priceRanges = [
    { name: '免费', count: freeCount },
    { name: '0-50元', count: paidTools.filter(tool => Number(tool.price) <= 50).length },
    { name: '50-100元', count: paidTools.filter(tool => Number(tool.price) > 50 && Number(tool.price) <= 100).length },
    { name: '100-200元', count: paidTools.filter(tool => Number(tool.price) > 100 && Number(tool.price) <= 200).length },
    { name: '200元以上', count: paidTools.filter(tool => Number(tool.price) > 200).length }
  ].filter(item => item.count > 0)

  return {
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'shadow' }
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '3%',
      containLabel: true
    },
    xAxis: {
      type: 'category',
      data: priceRanges.map(item => item.name),
      axisLabel: { color: textColor },
      axisLine: { lineStyle: { color: gridColor } }
    },
    yAxis: {
      type: 'value',
      axisLabel: { color: textColor },
      axisLine: { lineStyle: { color: gridColor } },
      splitLine: { lineStyle: { color: gridColor } }
    },
    series: [
      {
        type: 'bar',
        data: priceRanges.map(item => item.count),
        itemStyle: {
          color: {
            type: 'linear',
            x: 0,
            y: 0,
            x2: 0,
            y2: 1,
            colorStops: [
              { offset: 0, color: getCssVar('--color-primary') || '#3b82f6' },
              { offset: 1, color: getCssVar('--color-purple-500') || '#8b5cf6' }
            ]
          },
          borderRadius: [4, 4, 0, 0]
        }
      }
    ]
  }
})

const fetchTools = async () => {
  await refreshTools()
}

const resetForm = () => {
  form.value = {
    name: '',
    slug: '',
    icon: '',
    description: '',
    demoUrl: '',
    price: 0,
    originalPrice: null,
    isFree: false,
    isPremium: false,
    status: 'draft'
  }
}

const openModal = (item?: Tool) => {
  if (item) {
    isEdit.value = true
    editingToolId.value = item.id
    form.value = {
      name: item.name,
      slug: item.slug,
      icon: item.icon || '',
      description: item.description || '',
      demoUrl: item.demoUrl || '',
      price: Number(item.price) || 0,
      originalPrice: item.originalPrice || null,
      isFree: item.isFree,
      isPremium: item.isPremium,
      status: item.status
    }
  } else {
    isEdit.value = false
    editingToolId.value = null
    resetForm()
  }

  showModal.value = true
}

const statusTagClass = (status: string) => ({
  'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300': status === 'published',
  'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300': status === 'draft',
  'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300': status === 'archived'
})

const handleSave = async () => {
  const { warning, success } = useNotification()
  const { handleError } = useErrorHandler()

  if (!form.value.name.trim()) {
    warning('请输入工具名称')
    return
  }

  try {
    if (isEdit.value && editingToolId.value) {
      await api.put(`/Toolbox/${editingToolId.value}`, form.value)
    } else {
      await api.post('/Toolbox', form.value)
    }

    success('保存成功')
    showModal.value = false
    editingToolId.value = null
    await fetchTools()
  } catch (error) {
    handleError(error, '保存工具失败')
  }
}

const handleDelete = async (item: Tool) => {
  if (!confirm(`确定要删除工具“${item.name}”吗？`)) return

  const { success } = useNotification()
  const { handleError } = useErrorHandler()

  try {
    await api.del(`/Toolbox/${item.id}`)
    success('删除成功')
    await fetchTools()
  } catch (error) {
    handleError(error, '删除工具失败')
  }
}

onMounted(() => {
  ensureChartsReady()
})
</script>
