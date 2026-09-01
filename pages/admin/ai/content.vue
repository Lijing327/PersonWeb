<template>
  <ClientOnly>
    <div class="admin-ai-content-page p-6">
      <div class="mb-6">
        <h1 class="text-2xl font-bold mb-2">AI 内容预览</h1>
        <p class="text-gray-600 dark:text-gray-400">
          仅用于预览 AI 生成效果，不会写入文章库。正文生产请走 Git / content 或导入脚本。
        </p>
      </div>

      <n-card>
        <n-form
          ref="formRef"
          :model="form"
          :rules="rules"
          label-placement="left"
          label-width="120"
          require-mark-placement="right-hanging"
        >
          <n-form-item label="内容类型" path="type">
            <n-radio-group v-model:value="form.type">
              <n-radio value="article">文章</n-radio>
              <n-radio value="project_intro">项目介绍</n-radio>
              <n-radio value="tool_intro">工具介绍</n-radio>
            </n-radio-group>
          </n-form-item>

          <n-form-item label="标题" path="title">
            <n-input
              v-model:value="form.title"
              placeholder="输入标题（可选，AI 会自动生成）"
              clearable
            />
          </n-form-item>

          <n-form-item label="语气风格" path="tone">
            <n-select
              v-model:value="form.tone"
              :options="toneOptions"
              placeholder="选择语气风格"
            />
          </n-form-item>

          <n-form-item label="目标受众" path="targetAudience">
            <n-input
              v-model:value="form.targetAudience"
              placeholder="例如：技术开发者、产品经理、普通用户等"
              clearable
            />
          </n-form-item>

          <n-form-item label="字数要求" path="length">
            <n-select
              v-model:value="form.length"
              :options="lengthOptions"
              placeholder="选择字数要求"
            />
          </n-form-item>

          <n-form-item label="额外说明" path="extraNotes">
            <n-input
              v-model:value="form.extraNotes"
              type="textarea"
              :rows="3"
              placeholder="补充说明，帮助 AI 更好地理解你的需求"
              clearable
            />
          </n-form-item>

          <n-form-item label="预览说明">
            <n-alert type="info" :bordered="false">
              生成结果仅供复制参考，后台已禁用「保存为文章」等 CMS 写入。
            </n-alert>
          </n-form-item>

          <n-form-item>
            <n-button
              type="primary"
              :loading="generating"
              @click="handleGenerate"
              size="large"
            >
              <template #icon>
                <i class="fas fa-magic"></i>
              </template>
              生成内容
            </n-button>
            <n-button
              class="ml-2"
              @click="handleReset"
              :disabled="generating"
            >
              重置
            </n-button>
          </n-form-item>
        </n-form>
      </n-card>

      <!-- 生成结果 -->
      <n-card v-if="result" class="mt-6">
        <template #header>
          <div class="flex items-center justify-between">
            <h3 class="text-lg font-semibold">生成结果</h3>
            <n-button
              v-if="result.content"
              type="primary"
              @click="handleCopyResult"
            >
              <template #icon>
                <i class="fas fa-copy"></i>
              </template>
              复制 Markdown
            </n-button>
          </div>
        </template>

        <div v-if="result.content" class="space-y-4">
          <div>
            <h4 class="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">标题</h4>
            <p class="text-lg font-semibold">{{ result.content.title }}</p>
          </div>

          <div v-if="result.content.summary">
            <h4 class="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">摘要</h4>
            <p class="text-gray-700 dark:text-gray-300">{{ result.content.summary }}</p>
          </div>

          <div>
            <h4 class="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">正文内容</h4>
            <div class="prose dark:prose-invert max-w-none">
              <div v-html="markdownToHtml(result.content.body)"></div>
            </div>
          </div>
        </div>

        <n-alert v-else-if="result.errorMessage" type="error" class="mt-4">
          {{ result.errorMessage }}
        </n-alert>
      </n-card>
    </div>
  </ClientOnly>
</template>

<script setup lang="ts">
import { NCard, NForm, NFormItem, NInput, NSelect, NRadioGroup, NRadio, NButton, NAlert } from 'naive-ui'
import { useMarkdown } from '~/composables/useMarkdown'

definePageMeta({
  layout: 'admin',
  middleware: 'admin-auth'
})

const api = useApi()
const message = useSafeMessage()
const { markdownToHtml } = useMarkdown()

const formRef = ref<any>(null)
const generating = ref(false)
const result = ref<any>(null)

const form = ref({
  type: 'article',
  title: '',
  tone: 'mature',
  targetAudience: '',
  length: 'medium',
  extraNotes: '',
})

const toneOptions = [
  { label: '成熟专业', value: 'mature' },
  { label: '轻松随意', value: 'casual' },
  { label: '技术导向', value: 'technical' }
]

const lengthOptions = [
  { label: '短篇（500字左右）', value: 'short' },
  { label: '中篇（1000字左右）', value: 'medium' },
  { label: '长篇（2000字以上）', value: 'long' }
]

const rules = {
  type: {
    required: true,
    message: '请选择内容类型',
    trigger: 'change'
  }
}

const handleGenerate = async () => {
  if (!formRef.value) return

  try {
    await formRef.value.validate()
  } catch (e) {
    return
  }

  generating.value = true
  result.value = null

  try {
    const res = await api.post('/ai/content/generate', {
      type: form.value.type,
      title: form.value.title || undefined,
      tone: form.value.tone,
      targetAudience: form.value.targetAudience || undefined,
      length: form.value.length,
      extraNotes: form.value.extraNotes || undefined,
    })

    if (res && res.success) {
      result.value = res
      message.success('内容生成成功！')
    } else {
      result.value = {
        success: false,
        errorMessage: res?.errorMessage || '生成失败，请重试'
      }
      message.error('内容生成失败')
    }
  } catch (e: any) {
    console.error('生成内容失败:', e)
    result.value = {
      success: false,
      errorMessage: e.response?.data?.message || e.message || '生成失败，请重试'
    }
    message.error('内容生成失败')
  } finally {
    generating.value = false
  }
}

const handleReset = () => {
  form.value = {
    type: 'article',
    title: '',
    tone: 'mature',
    targetAudience: '',
    length: 'medium',
    extraNotes: '',
  }
  result.value = null
  formRef.value?.restoreValidation()
}

const handleCopyResult = async () => {
  const body = result.value?.content?.body
  if (!body) return
  try {
    await navigator.clipboard.writeText(body)
    message.success('已复制 Markdown 正文')
  } catch {
    message.error('复制失败，请手动选择复制')
  }
}
</script>

<style scoped>
.admin-ai-content-page {
  max-width: 1200px;
  margin: 0 auto;
}
</style>

