<template>
  <div class="relations-page">
    <div class="page-header">
      <div>
        <h1 class="page-title">关系跟进</h1>
        <p class="page-desc">管理正在接触的对象与互动进展</p>
      </div>
      <n-button type="primary" @click="showAddModal = true">
        <template #icon>
          <i class="fas fa-plus"></i>
        </template>
        新增对象
      </n-button>
    </div>

    <!-- 观察期提醒（仅在客户端渲染） -->
    <ClientOnly>
      <ObservationReminder
        v-for="reminder in observationReminders"
        :key="reminder.personId"
        :reminder="reminder"
        @close="handleReminderClose(reminder.personId)"
        @decision="handleReminderDecision"
      />
    </ClientOnly>

    <!-- 视图切换和筛选（合并到一个卡片，看板视图时隐藏筛选） -->
    <n-card class="view-switch-card">
      <div class="view-switch-buttons">
        <n-button
          v-for="option in viewOptions"
          :key="option.value"
          :type="currentView === option.value ? 'primary' : 'default'"
          :size="'medium'"
          @click="handleViewChange(option.value)"
        >
          {{ option.label }}
        </n-button>
      </div>
      <div class="view-stats">
        <span class="stat-item">
          <strong>{{ filteredPersons.length }}</strong> 个对象
        </span>
        <span v-if="currentView === 'today'" class="stat-item">
          今日相关
        </span>
        <span v-else-if="currentView === 'week'" class="stat-item">
          本周相关
        </span>
      </div>
    </n-card>

    <!-- 筛选栏（看板视图时隐藏�?-->
    <n-card v-if="currentView !== 'kanban'" class="filter-card">
      <div class="filter-bar">
        <n-input
          v-model:value="filters.q"
          placeholder="搜索昵称、来源、备注等..."
          clearable
          style="flex: 1; max-width: 300px;"
          @keyup.enter="loadPersons"
        >
          <template #prefix>
            <i class="fas fa-search"></i>
          </template>
        </n-input>

        <n-select
          v-model:value="filters.stage"
          placeholder="筛选阶段" width: 150px;
          :options="stageOptions"
        />

        <n-input
          v-model:value="filters.tag"
          placeholder="筛选标签"
          clearable
          style="width: 150px;"
        />
          clearable
          style="width: 150px;"
        />

        <n-select
          v-model:value="filters.sort"
          placeholder="排序方式"
          style="width: 150px;"
          :options="sortOptions"
        />

        <n-button type="primary" @click="loadPersons">
          <template #icon>
            <i class="fas fa-filter"></i>
          </template>
          筛选
        </n-button>
      </div>
    </n-card>

    <!-- 批量操作栏（看板视图时显示） -->
    <n-card v-if="currentView === 'kanban'" class="batch-actions-card">
      <div class="batch-actions-bar">
        <div class="selected-count">
          <span v-if="selectedPersons.size > 0">
            已选择 <strong>{{ selectedPersons.size }}</strong> 个对象
          </span>
          <span v-else>未选择对象</span>
        </div>
        <div class="batch-buttons">
          <n-button
            :disabled="selectedPersons.size === 0"
            @click="handleBatchStage(5)"
          >
            批量标记观察          </n-button>
          <n-button
            type="error"
            :disabled="selectedPersons.size === 0"
            @click="handleBatchStage(6)"
          >
            批量标记已结束          </n-button>
          <n-button
            quaternary
            :disabled="selectedPersons.size === 0"
            @click="clearSelection"
          >
            清除选择
          </n-button>
        </div>
      </div>
    </n-card>

    <!-- 列表 -->
    <div v-if="loading" class="loading-container">
      <n-spin size="large" />
    </div>

    <div v-else-if="filteredPersons.length === 0" class="empty-container">
      <n-empty :description="getEmptyDescription()">
        <template #extra>
          <n-button type="primary" @click="showAddModal = true">新增对象</n-button>
        </template>
      </n-empty>
    </div>

    <!-- 卡片视图 -->
    <div v-else-if="currentView !== 'kanban'" class="persons-grid">
      <PersonCard
        v-for="person in filteredPersons"
        :key="person.id"
        :ref="(el) => setPersonCardRef(person.id, el)"
        :person="person"
        @view="handleView"
        @add-interaction="handleAddInteraction"
        @edit-action="handleEditAction"
        @complete-action="handleCompleteAction"
        @ai-suggestion="handleAiSuggestion"
        @apply-ai-suggestion="handleApplyAiSuggestion"
        @set-reminder="handleSetReminder"
        @generate-suggestion="handleGenerateSuggestion"
        @delete="handleDeletePerson"
      />
    </div>

    <!-- 看板视图 -->
    <div v-else class="kanban-view">
      <div
        v-for="stage in stages"
        :key="stage.value"
        class="kanban-column"
      >
        <div class="kanban-column-header">
          <div class="column-title">
            <n-tag :type="getStageTagType(stage.value)" size="small">
              {{ stage.label }}
            </n-tag>
            <span class="column-count">({{ getStagePersons(stage.value).length }})</span>
          </div>
        </div>
        <div class="kanban-column-content">
          <PersonCard
            v-for="person in getStagePersons(stage.value)"
            :key="person.id"
            :ref="(el) => setPersonCardRef(person.id, el)"
            :person="person"
            :selected="selectedPersons.has(person.id)"
            :selectable="true"
            class="kanban-card"
            @view="handleView"
            @add-interaction="handleAddInteraction"
            @edit-action="handleEditAction"
            @complete-action="handleCompleteAction"
            @ai-suggestion="handleAiSuggestion"
            @apply-ai-suggestion="handleApplyAiSuggestion"
            @set-reminder="handleSetReminder"
            @generate-suggestion="handleGenerateSuggestion"
            @delete="handleDeletePerson"
            @select="handleSelectPerson"
          />
          <div v-if="getStagePersons(stage.value).length === 0" class="kanban-empty">
            <n-empty size="small" description="暂无对象" />
          </div>
        </div>
      </div>
    </div>

    <!-- 新增/编辑对象 Modal -->
    <AddPersonModal
      v-model:show="showAddModal"
      @success="handleModalSuccess"
    />

    <!-- 记录互动 Modal -->
    <AddInteractionModal
      v-model:show="showInteractionModal"
      :person-id="currentInteractionPersonId"
      :person="currentInteractionPerson"
      @success="handleInteractionSuccess"
    />

    <!-- 编辑下一步行�Modal -->
    <n-modal
      v-model:show="showActionModal"
      preset="card"
      title="下一步行动"
      style="width: 500px"
    >
      <n-form :model="actionForm" label-placement="left" label-width="80px">
        <n-form-item label="行动内容">
          <n-input
            v-model:value="actionForm.nextAction"
            type="textarea"
            :rows="3"
            placeholder="请输入下一步行动.."
            :maxlength="500"
            show-count
          />
        </n-form-item>
      </n-form>
      <template #footer>
        <div style="display: flex; justify-content: flex-end; gap: 8px;">
          <n-button @click="showActionModal = false">取消</n-button>
          <n-button
            v-if="currentActionPersonId && findPerson(currentActionPersonId)?.nextAction"
            type="error"
            @click="handleClearAction"
          >
            清空
          </n-button>
          <n-button type="primary" :loading="actionLoading" @click="handleSaveAction">
            保存
          </n-button>
        </div>
      </template>
    </n-modal>

    <!-- 设置提醒 Modal -->
    <n-modal
      v-model:show="showReminderModal"
      preset="card"
      title="设置提醒"
      style="width: 400px"
    >
      <n-form :model="reminderForm" label-placement="left" label-width="80px">
        <n-form-item label="提醒时间">
          <n-date-picker
            v-model:value="reminderForm.remindAt"
            type="datetime"
            format="yyyy-MM-dd HH:mm"
            placeholder="请选择提醒时间"
            style="width: 100%"
          />
        </n-form-item>
      </n-form>
      <template #footer>
        <div style="display: flex; justify-content: flex-end; gap: 8px;">
          <n-button @click="showReminderModal = false">取消</n-button>
          <n-button type="primary" :loading="reminderLoading" @click="handleSaveReminder">
            保存
          </n-button>
        </div>
      </template>
    </n-modal>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, nextTick } from 'vue'
