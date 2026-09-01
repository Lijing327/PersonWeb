<template>
  <div class="relation-detail-page">
    <div v-if="loading" class="loading-container">
      <n-spin size="large" />
    </div>

    <div v-else-if="!person" class="empty-container">
      <n-result status="404" title="对象不存在" description="请检查 URL 是否正确">
        <template #footer>
          <n-button @click="router.push('/admin/relations')">返回列表</n-button>
        </template>
      </n-result>
    </div>

    <div v-else class="detail-content">
      <!-- 页头 -->
      <div class="page-header">
        <div>
          <n-button quaternary @click="router.push('/admin/relations')">
            <template #icon>
              <i class="fas fa-arrow-left"></i>
            </template>
            返回
          </n-button>
          <h1 class="page-title">{{ person.nickname }}</h1>
        </div>
        <n-button type="primary" @click="showEditModal = true">
          <template #icon>
            <i class="fas fa-edit"></i>
          </template>
          编辑
        </n-button>
      </div>

      <!-- Tab 切换 -->
      <n-tabs v-model:value="activeTab" type="line" animated>
        <!-- 概览 Tab -->
        <n-tab-pane name="overview" tab="概览">
          <n-card>
            <n-descriptions :column="2" bordered>
              <n-descriptions-item label="昵称">{{ person.nickname }}</n-descriptions-item>
              <n-descriptions-item label="来源">{{ person.source || '-' }}</n-descriptions-item>
              <n-descriptions-item label="城市">{{ person.city || '-' }}</n-descriptions-item>
              <n-descriptions-item label="阶段">
                <n-tag :type="getStageTag(person.stage)">{{ getStageText(person.stage) }}</n-tag>
              </n-descriptions-item>
              <n-descriptions-item label="热度分数">
                <n-progress
                  :percentage="person.heatScore"
                  :status="person.heatScore > 70 ? 'success' : person.heatScore > 40 ? 'default' : 'error'"
                />
              </n-descriptions-item>
              <n-descriptions-item label="最后联系">
                {{ person.lastContactAt ? formatTime(person.lastContactAt) : '-' }}
              </n-descriptions-item>
              <n-descriptions-item label="最后见面">
                {{ person.lastMeetAt ? formatTime(person.lastMeetAt) : '-' }}
              </n-descriptions-item>
              <n-descriptions-item label="提醒时间">
                {{ person.remindAt ? formatTime(person.remindAt) : '-' }}
              </n-descriptions-item>
              <n-descriptions-item label="标签" :span="2">
                <n-tag
                  v-for="tag in person.tags"
                  :key="tag"
                  style="margin-right: 8px;"
                >
                  {{ tag }}
                </n-tag>
                <span v-if="!person.tags || person.tags.length === 0">-</span>
              </n-descriptions-item>
              <n-descriptions-item label="喜好/雷点" :span="2">
                {{ person.preferences || '-' }}
              </n-descriptions-item>
              <n-descriptions-item label="下一步行动" :span="2">
                <div v-if="person.nextAction" class="next-action-text">
                  {{ person.nextAction }}
                </div>
                <span v-else>-</span>
              </n-descriptions-item>
              <n-descriptions-item label="备注" :span="2">
                {{ person.notes || '-' }}
              </n-descriptions-item>
            </n-descriptions>
          </n-card>
        </n-tab-pane>

        <!-- 时间线 Tab -->
        <n-tab-pane name="timeline" tab="时间线">
          <InteractionTimeline
            :interactions="interactions"
            @add="handleAddInteraction"
            @edit="handleEditInteraction"
            @delete="handleDeleteInteraction"
          />
        </n-tab-pane>

        <!-- 任务 Tab -->
        <n-tab-pane name="tasks" tab="任务">
          <TaskList
            :tasks="tasks"
            @add="handleAddTask"
            @edit="handleEditTask"
            @delete="handleDeleteTask"
            @toggle="handleToggleTask"
          />
        </n-tab-pane>
      </n-tabs>
    </div>

    <!-- 编辑对象 Modal -->
    <AddPersonModal
      v-model:show="showEditModal"
      :person="person"
      @success="handlePersonUpdate"
    />

    <!-- 新增/编辑互动 Modal -->
    <AddInteractionModal
      v-model:show="showInteractionModal"
      :person-id="personId"
      :person="person"
      :interaction="currentInteraction"
      @success="handleInteractionSuccess"
    />

    <!-- 新增/编辑任务 Modal -->
    <n-modal
      v-model:show="showTaskModal"
      preset="card"
      :title="currentTask ? '编辑任务' : '新增任务'"
      style="width: 500px"
    >
      <n-form ref="taskFormRef" :model="taskForm" :rules="taskRules" label-placement="left" label-width="80px">
        <n-form-item label="任务标题" path="title">
          <n-input v-model:value="taskForm.title" placeholder="请输入任务标题" />
        </n-form-item>
        <n-form-item label="截止时间" path="dueAt">
          <n-date-picker
            v-model:value="taskForm.dueAt"
            type="datetime"
            format="yyyy-MM-dd HH:mm"
            placeholder="请选择截止时间"
            style="width: 100%"
            clearable
          />
        </n-form-item>
        <n-form-item label="优先级" path="priority">
          <n-select v-model:value="taskForm.priority" :options="priorityOptions" />
        </n-form-item>
      </n-form>
      <template #footer>
        <div style="display: flex; justify-content: flex-end; gap: 8px;">
          <n-button @click="showTaskModal = false">取消</n-button>
          <n-button type="primary" :loading="taskLoading" @click="handleSaveTask">保存</n-button>
        </div>
      </template>
    </n-modal>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import {
  NCard,
  NButton,
  NTabs,
  NTabPane,
  NDescriptions,
  NDescriptionsItem,
  NTag,
  NProgress,
  NSpin,
  NResult,
  NModal,
  NForm,
  NFormItem,
  NInput,
  NSelect,
  NDatePicker,
  useMessage,
  useDialog,
  type FormInst
} from 'naive-ui'
import InteractionTimeline from '~/components/relations/InteractionTimeline.vue'
import TaskList from '~/components/relations/TaskList.vue'
import AddPersonModal from '~/components/relations/modals/AddPersonModal.vue'
import AddInteractionModal from '~/components/relations/modals/AddInteractionModal.vue'
import {
  useRelationsApi,
  type RelationPerson,
  type RelationInteraction,
  type RelationTask
} from '~/composables/useRelationsApi'

