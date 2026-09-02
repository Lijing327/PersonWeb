<template>
  <div class="admin-site-content-page">
    <div class="page-header">
      <div>
        <h1 class="page-title">站点内容</h1>
        <p class="page-desc">管理前台展示的工具与友情链接</p>
      </div>
    </div>

    <n-tabs v-model:value="activeTab" type="line" animated>
      <n-tab-pane name="tools" tab="工具">
        <AdminToolsPanel />
      </n-tab-pane>
      <n-tab-pane name="links" tab="友情链接">
        <AdminFriendLinksPanel />
      </n-tab-pane>
    </n-tabs>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import { NTabs, NTabPane } from 'naive-ui'
import AdminToolsPanel from '~/components/admin/content/AdminToolsPanel.vue'
import AdminFriendLinksPanel from '~/components/admin/content/AdminFriendLinksPanel.vue'

definePageMeta({
  layout: 'admin',
  middleware: 'admin-auth',
})

const route = useRoute()
const router = useRouter()

const activeTab = ref(route.query.tab === 'links' ? 'links' : 'tools')

watch(activeTab, (tab) => {
  const query = tab === 'tools' ? {} : { tab }
  router.replace({ path: '/admin/content', query })
})

watch(
  () => route.query.tab,
  (tab) => {
    activeTab.value = tab === 'links' ? 'links' : 'tools'
  },
)
</script>

<style scoped>
.page-desc {
  margin-top: 0.25rem;
  font-size: var(--font-size-sm);
  color: var(--color-text-muted);
}
</style>
