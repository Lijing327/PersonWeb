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

/**
 * Work layout 不再挂全屏弹幕；入口页 `/` 自行挂载局部弹幕。
 * 保留函数供守卫测试与历史调用，恒为 false。
 */
export function shouldShowVisitorDanmaku(
  _path: string,
  _options: { deferred: boolean; lowPower: boolean },
): boolean {
  return false
}
