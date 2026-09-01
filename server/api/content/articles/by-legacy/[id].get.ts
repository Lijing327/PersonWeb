import { resolveArticleSlugByLegacyId } from '../../../../utils/articles-aggregate'

/**
 * Resolve legacy numeric article id → canonical slug.
 * Used by /blog/{id} for 301 to /blog/{slug}.
 */
export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')
  if (!id || !/^\d+$/.test(id)) {
    throw createError({ statusCode: 400, statusMessage: 'Invalid legacy id' })
  }

  const slug = await resolveArticleSlugByLegacyId(id)
  if (!slug) {
    throw createError({ statusCode: 404, statusMessage: 'Not Found' })
  }

  return {
    code: 0,
    message: 'ok',
    data: {
      legacyId: Number(id),
      slug,
      canonicalUrl: `/blog/${slug}`,
    },
  }
})
