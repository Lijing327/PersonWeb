<template>
  <div
    ref="rootEl"
    class="nav-more"
    :class="{ 'nav-more--home': variant === 'home' }"
  >
    <button
      type="button"
      class="nav-more__trigger"
      :class="{ 'nav-more__trigger--active': isTriggerActive }"
      :aria-expanded="open"
      aria-haspopup="true"
      @click.stop="toggle"
    >
      {{ label }}
      <svg class="nav-more__chev" viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden="true">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
      </svg>
    </button>
    <Transition name="nav-more-fade">
      <div v-show="open" class="nav-more__panel" role="menu">
        <template v-if="primaryItems?.length">
          <div class="nav-more__group-label" role="presentation">主要</div>
          <NuxtLink
            v-for="item in primaryItems"
            :key="item.href"
            :to="item.href"
            class="nav-more__link"
            role="menuitem"
            @click="close"
          >
            {{ item.label }}
          </NuxtLink>
          <div class="nav-more__divider" role="separator" />
          <div class="nav-more__group-label" role="presentation">更多</div>
        </template>
        <NuxtLink
          v-for="item in moreNavItems"
          :key="item.path"
          :to="item.path"
          class="nav-more__link"
          role="menuitem"
          @click="close"
        >
          {{ item.title }}
        </NuxtLink>
        <div class="nav-more__divider" role="separator" />
        <NuxtLink
          to="/life"
          class="nav-more__link"
          role="menuitem"
          @click="close"
        >
          Life ↗
        </NuxtLink>
      </div>
    </Transition>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, watch } from 'vue'
import { moreNavItems, moreNavPaths } from '~/constants/site-more-nav'

const props = withDefaults(
  defineProps<{
    variant?: 'header' | 'home'
    label?: string
    /** 窄屏下列出主导航 + 更多（仅首页等场景） */
    primaryItems?: Array<{ label: string; href: string }>
  }>(),
  {
    variant: 'header',
    label: '更多',
    primaryItems: undefined,
  },
)

const route = useRoute()
const open = ref(false)
const rootEl = ref<HTMLElement | null>(null)

const isTriggerActive = computed(() => {
  if (moreNavPaths.some((p) => route.path === p || route.path.startsWith(`${p}/`))) {
    return true
  }
  return false
})

const toggle = () => {
  open.value = !open.value
}

const close = () => {
  open.value = false
}

const onDocClick = (e: MouseEvent) => {
  const el = rootEl.value
  if (!el || !open.value) return
  if (!el.contains(e.target as Node)) {
    open.value = false
  }
}

onMounted(() => {
  document.addEventListener('click', onDocClick)
})

onUnmounted(() => {
  document.removeEventListener('click', onDocClick)
})

watch(
  () => route.fullPath,
  () => {
    open.value = false
  },
)
</script>

<style scoped>
.nav-more {
  position: relative;
  flex-shrink: 0;
}

.nav-more__trigger {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  border: none;
  cursor: pointer;
  font: inherit;
  transition: background 180ms ease, color 180ms ease;
}

.nav-more__chev {
  width: 14px;
  height: 14px;
  opacity: 0.75;
}

/* —— Header 胶囊内 —— */
.nav-more:not(.nav-more--home) .nav-more__trigger {
  padding: 6px 14px;
  border-radius: var(--radius-pill);
  font-size: 14px;
  font-weight: 500;
  color: var(--color-text-muted);
  background: transparent;
}

.nav-more:not(.nav-more--home) .nav-more__trigger:hover {
  color: var(--color-text);
  background: rgba(148, 163, 184, 0.08);
}

.nav-more:not(.nav-more--home) .nav-more__trigger--active {
  color: var(--color-text);
  background: rgba(148, 163, 184, 0.1);
}

/* —— 首页顶栏 —— */
.nav-more--home .nav-more__trigger {
  min-width: 4.6rem;
  padding: 1rem 0.6rem;
  justify-content: center;
  color: var(--home-text-muted, var(--color-text-muted));
  background: transparent;
  font-size: 0.96rem;
}

.nav-more--home .nav-more__trigger:hover,
.nav-more--home .nav-more__trigger--active {
  color: var(--home-text-main, var(--color-text));
}

.nav-more--home .nav-more__trigger--active {
  border-radius: 0.7rem;
  background: linear-gradient(180deg, rgba(67, 103, 255, 0.12), rgba(67, 103, 255, 0.02));
}

.nav-more__panel {
  position: absolute;
  top: calc(100% + 8px);
  right: 0;
  min-width: 200px;
  max-height: min(70vh, 420px);
  overflow-y: auto;
  padding: 6px;
  z-index: var(--z-dropdown, 60);
  background: rgba(8, 12, 24, 0.94);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-lg);
}

.nav-more--home .nav-more__panel {
  right: auto;
  left: 50%;
  transform: translateX(-50%);
  background: rgba(3, 10, 28, 0.94);
  border-color: var(--home-border, var(--color-border));
}

.nav-more__group-label {
  padding: 8px 12px 4px;
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: var(--color-text-muted);
  opacity: 0.85;
}

.nav-more__divider {
  height: 1px;
  margin: 6px 8px;
  background: var(--color-border);
  opacity: 0.85;
}

.nav-more__link {
  display: block;
  padding: 10px 12px;
  border-radius: var(--radius-md);
  font-size: 14px;
  font-weight: 500;
  color: var(--color-text-muted);
  text-decoration: none;
  transition: background 160ms ease, color 160ms ease;
}

.nav-more__link:hover {
  color: var(--color-text);
  background: var(--color-surface);
}

.nav-more-fade-enter-active,
.nav-more-fade-leave-active {
  transition: opacity 0.15s ease;
}

.nav-more-fade-enter-from,
.nav-more-fade-leave-to {
  opacity: 0;
}
</style>
