/**
 * content_ops DB access for Nitro (Articles / Projects ops registry).
 */
import { db } from './db'
import type { ContentOpsRow } from '../../types/articlesAggregate'

type RawOps = {
  entity_type: string
  slug: string
  legacy_id: string
  view_count: number
  featured: number | boolean
  sort_order: number | null
  takedown: number | boolean
  source_type: string | null
  content_hash: string | null
  synced_at: Date | string | null
}

function mapRow(row: RawOps): ContentOpsRow {
  return {
    entityType: row.entity_type as ContentOpsRow['entityType'],
    slug: row.slug,
    legacyId: String(row.legacy_id),
    viewCount: Number(row.view_count || 0),
    featured: Boolean(row.featured),
    sortOrder: row.sort_order == null ? null : Number(row.sort_order),
    takedown: Boolean(row.takedown),
    sourceType: row.source_type,
    contentHash: row.content_hash,
    syncedAt: row.synced_at ? String(row.synced_at) : null,
  }
}

export async function listArticleOps(): Promise<ContentOpsRow[]> {
  try {
    const result = await db.query(
      `SELECT entity_type, slug, legacy_id, view_count, featured, sort_order,
              takedown, source_type, content_hash, synced_at
       FROM content_ops
       WHERE entity_type = 'article'`,
    )
    if (!result) return []
    const [rows] = result as [RawOps[], unknown]
    return (rows || []).map(mapRow)
  } catch (error: any) {
    console.error('[content-ops] listArticleOps failed:', error?.message || error)
    return []
  }
}

export async function getArticleOpsBySlug(slug: string): Promise<ContentOpsRow | null> {
  try {
    const result = await db.query(
      `SELECT entity_type, slug, legacy_id, view_count, featured, sort_order,
              takedown, source_type, content_hash, synced_at
       FROM content_ops
       WHERE entity_type = 'article' AND slug = ?
       LIMIT 1`,
      [slug],
    )
    if (!result) return null
    const [rows] = result as [RawOps[], unknown]
    return rows?.[0] ? mapRow(rows[0]) : null
  } catch (error: any) {
    console.error('[content-ops] getArticleOpsBySlug failed:', error?.message || error)
    return null
  }
}

export async function getArticleOpsByLegacyId(legacyId: string | number): Promise<ContentOpsRow | null> {
  try {
    const result = await db.query(
      `SELECT entity_type, slug, legacy_id, view_count, featured, sort_order,
              takedown, source_type, content_hash, synced_at
       FROM content_ops
       WHERE entity_type = 'article' AND legacy_id = ?
       LIMIT 1`,
      [String(legacyId)],
    )
    if (!result) return null
    const [rows] = result as [RawOps[], unknown]
    return rows?.[0] ? mapRow(rows[0]) : null
  } catch (error: any) {
    console.error('[content-ops] getArticleOpsByLegacyId failed:', error?.message || error)
    return null
  }
}

export async function incrementArticleViewCount(slug: string): Promise<number | null> {
  try {
    const result = await db.query(
      `UPDATE content_ops
       SET view_count = view_count + 1, updated_at = NOW()
       WHERE entity_type = 'article' AND slug = ? AND takedown = 0`,
      [slug],
    )
    if (!result) return null
    const [header] = result as [{ affectedRows?: number }, unknown]
    if (!header?.affectedRows) return null

    const ops = await getArticleOpsBySlug(slug)
    return ops?.viewCount ?? null
  } catch (error: any) {
    console.error('[content-ops] incrementArticleViewCount failed:', error?.message || error)
    return null
  }
}

export function opsMapBySlug(rows: ContentOpsRow[]): Map<string, ContentOpsRow> {
  return new Map(rows.map((row) => [row.slug, row]))
}
