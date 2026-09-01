<template>
  <div class="timeline-page">
    <div class="page-header">
      <h1 class="page-title">成长轨迹管理</h1>
      <n-button type="primary" @click="showCreateModal = true">
        <template #icon>
          <i class="fas fa-plus"></i>
        </template>
        新建事件
      </n-button>
    </div>

    <!-- 列表 -->
    <div class="events-list">
      <n-card v-for="event in events" :key="event.id">
        <div class="event-content">
          <div class="event-main">
            <div
              class="event-icon"
              :style="{ backgroundColor: event.color || 'var(--color-primary, var(--color-primary))' }"
            >
              {{ event.icon || '📝' }}
            </div>
            <div class="event-info">
              <div class="event-header">
                <span class="event-title">{{ event.title }}</span>
                <n-tag type="info" size="small">{{ event.year }}</n-tag>
              </div>
              <p class="event-description">{{ event.description }}</p>
            </div>
          </div>
          <div class="event-actions">
            <n-button size="small" type="primary" quaternary @click="editEvent(event)">
              编辑
            </n-button>
            <ClientOnly>
              <n-popconfirm @positive-click="deleteEvent(event.id)">
                <template #trigger>
                  <n-button size="small" type="error" quaternary>删除</n-button>
                </template>
                确定要删除吗？?              </n-popconfirm>
              <template #fallback>
                <n-button size="small" type="error" quaternary @click="() => { if(confirm('确定要删除吗？')) deleteEvent(event.id) }">删除</n-button>
              </template>
            </ClientOnly>
          </div>
        </div>
      </n-card>
      <n-empty v-if="events.length === 0" description="暂无时间线事件" />
    </div>

    <!-- 创建/编辑模态框 -->
    <n-modal
      v-model:show="isModalVisible"
      preset="card"
      title="编辑时间线"
      style="width: 600px"
    >
      <n-form
        ref="formRef"
        :model="form"
        :rules="rules"
        label-placement="left"
        label-width="100"
      >
        <n-form-item label="年份" path="year">
          <n-input-number v-model:value="form.year" :min="1900" :max="2100" style="width: 100%" />
        </n-form-item>
        <n-form-item label="标题" path="title">
          <n-input v-model:value="form.title" placeholder="请输入标题" />
        </n-form-item>
        <n-form-item label="描述" path="description">
          <n-input
            v-model:value="form.description"
            type="textarea"
            :rows="3"
            placeholder="请输入描述"
          />
        </n-form-item>
        <n-form-item label="图标（emoji）" path="icon">
          <n-input v-model:value="form.icon" placeholder="例如: 🚀" />
        </n-form-item>
        <n-form-item label="颜色" path="color">
          <n-color-picker v-model:value="form.color" />
        </n-form-item>
      </n-form>
      <template #footer>
        <div style="display: flex; justify-content: flex-end; gap: 12px">
          <n-button quaternary @click="cancelEdit">取消</n-button>
          <n-button type="primary" @click="saveEvent">保存</n-button>
        </div>
      </template>
    </n-modal>
  </div>
</template>

<script setup lang="ts">
import { NButton, NCard, NTag, NPopconfirm, NModal, NForm, NFormItem, NInput, NInputNumber, NColorPicker, NEmpty, type FormInst, type FormRules } from 'naive-ui'
import type { TimelineEvent, TimelineEventRequest } from '~/types/api'
import { useSafeMessage } from '~/composables/useNaiveUI'
import { useErrorHandler } from '~/composables/useErrorHandler'

definePageMeta({
  layout: 'admin',
  middleware: 'admin-auth'
})

const api = useApi()
const { handleError } = useErrorHandler()

// 使用安全�?Naive UI composables，避�?provider 未挂载时的错�?const message = useSafeMessage()

const events = ref<TimelineEvent[]>([])
const loading = ref(false)
const showCreateModal = ref(false)
<TimelineEvent | null>(null)
const formRef = ref<FormInst | null>(null)
const form = ref({
  year: new Date().getFullYear(),
  title: '',
  description: '',
  icon: '📝',
  color: 'var(--color-primary, var(--color-primary))'
})

// 模态框显示状态（计算属性）
const isModalVisible = computed({
  get: () => showCreateModal.value || !!editingEvent.value,
  set: (value: boolean) => {
    if (!value) {
      showCreateModal.value = false
      editingEvent.value = null
    }
  }
})

// 表单验证规则
const rules: FormRules = {
  year: {
    required: true,
    type: 'number',
    message: '请输入年份',
    trigger: 'blur'
  },
  title: {
    required: true,
    message: '请输入标题',
    trigger: 'blur'
  }
}

const fetchEvents = async () => {
  loading.value = true
  try {
    const res = await api.get<TimelineEvent[] | { List: TimelineEvent[] }>('/Timeline')
    if (Array.isArray(res)) {
      events.value = res
    } else if (res && 'List' in res) {
      events.value = res.List
    }
  } catch (e) {
    if (process.env.NODE_ENV === 'development') {
      console.error('Failed to fetch timeline:', e)
    }
    message.error('加载时间线事件失败')
  } finally {
    loading.value = false
  }
}

const editEvent = (event: TimelineEvent) => {
  editingEvent.value = event
  form.value = {
    year: event.year,
    title: event.title,
    description: event.description || '',
    icon: event.icon || '📝',
    color: event.color || 'var(--color-primary, var(--color-primary))'
  }
}

const saveEvent = async () => {
  if (!formRef.value) return
  
  await formRef.value.validate((errors) => {
    if (!errors) {
      submitEvent()
    }
  })
}

const submitEvent = async () => {
  try {
    const payload: TimelineEventRequest = {
      year: form.value.year,
      title: form.value.title,
      description: form.value.description || undefined,
      icon: form.value.icon || undefined,
      color: form.value.color || undefined
    }
    
    if (editingEvent.value) {
      await api.put(`/Timeline/${editingEvent.value.id}`, payload)
    } else {
      await api.post('/Timeline', payload)
    }

    message.success('保存成功')
    cancelEdit()
    fetchEvents()
  } catch (e: unknown) {
    handleError(e, '保存失败')
  }
}

const deleteEvent = async (id: number) => {
  try {
    await api.delete(`/Timeline/${id}`)
    message.success('删除成功')
    fetchEvents()
  } catch (e: unknown) {
    handleError(e, '删除失败')
  }
}

const cancelEdit = () => {
  showCreateModal.value = false
  editingEvent.value = null
  form.value = {
    year: new Date().getFullYear(),
    title: '',
    description: '',
    icon: '📝',
    color: 'var(--color-primary, var(--color-primary))'
  }
}

onMounted(() => {
  fetchEvents()
})
</script>

<style scoped>
.timeline-page {
  width: 100%;
}

.events-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

/* event-card 样式已移除，�?themeOverrides.Card 统一控制 */

.event-content {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
}

.event-main {
  display: flex;
  align-items: flex-start;
  gap: 1rem;
  flex: 1;
}

.event-icon {
  width: 3rem;
  height: 3rem;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.25rem;
  flex-shrink: 0;
}

.event-info {
  flex: 1;
}

.event-header {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 0.5rem;
}

.event-title {
  font-size: 1.125rem;
  font-weight: 700;
  color: var(--color-text-main);
}

.event-description {
  color: var(--color-text-muted);
  margin: 0;
  font-weight: 500;
  line-height: 1.6;
}

.event-actions {
  display: flex;
  gap: 0.5rem;
  align-items: center;
}
</style>

