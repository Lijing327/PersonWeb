import db from '~/server/services/database'
import { throwSafeApiError } from '~/server/utils/api-error'

const MODULE_KEY_PATTERN = /^[a-z][a-z0-9-]{0,63}$/
const MAX_TITLE_LENGTH = 120
const MAX_CONTENT_LENGTH = 2000
const RATE_WINDOW_MS = 60_000
const RATE_MAX_PER_WINDOW = 5

type RateBucket = { count: number; resetAt: number }
const rateBuckets = new Map<string, RateBucket>()

function getClientIp(event: Parameters<typeof getRequestIP>[0]): string {
  return getRequestIP(event, { xForwardedFor: true }) || 'unknown'
}

function assertRateLimit(key: string): void {
  const now = Date.now()
  const bucket = rateBuckets.get(key)
  if (!bucket || bucket.resetAt <= now) {
    rateBuckets.set(key, { count: 1, resetAt: now + RATE_WINDOW_MS })
    return
  }
  if (bucket.count >= RATE_MAX_PER_WINDOW) {
    throw createError({
      statusCode: 429,
      statusMessage: '提交过于频繁，请稍后再试',
    })
  }
  bucket.count += 1
}

/**
 * Public visitor review submission for module marketplace.
 * Evidence: pages/modules/[moduleKey]/index.vue submitReview() POSTs here.
 */
export default defineEventHandler(async (event) => {
  try {
    const moduleKey = getRouterParam(event, 'moduleKey')
    if (!moduleKey || !MODULE_KEY_PATTERN.test(moduleKey)) {
      throw createError({
        statusCode: 400,
        statusMessage: '无效的模块标识',
      })
    }

    const ip = getClientIp(event)
    assertRateLimit(`${ip}:${moduleKey}`)

    const body = await readBody(event)
    const version = typeof body?.version === 'string' ? body.version.trim() : ''
    const title = typeof body?.title === 'string' ? body.title.trim() : ''
    const content = typeof body?.content === 'string' ? body.content.trim() : ''
    const rating = Number(body?.rating)

    if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
      throw createError({
        statusCode: 400,
        statusMessage: '评分必须是 1-5 的整数',
      })
    }

    if (title.length > MAX_TITLE_LENGTH) {
      throw createError({
        statusCode: 400,
        statusMessage: '评价标题过长',
      })
    }

    if (content.length > MAX_CONTENT_LENGTH) {
      throw createError({
        statusCode: 400,
        statusMessage: '评价内容过长',
      })
    }

    if (version && !/^\d+\.\d+\.\d+([.-][\w.-]+)?$/.test(version)) {
      throw createError({
        statusCode: 400,
        statusMessage: '版本号格式无效',
      })
    }

    const module = await db.getModuleByKey(moduleKey)
    if (!module) {
      throw createError({
        statusCode: 404,
        statusMessage: '模块不存在',
      })
    }

    const resolvedVersion = version || module.module_version
    if (version) {
      const moduleVersion = await db.getModuleVersion(moduleKey, version)
      if (!moduleVersion) {
        throw createError({
          statusCode: 404,
          statusMessage: '模块版本不存在',
        })
      }
    }

    // Soft duplicate guard: same IP + module + version + rating + title within recent reviews
    const recent = await db.getModuleReviews(moduleKey, resolvedVersion, 1, 20)
    const duplicate = (recent.data || []).some((row: any) =>
      Number(row.rating) === rating
      && String(row.title || '') === title
      && String(row.content || '') === content,
    )
    if (duplicate) {
      throw createError({
        statusCode: 409,
        statusMessage: '请勿重复提交相同评价',
      })
    }

    const reviewData = {
      moduleKey,
      version: resolvedVersion,
      userId: null,
      rating,
      title,
      content,
      isVerified: false,
    }

    await db.createReview(reviewData)
    const newReview = await db.getModuleReviews(moduleKey, resolvedVersion, 1, 1)

    return {
      success: true,
      data: newReview.data?.[0] || null,
      message: '评价提交成功',
    }
  } catch (error) {
    throwSafeApiError(error, '评价提交失败')
  }
})
