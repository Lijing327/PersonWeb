<template>
  <div class="space-y-4">
    <div class="flex flex-wrap items-center justify-between gap-3">
      <div class="grid grid-cols-2 gap-3 sm:grid-cols-4 flex-1">
        <div class="admin-content-stat">
          <span class="admin-content-stat-label">总数</span>
          <strong>{{ stats.total }}</strong>
        </div>
        <div class="admin-content-stat">
          <span class="admin-content-stat-label">已发布</span>
          <strong>{{ stats.published }}</strong>
        </div>
        <div class="admin-content-stat">
          <span class="admin-content-stat-label">草稿</span>
          <strong>{{ stats.draft }}</strong>
        </div>
        <div class="admin-content-stat">
          <span class="admin-content-stat-label">已归档</span>
          <strong>{{ stats.archived }}</strong>
        </div>
      </div>
      <button class="btn-primary" @click="openModal()">
        <i class="fas fa-plus mr-2"></i>
        新增工具
      </button>
    </div>

    <div class="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
      <div
        v-for="tool in tools"
        :key="tool.id"
        class="card p-4 flex flex-col"
      >
        <div class="flex items-start justify-between mb-3">
          <div class="flex items-center gap-3 min-w-0">
            <div class="w-9 h-9 rounded-lg bg-gray-100 dark:bg-gray-700 flex items-center justify-center text-xl shrink-0">
              {{ tool.icon || '🛠️' }}
            </div>
            <div class="min-w-0">
              <h3 class="font-semibold text-gray-800 dark:text-white truncate">{{ tool.name }}</h3>
              <span class="text-xs px-2 py-0.5 rounded" :class="statusTagClass(tool.status)">
                {{ statusLabelMap[tool.status] || tool.status }}
              </span>
            </div>
          </div>
          <div class="flex gap-2 shrink-0">
            <NuxtLink
              v-if="tool.id"
              :to="`/admin/toolbox/${tool.id}/analytics`"
              class="text-gray-400 hover:text-purple-600"
              title="使用统计"
            >
              <i class="fas fa-chart-bar"></i>
            </NuxtLink>
            <button class="text-gray-400 hover:text-blue-600" @click="openModal(tool)">
              <i class="fas fa-edit"></i>
            </button>
            <button class="text-gray-400 hover:text-red-600" @click="handleDelete(tool)">
              <i class="fas fa-trash"></i>
            </button>
          </div>
        </div>
        <p class="text-sm text-gray-600 dark:text-gray-400 mb-3 line-clamp-2 flex-1">
          {{ tool.description || '暂无描述' }}
        </p>
        <div class="text-xs text-gray-500 flex items-center justify-between">
          <span>{{ tool.isFree ? '免费' : `¥${Number(tool.price || 0).toFixed(2)}` }}</span>
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
      <div v-if="!loading && tools.length === 0" class="col-span-full text-center py-10 empty-state card border-dashed">
        暂无工具
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
            <input v-model="form.name" type="text" class="form-input" required>
          </div>
          <div class="grid grid-cols-2 gap-4">
            <div class="form-group">
              <label class="form-label">Slug *</label>
              <input v-model="form.slug" type="text" class="form-input" required>
            </div>
            <div class="form-group">
              <label class="form-label">图标</label>
              <input v-model="form.icon" type="text" class="form-input" placeholder="🛠️">
            </div>
          </div>
          <div class="form-group">
            <label class="form-label">描述</label>
            <textarea v-model="form.description" class="form-textarea h-24"></textarea>
          </div>
          <div class="form-group">
            <label class="form-label">演示链接</label>
            <input v-model="form.demoUrl" type="text" class="form-input">
          </div>
          <div class="grid grid-cols-2 gap-4">
            <div class="form-group">
              <label class="form-label">售价</label>
              <input v-model.number="form.price" type="number" step="0.01" class="form-input">
            </div>
            <div class="form-group">
              <label class="form-label">状态</label>
              <select v-model="form.status" class="form-input">
                <option value="draft">草稿</option>
                <option value="published">已发布</option>
                <option value="archived">已归档</option>
              </select>
            </div>
          </div>
          <label class="flex items-center gap-2">
            <input v-model="form.isFree" type="checkbox" class="form-checkbox">
            <span>免费工具</span>
          </label>
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
import { computed, ref } from 'vue'
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
  isFree: boolean
  isPremium: boolean
  status: string
}

const statusLabelMap: Record<string, string> = {
  published: '已发布',
  draft: '草稿',
  archived: '已归档',
}

const api = useApi()
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
  isFree: false,
  isPremium: false,
  status: 'draft',
})

const { data: toolsData, pending: toolsPending, refresh: refreshTools } = await useAsyncData(
  'admin-tools-list',
  async () => {
    try {
      const res = await api.get('/Toolbox/admin/list?pageSize=1000', { silent: true })
      if (res?.tools) return res.tools as Tool[]
      if (res?.data?.tools) return res.data.tools as Tool[]
      if (Array.isArray(res)) return res as Tool[]
      return [] as Tool[]
    } catch {
      return [] as Tool[]
    }
  },
  { server: false, default: () => [] as Tool[] },
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

const statusTagClass = (status: string) => ({
  'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300': status === 'published',
  'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300': status === 'draft',
  'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300': status === 'archived',
})

const resetForm = () => {
  form.value = {
    name: '',
    slug: '',
    icon: '',
    description: '',
    demoUrl: '',
    price: 0,
    isFree: false,
    isPremium: false,
    status: 'draft',
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
      isFree: item.isFree,
      isPremium: item.isPremium,
      status: item.status,
    }
  } else {
    isEdit.value = false
    editingToolId.value = null
    resetForm()
  }
  showModal.value = true
}

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
    await refreshTools()
  } catch (error) {
    handleError(error, '保存工具失败')
  }
}

const handleDelete = async (item: Tool) => {
  if (!confirm(`确定要删除工具「${item.name}」吗？`)) return
  const { success } = useNotification()
  const { handleError } = useErrorHandler()
  try {
    await api.del(`/Toolbox/${item.id}`)
    success('删除成功')
    await refreshTools()
  } catch (error) {
    handleError(error, '删除工具失败')
  }
}

defineExpose({ stats, tools, refresh: refreshTools })
</script>

<style scoped>
.admin-content-stat {
  display: flex;
  flex-direction: column;
  gap: 0.15rem;
  padding: 0.65rem 0.85rem;
  border-radius: var(--radius-md);
  background: var(--color-bg-card);
  border: 1px solid var(--color-border-subtle);
}

.admin-content-stat-label {
  font-size: var(--font-size-xs);
  color: var(--color-text-muted);
}

.admin-content-stat strong {
  font-size: 1.25rem;
  color: var(--color-text-main);
}
</style>
