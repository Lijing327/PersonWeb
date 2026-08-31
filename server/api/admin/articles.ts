import { checkAuth } from '../../utils/auth'

/**
 * LEGACY / ORPHAN — previously read/wrote content/blog/*.md.
 * Blog PRIMARY: MySQL via .NET /api/Articles.
 * Kept as a guarded stub so accidental callers fail loudly (410 Gone).
 */
export default defineEventHandler(async (event) => {
  checkAuth(event)
  throw createError({
    statusCode: 410,
    statusMessage: 'Gone',
    message: 'Markdown admin articles API is retired. Use .NET /api/Articles instead.',
  })
})
