import { getBlogArticleBySlug } from '../../../utils/articles-aggregate'
import { isArticleContentSlug } from '../../../../constants/articles-content'

export default defineEventHandler(async (event) => {
  const slug = getRouterParam(event, 'slug')
  if (!isArticleContentSlug(slug)) {
    throw createError({ statusCode: 404, statusMessage: 'Not Found' })
  }

  setHeader(event, 'Cache-Control', 'public, max-age=60, s-maxage=60')

  const article = await getBlogArticleBySlug(slug, { publicOnly: true })
  if (!article) {
    throw createError({ statusCode: 404, statusMessage: 'Not Found' })
  }

  return {
    code: 0,
    message: 'ok',
    data: article,
  }
})
