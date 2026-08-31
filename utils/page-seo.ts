import { SITE, WORLD_SEO_DEFAULTS, type SiteWorld } from '~/constants/site'

export interface PageSeoInput {
  title: string
  description: string
  /** Path starting with `/`, or absolute URL */
  path?: string
  image?: string | null
  type?: 'website' | 'article' | 'profile'
  world?: Exclude<SiteWorld, 'admin'>
  robots?: string
  /** Absolute canonical override (rare) */
  canonical?: string
  noIndex?: boolean
}

export interface ResolvedPageSeo {
  title: string
  description: string
  canonical: string
  image: string
  type: 'website' | 'article' | 'profile'
  robots: string
  ogUrl: string
}

export function stripTrailingSlash(url: string): string {
  if (url.length > 1 && url.endsWith('/')) {
    return url.slice(0, -1)
  }
  return url
}

export function normalizeSiteUrl(siteUrl: string): string {
  return stripTrailingSlash(String(siteUrl || SITE.url).replace(/\/$/, ''))
}

export function toAbsoluteUrlWithSite(siteUrl: string, pathOrUrl: string | undefined | null): string {
  const site = normalizeSiteUrl(siteUrl)
  if (!pathOrUrl) {
    return site
  }
  if (/^https?:\/\//i.test(pathOrUrl)) {
    return pathOrUrl
  }
  const path = pathOrUrl.startsWith('/') ? pathOrUrl : `/${pathOrUrl}`
  return `${site}${path}`
}

export function toAbsoluteImageUrlWithSite(
  siteUrl: string,
  image: string | undefined | null,
  fallbackImage: string = SITE.defaultOgImage,
): string {
  if (!image) {
    return toAbsoluteUrlWithSite(siteUrl, fallbackImage)
  }
  return toAbsoluteUrlWithSite(siteUrl, image)
}

/** Paths that must never appear as indexable sitemap / public canonical targets */
export const SEO_EXCLUDED_PATH_PREFIXES = [
  '/admin',
  '/api',
  '/dashboard',
  '/secret-login',
  '/order',
  '/payment',
] as const

export function isPublicIndexablePath(path: string): boolean {
  if (!path.startsWith('/')) return false
  if (path.includes('preview') || path.includes('draft')) return false
  return !SEO_EXCLUDED_PATH_PREFIXES.some(
    (prefix) => path === prefix || path.startsWith(`${prefix}/`),
  )
}

/**
 * Pure SEO resolver — usable in unit tests without Nuxt runtime.
 */
export function resolvePageSeo(
  siteUrl: string,
  input: PageSeoInput,
  fallbackPath = '/',
): ResolvedPageSeo {
  const world = input.world
  const worldDefaults = world ? WORLD_SEO_DEFAULTS[world] : null
  const path = input.path ?? fallbackPath
  const canonical = input.canonical
    ? toAbsoluteUrlWithSite(siteUrl, input.canonical)
    : toAbsoluteUrlWithSite(siteUrl, path)
  const image = toAbsoluteImageUrlWithSite(
    siteUrl,
    input.image || worldDefaults?.ogImage || SITE.defaultOgImage,
  )
  const robots = input.noIndex
    ? 'noindex, nofollow'
    : (input.robots || 'index,follow')
  const description = input.description
    || worldDefaults?.description
    || SITE.defaultDescription

  return {
    title: input.title,
    description,
    canonical,
    image,
    type: input.type || 'website',
    robots,
    ogUrl: canonical,
  }
}
