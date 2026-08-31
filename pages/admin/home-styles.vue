<template>
  <div class="page-container">
    <div class="page-header">
      <h1 class="page-title">首页风格管理</h1>
      <button @click="showAddModal = true" class="btn-primary">
        <i class="fas fa-plus mr-2"></i>新增风格
      </button>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <!-- 左侧：风格列表 -->
      <div class="lg:col-span-2">
        <div v-if="loading" class="loading">加载中...</div>
        <div v-else-if="styles.length === 0" class="empty-state">暂无风格</div>
        <div v-else class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div
            v-for="style in styles"
            :key="style.id"
            class="card-hover p-4 cursor-pointer"
            :class="{ 'ring-2 ring-blue-500': style.isDefault }"
            @click="selectStyle(style)"
          >
            <div class="relative mb-3">
              <img
                v-if="style.previewImage"
                :src="style.previewImage"
                :alt="style.name"
                class="w-full h-32 object-cover rounded-lg"
                @error="handleImageError"
              />
              <div v-else class="w-full h-32 bg-gradient-to-br from-blue-100 to-purple-100 rounded-lg flex items-center justify-center">
                <i class="fas fa-image text-4xl text-gray-400"></i>
              </div>
              <div v-if="style.isDefault" class="absolute top-2 right-2 badge badge-green">
                当前启用
              </div>
              <div v-if="!style.enabled" class="absolute top-2 left-2 badge badge-gray">
                已禁用
              </div>
            </div>
            <h3 class="font-semibold text-lg mb-1">{{ style.name }}</h3>
            <p class="text-sm text-gray-500 mb-2">{{ style.styleKey }}</p>
            <p v-if="style.description" class="text-sm text-gray-600 line-clamp-2">{{ style.description }}</p>
            <div class="flex gap-2 mt-3">
              <button
                @click.stop="setAsDefault(style.id)"
                :disabled="style.isDefault"
                class="btn-secondary text-xs flex-1"
                :class="{ 'opacity-50 cursor-not-allowed': style.isDefault }"
              >
                <i class="fas fa-check mr-1"></i>{{ style.isDefault ? '已启用' : '设为当前' }}
              </button>
              <button
                @click.stop="editStyle(style)"
                class="btn-link--blue text-xs"
              >
                编辑
              </button>
              <button
                @click.stop="deleteStyle(style.id)"
                :disabled="style.isDefault"
                class="btn-link--red text-xs"
                :class="{ 'opacity-50 cursor-not-allowed': style.isDefault }"
              >
                删除
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- 右侧：编辑区域 -->
      <div class="lg:col-span-1">
        <div class="card p-6 sticky top-4">
          <h2 class="text-xl font-bold mb-4">{{ selectedStyle ? '编辑风格' : '新增风格' }}</h2>
          <form @submit.prevent="saveStyle" class="space-y-4">
            <div class="form-group">
              <label class="form-label">风格名称</label>
              <input v-model="form.name" type="text" class="form-input" required />
            </div>

            <div class="form-group">
              <label class="form-label">风格标识 (styleKey)</label>
              <input v-model="form.styleKey" type="text" class="form-input" required :disabled="!!selectedStyle" />
              <p class="text-xs text-gray-500 mt-1">例如：dark-lab、light-portfolio</p>
            </div>

            <div class="form-group">
              <label class="form-label">预览图URL</label>
              <input v-model="form.previewImage" type="text" class="form-input" placeholder="/images/home-styles/xxx.jpg" />
            </div>

            <div class="form-group">
              <label class="form-label">描述</label>
              <textarea v-model="form.description" class="form-textarea" rows="3"></textarea>
            </div>

            <div class="form-group">
              <label class="flex items-center gap-2">
                <input v-model="form.enabled" type="checkbox" class="rounded" />
                <span>启用状态</span>
              </label>
            </div>

            <div class="flex gap-3">
              <button type="submit" class="btn-primary flex-1">保存</button>
              <button type="button" @click="resetForm" class="btn-secondary">重置</button>
            </div>
          </form>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({
  layout: 'admin',
  middleware: 'admin-auth',
})
const api = useApi()
const { success, error } = useNotification()

const styles = ref<any[]>([])
const loading = ref(true)
const selectedStyle = ref<any>(null)
const showAddModal = ref(false)

const form = ref({
  id: 0,
  name: '',
  styleKey: '',
  description: '',
  previewImage: '',
  enabled: true
})

const fetchStyles = async () => {
  loading.value = true
  try {
    const res = await api.get<any>('/admin/home-style')
    styles.value = res || []
  } catch (e) {
    console.error('Failed to fetch styles:', e)
    error('加载风格列表失败')
    styles.value = []
  } finally {
    loading.value = false
  }
}

const selectStyle = (style: any) => {
  selectedStyle.value = style
  form.value = {
    id: style.id,
    name: style.name,
    styleKey: style.styleKey,
    description: style.description || '',
    previewImage: style.previewImage || '',
    enabled: style.enabled
  }
}

const editStyle = (style: any) => {
  selectStyle(style)
  // 滚动到编辑区域
  nextTick(() => {
    const editor = document.querySelector('.sticky')
    if (editor) {
      editor.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  })
}

const resetForm = () => {
  selectedStyle.value = null
  form.value = {
    id: 0,
    name: '',
    styleKey: '',
    description: '',
    previewImage: '',
    enabled: true
  }
}

const saveStyle = async () => {
  try {
    if (form.value.id > 0) {
      // 编辑
      await api.post('/admin/home-style', form.value)
      success('风格更新成功')
    } else {
      // 新增
      await api.post('/admin/home-style', form.value)
      success('风格创建成功')
    }
    resetForm()
    await fetchStyles()
  } catch (e: any) {
    error(e.response?.data?.message || '保存失败')
  }
}

const deleteStyle = async (id: number) => {
  if (!confirm('确定要删除这个风格吗？')) return

  try {
    await api.del(`/admin/home-style/${id}`)
    success('删除成功')
    if (selectedStyle.value?.id === id) {
      resetForm()
    }
    await fetchStyles()
  } catch (e: any) {
    error(e.response?.data?.message || '删除失败')
  }
}

const setAsDefault = async (id: number) => {
  try {
    await api.post(`/admin/home-style/${id}/set-default`)
    success('已设置为当前首页风格，前台将立即生效')
    await fetchStyles()
  } catch (e: any) {
    error(e.response?.data?.message || '设置失败')
  }
}

const handleImageError = (event: Event) => {
  const img = event.target as HTMLImageElement
  img.style.display = 'none'
}

onMounted(() => {
  fetchStyles()
})
</script>

