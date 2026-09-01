import { readWorkAbout } from '../../../utils/content-files'

export default defineEventHandler((event) => {
  setHeader(event, 'Cache-Control', 'public, max-age=60, s-maxage=60')
  const about = readWorkAbout()
  if (!about) {
    throw createError({ statusCode: 404, statusMessage: 'Work about content missing' })
  }
  return about
})
