/**
 * Work 世界顶栏导航 active 判断（Header / Work 首页自建顶栏共用）。
 *
 * 规则：
 * - `/work`（首页）必须精确匹配，禁止 startsWith('/work')
 * - 其他一级栏目允许详情页保持父级 active（prefix）
 * - `/life/about` 不得激活 Work `/about`
 */

export function isWorkNavActive(currentPath: string, itemPath: string): boolean {
  const current = normalizePath(currentPath)
  const target = normalizePath(itemPath)

  if (!current || !target) return false

  // Work 首页：仅 exact
  if (target === '/work') {
    return current === '/work'
  }

  // Portal 根路径：仅 exact（避免 startsWith('/') 命中一切）
  if (target === '/') {
    return current === '/'
  }

  return current === target || current.startsWith(`${target}/`)
}

function normalizePath(path: string): string {
  if (!path) return ''
  const trimmed = path.split('?')[0].split('#')[0]
  if (trimmed.length > 1 && trimmed.endsWith('/')) {
    return trimmed.slice(0, -1)
  }
  return trimmed || '/'
}

/** 给定当前路由，返回 Primary 中唯一应 active 的 path（用于断言） */
export function resolveActiveWorkNavPath(
  currentPath: string,
  items: ReadonlyArray<{ path: string }>,
): string | null {
  const actives = items.filter((item) => isWorkNavActive(currentPath, item.path))
  if (actives.length === 0) return null
  // 最长前缀优先，避免极端情况下多个命中
  actives.sort((a, b) => b.path.length - a.path.length)
  return actives[0]?.path ?? null
}