import type { ComponentPublicInstance } from 'vue'
import { useRouter } from 'vue-router'
import {
  NCard,
  NButton,
  NInput,
  NSelect,
  NSpin,
  NEmpty,
  NModal,
  NForm,
  NFormItem,
  NDatePicker,
  NTag,
  useMessage,
  useDialog
} from 'naive-ui'
import PersonCard from '~/components/relations/PersonCard.vue'
import ObservationReminder from '~/components/relations/ObservationReminder.vue'
import AddPersonModal from '~/components/relations/modals/AddPersonModal.vue'
import AddInteractionModal from '~/components/relations/modals/AddInteractionModal.vue'
import { useRelationsApi, type RelationPerson, type ObservationReminder as ObservationReminderType } from '~/composables/useRelationsApi'

definePageMeta({
  layout: 'admin',
  middleware: 'admin-auth'
})

const router = useRouter()
const message = useMessage()
const dialog = useDialog()
const relationsApi = useRelationsApi()

const loading = ref(false)
const allPersons = ref<RelationPerson[]>([]) 
const showAddModal = ref(false)
const showReminderModal = ref(false)
const reminderLoading = ref(false)
const currentReminderPersonId = ref<string | null>(null)

// 视图切换
const currentView = ref<'all' | 'today' | 'week' | 'kanban'>('all')
const viewOptions = [
  { label: '全部', value: 'all' },
  { label: '今日相关', value: 'today' },
  { label: '本周相关', value: 'week' },
  { label: '看板视图', value: 'kanban' }
]

