<template>
  <!-- 使用 ListPage Pattern 组件 -->
  <ListPage
    title="文章运营"
    description="观察文章发布状态、来源与表现。正文请在 content/ 或 Git 中维护，后台不提供正文编辑。"
    :columns="internalColumns"
    :data="articles"
    :loading="loading"
    :pagination="internalPagination"
    :empty-config="{
      icon: 'fas fa-file-alt',
      text: '暂无文章',
      description: '当前无文章记录；正文生产请走 Git / content 流程'
    }"
  >
    <!-- 筛选区域 -->
    <template #filter="{ filterValue }">
      <div class="filter-bar">
        <n-input
          v-model="keyword"
          placeholder="搜索文章标题..."
          clearable
          @update:value="handleSearchChange"
          style="flex: 1"
        >
          <template #prefix>
            <i class="fas fa-search"></i>
          </template>
        </n-input>

        <n-select
          v-model="sourceType"
          placeholder="来源类型"
          :options="sourceTypeOptions"
          clearable
          style="width: 150px"
          @update:value="handleSearchChange"
        />

        <n-button type="primary" @click="fetchArticles">搜索</n-button>
      </div>
    </template>
  </ListPage>
</template>

<script setup lang="ts">
import { h, computed, ref } from 'vue'
import { NButton, NInput, NSpace, NTag, NSelect } from 'naive-ui'
import type { Article, ArticleListResponse } from '~/types/api'
import { useSafeMessage } from '~/composables/useNaiveUI'
import { useErrorHandler } from '~/composables/useErrorHandler'
import ListPage from '~/components/admin/patterns/ListPage.vue'
import type { DataTableColumns } from 'naive-ui'

definePageMeta({
  layout: 'admin',
  middleware: 'admin-auth',
  ssr: false
})

const router = useRouter()
const api = useApi()
const message = useSafeMessage()
const { handleError } = useErrorHandler()

const articles = ref<Article[]>([])
const loading = ref(false)
const keyword = ref('')
const sourceType = ref<string>('')
const page = ref(1)
const pageSize = ref(10)
const total = ref(0)

// 表格列配置
const internalColumns: DataTableColumns<Article> = [
  {
    title: '标题',
    key: 'title',
    render(row) {
      return h('div', { class: 'article-title' }, row.title)
    }
  },
  {
    title: '分类',
    key: 'categoryName',
    width: 150,
    render(row) {
      return h(NTag, {
        type: 'info',
        size: 'small',
        bordered: false
      }, { default: () => row.categoryName || '未分类' })
    }
  },
  {
    title: '来源类型',
    key: 'sourceType',
    width: 120,
    render(row) {
      const sourceTypeMap: Record<string, string> = {
        'manual': '手动创建',
        'ai_generated': 'AI生成',
        'ai_optimized': 'AI优化',
        'imported': '导入'
      }
      return h(NTag, {
        type: row.sourceType === 'ai_generated' ? 'warning' : 'default',
        size: 'small',
        bordered: false
      }, { default: () => sourceTypeMap[row.sourceType] || '未知' })
    }
  },
  {
    title: 'Slug',
    key: 'slug',
    width: 140,
    render(row) {
      return row.slug || '-'
    }
  },
  {
    title: '浏览量',
    key: 'viewCount',
    width: 90,
    render(row) {
      return row.viewCount ?? 0
    }
  },
  {
    title: '发布时间',
    key: 'publishTime',
    width: 180,
    render(row) {
      return formatDate(row.publishTime || row.createdAt)
    }
  },
  {
    title: '状态',
    key: 'status',
    width: 100,
    render(row) {
      return h(NTag, {
        type: row.status === 1 ? 'success' : 'default',
        size: 'small',
        bordered: false
      }, { default: () => row.status === 1 ? '已发布' : '草稿' })
    }
  },
  {
    title: '操作',
    key: 'actions',
    width: 180,
    fixed: 'right',
    render(row) {
      const previewPath = row.slug ? `/blog/${row.slug}` : `/blog/${row.id}`
      const buttons = [
        row.status === 1
          ? h('a', {
            href: previewPath,
            target: '_blank',
            rel: 'noopener noreferrer',
            class: 'btn-link btn-link-blue',
          }, '前台')
          : null,
        h('button', {
          onClick: () => router.push(`/admin/articles/${row.id}/versions`),
          class: 'btn-link btn-link-blue',
        }, '版本'),
        h('button', {
          onClick: () => handleDelete(row.id),
          class: 'btn-link btn-link-red',
        }, '删除'),
      ].filter(Boolean)
      return h('div', { class: 'action-buttons' }, buttons)
    }
  }
]

// 来源类型选项
const sourceTypeOptions = [
  { label: '手动创建', value: 'manual' },
  { label: 'AI生成', value: 'ai_generated' },
  { label: 'AI优化', value: 'ai_optimized' },
  { label: '导入', value: 'imported' }
]

// 内部分页配置
const internalPagination = computed(() => ({
  page: page.value,
  pageSize: pageSize.value,
  pageCount: Math.ceil(total.value / pageSize.value),
  showSizePicker: true,
  pageSizes: [10, 20, 50, 100],
  showQuickJumper: true
}))

const fetchArticles = async () => {
  loading.value = true
  try {
    const params: any = {
      page: page.value,
      pageSize: pageSize.value,
      keyword: keyword.value
    }

    if (sourceType.value) {
      params.sourceType = sourceType.value
    }

    const res = await api.get<ArticleListResponse>('/Articles', {
      params
    })

    // .NET API returns { Total: int, List: [] }
    if (res) {
      if (Array.isArray(res)) {
        articles.value = res
        total.value = res.length
      } else if (res.List !== undefined || res.list !== undefined) {
        articles.value = res.list ?? res.List ?? []
        total.value = res.Total ?? res.total ?? 0
      } else {
        articles.value = []
        total.value = 0
      }
    } else {
      articles.value = []
      total.value = 0
    }
  } catch (e: unknown) {
    if (process.env.NODE_ENV === 'development') {
      console.error('[Articles] Failed to fetch articles:', e)
    }
    articles.value = []
    total.value = 0
    message.error('加载文章列表失败')
  } finally {
    loading.value = false
  }
}

const handleDelete = async (id: number) => {
  if (!confirm('确定要删除这篇文章吗?')) return

  try {
    await api.del(`/Articles/${id}`)
    message.success('删除成功')
    fetchArticles()
  } catch (e: unknown) {
    handleError(e, '删除失败')
  }
}

const formatDate = (dateStr: string) => {
  if (!dateStr) return '-'
  return new Date(dateStr).toLocaleDateString()
}

const handleSearchChange = () => {
   page.value = 1
}

// 初始加载
onMounted(() => {
  fetchArticles()
})
</script>

<style scoped>
/* 筛选栏 */
.filter-bar {
  display: flex;
  gap: var(--spacing-md);
  align-items: center;
}

/* 文章标题 */
.article-title {
  font-weight: 500;
  color: var(--color-text-main);
}

/* 操作按钮 */
.action-buttons {
  display: flex;
  gap: 8px;
  align-items: center;
}

.btn-link {
  background: none;
  border: none;
  cursor: pointer;
  text-decoration: none;
  transition: color 0.2s ease;
  font-size: var(--text-sm);
}

.btn-link-blue {
  color: var(--color-primary);
}

.btn-link-blue:hover {
  color: var(--color-primary-hover);
}

.btn-link-red {
  color: var(--color-error);
}

.btn-link-red:hover {
  color: var(--color-error-hover);
}
</style>
