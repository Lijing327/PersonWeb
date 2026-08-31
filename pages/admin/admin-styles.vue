<template>
  <div class="page-container">
    <div class="page-header">
      <h1 class="page-title">后台风格管理</h1>
      <div class="flex gap-3">
        <button @click="activeTab = 'global'" :class="['btn-secondary', { 'btn-primary': activeTab === 'global' }]">
          <i class="fas fa-palette mr-2"></i>全局风格
        </button>
        <button @click="activeTab = 'module'" :class="['btn-secondary', { 'btn-primary': activeTab === 'module' }]">
          <i class="fas fa-cube mr-2"></i>模块风格
        </button>
      </div>
    </div>

    <!-- 全局风格管理 -->
    <div v-if="activeTab === 'global'" class="space-y-6">
      <div class="flex justify-between items-center">
        <p class="text-sm text-gray-600">管理后台的整体视觉风格，包括侧边栏、卡片、颜色等</p>
        <button @click="showGlobalModal = true" class="btn-primary">
          <i class="fas fa-plus mr-2"></i>新增全局风格
        </button>
      </div>

      <div v-if="loading" class="loading">加载中...</div>
      <div v-else-if="globalStyles.length === 0" class="empty-state">暂无全局风格</div>
      <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div
          v-for="style in globalStyles"
          :key="style.id"
          class="card-hover p-6 cursor-pointer relative"
          :class="{ 'ring-2 ring-blue-500': style.isDefault }"
          @click="selectGlobalStyle(style)"
        >
          <div class="absolute top-4 right-4">
            <span v-if="style.isDefault" class="badge badge-success">默认</span>
            <span v-else-if="!style.enabled" class="badge badge-secondary">已禁用</span>
          </div>

          <div class="mb-4">
            <h3 class="text-lg font-bold text-gray-800 mb-1">{{ style.styleName }}</h3>
            <p class="text-sm text-gray-500">{{ style.styleKey }}</p>
          </div>

          <p v-if="style.description" class="text-sm text-gray-600 mb-4 line-clamp-2">
            {{ style.description }}
          </p>

          <div class="flex items-center justify-between mt-4">
            <div class="flex gap-2">
              <button
                @click.stop="editGlobalStyle(style)"
                class="btn-secondary text-xs px-3 py-1"
              >
                <i class="fas fa-edit mr-1"></i>编辑
              </button>
              <button
                v-if="!style.isDefault"
                @click.stop="setDefaultGlobalStyle(style.id)"
                class="btn-secondary text-xs px-3 py-1"
              >
                <i class="fas fa-star mr-1"></i>设为默认
              </button>
            </div>
            <button
              @click.stop="deleteGlobalStyle(style.id)"
              class="text-red-500 hover:text-red-700 text-xs"
            >
              <i class="fas fa-trash"></i>
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- 模块风格管理 -->
    <div v-if="activeTab === 'module'" class="space-y-6">
      <div class="flex justify-between items-center">
        <p class="text-sm text-gray-600">为每个管理模块设置独特的视觉风格</p>
        <button @click="showModuleModal = true" class="btn-primary">
          <i class="fas fa-plus mr-2"></i>新增模块风格
        </button>
      </div>

      <div v-if="loading" class="loading">加载中...</div>
      <div v-else-if="moduleStyles.length === 0" class="empty-state">暂无模块风格</div>
      <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div
          v-for="style in moduleStyles"
          :key="style.id"
          class="card-hover p-6 cursor-pointer"
          @click="editModuleStyle(style)"
        >
          <div class="mb-4">
            <h3 class="text-lg font-bold text-gray-800 mb-1">{{ style.moduleName }}</h3>
            <p class="text-sm text-gray-500">{{ style.moduleKey }}</p>
          </div>

          <div class="flex items-center justify-between mt-4">
            <div class="flex gap-2">
              <button
                @click.stop="editModuleStyle(style)"
                class="btn-secondary text-xs px-3 py-1"
              >
                <i class="fas fa-edit mr-1"></i>编辑
              </button>
            </div>
            <button
              @click.stop="deleteModuleStyle(style.id)"
              class="text-red-500 hover:text-red-700 text-xs"
            >
              <i class="fas fa-trash"></i>
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- 全局风格编辑模态框 -->
    <div v-if="showGlobalModal" class="modal-overlay" @click.self="closeGlobalModal">
      <div class="modal-content-lg">
        <div class="modal-header">
          <h2 class="modal-title">{{ editingGlobalStyle?.id ? '编辑' : '新增' }}全局风格</h2>
          <button @click="closeGlobalModal" class="text-gray-400 hover:text-gray-600">
            <i class="fas fa-times"></i>
          </button>
        </div>

        <div class="modal-body">
          <div class="space-y-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">风格标识 *</label>
              <input
                v-model="globalForm.styleKey"
                type="text"
                class="input"
                placeholder=" dark-tech, light-modern"
                :disabled="!!editingGlobalStyle?.id"
              />
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">风格名称 *</label>
              <input
                v-model="globalForm.styleName"
                type="text"
                class="input"
                placeholder=" 暗黑科技风"
              />
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">风格描述</label>
              <textarea
                v-model="globalForm.description"
                class="input"
                rows="3"
                placeholder="描述这个风格的特点和适用场景"
              ></textarea>
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">风格配置 (JSON) *</label>
              <textarea
                v-model="globalForm.styleConfig"
                class="input font-mono text-sm"
                rows="12"
                placeholder='{"background": {...}, "sidebar": {...}, ...}'
              ></textarea>
              <p class="text-xs text-gray-500 mt-1">支持 JSON 格式配置，包含背景、侧边栏、卡片等样式</p>
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">预览图片 URL</label>
              <input
                v-model="globalForm.previewImage"
                type="text"
                class="input"
                placeholder="https://..."
              />
            </div>

            <div class="flex items-center">
              <input
                v-model="globalForm.enabled"
                type="checkbox"
                id="globalEnabled"
                class="mr-2"
              />
              <label for="globalEnabled" class="text-sm text-gray-700">启用此风格</label>
            </div>
          </div>
        </div>

        <div class="modal-footer">
          <button @click="closeGlobalModal" class="btn-secondary">取消</button>
          <button @click="saveGlobalStyle" class="btn-primary" :disabled="saving">
            {{ saving ? '保存中..' : '保存' }}
          </button>
        </div>
      </div>
    </div>

    <!-- 模块风格编辑模态框 -->
    <div v-if="showModuleModal" class="modal-overlay" @click.self="closeModuleModal">
      <div class="modal-content-lg">
        <div class="modal-header">
          <h2 class="modal-title">{{ editingModuleStyle?.id ? '编辑' : '新增' }}模块风格</h2>
          <button @click="closeModuleModal" class="text-gray-400 hover:text-gray-600">
            <i class="fas fa-times"></i>
          </button>
        </div>

        <div class="modal-body">
          <div class="space-y-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">模块标识 *</label>
              <input
                v-model="moduleForm.moduleKey"
                type="text"
                class="input"
                placeholder="� articles, projects, tasks"
                :disabled="!!editingModuleStyle?.id"
              />
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">模块名称 *</label>
              <input
                v-model="moduleForm.moduleName"
                type="text"
                class="input"
                placeholder="文章管理"
              />
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">风格配置 (JSON) *</label>
              <textarea
                v-model="moduleForm.styleConfig"
                class="input font-mono text-sm"
                rows="10"
                placeholder='{"icon": "fas fa-file-alt", "iconColor": "var(--color-primary)", ...}'
              ></textarea>
              <p class="text-xs text-gray-500 mt-1">支持 JSON 格式配置，包含图标、颜色、背景等样式</p>
            </div>

            <div class="flex items-center">
              <input
                v-model="moduleForm.enabled"
                type="checkbox"
                id="moduleEnabled"
                class="mr-2"
              />
              <label for="moduleEnabled" class="text-sm text-gray-700">启用此风格</label>
            </div>
          </div>
        </div>

        <div class="modal-footer">
          <button @click="closeModuleModal" class="btn-secondary">取消</button>
          <button @click="saveModuleStyle" class="btn-primary" :disabled="saving">
            {{ saving ? '保存中..' : '保存' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
import type { AdminGlobalStyle, AdminModuleStyle } from '~/types/api'

definePageMeta({
  layout: 'admin',
  middleware: 'admin-auth',
})

const api = useApi()
const notification = useNotification()

const activeTab = ref<'global' | 'module'>('global')
const loading = ref(false)
const saving = ref(false)
const showGlobalModal = ref(false)
const showModuleModal = ref(false)

const globalStyles = ref<AdminGlobalStyle[]>([])
const moduleStyles = ref<AdminModuleStyle[]>([])
const editingGlobalStyle = ref<AdminGlobalStyle | null>(null)
const editingModuleStyle = ref<AdminModuleStyle | null>(null)

const globalForm = ref({
  id: 0,
  styleKey: '',
  styleName: '',
  description: '',
  styleConfig: '{}',
  previewImage: '',
  enabled: true
})

const moduleForm = ref({
  id: 0,
  moduleKey: '',
  moduleName: '',
  styleConfig: '{}',
  enabled: true
})

// 获取全局风格列表
const fetchGlobalStyles = async () => {
  loading.value = true
  try {
    const res = await api.get('/AdminStyle/global')
    if (res && Array.isArray(res)) {
      globalStyles.value = res
    }
  } catch (error: any) {
    notification.error(error.message || '获取全局风格失败')
  } finally {
    loading.value = false
  }
}

// 获取模块风格列表
const fetchModuleStyles = async () => {
  loading.value = true
  try {
    const res = await api.get('/AdminStyle/module')
    if (res && Array.isArray(res)) {
      moduleStyles.value = res
    }
  } catch (error: any) {
    notification.error(error.message || '获取模块风格失败')
  } finally {
    loading.value = false
  }
}

// 选择全局风格
const selectGlobalStyle = (style: AdminGlobalStyle) => {
  editingGlobalStyle.value = style
  globalForm.value = {
    id: style.id,
    styleKey: style.styleKey,
    styleName: style.styleName,
    description: style.description || '',
    styleConfig: style.styleConfig || '{}',
    previewImage: style.previewImage || '',
    enabled: style.enabled
  }
  showGlobalModal.value = true
}

// 编辑全局风格
const editGlobalStyle = (style: AdminGlobalStyle) => {
  selectGlobalStyle(style)
}

// 设置默认全局风格
const setDefaultGlobalStyle = async (id: number) => {
  if (!confirm('确定要设置此风格为默认风格吗？')) return

  try {
    await api.post(`/AdminStyle/global/${id}/set-default`)
    notification.success('设置默认风格成功')
    await fetchGlobalStyles()
  } catch (error: any) {
    notification.error(error.message || '设置默认风格失败')
  }
}

// 保存全局风格
const saveGlobalStyle = async () => {
  if (!globalForm.value.styleKey || !globalForm.value.styleName) {
    notification.error('请填写必填项')
    return
  }

  // 验证 JSON
  try {
    JSON.parse(globalForm.value.styleConfig)
  } catch {
    notification.error('风格配置必须是有效的 JSON 格式')
    return
  }

  saving.value = true
  try {
    if (editingGlobalStyle.value?.id) {
      await api.post('/AdminStyle/global', globalForm.value)
      notification.success('更新全局风格成功')
    } else {
      await api.post('/AdminStyle/global', {
        ...globalForm.value,
        id: 0
      })
      notification.success('创建全局风格成功')
    }
    closeGlobalModal()
    await fetchGlobalStyles()
  } catch (error: any) {
    notification.error(error.message || '保存全局风格失败')
  } finally {
    saving.value = false
  }
}

// 删除全局风格
const deleteGlobalStyle = async (id: number) => {
  if (!confirm('确定要删除此风格吗？')) return

  try {
    await api.del(`/AdminStyle/global/${id}`)
    notification.success('删除全局风格成功')
    await fetchGlobalStyles()
  } catch (error: any) {
    notification.error(error.message || '删除全局风格失败')
  }
}

// 关闭全局风格模态框
const closeGlobalModal = () => {
  showGlobalModal.value = false
  editingGlobalStyle.value = null
  globalForm.value = {
    id: 0,
    styleKey: '',
    styleName: '',
    description: '',
    styleConfig: '{}',
    previewImage: '',
    enabled: true
  }
}

// 编辑模块风格
const editModuleStyle = (style: AdminModuleStyle) => {
  editingModuleStyle.value = style
  moduleForm.value = {
    id: style.id,
    moduleKey: style.moduleKey,
    moduleName: style.moduleName,
    styleConfig: style.styleConfig || '{}',
    enabled: style.enabled
  }
  showModuleModal.value = true
}

// 保存模块风格
const saveModuleStyle = async () => {
  if (!moduleForm.value.moduleKey || !moduleForm.value.moduleName) {
    notification.error('请填写必填项')
    return
  }

  // 验证 JSON
  try {
    JSON.parse(moduleForm.value.styleConfig)
  } catch {
    notification.error('风格配置必须是有效的 JSON 格式')
    return
  }

  saving.value = true
  try {
    if (editingModuleStyle.value?.id) {
      await api.post('/AdminStyle/module', moduleForm.value)
      notification.success('更新模块风格成功')
    } else {
      await api.post('/AdminStyle/module', {
        ...moduleForm.value,
        id: 0
      })
      notification.success('创建模块风格成功')
    }
    closeModuleModal()
    await fetchModuleStyles()
  } catch (error: any) {
    notification.error(error.message || '保存模块风格失败')
  } finally {
    saving.value = false
  }
}

// 删除模块风格
const deleteModuleStyle = async (id: number) => {
  if (!confirm('确定要删除此风格吗？')) return

  try {
    await api.del(`/AdminStyle/module/${id}`)
    notification.success('删除模块风格成功')
    await fetchModuleStyles()
  } catch (error: any) {
    notification.error(error.message || '删除模块风格失败')
  }
}

// 关闭模块风格模态框
const closeModuleModal = () => {
  showModuleModal.value = false
  editingModuleStyle.value = null
  moduleForm.value = {
    id: 0,
    moduleKey: '',
    moduleName: '',
    styleConfig: '{}',
    enabled: true
  }
}

// 监听标签切换
const watchTab = () => {
  if (activeTab.value === 'global') {
    fetchGlobalStyles()
  } else {
    fetchModuleStyles()
  }
}

onMounted(() => {
  watchTab()
})

// 监听 activeTab 变化
watch(activeTab, () => {
  watchTab()
})
</script>

