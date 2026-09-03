/**
 * Work default layout: which ambient / deferred UI mounts for a path.
 * Kept pure for unit tests (no Vue).
 */

export function isWorkContentFocusRoute(path: string): boolean {
  const p = path || '/'
  if (p === '/search' || p.startsWith('/search/')) return true
  if (p.startsWith('/blog/')) return true
  if (p.startsWith('/cognition/') && p !== '/cognition') return true
  if (p.startsWith('/knowledge/')) return true
  if (/^\/projects\/[^/]+$/.test(p)) return true
  if (/^\/tools\/[^/]+$/.test(p) && !p.startsWith('/tools/detail-')) return true
  return false
}

export function isWorkAmbientRoute(path: string): boolean {
  const p = path || '/'
  return p === '/work'
    || p === '/lab'
    || p === '/products'
    || p.startsWith('/ai')
}

export function shouldShowWorkParticleLayer(
  path: string,
  options: { deferred: boolean; lowPower: boolean },
): boolean {
  if (!options.deferred || options.lowPower) return false
  if (isWorkContentFocusRoute(path)) return false
  return isWorkAmbientRoute(path)
}

export function shouldShowWorkDeferredChrome(
  path: string,
  options: { deferred: boolean; lowPower: boolean },
): boolean {
  if (!options.deferred || options.lowPower) return false
  return !isWorkContentFocusRoute(path)
}

/** 弹幕只挂 Work 首页，避免盖住博客/项目等阅读页 */
export function shouldShowVisitorDanmaku(
  path: string,
  options: { deferred: boolean; lowPower: boolean },
): boolean {
  if (!options.deferred || options.lowPower) return false
  const p = path || '/'
  return p === '/work'
}