definePageMeta({
  layout: 'admin',
  middleware: 'admin-auth'
})

const route = useRoute()
const router = useRouter()
const relationsApi = useRelationsApi()

// 延迟初始化 message 和 dialog，避免 SSR 错误
const message = ref<ReturnType<typeof useMessage> | null>(null)
const dialog = ref<ReturnType<typeof useDialog> | null>(null)

// 延迟初始化 message 和 dialog（在 onMounted 中初始化，确保在组件挂载后）

// 辅助函数：安全地使用 message
const showMessage = {
  success: (content: string) => message.value?.success(content),
  error: (content: string) => message.value?.error(content),
  warning: (content: string) => message.value?.warning(content),
  info: (content: string) => message.value?.info(content)
}

// 辅助函数：安全地使用 dialog
const showDialog = {
  warning: (options: any) => dialog.value?.warning(options),
  info: (options: any) => dialog.value?.info(options),
  error: (options: any) => dialog.value?.error(options),
  success: (options: any) => dialog.value?.success(options)
}

const personId = computed(() => route.params.id as string)
const loading = ref(false)
const person = ref<RelationPerson | null>(null)
const interactions = ref<RelationInteraction[]>([])
const tasks = ref<RelationTask[]>([])
const activeTab = ref('overview')
const showEditModal = ref(false)
const showInteractionModal = ref(false)
const showTaskModal = ref(false)
const currentInteraction = ref<RelationInteraction | null>(null)
const currentTask = ref<RelationTask | null>(null)
const taskLoading = ref(false)
const taskFormRef = ref<FormInst | null>(null)

const taskForm = reactive({
  title: '',
  dueAt: null as number | null,
  priority: 1
})

const taskRules = {
  title: {
    required: true,
    message: '请输入任务标题',
    trigger: 'blur'
  }
}

const priorityOptions = [
  { label: '低', value: 0 },
  { label: '中', value: 1 },
  { label: '高', value: 2 },
  { label: '紧急', value: 3 }
]

const stages = ['新认识', '熟悉中', '准备约见', '已见面', '升温中', '观察期', '已结束']

const getStageText = (stage: number) => {
  return stages[stage] || '未知'
}

const getStageTag = (stage: number): 'default' | 'success' | 'warning' | 'error' | 'info' => {
  const types: Record<number, 'default' | 'success' | 'warning' | 'error' | 'info'> = {
    0: 'default',
    1: 'info',
    2: 'warning',
    3: 'success',
    4: 'success',
    5: 'warning',
    6: 'error'
  }
  return types[stage] || 'default'
}

const formatTime = (timeStr: string) => {
  const time = new Date(timeStr)
  return time.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  })
}

