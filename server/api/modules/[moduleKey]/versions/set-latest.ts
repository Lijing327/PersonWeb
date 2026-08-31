import db from '~/server/services/database'
import { checkAuth } from '~/server/utils/auth'
import { throwSafeApiError } from '~/server/utils/api-error'

export default defineEventHandler(async (event) => {
  try {
    checkAuth(event)

    const moduleKey = getRouterParam(event, 'moduleKey')
    const version = getRouterParam(event, 'version')

    if (!moduleKey || !version) {
      throw createError({
        statusCode: 400,
        statusMessage: '缺少模块标识或版本号',
      })
    }

    const module = await db.getModuleByKey(moduleKey)
    if (!module) {
      throw createError({
        statusCode: 404,
        statusMessage: '模块不存在',
      })
    }

    const moduleVersion = await db.getModuleVersion(moduleKey, version)
    if (!moduleVersion) {
      throw createError({
        statusCode: 404,
        statusMessage: '版本不存在',
      })
    }

    const updated = await db.setLatestVersion(moduleKey, version)
    if (!updated) {
      throw createError({
        statusCode: 500,
        statusMessage: '设置最新版本失败',
      })
    }

    await db.updateModule(moduleKey, {
      module_version: version,
    })

    return {
      success: true,
      data: {
        moduleKey,
        version,
        isLatest: true,
      },
      message: '已成功设置为最新版本',
    }
  } catch (error) {
    throwSafeApiError(error, '设置最新版本失败')
  }
})
