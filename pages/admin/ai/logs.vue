<template>
  <ClientOnly>
    <div class="admin-ai-logs-page p-6">
      <div class="mb-6">
        <h1 class="text-2xl font-bold mb-2">AI 调用日志</h1>
        <p class="text-gray-600 dark:text-gray-400">
          记录后台 AI 功能调用 Python ai-service 的结果，便于排查「AI 不回复 / 生成失败」等问题。
        </p>
      </div>

      <n-alert v-if="statusHint" type="warning" class="mb-6" :title="statusHint" />

      <n-card class="mb-6 help-card">
        <template #header>
          <span class="font-semibold">怎么看这条日志？</span>
        </template>
        <ul class="help-list">
          <li><strong>成功</strong>：AI 服务正常返回，可展开查看原始请求/响应。</li>
          <li><strong>失败</strong>：先看「原因说明」，常见是 ai-service 未启动或 Token 不一致（401）。</li>
          <li><strong>智能体</strong>：Content=内容生成，Support=客服问答，Demo=Demo 上架，Lead=线索处理。</li>
        </ul>
      </n-card>

      <!-- 筛选栏 -->
      <n-card class="mb-6">
        <div class="filters-bar">
          <n-select
            v-model:value="filterAgentType"
            placeholder="智能体类型"
            clearable
            style="width: 200px;"
            :options="agentTypeOptions"
          />
          <n-select
            v-model:value="filterSuccess"
            placeholder="状态"
            clearable
            style="width: 150px;"
            :options="successOptions"
          />
          <n-button type="primary" @click="handleSearch">搜索</n-button>
          <n-button quaternary @click="handleReset">重置</n-button>
        </div>
      </n-card>

      <!-- 日志列表 -->
      <n-card>
        <template #header>
          <div class="flex items-center justify-between">
            <h3 class="text-lg font-semibold">调用记录</h3>
            <n-button text size="small" @click="fetchLogs" :loading="loading">
              <template #icon>
                <i class="fas fa-sync-alt"></i>
              </template>
              刷新
            </n-button>
          </div>
        </template>

        <div v-if="loading" class="text-center py-8">
          <n-spin size="large" />
        </div>
        <div v-else-if="logs.length === 0" class="text-center py-8 text-gray-500">
          暂无日志记录
        </div>
        <div v-else class="logs-list">
          <div
            v-for="log in logs"
            :key="log.id"
            class="log-item"
            :class="{ 'log-item-error': !log.success }"
          >
            <div class="log-header">
              <div class="log-meta">
                <n-tag :type="log.success ? 'success' : 'error'" size="small">
                  {{ log.success ? '成功' : '失败' }}
                </n-tag>
                <n-tag type="info" size="small">{{ getAiAgentTypeLabel(log.agentType) }}</n-tag>
                <span class="log-time">{{ formatDate(log.createdAt) }}</span>
              </div>
            </div>

            <p class="log-summary">{{ summarizeAiLogRequest(log.requestPayload) }}</p>
            <p class="log-result" :class="{ 'log-result-error': !log.success }">
              {{ summarizeAiLogResponse(log) }}
            </p>

            <div v-if="!log.success && log.errorMessage" class="log-error">
              <i class="fas fa-exclamation-circle"></i>
              <div>
                <div class="log-error-title">原因说明</div>
                <div>{{ explainAiLogError(log.errorMessage) }}</div>
                <details v-if="log.errorMessage !== explainAiLogError(log.errorMessage)" class="log-raw-error">
                  <summary>查看原始错误</summary>
                  <code>{{ log.errorMessage }}</code>
                </details>
              </div>
            </div>

            <div class="log-details">
              <n-collapse>
                <n-collapse-item title="技术详情：请求参数" name="request">
                  <pre class="log-json">{{ formatJson(log.requestPayload) }}</pre>
                </n-collapse-item>
                <n-collapse-item title="技术详情：响应内容" name="response">
                  <pre class="log-json">{{ formatJson(log.responsePayload) }}</pre>
                </n-collapse-item>
              </n-collapse>
            </div>
          </div>
        </div>

        <!-- 分页 -->
        <div v-if="pagination.itemCount > 0" class="mt-4 flex justify-between items-center">
          <div class="text-sm text-gray-500">
            共 {{ pagination.itemCount }} 条记录
          </div>
          <n-pagination
            v-model:page="pagination.page"
            :page-size="pagination.pageSize"
            :item-count="pagination.itemCount"
            show-size-picker
            :page-sizes="[10, 20, 50, 100]"
            @update:page="handlePageChange"
            @update:page-size="handlePageSizeChange"
          />
        </div>
      </n-card>
    </div>
  </ClientOnly>
</template>

<script setup lang="ts">
import { NAlert, NCard, NSelect, NButton, NTag, NCollapse, NCollapseItem, NPagination, NSpin } from 'naive-ui'
import {
  explainAiLogError,
  getAiAgentTypeLabel,
  getAiLogStatusHint,
  summarizeAiLogRequest,
  summarizeAiLogResponse,
  type AiLogRecord,
} from '~/utils/ai-log-display'

definePageMeta({
  layout: 'admin',
  middleware: 'admin-auth'
})

const api = useApi()
const message = useSafeMessage()

