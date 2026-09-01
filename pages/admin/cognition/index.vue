<template>
  <ClientOnly>
    <div class="cognition-admin-page">
      <div class="page-header">
        <h1 class="page-title">认知说明书管理</h1>
        <n-button type="primary" @click="handleNew">
          <template #icon>
            <i class="fas fa-plus"></i>
          </template>
          新建说明�?        </n-button>
      </div>

      <!-- 筛选栏 -->
      <div class="filter-bar">
        <n-input
          v-model:value="keyword"
          placeholder="搜索标题、slug..."
          clearable
          @keyup.enter="fetchList"
          style="flex: 1"
        >
          <template #prefix>
            <i class="fas fa-search"></i>
          </template>
        </n-input>
        <n-select
          v-model:value="filterStatus"
          placeholder="状态筛选"
          clearable
          style="width: 150px;"
          :options="statusOptions"
          @update:value="fetchList"
        />
        <n-button type="primary" @click="fetchList">搜索</n-button>
      </div>

      <!-- 数据表格 -->
      <div class="table-container">
        <n-data-table
          v-if="!loading && docs.length > 0"
          :columns="columns"
          :data="docs"
          :pagination="pagination"
          @update:page="handlePageChange"
          @update:page-size="handlePageSizeChange"
        />
        <div v-else-if="loading" class="table-loading">
          <n-spin size="large" />
          <p>加载中...</p>
        </div>
        <div v-else class="table-empty">
          <n-empty description="暂无数据" />
        </div>
      </div>

      <!-- 编辑弹窗 -->
      <n-modal
        v-model:show="showModal"
        :mask-closable="false"
        :close-on-esc="false"
        preset="card"
        :title="editingId ? '编辑认知说明书' : '新建认知说明书'"
        style="width: 95%; max-width: 1200px;"
      >
        <n-form
          ref="formRef"
          :model="form"
          :rules="rules"
          label-placement="left"
          label-width="100px"
          require-mark-placement="right-hanging"
        >
          <n-form-item label="标题" path="title">
            <n-input v-model:value="form.title" placeholder="请输入标题" />
          </n-form-item>
          <n-form-item label="Slug" path="slug">
            <n-input v-model:value="form.slug" placeholder="URL 别名（留空自动生成）" />
            <template #feedback>
              <span class="text-xs text-gray-500">用于访问路径，如：cognition/your-slug</span>
            </template>
          </n-form-item>
          <n-form-item label="摘要" path="summary">
            <n-input
              v-model:value="form.summary"
              type="textarea"
              :rows="2"
              placeholder="请输入摘要（可选）"
              maxlength="500"
              show-count
            />
          </n-form-item>
          <n-form-item label="内容" path="contentMd">
            <n-tabs type="line" animated>
              <n-tab-pane name="edit" tab="编辑">
                <n-input
                  v-model:value="form.contentMd"
                  type="textarea"
                  :rows="15"
                  placeholder="请输入Markdown 内容"
                  style="font-family: 'Consolas', 'Monaco', 'Courier New', monospace;"
                />
              </n-tab-pane>
              <n-tab-pane name="preview" tab="预览">
                <div class="markdown-preview-container">
                  <div 
                    v-if="form.contentMd" 
                    class="markdown-preview prose prose-lg dark:prose-invert max-w-none"
                    v-html="previewContent"
                  ></div>
                  <div v-else class="markdown-preview-empty">
                    <p class="text-gray-400">暂无内容，请在"编辑"标签中输入Markdown 内容</p>
                  </div>
                </div>
              </n-tab-pane>
            </n-tabs>
          </n-form-item>
          <n-form-item label="状态" path="status">
            <n-select v-model:value="form.status" :options="statusOptions" />
          </n-form-item>
        </n-form>

        <template #footer>
          <div style="display: flex; justify-content: flex-end; gap: 12px;">
            <n-button @click="showModal = false">取消</n-button>
            <n-button type="primary" :loading="submitting" @click="handleSave">
              保存
            </n-button>
          </div>
        </template>
      </n-modal>
    </div>
    <template #fallback>
      <div class="cognition-admin-page">
        <div class="page-header">
          <h1 class="page-title">认知说明书管理</h1>
        </div>
        <div class="table-loading">加载中...</div>
      </div>
    </template>
  </ClientOnly>
</template>

<script setup lang="ts">
import { ref, h, onMounted, computed } from 'vue'
import {
  NButton,
  NInput,
  NSelect,
  NModal,
  NForm,
  NFormItem,
  NDataTable,
  NTag,
  NSpin,
  NEmpty,
  NTabs,
  NTabPane,
  type DataTableColumns,
  type FormInst,
  type FormRules
} from 'naive-ui'
import { useApi } from '~/composables/useApi'
import { useNotification } from '~/composables/useToast'
import { useErrorHandler } from '~/composables/useErrorHandler'

definePageMeta({
  layout: 'admin',
  middleware: 'admin-auth'
})

const api = useApi()
const { success, error } = useNotification()
const { handleError } = useErrorHandler()
const { parse: parseMarkdown } = useMarkdown()

