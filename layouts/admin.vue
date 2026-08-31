<template>
  <!-- 
    后台管理布局（admin.vue）
    用途：后台管理系统的专用布局，不包含前台顶部导航栏，使用侧边栏导航
    使用场景：所有 /admin/* 路径下的页面
    注意：此布局不包含前台 Header 组件，这是正确的设计，因为后台管理系统有自己的导航体系
  -->
  <div class="min-h-screen flex admin-layout admin-layout--surface">
    <!-- 移动端遮罩层 -->
    <div 
      v-if="!isEmbedded && isMobileMenuOpen"
      class="fixed inset-0 bg-black/50 z-40 md:hidden"
      @click="isMobileMenuOpen = false"
    ></div>

    <!-- 侧边栏：使用主题颜色，替换写死的 text-white 和 border-slate-700 -->
    <!-- 注意：后台管理布局不包含前台 Header 组件，使用侧边栏导航 -->
    <!-- 如果在 iframe 中嵌入，则隐藏侧边栏 -->
    <aside 
      v-if="!isEmbedded"
      class="w-64 flex flex-col fixed h-full left-0 top-0 z-50 admin-sidebar transition-transform duration-300 ease-in-out md:translate-x-0"
      :class="{ 
        '-translate-x-full md:translate-x-0': !isMobileMenuOpen,
        'translate-x-0': isMobileMenuOpen
      }"
      :style="sidebarStyle"
    >
      <div class="admin-sidebar-brand border-b admin-sidebar-header">
        <div class="admin-sidebar-brand-title">管理后台</div>
        <div class="admin-sidebar-brand-sub">溪午听风 · 控制台</div>
      </div>
      <nav class="flex-1 p-4 space-y-1 overflow-y-auto">
        <!-- 动态菜单：基于配置文件生成 -->
        <template v-for="(group, groupIndex) in safeMenu" :key="group.label">
          <!-- 菜单组 -->
          <div class="menu-group">
            <button 
              type="button"
              @click="toggleMenu(groupIndex)"
              class="menu-group-header"
              :class="{ 'menu-group-active': isGroupActive(group) }"
            >
              <i 
                class="fas fa-chevron-right menu-group-chevron" 
                :class="{ 'rotate-90': expandedMenus[groupIndex] }"
                aria-hidden="true"
              ></i>
              <i
                v-if="group.icon"
                :class="group.icon"
                class="menu-group-icon"
                aria-hidden="true"
              ></i>
              <span class="menu-group-title">{{ group.label }}</span>
            </button>
            <div v-show="expandedMenus[groupIndex]" class="menu-group-items">
              <template v-for="item in group.children" :key="item.path">
                <NuxtLink
                  v-if="item.path"
                  :to="item.path"
                  @click="isMobileMenuOpen = false"
                  class="flex items-center px-4 py-2 rounded-md transition-colors admin-sidebar-link text-sm"
                  :class="{ 'admin-sidebar-link-active': isItemActive(item.path) }"
                >
                  <i :class="getMenuItemIcon(item.label)" class="w-5 text-center mr-3"></i>
                  <span>{{ item.label }}</span>
                </NuxtLink>
              </template>
            </div>
          </div>
        </template>

      </nav>
      
      <!-- 退出登录区域：使用主题边框颜色，替换写死的 border-slate-700 -->
      <div class="p-4 border-t border-border-subtle">
        <button type="button" @click="logout" class="w-full flex items-center px-4 py-2 text-left rounded transition-colors admin-sidebar-link">
          <i class="fas fa-sign-out-alt w-5 text-center mr-3"></i>
          <span class="text-sm font-medium">退出登录</span>
        </button>
      </div>
    </aside>

    <!-- 主内容区：使用主题背景色和文字颜色 -->
    <main 
      class="flex-1 admin-main flex flex-col" 
      :class="{ 'md:ml-64': !isEmbedded }"
      :style="mainContentStyle"
    >
      <!-- 顶部栏（包含移动端菜单按钮和铃铛入口） -->
      <ClientOnly>
        <div class="admin-topbar border-b border-border-subtle bg-bg-elevated px-4 md:px-6 py-3 md:py-4 flex items-center justify-between gap-4">
          <div class="flex items-center gap-3 min-w-0 flex-1">
            <button
              v-if="!isEmbedded"
              type="button"
              @click="isMobileMenuOpen = !isMobileMenuOpen"
              class="md:hidden p-2 rounded-md hover:bg-bg-elevated transition-colors shrink-0"
              aria-label="切换菜单"
            >
              <i class="fas text-lg" :class="isMobileMenuOpen ? 'fa-times' : 'fa-bars'" aria-hidden="true"></i>
            </button>
            <div class="admin-breadcrumb min-w-0 hidden sm:flex flex-col sm:flex-row sm:items-baseline sm:gap-2">
              <span class="admin-breadcrumb-root">控制台</span>
              <template v-if="currentNav.group">
                <span class="admin-breadcrumb-sep" aria-hidden="true">/</span>
                <span class="admin-breadcrumb-group">{{ currentNav.group }}</span>
              </template>
              <template v-if="currentNav.page">
                <span class="admin-breadcrumb-sep" aria-hidden="true">/</span>
                <span class="admin-breadcrumb-page truncate">{{ currentNav.page }}</span>
              </template>
            </div>
            <div class="admin-breadcrumb-mobile sm:hidden truncate text-sm font-medium text-text-main">
              {{ currentNav.page || '管理后台' }}
            </div>
          </div>
          <div class="flex items-center gap-4 shrink-0">
            <NotificationBell />
          </div>
        </div>
      </ClientOnly>

      <!-- 使用统一的 AppNaiveConfig，确保前台和后台共用同一套主题配置 -->
      <!-- 使用 ClientOnly 避免 SSR 时的闪烁 -->
      <div class="flex-1 overflow-auto admin-main-scroll">
        <ClientOnly>
          <AppNaiveConfig>
            <div class="admin-page-shell">
              <slot />
            </div>
          </AppNaiveConfig>
          <template #fallback>
            <div class="admin-main-fallback admin-page-shell">
              <slot />
            </div>
          </template>
        </ClientOnly>
      </div>
    </main>

    <!-- 鼠标轨迹特效 -->
    <ClientOnly>
      <MouseTrail />
    </ClientOnly>
    
    <!-- AI 智能助手 -->
    <ClientOnly>
      <!-- 后台管理中隐藏 AI 助手 -->
      <!-- <AIAssistant /> -->
    </ClientOnly>
    
    <!-- 访客互动功能 -->
    <ClientOnly>
      <!-- 后台管理中隐藏访客互动面板 -->
      <!-- <VisitorInteractionPanel /> -->
    </ClientOnly>
  </div>
</template>

<script setup lang="ts">
import '~/assets/css/visitor-interaction.css'
import '~/assets/css/charts.css'
import { onMounted, computed, watch, ref } from 'vue'
import { useAdminGlobalStyle } from '~/composables/useAdminStyle'
import AppNaiveConfig from '~/components/layout/AppNaiveConfig.vue'
import MouseTrail from '~/components/effects/MouseTrail.vue'
import { adminMenu, type AdminMenuGroup } from '~/constants/admin/menu'

useHead({
  meta: [
    { key: 'robots', name: 'robots', content: 'noindex,nofollow' },
  ],
})

const router = useRouter()
const route = useRoute()

// 检测是否在 iframe 中嵌入（通过 URL 参数或 window 检测）
const isEmbedded = ref(false)
const { globalStyle, styleConfig, cssVariables, inlineStyle, fetchGlobalStyle } = useAdminGlobalStyle()

// 获取所有路由路径（用于过滤不存在的路由）
const routePaths = computed(() => {
  if (!process.client) return new Set<string>()
  try {
    const routes = router.getRoutes()
    const pathSet = new Set<string>()
    routes.forEach(r => {
      // 添加精确路径
      pathSet.add(r.path)
      // 对于动态路由，也添加基础路径（如 /admin/articles 匹配 /admin/articles/:id）
      if (r.path.includes('[') || r.path.includes(':')) {
        const basePath = r.path.split(/[\[:]/)[0]
        if (basePath) pathSet.add(basePath)
      }
    })
    return pathSet
  } catch {
    return new Set<string>()
  }
})

// 过滤掉不存在的路由（简化逻辑，避免过度过滤）
const safeMenu = computed(() => {
  // SSR 阶段或路由未加载时，直接返回所有菜单
  if (!process.client || routePaths.value.size === 0) {
    return adminMenu
  }
  
  const paths = routePaths.value
  return adminMenu.map(group => ({
    ...group,
    children: (group.children ?? []).filter(item => {
      if (!item.path) return false
      // 检查精确路径匹配
      if (paths.has(item.path)) return true
      // 检查是否有子路由（路径前缀匹配）
      const hasSubRoute = Array.from(paths).some(p => {
        // 精确匹配子路由
        if (p.startsWith(item.path + '/')) return true
        // 对于动态路由，检查基础路径（如 /admin/articles 匹配 /admin/articles/:id）
        const itemParts = item.path.split('/')
        const routeParts = p.split('/')
        if (itemParts.length <= routeParts.length) {
          // 检查前几段是否匹配
          return itemParts.every((part, i) => {
            if (i >= routeParts.length) return false
            return part === routeParts[i] || routeParts[i].startsWith('[') || routeParts[i].startsWith(':')
          })
        }
        return false
      })
      return hasSubRoute
    })
  })).filter(group => group.children && group.children.length > 0)
})

// 菜单折叠状态（使用索引作为 key）
const expandedMenus = ref<Record<number, boolean>>({})

// 移动端菜单开关状态
const isMobileMenuOpen = ref(false)

// 切换菜单展开/折叠
const toggleMenu = (groupIndex: number) => {
  expandedMenus.value[groupIndex] = !expandedMenus.value[groupIndex]
}

// 检查菜单项是否激活
const isItemActive = (path?: string): boolean => {
  if (!path) return false
  const currentPath = route.path
  // 精确匹配
  if (currentPath === path) return true
  // 路径前缀匹配（确保是子路径，不是部分匹配）
  if (currentPath.startsWith(path + '/')) return true
  // 特殊处理：/admin 路径
  if (path === '/admin' && currentPath === '/admin') return true
  return false
}

// 检查菜单组是否激活（组内任意子项激活）
const isGroupActive = (group: AdminMenuGroup): boolean => {
  return group.children.some(item => isItemActive(item.path))
}

// 顶栏：当前所在分组与页面（取长路径前缀匹配）
const currentNav = computed(() => {
  const p = route.path
  let bestLen = 0
  let group = ''
  let page = ''
  for (const g of safeMenu.value) {
    for (const item of g.children) {
      const path = item.path
      if (p === path || p.startsWith(path + '/')) {
        if (path.length >= bestLen) {
          bestLen = path.length
          group = g.label
          page = item.label
        }
      }
    }
  }
  if (!page && p.startsWith('/admin')) {
    page = '管理后台'
  }
  return { group, page }
})

// 获取菜单项图标
const getMenuItemIcon = (label: string): string => {
  const iconMap: Record<string, string> = {
    '仪表盘': 'fas fa-chart-line',
    '内容中枢': 'fas fa-sitemap',
    '文章管理': 'fas fa-file-alt',
    '项目管理': 'fas fa-project-diagram',
    '工具管理': 'fas fa-tools',
    '分类管理': 'fas fa-folder',
    '访客数据': 'fas fa-users',
    '访客留言': 'fas fa-comments',
    '数据分析': 'fas fa-chart-bar',
    '投资管理': 'fas fa-chart-line',
    '订单管理': 'fas fa-shopping-cart',
    'AI 管理': 'fas fa-robot',
    'AI 内容': 'fas fa-brain',
    'AI 日志': 'fas fa-scroll',
    '情报首页': 'fas fa-home',
    '内容列表': 'fas fa-list-ul',
    '每日简报': 'fas fa-newspaper',
    '来源管理': 'fas fa-rss',
    '错误日志': 'fas fa-bug',
    '关系管理': 'fas fa-heart',
    '副业项目': 'fas fa-briefcase',
    '技能树': 'fas fa-sitemap',
    '工具箱': 'fas fa-toolbox',
    '系统设置': 'fas fa-cog',
    '主题设置': 'fas fa-palette',
    '模块管理': 'fas fa-puzzle-piece',
    '用户管理': 'fas fa-user-cog',
    '认知说明书': 'fas fa-book-open',
    '思维记录': 'fas fa-pen-fancy',
  }
  return iconMap[label] || 'fas fa-circle'
}

// 根据当前路由自动展开对应的菜单组；宽屏下未手动折叠过的分组默认展开
const autoExpandMenu = () => {
  safeMenu.value.forEach((group, index) => {
    if (isGroupActive(group)) {
      expandedMenus.value[index] = true
    }
  })
  if (!process.client || typeof window === 'undefined') return
  if (window.innerWidth >= 768) {
    safeMenu.value.forEach((_, index) => {
      if (expandedMenus.value[index] === undefined) {
        expandedMenus.value[index] = true
      }
    })
  }
}

// 监听路由变化，自动展开对应菜单
watch(() => route.path, (newPath, oldPath) => {
  if (newPath !== oldPath) {
    autoExpandMenu()
    // 移动端：路由变化时自动关闭菜单
    if (process.client && window.innerWidth < 769) {
      isMobileMenuOpen.value = false
    }
  }
}, { immediate: true, flush: 'post' })

// 监听菜单变化，自动展开
watch(safeMenu, () => {
  autoExpandMenu()
}, { immediate: true })

// 侧边栏样式 - 使用 memo 避免不必要的重新计算
const sidebarStyle = computed(() => {
  const vars = cssVariables.value
  const bg = vars['--admin-sidebar-bg'] || '#1e293b'
  const text = vars['--admin-sidebar-text'] || '#ffffff'
  return {
    backgroundColor: bg,
    color: text
  }
})

// 主内容区样式（Vision Pro 风格 - 深色模式下使用渐变）
const mainContentStyle = computed(() => {
  // 如果在 iframe 中，减少 padding
  if (isEmbedded.value) {
    return {
      padding: '0'
    }
  }
  return {
    minHeight: '100vh',
    position: 'relative',
    zIndex: 1
  }
})

// 应用 CSS 变量到根元素
onMounted(() => {
  fetchGlobalStyle()
  
  // 检测是否在 iframe 中嵌入（通过 URL 参数或 window 检测）
  // 检测 URL 参数
  if (route.query.embedded === 'true') {
    isEmbedded.value = true
  } else if (process.client) {
    // 检测是否在 iframe 中
    try {
      isEmbedded.value = window.self !== window.top
    } catch (e) {
      // 跨域情况下会抛出异常，此时也认为是在 iframe 中
      isEmbedded.value = true
    }
  }
})

// 监听 CSS 变量变化，应用到根元素
// 使用 shallowRef 存储上一次的值，避免不必要的更新
const lastCssVars = ref<Record<string, string>>({})

watch(cssVariables, (vars) => {
  if (!process.client) return
  
  // 检查是否有真正的变化
  const hasChanged = Object.keys(vars).some(key => {
    return lastCssVars.value[key] !== vars[key]
  }) || Object.keys(lastCssVars.value).some(key => {
    return !(key in vars)
  })
  
  if (!hasChanged) return
  
  // 批量更新，减少 DOM 操作
  requestAnimationFrame(() => {
    Object.entries(vars).forEach(([key, value]) => {
      if (lastCssVars.value[key] !== value) {
        document.documentElement.style.setProperty(key, value)
        lastCssVars.value[key] = value
      }
    })
    
    // 清理不再存在的变量
    Object.keys(lastCssVars.value).forEach(key => {
      if (!(key in vars)) {
        document.documentElement.style.removeProperty(key)
        delete lastCssVars.value[key]
      }
    })
  })
}, { immediate: true, flush: 'post' })

const handleLinkClick = (e: MouseEvent) => {
  // 确保点击事件正常触发
  if (process.env.NODE_ENV === 'development') {
    console.log('Link clicked:', (e.currentTarget as HTMLElement)?.getAttribute('href'))
  }
  // 不阻止默认行为，让 NuxtLink 正常处理
}

const logout = async () => {
  if (!confirm('确定要退出登录吗？')) {
    return
  }

  try {
    await $fetch('/api/auth/logout', {
      method: 'POST',
      credentials: 'include',
    })
  } catch {
    // ignore network errors — still clear client state
  }

  if (process.client) {
    localStorage.removeItem('admin_token')
    localStorage.removeItem('admin_user')
  }

  router.push('/admin/login')
}
</script>

<style scoped>
/* 整页背景与主内容区宽度 */
.admin-layout--surface {
  background-color: var(--color-bg-body);
}

