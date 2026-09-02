<template>
  <!-- 
    默认布局（default.vue）
    用途：所有普通页面的默认布局，包含完整的顶部导航栏和页脚
    使用场景：博客、工具、项目展示、关于等所有前台页面
    注意：如果页面没有使用 definePageMeta 指定布局，Nuxt 3 会自动使用此布局
  -->
  <!-- 使用 AppNaiveConfig 统一管理 Naive UI 主题配置 -->
  <!-- mode="theme": 前台轻量模式，仅提供主题配置，不含 Message/Dialog/Notification -->
  <AppNaiveConfig mode="theme">
    <!-- 最外层容器：使用主题背景色和文字颜色 -->
    <div class="default-layout-shell public-site-shell min-h-screen flex flex-col relative"
      style="color: var(--color-text);">
    <div class="default-layout-backdrop">
      <div class="default-layout-backdrop-orb default-layout-backdrop-orb--primary"></div>
      <div class="default-layout-backdrop-orb default-layout-backdrop-orb--secondary"></div>
      <div class="default-layout-backdrop-grid"></div>
      <div class="default-layout-backdrop-noise"></div>
    </div>
    <ParticleBackground v-if="showParticleLayer" />
    
    <!-- 鼠标轨迹特效 -->
    <MouseTrail v-if="showDesktopEnhancements" />
    
    <!-- 注意：Header 已移至 app.vue 全局挂载，此处不再需要 -->
    
    <!-- 主要内容区域 -->
    <main class="default-layout-main flex-1 pt-20 relative z-10">
      <slot />
    </main>
    
    <!-- 页脚 -->
    <Footer />
    
    <!-- Work 统一浮动帮助入口（问 AI / 联系 / 留言） -->
    <WorkAssistantHub v-if="showWorkAssistantHub" />

    <!-- 已通过审核的访客留言弹幕 -->
    <VisitorDanmakuWall v-if="showWorkAssistantHub" />
    
    <!-- 访客互动式玩法（包含在抽屉中） -->
    <VisitorBehaviorListener v-if="showDesktopEnhancements" />
    <!-- 访客侧边栏抽屉（包含留言、互动等功能） -->
    <VisitorSidebarDrawer v-if="showDesktopEnhancements" />
    
    <!-- 隐秘的后台入口 -->
    <SecretAdminAccess />
    </div>
  </AppNaiveConfig>
</template>

<script setup lang="ts">
import { computed, defineAsyncComponent, onMounted, onUnmounted, ref } from 'vue'

// 显式导入组件，确保 Nuxt 3 自动导入正常工作
import AppNaiveConfig from '~/components/layout/AppNaiveConfig.vue'
import Footer from '~/components/layout/Footer.vue'
import SecretAdminAccess from '~/components/admin/SecretAdminAccess.vue'
import {
  shouldShowWorkDeferredChrome,
  shouldShowWorkParticleLayer,
} from '~/utils/work-layout-effects'

const ParticleBackground = defineAsyncComponent(() => import('~/components/effects/ParticleBackground.vue'))
const MouseTrail = defineAsyncComponent(() => import('~/components/effects/MouseTrail.vue'))
const VisitorDanmakuWall = defineAsyncComponent(() => import('~/components/VisitorDanmakuWall.vue'))
const WorkAssistantHub = defineAsyncComponent(() => import('~/components/work/WorkAssistantHub.vue'))
const VisitorBehaviorListener = defineAsyncComponent(() => import('~/components/VisitorBehaviorListener.vue'))
const VisitorSidebarDrawer = defineAsyncComponent(() => import('~/components/VisitorSidebarDrawer.vue'))
const route = useRoute()

const shouldMountDeferredUi = ref(false)
const isLowPowerMode = ref(false)

const effectOpts = computed(() => ({
  deferred: shouldMountDeferredUi.value,
  lowPower: isLowPowerMode.value,
}))