const loading = ref(false)
const docs = ref<any[]>([])
const keyword = ref('')
const filterStatus = ref<string>('all') // 默认显示全部

// 分页
const pagination = ref({
  page: 1,
  pageSize: 20,
  itemCount: 0,
  showSizePicker: true,
  pageSizes: [10, 20, 50, 100],
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

// 状态选项
const statusOptions = [
  { label: '全部', value: 'all' },
  { label: '草稿', value: 'draft' },
  { label: '已发布', value: 'published' }
]

// 表单状态
const showModal = ref(false)
const editingId = ref<number | null>(null)
const submitting = ref(false)
const formRef = ref<FormInst | null>(null)

// 表单数据
const form = ref({
  title: '',
  slug: '',
  summary: '',
  contentMd: '',
  status: 'draft'
})

// 预览内容（计算属性）
const previewContent = computed(() => {
  if (!form.value.contentMd) return ''
  return parseMarkdown(form.value.contentMd)
})

// 表单验证规则
const rules: FormRules = {
  title: [{ required: true, message: '请输入标题', trigger: 'blur' }],
  contentMd: [{ required: true, message: '请输入内容', trigger: 'blur' }],
  status: [{ required: true, message: '请选择状态', trigger: 'change' }]
}

  const columns: DataTableColumns<any> = [
  {
    title: '标题',
    key: 'title',
    width: 200,
    ellipsis: { tooltip: true }
  },
  {
    title: 'Slug',
    key: 'slug',
    width: 150,
    ellipsis: { tooltip: true }
  },
  {
    title: '摘要',
    key: 'summary',
    width: 200,
    ellipsis: { tooltip: true },
    render: (row) => row.summary || '-'
  },
  {
    title: '状态',
    key: 'status',
    width: 100,
    render: (row) => {
      const type = row.status === 'published' ? 'success' : 'default'
      const text = row.status === 'published' ? '已发布' : '草稿'
      return h(NTag, { type }, { default: () => text })
    }
  },
  {
    title: '更新时间',
    key: 'updatedAt',
    width: 180,
    render: (row) => formatDate(row.updatedAt)
  },
  {
    title: '操作',
    key: 'actions',
    width: 200,
    render: (row) => {
      return h('div', { class: 'flex gap-2' }, [
        h(
          NButton,
          {
            size: 'small',
            quaternary: true,
            type: 'primary',
            onClick: () => handleEdit(row)
          },
          { default: () => '编辑' }
        ),
        h(
          NButton,
          {
            size: 'small',
            quaternary: true,
            type: row.status === 'published' ? 'warning' : 'success',
            onClick: () => handleTogglePublish(row)
          },
          { default: () => row.status === 'published' ? '撤回' : '发布' }
        ),
        h(
          NButton,
          {
            size: 'small',
            quaternary: true,
            type: 'error',
            onClick: () => handleDelete(row.id)
          },
          { default: () => '删除' }
        )
      ])
    }
  }
]

// 格式化日期
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

// 获取列表
const fetchList = async () => {
  loading.value = true
  try {
    const res = await api.get('/CognitionDocs', {
      params: {
        page: pagination.value.page,
        pageSize: pagination.value.pageSize,
        keyword: keyword.value || undefined,
        status: filterStatus.value === 'all' ? undefined : filterStatus.value
      }
    })

    // 兼容 PascalCase/camelCase
    const list = res?.List || res?.list || []
    const total = res?.Total || res?.total || 0

   docs.value = list.map((item: any) => ({
      id: item.Id || item.id,
      title: item.Title || item.title,
      slug: item.Slug || item.slug,
      summary: item.Summary || item.summary,
      status: item.Status || item.status,
      updatedAt: item.UpdatedAt || item.updatedAt
    }))

    pagination.value.itemCount = total

    console.log('处理后的数据:', docs.value)   } catch (e) {
    console.error('获取列表失败:', e)
    handleError(e, '获取列表失败')
    docs.value = []
    pagination.value.itemCount = 0
  } finally {
    loading.value = false
  }
}

// 分页变化
const handlePageChange = (page: number) => {
  pagination.value.page = page
  fetchList()
}

const handlePageSizeChange = (pageSize: number) => {
  pagination.value.pageSize = pageSize
  pagination.value.page = 1
  fetchList()
}

// 新建
const handleNew = () => {
  editingId.value = null
  form.value = {
    title: '',
    slug: '',
    summary: '',
    contentMd: '',
    status: 'draft'
  }
  showModal.value = true
}

// 编辑
const handleEdit = async (row: any) => {
  editingId.value = row.id
  try {
    const res = await api.get(`/CognitionDocs/${row.id}`)
    if (res) {
      form.value = {
        title: res.Title || res.title || '',
        slug: res.Slug || res.slug || '',
        summary: res.Summary || res.summary || '',
        contentMd: res.ContentMd || res.contentMd || '',
        status: res.Status || res.status || 'draft'
      }
      showModal.value = true
    }
  } catch (e) {
    handleError(e, '获取详情失败')
  }
}

// 保存
const handleSave = async () => {
  if (!formRef.value) return

  await formRef.value.validate(async (errors) => {
    if (errors) return

    submitting.value = true
    try {
      if (editingId.value) {
        // 更新
        await api.put(`/CognitionDocs/${editingId.value}`, {
          title: form.value.title,
          slug: form.value.slug || undefined,
          summary: form.value.summary || undefined,
          contentMd: form.value.contentMd,
          status: form.value.status
        })
        success('更新成功')
      } else {
        // 创建
        const createRes = await api.post('/CognitionDocs', {
          title: form.value.title,
          slug: form.value.slug || undefined,
          summary: form.value.summary || undefined,
          contentMd: form.value.contentMd,
          status: form.value.status
        })
        console.log('创建响应:', createRes) 
               success('创建成功')
      }

      showModal.value = false
      // 重置到第一页并刷新列表
      pagination.value.page = 1
      await fetchList()
    } catch (e) {
      handleError(e, '保存失败')
    } finally {
      submitting.value = false
    }
  })
}

// 发布/撤回
const handleTogglePublish = async (row: any) => {
  const newStatus = row.status === 'published' ? 'draft' : 'published'
  try {
    await api.patch(`/CognitionDocs/${row.id}/publish`, {
      status: newStatus
    })
    success(newStatus === 'published' ? '发布成功' : '已撤回')
    await fetchList()
  } catch (e) {
    handleError(e, '操作失败')
  }
}

// 删除
const handleDelete = async (id: number) => {
  if (!confirm('确定要删除这条记录吗?')) return

  try {
    await api.delete(`/CognitionDocs/${id}`)
    success('删除成功')
    await fetchList()
  } catch (e) {
    handleError(e, '删除失败')
  }
}

onMounted(() => {
  fetchList()
})
</script>

<style scoped>
.cognition-admin-page {
  padding: 1.5rem;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
}

.page-title {
  font-size: 1.5rem;
  font-weight: 600;
}

.filter-bar {
  display: flex;
  gap: 12px;
  margin-bottom: 1.5rem;
  padding: 1rem;
  background: var(--color-bg-elevated);
  border-radius: 8px;
}

.table-container {
  background: var(--color-bg-elevated);
  border-radius: 8px;
  padding: 1rem;
}

.table-loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 3rem;
  color: var(--color-text-muted);
}

.table-empty {
  padding: 3rem;
  text-align: center;
}

/* Markdown 预览样式 */
.markdown-preview-container {
  min-height: 400px;
  max-height: 600px;
  overflow-y: auto;
  padding: 1rem;
  background: var(--n-color);
  border: 1px solid var(--n-border-color);
  border-radius: 4px;
}

.markdown-preview-empty {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 400px;
  color: var(--n-text-color-disabled);
}

.markdown-preview :deep(h1) {
  font-size: 2em;
  font-weight: bold;
  margin-top: 0.67em;
  margin-bottom: 0.67em;
  border-bottom: 1px solid var(--n-divider-color);
  padding-bottom: 0.3em;
}

.markdown-preview :deep(h2) {
  font-size: 1.5em;
  font-weight: bold;
  margin-top: 0.83em;
  margin-bottom: 0.83em;
  color: var(--n-primary-color);
}

.markdown-preview :deep(h3) {
  font-size: 1.17em;
  font-weight: bold;
  margin-top: 1em;
  margin-bottom: 1em;
}

.markdown-preview :deep(p) {
  margin-bottom: 1em;
  line-height: 1.6;
}

.markdown-preview :deep(ul),
.markdown-preview :deep(ol) {
  margin-bottom: 1em;
  padding-left: 2em;
}

.markdown-preview :deep(li) {
  margin-bottom: 0.5em;
}

.markdown-preview :deep(blockquote) {
  border-left: 4px solid var(--n-primary-color);
  padding-left: 1em;
  margin: 1em 0;
  background: var(--n-color-hover);
  padding: 0.5em 1em;
  font-style: italic;
}

.markdown-preview :deep(code) {
  background: var(--n-code-color);
  padding: 0.2em 0.4em;
  border-radius: 3px;
  font-family: 'Consolas', 'Monaco', 'Courier New', monospace;
  font-size: 0.9em;
}

.markdown-preview :deep(pre) {
  background: var(--n-code-color);
  padding: 1em;
  border-radius: 4px;
  overflow-x: auto;
  margin: 1em 0;
}

.markdown-preview :deep(pre code) {
  background: transparent;
  padding: 0;
}

.markdown-preview :deep(strong) {
  font-weight: bold;
}

.markdown-preview :deep(em) {
  font-style: italic;
}

.markdown-preview :deep(a) {
  color: var(--n-primary-color);
  text-decoration: none;
}

.markdown-preview :deep(a:hover) {
  text-decoration: underline;
}

.markdown-preview :deep(table) {
  width: 100%;
  border-collapse: collapse;
  margin: 1em 0;
}

.markdown-preview :deep(th),
.markdown-preview :deep(td) {
  border: 1px solid var(--n-border-color);
  padding: 0.5em;
}

.markdown-preview :deep(th) {
  background: var(--n-color-hover);
  font-weight: bold;
}
</style>