.admin-page-shell {
  width: 100%;
  max-width: none;
  margin-left: 0;
  margin-right: 0;
  padding: var(--spacing-md);
  min-height: 100%;
  position: relative;
  z-index: 1;
  box-sizing: border-box;
}

@media (min-width: 768px) {
  .admin-page-shell {
    padding: var(--spacing-lg) var(--spacing-xl);
  }
}

.admin-sidebar-brand {
  padding: var(--spacing-lg) var(--spacing-md);
}

.admin-sidebar-brand-title {
  font-size: var(--font-size-h4, 1.125rem);
  font-weight: 700;
  letter-spacing: 0.04em;
  color: var(--color-text-main) !important;
}

.admin-sidebar-brand-sub {
  margin-top: var(--spacing-xs);
  font-size: var(--font-size-xs);
  color: var(--color-text-muted) !important;
  font-weight: 500;
  letter-spacing: 0.02em;
}

.admin-breadcrumb {
  font-size: var(--font-size-sm);
  color: var(--color-text-muted);
  line-height: 1.35;
}

.admin-breadcrumb-root {
  font-weight: 500;
  color: var(--color-text-muted);
}

.admin-breadcrumb-sep {
  opacity: 0.45;
  font-weight: 400;
}

.admin-breadcrumb-group {
  font-weight: 600;
  color: var(--color-text-main);
}