// 记录互动相关
const showInteractionModal = ref(false)
const currentInteractionPersonId = ref<string | null>(null)
const currentInteractionPerson = ref<RelationPerson | null>(null)
const lastAddedInteractionPersonId = ref<string | null>(null) // 用于自动建议


const showActionModal = ref(false)
const currentActionPersonId = ref<string | null>(null)
const actionLoading = ref(false)
const actionForm = reactive({
  nextAction: ''
})

// 批量操作相关（看板视图）
const selectedPersons = ref<Set<string>>(new Set())

// 观察期提醒相关
const observationReminders = ref<ObservationReminderType[]>([])

// PersonCard 引用管理
const personCardRefs = ref<Map<string, ComponentPublicInstance>>(new Map())

const setPersonCardRef = (id: string, el: any) => {
  if (el) {
    personCardRefs.value.set(id, el)
  }
}

// 计算过滤后的对象列表
const filteredPersons = computed(() => {
  if (!allPersons.value) {
    return []
  }
  let result = [...allPersons.value]

  // 根据视图类型过滤
  if (currentView.value === 'today') {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)

    result = result.filter(person => {
      // 今天有提醒的
      if (person.remindAt) {
        const remindDate = new Date(person.remindAt)
        remindDate.setHours(0, 0, 0, 0)
        if (remindDate.getTime() === today.getTime()) {
          return true
        }
      }
      // 今天有任务的（通过 nextAction 判断，简化处理）
      // 或者长时间未联系需要关注的
      if (!person.lastContactAt) {
        return true 
             }
      const daysSinceContact = Math.floor(
        (new Date().getTime() - new Date(person.lastContactAt).getTime()) / (1000 * 60 * 60 * 24)
      )
      if (daysSinceContact >= 7) {
        return true     }
      return false
    })
  } else if (currentView.value === 'week') {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const weekAgo = new Date(today)
    weekAgo.setDate(weekAgo.getDate() - 7)

    result = result.filter(person => {
      // 本周有提醒的
      if (person.remindAt) {
        const remindDate = new Date(person.remindAt)
        remindDate.setHours(0, 0, 0, 0)
        if (remindDate >= weekAgo && remindDate <= today) {
          return true
        }
      }
      // 本周需要跟进的�?天内未联系）
      if (!person.lastContactAt) {
        return true
      }
      const daysSinceContact = Math.floor(
        (new Date().getTime() - new Date(person.lastContactAt).getTime()) / (1000 * 60 * 60 * 24)
      )
      if (daysSinceContact >= 7) {
        return true
      }
      return false
    })
  }


   if (filters.stage !== null) {
    result = result.filter(p => p.stage === filters.stage)
  }

  if (filters.tag) {
    result = result.filter(p => p.tags && p.tags.includes(filters.tag))
  }

  if (filters.q) {
    const q = filters.q.toLowerCase()
    result = result.filter(p =>
      p.nickname.toLowerCase().includes(q) ||
      (p.source && p.source.toLowerCase().includes(q)) ||
      (p.notes && p.notes.toLowerCase().includes(q))
    )
  }

  // 排序
  switch (filters.sort) {
    case 'heat':
      result.sort((a, b) => b.heatScore - a.heatScore)
      break
    case 'recent':
      result.sort((a, b) => {
        const aTime = a.remindAt ? new Date(a.remindAt).getTime() : 0
        const bTime = b.remindAt ? new Date(b.remindAt).getTime() : 0
        return bTime - aTime
      })
      break
    case 'lastContact':
    default:
      result.sort((a, b) => {
        const aTime = a.lastContactAt ? new Date(a.lastContactAt).getTime() : 0
        const bTime = b.lastContactAt ? new Date(b.lastContactAt).getTime() : 0
        return aTime - bTime
      })
      break
  }

  return result
})

