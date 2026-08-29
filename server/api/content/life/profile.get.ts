import { readLifeProfile } from '../../../utils/content-files'

export default defineEventHandler((event) => {
  const profile = readLifeProfile()

  if (!profile) {
    throw createError({ statusCode: 404, statusMessage: 'Life profile not found' })
  }

  setHeader(event, 'Cache-Control', 'public, max-age=60, s-maxage=60')
  return profile
})
