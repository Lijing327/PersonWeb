<template>
  <div class="admin-content-hub-page">
    <div class="page-header">
      <h1 class="text-2xl font-bold">内容中枢</h1>
      <p class="text-gray-600 dark:text-gray-400">轻量内容治理入口</p>
    </div>

    <!-- 内容统计卡片 -->
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      <n-card>
        <div class="stat-card">
          <div class="stat-icon text-blue-500">
            <i class="fas fa-file-alt text-2xl"></i>
          </div>
          <div class="stat-content">
            <div class="stat-value">{{ stats?.Articles?.Total || 0 }}</div>
            <div class="stat-label">文章总数</div>
          </div>
        </div>
      </n-card>

      <n-card>
        <div class="stat-card">
          <div class="stat-icon text-green-500">
            <i class="fas fa-robot text-2xl"></i>
          </div>
          <div class="stat-content">
            <div class="stat-value">{{ stats?.Articles?.AiGenerated || 0 }}</div>
            <div class="stat-label">AI来源文章</div>
          </div>
        </div>
      </n-card>

      <n-card>
        <div class="stat-card">
          <div class="stat-icon text-yellow-500">
            <i class="fas fa-edit text-2xl"></i>
          </div>
          <div class="stat-content">
            <div class="stat-value">{{ stats?.Articles?.Draft || 0 }}</div>
            <div class="stat-label">草稿数</div>
          </div>
        </div>
      </n-card>

      <n-card>
        <div class="stat-card">
          <div class="stat-icon text-purple-500">
            <i class="fas fa-check-circle text-2xl"></i>
          </div>
          <div class="stat-content">
            <div class="stat-value">{{ stats?.Articles?.Published || 0 }}</div>
            <div class="stat-label">已发布数</div>
          </div>
        </div>
      </n-card>

      <n-card>
        <div class="stat-card">
          <div class="stat-icon text-orange-500">
            <i class="fas fa-folder text-2xl"></i>
          </div>
          <div class="stat-content">
            <div class="stat-value">{{ stats?.Projects?.Total || 0 }}</div>
            <div class="stat-label">项目数</div>
          </div>
        </div>
      </n-card>

      <n-card>
        <div class="stat-card">
          <div class="stat-icon text-red-500">
            <i class="fas fa-tools text-2xl"></i>
          </div>
          <div class="stat-content">
            <div class="stat-value">{{ stats?.Tools?.Total || 0 }}</div>
            <div class="stat-label">工具数</div>
          </div>
        </div>
      </n-card>

      <n-card>
        <div class="stat-card">
          <div class="stat-icon text-cyan-500">
            <i class="fas fa-book text-2xl"></i>
          </div>
          <div class="stat-content">
            <div class="stat-value">{{ stats?.Documents?.Total || 0 }}</div>
            <div class="stat-label">文档数</div>
          </div>
        </div>
      </n-card>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <!-- 最近更新内容 -->
      <div class="lg:col-span-2">
        <n-card>
          <template #header>
            <div class="flex items-center justify-between">
              <h3 class="text-lg font-semibold">最近更新内容</h3>
              <n-button text type="primary" @click="refreshData">
                <template #icon>
                  <i class="fas fa-sync-alt"></i>
                </template>
              </n-button>
            </div>
          </template>

          <n-spin :show="loading" description="加载中...">
            <div v-if="recentContent.length > 0" class="space-y-3">
              <div v-for="item in recentContent" :key="item.id" class="content-item">
                <div class="flex items-start justify-between">
                  <div class="flex-1">
                    <div class="flex items-center gap-2 mb-1">
                      <n-tag :type="item.type === 'article' ? 'default' : 'success'" size="small">
                        {{ item.TypeName || (item.type === 'article' ? '文章' : '项目') }}
                      </n-tag>
                      <n-tag v-if="item.SourceTypeName" type="warning" size="small">
                        {{ item.SourceTypeName }}
                      </n-tag>
                      <n-tag :type="item.Status === 1 ? 'success' : 'default'" size="small">
                        {{ item.StatusName }}
                      </n-tag>
                    </div>
                    <h4 class="font-medium mb-1">{{ item.Title }}</h4>
                    <p class="text-sm text-gray-500">{{ formatTime(item.UpdatedAt) }}</p>
                  </div>
                  <n-button text @click="navigateToContent(item)">
                    <template #icon>
                      <i class="fas fa-arrow-right"></i>
                    </template>
                  </n-button>
                </div>
              </div>
            </div>
            <div v-else-if="!loading" class="text-center text-gray-500 py-8">
              暂无内容
            </div>
          </n-spin>
        </n-card>
      </div>

      <!-- 模块快捷入口 -->
      <div>
        <n-card>
          <template #header>
            <h3 class="text-lg font-semibold">模块管理</h3>
          </template>

          <div class="space-y-3">
            <n-button block type="primary" @click="navigateTo('/admin/articles')">
              <template #icon>
                <i class="fas fa-file-alt"></i>
              </template>
              文章管理
            </n-button>

            <n-button block @click="navigateTo('/admin/projects')">
              <template #icon>
                <i class="fas fa-folder"></i>
              </template>
              项目管理
            </n-button>

            <n-button block @click="navigateTo('/admin/tools')">
              <template #icon>
                <i class="fas fa-tools"></i>
              </template>
              工具运营
            </n-button>

            <n-button block @click="navigateTo('/admin/document-agent')">
              <template #icon>
                <i class="fas fa-book"></i>
              </template>
              文档知识库
            </n-button>

            <n-divider />

            <n-alert type="info" :bordered="false">
              站点 Work 展示文案（About / Home / AI 身份）请在 <code>content/work/</code> 中维护，后台不提供正文编辑。
            </n-alert>
          </div>
        </n-card>

        <!-- 治理说明 -->
        <n-card class="mt-4">
          <template #header>
            <h3 class="text-lg font-semibold">治理说明</h3>
          </template>

          <div class="text-sm text-gray-600 dark:text-gray-400 space-y-2">
            <p>• 文章 / 项目正文：DB 仍为当前 SoT，生产入口为 Git / content / 导入脚本</p>
            <p>• Work 展示文案：content/work/ 为唯一 SoT</p>
            <p>• 后台仅观察发布状态、来源类型与访问表现</p>
            <p>• 版本历史只读对比，不支持从后台恢复正文</p>
          </div>
        </n-card>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { NCard, NSpin, NTag, NButton, NDivider, NAlert } from 'naive-ui'