const filters = reactive({
  q: '',
  stage: null as number | null,
  tag: '',
  sort: 'lastContact'
})

const sortOptions = [
  { label: '最久未联系', value: 'lastContact' },
  { label: '热度最高', value: 'heat' },
  { label: '提醒最新', value: 'recent' }
]

const reminderForm = reactive({
  remindAt: null as number | null
})

// 阶段配置（用于看板视图和筛选）
const stages = [
  { label: '新认识', value: 0 },
  { label: '熟悉', value: 1 },
  { label: '准备约见', value: 2 },
  { label: '已见面', value: 3 },
  { label: '升温', value: 4 },
  { label: '观察', value: 5 },
  { label: '已结束', value: 6 }
]

const stageOptions = stages

const loadPersons = async () => {
  loading.value = true
  try {
    // 加载全部数据，过滤在前端处理
    const result = await relationsApi.getPersons({
      q: undefined, // 前端过滤
      stage: undefined, // 前端过滤
      tag: undefined, // 前端过滤
      sort: filters.sort || 'lastContact'
    })
    allPersons.value = result || []
  } catch (error: any) {
    message.error(error.message || '加载失败')
  } finally {
    loading.value = false
  }
}

const handleView = (id: string) => {
  router.push(`/admin/relations/${id}`)
}

const handleAddInteraction = (id: string) => {
  const person = findPerson(id)
  if (person) {
    currentInteractionPersonId.value = id
    currentInteractionPerson.value = person
    lastAddedInteractionPersonId.value = id // 记录，用于保存后自动建议
    showInteractionModal.value = true
  }
}

