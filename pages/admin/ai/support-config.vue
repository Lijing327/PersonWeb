<template>
  <ClientOnly>
    <!-- 使用 FormPage Pattern 组件 -->
    <FormPage
      title="客服智能体配置"
      description="配置客服智能体的系统提示词和 FAQ 列表"
      :model-value="form"
      :submitting="saving"
      submit-text="保存配置"
      reset-text="重置"
      @update:model-value="handleFormUpdate"
      @submit="handleSave"
      @reset="handleReset"
    >
      <!-- 自定义表单内容 -->
      <template #form="{ value }">
        <n-form
          ref="formRef"
          :model="value"
          label-placement="top"
          require-mark-placement="right-hanging"
        >
          <!-- 系统提示词 -->
          <n-form-item label="系统提示词" path="systemPrompt">
            <n-input
              v-model:value="value.systemPrompt"
              type="textarea"
              :rows="6"
              placeholder="输入客服智能体的系统提示词，用于定义客服的身份和回答风格"
            />
            <template #feedback>
              <span class="form-hint">提示词将作为 AI 的基础指令，影响客服的回答风格和内容</span>
            </template>
          </n-form-item>

          <!-- FAQ 列表 -->
          <n-form-item label="FAQ 列表">
            <div class="faq-list">
              <div
                v-for="(faq, index) in value.faqList"
                :key="index"
                class="faq-item"
              >
                <n-input
                  v-model:value="faq.question"
                  placeholder="问题"
                  class="mb-2"
                />
                <n-input
                  v-model:value="faq.answer"
                  type="textarea"
                  :rows="2"
                  placeholder="答案"
                />
                <n-select
                  v-model:value="faq.category"
                  placeholder="分类"
                  :options="categoryOptions"
                  class="mt-2"
                  style="width: 150px;"
                />
                <n-button
                  text
                  type="error"
                  @click="removeFaq(index)"
                  class="mt-2"
                >
                  <template #icon>
                    <i class="fas fa-trash"></i>
                  </template>
                  删除
                </n-button>
              </div>
              <n-button
                dashed
                block
                @click="addFaq"
                class="mt-2"
              >
                <template #icon>
                  <i class="fas fa-plus"></i>
                </template>
                添加 FAQ
              </n-button>
            </div>
          </n-form-item>
        </n-form>
      </template>
    </FormPage>
  </ClientOnly>
</template>

<script setup lang="ts">
import { NForm, NFormItem, NInput, NButton, NSelect } from 'naive-ui'
import FormPage from '~/components/admin/patterns/FormPage.vue'

definePageMeta({
  layout: 'admin',
  middleware: 'admin-auth'
})

const api = useApi()
const message = useSafeMessage()

const formRef = ref<any>(null)
const saving = ref(false)

const form = ref({
  systemPrompt: '',
  faqList: [] as Array<{ question: string; answer: string; category?: string }>
})

const categoryOptions = [
  { label: '通用', value: 'general' },
  { label: '服务', value: 'service' },
  { label: '价格', value: 'pricing' },
  { label: '工具', value: 'tool' }
]

// 处理表单更新
const handleFormUpdate = (value: typeof form.value) => {
  form.value = { ...value }
}

// 加载配置
const loadConfig = async () => {
  try {
    const res = await api.get('/admin/ai/support-config')
    if (res) {
      form.value.systemPrompt = res.systemPrompt || ''
      form.value.faqList = res.faqList || []
    }
  } catch (e: any) {
    console.error('加载配置失败:', e)
    message.error('加载配置失败')
  }
}

// 保存配置
const handleSave = async () => {
  saving.value = true
  try {
    await api.post('/admin/ai/support-config', {
      systemPrompt: form.value.systemPrompt,
      faqList: form.value.faqList
    })
    message.success('配置保存成功')
  } catch (e: any) {
    console.error('保存配置失败:', e)
    message.error(e.response?.data?.message || e.message || '保存配置失败')
  } finally {
    saving.value = false
  }
}

// 重置
const handleReset = () => {
  loadConfig()
}

// 添加 FAQ
const addFaq = () => {
  form.value.faqList.push({
    question: '',
    answer: '',
    category: 'general'
  })
}

// 删除 FAQ
const removeFaq = (index: number) => {
  form.value.faqList.splice(index, 1)
}

onMounted(() => {
  loadConfig()
})

useHead({
  title: '客服智能体配�?- 后台管理',
  meta: [
    { name: 'description', content: '配置客服智能体的系统提示词和 FAQ 列表' }
  ]
})
</script>

<style scoped>
/* FAQ 列表样式 */
.faq-list {
  width: 100%;
}

.faq-item {
  padding: var(--spacing-lg);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: var(--radius-md);
  margin-bottom: var(--spacing-lg);
  background: rgba(255, 255, 255, 0.02);
}

.form-hint {
  font-size: var(--text-sm);
  color: var(--color-text-muted);
}
</style>

