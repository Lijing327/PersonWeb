import { isLifeNoteSlug } from '../../../../constants/life-content'
import { readMarkdownDocument } from '../../../utils/content-files'

export default defineEventHandler((event) => {
  const { slug } = getRouterParams(event)
  if (!isLifeNoteSlug(slug)) {
    throw createError({ statusCode: 404, statusMessage: 'Life article not found' })
  }

  const item = readMarkdownDocument(['life'], slug)

  if (!item) {
    throw createError({ statusCode: 404, statusMessage: 'Life article not found' })
  }

  setHeader(event, 'Cache-Control', 'public, max-age=300, s-maxage=300')
  return item
})
