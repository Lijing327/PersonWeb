<template>
  <div class="visitor-interaction-page">
    <div class="page-header">
      <h1 class="page-title">访客互动</h1>
      <p class="page-desc">审核留言、心情、祝福与历史时间胶囊；通过后会在入口首页左侧弹幕展示</p>
    </div>

    <div class="stats-row">
      <div class="stats-card">
        <span class="stats-label">待审核</span>
        <strong class="stats-value stats-pending">{{ stats.pending }}</strong>
      </div>
      <div class="stats-card">
        <span class="stats-label">已通过</span>
        <strong class="stats-value stats-approved">{{ stats.approved }}</strong>
      </div>
      <div class="stats-card">
        <span class="stats-label">已拒绝</span>
        <strong class="stats-value stats-rejected">{{ stats.rejected }}</strong>
      </div>
    </div>

    <div class="toolbar">
      <n-select
        v-model:value="statusFilter"
        placeholder="全部状态"
        clearable
        class="toolbar-select"
        :options="statusOptions"
      />
      <n-select
        v-model:value="typeFilter"
        placeholder="全部类型"
        clearable
        class="toolbar-select"
        :options="typeOptions"
      />
      <n-button quaternary @click="fetchMessages">
        <template #icon><i class="fas fa-sync-alt"></i></template>
        刷新
      </n-button>
    </div>

    <n-data-table
      class="interaction-table"
      :columns="columns"
      :data="messages"
      :loading="loading"
      :bordered="false"
      size="small"
      :scroll-x="900"
      :row-key="rowKey"
      :pagination="pagination"
    />
  </div>
</template>

<script setup lang="ts">
import { computed, h, onMounted, ref, watch } from 'vue'
import { NButton, NDataTable, NSelect, NSpace, NTag } from 'naive-ui'
import type { DataTableColumns } from 'naive-ui'
import type { TimeCapsule } from '~/types/api'
import { useSafeMessage } from '~/composables/useNaiveUI'
import { useErrorHandler } from '~/composables/useErrorHandler'

definePageMeta({
  layout: 'admin',
  middleware: 'admin-auth',
})

type InteractionSource = 'message' | 'capsule'

interface InteractionItem {
  id: number
  source: InteractionSource
  visitorId?: string
  visitorName?: string
  messageType: string
  content: string
  emoji?: string
  status: string
  location?: string
  createdAt: string
}

const api = useApi()
const { handleError } = useErrorHandler()
const message = useSafeMessage()

const allMessages = ref<InteractionItem[]>([])
const loading = ref(false)
const statusFilter = ref<string | null>(null)
const typeFilter = ref<string | null>(null)
const page = ref(1)
const pageSize = ref(20)

const statusOptions = [
  { label: '待审核', value: 'pending' },
  { label: '已通过', value: 'approved' },
  { label: '已拒绝', value: 'rejected' },
]

const typeOptions = [
  { label: '留言', value: 'message' },
  { label: '心情', value: 'mood' },
  { label: '祝福', value: 'blessing' },
  { label: '旧时间胶囊', value: 'capsule' },
]

const mapCapsuleStatus = (status: number): string => {
  if (status === 1) return 'approved'
  if (status === 2) return 'rejected'
  return 'pending'
}

const mapCapsuleToItem = (capsule: TimeCapsule): InteractionItem => ({
  id: capsule.id,
  source: 'capsule',
  visitorId: capsule.visitorId,
  visitorName: capsule.visitorName,
  messageType: 'capsule',
  content: capsule.content,
  status: mapCapsuleStatus(Number(capsule.status)),
  createdAt: capsule.createdAt,
})

const mapMessageToItem = (item: Record<string, unknown>): InteractionItem => ({
  id: Number(item.id),
  source: 'message',
  visitorId: String(item.visitorId ?? ''),
  visitorName: typeof item.visitorName === 'string' ? item.visitorName : undefined,
  messageType: String(item.messageType ?? 'message'),
  content: String(item.content ?? ''),
  emoji: typeof item.emoji === 'string' ? item.emoji : undefined,
  status: String(item.status ?? 'pending'),
  location: typeof item.location === 'string' ? item.location : undefined,
  createdAt: String(item.createdAt ?? new Date().toISOString()),
})

