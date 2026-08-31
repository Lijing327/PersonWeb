/**
 * Admin route guard — cookie session via /api/auth/session.
 * Vue middleware is UX only; Nitro checkAuth remains the security boundary.
 */

export default defineNuxtRouteMiddleware(async (to) => {
  if (to.path === '/admin/login') {
    return
  }

  try {
    const session = await $fetch<{ authenticated: boolean }>('/api/auth/session', {
      credentials: 'include',
    })

    if (!session?.authenticated) {
      return navigateTo('/admin/login')
    }
  } catch {
    return navigateTo('/admin/login')
  }
})
