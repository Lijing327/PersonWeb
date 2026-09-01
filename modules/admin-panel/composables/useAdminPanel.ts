/**
 * Admin Panel Composable
 * 后台管理功能的核心逻辑
 */

import type { MenuItem, DashboardWidget, Notification } from '~/types/admin'

// 菜单项配置
interface MenuItem {
  id: string
  title: string
  icon: string
  path: string
  children?: MenuItem[]
  permissions?: string[]
  badge?: string
  disabled?: boolean
}

// 仪表盘组件
interface DashboardWidget {
  id: string
  title: string
  type: 'chart' | 'stat' | 'list' | 'table'
  size: 'small' | 'medium' | 'large'
  config: any
  data?: any
  loading?: boolean
}

// 通知消息
interface Notification {
  id: string
  type: 'success' | 'error' | 'warning' | 'info'
  title: string
  message: string
  timestamp: Date
  read: boolean
  actions?: Array<{
    label: string
    action: () => void
  }>
}

// 管理员配置
interface AdminConfig {
  enableDarkMode: boolean
  sidebarCollapsed: boolean
  enableNotifications: boolean
  autoRefreshInterval: number
  maxItemsPerPage: number
  enableAuditLog: boolean
  defaultLanguage: string
}

// 默认菜单
const defaultMenuItems: MenuItem[] = [
  {
    id: 'dashboard',
    title: '控制台',
    icon: '📊',
    path: '/admin'
  },
  {
    id: 'content',
    title: '内容管理',
    icon: '📝',
    path: '/admin/content',
    children: [
      {
        id: 'articles',
        title: '文章管理',
        icon: '📄',
        path: '/admin/content/articles'
      },
      {
        id: 'pages',
        title: '页面管理',
        icon: '📄',
        path: '/admin/content/pages'
      },
      {
        id: 'media',
        title: '媒体库',
        icon: '🖼️',
        path: '/admin/content/media'
      }
    ]
  },
  {
    id: 'users',
    title: '用户管理',
    icon: '👥',
    path: '/admin/users',
    children: [
      {
        id: 'users-list',
        title: '用户列表',
        icon: '👤',
        path: '/admin/users/list'
      },
      {
        id: 'roles',
        title: '角色权限',
        icon: '🔑',
        path: '/admin/users/roles'
      }
    ]
  },
  {
    id: 'analytics',
    title: '数据分析',
    icon: '📈',
    path: '/admin/analytics',
    children: [
      {
        id: 'visitors',
        title: '访客统计',
        icon: '👥',
        path: '/admin/analytics/visitors'
      },
      {
        id: 'pages',
        title: '页面分析',
        icon: '📄',
        path: '/admin/analytics/pages'
      }
    ]
  },
  {
    id: 'settings',
    title: '系统设置',
    icon: '⚙️',
    path: '/admin/settings',
    permissions: ['admin.settings']
  },
  {
    id: 'modules',
    title: '模块管理',
    icon: '🧩',
    path: '/admin/settings/modules',
    permissions: ['admin.modules']
  }
]

// 默认仪表盘组件
const defaultWidgets: DashboardWidget[] = [
  {
    id: 'visitors',
    title: '今日访客',
    type: 'stat',
    size: 'medium',
    config: {
      value: 0,
      trend: 'up',
      change: '+12%'
    }
  },
  {
    id: 'pageviews',
    title: '页面浏览',
    type: 'stat',
    size: 'medium',
    config: {
      value: 0,
      trend: 'up',
      change: '+8%'
    }
  },
  {
    id: 'users',
    title: '用户统计',
    type: 'chart',
    size: 'large',
    config: {
      type: 'line',
      data: []
    }
  },
  {
    id: 'recent-articles',
    title: '最近文章',
    type: 'list',
    size: 'small',
    config: {
      limit: 5
    }
  }
]

/**
 * 后台管理Composable
 */