const loading = ref(false)
const logs = ref<AiLogRecord[]>([])
const filterAgentType = ref<string | null>(null)
const filterSuccess = ref<boolean | null>(null)

const pagination = ref({
  page: 1,
  pageSize: 20,
  itemCount: 0
})

const agentTypeOptions = [
  { label: '内容生成', value: 'Content' },
  { label: '客服问答', value: 'Support' },
  { label: 'Demo 上架', value: 'Demo' },
  { label: '线索处理', value: 'Lead' },
]

const successOptions = [
  { label: '成功', value: true },
  { label: '失败', value: false }
]

const statusHint = computed(() => getAiLogStatusHint(logs.value))

const fetchLogs = async () => {
  loading.value = true
  try {
    const res = await api.get<{ list?: AiLogRecord[]; total?: number } | AiLogRecord[]>('/ai/logs', {
      params: {
        agentType: filterAgentType.value,
        success: filterSuccess.value,
        page: pagination.value.page,
        pageSize: pagination.value.pageSize
      }
    })

    if (Array.isArray(res)) {
      logs.value = res
      pagination.value.itemCount = res.length
    } else if (res?.list) {
      logs.value = res.list
      pagination.value.itemCount = res.total ?? res.list.length
    } else {
      logs.value = []
      pagination.value.itemCount = 0
    }
  } catch (e: unknown) {
    console.error('获取日志失败:', e)
    message.error('获取日志失败')
    logs.value = []
  } finally {
    loading.value = false
  }
}

const handleSearch = () => {
  pagination.value.page = 1
  fetchLogs()
}

const handleReset = () => {
  filterAgentType.value = null
  filterSuccess.value = null
  pagination.value.page = 1
  fetchLogs()
}

const handlePageChange = (page: number) => {
  pagination.value.page = page
  fetchLogs()
}

const handlePageSizeChange = (pageSize: number) => {
  pagination.value.pageSize = pageSize
  pagination.value.page = 1
  fetchLogs()
}

const formatDate = (dateString?: string) => {
  if (!dateString) return '-'
  return new Date(dateString).toLocaleString('zh-CN')
}

const formatJson = (jsonStr: string | null | undefined) => {
  if (!jsonStr) return '（无）'
  try {
    const obj = JSON.parse(jsonStr)
    return JSON.stringify(obj, null, 2)
  } catch {
    return jsonStr
  }
}

onMounted(() => {
  fetchLogs()
})

useHead({
  title: 'AI 调用日志 - 后台管理',
  meta: [
    { name: 'description', content: 'AI 智能体调用日志查看' }
  ]
})
</script>

<style scoped>
.admin-ai-logs-page {
  max-width: 1400px;
  margin: 0 auto;
}

.help-card :deep(.n-card__content) {
  padding-top: 0;
}

.help-list {
  margin: 0;
  padding-left: 1.25rem;
  color: var(--color-text-muted);
  line-height: 1.7;
}

.filters-bar {
  display: flex;
  gap: var(--spacing-3);
  align-items: center;
  flex-wrap: wrap;
}

.logs-list {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-4);
}

.log-item {
  padding: var(--spacing-4);
  border: var(--spacing-px) solid var(--n-border-color);
  border-radius: var(--radius-md);
  background: var(--n-color);
  transition: all 0.2s;
}

.log-item:hover {
  box-shadow: var(--shadow-sm, 0 var(--spacing-0_5) var(--spacing-3) var(--shadow));
}

.log-item-error {
  border-color: var(--color-error, var(--color-danger));
  background: var(--color-error-soft, rgba(239, 68, 68, 0.05));
}

.log-header {
  margin-bottom: var(--spacing-2);
}

.log-meta {
  display: flex;
  align-items: center;
  gap: var(--spacing-3);
  flex-wrap: wrap;
}

.log-time {
  font-size: var(--text-sm);
  color: var(--n-text-color-2);
}

.log-summary {
  margin: 0 0 var(--spacing-2);
  color: var(--color-text-main);
  line-height: 1.6;
}

.log-result {
  margin: 0 0 var(--spacing-3);
  color: var(--color-text-muted);
  font-size: var(--text-sm);
}

.log-result-error {
  color: var(--color-error-hover, var(--color-danger-600));
}

.log-error {
  padding: var(--spacing-3);
  background: var(--color-error-soft, rgba(239, 68, 68, 0.1));
  border-left: var(--spacing-0_5) solid var(--color-error, var(--color-danger));
  border-radius: var(--radius-sm);
  color: var(--color-error-hover, var(--color-danger-600));
  margin-bottom: var(--spacing-3);
  display: flex;
  align-items: flex-start;
  gap: var(--spacing-2);
}

.log-error-title {
  font-weight: 600;
  margin-bottom: var(--spacing-1);
}

.log-raw-error {
  margin-top: var(--spacing-2);
  font-size: var(--text-xs);
  color: var(--color-text-muted);
}

.log-raw-error code {
  display: block;
  margin-top: var(--spacing-1);
  white-space: pre-wrap;
  word-break: break-all;
}

.log-details {
  margin-top: var(--spacing-3);
}

.log-json {
  background: var(--n-color);
  padding: var(--spacing-3);
  border-radius: var(--radius-sm);
  font-size: var(--text-xs);
  overflow-x: auto;
  max-height: 400px;
  overflow-y: auto;
}
</style>
