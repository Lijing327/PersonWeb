<template>
  <header class="header-container">
    <div class="header-nav-pill">
      <!-- Logo -->
      <div class="header-brand-row">
        <div
          class="header-brand-mark"
          title="点击标识可进入管理后台"
          @click.stop="handleLogoClick"
          @mouseenter="handleAvatarHover"
        >
          <SiteBrandLogo variant="wordmark" />
        </div>
        <NuxtLink to="/work" class="header-brand-text-link" aria-label="溪午听风工作站首页">
          <span class="header-brand-text">
            <small>个人数字资产 | AI 产品实验室</small>
          </span>
        </NuxtLink>
      </div>

      <!-- Desktop Nav -->
      <nav class="header-nav-desktop">
        <NuxtLink
          v-for="item in navigationItems"
          :key="item.path"
          :to="item.path"
          class="header-nav-link"
          :class="isActiveRoute(item.path) ? 'header-nav-link-active' : 'header-nav-link-inactive'"
        >
          {{ item.title }}
        </NuxtLink>
        <NavMoreMenu variant="home" />
      </nav>

      <!-- Right Actions -->
      <div class="header-actions">
        <!-- Search -->
        <NuxtLink to="/search" class="header-action-btn" title="搜索">
          <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
          </svg>
        </NuxtLink>

        <NuxtLink to="/ai" class="header-secondary-cta">
          AI 解决方案
        </NuxtLink>
        <NuxtLink to="/contact" class="header-primary-cta">
          联系合作
          <span aria-hidden="true">→</span>
        </NuxtLink>

        <button
          type="button"
          @click="toggleMobileMenu"
          class="header-mobile-menu-button"
          aria-label="菜单"
        >
          <svg class="header-mobile-menu-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
              d="M4 6h16M4 12h16M4 18h16"/>
          </svg>
        </button>
      </div>
    </div>

    <Transition name="slide-down">
      <div v-if="isMobileMenuOpen" class="header-mobile-menu">
        <nav class="header-mobile-menu-content">
          <NuxtLink
            v-for="item in navigationItems"
            :key="item.path"
            :to="item.path"
            @click="closeMobileMenu"
            class="header-mobile-menu-item"
            :class="isActiveRoute(item.path)
              ? 'header-mobile-menu-item-active'
              : 'header-mobile-menu-item-inactive'"
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
            to="/contact"
            @click="closeMobileMenu"
            class="header-mobile-secondary-btn"
          >
            联系合作
          </NuxtLink>
          <NuxtLink
            to="/ai"
            @click="closeMobileMenu"
            class="header-mobile-platform-btn"
          >
            AI 解决方案
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
import { moreNavItems, moreNavPaths } from '~/constants/site-more-nav'

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
  }

  window.addEventListener('keydown', handleKeyPress)

  onUnmounted(() => {
    window.removeEventListener('keydown', handleKeyPress)
    if (logoClickTimer) {
      clearTimeout(logoClickTimer)
    }
  })
})

const navigationItems: Array<{ title: string; path: string }> = [
  { title: '首页',    path: '/work' },
  { title: '产品',    path: '/products' },
  { title: '案例',    path: '/projects' },
  { title: 'AI实验室', path: '/lab' },
  { title: '文章',    path: '/blog' },
  { title: '关于',    path: '/about' },
]

const isActiveRoute = (path: string) => {
  if (!route || !route.path) return false

  if (path === '/work') {
    return route.path === '/work'
  }

  const prefixMatchPaths = [
    '/products',
    '/projects',
    '/blog',
    '/lab',
    '/about',
    '/contact',
    ...moreNavPaths,
  ]
  if (prefixMatchPaths.includes(path)) {
    return route.path === path || route.path.startsWith(`${path}/`)
  }

  return route.path === path
}

const closeMobileMenu = () => {
  isMobileMenuOpen.value = false
}

const toggleMobileMenu = () => {
  isMobileMenuOpen.value = !isMobileMenuOpen.value
}
</script>
