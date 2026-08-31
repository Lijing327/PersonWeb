import { SITE } from '~/constants/site'
import {
  resolvePageSeo,
  toAbsoluteUrlWithSite,
  toAbsoluteImageUrlWithSite,
  normalizeSiteUrl,
  type PageSeoInput,
} from '~/utils/page-seo'

/**
 * Resolve site URL during setup when possible.
 * Falls back to SITE.url when called outside Nuxt context
 * (e.g. deferred unhead tag resolution).
 */
export function getSiteUrl(): string {
  try {
    const config = useRuntimeConfig()
    const fromConfig = (config.public as { siteUrl?: string }).siteUrl
    return normalizeSiteUrl(fromConfig || SITE.url)
  } catch {
    return normalizeSiteUrl(SITE.url)
  }
}

export function toAbsoluteUrl(pathOrUrl: string | undefined | null): string {
  return toAbsoluteUrlWithSite(getSiteUrl(), pathOrUrl)
}

export function toAbsoluteImageUrl(image: string | undefined | null): string {
  return toAbsoluteImageUrlWithSite(getSiteUrl(), image)
}

/**
 * Unified page SEO: title, description, canonical, Open Graph, Twitter.
 * Call once per page; avoids duplicate canonical tags.
 */
export function usePageSeo(input: PageSeoInput | (() => PageSeoInput)) {
  const route = useRoute()
  // Capture during setup — do not call useRuntimeConfig inside deferred head resolvers
  const siteUrl = getSiteUrl()

  const resolved = computed(() => {
    const value = typeof input === 'function' ? input() : input
    return resolvePageSeo(siteUrl, value, route.path)
  })

  useHead(() => ({
    title: resolved.value.title,
    meta: [
      { key: 'description', name: 'description', content: resolved.value.description },
      { key: 'robots', name: 'robots', content: resolved.value.robots },
      { key: 'og:title', property: 'og:title', content: resolved.value.title },
      { key: 'og:description', property: 'og:description', content: resolved.value.description },
      { key: 'og:type', property: 'og:type', content: resolved.value.type },
      { key: 'og:url', property: 'og:url', content: resolved.value.ogUrl },
      { key: 'og:image', property: 'og:image', content: resolved.value.image },
      { key: 'og:site_name', property: 'og:site_name', content: SITE.name },
      { key: 'twitter:card', name: 'twitter:card', content: SITE.twitterCard },
      { key: 'twitter:title', name: 'twitter:title', content: resolved.value.title },
      { key: 'twitter:description', name: 'twitter:description', content: resolved.value.description },
      { key: 'twitter:image', name: 'twitter:image', content: resolved.value.image },
    ],
    link: [
      { key: 'canonical', rel: 'canonical', href: resolved.value.canonical },
    ],
  }))

  return resolved
}

export function useJsonLd(schema: Record<string, unknown> | (() => Record<string, unknown> | null)) {
  useHead(() => {
    const value = typeof schema === 'function' ? schema() : schema
    if (!value) {
      return {}
    }
    return {
      script: [
        {
          key: 'json-ld',
          type: 'application/ld+json',
          children: JSON.stringify(value),
        },
      ],
    }
  })
}
