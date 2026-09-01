<template>
  <header class="header-container">
    <div class="header-nav-pill">
      <!-- Logo：与 Work 首页一致，使用浅底 favicon（wordmark 深色笔画在深色顶栏不可见） -->
      <div class="header-brand-row">
        <div
          class="header-brand-mark"
          role="button"
          tabindex="0"
          aria-label="站点标识（连点五次可进入管理登录）"
          title="点击标识可进入管理后台"
          @click.stop="handleLogoClick"
          @keydown.enter.prevent="handleLogoClick"
          @keydown.space.prevent="handleLogoClick"
          @mouseenter="handleAvatarHover"
        >
          <SiteBrandLogo variant="favicon" />
        </div>
        <NuxtLink to="/work" class="header-brand-text-link" aria-label="溪午听风工作站首页">
          <span class="header-brand-text">
            <strong>溪午听风</strong>
            <small>个人数字资产 | AI 产品实验室</small>
          </span>
        </NuxtLink>
      </div>

      <!-- Desktop Nav -->
      <nav class="header-nav-desktop" aria-label="Work 主导航">
        <NuxtLink
          v-for="item in navigationItems"
          :key="item.path"
          :to="item.path"
          class="header-nav-link"
          :class="isActiveRoute(item.path) ? 'header-nav-link-active' : 'header-nav-link-inactive'"
          :aria-current="isActiveRoute(item.path) ? 'page' : undefined"
        >
          {{ item.title }}
        </NuxtLink>
        <NavMoreMenu variant="home" />
      </nav>

      <!-- Right Actions -->
      <div class="header-actions">
        <!-- Search -->
        <NuxtLink to="/search" class="header-action-btn" aria-label="搜索站点内容">
          <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
          </svg>
        </NuxtLink>

        <NuxtLink :to="headerCta.path" class="header-primary-cta">
          {{ headerCta.title }}
          <span aria-hidden="true">→</span>
        </NuxtLink>

        <button
          type="button"
          @click="toggleMobileMenu"
          class="header-mobile-menu-button"
          aria-label="打开或关闭菜单"
          :aria-expanded="isMobileMenuOpen"
          aria-controls="header-mobile-nav"
        >
          <svg class="header-mobile-menu-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
              d="M4 6h16M4 12h16M4 18h16"/>
          </svg>
        </button>
      </div>
    </div>

    <Transition name="slide-down">
      <div v-if="isMobileMenuOpen" class="header-mobile-menu" id="header-mobile-nav">
        <nav class="header-mobile-menu-content" aria-label="Work 移动导航">
          <NuxtLink
            v-for="item in navigationItems"
            :key="item.path"
            :to="item.path"
            @click="closeMobileMenu"
            class="header-mobile-menu-item"
            :class="isActiveRoute(item.path)
              ? 'header-mobile-menu-item-active'
              : 'header-mobile-menu-item-inactive'"
            :aria-current="isActiveRoute(item.path) ? 'page' : undefined"
          >
            {{ item.title }}
          </NuxtLink>
          <div class="header-mobile-menu-label">更多</div>
          <NuxtLink
            v-for="item in moreNavItems"
            :key="item.path"
            :to="item.path"
            @click="closeMobileMenu"
            class="header-mobile-menu-item"
            :class="isActiveRoute(item.path)
              ? 'header-mobile-menu-item-active'
              : 'header-mobile-menu-item-inactive'"
            :aria-current="isActiveRoute(item.path) ? 'page' : undefined"
          >
            {{ item.title }}
          </NuxtLink>
          <NuxtLink
            to="/life"
            @click="closeMobileMenu"
            class="header-mobile-menu-item header-mobile-menu-item-inactive"
          >
            Life ↗
          </NuxtLink>
          <NuxtLink
            :to="headerCta.path"
            @click="closeMobileMenu"
            class="header-mobile-secondary-btn"
          >
            {{ headerCta.title }}
          </NuxtLink>
        </nav>
      </div>
    </Transition>
  </header>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import NavMoreMenu from '~/components/layout/NavMoreMenu.vue'
import SiteBrandLogo from '~/components/layout/SiteBrandLogo.vue'
import {
  WORK_HEADER_CTA,
  WORK_MORE_NAV,
  WORK_PRIMARY_NAV,
} from '~/constants/work-ia'
import { isWorkNavActive } from '~/utils/work-nav-active'

const moreNavItems = WORK_MORE_NAV
const navigationItems = WORK_PRIMARY_NAV
const headerCta = WORK_HEADER_CTA

// @ts-ignore - Nuxt 3 auto-imports
const router = useRouter()
// @ts-ignore - Nuxt 3 auto-imports
const route = useRoute()

const isMobileMenuOpen = ref(false)

// Secret admin access: 5 clicks within 3s on the logo avatar
let logoClickCount = 0
let logoClickTimer: NodeJS.Timeout | null = null
const SECRET_CLICKS = 5
const SECRET_TIMEOUT = 3000

const handleAvatarHover = () => {
  if (process.client && (window as any).handleAvatarHover) {
    (window as any).handleAvatarHover()
  }
}

const handleLogoClick = (e: MouseEvent) => {
  e.preventDefault()
  e.stopPropagation()

  logoClickCount++

  if (logoClickTimer) {
    clearTimeout(logoClickTimer)
  }

  if (logoClickCount >= SECRET_CLICKS) {
    router.push('/admin/login')
    logoClickCount = 0
    return
  }

  logoClickTimer = setTimeout(() => {
    logoClickCount = 0
  }, SECRET_TIMEOUT)
}

// Keyboard shortcut: Ctrl+Shift+A or Ctrl+K → admin login
onMounted(() => {
  const handleKeyPress = (e: KeyboardEvent) => {
    if ((e.ctrlKey && e.shiftKey && e.key === 'A') || (e.ctrlKey && e.key === 'k')) {
      e.preventDefault()
      router.push('/admin/login')
    }
    if (e.key === 'Escape' && isMobileMenuOpen.value) {
      isMobileMenuOpen.value = false
    }
  }

  window.addEventListener('keydown', handleKeyPress)

  onUnmounted(() => {
    window.removeEventListener('keydown', handleKeyPress)
    if (logoClickTimer) {
      clearTimeout(logoClickTimer)
    }
  })
})

const isActiveRoute = (path: string) => isWorkNavActive(route.path || '/', path)

const closeMobileMenu = () => {
  isMobileMenuOpen.value = false
}

const toggleMobileMenu = () => {
  isMobileMenuOpen.value = !isMobileMenuOpen.value
}
</script>