import { useSafeMessage } from '~/composables/useNaiveUI'

definePageMeta({
  layout: 'admin',
  middleware: 'admin-auth'
})

const api = useApi()
const message = useSafeMessage()
const loading = ref(false)
const stats = ref<any>(null)
const recentContent = ref<any[]>([])

interface ContentHubOverview {
  Articles?: Record<string, number>
  RecentArticles?: Array<Record<string, unknown>>
  Projects?: Record<string, number>
  Tools?: Record<string, number>
  Documents?: Record<string, number>
}

// 获取总览数据（走 .NET：/Articles/overview，勿用 /api/ 前缀以免命中 Nitro）
const fetchOverview = async () => {
  loading.value = true
  try {
    const data = await api.get<ContentHubOverview>('/Articles/overview')
    stats.value = data
    recentContent.value = data.RecentArticles || []
  } catch (e) {
    console.error('获取总览数据失败:', e)
    message.error('获取数据失败')
  } finally {
    loading.value = false
  }
}

// 刷新数据
const refreshData = () => {
  fetchOverview()
}

// 格式化时间
const formatTime = (time: string) => {
  return new Date(time).toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  })
}

// 跳转到内容运营列表（只读观察，不进入 CMS 编辑）
const navigateToContent = (item: any) => {
  if (item.type === 'article' || !item.type) {
    navigateTo('/admin/articles')
  } else if (item.type === 'project') {
    navigateTo('/admin/projects')
  }
}

// 页面挂载时获取数据
onMounted(() => {
  fetchOverview()
})
</script>

<style scoped>
.admin-content-hub-page {
  padding: 0;
}

.page-header {
  margin-bottom: 24px;
}

.stat-card {
  display: flex;
  align-items: center;
  gap: 16px;
}

.stat-icon {
  width: 48px;
  height: 48px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: rgba(0, 0, 0, 0.05);
}

.dark .stat-icon {
  background-color: rgba(255, 255, 255, 0.1);
}

.stat-content {
  flex: 1;
}

.stat-value {
  font-size: 24px;
  font-weight: 600;
  line-height: 1;
  margin-bottom: 4px;
}

.stat-label {
  font-size: 14px;
  color: #666;
}

.content-item {
  padding: 12px;
  border-radius: 8px;
  border: 1px solid #eee;
  transition: all 0.2s;
}

.content-item:hover {
  background-color: #f8f9fa;
  border-color: #d9d9d9;
}

.dark .content-item {
  border-color: #444;
}

.dark .content-item:hover {
  background-color: #333;
  border-color: #666;
}
</style>