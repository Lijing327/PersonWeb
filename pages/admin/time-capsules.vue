<template>
  <div class="time-capsules-page">
    <div class="page-header">
      <h1 class="page-title">时间胶囊管理</h1>
    </div>

    <!-- 统计信息 -->
    <n-grid :cols="3" :x-gap="16" class="stats-grid">
      <n-gi>
        <n-statistic label="待审核" :value="stats.pending">
          <template #prefix>
            <i class="fas fa-clock stat-icon-pending"></i>
          </template>
        </n-statistic>
      </n-gi>
      <n-gi>
        <n-statistic label="已展示" :value="stats.approved">
          <template #prefix>
            <i class="fas fa-check-circle stat-icon-approved"></i>
          </template>
        </n-statistic>
      </n-gi>
      <n-gi>
        <n-statistic label="已拒绝" :value="stats.rejected">
          <template #prefix>
            <i class="fas fa-times-circle stat-icon-rejected"></i>
          </template>
        </n-statistic>
      </n-gi>
    </n-grid>

    <!-- 筛选 -->
    <div class="filter-bar">
      <ClientOnly>
        <n-select
          v-model:value="statusFilter"
          placeholder="全部状态"
          :options="statusOptions"
          clearable
          @update:value="fetchCapsules"
          style="width: 200px"
        />
        <template #fallback>
          <select class="filter-select-fallback" @change="(e: any) => { statusFilter = e.target.value; fetchCapsules(); }">
            <option value="">全部状态</option>
            <option value="pending">待审核</option>
            <option value="approved">已展示</option>
            <option value="rejected">已拒绝</option>
          </select>
        </template>
      </ClientOnly>
    </div>

    <!-- 胶囊列表 -->
    <div class="table-container">
      <div v-if="loading" class="table-loading">
        加载中...
      </div>
      <div v-else-if="capsules.length === 0" class="table-empty">
        暂无时间胶囊
      </div>
      <table v-else class="data-table">
        <thead class="table-header">
          <tr>
            <th>内容</th>
            <th>访客</th>
            <th>提交时间</th>
            <th>状态</th>
            <th>操作</th>
          </tr>
        </thead>
        <tbody class="table-body">
          <tr v-for="capsule in capsules" :key="capsule.id" class="table-row">
            <td class="table-cell table-cell-content">
              <div class="content-text" :title="capsule.content">{{ capsule.content }}</div>
            </td>
            <td class="table-cell">{{ capsule.visitorName || '匿名' }}</td>
            <td class="table-cell">{{ formatDate(capsule.createdAt) }}</td>
            <td class="table-cell">
              <span 
                class="tag"
                :class="{
                  'tag-warning': capsule.status === 0,
                  'tag-success': capsule.status === 1,
                  'tag-error': capsule.status === 2
                }"
              >
                {{ getStatusText(capsule.status) }}
              </span>
            </td>
            <td class="table-cell">
              <div class="action-buttons">
                <template v-if="capsule.status === 0">
                  <button 
                    @click="approveCapsule(capsule.id)" 
                    class="btn-link btn-link-green"
                  >
                    通过
                  </button>
                  <button 
                    @click="rejectCapsule(capsule.id)" 
                    class="btn-link btn-link-red"
                  >
                    拒绝
                  </button>
                </template>
                <button 
                  @click="deleteCapsule(capsule.id)" 
                  class="btn-link btn-link-red"
                >
                  <i class="fas fa-trash"></i>
                </button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup lang="ts">
import { NSelect, NGrid, NGi, NStatistic } from 'naive-ui'
import type { TimeCapsule, TimeCapsuleListResponse } from '~/types/api'
import { useSafeMessage } from '~/composables/useNaiveUI'
import { useErrorHandler } from '~/composables/useErrorHandler'

definePageMeta({
  layout: 'admin',
  middleware: 'admin-auth',
  // 排除静态预渲染（admin 页面需要认证）
})

