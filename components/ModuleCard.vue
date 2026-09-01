<template>
  <div class="module-card">
    <!-- 模块封面 -->
    <div class="module-cover">
      <img v-if="module.screenshots?.[0]" :src="module.screenshots[0]" :alt="module.name" />
      <div v-else class="module-icon">
        {{ module.icon }}
      </div>

      <!-- 价格标签 -->
      <div v-if="module.price" class="price-tag">
        ¥{{ module.price }}
      </div>

      <!-- 免费标签 -->
      <div v-else class="free-tag">
        免费
      </div>

      <!-- 安装状态 -->
      <div v-if="isInstalled" class="installed-badge">
        已安装
      </div>
    </div>

    <!-- 模块信息 -->
    <div class="module-info">
      <div class="module-header">
        <h3 class="module-name">{{ module.name }}</h3>
        <div class="module-meta">
          <span class="version">{{ module.version }}</span>
          <span class="category">{{ getCategoryName(module.category) }}</span>
        </div>
      </div>

      <p class="module-description">{{ module.description }}</p>

      <!-- 标签 -->
      <div class="module-tags">
        <span
          v-for="tag in module.tags"
          :key="tag"
          class="tag"
        >
          {{ tag }}
        </span>
      </div>

      <!-- 统计信息 -->
      <div class="module-stats">
        <div class="stat-item">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10" />
          </svg>
          <span>{{ module.downloads }}</span>
        </div>
        <div class="stat-item">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
          </svg>
          <span>{{ module.rating }}</span>
        </div>
      </div>

      <!-- 操作按钮 -->
      <div class="module-actions">
        <!-- 已安装模块 -->
        <template v-if="isInstalled">
          <button
            v-if="isActive"
            @click="$emit('uninstall', module.key)"
            class="action-btn secondary"
          >
            卸载
          </button>
          <button
            v-else
            @click="$emit('activate', module.key)"
            class="action-btn primary"
          >
            启用
          </button>
          <button
            @click="openSettings"
            class="action-btn secondary"
          >
            设置
          </button>
        </template>

        <!-- 未安装模块 -->
        <template v-else>
          <button
            v-if="module.price"
            @click="purchaseModule"
            class="action-btn primary"
          >
            购买 ¥{{ module.price }}
          </button>
          <button
            v-else
            @click="$emit('install', module.key)"
            class="action-btn primary"
          >
            安装
          </button>
        </template>

        <button
          @click="$emit('preview', module.key)"
          class="action-btn secondary"
        >
          预览
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useModuleManager } from '~/composables/useModuleManager'

interface ModuleCardProps {
  module: {
    key: string
    name: string
    version: string
    description: string
    author: string
    category: string
    tags: string[]
    icon: string
    price?: number
    screenshots?: string[]
    downloads: number
    rating: number
  }
}

const props = defineProps<ModuleCardProps>()

const emit = defineEmits<{
  install: [key: string]
  uninstall: [key: string]
  activate: [key: string]
  preview: [key: string]
}>()

const { getModuleInstance, isModuleActive } = useModuleManager()

const isInstalled = computed(() => getModuleInstance(props.module.key) !== null)
const isActive = computed(() => isModuleActive(props.module.key))

// 获取分类名称
function getCategoryName(category: string): string {
  const categoryMap: Record<string, string> = {
    ai: 'AI',
    visitor: '访客互动',
    '3d': '3D展示',
    admin: '后台管理',
    performance: '性能监控',
    i18n: '多语言',
    tools: '工具集',
    ui: 'UI组件',
    layout: '布局',
    content: '内容',
    security: '安全',
    analytics: '数据分析'
  }
  return categoryMap[category] || category
}

// 打开模块配置中枢（站点级 .NET 模块开关，非 per-key 插件设置页）
function openSettings() {
  navigateTo('/admin/settings/modules')
}

// 购买模块
async function purchaseModule() {
  try {
    // 这里应该跳转到支付页面或打开购买弹窗
    alert(`正在购买 ${props.module.name}，价格为 ¥${props.module.price}`)
  } catch (e) {
    console.error('Purchase failed:', e)
  }
}

onMounted(() => {
  // 可以在这里检查模块的购买状态
})
</script>

