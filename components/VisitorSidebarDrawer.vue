<template>
  <!-- 抽屉触发按钮 -->
  <button
    @click="toggleDrawer"
    class="visitor-drawer-trigger"
    :class="{ 'drawer-open': isOpen }"
    aria-label="打开访客功能"
  >
    <svg v-if="!isOpen" class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16" />
    </svg>
    <svg v-else class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
    </svg>
  </button>

  <!-- 抽屉遮罩层 -->
  <Transition name="fade">
    <div
      v-if="isOpen"
      @click="closeDrawer"
      class="visitor-drawer-overlay"
    ></div>
  </Transition>

  <!-- 抽屉内容 -->
  <Transition name="slide-left">
    <div
      v-if="isOpen"
      class="visitor-drawer"
      @click.stop
    >
      <!-- 抽屉头部 -->
      <div class="drawer-header">
        <h3 class="drawer-title">访客中心</h3>
        <button
          @click.stop.prevent="closeDrawer"
          class="drawer-close-btn"
          aria-label="关闭"
          type="button"
        >
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" pointer-events="none">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <!-- 抽屉内容区域 -->
      <div class="drawer-content">
        <!-- 访客等级显示 -->
        <div class="drawer-section">
          <VisitorLevelDisplay />
        </div>

        <!-- 挑战按钮 -->
        <div class="drawer-section">
          <VisitorChallengeButton />
        </div>

        <!-- 留言入口（与时间胶囊合并） -->
        <div class="drawer-section">
          <button type="button" class="drawer-message-btn" @click="openVisitorMessage">
            <i class="fas fa-comment-dots" aria-hidden="true"></i>
            <span>留个言</span>
            <small>审核通过后会出现在入口首页左侧弹幕区</small>
          </button>
        </div>

        <!-- 访客足迹地图 -->
        <div class="drawer-section">
          <VisitorFootprintMap />
        </div>
      </div>
    </div>
  </Transition>
</template>

<script setup lang="ts">
const isOpen = ref(false)

const toggleDrawer = () => {
  isOpen.value = !isOpen.value
}

const closeDrawer = (event?: Event) => {
  if (event) {
    event.preventDefault()
    event.stopPropagation()
  }
  isOpen.value = false
}

const openVisitorMessage = () => {
  closeDrawer()
  if (process.client) {
    window.dispatchEvent(new CustomEvent('open-visitor-message'))
  }
}

// 点击外部关闭
onMounted(() => {
  if (process.client) {
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && isOpen.value) {
        closeDrawer()
      }
    })
  }
})
</script>

<style scoped>
/* 触发按钮 */
.visitor-drawer-trigger {
  position: fixed;
  top: 5rem;
  right: 2rem;
  z-index: 999; /* 低于导航栏 (z-1000)，但高于其他内容 */
  width: 2.5rem;
  height: 2.5rem;
  background: rgba(30, 41, 59, 0.95);
  backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 0.625rem;
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
  transition: all 0.3s ease;
}

.visitor-drawer-trigger:hover {
  background: rgba(30, 41, 59, 1);
  transform: scale(1.05);
}

.visitor-drawer-trigger.drawer-open {
  background: rgba(59, 130, 246, 0.9);
}

/* 遮罩层 */
.visitor-drawer-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.3);
  backdrop-filter: blur(4px);
  z-index: 9998;
}

/* 抽屉容器 */
.visitor-drawer {
  position: fixed;
  top: 0;
  right: 0;
  bottom: 0;
  width: 320px;
  max-width: 90vw;
  background: rgba(30, 41, 59, 0.98);
  backdrop-filter: blur(20px);
  border-left: 1px solid rgba(255, 255, 255, 0.2);
  z-index: 9999;
  display: flex;
  flex-direction: column;
  box-shadow: -4px 0 24px rgba(0, 0, 0, 0.3);
  pointer-events: auto;
}

/* 抽屉头部 */
.drawer-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1.25rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  position: relative;
  z-index: 10000;
  flex-shrink: 0;
  pointer-events: auto;
  background: rgba(30, 41, 59, 0.98);
}

.drawer-title {
  font-size: 1.125rem;
  font-weight: 600;
  color: white;
  margin: 0;
  pointer-events: none;
}

.drawer-close-btn {
  width: 2rem;
  height: 2rem;
  display: flex;
  align-items: center;
  justify-content: center;
  color: rgba(255, 255, 255, 0.7);
  background: rgba(255, 255, 255, 0.1);
  border: none;
  border-radius: 0.5rem;
  cursor: pointer;
  transition: all 0.2s ease;
  position: relative;
  z-index: 10001;
  pointer-events: auto;
  flex-shrink: 0;
  -webkit-tap-highlight-color: transparent;
  isolation: isolate;
}

.drawer-close-btn:hover {
  color: white;
  background: rgba(255, 255, 255, 0.2);
}

.drawer-close-btn:active {
  transform: scale(0.95);
}

/* 抽屉内容 */
.drawer-content {
  flex: 1;
  overflow-y: auto;
  padding: 1.25rem;
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.drawer-section {
  width: 100%;
}

.drawer-message-btn {
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 0.25rem;
  padding: 0.85rem 1rem;
  border-radius: 0.625rem;
  border: 1px solid rgba(255, 255, 255, 0.15);
  background: rgba(59, 130, 246, 0.15);
  color: white;
  cursor: pointer;
  text-align: left;
  transition: background 0.2s ease;
}

.drawer-message-btn:hover {
  background: rgba(59, 130, 246, 0.28);
}

.drawer-message-btn i {
  font-size: 1rem;
  margin-bottom: 0.15rem;
}

.drawer-message-btn small {
  font-size: 0.75rem;
  color: rgba(255, 255, 255, 0.65);
}

/* 调整内部组件样式 */
.drawer-section :deep(.visitor-level-display) {
  position: relative;
  top: auto;
  right: auto;
  width: 100%;
  max-width: 100%;
  margin: 0;
}

.drawer-section :deep(.challenge-button-container) {
  position: relative;
  bottom: auto;
  right: auto;
  width: 100%;
}

.drawer-section :deep(.challenge-button) {
  width: 100%;
  justify-content: center;
}

/* 调整时间胶囊墙样式 */
.drawer-section :deep(.fixed) {
  position: relative !important;
  bottom: auto !important;
  right: auto !important;
  width: 100%;
}

.drawer-section :deep(.w-80) {
  width: 100% !important;
}

.drawer-section :deep(.h-\[500px\]) {
  height: auto !important;
  max-height: 400px;
}

/* 调整访客足迹地图样式 */
.drawer-section :deep(.footprint-map-container) {
  position: relative;
  width: 100%;
  min-height: 200px;
}

.drawer-section :deep(.footprint-button) {
  position: relative !important;
  bottom: auto !important;
  right: auto !important;
  margin-top: 1rem;
  width: 100%;
  border-radius: 0.5rem;
  height: 3rem;
}

/* 过渡动画 */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

.slide-left-enter-active,
.slide-left-leave-active {
  transition: transform 0.3s ease;
}

.slide-left-enter-from {
  transform: translateX(100%);
}

.slide-left-leave-to {
  transform: translateX(100%);
}
</style>