const stats = computed(() => {
  const all = allMessages.value
  return {
    pending: all.filter(m => m.status === 'pending').length,
    approved: all.filter(m => m.status === 'approved').length,
    rejected: all.filter(m => m.status === 'rejected').length,
  }
})

const filteredMessages = computed(() => {
  let result = [...allMessages.value]
  if (statusFilter.value) {
    result = result.filter(m => m.status === statusFilter.value)
  }
  if (typeFilter.value) {
    result = result.filter(m => m.messageType === typeFilter.value)
  }
  return result.sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  )
})

const messages = computed(() => filteredMessages.value)

const pagination = computed(() => ({
  page: page.value,
  pageSize: pageSize.value,
  itemCount: messages.value.length,
  showSizePicker: true,
  pageSizes: [20, 50, 100],
  onChange: (p: number) => { page.value = p },
  onUpdatePageSize: (size: number) => {
    pageSize.value = size
    page.value = 1
  },
}))

watch([statusFilter, typeFilter], () => {
  page.value = 1
})

const unwrapList = <T,>(res: unknown): T[] => {
  if (Array.isArray(res)) return res as T[]
  if (res && typeof res === 'object') {
    const data = (res as { data?: unknown; List?: unknown; list?: unknown }).data
      ?? (res as { List?: unknown }).List
      ?? (res as { list?: unknown }).list
    if (Array.isArray(data)) return data as T[]
  }
  return []
}

const fetchMessages = async () => {
  loading.value = true
  try {
    const [messageRes, capsuleRes] = await Promise.all([
      api.get<unknown>('/VisitorInteraction/messages/all', { silent: true }),
      api.get<unknown>('/TimeCapsule/all', { params: { page: 1, pageSize: 200 }, silent: true }),
    ])
    const messageList = unwrapList<Record<string, unknown>>(messageRes).map(mapMessageToItem)
    const capsuleList = unwrapList<TimeCapsule>(capsuleRes).map(mapCapsuleToItem)
    allMessages.value = [...messageList, ...capsuleList]
  } catch (e) {
    handleError(e, '加载失败')
    allMessages.value = []
  } finally {
    loading.value = false
  }
}

const rowKey = (row: InteractionItem) => `${row.source}-${row.id}`

const approveItem = async (item: InteractionItem) => {
  try {
    if (item.source === 'capsule') {
      await api.post(`/TimeCapsule/${item.id}/approve`)
    } else {
      await api.post(`/VisitorInteraction/message/${item.id}/approve`)
    }
    message.success('已通过')
    await fetchMessages()
  } catch (e) {
    handleError(e, '审核失败')
  }
}

const rejectItem = async (item: InteractionItem) => {
  try {
    if (item.source === 'capsule') {
      await api.post(`/TimeCapsule/${item.id}/reject`)
    } else {
      await api.post(`/VisitorInteraction/message/${item.id}/reject`)
    }
    message.success('已拒绝')
    await fetchMessages()
  } catch (e) {
    handleError(e, '操作失败')
  }
}

const deleteItem = async (item: InteractionItem) => {
  if (!confirm('确定删除这条记录吗？')) return
  try {
    if (item.source === 'capsule') {
      await api.del(`/TimeCapsule/${item.id}`)
    } else {
      message.warning('留言请使用「拒绝」，暂不支持删除')
      return
    }
    message.success('已删除')
    await fetchMessages()
  } catch (e) {
    handleError(e, '删除失败')
  }
}

const displayVisitorName = (item: InteractionItem) => item.visitorName?.trim() || '匿名访客'

const getTypeName = (type: string) => ({
  message: '留言',
  mood: '心情',
  blessing: '祝福',
  capsule: '旧胶囊',
}[type] || type)

const getStatusName = (status: string) => ({
  pending: '待审核',
  approved: '已通过',
  rejected: '已拒绝',
}[status] || status)

const statusTagType = (status: string): 'warning' | 'success' | 'error' | 'default' => {
  if (status === 'pending') return 'warning'
  if (status === 'approved') return 'success'
  if (status === 'rejected') return 'error'
  return 'default'
}

const typeTagType = (type: string): 'info' | 'success' | 'warning' | 'default' => {
  if (type === 'message') return 'info'
  if (type === 'mood') return 'success'
  if (type === 'blessing') return 'warning'
  return 'default'
}

