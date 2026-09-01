<template>
  <!-- 
    AI 实验室布局（ai.vue）
    用途：AI 相关页面的专用布局，包含顶部导航栏
    使用场景：AI 实验室首页 (/ai)、AI 相关详情页 (/ai/[type]/[slug])
    特点：主内容区域使用 pt-24（顶部内边距）
  -->
  <AppNaiveConfig mode="theme">
    <div class="ai-layout-shell public-site-shell min-h-screen flex flex-col bg-bg-body text-text-main">
      <main class="flex-1 pt-24">
        <slot />
      </main>

      <Footer />

      <MouseTrail v-if="showDesktopEnhancements" />
      <WorkAssistantHub v-if="showWorkAssistantHub" />
      <VisitorBehaviorListener v-if="showDesktopEnhancements" />
      <VisitorSidebarDrawer v-if="showDesktopEnhancements" />
    </div>
  </AppNaiveConfig>
</template>

<script setup lang="ts">
import { computed, defineAsyncComponent, onMounted, onUnmounted, ref } from 'vue'
import AppNaiveConfig from '~/components/layout/AppNaiveConfig.vue'
import Footer from '~/components/layout/Footer.vue'

const MouseTrail = defineAsyncComponent(() => import('~/components/effects/MouseTrail.vue'))
const WorkAssistantHub = defineAsyncComponent(() => import('~/components/work/WorkAssistantHub.vue'))
const VisitorBehaviorListener = defineAsyncComponent(() => import('~/components/VisitorBehaviorListener.vue'))
const VisitorSidebarDrawer = defineAsyncComponent(() => import('~/components/VisitorSidebarDrawer.vue'))

const shouldMountDeferredUi = ref(false)
const isLowPowerMode = ref(false)

const showDeferredWidgets = computed(() => shouldMountDeferredUi.value && !isLowPowerMode.value)
const showDesktopEnhancements = computed(() => showDeferredWidgets.value)
const showWorkAssistantHub = computed(() => showDeferredWidgets.value)

let deferredMountTimer: number | null = null

const detectLowPowerMode = () => {
  const coarsePointer = window.matchMedia('(pointer: coarse)').matches
  const narrowScreen = window.innerWidth < 1024
  const saveData = 'connection' in navigator && (navigator as Navigator & {
    connection?: { saveData?: boolean }
  }).connection?.saveData === true
  const lowMemoryValue = 'deviceMemory' in navigator
    ? Number((navigator as Navigator & { deviceMemory?: number }).deviceMemory || 0)
    : 0
  const lowMemory = lowMemoryValue > 0 && lowMemoryValue <= 4

  isLowPowerMode.value = coarsePointer || narrowScreen || saveData || lowMemory
}

const scheduleDeferredWidgets = () => {
  if (isLowPowerMode.value) {
    shouldMountDeferredUi.value = false
    return
  }

  const mountWidgets = () => {
    shouldMountDeferredUi.value = true
  }

  if ('requestIdleCallback' in window) {
    ;(window as Window & {
      requestIdleCallback: (callback: IdleRequestCallback, options?: IdleRequestOptions) => number
    }).requestIdleCallback(() => mountWidgets(), { timeout: 2000 })
    return
  }

  deferredMountTimer = window.setTimeout(mountWidgets, 1200)
}

onMounted(() => {
  detectLowPowerMode()
  scheduleDeferredWidgets()
})

onUnmounted(() => {
  if (deferredMountTimer) {
    window.clearTimeout(deferredMountTimer)
  }
})
</script>

<style scoped>
.ai-layout-shell {
  --floating-dock-right: max(18px, env(safe-area-inset-right));
  --floating-dock-bottom: max(18px, calc(env(safe-area-inset-bottom) + 14px));
}

@media (max-width: 767px) {
  .ai-layout-shell {
    --floating-dock-right: max(12px, env(safe-area-inset-right));
    --floating-dock-bottom: max(12px, calc(env(safe-area-inset-bottom) + 10px));
  }
}
</style>
