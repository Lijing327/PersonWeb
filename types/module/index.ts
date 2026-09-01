/**
 * 模块系统核心类型定义
 */

import type { RouteLocationRaw } from 'vue-router'

// 模块元数据
export interface ModuleMetadata {
  /** 模块唯一标识 */
  key: string
  /** 模块名称 */
  name: string
  /** 版本号 */
  version: string
  /** 描述信息 */
  description: string
  /** 作者 */
  author: string
  /** 许可证类型 */
  license?: 'MIT' | 'Apache-2.0' | 'GPL-3.0' | 'Commercial'
  /** 价格（商业模块） */
  price?: number
  /** 货币单位 */
  currency?: 'CNY' | 'USD'
  /** 所属分类 */
  category: ModuleCategory
  /** 标签 */
  tags: string[]
  /** 图标 */
  icon?: string
  /** 截图 */
  screenshots?: string[]
  /** 预览链接 */
  demoUrl?: string
  /** 文档链接 */
  documentation?: string
  /** 依赖的模块 */
  dependencies?: string[]
  /** 核心模块标记 */
  isCore?: boolean
  /** 兼容性要求 */
  compatibility?: {
    nuxtVersion?: string
    nodeVersion?: string
    browser?: string[]
  }
}

// 模块分类
export enum ModuleCategory {
  AI = 'ai',
  VISITOR = 'visitor',
  /** 3D 展示类模块（枚举名不可数字开头） */
  THREE_D = '3d',
  ADMIN = 'admin',
  PERFORMANCE = 'performance',
  I18N = 'i18n',
  TOOLS = 'tools',
  UI = 'ui',
  LAYOUT = 'layout',
  CONTENT = 'content',
  SECURITY = 'security',
  ANALYTICS = 'analytics'
}

// 模块配置项
export interface ModuleConfig {
  /** 配置项ID */
  configKey: string
  /** 配置值 */
  configValue: any
  /** 配置项类型 */
  configType?: 'string' | 'number' | 'boolean' | 'json' | 'array'
  /** 描述 */
  description?: string
  /** 是否必需 */
  required?: boolean
  /** 默认值 */
  defaultValue?: any
  /** 验证规则 */
  validation?: {
    min?: number
    max?: number
    pattern?: string
    custom?: (value: any) => boolean | string
  }
}

// 模块权限
export interface ModulePermission {
  /** 权限标识 */
  key: string
  /** 权限名称 */
  name: string
  /** 权限描述 */
  description: string
  /** 权限级别 */
  level: 'basic' | 'advanced' | 'admin'
}

// 模块路由配置
export interface ModuleRoute {
  /** 路由路径 */
  path: string
  /** 路由名称 */
  name?: string
  /** 路由组件 */
  component?: string
  /** 路由元信息 */
  meta?: {
    title?: string
    description?: string
    icon?: string
    hidden?: boolean
    order?: number
  }
  /** 子路由 */
  children?: ModuleRoute[]
}

// 模块组件注册
export interface ModuleComponent {
  /** 组件名称 */
  name: string
  /** 组件路径 */
  path: string
  /** 组件类型 */
  type?: 'component' | 'layout' | 'page'
  /** 是否全局注册 */
  global?: boolean
  /** 组件选项 */
  options?: {
    template?: string
    styles?: string
    script?: string
  }
}

// 模块迁移脚本
export interface ModuleMigration {
  /** 版本号 */
  version: string
  /** 迁移类型 */
  type: 'up' | 'down'
  /** 迁移函数 */
  handler: (context: MigrationContext) => Promise<void>
}

// 迁移上下文
export interface MigrationContext {
  /** 数据库连接 */
  db: any
  /** 模块配置 */
  config: Record<string, any>
  /** 当前版本 */
  currentVersion: string
  /** Logger */
  logger: {
    info: (message: string) => void
    warn: (message: string) => void
    error: (message: string) => void
  }
}

// 模块生命周期钩子
export interface ModuleLifecycle {
  /** 安装钩子 */
  onInstall?: () => Promise<void>
  /** 卸载钩子 */
  onUninstall?: () => Promise<void>
  /** 激活钩子 */
  onActivate?: () => Promise<void>
  /** 停用钩子 */
  onDeactivate?: () => Promise<void>
}

// 模块定义
export interface ModuleDefinition {
  /** 模块元数据 */
  meta: ModuleMetadata
  /** 路由配置 */
  routes?: ModuleRoute[]
  /** 组件注册 */
  components?: ModuleComponent[]
  /** 权限配置 */
  permissions?: ModulePermission[]
  /** 配置项 */
  configs?: ModuleConfig[]
  /** 迁移脚本 */
  migrations?: ModuleMigration[]
  /** 生命周期钩子 */
  lifecycle?: ModuleLifecycle
  /** 模块入口文件 */
  entry?: string
}

// 模块清单（用于打包发布）
export interface ModuleManifest {
  /** 模块定义 */
  module: ModuleDefinition
  /** 构建信息 */
  build: {
    timestamp: string
    hash: string
    size: number
  }
  /** 依赖信息 */
  dependencies: Record<string, string>
}

// 模块安装选项
export interface ModuleInstallOptions {
  /** 模块配置 */
  config?: Record<string, any>
  /** 是否激活 */
  activate?: boolean
  /** 是否覆盖现有配置 */
  overwrite?: boolean
  /** 安装路径 */
  path?: string
}

// 模块状态
export enum ModuleStatus {
  NOT_INSTALLED = 'not_installed',
  INSTALLED = 'installed',
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  ERROR = 'error'
}

// 模块实例信息
export interface ModuleInstance {
  /** 模块定义 */
  definition: ModuleDefinition
  /** 安装路径 */
  path: string
  /** 状态 */
  status: ModuleStatus
  /** 激活时间 */
  activatedAt?: Date
  /** 配置 */
  config: Record<string, any>
  /** 错误信息 */
  error?: string
}

// 模块注册表
export interface ModuleRegistry {
  /** 已安装模块 */
  modules: Map<string, ModuleInstance>
  /** 模块仓库 */
  repository: {
    url: string
    token?: string
  }
}

// 模块事件
export interface ModuleEvent {
  /** 事件类型 */
  type: string
  /** 模块键 */
  moduleKey: string
  /** 时间戳 */
  timestamp: number
  /** 数据 */
  data?: any
}

// 模块过滤器
export interface ModuleFilter {
  /** 分类 */
  category?: ModuleCategory
  /** 作者 */
  author?: string
  /** 关键词 */
  keyword?: string
  /** 是否免费 */
  free?: boolean
  /** 是否已安装 */
  installed?: boolean
  /** 是否已激活 */
  active?: boolean
}