const handleInteractionSuccess = async () => {
  await loadPersons()
  
if (lastAddedInteractionPersonId.value) {
    const personId = lastAddedInteractionPersonId.value
    lastAddedInteractionPersonId.value = null
    
    setTimeout(async () => {
      await nextTick() // 确保 DOM 更新完成
      dialog.info({
        title: '互动已记录',
        content: '是否查看 AI 建议？',
        positiveText: '查看建议',
        negativeText: '稍后',
        onPositiveClick: async () => {
          // 再等待一下，确保 refs 已经设置
          await nextTick()
          await generateLightweightAiSuggestion(personId, false)
        }
      })
    }, 500) // 增加延迟时间
  }
}

const findPerson = (id: string): RelationPerson | undefined => {
  return allPersons.value.find(p => p.id === id)
}

// 视图切换处理
const handleViewChange = (value: string | 'all' | 'today' | 'week' | 'kanban') => {
  currentView.value = value as 'all' | 'today' | 'week' | 'kanban'
  // 切换到看板视图时，清除选择
  if (value === 'kanban') {
    clearSelection()
  }
}

const getEmptyDescription = (): string => {
  if (currentView.value === 'today') {
    return '今日暂无相关对象'
  } else if (currentView.value === 'week') {
    return '本周暂无相关对象'
  } else if (currentView.value === 'kanban') {
    return '暂无数据'
  }
  return '暂无数据'
}

// 看板视图：获取某个阶段的对象
const getStagePersons = (stage: number): RelationPerson[] => {
  return filteredPersons.value.filter(p => p.stage === stage)
}