<style scoped>
.module-card {
  background: var(--color-bg-primary);
  border-radius: var(--radius-lg);
  overflow: hidden;
  box-shadow: 0 1px 3px var(--shadow);
  transition: all 0.3s ease;
  height: 100%;
  display: flex;
  flex-direction: column;
}

.module-card:hover {
  box-shadow: 0 4px 12px var(--shadow-lg);
  transform: translateY(-2px);
}

.module-cover {
  position: relative;
  height: var(--spacing-20);
  overflow: hidden;
  background: var(--color-bg-secondary);
}

.module-cover img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.module-icon {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  font-size: var(--text-3xl);
  opacity: 0.3;
}

.price-tag {
  position: absolute;
  top: var(--spacing-md);
  right: var(--spacing-md);
  background: var(--color-error);
  color: var(--color-text-primary);
  padding: var(--spacing-xs) var(--spacing-sm);
  border-radius: 9999px;
  font-size: var(--text-sm);
  font-weight: 600;
}

.free-tag {
  position: absolute;
  top: var(--spacing-md);
  right: var(--spacing-md);
  background: var(--color-success);
  color: var(--color-text-primary);
  padding: var(--spacing-xs) var(--spacing-sm);
  border-radius: 9999px;
  font-size: var(--text-sm);
  font-weight: 600;
}

.installed-badge {
  position: absolute;
  bottom: var(--spacing-md);
  left: var(--spacing-md);
  background: var(--color-success);
  color: var(--color-text-primary);
  padding: var(--spacing-xs) var(--spacing-sm);
  border-radius: 9999px;
  font-size: var(--text-sm);
  font-weight: 600;
}

.module-info {
  flex: 1;
  padding: var(--spacing-lg);
  display: flex;
  flex-direction: column;
}

.module-header {
  margin-bottom: var(--spacing-md);
}

.module-name {
  font-size: var(--text-xl);
  font-weight: 600;
  color: var(--color-text-primary);
  margin: 0 0 var(--spacing-sm) 0;
}

.module-meta {
  display: flex;
  gap: var(--spacing-sm);
  align-items: center;
  font-size: var(--text-sm);
}

.version {
  background: var(--color-border);
  color: var(--color-text-secondary);
  padding: var(--spacing-xs) var(--spacing-sm);
  border-radius: var(--radius-sm);
}

.category {
  color: var(--color-text-secondary);
}

.module-description {
  color: var(--color-text-secondary);
  font-size: var(--text-sm);
  line-height: 1.5;
  margin-bottom: var(--spacing-md);
  flex: 1;
}

.module-tags {
  display: flex;
  flex-wrap: wrap;
  gap: var(--spacing-sm);
  margin-bottom: var(--spacing-md);
}

.tag {
  background: var(--color-bg-secondary);
  color: var(--color-text-secondary);
  padding: var(--spacing-xs) var(--spacing-sm);
  border-radius: var(--radius-base);
  font-size: var(--text-xs);
}

.module-stats {
  display: flex;
  gap: var(--spacing-md);
  margin-bottom: var(--spacing-md);
  font-size: var(--text-sm);
  color: var(--color-text-secondary);
}

.stat-item {
  display: flex;
  align-items: center;
  gap: var(--spacing-xs);
}

.module-actions {
  display: flex;
  gap: var(--spacing-sm);
}

.action-btn {
  flex: 1;
  padding: var(--spacing-sm) var(--spacing-md);
  border: none;
  border-radius: var(--radius-sm);
  font-size: var(--text-sm);
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  text-align: center;
}

.action-btn.primary {
  background: var(--color-primary);
  color: white;
}

.action-btn.primary:hover {
  background: var(--color-primary-hover);
}

.action-btn.secondary {
  background: var(--color-bg-secondary);
  color: var(--color-text-main);
}

.action-btn.secondary:hover {
  background: var(--color-border);
}

@media (max-width: 640px) {
  .module-cover {
    height: 140px;
  }

  .module-info {
    padding: var(--spacing-md);
  }

  .module-name {
    font-size: var(--text-lg);
  }

  .module-stats {
    gap: var(--spacing-2);
  }

  .module-actions {
    flex-direction: column;
  }

  .action-btn {
    padding: var(--spacing-3);
  }
}
</style>