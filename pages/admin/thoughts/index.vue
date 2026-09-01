<template>
  <ClientOnly>
    <div class="thoughts-admin-page">
      <div class="page-header">
        <h1 class="page-title">思维记录</h1>
        <n-button type="primary" @click="handleNew">
          <template #icon>
            <i class="fas fa-plus"></i>
          </template>
          新建记录
        </n-button>
      </div>

      <!-- 筛选栏 -->
      <div class="filter-bar">
        <n-input
          v-model:value="keyword"
          placeholder="搜索原文内容..."
          clearable
          @keyup.enter="fetchList"
          style="flex: 1"
        >
          <template #prefix>
            <i class="fas fa-search"></i>
          </template>
        </n-input>
        <n-button type="primary" @click="fetchList">搜索</n-button>
      </div>

      <!-- 数据表格 -->
      <div class="table-container">
        <n-data-table
          v-if="!loading && list.length > 0"
          :columns="columns"
          :data="list"
          :pagination="pagination"
          @update:page="handlePageChange"
          @update:page-size="handlePageSizeChange"
        />
        <div v-else-if="loading" class="table-loading">
          <n-spin size="large" />
          <p>加载中...</p>
        </div>
        <div v-else class="table-empty">
          <n-empty description="暂无思维记录，点击「新建记录」开始" />
        </div>
      </div>
    </div>
  </ClientOnly>
</template>

<script setup lang="ts">
import { ref, h, onMounted } from 'vue'
import { NButton, NTag, NDataTable, NInput, NEmpty, NSpin, type DataTableColumns } from 'naive-ui'
import { useRouter } from 'vue-router'
import { useApi } from '~/composables/useApi'
import { useNotification } from '~/composables/useToast'
import { useErrorHandler } from '~/composables/useErrorHandler'

definePageMeta({
  layout: 'admin',
  middleware: 'admin-auth'
})

const router = useRouter()
const api = useApi()
const { success, error } = useNotification()
const { handleError } = useErrorHandler()

const loading = ref(false)
const list = ref<any[]>([])
const keyword = ref('')

const pagination = ref({
  page: 1,
  pageSize: 20,
  itemCount: 0,
  showSizePicker: true,
  pageSizes: [10, 20, 50],
  onChange: (page: number) => {
    pagination.value.page = page
    fetchList()
  },
  onUpdatePageSize: (pageSize: number) => {
    pagination.value.pageSize = pageSize
    pagination.value.page = 1
    fetchList()
  }
})

const formatDate = (dateString: string | Date) => {
  if (!dateString) return '-'
  const date = typeof dateString === 'string' ? new Date(dateString) : dateString
  return date.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  })
}

const columns: DataTableColumns<any> = [
  {
    title: '创建时间',
    key: 'createdAt',
    width: 180,
    render: (row) => formatDate(row.createdAt)
  },
  {
    title: '摘要',
    key: 'summary',
    ellipsis: { tooltip: true }
  },
  {
    title: '状态',
    key: 'status',
    width: 100,
    render: (row) => {
      const type = row.status === 1 ? 'success' : 'default'
      const text = row.status === 1 ? '已批准' : '未批准'
      return h(NTag, { type }, { default: () => text })
    }
  },
  {
    title: '操作',
    key: 'actions',
    width: 120,
    render: (row) => {
      return h(
        NButton,
        {
          size: 'small',
          type: 'primary',
          onClick: () => router.push(`/admin/thoughts/${row.id}`)
        },
        { default: () => '进入详情' }
      )
    }
  }
]

const fetchList = async () => {
  loading.value = true
  try {
    const res = await api.get<{ Total: number; List: any[] }>('/thoughts', {
      params: {
        page: pagination.value.page,
        pageSize: pagination.value.pageSize,
        keyword: keyword.value || undefined
      }
    })
    const data = res as any
    const total = data?.Total ?? data?.total ?? 0
    const rawList = data?.List ?? data?.list ?? []
    list.value = rawList.map((item: any) => ({
      id: item.Id ?? item.id,
      summary: item.summary ?? item.Summary ?? '',
      status: item.status ?? item.Status ?? 0,
      createdAt: item.createdAt ?? item.CreatedAt ?? ''
    }))
    pagination.value.itemCount = total
  } catch (e) {
    handleError(e, '获取列表失败')
    list.value = []
    pagination.value.itemCount = 0
  } finally {
    loading.value = false
  }
}

const handlePageChange = (page: number) => {
  pagination.value.page = page
  fetchList()
}

const handlePageSizeChange = (pageSize: number) => {
  pagination.value.pageSize = pageSize
  pagination.value.page = 1
  fetchList()
}

const handleNew = async () => {
  try {
    const created = await api.post<{ Id?: number; id?: number }>('/thoughts', { content: '（在此写下你的思考）' })
    const id = (created as any)?.Id ?? (created as any)?.id
    if (id) {
      success('已创建，正在跳转详情')
      router.push(`/admin/thoughts/${id}`)
    } else {
      error('创建成功但未返回 ID')
    }
  } catch (e) {
    handleError(e, '创建失败')
  }
}

onMounted(() => {
  fetchList()
})
</script>

<style scoped>
.thoughts-admin-page {
  padding: 1rem;
}
.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}
.page-title {
  font-size: 1.25rem;
  font-weight: 600;
  margin: 0;
}
.filter-bar {
  display: flex;
  gap: 0.5rem;
  margin-bottom: 1rem;
}
.table-container {
  min-height: 200px;
}
.table-loading,
.table-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 2rem;
  gap: 0.5rem;
}
</style>