// 获取阶段�Tag 类型
const getStageTagType = (stage: number): 'default' | 'success' | 'warning' | 'error' | 'info' => {
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

// 批量操作：标记阶段
const handleBatchStage = async (stage: number) => {
  if (selectedPersons.value.size === 0) {
    message.warning('请先选择对象')
    return
  }

  const stageName = stages.find(s => s.value === stage)?.label || '未知'
  dialog.warning({
    title: '批量操作',
    content: `确定要将 ${selectedPersons.value.size} 个对象标记为{stageName}」吗？`,
    positiveText: '确定',
    negativeText: '取消',
    onPositiveClick: async () => {
      try {
        const updatePromises = Array.from(selectedPersons.value).map(id =>
          relationsApi.updatePerson(id, { stage })
        )
        await Promise.all(updatePromises)
        message.success(`已批量标记 ${selectedPersons.value.size} 个对象`)
        clearSelection()
        await loadPersons()
      } catch (error: any) {
        message.error(error.message || '操作失败')
      }
    }
  })
}

// 清除选择
const clearSelection = () => {
  selectedPersons.value.clear()
}

// 处理选择/取消选择
const handleSelectPerson = (id: string, selected: boolean) => {
  if (selected) {
    selectedPersons.value.add(id)
  } else {
    selectedPersons.value.delete(id)
  }
}

const handleEditAction = (person: RelationPerson) => {
  currentActionPersonId.value = person.id
  actionForm.nextAction = person.nextAction || ''
  showActionModal.value = true
}

const handleCompleteAction = async (id: string) => {
  dialog.warning({
    title: '标记完成',
    content: '确定要清空下一步行动吗？',
    positiveText: '确定',
    negativeText: '取消',
    onPositiveClick: async () => {
      try {
        await relationsApi.updatePerson(id, {
          nextAction: undefined
        })
        message.success('已标记完成')
        await loadPersons()
      } catch (error: any) {
        message.error(error.message || '操作失败')
      }
    }
  })
}

const handleAiSuggestion = async (id: string) => {
  await generateLightweightAiSuggestion(id, false)
}

// 生成轻量�AI 建议（基于最近互动）
const generateLightweightAiSuggestion = async (personId: string, autoTrigger: boolean = false) => {
  const person = findPerson(personId)
  if (!person) {
    console.warn('找不到对应的对象', personId)
    if (!autoTrigger) {
      message.warning('找不到对应的对象')
    }
    return
  }

  // 等待一下，确保组件已经渲染完成
  await nextTick()
  
  const cardRef = personCardRefs.value.get(personId) as any
  if (!cardRef) {
    console.warn('找不到卡片引用', personId, '所有refs:', Array.from(personCardRefs.value.keys()))
    if (!autoTrigger) {
      message.warning('页面尚未加载完成，请稍后再试')
    }
    return
  }

  // 显示加载状态
  cardRef.setAiLoading(true)
  cardRef.setAiError(null)

  try {
    // 获取最近的互动记录
    const interactions = await relationsApi.getInteractions(personId)
    const recentInteraction = interactions && interactions.length > 0 ? interactions[0] : null

    // 如果没有最近互动，无法生成建议
    if (!recentInteraction && !autoTrigger) {
      message.warning('暂无互动记录，请先记录一次互动')
      cardRef.setAiLoading(false)
      return
    }

    // 构建轻量级请求（只包含基本信息 + 最近互动）
    const request = {
      person: {
        nickname: person.nickname,
        stage: person.stage,
        tags: person.tags || [],
        lastContactAt: person.lastContactAt,
        lastMeetAt: person.lastMeetAt,
        currentNextAction: person.nextAction
      },
      historyKeyPoints: undefined,
      interaction: recentInteraction ? {
        type: recentInteraction.type,
        occurredAt: recentInteraction.occurredAt,
        summary: recentInteraction.summary,
        chatText: undefined
      } : {
        type: 0,
        occurredAt: new Date().toISOString(),
        summary: '基于当前状态',
        chatText: undefined
      }
    }

    const response = await relationsApi.aiSummarize(request)
    
   const suggestion = {
      statusHint: extractStatusHint(response, person),
      nextActions: extractNextActions(response)
    }


    const currentCardRef = personCardRefs.value.get(personId) as any
    if (currentCardRef) {
      currentCardRef.setAiLoading(false)
      currentCardRef.showSuggestion(suggestion)
      
      if (autoTrigger) {
        message.info('AI 已生成建议（可参考）')
      } else {
        message.success('AI 建议已生成')
      }
    }
  } catch (error: any) {
    console.error('生成 AI 建议失败:', error)
    const currentCardRef = personCardRefs.value.get(personId) as any
    if (currentCardRef) {
      currentCardRef.setAiLoading(false)
      currentCardRef.setAiError('生成建议失败，请稍后重试')
    }
    if (!autoTrigger) {
      message.error(error.message || '生成建议失败')
    }
  }
}

// 提取状态提示语
const extractStatusHint = (response: any, person: RelationPerson): string => {
 const daysSinceContact = person.lastContactAt 
     Math.floor((new Date().getTime() - new Date(person.lastContactAt).getTime()) / (1000 * 60 * 60 * 24))
     Infinity

  // 如果�AI 的一句话总结，使用它
  const oneLine = response?.summary?.oneLine || response?.summary?.one_line || response?.summary?.OneLine
  if (oneLine) {
    return oneLine
  }

 if (daysSinceContact >= 30) {
    return `${daysSinceContact} 天未联系`
  } else if (daysSinceContact >= 14) {
    return `${daysSinceContact} 天未联系`
  } else if (daysSinceContact >= 7) {
    return `${daysSinceContact} 天未联系`
  } else if (person.nextAction) {
    return '有下一步行动'
  } else {
    return '正常跟进'
  }
}

// 提取 Next Action 建议�?-3条）
const extractNextActions = (response: any): any[] => {
  const nextActions = response?.nextActions || response?.next_actions || response?.NextActions || []
   return nextActions.slice(0, 3).map((action: any) => ({
    title: action.title || action.Title || '',
    when: action.when || action.When || '',
    why: action.why || action.Why || ''
  }))
}

// 应用 AI 建议
const handleApplyAiSuggestion = async (personId: string, action: any) => {
  try {
    await relationsApi.updatePerson(personId, {
      nextAction: action.title || action.Title || ''
    })
    message.success('已采用建议并更新下一步行动')
    await loadPersons()
    
    // 隐藏建议卡片
    const cardRef = personCardRefs.value.get(personId) as any
    if (cardRef) {
      cardRef.hideSuggestion()
    }
  } catch (error: any) {
    message.error(error.message || '操作失败')
  }
}

const handleSaveAction = async () => {
  if (!currentActionPersonId.value) return

  actionLoading.value = true
  try {
    await relationsApi.updatePerson(currentActionPersonId.value, {
      nextAction: actionForm.nextAction || undefined
    })
    message.success('保存成功')
    showActionModal.value = false
    await loadPersons()
  } catch (error: any) {
    message.error(error.message || '保存失败')
  } finally {
    actionLoading.value = false
  }
}

const handleClearAction = async () => {
  if (!currentActionPersonId.value) return

  actionLoading.value = true
  try {
    await relationsApi.updatePerson(currentActionPersonId.value, {
      nextAction: undefined
    })
    message.success('已清空下一步行动')
    showActionModal.value = false
    await loadPersons()
  } catch (error: any) {
    message.error(error.message || '操作失败')
  } finally {
    actionLoading.value = false
  }
}

const handleSetReminder = (id: string) => {
  currentReminderPersonId.value = id
  reminderForm.remindAt = null
  showReminderModal.value = true
}

const handleDeletePerson = (id: string) => {
  const person = findPerson(id)
  const displayName = person?.nickname || '该对象'

  dialog.warning({
    title: '删除对象',
    content: `确认删除“${displayName}”吗？此操作不可恢复。`,
    positiveText: '确认删除',
    negativeText: '取消',
    onPositiveClick: async () => {
      try {
        await relationsApi.deletePerson(id)
        selectedPersons.value.delete(id)
        personCardRefs.value.delete(id)
        message.success('删除成功')
        await loadPersons()
      } catch (error: any) {
        message.error(error?.message || '删除失败')
      }
    }
  })
}

const handleSaveReminder = async () => {
  if (!currentReminderPersonId.value || !reminderForm.remindAt) {
    message.warning('请选择提醒时间')
    return
  }

  reminderLoading.value = true
  try {
    await relationsApi.updatePerson(currentReminderPersonId.value, {
      remindAt: new Date(reminderForm.remindAt).toISOString()
    })
    message.success('提醒设置成功')
    showReminderModal.value = false
    await loadPersons()
  } catch (error: any) {
    message.error(error.message || '设置失败')
  } finally {
    reminderLoading.value = false
  }
}

const handleGenerateSuggestion = async (id: string) => {
  dialog.info({
    title: '生成建议',
    content: '此功能需要查看对象的互动记录，请前往详情页操作。是否前往？',
    positiveText: '前往详情',
    onPositiveClick: () => {
      router.push(`/admin/relations/${id}`)
    }
  })
}

const handleModalSuccess = () => {
  loadPersons()
}

// 加载观察期提醒
const loadObservationReminders = async () => {
  try {
    const reminders = await relationsApi.getObservationReminders()
    observationReminders.value = reminders || []
  } catch (error) {
    console.error('加载观察期提醒失败', error)
  }
}

// 处理提醒关闭
const handleReminderClose = (personId: string) => {
  observationReminders.value = observationReminders.value.filter(r => r.personId !== personId)
}

// 处理提醒决策
const handleReminderDecision = (decision: 'Continue' | 'Downgrade' | 'End') => {
  // 决策后重新加载列表和提醒
  loadPersons()
  loadObservationReminders()
}

onMounted(async () => {
  await loadPersons()
  await loadObservationReminders()
})
</script>

<style scoped>
.relations-page {
  padding: 24px;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 24px;
}

.page-title {
  font-size: 24px;
  font-weight: 600;
  margin: 0 0 8px 0;
}

.page-desc {
  color: var(--text-color-2);
  margin: 0;
}

.filter-card {
  margin-bottom: 24px;
}

.view-switch-card {
  margin-bottom: 16px;
}

.view-switch-buttons {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  margin-bottom: 12px;
}

.view-stats {
  display: flex;
  gap: 16px;
  align-items: center;
  margin-top: 12px;
}

.stat-item {
  font-size: 14px;
  color: var(--text-color-2);
}

.filter-bar {
  display: flex;
  gap: 12px;
  align-items: center;
  flex-wrap: wrap;
}

.loading-container,
.empty-container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 400px;
}

