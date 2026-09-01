import type { ArticleGitStatus } from '../constants/articles-content'

/** Git frontmatter schema for content/articles/{slug}.md */
export interface ArticleFrontmatter {
  title: string
  slug: string
  summary?: string
  date?: string
  publishAt?: string
  status: ArticleGitStatus
  category?: string
  tags?: string[]
  cover?: string
  author?: string
  source?: string
  seoTitle?: string
  seoDescription?: string
  legacyId: number
}

export interface ArticleTaxonomyCategory {
  slug: string
  label: string
  description?: string
  sortOrder?: number
}

export interface ArticleTaxonomy {
  categories: ArticleTaxonomyCategory[]
}

export interface ArticleContentItem extends ArticleFrontmatter {
  path: string
  content: string
}

export interface ArticleExportManifestEntry {
  legacyId: number
  slug: string
  sourceHash: string
  targetPath: string
  status: ArticleGitStatus
  exportedAt: string
}

export interface ArticleExportManifest {
  version: 1
  exportedAt: string
  dryRun: boolean
  articleCount: number
  entries: ArticleExportManifestEntry[]
}
