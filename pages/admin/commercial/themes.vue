<template>
  <div>
    <!-- 页面头部 -->
    <div class="flex justify-between items-center mb-6">
      <div>
        <h1 class="text-2xl font-bold text-text-main">主题商店管理</h1>
        <p class="text-sm text-text-muted mt-1">管理主题商店中的主题列表</p>
      </div>
      <AppButton variant="primary" @click="showAddModal = true">
        <i class="fas fa-plus mr-2"></i>
        添加主题
      </AppButton>
    </div>

    <!-- 筛选栏 -->
    <AppCard class="mb-6 p-4">
      <div class="flex gap-3 items-center flex-wrap">
        <select 
          v-model="filters.status" 
          class="form-input"
        >
          <option value="">全部状态</option>
          <option value="draft">草稿</option>
          <option value="published">已发布</option>
          <option value="archived">已归档</option>
        </select>
        <input
          v-model="filters.search"
          type="text"
          placeholder="搜索主题名称..."
          class="form-input flex-1 min-w-[200px]"
          @input="loadThemes"
        />
        <AppButton variant="secondary" @click="loadThemes">
          <i class="fas fa-search mr-2"></i>
          搜索
        </AppButton>
      </div>
    </AppCard>

    <!-- 主题列表 -->
    <AppCard class="mb-6 p-0 overflow-hidden">
      <div class="overflow-x-auto">
        <table class="admin-table">
          <thead>
            <tr>
              <th class="text-text-main">ID</th>
              <th class="text-text-main">主题名称</th>
              <th class="text-text-main">价格</th>
              <th class="text-text-main">下载量</th>
              <th class="text-text-main">购买量</th>
              <th class="text-text-main">评分</th>
              <th class="text-text-main">状态</th>
              <th class="text-text-main">创建时间</th>
              <th class="text-text-main">操作</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="theme in themes" :key="theme.id">
              <td class="text-text-main">{{ theme.id }}</td>
              <td class="text-text-main font-medium">{{ theme.name }}</td>
              <td class="text-text-main">{{ theme.isFree ? '免费' : `¥${theme.price}` }}</td>
              <td class="text-text-muted">{{ theme.downloadCount }}</td>
              <td class="text-text-muted">{{ theme.purchaseCount }}</td>
              <td class="text-text-muted">{{ theme.rating }} ({{ theme.ratingCount }})</td>
              <td>
                <span :class="getStatusClass(theme.status)">
                  {{ getStatusText(theme.status) }}
                </span>
              </td>
              <td class="text-text-muted">{{ formatDate(theme.createdAt) }}</td>
              <td>
                <div class="flex gap-2">
                  <AppButton variant="secondary" size="sm" @click="editTheme(theme)">
                    编辑
                  </AppButton>
                  <AppButton variant="ghost" size="sm" @click="deleteTheme(theme.id)">
                    删除
                  </AppButton>
                </div>
              </td>
            </tr>
            <tr v-if="themes.length === 0">
              <td colspan="9" class="text-center py-8 text-text-muted">
                暂无数据
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </AppCard>

    <!-- 分页 -->
    <div class="flex justify-center items-center gap-4">
      <AppButton
        variant="secondary"
        :disabled="page === 1"
        @click="page--; loadThemes()"
      >
        上一页     </AppButton>
      <span class="text-text-muted">{{ page }} 页，{{ totalPages }} 页</span>
      <AppButton
        variant="secondary"
        :disabled="page >= totalPages"
        @click="page++; loadThemes()"
      >
        下一页     </AppButton>
    </div>
  </div>
</template>

<script setup lang="ts">
import AppCard from '~/components/ui/AppCard.vue'
import AppButton from '~/components/ui/AppButton.vue'
definePageMeta({
  layout: 'admin',
  middleware: 'admin-auth'
})

const api = useApi()

const themes = ref<any[]>([])
const page = ref(1)
const pageSize = ref(20)
const totalPages = ref(1)
const showAddModal = ref(false)
const filters = ref({
  status: '',
  search: ''
})

const loadThemes = async () => {
  try {
    const params = new URLSearchParams({
      page: page.value.toString(),
      pageSize: pageSize.value.toString()
    })
    if (filters.value.status) {
      params.append('status', filters.value.status)
    }

    const res = await api.get(`/admin/commercial/themes?${params}`)
    if (res && res.data) {
      themes.value = res.data.themes || []
      totalPages.value = res.data.totalPages || 1
    }
  } catch (error) {
    console.error('加载主题列表失败:', error)
  }
}

const getStatusClass = (status: string) => {
  const classes: Record<string, string> = {
    draft: 'status-badge status-draft',
    published: 'status-badge status-published',
    archived: 'status-badge status-archived'
  }
  return classes[status] || 'status-badge'
}

const getStatusText = (status: string) => {
  const texts: Record<string, string> = {
    draft: '草稿',
    published: '已发布',
    archived: '已归档'
  }
  return texts[status] || status
}

const formatDate = (date: string) => {
  return new Date(date).toLocaleString('zh-CN')
}

const editTheme = (theme: any) => {
  // TODO: 实现编辑功能
  console.log('编辑主题:', theme)
}

const deleteTheme = async (id: number) => {
  if (!confirm('确定要删除这个主题吗？')) return
  // TODO: 实现删除功能
  console.log('删除主题:', id)
}

onMounted(() => {
  loadThemes()
})
</script>

<style scoped>
/* 表格样式 */
.admin-table {
  width: 100%;
  border-collapse: collapse;
  background: transparent;
}

.admin-table thead {
  background: rgba(255, 255, 255, 0.05) !important;
}

.admin-table th {
  padding: 0.75rem 1rem;
  text-align: left;
  font-weight: 600;
  font-size: 0.875rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  border-bottom: 2px solid rgba(255, 255, 255, 0.1);
  color: var(--color-text-main, var(--color-text-sub)) !important;
  background: rgba(255, 255, 255, 0.05) !important;
}

.admin-table td {
  padding: 0.75rem 1rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
  background: transparent !important;
}

.admin-table tbody tr {
  background: transparent !important;
}

.admin-table tbody tr:hover {
  background: rgba(255, 255, 255, 0.03) !important;
}

.admin-table tbody tr:last-child td {
  border-bottom: none;
}

/* 状态标�?*/
.status-badge {
  display: inline-block;
  padding: 0.25rem 0.75rem;
  border-radius: 0.375rem;
  font-size: 0.75rem;
  font-weight: 500;
}

.status-draft {
  background: rgba(251, 191, 36, 0.2);
  color: var(--color-warning);
  border: 1px solid rgba(251, 191, 36, 0.4);
}

.status-published {
  background: rgba(34, 197, 94, 0.2);
  color: var(--color-success);
  border: 1px solid rgba(34, 197, 94, 0.4);
}

.status-archived {
  background: rgba(148, 163, 184, 0.2);
  color: var(--color-text-muted);
  border: 1px solid rgba(148, 163, 184, 0.4);
}

/* 表单输入�?*/
.form-input {
  padding: 0.5rem 0.75rem;
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 0.375rem;
  color: var(--color-text-main, var(--color-text-sub));
  font-size: 0.875rem;
  transition: all 0.2s ease;
}

.form-input:focus {
  outline: none;
  border-color: var(--color-primary, var(--color-primary));
  background: rgba(255, 255, 255, 0.15);
}

.form-input::placeholder {
  color: rgba(255, 255, 255, 0.5);
}

.form-input option {
  background: var(--admin-sidebar-bg, var(--color-border-default));
  color: var(--color-text-main, var(--color-text-sub));
}
</style>

