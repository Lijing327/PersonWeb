<template>
  <div>
    <div class="page-header">
      <div>
        <h1 class="page-title">文章版本历史</h1>
        <p class="text-sm text-gray-500 dark:text-gray-400 mt-1">{{ articleTitle }}</p>
        <p class="text-sm text-amber-600 dark:text-amber-400 mt-2">
          LEGACY_READONLY — 正文版本请使用 Git history；此处仅保留 DB 历史只读对照，不可恢复写回。
        </p>
      </div>
      <NuxtLink :to="`/admin/articles`" class="btn-secondary">
        返回列表
      </NuxtLink>
    </div>

    <div v-if="loading" class="text-center py-12">
      <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
    </div>

    <div v-else-if="versions.length === 0" class="card p-8 text-center">
      <p class="empty-state">暂无版本历史</p>
    </div>

    <div v-else class="space-y-4">
      <!-- 版本列表 -->
      <div
        v-for="version in versions"
        :key="version.id"
        class="card-hover p-6"
      >
        <div class="flex items-start justify-between">
          <div class="flex-1">
            <div class="flex items-center gap-3 mb-2">
              <span class="badge badge-blue rounded-full px-3 py-1 text-sm font-semibold">
                v{{ version.version }}
              </span>
              <span
                v-if="version.status === 1"
                class="badge badge-green"
              >
                当前版本
              </span>
              <span
                v-else
                class="badge badge-gray"
              >
                历史版本
              </span>
            </div>
            <h3 class="text-lg font-semibold text-gray-900 dark:text-var(--color-bg-light, white) mb-1">{{ version.title }}</h3>
            <p class="text-sm text-gray-500 dark:text-gray-400">
              {{ formatDate(version.updatedAt) }}
            </p>
          </div>
          <div class="flex gap-2">
            <button
              @click="viewVersion(version.id)"
              class="btn-primary"
            >
              查看
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- 版本对比对话框 -->
    <div
      v-if="showCompare"
      class="modal-overlay"
      @click.self="showCompare = false"
    >
      <div class="modal-content-lg flex flex-col">
        <div class="modal-header">
          <h2 class="modal-title">版本对比</h2>
          <button
            @click="showCompare = false"
            class="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          >
            <i class="fas fa-times text-2xl"></i>
          </button>
        </div>
        <div class="flex-1 overflow-auto p-6">
          <div v-if="compareLoading" class="text-center py-12">
            <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          </div>
          <div v-else-if="currentVersion && selectedVersion" class="space-y-4">
            <!-- 切换显示模式 -->
            <div class="flex gap-2 mb-4">
              <button
                @click="viewMode = 'split'"
                :class="viewMode === 'split' ? 'btn-primary' : 'btn-secondary'"
              >
                并排对比
              </button>
              <button
                @click="viewMode = 'diff'"
                :class="viewMode === 'diff' ? 'btn-primary' : 'btn-secondary'"
              >
                Diff 对比
              </button>
            </div>

            <!-- 并排对比模式 -->
            <div v-if="viewMode === 'split'" class="grid grid-cols-2 gap-6">
              <div>
                <h3 class="text-lg font-semibold text-gray-900 dark:text-var(--color-bg-light, white) mb-4">
                  当前版本 (v{{ currentVersion.version }})
                </h3>
                <div class="prose dark:prose-invert max-w-none card p-4">
                  <div v-html="currentVersion.contentHtml || ''"></div>
                </div>
              </div>
              <div>
                <h3 class="text-lg font-semibold text-gray-900 dark:text-var(--color-bg-light, white) mb-4">
                  历史版本 (v{{ selectedVersion.version }})
                </h3>
                <div class="prose dark:prose-invert max-w-none card p-4">
                  <div v-html="selectedVersion.contentHtml || ''"></div>
                </div>
              </div>
            </div>

            <!-- Diff 对比模式 -->
            <div v-else class="card p-4">
              <div class="mb-4 flex items-center gap-4">
                <div class="flex items-center gap-2">
                  <span class="w-4 h-4 bg-red-200 dark:bg-red-900 inline-block"></span>
                  <span class="text-sm text-gray-600 dark:text-gray-400">删除的内容</span>
                </div>
                <div class="flex items-center gap-2">
                  <span class="w-4 h-4 bg-green-200 dark:bg-green-900 inline-block"></span>
                  <span class="text-sm text-gray-600 dark:text-gray-400">新增的内容</span>
                </div>
              </div>
              <div class="diff-content prose dark:prose-invert max-w-none" v-html="diffHtml"></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useNotification } from '~/composables/useToast'