const showDesktopEnhancements = computed(() =>
  shouldShowWorkDeferredChrome(route.path || '/', effectOpts.value),
)
const showParticleLayer = computed(() =>
  shouldShowWorkParticleLayer(route.path || '/', effectOpts.value),
)
/** 单一浮动入口：详情阅读页 / 低功耗下不挂载 */
const showWorkAssistantHub = computed(() =>
  shouldShowWorkDeferredChrome(route.path || '/', effectOpts.value),
)

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
  if (!process.client) {
    return
  }

  let visitorId = localStorage.getItem('visitor_id')
  if (!visitorId) {
    visitorId = `visitor_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`
    localStorage.setItem('visitor_id', visitorId)
  }

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
.default-layout-shell {
  isolation: isolate;
  --floating-dock-right: max(18px, env(safe-area-inset-right));
  --floating-dock-bottom: max(18px, calc(env(safe-area-inset-bottom) + 14px));
  --floating-dock-gap: 14px;
  --floating-dock-button-size: 52px;
}

.default-layout-backdrop {
  position: absolute;
  inset: 0;
  overflow: hidden;
  pointer-events: none;
  z-index: 0;
}

.default-layout-backdrop-orb {
  position: absolute;
  border-radius: 9999px;
  filter: blur(100px);
  opacity: 0.3;
  transform: translateZ(0);
}

.default-layout-backdrop-orb--primary {
  top: 6rem;
  left: -8rem;
  width: 28rem;
  height: 28rem;
  background: radial-gradient(circle, rgba(59, 130, 246, 0.22) 0%, rgba(59, 130, 246, 0) 72%);
}

.default-layout-backdrop-orb--secondary {
  top: 30rem;
  right: -10rem;
  width: 30rem;
  height: 30rem;
  background: radial-gradient(circle, rgba(139, 92, 246, 0.2) 0%, rgba(139, 92, 246, 0) 72%);
}

.default-layout-backdrop-grid,
.default-layout-backdrop-noise {
  position: absolute;
  inset: 0;
}

.default-layout-backdrop-grid {
  background-image:
    linear-gradient(rgba(148, 163, 184, 0.08) 1px, transparent 1px),
    linear-gradient(90deg, rgba(148, 163, 184, 0.08) 1px, transparent 1px);
  background-size: 56px 56px;
  mask-image: radial-gradient(circle at top, rgba(0, 0, 0, 0.7), transparent 78%);
  opacity: 0.22;
}

.default-layout-backdrop-noise {
  opacity: 0.05;
  mix-blend-mode: soft-light;
  background-image: radial-gradient(rgba(255, 255, 255, 0.55) 0.7px, transparent 0.7px);
  background-size: 14px 14px;
}

.default-layout-main {
  position: relative;
}

.default-layout-main::before {
  content: '';
  position: absolute;
  inset: 0;
  pointer-events: none;
  background: linear-gradient(180deg, rgba(15, 23, 42, 0.08) 0%, rgba(15, 23, 42, 0) 12rem);
  opacity: 0.6;
}

html[data-theme='dark'] .default-layout-backdrop-grid,
html[data-theme='hybrid-super-dark'] .default-layout-backdrop-grid,
html.dark .default-layout-backdrop-grid {
  opacity: 0.14;
}

html[data-theme='dark'] .default-layout-backdrop-noise,
html[data-theme='hybrid-super-dark'] .default-layout-backdrop-noise,
html.dark .default-layout-backdrop-noise {
  opacity: 0.04;
}

@media (max-width: 767px) {
  .default-layout-shell {
    --floating-dock-right: max(12px, env(safe-area-inset-right));
    --floating-dock-bottom: max(12px, calc(env(safe-area-inset-bottom) + 10px));
    --floating-dock-gap: 10px;
    --floating-dock-button-size: 44px;
  }

  .default-layout-backdrop-orb--primary {
    width: 18rem;
    height: 18rem;
    left: -6rem;
  }

  .default-layout-backdrop-orb--secondary {
    width: 20rem;
    height: 20rem;
    right: -7rem;
    top: 24rem;
  }

  .default-layout-backdrop-grid {
    background-size: 40px 40px;
  }
}
</style>
