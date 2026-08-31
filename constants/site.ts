/** Site-wide public constants — single source for absolute URLs / SEO defaults */

export const SITE = {
  /** Canonical production origin (no trailing slash) */
  url: 'https://xifg.com.cn',
  name: '溪午听风',
  defaultTitle: '溪午听风 - 个人开发者网站',
  defaultDescription:
    '溪午听风的个人网站：Work 展示真实项目与能力，Life 记录生活与想法。',
  /** Default Open Graph image (must exist under public/) */
  defaultOgImage: '/brand/logo-full.png',
  twitterCard: 'summary_large_image' as const,
  author: '溪午听风',
} as const

export type SiteWorld = 'portal' | 'work' | 'life' | 'admin'

export const WORLD_SEO_DEFAULTS: Record<
  Exclude<SiteWorld, 'admin'>,
  { titleSuffix: string; description: string; ogImage?: string }
> = {
  portal: {
    titleSuffix: '溪午听风',
    description: '从这里进入生活，或进入工作与创造。',
    ogImage: '/brand/logo-full.png',
  },
  work: {
    titleSuffix: '溪午听风 · Work',
    description: '专业工作名片：真实项目、产品能力与合作信息。',
    ogImage: '/brand/logo-full.png',
  },
  life: {
    titleSuffix: '溪午听风 · Life',
    description: '生活名片：兴趣、随笔与当下的真实状态。',
    ogImage: '/images/life/hero-desk.webp',
  },
}
