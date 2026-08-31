import { checkAuth } from '../../utils/auth'

/**
 * LEGACY / ORPHAN — previously read/wrote content/tools/*.md.
 * Tools PRIMARY: MySQL via .NET /api/Toolbox.
 */
export default defineEventHandler(async (event) => {
  checkAuth(event)
  throw createError({
    statusCode: 410,
    statusMessage: 'Gone',
    message: 'Markdown admin tools API is retired. Use .NET /api/Toolbox instead.',
  })
})
