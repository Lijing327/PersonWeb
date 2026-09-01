import { H3Event, defineEventHandler } from 'h3'
import { checkUserModuleLicense } from '~/server/services/license'
import { useNitroDatabase } from '#nitro/database'

export default defineEventHandler(async (event) => {
  // 获取请求路径
  const path = event.path

  // 检查是否是需要许可证保护的路径
  if (isProtectedPath(path)) {
    try {
      // 从请求中获取用户信息（简化处理）
      const userId = 1 // 在实际应用中应该从认证中获取

      // 获取模块标识（从路径中提取）
      const moduleKey = extractModuleKeyFromPath(path)

      if (!moduleKey) {
        throw createError({
          statusCode: 400,
          statusMessage: 'Invalid module path'
        })
      }

      // 检查用户是否有该模块的许可证
      const hasLicense = await checkUserModuleLicense(userId, moduleKey)

      if (!hasLicense) {
        throw createError({
          statusCode: 403,
          statusMessage: 'No valid license for this module'
        })
      }
    } catch (error) {
      console.error('License check failed:', error)
      throw error
    }
  }
})

// 检查路径是否需要许可证保护
function isProtectedPath(path: string): boolean {
  // 定义需要保护的路径模式
  const protectedPatterns = [
    '^/api/modules/[^/]+/protected', // 受保护的模块 API
  ]

  return protectedPatterns.some(pattern => {
    const regex = new RegExp(pattern)
    return regex.test(path)
  })
}

// 从路径中提取模块标识
function extractModuleKeyFromPath(path: string): string | null {
  const match = path.match(/^\/api\/modules\/([^\/]+)/)
  return match ? match[1] : null
}