export const useAdminPanel = () => {
  const menuItems = ref<MenuItem[]>(defaultMenuItems)
  const widgets = ref<DashboardWidget[]>(defaultWidgets)
  const notifications = ref<Notification[]>([])
  const config = ref<AdminConfig>(getDefaultConfig())
  const currentRoute = ref<string>('/admin')

  const { isModuleEnabled } = useModuleSystem()

  // 获取默认配置
  function getDefaultConfig(): AdminConfig {
    return {
      enableDarkMode: true,
      sidebarCollapsed: false,
      enableNotifications: true,
      autoRefreshInterval: 30000,
      maxItemsPerPage: 20,
      enableAuditLog: true,
      defaultLanguage: 'zh-CN'
    }
  }

  // 初始化配置
  onMounted(async () => {
    await loadConfig()
    initializeTheme()
    startAutoRefresh()
  })

  // 加载配置
  async function loadConfig() {
    try {
      const moduleConfig = await getModuleConfig('admin-panel')
      if (moduleConfig) {
        config.value = { ...getDefaultConfig(), ...moduleConfig }
      }
    } catch (e) {
      console.error('Failed to load admin panel config:', e)
    }
  }

  // 保存配置
  async function saveConfig() {
    try {
      await setModuleConfig('admin-panel', 'config', config.value)
    } catch (e) {
      console.error('Failed to save admin panel config:', e)
      throw e
    }
  }

  // 初始化主题
  function initializeTheme() {
    if (config.value.enableDarkMode) {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
  }

  // 切换深色模式
  function toggleDarkMode() {
    config.value.enableDarkMode = !config.value.enableDarkMode
    initializeTheme()
    saveConfig()
  }

  // 切换侧边栏
  function toggleSidebar() {
    config.value.sidebarCollapsed = !config.value.sidebarCollapsed
    saveConfig()
  }

  // 添加通知
  function addNotification(notification: Omit<Notification, 'id' | 'timestamp' | 'read'>) {
    const newNotification: Notification = {
      ...notification,
      id: Date.now().toString(),
      timestamp: new Date(),
      read: false
    }

    notifications.value.unshift(newNotification)

    // 自动移除已读通知
    setTimeout(() => {
      markAsRead(newNotification.id)
    }, 5000)

    // 触发通知事件
    const bus = useModuleCore().initEventBus()
    bus.emit('admin-panel:notification', {
      type: notification.type,
      notification: newNotification
    })
  }

  // 标记为已读
  function markAsRead(id: string) {
    const notification = notifications.value.find(n => n.id === id)
    if (notification) {
      notification.read = true
    }
  }

  // 删除通知
  function removeNotification(id: string) {
    const index = notifications.value.findIndex(n => n.id === id)
    if (index !== -1) {
      notifications.value.splice(index, 1)
    }
  }

  // 清除所有通知
  function clearAllNotifications() {
    notifications.value = []
  }

  // 获取未读通知数量
  const unreadCount = computed(() => {
    return notifications.value.filter(n => !n.read).length
  })

  // 添加菜单项
  function addMenuItem(item: MenuItem) {
    menuItems.value.push(item)
  }

  // 更新菜单项
  function updateMenuItem(id: string, updates: Partial<MenuItem>) {
    const index = menuItems.value.findIndex(item => item.id === id)
    if (index !== -1) {
      menuItems.value[index] = { ...menuItems.value[index], ...updates }
    }
  }

  // 删除菜单项
  function removeMenuItem(id: string) {
    const index = menuItems.value.findIndex(item => item.id === id)
    if (index !== -1) {
      menuItems.value.splice(index, 1)
    }
  }

  // 添加仪表盘组件
  function addWidget(widget: DashboardWidget) {
    widgets.value.push(widget)
  }

  // 更新仪表盘组件
  function updateWidget(id: string, updates: Partial<DashboardWidget>) {
    const index = widgets.value.findIndex(widget => widget.id === id)
    if (index !== -1) {
      widgets.value[index] = { ...widgets.value[index], ...updates }
    }
  }

  // 删除仪表盘组件
  function removeWidget(id: string) {
    const index = widgets.value.findIndex(widget => widget.id === id)
    if (index !== -1) {
      widgets.value.splice(index, 1)
    }
  }

  // 自动刷新
  let refreshInterval: number | null = null

  function startAutoRefresh() {
    if (config.value.autoRefreshInterval > 0) {
      refreshInterval = window.setInterval(() => {
        refreshDashboard()
      }, config.value.autoRefreshInterval)
    }
  }

  function stopAutoRefresh() {
    if (refreshInterval) {
      clearInterval(refreshInterval)
      refreshInterval = null
    }
  }

  // 刷新仪表盘
  async function refreshDashboard() {
    try {
      // 刷新访客数据
      const visitorsWidget = widgets.value.find(w => w.id === 'visitors')
      if (visitorsWidget) {
        const response = await $fetch('/api/analytics/visitors/today')
        visitorsWidget.config.value = response.count
        visitorsWidget.data = response
      }

      // 刷新页面浏览数据
      const pageviewsWidget = widgets.value.find(w => w.id === 'pageviews')
      if (pageviewsWidget) {
        const response = await $fetch('/api/analytics/pageviews/today')
        pageviewsWidget.config.value = response.count
        pageviewsWidget.data = response
      }

      // 刷新用户数据
      const usersWidget = widgets.value.find(w => w.id === 'users')
      if (usersWidget) {
        const response = await $fetch('/api/analytics/users/week')
        usersWidget.config.data = response.data
        usersWidget.data = response
      }

      // 检查新通知
      checkNewNotifications()
    } catch (e) {
      console.error('Failed to refresh dashboard:', e)
    }
  }

  // 检查新通知
  async function checkNewNotifications() {
    try {
      const response = await $fetch('/api/admin/notifications/unread')
      if (response.count > 0) {
        addNotification({
          type: 'info',
          title: '系统通知',
          message: `您有 ${response.count} 条未读通知`
        })
      }
    } catch (e) {
      console.error('Failed to check notifications:', e)
    }
  }

  // 记录审计日志
  async function logAudit(action: string, target: string, details?: any) {
    if (!config.value.enableAuditLog) return

    try {
      await $fetch('/api/admin/audit-log', {
        method: 'POST',
        body: {
          action,
          target,
          details,
          timestamp: new Date().toISOString(),
          user: getCurrentUser()
        }
      })
    } catch (e) {
      console.error('Failed to log audit:', e)
    }
  }

  // 获取当前用户
  function getCurrentUser() {
    // 这里应该从认证系统获取
    return {
      id: 'admin',
      name: '管理员',
      role: 'admin'
    }
  }

  // 监听路由变化
  watch(
    () => useRoute().path,
    (newPath) => {
      currentRoute.value = newPath
    }
  )

  // 监听配置变化
  watch(config, () => {
    saveConfig()
  }, { deep: true })

  onUnmounted(() => {
    stopAutoRefresh()
  })

  return {
    // 状态
    menuItems,
    widgets,
    notifications,
    config,
    currentRoute,
    unreadCount,

    // 方法
    loadConfig,
    saveConfig,
    toggleDarkMode,
    toggleSidebar,
    addNotification,
    markAsRead,
    removeNotification,
    clearAllNotifications,
    addMenuItem,
    updateMenuItem,
    removeMenuItem,
    addWidget,
    updateWidget,
    removeWidget,
    refreshDashboard,
    logAudit,

    // 工具
    getCurrentUser
  }
}

/**
 * 后台管理工具函数
 */
export const useAdminTools = () => {
  /**
   * 权限检查
   */
  function hasPermission(permission: string): boolean {
    const user = getCurrentUser()
    if (!user) return false

    // 超级管理员拥有所有权限
    if (user.role === 'superadmin') return true

    // 检查用户权限
    return user.permissions?.includes(permission) || false
  }

  /**
   * 格式化文件大小
   */
  function formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 B'

    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))

    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  /**
   * 生成随机ID
   */
  function generateId(): string {
    return Math.random().toString(36).substr(2, 9)
  }

  /**
   * 深度复制对象
   */
  function deepClone<T>(obj: T): T {
    return JSON.parse(JSON.stringify(obj))
  }

  /**
   * 防抖函数
   */
  function debounce<T extends (...args: any[]) => any>(
    func: T,
    delay: number
  ): (...args: Parameters<T>) => void {
    let timeout: number

    return function (this: any, ...args: Parameters<T>) {
      clearTimeout(timeout)
      timeout = setTimeout(() => func.apply(this, args), delay)
    }
  }

  /**
   * 节流函数
   */
  function throttle<T extends (...args: any[]) => any>(
    func: T,
    delay: number
  ): (...args: Parameters<T>) => void {
    let lastCall = 0

    return function (this: any, ...args: Parameters<T>) {
      const now = Date.now()
      if (now - lastCall >= delay) {
        func.apply(this, args)
        lastCall = now
      }
    }
  }

  return {
    hasPermission,
    formatFileSize,
    generateId,
    deepClone,
    debounce,
    throttle
  }
}