/** Life 内容页保留 slug：这些 .md 不能作为随笔出现在 /life/notes。 */
export const LIFE_RESERVED_MARKDOWN_SLUGS = [
  'profile',
  'about',
  'notes',
  'home',
  'now',
  'moments',
] as const

export const isSafeContentSlug = (slug: unknown): slug is string => {
  if (typeof slug !== 'string') return false
  if (!slug || slug.length > 180) return false
  if (slug !== slug.trim()) return false
  if (slug.includes('/') || slug.includes('\\') || slug.includes('\0')) return false
  if (slug === '.' || slug === '..' || slug.includes('..')) return false
  return true
}

export const isLifeReservedMarkdownSlug = (slug: string) =>
  (LIFE_RESERVED_MARKDOWN_SLUGS as readonly string[]).includes(slug)

export const isLifeNoteSlug = (slug: unknown): slug is string =>
  isSafeContentSlug(slug) && !isLifeReservedMarkdownSlug(slug)