.admin-breadcrumb-page {
  font-weight: 500;
  color: var(--color-text-main);
}

.admin-breadcrumb-mobile {
  color: var(--color-text-main);
}

.menu-group-icon {
  width: 1rem;
  text-align: center;
  margin-right: 0.375rem;
  font-size: 0.8125rem;
  opacity: 0.88;
  color: var(--color-text-muted) !important;
  flex-shrink: 0;
}

.menu-group-header:hover .menu-group-icon {
  opacity: 1;
  color: var(--color-primary) !important;
}

.menu-group-chevron {
  font-size: 0.625rem;
  width: 0.875rem;
  margin-right: 0.375rem;
  transition: transform 0.2s ease;
  opacity: 0.65;
  color: var(--color-text-muted) !important;
  flex-shrink: 0;
}

.menu-group-header:hover .menu-group-chevron {
  opacity: 0.95;
  color: var(--color-text-main) !important;
}

.menu-group-active .menu-group-chevron {
  opacity: 1;
  color: var(--color-text-main) !important;
}

/* 侧边栏基础样式 */
.admin-sidebar {
  background-color: var(--color-bg-card) !important;
  border-right: 1px solid var(--color-border-subtle);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  box-shadow: var(--shadow-lg);
  color: var(--color-text-main) !important;
}