const api = useApi()
const { handleError } = useErrorHandler()

const message = useSafeMessage()

const capsules = ref<TimeCapsule[]>([])
const loading = ref(false)
const statusFilter = ref<string | null>(null)
const stats = ref({
  pending: 0,
  approved: 0,
  rejected: 0
})

// 状态选项
const statusOptions = [
  { label: '全部状态', value: null },
  { label: '待审核', value: '0' },
  { label: '已展示', value: '1' },
  { label: '已拒绝', value: '2' }
]

const fetchCapsules = async () => {
  loading.value = true
  try {
   
    let endpoint = '/TimeCapsule/all' // 默认获取全部
    let params: Record<string, unknown> = {
      page: 1,
      pageSize: 100
    }
    
    if (statusFilter.value === '1') {
      // 已展示的 - 使用公开 API
      endpoint = '/TimeCapsule'
    } else if (statusFilter.value === '2') {
      // 已拒绝的 - 使用全部列表 API，筛选状态为 2
      endpoint = '/TimeCapsule/all'
      params.status = 2
    } else if (statusFilter.value === '0') {
      // 待审核的
      endpoint = '/TimeCapsule/pending'
    } else if (statusFilter.value === null || statusFilter.value === '') {

      endpoint = '/TimeCapsule/all'
    }
    
    const res = await api.get<TimeCapsuleListResponse>(endpoint, { params })

   
    if (res) {
      if (res.List) {
        capsules.value = res.List
      } else if ((res as any).list) {
        capsules.value = (res as any).list
      } else if (Array.isArray(res)) {
        capsules.value = res
      } else {
        capsules.value = []
      }
    } else {
      capsules.value = []
    }

    // 更新统计（从服务器获取准确的统计数据� 
       await fetchStats()
  } catch (e) {
    // 静默失败
    if (process.env.NODE_ENV === 'development') {
      console.error('Failed to fetch capsules:', e)
    }
    capsules.value = []
    message.error('加载时间胶囊列表失败')
  } finally {
    loading.value = false
  }
}

const fetchStats = async () => {
  try {
    const res = await api.get<{
      Pending: number
      Approved: number
      Rejected: number
      Total: number
    }>('/TimeCapsule/stats')
    
    if (res) {
      stats.value = {
        pending: res.Pending,
        approved: res.Approved,
        rejected: res.Rejected
      }
    }
  } catch (e) {
       if (process.env.NODE_ENV === 'development') {
      console.error('Failed to fetch stats:', e)
    }
    updateStats()
  }
}

const updateStats = () => {
  // 降级方案：基于当前加载的数据计算统计
  stats.value = {
    pending: capsules.value.filter(c => c.status === 0).length,
    approved: capsules.value.filter(c => c.status === 1).length,
    rejected: capsules.value.filter(c => c.status === 2).length
  }
}

const approveCapsule = async (id: number) => {
  
  if (!confirm('确定要通过这个时间胶囊吗？')) return
  
  try {
    await api.post(`/TimeCapsule/${id}/approve`)
    message.success('已通过审核')
    await fetchCapsules()  } catch (e: unknown) {
    handleError(e, '操作失败')
  }
}

const rejectCapsule = async (id: number) => {

  if (!confirm('确定要拒绝这个时间胶囊吗?')) return
  
  try {
    await api.post(`/TimeCapsule/${id}/reject`)
    message.success('已拒绝')
    await fetchCapsules()   } catch (e: unknown) {
    handleError(e, '操作失败')
  }
}

const deleteCapsule = async (id: number) => {
  if (!confirm('确定要删除这个时间胶囊吗?')) return
  
  try {
    await api.del(`/TimeCapsule/${id}`)
    message.success('删除成功')
    await fetchCapsules() // 刷新列表和统计
      } catch (e: any) {
    handleError(e, '删除失败')
  }
}

const getStatusText = (status: number) => {
  const statusMap: Record<number, string> = {
    0: '待审核',
    1: '已展示',
    2: '已拒绝'
  }
  return statusMap[status] || '未知'
}


