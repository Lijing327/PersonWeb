import type { Project } from '~/types/api'
import { resolveProjectCoverKey } from '~/constants/projects/covers'

export type LegacyProjectRedirect =
  | { kind: 'project'; id: string }
  | { kind: 'path'; path: string }
  | { kind: 'list' }

/**
 * Known legacy markdown / cover-key slugs that should land on Product views,
 * not the Projects table.
 */
export const LEGACY_SLUG_PRODUCT_PATHS: Record<string, string> = {
  mindtrace: '/products/mindtrace',
  'desktop-pet': '/products/desktop-pet',
}

/**
 * Extra aliases → cover key used by resolveProjectCoverKey.
 * Prefer matching live Projects by cover key / title; this map only helps aliases.
 */
export const LEGACY_SLUG_COVER_ALIASES: Record<string, string> = {
  'personal-site': 'personweb',
  personweb: 'personweb',
  'person-web': 'personweb',
  'digital-asset': 'personweb',
  'finance': 'finance-assistant',
  'iot': 'iot-control',
  'investment': 'investment-system',
}

function normalizeSlug(slug: string): string {
  return String(slug || '')
    .trim()
    .toLowerCase()
    .replace(/^detail-/, '')
    .replace(/\s+/g, '-')
}

/**
 * Resolve `/projects/detail-{slug}` to a canonical destination.
 * Does not invent project IDs — only matches against provided live projects.
 */
export function resolveLegacyProjectRedirect(
  slug: string,
  projects: Array<Pick<Project, 'id' | 'title' | 'techStack'> | Record<string, unknown>>,
): LegacyProjectRedirect {
  const key = normalizeSlug(slug)
  if (!key) return { kind: 'list' }

  const productPath = LEGACY_SLUG_PRODUCT_PATHS[key]
  if (productPath) {
    return { kind: 'path', path: productPath }
  }

  const coverAlias = LEGACY_SLUG_COVER_ALIASES[key] || key

  for (const project of projects) {
    const id = String((project as any).id ?? (project as any).Id ?? '')
    if (!id) continue

    const coverKey = resolveProjectCoverKey(project)
    if (coverKey === key || coverKey === coverAlias) {
      return { kind: 'project', id }
    }

    const title = String((project as any).title ?? (project as any).Title ?? '')
      .trim()
      .toLowerCase()
    const titleSlug = title.replace(/\s+/g, '-').replace(/[^\w\u4e00-\u9fff-]+/g, '')
    if (titleSlug === key || title.includes(key.replace(/-/g, ''))) {
      return { kind: 'project', id }
    }
  }

  return { kind: 'list' }
}

export function legacyRedirectToPath(result: LegacyProjectRedirect): string {
  if (result.kind === 'project') return `/projects/${result.id}`
  if (result.kind === 'path') return result.path
  return '/projects'
}