.persons-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
  gap: 16px;
}

@media (max-width: 768px) {
  .persons-grid {
    grid-template-columns: 1fr;
  }
}

/* ========== 看板视图样式 ========== */
.kanban-view {
  display: flex;
  gap: 12px;
  overflow-x: auto;
  padding: 8px 4px 8px 4px;
  margin: 0 -4px;
  min-height: calc(100vh - 350px);
  /* 隐藏滚动条但保持滚动功能 */
  scrollbar-width: thin;
  scrollbar-color: var(--color-border-subtle) transparent;
}

.kanban-view::-webkit-scrollbar {
  height: 8px;
}

.kanban-view::-webkit-scrollbar-track {
  background: transparent;
}

.kanban-view::-webkit-scrollbar-thumb {
  background: var(--color-border-subtle);
  border-radius: 4px;
}

.kanban-view::-webkit-scrollbar-thumb:hover {
  background: var(--color-border-default);
}

.kanban-column {
  flex: 0 0 300px;
  display: flex;
  flex-direction: column;
  background: var(--color-bg-elevated, rgba(255, 255, 255, 0.02));
  border: 1px solid var(--color-border-subtle);
  border-radius: 10px;
  overflow: hidden;
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  box-shadow: 0 2px 8px var(--color-border);
}