const formatTime = (time: string) => {
  const date = new Date(time)
  if (Number.isNaN(date.getTime())) return '—'
  return date.toLocaleString('zh-CN', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
}

const columns: DataTableColumns<InteractionItem> = [
  {
    title: '类型',
    key: 'messageType',
    width: 88,
    render(row) {
      return h(NTag, { size: 'small', bordered: false, type: typeTagType(row.messageType) }, {
        default: () => getTypeName(row.messageType),
      })
    },
  },
  {
    title: '内容',
    key: 'content',
    minWidth: 280,
    ellipsis: { tooltip: true },
    render(row) {
      return h('span', { class: 'cell-content' }, [
        row.emoji ? h('span', { class: 'cell-emoji' }, row.emoji) : null,
        row.content,
      ])
    },
  },
  {
    title: '访客',
    key: 'visitorName',
    width: 100,
    ellipsis: { tooltip: true },
    render(row) {
      return displayVisitorName(row)
    },
  },
  {
    title: '地点',
    key: 'location',
    width: 88,
    render(row) {
      return row.location || '—'
    },
  },
  {
    title: '时间',
    key: 'createdAt',
    width: 120,
    render(row) {
      return formatTime(row.createdAt)
    },
  },
  {
    title: '状态',
    key: 'status',
    width: 88,
    render(row) {
      return h(NTag, { size: 'small', bordered: false, type: statusTagType(row.status) }, {
        default: () => getStatusName(row.status),
      })
    },
  },
  {
    title: '操作',
    key: 'actions',
    width: 140,
    fixed: 'right',
    render(row) {
      if (row.status === 'pending') {
        return h(NSpace, { size: 4 }, {
          default: () => [
            h(NButton, { size: 'tiny', type: 'success', secondary: true, onClick: () => approveItem(row) }, { default: () => '通过' }),
            h(NButton, { size: 'tiny', type: 'error', secondary: true, onClick: () => rejectItem(row) }, { default: () => '拒绝' }),
          ],
        })
      }
      if (row.source === 'capsule') {
        return h(NButton, { size: 'tiny', type: 'error', quaternary: true, onClick: () => deleteItem(row) }, { default: () => '删除' })
      }
      if (row.status === 'approved') {
        return h(NButton, { size: 'tiny', type: 'warning', quaternary: true, onClick: () => rejectItem(row) }, { default: () => '撤回' })
      }
      return '—'
    },
  },
]

onMounted(fetchMessages)
</script>

<style scoped>
.visitor-interaction-page {
  width: 100%;
}

.page-header {
  margin-bottom: var(--spacing-md);
}

.page-title {
  font-size: var(--font-size-h3, 1.25rem);
  font-weight: 600;
  color: var(--color-text-main);
}

.page-desc {
  margin-top: 0.25rem;
  font-size: var(--font-size-sm);
  color: var(--color-text-muted);
}

.stats-row {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: var(--spacing-sm);
  margin-bottom: var(--spacing-md);
}

.stats-card {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: var(--spacing-sm);
  padding: 0.65rem 0.85rem;
  border-radius: var(--radius-md);
  border: 1px solid var(--color-border-subtle);
  background: var(--color-bg-card);
}

.stats-label {
  font-size: var(--font-size-xs);
  color: var(--color-text-muted);
}

.stats-value {
  font-size: 1.125rem;
  font-weight: 600;
  color: var(--color-text-main);
}

.stats-pending { color: var(--color-warning); }
.stats-approved { color: var(--color-success); }
.stats-rejected { color: var(--color-error); }

.toolbar {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--spacing-sm);
  margin-bottom: var(--spacing-md);
}

.toolbar-select {
  width: 140px;
}

.interaction-table {
  border: 1px solid var(--color-border-subtle);
  border-radius: var(--radius-md);
  overflow: hidden;
}

.interaction-table :deep(.cell-content) {
  display: inline;
}

.interaction-table :deep(.cell-emoji) {
  margin-right: 0.35rem;
}

@media (max-width: 640px) {
  .stats-row {
    grid-template-columns: 1fr;
  }

  .toolbar-select {
    width: 100%;
  }
}
</style>