.admin-sidebar * {
  color: inherit;
}

.admin-sidebar-header {
  color: var(--color-text-main) !important;
  border-color: var(--color-border-subtle) !important;
  background: var(--color-bg-elevated, rgba(255, 255, 255, 0.02));
}

.admin-sidebar-header span {
  color: var(--color-text-main) !important;
  font-weight: 700;
  letter-spacing: 0.05em;
}

/* 侧边栏链接样式 */
.admin-sidebar-link {
  color: var(--color-text-muted) !important;
  background-color: transparent;
  cursor: pointer;
  text-decoration: none;
  display: flex;
  align-items: center;
  position: relative;
  z-index: 1;
  font-size: 0.875rem;
  line-height: 1.5;
  min-height: 2.25rem;
  margin: 0.25rem 0.5rem;
  border-radius: var(--radius-md);
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
}

.admin-sidebar-link span {
  color: inherit !important;
  font-weight: 500;
}

.admin-sidebar-link i {
  color: var(--color-text-muted) !important;
  opacity: 0.7;
  transition: all 0.2s;
}

.admin-sidebar-link:hover {
  background-color: var(--color-bg-elevated) !important;
  color: var(--color-text-main) !important;
  transform: translateX(4px);
}

.admin-sidebar-link:hover i {
  color: var(--color-primary-hover) !important;
  opacity: 1;
}

.admin-sidebar-link-active {
  background: linear-gradient(90deg, var(--color-primary-soft), transparent) !important;
  color: var(--color-primary) !important;
  font-weight: 600;
  border-left: 3px solid var(--color-primary);
  border-radius: 0 var(--radius-md) var(--radius-md) 0;
  margin-left: 0; 
  padding-left: calc(1rem + 3px); /* Compensate for margin removal */
}

.admin-sidebar-link-active i {
  color: var(--color-primary) !important;
  opacity: 1;
}

.admin-sidebar-link-active span {
  color: var(--color-primary) !important;
}

/* 菜单组标题样式 */
/* 菜单组标题（分组名） */
.menu-group-title {
  color: var(--color-text-muted) !important;
  font-weight: 600;
  font-size: var(--font-size-xs);
  letter-spacing: 0.06em;
  flex: 1;
  text-align: left;
}

.menu-group-header:hover .menu-group-title {
  color: var(--color-text-main) !important;
  opacity: 1;
}

.menu-group-active .menu-group-title {
  color: var(--color-text-main) !important;
  opacity: 1;
}

/* 确保链接可点击 */
.admin-sidebar-link,
.admin-sidebar-link * {
  pointer-events: auto !important;
  user-select: none;
}

/* 确保侧边栏本身可交互 */
.admin-sidebar {
  pointer-events: auto !important;
}

.admin-sidebar nav {
  pointer-events: auto !important;
  scrollbar-width: thin;
  scrollbar-color: var(--color-border-default) transparent;
}

/* 主内容区背景 - 根据主题自动适配 */
.admin-main,
.admin-main-fallback {
  background: var(--n-body-color, var(--color-bg-body)) !important;
  color: var(--color-text-main) !important;
  position: relative;
}

/* 噪点纹理（可选，性能可接受前提下） */
.admin-main::before {
  content: '';
  position: fixed;
  inset: 0;
  background-image: 
    radial-gradient(circle at 20% 30%, var(--color-primary-soft, rgba(59, 130, 246, 0.02)) 0%, transparent 30%),
    radial-gradient(circle at 80% 70%, var(--color-primary-soft, rgba(96, 165, 250, 0.015)) 0%, transparent 30%);
  pointer-events: none;
  z-index: 0;
  opacity: 0.6;
}

/* 覆盖 Admin 内的 Naive UI 全局样式，使其更贴合后台风格 */
.admin-main {
  /* 可以在这里微调 Admin 专属的变量覆盖 */
}

