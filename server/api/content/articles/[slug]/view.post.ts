import { getAggregatedArticleBySlug } from '../../../../utils/articles-aggregate'
import { incrementArticleViewCount } from '../../../../utils/content-ops'
import { isArticleContentSlug } from '../../../../../constants/articles-content'

/**
 * Increment content_ops.view_count for a published article.
 * Client-only callers should POST after mount to avoid SSR double-count.
 */
export default defineEventHandler(async (event) => {
  const slug = getRouterParam(event, 'slug')
  if (!isArticleContentSlug(slug)) {
    throw createError({ statusCode: 404, statusMessage: 'Not Found' })
  }

  const article = await getAggregatedArticleBySlug(slug, { publicOnly: true })
  if (!article) {
    throw createError({ statusCode: 404, statusMessage: 'Not Found' })
  }

  const ua = getHeader(event, 'user-agent') || ''
  const isBot = /bot|crawl|spider|slurp|bingpreview|facebookexternalhit/i.test(ua)
  if (isBot) {
    return {
      code: 0,
      message: 'skipped bot',
      data: { viewCount: article.viewCount, incremented: false },
    }
  }

  const viewCount = await incrementArticleViewCount(slug)
  return {
    code: 0,
    message: 'ok',
    data: {
      viewCount: viewCount ?? article.viewCount,
      incremented: viewCount != null,
    },
  }
})