const formatDate = (dateStr: string) => {
  if (!dateStr) return '-'
  return new Date(dateStr).toLocaleString('zh-CN')
}

onMounted(() => {
  fetchCapsules()
})
</script>

<style scoped>
/* 页面容器 */
.time-capsules-page {
  width: 100%;
}

/* 统计网格 */
.stats-grid {
  margin-bottom: 1.5rem;
}

/* 筛选栏 */
.filter-bar {
  margin-bottom: 1.5rem;
}

/* 表格容器 - 使用 CSS 变量 */
.table-container {
  background: var(--color-bg-elevated);
  backdrop-filter: blur(10px);
  border: 1px solid var(--color-border-subtle);
  border-radius: 0.5rem;
  overflow: hidden;
  margin-bottom: 1.5rem;
}

.table-loading,
.table-empty {
  padding: 2rem;
  text-align: center;
  color: var(--color-text-muted);
}

/* 数据表格 */
.data-table {
  width: 100%;
  text-align: left;
  border-collapse: collapse;
}

.table-header {
  background: var(--color-bg-elevated);
  border-bottom: 1px solid var(--color-border-subtle, rgba(255, 255, 255, 0.1));
}

.table-header th {
  padding: 0.75rem 1.5rem;
  font-size: 0.875rem;
  font-weight: 500;
  color: var(--color-text-muted);
}

.table-body {
  border-collapse: collapse;
}

.table-row {
  border-bottom: 1px solid var(--color-border-subtle, rgba(255, 255, 255, 0.1));
  transition: background-color 0.2s ease;
}

.table-row:hover {
  background: var(--color-bg-elevated);
}

.table-row:last-child {
  border-bottom: none;
}

.table-cell {
  padding: 1rem 1.5rem;
  color: var(--color-text-main);
}

.table-cell-content {
  max-width: 24rem;
}

.content-text {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* 标签样式 - 提高文字对比�?*/
.tag {
  display: inline-block;
  padding: 0.25rem 0.5rem;
  border-radius: 0.25rem;
  font-size: 0.75rem;
  font-weight: 500;
}

.tag-warning {
  background: var(--color-warning-soft);
  border: 1px solid var(--color-warning);
  color: var(--color-warning-hover, var(--color-amber-200));
}

.tag-success {
  background: var(--color-success-soft);
  border: 1px solid var(--color-success);
  color: var(--color-success-hover);
}

.tag-error {
  background: var(--color-error-soft);
  border: 1px solid var(--color-error);
  color: var(--color-error-hover);
}

/* 操作按钮 */
.action-buttons {
  display: flex;
  gap: 0.5rem;
  align-items: center;
}

.btn-link {
  background: none;
  border: none;
  cursor: pointer;
  text-decoration: none;
  transition: color 0.2s ease;
  font-size: 0.875rem;
}

.btn-link-blue {
  color: var(--color-primary);
}

.btn-link-blue:hover {
  color: var(--color-primary-hover);
}

.filter-select-fallback {
  width: 200px;
  padding: 0.5rem;
  background: var(--color-bg-elevated);
  border: 1px solid var(--color-border-subtle);
  border-radius: 0.25rem;
  color: var(--color-text-main);
  font-size: 0.875rem;
}

.filter-select-fallback:focus {
  outline: none;
  border-color: var(--color-primary);
}

/* 统计图标颜色 - 使用 CSS 变量 */
.stat-icon-pending {
  color: var(--color-warning);
}

.stat-icon-approved {
  color: var(--color-success);
}

.stat-icon-rejected {
  color: var(--color-error);
}

.btn-link-green {
  color: var(--color-success);
}

.btn-link-green:hover {
  color: var(--color-success-hover);
}

.btn-link-red {
  color: var(--color-error);
}

.btn-link-red:hover {
  color: var(--color-error-hover);
}
</style>

