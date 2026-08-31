import { checkAuth } from '../../utils/auth'

/**
 * LEGACY / ORPHAN — previously read/wrote content/projects/*.md.
 * Projects PRIMARY: MySQL via .NET /api/Projects.
 */
export default defineEventHandler(async (event) => {
  checkAuth(event)
  throw createError({
    statusCode: 410,
    statusMessage: 'Gone',
    message: 'Markdown admin projects API is retired. Use .NET /api/Projects instead.',
  })
})
