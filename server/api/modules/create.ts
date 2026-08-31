import { CreateModuleRequest } from '~/types/module'
import db from '~/server/services/database'
import { checkAuth } from '~/server/utils/auth'
import { throwSafeApiError } from '~/server/utils/api-error'

export default defineEventHandler(async (event) => {
  try {
    checkAuth(event)

    const body = await readBody(event)
    const {
      moduleKey,
      moduleName,
      description,
      author,
      icon,
      category,
      dependencies = [],
      routes = [],
      components = [],
      permissions = {},
      configSchema = {},
      sort = 0
    } = body as CreateModuleRequest

    // 验证必填字段
    if (!moduleKey || !moduleName || !category) {
      throw createError({
        statusCode: 400,
        statusMessage: '缺少必填字段'
      })
    }

    // 验证模块标识格式
    if (!/^[a-z][a-z0-9-]*$/.test(moduleKey)) {
      throw createError({
        statusCode: 400,
        statusMessage: '模块标识只能包含小写字母、数字和连字符，且必须以字母开头'
      })
    }

    // 检查模块是否已存在
    const existingModule = await db.getModuleByKey(moduleKey)
    if (existingModule) {
      throw createError({
        statusCode: 409,
        statusMessage: '模块已存在'
      })
    }

    // 验证依赖关系
    for (const dep of dependencies) {
      const depModule = await db.getModuleByKey(dep)
      if (!depModule) {
        throw createError({
          statusCode: 400,
          statusMessage: `依赖模块 ${dep} 不存在`
        })
      }
    }

    // 创建模块
    const moduleId = await db.createModule({
      moduleKey,
      moduleName,
      description,
      author,
      icon,
      category,
      dependencies,
      routes,
      components,
      permissions,
      configSchema,
      sort
    })

    // 获取新创建的模块
    const newModule = await db.getModuleByKey(moduleKey)

    return {
      success: true,
      data: newModule,
      message: '模块创建成功'
    }
  } catch (error) {
    throwSafeApiError(error, '创建模块失败')
  }
})