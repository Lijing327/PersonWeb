<template>
  <div
    class="min-h-screen bg-bg-body text-text-main"
    :data-module-theme="moduleTheme || undefined"
  >
    <section class="relative overflow-hidden border-b border-border-subtle pt-24 pb-16">
      <div class="absolute inset-0 pointer-events-none">
        <div class="absolute -top-32 -left-32 h-80 w-80 rounded-full bg-blue-600/30 blur-3xl"></div>
        <div class="absolute right-0 -bottom-40 h-96 w-96 rounded-full bg-purple-600/30 blur-3xl"></div>
        <div
          class="absolute inset-0 opacity-10"
          :style="{
            backgroundImage: 'linear-gradient(rgba(148, 163, 184, 0.12) 1px, transparent 1px), linear-gradient(90deg, rgba(148, 163, 184, 0.12) 1px, transparent 1px)',
            backgroundSize: '40px 40px'
          }"
        ></div>
      </div>

      <div class="relative mx-auto grid max-w-7xl items-center gap-10 px-4 sm:px-6 lg:grid-cols-2 lg:px-8">
        <div>
          <p class="mb-4 inline-flex items-center rounded-full border border-border-subtle bg-primary-soft px-3 py-1 text-xs text-text-muted">
            <span class="mr-2 h-1.5 w-1.5 rounded-full bg-primary"></span>
            AI + 3D + 交互实验空间
          </p>
          <h1 class="mb-4 text-3xl font-bold text-text-main sm:text-4xl lg:text-5xl">
            实验场
            <span class="mt-3 block text-lg font-normal text-text-muted sm:text-xl">
              未完成的 Demo 与交互实验入口，不是正式产品或商业方案。
            </span>
          </h1>
          <p class="mb-4 text-sm leading-relaxed text-text-muted sm:text-base">
            若要了解可合作的 AI 能力与方案，请看「AI 方案」；若要使用成品，请看「产品」。
          </p>
          <div class="flex flex-wrap gap-3">
            <NuxtLink
              to="/ai"
              class="inline-flex items-center text-sm text-primary transition-colors hover:text-primary-hover"
            >
              <i class="fas fa-robot mr-2"></i>
              查看 AI 工作台
            </NuxtLink>
            <NuxtLink
              to="/projects"
              class="inline-flex items-center text-sm text-text-muted transition-colors hover:text-text-main"
            >
              <i class="fas fa-arrow-right mr-2"></i>
              浏览项目展示
            </NuxtLink>
          </div>
        </div>

        <div class="hidden lg:block">
          <div class="relative aspect-square w-full">
            <div class="absolute inset-0 rounded-3xl bg-gradient-to-br from-cyan-500/20 to-purple-500/20 blur-3xl"></div>
            <div class="relative flex h-full items-center justify-center rounded-3xl border border-border-subtle bg-bg-card p-8 backdrop-blur-xl">
              <div class="text-center">
                <div class="mb-4 text-6xl">🧪</div>
                <p class="text-sm text-text-muted">实验性功能展示区</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <section class="py-16">
      <div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div class="mb-8 max-w-2xl">
          <h2 class="text-2xl font-semibold text-text-main">当前实验入口</h2>
          <p class="mt-3 text-sm leading-relaxed text-text-muted sm:text-base">
            下面这三块不是独立产品，而是实验室里的三个观察窗口，分别对应内容、作品和数据视角。
          </p>
        </div>

        <div class="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <AppCard class="p-6 backdrop-blur-xl">
            <h3 class="mb-3 flex items-center justify-between text-base font-semibold text-text-main">
              <span>📚 博客星球</span>
              <NuxtLink to="/blog" class="text-xs text-primary transition-colors hover:text-primary-hover">
                进入博客
              </NuxtLink>
            </h3>
            <p class="mb-4 text-xs leading-relaxed text-text-muted">
              围绕技术、思考与实践的内容记录。这里适合承接知识文章和阶段性总结。
            </p>
            <ClientOnly>
              <Scene3D v-if="enableScenePreview" type="earth" :show-hint="false" height="260px" />
              <div v-else class="lab-scene-fallback">
                <span class="lab-scene-fallback__icon">🌍</span>
                <span class="lab-scene-fallback__text">轻量预览模式</span>
              </div>
            </ClientOnly>
          </AppCard>

          <AppCard class="p-6 backdrop-blur-xl">
            <h3 class="mb-3 flex items-center justify-between text-base font-semibold text-text-main">
              <span>🚀 项目飞船</span>
              <NuxtLink to="/projects" class="text-xs text-primary transition-colors hover:text-primary-hover">
                查看项目
              </NuxtLink>
            </h3>
            <p class="mb-4 text-xs leading-relaxed text-text-muted">
              展示实战项目与开源尝试。这里更适合承接作品集、实验成果和技术实现。
            </p>
            <ClientOnly>
              <Scene3D v-if="enableScenePreview" type="spaceship" :show-hint="false" height="260px" />
              <div v-else class="lab-scene-fallback">
                <span class="lab-scene-fallback__icon">🚀</span>
                <span class="lab-scene-fallback__text">轻量预览模式</span>
              </div>
            </ClientOnly>
          </AppCard>

          <AppCard class="p-6 backdrop-blur-xl">
            <h3 class="mb-3 flex items-center justify-between text-base font-semibold text-text-main">
              <span>🪐 数据星球</span>
              <NuxtLink to="/dashboard" class="text-xs text-primary transition-colors hover:text-primary-hover">
                打开仪表盘
              </NuxtLink>
            </h3>
            <p class="mb-4 text-xs leading-relaxed text-text-muted">
              用来承接数据面板和趋势观察。后续也可以在这里接入更多可视化与实验型分析组件。
            </p>
            <ClientOnly>
              <Scene3D v-if="enableScenePreview" type="datasphere" :show-hint="false" height="260px" />
              <div v-else class="lab-scene-fallback">
                <span class="lab-scene-fallback__icon">🪐</span>
                <span class="lab-scene-fallback__text">轻量预览模式</span>
              </div>
            </ClientOnly>
          </AppCard>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import { defineAsyncComponent, onMounted, ref } from 'vue'
