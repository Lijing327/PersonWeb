<template>
  <div class="space-y-4">
    <div class="flex justify-end">
      <NuxtLink to="/admin/friend-links/edit" class="btn-primary">
        <i class="fas fa-plus mr-2"></i>
        新建链接
      </NuxtLink>
    </div>

    <div class="table-container">
      <table class="table">
        <thead class="table-header">
          <tr>
            <th class="table-header-cell">名称</th>
            <th class="table-header-cell">链接</th>
            <th class="table-header-cell">排序</th>
            <th class="table-header-cell">状态</th>
            <th class="table-header-cell text-right">操作</th>
          </tr>
        </thead>
        <tbody class="table-body">
          <tr v-for="link in friendLinks" :key="link.id" class="table-row">
            <td class="table-cell">
              <div class="text-sm font-medium">{{ link.name }}</div>
              <div v-if="link.description" class="text-xs text-gray-500 truncate max-w-xs">
                {{ link.description }}
              </div>
            </td>
            <td class="table-cell">
              <a :href="link.url" target="_blank" rel="noopener noreferrer" class="btn-link btn-link--blue max-w-xs truncate block">
                {{ link.url }}
              </a>
            </td>
            <td class="table-cell">{{ link.sortOrder }}</td>
            <td class="table-cell">
              <span class="badge" :class="link.status === 1 ? 'badge-green' : 'badge-gray'">
                {{ link.status === 1 ? '启用' : '禁用' }}
              </span>
            </td>
            <td class="table-cell text-right">
              <NuxtLink :to="`/admin/friend-links/edit/${link.id}`" class="btn-link btn-link--blue mr-3">编辑</NuxtLink>
              <button class="btn-link btn-link--red" @click="handleDelete(link.id)">删除</button>
            </td>
          </tr>
          <tr v-if="friendLinks.length === 0">
            <td colspan="5" class="table-cell text-center empty-state">暂无友情链接</td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { FriendLink } from '~/types/api'
import { useNotification } from '~/composables/useToast'
import { useErrorHandler } from '~/composables/useErrorHandler'

const api = useApi()
const notification = useNotification()
const errorHandler = useErrorHandler()

const { data: friendLinksData, refresh: refreshFriendLinks } = await useAsyncData(
  'admin-friend-links-list',
  async () => {
    try {
      const res = await api.get<{ Total: number; List: FriendLink[] }>('/FriendLinks/all', { silent: true })
      return res.List || []
    } catch {
      return [] as FriendLink[]
    }
  },
  { server: false, default: () => [] as FriendLink[] },
)

const friendLinks = computed(() => friendLinksData.value || [])
const activeCount = computed(() => friendLinks.value.filter(link => link.status === 1).length)

const handleDelete = async (id: number) => {
  if (!confirm('确定要删除这个友情链接吗？')) return
  try {
    await api.del(`/FriendLinks/${id}`)
    notification.success('删除成功')
    await refreshFriendLinks()
  } catch (e: unknown) {
    errorHandler.handleError(e, '删除失败')
  }
}

defineExpose({ friendLinks, activeCount, refresh: refreshFriendLinks })
</script>