.kanban-column-header {
  padding: 12px 14px;
  background: var(--color-bg-card, rgba(255, 255, 255, 0.03));
  border-bottom: 1px solid var(--color-border-subtle);
  position: sticky;
  top: 0;
  z-index: 10;
}

.column-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 600;
  font-size: 14px;
}

.column-count {
  color: var(--color-text-muted);
  font-weight: 400;
  font-size: 13px;
}

.kanban-column-content {
  flex: 1;
  padding: 10px;
  overflow-y: auto;
  max-height: calc(100vh - 280px);
  display: flex;
  flex-direction: column;
  gap: 10px;
  /* 隐藏滚动条但保持滚动功能 */
  scrollbar-width: thin;
  scrollbar-color: var(--color-border-subtle) transparent;
}

.kanban-column-content::-webkit-scrollbar {
  width: 6px;
}

.kanban-column-content::-webkit-scrollbar-track {
  background: transparent;
}

.kanban-column-content::-webkit-scrollbar-thumb {
  background: var(--color-border-subtle);
  border-radius: 3px;
}

.kanban-card {
  flex-shrink: 0;
  margin: 0;
}

.kanban-empty {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 120px;
  color: var(--color-text-muted);
  font-size: 13px;
}

/* 批量操作�?*/
.batch-actions-card {
  margin-bottom: 12px;
}

.batch-actions-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}

.selected-count {
  font-size: 14px;
  color: var(--color-text-main);
}

.batch-buttons {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

/* 响应式：小屏幕时看板列变�?*/
@media (max-width: 768px) {
  .kanban-column {
    flex: 0 0 280px;
  }
  
  .kanban-column-content {
    max-height: calc(100vh - 250px);
  }
  
  .batch-actions-bar {
    flex-direction: column;
    align-items: stretch;
  }
  
  .batch-buttons {
    width: 100%;
  }
  
  .batch-buttons .n-button {
    flex: 1;
  }
}

/* 确保看板视图中的卡片样式正确 */
.kanban-view :deep(.person-card) {
  width: 100%;
  margin-bottom: 0;
}

.kanban-view :deep(.n-card) {
  border-radius: 8px;
}
</style>