/* 如果配置了网格背景 */
.admin-layout::before {
  content: '';
  position: fixed;
  inset: 0;
  background-image: 
    linear-gradient(var(--admin-sidebar-text, #ffffff) 1px, transparent 1px),
    linear-gradient(90deg, var(--admin-sidebar-text, #ffffff) 1px, transparent 1px);
  background-size: var(--admin-grid-size, 40px) var(--admin-grid-size, 40px);
  opacity: var(--admin-grid-opacity, 0.03);
  pointer-events: none;
  z-index: 0;
}

/* 确保后台布局不影响前端导航 */
.admin-layout {
  position: relative;
  z-index: 1;
}

.admin-sidebar {
  z-index: 50;
}

.admin-main {
  position: relative;
  z-index: 1;
  max-width: 100%;
  overflow-x: hidden; /* 防止水平滚动 */
  box-sizing: border-box;
}

/* 响应式：移动端优化 */
@media (max-width: 768px) {
  .admin-main {
    margin-left: 0 !important;
    padding: 0 !important;
  }

  /* 移动端侧边栏宽度调整 */
  .admin-sidebar {
    width: 280px;
    max-width: 85vw;
  }

  /* 移动端菜单项字体大小 */
  .admin-sidebar-link {
    font-size: 0.9375rem;
    padding: 0.75rem 1rem;
  }

  /* 移动端菜单组标题 */
  .menu-group-title {
    font-size: 0.6875rem;
  }

  /* 移动端顶部栏按钮样式 */
  .admin-topbar button {
    min-width: 44px;
    min-height: 44px;
  }
}

/* 桌面端：侧边栏始终显示 */
@media (min-width: 769px) {
  .admin-sidebar {
    transform: translateX(0) !important;
  }
}

/* 确保卡片可见 - 使用 CSS 变量，自动适配主题 */
.admin-main :deep(.card),
.admin-main :deep(.page-container),
.admin-main :deep(.app-card) {
  background: var(--color-bg-elevated, var(--color-bg-card)) !important;
  backdrop-filter: blur(10px);
  border: 1px solid var(--color-border-subtle) !important;
  color: var(--color-text-main) !important;
}

.admin-main :deep(.card-hover) {
  background: var(--color-bg-elevated, var(--color-bg-card));
  border: 1px solid var(--color-border-subtle);
}

.admin-main :deep(.card-hover:hover) {
  background: var(--color-bg-elevated);
  border-color: var(--color-border-default);
}

/* 确保主题类正常工作 - 使用 CSS 变量，自动适配主题 */
.admin-main :deep(.text-text-main) {
  color: var(--color-text-main) !important;
}

.admin-main :deep(.text-text-muted) {
  color: var(--color-text-muted) !important;
}

.admin-main :deep(.text-text-disabled) {
  color: var(--color-text-disabled) !important;
}

/* 文字颜色调整 - 使用 CSS 变量 */
.admin-main :deep(.page-title),
.admin-main :deep(h1),
.admin-main :deep(h2),
.admin-main :deep(h3) {
  color: var(--color-text-main) !important;
}

.admin-main :deep(.text-gray-600),
.admin-main :deep(.text-gray-500) {
  color: var(--color-text-muted) !important;
}

.admin-main :deep(.text-gray-800) {
  color: var(--color-text-main) !important;
}

.admin-main :deep(.text-gray-900) {
  color: var(--color-text-main) !important;
}

/* 输入框和表单元素样式 - 使用 CSS 变量，自动适配主题 */
.admin-main :deep(.input),
.admin-main :deep(.form-input),
.admin-main :deep(input[type="text"]),
.admin-main :deep(input[type="password"]),
.admin-main :deep(input[type="email"]),
.admin-main :deep(input[type="number"]),
.admin-main :deep(input[type="date"]),
.admin-main :deep(input[type="datetime-local"]),
.admin-main :deep(select),
.admin-main :deep(textarea) {
  background: var(--color-bg-elevated, var(--color-bg-card)) !important;
  border-color: var(--color-border-default) !important;
  color: var(--color-text-main) !important;
}

.admin-main :deep(.input::placeholder),
.admin-main :deep(.form-input::placeholder),
.admin-main :deep(input::placeholder),
.admin-main :deep(textarea::placeholder) {
  color: var(--color-text-muted) !important;
}

/* 按钮样式 - 使用 CSS 变量，自动适配主题 */
.admin-main :deep(.btn-secondary) {
  background: var(--color-bg-elevated, var(--color-bg-card));
  border-color: var(--color-border-default);
  color: var(--color-text-main);
}

.admin-main :deep(.btn-secondary:hover) {
  background: var(--color-bg-elevated);
  border-color: var(--color-border-strong);
}

/* 表格样式 - 使用 CSS 变量，自动适配主题 */
.admin-main :deep(.table),
.admin-main :deep(table) {
  color: var(--color-text-main);
}

.admin-main :deep(.table-header),
.admin-main :deep(thead) {
  background: var(--color-bg-elevated, var(--color-bg-card));
}

.admin-main :deep(.table-header-cell),
.admin-main :deep(th) {
  color: var(--color-text-main);
  border-color: var(--color-border-subtle);
}

.admin-main :deep(.table-cell),
.admin-main :deep(td) {
  color: var(--color-text-main);
  border-color: var(--color-border-subtle);
}

.admin-main :deep(.table-row:hover),
.admin-main :deep(tr:hover) {
  background: var(--color-bg-elevated);
}

/* 链接样式 - 使用 CSS 变量 */
.admin-main :deep(.btn-link),
.admin-main :deep(a) {
  color: var(--color-text-main, rgba(255, 255, 255, 0.9));
}

.admin-main :deep(.btn-link--blue),
.admin-main :deep(.btn-link:hover) {
  color: var(--color-primary, #60a5fa);
}

.admin-main :deep(.btn-link--red) {
  color: var(--color-error, #f87171);
}

/* 标签和徽章 - 使用 CSS 变量 */
.admin-main :deep(.badge) {
  color: var(--color-text-main, #ffffff);
}

/* 模态框样式 - 使用 CSS 变量 */
.admin-main :deep(.modal-overlay) {
  background: var(--color-overlay, rgba(0, 0, 0, 0.8));
}

.admin-main :deep(.modal-content),
.admin-main :deep(.modal-content-lg) {
  background: var(--color-bg-card, rgba(30, 41, 59, 0.95));
  backdrop-filter: blur(10px);
  border: 1px solid var(--color-border-subtle, rgba(255, 255, 255, 0.1));
}

.admin-main :deep(.modal-header),
.admin-main :deep(.modal-title) {
  color: var(--color-text-main, #ffffff);
}

.admin-main :deep(.modal-body) {
  color: var(--color-text-main, rgba(255, 255, 255, 0.9));
}

/* 所有文本颜色统一 - 使用 CSS 变量 */
.admin-main :deep(.text-gray-600),
.admin-main :deep(.text-gray-500),
.admin-main :deep(.text-gray-400) {
  color: var(--color-text-muted, rgba(255, 255, 255, 0.7)) !important;
}

.admin-main :deep(.text-gray-700) {
  color: var(--color-text-sub, rgba(255, 255, 255, 0.8)) !important;
}

.admin-main :deep(.text-gray-800),
.admin-main :deep(.text-gray-900) {
  color: var(--color-text-main, #ffffff) !important;
}

/* 白色背景的卡片 - 使用 CSS 变量，自动适配主题 */
.admin-main :deep(.bg-white),
.admin-main :deep(.bg-white\/\*),
.admin-main :deep([class*="bg-white"]) {
  background: var(--color-bg-card) !important;
}

/* 深色模式下的背景 - 使用 CSS 变量 */
.admin-main :deep(.dark\:bg-gray-800),
.admin-main :deep(.dark\:bg-gray-900) {
  background: var(--color-bg-elevated) !important;
}

/* 边框颜色调整 - 使用 CSS 变量 */
.admin-main :deep(.border-gray-200),
.admin-main :deep(.border-gray-300) {
  border-color: var(--color-border-subtle) !important;
}

.admin-main :deep(.border-gray-700) {
  border-color: var(--color-border-default) !important;
}

/* 分割线 - 使用 CSS 变量 */
.admin-main :deep(.divide-gray-200),
.admin-main :deep(.divide-gray-300) {
  border-color: var(--color-border-subtle) !important;
}

.admin-main :deep(.divide-gray-700) {
  border-color: var(--color-border-default) !important;
}

/* 悬停效果 - 使用 CSS 变量 */
.admin-main :deep(.hover\:bg-gray-50:hover) {
  background: var(--color-bg-elevated) !important;
}

/* 加载和空状态 - 使用 CSS 变量，自动适配主题 */
.admin-main :deep(.loading),
.admin-main :deep(.empty-state) {
  color: var(--color-text-muted);
}

/* 统计卡片文字 - 使用 CSS 变量 */
.admin-main :deep(.stat-label),
.admin-main :deep(.stat-value) {
  color: var(--color-text-main);
}

/* 所有 h1-h6 标题 - 使用 CSS 变量 */
.admin-main :deep(h1),
.admin-main :deep(h2),
.admin-main :deep(h3),
.admin-main :deep(h4),
.admin-main :deep(h5),
.admin-main :deep(h6) {
  color: var(--color-text-main);
}

/* 段落文字 - 使用 CSS 变量 */
.admin-main :deep(p) {
  color: var(--color-text-main);
}

/* 列表文字 - 使用 CSS 变量 */
.admin-main :deep(li) {
  color: var(--color-text-main);
}

/* 标签文字 - 使用 CSS 变量 */
.admin-main :deep(label) {
  color: var(--color-text-main);
}

/* 选择框选项 */
.admin-main :deep(option) {
  background: #1e293b;
  color: #ffffff;
}

/* 表格容器 */
.admin-main :deep(.table-container) {
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
}

/* 筛选栏 - 使用 CSS 变量，自动适配主题 */
.admin-main :deep(.filter-bar) {
  background: var(--color-bg-elevated, var(--color-bg-card));
  border-color: var(--color-border-subtle);
}

/* Naive UI 组件样式 - 使用 CSS 变量，自动适配主题 */
.admin-main :deep(.n-card) {
  background: var(--color-bg-card) !important;
  backdrop-filter: blur(10px);
  border: 1px solid var(--color-border-subtle) !important;
  color: var(--color-text-main) !important;
}

.admin-main :deep(.n-card .n-card-header) {
  color: var(--color-text-main) !important;
  border-bottom-color: var(--color-border-subtle) !important;
}

.admin-main :deep(.n-card .n-card-body) {
  color: var(--color-text-main) !important;
}

/* Naive UI 数据表格 - 使用 CSS 变量 */
.admin-main :deep(.n-data-table) {
  background: transparent !important;
}

.admin-main :deep(.n-data-table .n-data-table-thead) {
  background: var(--color-bg-elevated) !important;
}

.admin-main :deep(.n-data-table .n-data-table-thead th) {
  background: var(--color-bg-elevated) !important;
  color: var(--color-text-main) !important;
  border-color: var(--color-border-subtle) !important;
}

.admin-main :deep(.n-data-table .n-data-table-tbody td) {
  background: transparent !important;
  color: var(--color-text-main) !important;
  border-color: var(--color-border-subtle) !important;
}

.admin-main :deep(.n-data-table .n-data-table-tbody tr:hover td) {
  background: var(--color-bg-elevated) !important;
}

.admin-main :deep(.n-data-table .n-data-table-tbody tr:nth-child(even) td) {
  background: var(--color-bg-elevated);
  opacity: 0.5;
}

/* Naive UI 输入框 - 使用 CSS 变量 */
.admin-main :deep(.n-input) {
  background: var(--color-bg-elevated, var(--color-bg-card)) !important;
  border-color: var(--color-border-default) !important;
  color: var(--color-text-main) !important;
}

.admin-main :deep(.n-input .n-input__input-el) {
  color: var(--color-text-main) !important;
}

.admin-main :deep(.n-input .n-input__placeholder) {
  color: var(--color-text-muted) !important;
}

/* Naive UI 按钮 - 使用 CSS 变量 */
.admin-main :deep(.n-button) {
  border-color: var(--color-border-default) !important;
}

.admin-main :deep(.n-button--default-type) {
  background: var(--color-bg-elevated, var(--color-bg-card)) !important;
  color: var(--color-text-main) !important;
}

.admin-main :deep(.n-button--default-type:hover) {
  background: var(--color-bg-elevated) !important;
}

/* Naive UI 标签 - 使用 CSS 变量 */
.admin-main :deep(.n-tag) {
  background: var(--color-bg-elevated) !important;
  border-color: var(--color-border-default) !important;
  color: var(--color-text-main) !important;
}

/* Naive UI 分页 - 使用 CSS 变量 */
.admin-main :deep(.n-pagination) {
  color: var(--color-text-main) !important;
}

.admin-main :deep(.n-pagination .n-pagination-item) {
  background: var(--color-bg-elevated) !important;
  border-color: var(--color-border-default) !important;
  color: var(--color-text-main) !important;
}

.admin-main :deep(.n-pagination .n-pagination-item:hover) {
  background: var(--color-bg-elevated) !important;
}

.admin-main :deep(.n-pagination .n-pagination-item--active) {
  background: var(--color-primary-soft) !important;
  border-color: var(--color-primary) !important;
  color: var(--color-primary) !important;
}

/* Naive UI 模态框 - 使用 CSS 变量 */
.admin-main :deep(.n-modal) {
  color: var(--color-text-main) !important;
}

.admin-main :deep(.n-modal .n-card) {
  background: var(--color-bg-card) !important;
  backdrop-filter: blur(10px);
  border: 1px solid var(--color-border-subtle) !important;
}

/* Naive UI 表单 - 使用 CSS 变量 */
.admin-main :deep(.n-form-item-label) {
  color: var(--color-text-main) !important;
}

.admin-main :deep(.n-form-item-feedback-wrapper) {
  color: var(--color-text-muted) !important;
}

/* Naive UI 表格内嵌组件样式统一 - 使用 CSS 变量 */
/* 表格内的按钮 - quaternary 类型 */
.admin-main :deep(.n-data-table .n-button--quaternary) {
  background: transparent !important;
  border: none !important;
  color: var(--color-text-main) !important;
  transition: all 0.2s ease !important;
}

.admin-main :deep(.n-data-table .n-button--quaternary:hover) {
  background: var(--color-bg-elevated) !important;
  color: var(--color-text-main) !important;
}

.admin-main :deep(.n-data-table .n-button--primary-type.n-button--quaternary) {
  color: var(--color-primary) !important;
}

.admin-main :deep(.n-data-table .n-button--primary-type.n-button--quaternary:hover) {
  background: var(--color-primary-soft) !important;
  color: var(--color-primary-hover) !important;
}

.admin-main :deep(.n-data-table .n-button--error-type.n-button--quaternary) {
  color: var(--color-error, #f87171) !important;
}

.admin-main :deep(.n-data-table .n-button--error-type.n-button--quaternary:hover) {
  background: var(--color-error);
  opacity: 0.1;
  color: var(--color-error) !important;
}

.admin-main :deep(.n-data-table .n-button--success-type.n-button--quaternary) {
  color: var(--color-success, #34d399) !important;
}

.admin-main :deep(.n-data-table .n-button--success-type.n-button--quaternary:hover) {
  background: var(--color-success);
  opacity: 0.1;
  color: var(--color-success) !important;
}

/* 表格内的标签样式 - 使用 CSS 变量 */
.admin-main :deep(.n-data-table .n-tag) {
  background: var(--color-bg-elevated) !important;
  border: 1px solid var(--color-border-default) !important;
  color: var(--color-text-main) !important;
}

.admin-main :deep(.n-data-table .n-tag--info) {
  background: var(--color-primary-soft) !important;
  border-color: var(--color-primary) !important;
  color: var(--color-primary) !important;
}

.admin-main :deep(.n-data-table .n-tag--success) {
  background: var(--color-success);
  opacity: 0.1;
  border-color: var(--color-success) !important;
  color: var(--color-success) !important;
}

.admin-main :deep(.n-data-table .n-tag--warning) {
  background: var(--color-warning, rgba(251, 191, 36, 0.2));
  border-color: var(--color-warning, rgba(251, 191, 36, 0.4)) !important;
  color: var(--color-warning, #fcd34d) !important;
}

.admin-main :deep(.n-data-table .n-tag--error) {
  background: var(--color-error);
  opacity: 0.1;
  border-color: var(--color-error) !important;
  color: var(--color-error) !important;
}

/* 表格内的头像 - 使用 CSS 变量 */
.admin-main :deep(.n-data-table .n-avatar) {
  border: 2px solid var(--color-border-subtle) !important;
}

/* 表格内的链接 - 使用 CSS 变量 */
.admin-main :deep(.n-data-table a) {
  color: var(--color-primary) !important;
  text-decoration: none !important;
  transition: color 0.2s ease !important;
}

.admin-main :deep(.n-data-table a:hover) {
  color: var(--color-primary-hover) !important;
}

/* Popconfirm - 使用 CSS 变量 */
.admin-main :deep(.n-popover) {
  background: var(--color-bg-card) !important;
  backdrop-filter: blur(10px);
  border: 1px solid var(--color-border-subtle) !important;
  color: var(--color-text-main) !important;
}

.admin-main :deep(.n-popover .n-popover__content) {
  color: var(--color-text-main) !important;
}

.admin-main :deep(.n-popover .n-button) {
  background: var(--color-bg-elevated) !important;
  border-color: var(--color-border-default) !important;
  color: var(--color-text-main) !important;
}

.admin-main :deep(.n-popover .n-button:hover) {
  background: var(--color-bg-elevated) !important;
}

.admin-main :deep(.n-popover .n-button--primary-type) {
  background: var(--color-primary-soft) !important;
  border-color: var(--color-primary) !important;
  color: var(--color-primary) !important;
}

.admin-main :deep(.n-popover .n-button--primary-type:hover) {
  background: var(--color-primary-soft) !important;
  opacity: 0.8;
}

/* 表格内的自定义元素 - 使用 CSS 变量 */
.admin-main :deep(.n-data-table .project-info),
.admin-main :deep(.n-data-table .project-details),
.admin-main :deep(.n-data-table .project-title),
.admin-main :deep(.n-data-table .project-desc),
.admin-main :deep(.n-data-table .view-count),
.admin-main :deep(.n-data-table .action-buttons) {
  color: var(--color-text-main) !important;
}

.admin-main :deep(.n-data-table .project-desc) {
  color: var(--color-text-muted) !important;
}

.admin-main :deep(.n-data-table .view-count) {
  color: var(--color-text-muted) !important;
}

/* 表格内的图标颜色 - 使用 CSS 变量 */
.admin-main :deep(.n-data-table .fas),
.admin-main :deep(.n-data-table .fa) {
  color: var(--color-text-muted) !important;
}

/* 表格内的操作按钮容器 */
.admin-main :deep(.n-data-table .action-buttons) {
  display: flex;
  gap: 0.5rem;
  align-items: center;
}

/* 确保表格内所有文字都是可见的 - 使用 CSS 变量 */
.admin-main :deep(.n-data-table td) {
  color: var(--color-text-main) !important;
}

.admin-main :deep(.n-data-table td .n-tag) {
  color: inherit !important;
}

/* 页面头部按钮统一样式 - 使用 CSS 变量 */
.admin-main :deep(.page-header .n-button),
.admin-main :deep(.header-actions .n-button) {
  border-color: var(--color-border-default) !important;
}

.admin-main :deep(.page-header .n-button--primary-type) {
  background: var(--color-primary-soft) !important;
  border-color: var(--color-primary) !important;
  color: var(--color-primary) !important;
}

.admin-main :deep(.page-header .n-button--primary-type:hover) {
  background: var(--color-primary-soft) !important;
  opacity: 0.8;
  border-color: var(--color-primary-hover) !important;
}

.admin-main :deep(.page-header .n-button--success-type) {
  background: var(--color-success);
  opacity: 0.1;
  border-color: var(--color-success) !important;
  color: var(--color-success) !important;
}

.admin-main :deep(.page-header .n-button--success-type:hover) {
  background: var(--color-success);
  opacity: 0.2;
  border-color: var(--color-success) !important;
}

.admin-main :deep(.page-header .n-button--secondary) {
  background: var(--color-bg-elevated) !important;
  border-color: var(--color-border-default) !important;
  color: var(--color-text-main) !important;
}

.admin-main :deep(.page-header .n-button--secondary:hover) {
  background: var(--color-bg-elevated) !important;
}

/* 筛选栏统一样式 - 使用 CSS 变量 */
.admin-main :deep(.filter-bar) {
  background: var(--color-bg-elevated, var(--color-bg-card)) !important;
  backdrop-filter: blur(10px);
  border: 1px solid var(--color-border-subtle) !important;
  border-radius: 0.5rem;
  padding: 1rem;
  margin-bottom: 1.5rem;
}

/* 页面标题统一样式 - 使用 CSS 变量 */
.admin-main :deep(.page-title) {
  color: var(--color-text-main) !important;
  font-weight: 600;
  margin-bottom: 1rem;
}

.admin-main :deep(.page-header) {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
}

/* 统一所有按钮的图标颜色 */
.admin-main :deep(.n-button .fas),
.admin-main :deep(.n-button .fa) {
  color: inherit !important;
}

/* 统一加载状态样式 - 使用 CSS 变量 */
.admin-main :deep(.n-spin) {
  color: var(--color-text-muted) !important;
}

/* 统一空状态样式 - 使用 CSS 变量 */
.admin-main :deep(.n-empty) {
  color: var(--color-text-muted) !important;
}

.admin-main :deep(.n-empty .n-empty__description) {
  color: var(--color-text-muted) !important;
}

/* 确保所有页面容器背景透明，由主题变量控制 */
.admin-main > * {
  background: transparent;
}

/* 覆盖可能的白色背景 */
.admin-main :deep(div[style*="background"]),
.admin-main :deep(div[style*="background-color"]) {
  /* 不强制覆盖内联样式，但确保默认背景透明 */
}

/* 设置子菜单样式 - 使用 CSS 变量 */
.admin-sidebar .ml-4 {
  margin-left: 1rem;
  border-left: 2px solid var(--color-border-subtle);
  padding-left: 0.5rem;
}

.admin-sidebar .ml-4 .admin-sidebar-link {
  font-size: 0.875rem;
  padding-left: 0.75rem;
}

/* 折叠菜单组样式 */
.menu-group {
  margin-top: 0.5rem;
}

.menu-group-header {
  width: 100%;
  display: flex;
  align-items: center;
  padding: 0.625rem 1rem;
  text-align: left;
  background: transparent;
  border: none;
  cursor: pointer;
  transition: all 0.2s ease;
  border-radius: 0.5rem;
  color: var(--color-text-main) !important;
  margin-bottom: 0.25rem;
}

.menu-group-header:hover {
  background-color: var(--color-bg-elevated) !important;
}

.menu-group-active {
  background-color: var(--color-bg-elevated) !important;
}

.menu-group-items {
  margin-top: 0.25rem;
  margin-left: 0.75rem;
  padding-left: 0.75rem;
  border-left: 2px solid var(--color-border-subtle);
  animation: slideDown 0.2s ease;
  padding-bottom: 0.25rem;
}

.menu-group-items .admin-sidebar-link {
  color: var(--color-text-main) !important;
  font-weight: 400;
}

.menu-group-items .admin-sidebar-link:hover {
  color: var(--color-text-main) !important;
}

.menu-group-items .admin-sidebar-link i {
  color: var(--color-text-muted) !important;
}

.menu-group-items .admin-sidebar-link:hover i,
.menu-group-items .admin-sidebar-link-active i {
  color: inherit !important;
}

@keyframes slideDown {
  from {
    opacity: 0;
    transform: translateY(-10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>

