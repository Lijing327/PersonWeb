import { Module } from '~/types/module'
import { checkAuth } from '~/server/utils/auth'
import { throwSafeApiError } from '~/server/utils/api-error'

const mockModules: Module[] = [
  {
    id: 1,
    moduleKey: 'ai-assistant',
    moduleName: 'AI Assistant',
    moduleVersion: '1.0.0',
    description: '智能AI助手系统，提供对话、问答、内容生成等功能',
    author: 'PersonWeb Team',
    icon: '🤖',
    category: 'ai',
    dependencies: [],
    routes: [],
    components: [],
    permissions: [],
    isEnabled: true,
    isCore: false,
    sort: 100,
    createdAt: new Date('2024-01-01').toISOString(),
    updatedAt: new Date('2024-01-01').toISOString(),
  },
  {
    id: 2,
    moduleKey: 'blog',
    moduleName: '技术博客',
    moduleVersion: '1.0.0',
    description: '技术文章和博客功能',
    author: 'PersonWeb Team',
    icon: '📝',
    category: 'content',
    dependencies: [],
    routes: [],
    components: [],
    permissions: [],
    isEnabled: true,
    isCore: false,
    sort: 1,
    createdAt: new Date('2024-01-01').toISOString(),
    updatedAt: new Date('2024-01-01').toISOString(),
  },
  {
    id: 3,
    moduleKey: 'analytics',
    moduleName: '数据分析',
    moduleVersion: '1.0.0',
    description: '网站访问数据统计和分析',
    author: 'PersonWeb Team',
    icon: '📊',
    category: 'tool',
    dependencies: [],
    routes: [],
    components: [],
    permissions: [],
    isEnabled: false,
    isCore: false,
    sort: 50,
    createdAt: new Date('2024-01-01').toISOString(),
    updatedAt: new Date('2024-01-01').toISOString(),
  },
]

export default defineEventHandler(async (event) => {
  try {
    checkAuth(event)

    const moduleKey = getRouterParam(event, 'moduleKey')
    const body = await readBody(event)

    if (!moduleKey) {
      throw createError({
        statusCode: 400,
        statusMessage: '缺少模块标识',
      })
    }

    if (typeof body.enabled !== 'boolean') {
      throw createError({
        statusCode: 400,
        statusMessage: 'enabled 参数必须是布尔值',
      })
    }

    const module = mockModules.find(m => m.moduleKey === moduleKey)
    if (!module) {
      throw createError({
        statusCode: 404,
        statusMessage: '模块不存在',
      })
    }

    if (module.isCore) {
      throw createError({
        statusCode: 400,
        statusMessage: '核心模块不能禁用',
      })
    }

    const dependentModules = mockModules.filter(m =>
      m.dependencies && m.dependencies.includes(moduleKey),
    )

    if (body.enabled && dependentModules.length > 0) {
      throw createError({
        statusCode: 400,
        statusMessage: `该模块有 ${dependentModules.length} 个依赖模块，需要先禁用这些模块`,
        data: dependentModules.map(m => ({
          key: m.moduleKey,
          name: m.moduleName,
        })),
      })
    }

    module.isEnabled = body.enabled
    module.updatedAt = new Date().toISOString()

    return {
      success: true,
      data: {
        moduleKey: module.moduleKey,
        isEnabled: module.isEnabled,
        updatedAt: module.updatedAt,
      },
      message: body.enabled ? '模块已启用' : '模块已禁用',
    }
  } catch (error) {
    throwSafeApiError(error, '更新模块状态失败')
  }
})
