<template>
  <ClientOnly>
    <div class="thought-detail-page">
      <div class="page-header">
        <h1 class="page-title">思维记录详情</h1>
        <n-button quaternary @click="() => router.push('/admin/thoughts')">
          <template #icon>
            <i class="fas fa-arrow-left"></i>
          </template>
          返回列表
        </n-button>
      </div>

      <div v-if="loading && !detail" class="loading-wrap">
        <n-spin size="large" />
      </div>
      <div v-else-if="!detail" class="empty-wrap">
        <n-empty description="记录不存在或已删除" />
      </div>
      <div v-else class="detail-layout">
        <!-- 左侧：原文编辑 -->
        <div class="panel left-panel">
          <div class="panel-title">原文</div>
          <n-input
            v-model:value="localContent"
            type="textarea"
            :rows="18"
            placeholder="在此写下你的思考..."
          />
          <div class="actions">
            <n-button type="primary" :loading="saving" @click="handleSave">
              <template #icon>
                <i class="fas fa-save"></i>
              </template>
              保存
            </n-button>
            <n-button type="info" :loading="requestingComment" @click="handleRequestAiComment">
              <template #icon>
                <i class="fas fa-magic"></i>
              </template>
              请求 AI 批注
            </n-button>
          </div>
        </div>
        <!-- 右侧：AI 批注 Markdown -->
        <div class="panel right-panel">
          <div class="panel-title">AI 批注</div>
          <div v-if="detail.aiComment" class="markdown-body" v-html="renderedComment" />
          <div v-else class="empty-comment">
            <n-empty description="暂无批注，点击左侧「请求 AI 批注」生成" />
          </div>
        </div>
      </div>
    </div>
  </ClientOnly>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import { NButton, NInput, NSpin, NEmpty } from 'naive-ui'
import { useRoute, useRouter } from 'vue-router'
import { useApi } from '~/composables/useApi'
import { useNotification } from '~/composables/useToast'
import { useErrorHandler } from '~/composables/useErrorHandler'
import { useMarkdown } from '~/composables/useMarkdown'

definePageMeta({
  layout: 'admin',
  middleware: 'admin-auth'
})

const route = useRoute()
const router = useRouter()
const api = useApi()
const { success, error } = useNotification()
const { handleError } = useErrorHandler()
const { parse: parseMarkdown } = useMarkdown()

const id = computed(() => Number(route.params.id))
const loading = ref(true)
const saving = ref(false)
const requestingComment = ref(false)
const detail = ref<{
  id: number
  content: string
  aiComment: string | null
  status: number
  createdAt: string
  updatedAt: string
} | null>(null)
const localContent = ref('')

const renderedComment = computed(() => {
  const comment = detail.value?.aiComment
  if (!comment) return ''
  return parseMarkdown(comment)
})

watch(detail, (d) => {
  if (d) localContent.value = d.content
}, { immediate: true })

const fetchDetail = async () => {
  if (!id.value) return
  loading.value = true
  try {
    const res = await api.get<any>(`/thoughts/${id.value}`)
    const d = res as any
    if (!d) {
      detail.value = null
      return
    }
    detail.value = {
      id: d.Id ?? d.id,
      content: d.Content ?? d.content ?? '',
      aiComment: d.AiComment ?? d.aiComment ?? null,
      status: d.Status ?? d.status ?? 0,
      createdAt: d.CreatedAt ?? d.createdAt,
      updatedAt: d.UpdatedAt ?? d.updatedAt
    }
    localContent.value = detail.value.content
  } catch (e) {
    handleError(e, '加载失败')
    detail.value = null
  } finally {
    loading.value = false
  }
}

const handleSave = async () => {
  if (!id.value || !detail.value) return
  saving.value = true
  try {
    await api.put(`/thoughts/${id.value}`, { content: localContent.value })
    detail.value = { ...detail.value!, content: localContent.value }
    success('已保存')
  } catch (e) {
    handleError(e, '保存失败')
  } finally {
    saving.value = false
  }
}

const handleRequestAiComment = async () => {
  if (!id.value) return
  if (!localContent.value?.trim()) {
    error('请先填写原文并保存后再请求批注')
    return
  }
  requestingComment.value = true
  try {
    const res = await api.post<any>(`/thoughts/${id.value}/ai-comment`)
    const d = res as any
    if (d && detail.value) {
      detail.value.aiComment = d.AiComment ?? d.aiComment ?? ''
      detail.value.status = d.Status ?? d.status ?? 1
      detail.value.updatedAt = d.UpdatedAt ?? d.updatedAt ?? ''
      success('AI 批注已生成')
    }
  } catch (e: any) {
    const msg = e?.message || e?.data?.message || 'AI 批注请求失败'
    error(msg)
  } finally {
    requestingComment.value = false
  }
}

onMounted(() => {
  fetchDetail()
})
</script>

<style scoped>
.thought-detail-page {
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
.loading-wrap,
.empty-wrap {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 200px;
}
.detail-layout {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
  align-items: start;
}
@media (max-width: 900px) {
  .detail-layout {
    grid-template-columns: 1fr;
  }
}
.panel {
  background: var(--n-color-modal, var(--color-bg-light, white));
  border-radius: 8px;
  padding: 1rem;
  border: 1px solid var(--n-border-color, var(--color-border));
}
.panel-title {
  font-weight: 600;
  margin-bottom: 0.75rem;
}
.actions {
  display: flex;
  gap: 0.5rem;
  margin-top: 0.75rem;
}
.markdown-body {
  min-height: 200px;
  line-height: 1.6;
  word-break: break-word;
}
.markdown-body :deep(p) { margin: 0.5em 0; }
.markdown-body :deep(ul), .markdown-body :deep(ol) { margin: 0.5em 0; padding-left: 1.5em; }
.markdown-body :deep(h1), .markdown-body :deep(h2), .markdown-body :deep(h3) { margin: 0.75em 0 0.25em; }
.empty-comment {
  min-height: 200px;
  display: flex;
  align-items: center;
  justify-content: center;
}
</style>
