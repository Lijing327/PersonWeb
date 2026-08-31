export type ErrorWorld = 'portal' | 'work' | 'life' | 'admin'

/**
 * Map a request path to the visual "world" used by error.vue.
 */
export function resolveErrorWorld(path: string): ErrorWorld {
  const normalized = path.split('?')[0] || '/'
  if (normalized === '/admin' || normalized.startsWith('/admin/')) return 'admin'
  if (normalized === '/life' || normalized.startsWith('/life/')) return 'life'
  if (normalized === '/') return 'portal'
  return 'work'
}
