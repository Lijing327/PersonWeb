<template>
  <div>
    <div class="flex justify-between items-center mb-6">
      <h1 class="text-2xl font-bold text-gray-800 dark:text-var(--color-bg-light, white)">
        {{ isEdit ? '编辑友情链接' : '新建友情链接' }}
      </h1>
      <NuxtLink to="/admin/content?tab=links" class="text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200">
        取消
      </NuxtLink>
    </div>

    <div class="bg-var(--color-bg-light, white) dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
      <form class="space-y-6" @submit.prevent>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              链接名称 <span class="text-red-500">*</span>
            </label>
            <input 
              v-model="form.name" 
              type="text" 
              class="w-full border border-gray-300 dark:border-gray-600 rounded px-3 py-2 bg-var(--color-bg-light, white) dark:bg-gray-900 text-gray-800 dark:text-gray-200" 
              placeholder="例如：GitHub" 
              required
            />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              状态
            </label>
            <select 
              v-model="form.status" 
              class="w-full border border-gray-300 dark:border-gray-600 rounded px-3 py-2 bg-var(--color-bg-light, white) dark:bg-gray-900 text-gray-800 dark:text-gray-200"
            >
              <option :value="1">启用</option>
              <option :value="0">禁用</option>
            </select>
          </div>
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            链接地址 <span class="text-red-500">*</span>
          </label>
          <input 
            v-model="form.url" 
            type="url" 
            class="w-full border border-gray-300 dark:border-gray-600 rounded px-3 py-2 bg-var(--color-bg-light, white) dark:bg-gray-900 text-gray-800 dark:text-gray-200" 
            placeholder="https://example.com" 
            required
          />
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">链接描述</label>
          <textarea 
            v-model="form.description" 
            class="w-full border border-gray-300 dark:border-gray-600 rounded px-3 py-2 h-20 bg-var(--color-bg-light, white) dark:bg-gray-900 text-gray-800 dark:text-gray-200" 
            placeholder="简短描述这个网站..."
          ></textarea>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Logo 地址</label>
            <div class="flex gap-2">
              <input 
                v-model="form.logoUrl" 
                type="url" 
                class="flex-1 border border-gray-300 dark:border-gray-600 rounded px-3 py-2 bg-var(--color-bg-light, white) dark:bg-gray-900 text-gray-800 dark:text-gray-200" 
                placeholder="输入 Logo URL 或上传"
              />
              <button 
                @click="triggerUpload" 
                type="button" 
                class="px-4 py-2 bg-gray-100 dark:bg-gray-700 rounded hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300"
              >
                上传
              </button>
              <input ref="fileInput" type="file" class="hidden" accept="image/*" @change="handleUpload" />
            </div>
            <p class="text-xs text-gray-500 mt-1">建议尺寸：64x64 或 128x128 像素</p>
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">排序顺序</label>
            <input 
              v-model.number="form.sortOrder" 
              type="number" 
              class="w-full border border-gray-300 dark:border-gray-600 rounded px-3 py-2 bg-var(--color-bg-light, white) dark:bg-gray-900 text-gray-800 dark:text-gray-200" 
              placeholder="0"
            />
            <p class="text-xs text-gray-500 mt-1">数字越小越靠前，默认为 0</p>
          </div>
        </div>

        <!-- Logo 预览 -->
        <div v-if="form.logoUrl" class="flex items-center gap-4">
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300">Logo 预览：</label>
          <img :src="form.logoUrl" :alt="form.name" class="h-16 w-16 rounded object-cover border border-gray-300 dark:border-gray-600" />
        </div>

        <div class="flex justify-end gap-4">
          <button 
            @click="handleSave" 
            type="button" 
            class="px-6 py-2 bg-blue-600 text-var(--color-bg-light, white) rounded hover:bg-blue-700" 
            :disabled="saving"
          >
            {{ saving ? '保存中...' : '保存链接' }}
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { FriendLink, FriendLinkRequest } from '~/types/api'
import { useNotification } from '~/composables/useToast'
import { useErrorHandler } from '~/composables/useErrorHandler'

definePageMeta({
  layout: 'admin',
  middleware: 'admin-auth'
})

const router = useRouter()
const route = useRoute()
const api = useApi()

const saving = ref(false)
const fileInput = ref<HTMLInputElement | null>(null)

const form = ref<FriendLinkRequest & { id?: number }>({
  name: '',
  url: '',
  description: '',
  logoUrl: '',
  sortOrder: 0,
  status: 1
})

const isEdit = computed(() => !!route.params.id)

const notification = useNotification()
const errorHandler = useErrorHandler()

// 加载详情
const fetchFriendLink = async (id: string) => {
  try {
    const res = await api.get<FriendLink>(`/FriendLinks/${id}`)
    form.value = {
      id: res.id,
      name: res.name,
      url: res.url,
      description: res.description || '',
      logoUrl: res.logoUrl || '',
      sortOrder: res.sortOrder,
      status: res.status
    }
  } catch (e: unknown) {
    errorHandler.handleError(e, '加载失败')
    router.push('/admin/content?tab=links')
  }
}

// 上传图片
const triggerUpload = () => {
  fileInput.value?.click()
}

const handleUpload = async (event: Event) => {
  const file = (event.target as HTMLInputElement).files?.[0]
  if (!file) return

  const formData = new FormData()
  formData.append('file', file)

  try {
    const res = await api.post<{ url: string }>('/Media/upload', formData)
    form.value.logoUrl = res.url
    notification.success('上传成功')
  } catch (e: unknown) {
    errorHandler.handleError(e, '上传失败')
  }
}

// 保存
const handleSave = async () => {
  if (!form.value.name?.trim()) {
    notification.warning('请输入链接名称')
    return
  }

  if (!form.value.url?.trim()) {
    notification.warning('请输入链接地址')
    return
  }

  saving.value = true
  try {
    const payload: FriendLinkRequest = {
      name: form.value.name.trim(),
      url: form.value.url.trim(),
      description: form.value.description?.trim() || undefined,
      logoUrl: form.value.logoUrl?.trim() || undefined,
      sortOrder: form.value.sortOrder || 0,
      status: form.value.status || 1
    }

    if (isEdit.value && form.value.id) {
      await api.put(`/FriendLinks/${form.value.id}`, payload)
    } else {
      await api.post('/FriendLinks', payload)
    }
    notification.success('保存成功')
    router.push('/admin/content?tab=links')
  } catch (e: unknown) {
    errorHandler.handleError(e, '保存失败')
  } finally {
    saving.value = false
  }
}

onMounted(async () => {
  if (route.params.id) {
    await fetchFriendLink(route.params.id as string)
  }
})
</script>