import { useErrorHandler } from '~/composables/useErrorHandler'
import { DiffMatchPatch } from 'diff-match-patch'

definePageMeta({
  layout: 'admin',
  middleware: 'admin-auth'
})

const route = useRoute()
const api = useApi()
const { success } = useNotification()
const { handleError } = useErrorHandler()

const articleId = computed(() => route.params.id as string)
const articleTitle = ref('')
const versions = ref<any[]>([])
const loading = ref(true)
const showCompare = ref(false)
const compareLoading = ref(false)
const currentVersion = ref<any>(null)
const selectedVersion = ref<any>(null)
const viewMode = ref<'split' | 'diff'>('split')
const diffHtml = ref('')

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleString('zh-CN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

const fetchVersions = async () => {
  loading.value = true
  try {
    const res = await api.get<any[]>(`/Articles/${articleId.value}/versions`)
    versions.value = res || []
    
    // 获取文章标题
    if (versions.value.length > 0) {
      articleTitle.value = versions.value.find(v => v.status === 1)?.title || versions.value[0].title
    }
  } catch (e: unknown) {
    handleError(e, '获取版本历史失败')
  } finally {
    loading.value = false
  }
}

const viewVersion = async (versionId: number) => {
  compareLoading.value = true
  showCompare.value = true
  viewMode.value = 'split'
  
  try {
    // 获取当前版本
    const current = await api.get<any>(`/Articles/${articleId.value}`)
    currentVersion.value = current

    // 获取选中版本
    const version = await api.get<any>(`/Articles/${articleId.value}/versions/${versionId}`)
    selectedVersion.value = version

    // 生成 diff
    generateDiff()
  } catch (e: unknown) {
    handleError(e, '获取版本内容失败')
    showCompare.value = false
  } finally {
    compareLoading.value = false
  }
}

// 生成 diff 显示
const generateDiff = () => {
  if (!currentVersion.value || !selectedVersion.value) return

  const oldText = selectedVersion.value.contentMd || ''
  const newText = currentVersion.value.contentMd || ''

  const dmp = new DiffMatchPatch()
  const diffs = dmp.diff_main(oldText, newText)
  dmp.diff_cleanupSemantic(diffs)

  // 将 diff 转换为 HTML
  let html = ''
  for (const [op, text] of diffs) {
    const escapedText = text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/\n/g, '<br>')
    
    if (op === -1) {
      // 删除
      html += `<span class="bg-red-200 dark:bg-red-900 text-red-900 dark:text-red-100 px-1 rounded">${escapedText}</span>`
    } else if (op === 1) {
      // 新增
      html += `<span class="bg-green-200 dark:bg-green-900 text-green-900 dark:text-green-100 px-1 rounded">${escapedText}</span>`
    } else {
      // 相同
      html += escapedText
    }
  }

  diffHtml.value = html || '<p class="text-gray-500 dark:text-gray-400">两个版本内容相同</p>'
}

onMounted(() => {
  fetchVersions()
})
</script>

<style scoped>
:deep(.prose) {
  @apply text-sm;
}

.diff-content {
  font-family: 'Courier New', monospace;
  line-height: 1.8;
  white-space: pre-wrap;
  word-wrap: break-word;
}

.diff-content :deep(span) {
  display: inline;
}
</style>

