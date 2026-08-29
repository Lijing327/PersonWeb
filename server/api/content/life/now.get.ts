import { readLifeNow } from '../../../utils/content-files'

export default defineEventHandler((event) => {
  setHeader(event, 'Cache-Control', 'public, max-age=60, s-maxage=60')
  return readLifeNow()
})
