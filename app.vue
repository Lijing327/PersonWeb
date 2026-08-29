<template>
  <!--
    Nuxt 3 应用根组件
    顶部导航栏在此全局挂载，确保所有页面（无论使用什么 layout）都显示导航栏
    注意：只有明确设置 layout: false 的页面（如登录页）才会不显示导航栏
  -->
  <div class="min-h-screen">
    <!-- 顶部导航栏，全站统一（排除后台登录页和所有后台管理页面） -->
    <Header v-if="shouldShowHeader" />

    <!-- 页面主体区域 -->
    <NuxtLayout>
      <NuxtPage />
    </NuxtLayout>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import Header from '~/components/layout/Header.vue'

const route = useRoute()

// 判断是否应该显示顶部导航栏
// 不显示导航栏的页面：登录页、所有后台管理页面等特殊页面
const shouldShowHeader = computed(() => {
  const path = route.path
  // 双入口页、工作首页、生活站都使用各自的独立 Header
  if (path === '/' || path === '/work' || path === '/life' || path.startsWith('/life/')) {
    return false
  }
  // 登录页不显示导航栏
  if (path === '/admin/login') {
    return false
  }
  // 所有后台管理页面（/admin 或 /admin/*）都不显示导航栏
  if (path === '/admin' || path.startsWith('/admin/')) {
    return false
  }
  // 其他所有页面都显示导航栏
  return true
})
</script>