import AppCard from '~/components/ui/AppCard.vue'

const Scene3D = defineAsyncComponent(() => import('~/components/three/Scene3D.vue'))

const { moduleTheme } = useModuleTheme('ai_lab')
const enableScenePreview = ref(false)

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

  return coarsePointer || narrowScreen || saveData || lowMemory
}

const scheduleScenePreview = () => {
  if (detectLowPowerMode()) {
    enableScenePreview.value = false
    return
  }

  const mountScenePreview = () => {
    enableScenePreview.value = true
  }

  if ('requestIdleCallback' in window) {
    ;(window as Window & {
      requestIdleCallback: (callback: IdleRequestCallback, options?: IdleRequestOptions) => number
    }).requestIdleCallback(() => mountScenePreview(), { timeout: 1800 })
    return
  }

  window.setTimeout(mountScenePreview, 900)
}

onMounted(() => {
  scheduleScenePreview()
})

definePageMeta({
  layout: 'default'
})

usePageSeo({
  title: '实验场 - 溪午听风',
  description: '实验性 Demo 与交互入口；正式产品与 AI 合作方案请见产品与 AI 方案页。',
  path: '/lab',
  world: 'work',
})
</script>

<style scoped>
.lab-scene-fallback {
  display: flex;
  height: 260px;
  align-items: center;
  justify-content: center;
  flex-direction: column;
  gap: var(--spacing-sm);
  border: 1px dashed var(--color-border-subtle);
  border-radius: var(--radius-xl);
  background:
    radial-gradient(circle at top, color-mix(in srgb, var(--color-primary) 18%, transparent), transparent 55%),
    var(--color-bg-elevated);
  color: var(--color-text-muted);
}

.lab-scene-fallback__icon {
  font-size: 2rem;
}

.lab-scene-fallback__text {
  font-size: 0.875rem;
}
</style>
