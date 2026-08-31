import db from '~/server/services/database'
import { checkAuth } from '~/server/utils/auth'
import { throwSafeApiError } from '~/server/utils/api-error'

export default defineEventHandler(async (event) => {
  try {
    checkAuth(event)

    const moduleKey = getRouterParam(event, 'moduleKey')
    const body = await readBody(event)

    if (!moduleKey) {
      throw createError({
        statusCode: 400,
        statusMessage: '缺少模块标识'
      })
    }

    // 获取当前模块信息
    const currentModule = await db.getModuleByKey(moduleKey)
    if (!currentModule) {
      throw createError({
        statusCode: 404,
        statusMessage: '模块不存在'
      })
    }

    // 检查是否为核心模块
    if (currentModule.is_core && body.version) {
      throw createError({
        statusCode: 400,
        statusMessage: '核心模块版本号不能修改'
      })
    }

    // 过滤允许更新的字段
    const allowedFields = [
      'module_name', 'module_version', 'description', 'author', 'icon',
      'category', 'dependencies', 'routes', 'components', 'permissions',
      'config_schema', 'is_enabled', 'sort'
    ]

    const updateData: any = {}

    for (const [key, value] of Object.entries(body)) {
      if (allowedFields.includes(key) && value !== undefined) {
        updateData[key] = value

        // 特殊处理依赖关系验证
        if (key === 'dependencies' && Array.isArray(value)) {
          for (const dep of value) {
            const depModule = await db.getModuleByKey(dep)
            if (!depModule) {
              throw createError({
                statusCode: 400,
                statusMessage: `依赖模块 ${dep} 不存在`
              })
            }
          }
        }
      }
    }

    // 如果没有可更新的字段
    if (Object.keys(updateData).length === 0) {
      throw createError({
        statusCode: 400,
        statusMessage: '没有提供有效的更新字段'
      })
    }

    // 更新模块
    const updated = await db.updateModule(moduleKey, updateData)

    if (!updated) {
      throw createError({
        statusCode: 404,
        statusMessage: '更新失败：模块不存在'
      })
    }

    // 获取更新后的模块
    const updatedModule = await db.getModuleByKey(moduleKey)

    return {
      success: true,
      data: updatedModule,
      message: '模块更新成功'
    }
  } catch (error) {
    throwSafeApiError(error, '更新模块失败')
  }
})