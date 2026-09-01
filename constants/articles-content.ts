/** Articles Git SoT — reserved paths under content/articles/ */
export const ARTICLES_TAXONOMY_FILE = '_taxonomy.yml'

export const ARTICLE_RESERVED_SLUGS = new Set([
  ARTICLES_TAXONOMY_FILE.replace(/\.yml$/i, ''),
])

export const ARTICLE_GIT_STATUSES = ['draft', 'published', 'archived'] as const
export type ArticleGitStatus = (typeof ARTICLE_GIT_STATUSES)[number]

/** DB status (sbyte) → Git frontmatter status */
export const mapDbStatusToGit = (status: number): ArticleGitStatus => {
  if (status === 1) return 'published'
  if (status === 2) return 'archived'
  return 'draft'
}

export const mapGitStatusToDb = (status: string): number => {
  if (status === 'published') return 1
  if (status === 'archived') return 2
  return 0
}

export const isArticleContentSlug = (slug: unknown): slug is string => {
  if (typeof slug !== 'string') return false
  if (!slug || slug.length > 180) return false
  if (slug !== slug.trim()) return false
  if (slug.includes('/') || slug.includes('\\') || slug.includes('\0')) return false
  if (slug === '.' || slug === '..' || slug.includes('..')) return false
  if (ARTICLE_RESERVED_SLUGS.has(slug)) return false
  if (slug.startsWith('_')) return false
  return true
}
