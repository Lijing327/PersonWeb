<template>
  <!-- 
    后台管理内容布局（admin-content-only.vue）
    用途：后台管理系统的内容布局，不包含侧边栏，用于在 iframe 中嵌入
    使用场景：在资产管理模块中嵌入其他管理页面时使用
  -->
  <div 
    class="min-h-screen admin-content-only-layout"
    :style="layoutStyle"
  >
    <!-- 只显示内容区域，不包含侧边栏 -->
    <main class="w-full">
      <slot />
    </main>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useTheme } from '~/composables/useTheme'

useHead({
  meta: [
    { key: 'robots', name: 'robots', content: 'noindex,nofollow' },
  ],
})

const { currentTheme } = useTheme()

// 布局样式
const layoutStyle = computed(() => {
  return {
    backgroundColor: 'var(--color-bg-body)',
    color: 'var(--color-text-main)'
  }
})
</script>

<style scoped>
.admin-content-only-layout {
  background: var(--color-bg-body);
  color: var(--color-text-main);
}

.admin-content-only-layout main {
  padding: 0;
  margin: 0;
}
</style>
