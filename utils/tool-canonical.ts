/**
 * Tool URL canonical helpers (Work marketplace PRIMARY = Toolbox DB).
 */

export function canonicalizeToolPath(pathOrSlug: string): string {
  const raw = String(pathOrSlug || '').trim()
  if (!raw) return '/tools'

  if (raw.startsWith('/tools/detail-')) {
    const slug = raw.slice('/tools/detail-'.length)
    return slug ? `/tools/${slug}` : '/tools'
  }

  const detailMatch = raw.match(/^detail-(.+)$/i)
  if (detailMatch?.[1]) {
    return `/tools/${detailMatch[1]}`
  }

  if (raw.startsWith('/tools/')) {
    return raw.replace(/\/+$/, '') || '/tools'
  }

  if (raw.startsWith('/')) return raw
  return `/tools/${raw}`
}

export function extractToolSlug(pathOrSlug: string): string | null {
  const canonical = canonicalizeToolPath(pathOrSlug)
  if (canonical === '/tools') return null
  const match = canonical.match(/^\/tools\/([^/]+)$/)
  return match?.[1] || null
}