const loadPerson = async () => {
  loading.value = true
  try {
    person.value = await relationsApi.getPerson(personId.value)
  } catch (error: any) {
    showMessage.error(error.message || '加载失败')
  } finally {
    loading.value = false
  }
}

const loadInteractions = async () => {
  try {
    interactions.value = await relationsApi.getInteractions(personId.value)
  } catch (error: any) {
    showMessage.error(error.message || '加载互动记录失败')
  }
}

const loadTasks = async () => {
  try {
    const result = await relationsApi.getTasks(personId.value)
    // 确保 result 是数组
    if (Array.isArray(result)) {
      tasks.value = result
    } else if (result && (result as any).data && Array.isArray((result as any).data)) {
      // 兼容可能嵌套的响应格式
      tasks.value = (result as any).data
    } else {
      tasks.value = []
    }
    console.log('加载任务成功:', tasks.value.length, '个任务')
  } catch (error: any) {
    console.error('加载任务失败:', error)
    showMessage.error(error.message || '加载任务失败')
    tasks.value = [] // 确保出错时是空数组
  }
}

const handlePersonUpdate = async () => {
  await loadPerson()
}

const handleAddInteraction = () => {
  currentInteraction.value = null
  showInteractionModal.value = true
}

const handleEditInteraction = (interaction: RelationInteraction) => {
  currentInteraction.value = interaction
  showInteractionModal.value = true
}

const handleDeleteInteraction = async (id: string) => {
  try {
    await relationsApi.deleteInteraction(id)
    showMessage.success('删除成功')
    await loadInteractions()
    await loadPerson() // 重新加载对象信息，因为最后联系时间可能变化
  } catch (error: any) {
    showMessage.error(error.message || '删除失败')
  }
}

const handleInteractionSuccess = async () => {
  await loadInteractions()
  await loadPerson()
}

const handleAddTask = () => {
  currentTask.value = null
  taskForm.title = ''
  taskForm.dueAt = null
  taskForm.priority = 1
  showTaskModal.value = true
}

const handleEditTask = (task: RelationTask) => {
  currentTask.value = task
  taskForm.title = task.title
  taskForm.dueAt = task.dueAt ? new Date(task.dueAt).getTime() : null
  taskForm.priority = task.priority
  showTaskModal.value = true
}

const handleSaveTask = async () => {
  if (!taskFormRef.value) return

  await taskFormRef.value.validate(async (errors) => {
    if (errors) return

    taskLoading.value = true
    try {
      if (currentTask.value) {
        // 编辑
        await relationsApi.updateTask(currentTask.value.id, {
          title: taskForm.title,
          dueAt: taskForm.dueAt ? new Date(taskForm.dueAt).toISOString() : undefined,
          priority: taskForm.priority
        })
        showMessage.success('更新成功')
      } else {
        // 新增
        const result = await relationsApi.createTask(personId.value, {
          title: taskForm.title,
          dueAt: taskForm.dueAt ? new Date(taskForm.dueAt).toISOString() : undefined,
          priority: taskForm.priority
        })
        console.log('创建任务成功:', result)
        showMessage.success('创建成功')
      }
      showTaskModal.value = false
      await loadTasks()
    } catch (error: any) {
      console.error('保存任务失败:', error)
      showMessage.error(error.message || '操作失败')
    } finally {
      taskLoading.value = false
    }
  })
}

const handleDeleteTask = async (id: string) => {
  try {
    await relationsApi.deleteTask(id)
    showMessage.success('删除成功')
    await loadTasks()
  } catch (error: any) {
    showMessage.error(error.message || '删除失败')
  }
}

const handleToggleTask = async (task: RelationTask) => {
  try {
    const newStatus = task.status === 1 ? 0 : 1
    await relationsApi.updateTask(task.id, { status: newStatus })
    await loadTasks()
  } catch (error: any) {
      showMessage.error(error.message || '操作失败')
  }
}

onMounted(async () => {
  // 初始化 message 和 dialog
  message.value = useMessage()
  dialog.value = useDialog()
  
  await loadPerson()
  await loadInteractions()
  await loadTasks()
})
</script>

<style scoped>
.relation-detail-page {
  padding: 24px;
}

.loading-container,
.empty-container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 400px;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
}

.page-header > div {
  display: flex;
  align-items: center;
  gap: 12px;
}

.page-title {
  font-size: 24px;
  font-weight: 600;
  margin: 0;
}

.next-action-text {
  padding: 8px;
  background: var(--color-info-50);
  border-radius: 4px;
  color: var(--color-info);
}
</style>

