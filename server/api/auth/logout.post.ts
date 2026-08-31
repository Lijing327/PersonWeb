/**
 * Clear Admin auth cookies.
 */
export default defineEventHandler((event) => {
  deleteCookie(event, 'admin_token', { path: '/' })
  deleteCookie(event, 'admin_auth', { path: '/' })

  return {
    success: true,
  }
})
