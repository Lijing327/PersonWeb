<template>
  <div class="projects-page">
    <ListPage
      title="项目运营"
      description="观察项目状态与访问表现。正文请在 DB 导入流程或后续 Git SoT 中维护，后台不提供正文编辑。"
      :columns="internalColumns"
      :data="projects"
      :loading="loading"
      :empty-config="{
        icon: 'fas fa-folder-open',
        text: '暂无项目',
        description: '当前无项目记录'
      }"
    >
      <template #header-actions>
        <n-space :size="12">
          <n-button type="success" secondary @click="() => router.push('/admin/projects/stats')">
            <template #icon>
              <i class="fas fa-chart-bar"></i>
            </template>
            访问统计
          </n-button>
        </n-space>
      </template>
    </ListPage>
  </div>
</template>

<script setup lang="ts">
import { h } from 'vue'
import { NButton, NSpace, NTag, NImage } from 'naive-ui'
import type { Project } from '~/types/api'
import { useSafeMessage } from '~/composables/useNaiveUI'
import { useErrorHandler } from '~/composables/useErrorHandler'
import ListPage from '~/components/admin/patterns/ListPage.vue'
import type { DataTableColumns } from 'naive-ui'

definePageMeta({
  layout: 'admin',
  middleware: 'admin-auth'
})

const router = useRouter()
const api = useApi()
const { handleError } = useErrorHandler()
const message = useSafeMessage()

const projects = ref<Project[]>([])
const loading = ref(false)

const internalColumns: DataTableColumns<Project> = [
  {
    title: '项目',
    key: 'title',
    render(row) {
      return h('div', { class: 'project-info' }, [
        row.coverUrl
          ? h(NImage, {
            src: row.coverUrl,
            width: 48,
            height: 48,
            objectFit: 'cover',
            style: { borderRadius: '8px', marginRight: '12px' },
            previewDisabled: true,
          })
          : null,
        h('div', { class: 'project-details' }, [
          h('div', { class: 'project-title' }, row.title),
          h('div', { class: 'project-desc' }, row.description || '—'),
        ]),
      ])
    }
  },
  {
    title: '状态',
    key: 'status',
    width: 100,
    render(row) {
      const statusMap: Record<string, { label: string, type: 'success' | 'warning' | 'default' }> = {
        Active: { label: '进行中', type: 'success' },
        Completed: { label: '已完成', type: 'default' },
        Archived: { label: '已归档', type: 'warning' },
      }
      const meta = statusMap[row.status] || { label: row.status, type: 'default' as const }
      return h(NTag, { type: meta.type, size: 'small', bordered: false }, { default: () => meta.label })
    }
  },
  {
    title: '访问量',
    key: 'viewCount',
    width: 100,
    render(row) {
      return h('span', { class: 'view-count' }, [
        h('i', { class: 'fas fa-eye', style: { marginRight: '4px', opacity: '0.6' } }),
        String(row.viewCount ?? 0),
      ])
    }
  },
  {
    title: 'Demo',
    key: 'demoUrl',
    width: 80,
    render(row) {
      if (row.demoUrl) {
        return h('a', { href: row.demoUrl, target: '_blank', class: 'btn-link btn-link-blue' }, '访问')
      }
      return h('span', { class: 'text-muted' }, '-')
    }
  },
  {
    title: 'GitHub',
    key: 'githubUrl',
    width: 100,
    render(row) {
      if (row.githubUrl) {
        return h('a', { href: row.githubUrl, target: '_blank', class: 'btn-link btn-link-blue' }, 'Repo')
      }
      return h('span', { class: 'text-muted' }, '-')
    }
  },
  {
    title: '创建日期',
    key: 'createdAt',
    width: 120,
    render(row) {
      return new Date(row.createdAt).toLocaleDateString()
    }
  },
  {
    title: '操作',
    key: 'actions',
    width: 140,
    fixed: 'right',
    render(row) {
      return h('div', { class: 'action-buttons' }, [
        h('a', {
          href: `/projects/${row.id}`,
          target: '_blank',
          rel: 'noopener noreferrer',
          class: 'btn-link btn-link-blue',
        }, '前台'),
        h('button', {
          onClick: () => handleDelete(row.id),
          class: 'btn-link btn-link-red',
        }, '删除'),
      ])
    }
  }
]

const fetchProjects = async () => {
  loading.value = true
  try {
    const res = await api.get<Project[]>('/Projects')
    projects.value = Array.isArray(res) ? res : []
  } catch (e: unknown) {
    if (process.env.NODE_ENV === 'development') {
      console.error('Failed to fetch projects:', e)
    }
    projects.value = []
    message.error('加载项目列表失败')
  } finally {
    loading.value = false
  }
}

const handleDelete = async (id: string) => {
  if (!confirm('确定要删除这个项目吗？')) return

  try {
    await api.del(`/Projects/${id}`)
    message.success('删除成功')
    await fetchProjects()
  } catch (e: unknown) {
    handleError(e, '删除失败')
  }
}

onMounted(() => {
  fetchProjects()
})
</script>

<style scoped>
.projects-page {
  width: 100%;
}

.project-info {
  display: flex;
  align-items: center;
}

.project-details {
  flex: 1;
}

.project-title {
  font-size: var(--text-sm);
  font-weight: 600;
  color: var(--color-text-main);
  margin-bottom: 4px;
}

.project-desc {
  font-size: var(--text-xs);
  color: var(--color-text-muted);
  font-weight: 500;
}

.view-count {
  display: flex;
  align-items: center;
  gap: 4px;
  color: var(--color-text-main);
  font-weight: 500;
}

.text-muted {
  color: var(--color-text-muted);
  font-weight: 500;
}

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
