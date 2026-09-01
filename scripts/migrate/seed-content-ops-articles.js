/**
 * Phase 4B-2 — Seed content_ops from Git articles + MySQL view_count.
 * Idempotent: INSERT ... ON DUPLICATE KEY UPDATE only syncs hash/source_type/synced_at;
 * never overwrites view_count / featured / sort_order / takedown on existing rows.
 *
 * Usage:
 *   node scripts/migrate/seed-content-ops-articles.js
 *   node scripts/migrate/seed-content-ops-articles.js --dry-run
 */
const fs = require('node:fs')
const path = require('node:path')
const crypto = require('node:crypto')
const {
  root,
  createArticlesDbPool,
} = require('./lib/articles-db')

const args = new Set(process.argv.slice(2))
const dryRun = args.has('--dry-run')

const schemaPath = path.join(root, 'database/content_ops.sql')
const manifestPath = path.join(root, 'migration/articles-export-manifest.json')
const reportPath = path.join(root, 'migration/content-ops-seed-report.json')

function hashFile(filePath) {
  return crypto.createHash('sha256').update(fs.readFileSync(filePath), 'utf8').digest('hex')
}

async function main() {
  if (!fs.existsSync(manifestPath)) {
    throw new Error('migration/articles-export-manifest.json missing — run export --write first')
  }

  const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'))
  const entries = manifest.entries || []
  const excluded = new Set((manifest.excludedFromExport || []).map(Number))

  const pool = await createArticlesDbPool()
  try {
    const schemaSql = fs.readFileSync(schemaPath, 'utf8')
    if (!dryRun) {
      await pool.query(schemaSql)
      console.log('[seed-content-ops] ensured content_ops table')
    } else {
      console.log('[seed-content-ops] dry-run — skip CREATE TABLE')
    }

    const legacyIds = entries.map((e) => Number(e.legacyId)).filter((id) => !excluded.has(id))
    if (!legacyIds.length) throw new Error('No entries to seed')

    const placeholders = legacyIds.map(() => '?').join(',')
    const [articleRows] = await pool.query(
      `SELECT id, slug, view_count, source_type, parent_id, status
       FROM article
       WHERE id IN (${placeholders}) AND parent_id IS NULL`,
      legacyIds,
    )

    const byId = new Map(articleRows.map((r) => [Number(r.id), r]))

    let beforeSum = 0
    for (const id of legacyIds) {
      const row = byId.get(id)
      if (!row) throw new Error(`Article id=${id} missing in DB (main version)`)
      beforeSum += Number(row.view_count || 0)
    }

    const [[beforeCountRow]] = await pool.query(
      `SELECT COUNT(*) AS c FROM content_ops WHERE entity_type = 'article'`,
    )
    const beforeCount = Number(beforeCountRow?.c || 0)

    const planned = []
    for (const entry of entries) {
      const legacyId = Number(entry.legacyId)
      if (excluded.has(legacyId)) continue

      const absPath = path.join(root, entry.targetPath)
      if (!fs.existsSync(absPath)) {
        throw new Error(`Missing file ${entry.targetPath}`)
      }

      const contentHash = hashFile(absPath)
      const dbRow = byId.get(legacyId)
      if (!dbRow) throw new Error(`No DB row for legacyId=${legacyId}`)

      planned.push({
        entity_type: 'article',
        slug: entry.slug,
        legacy_id: String(legacyId),
        view_count: Number(dbRow.view_count || 0),
        source_type: dbRow.source_type || null,
        content_hash: contentHash,
        featured: 0,
        sort_order: null,
        takedown: 0,
      })
    }

    if (planned.some((p) => Number(p.legacy_id) === 75)) {
      throw new Error('legacyId=75 must not be seeded')
    }

    let inserted = 0
    let skippedExisting = 0
    let hashUpdated = 0

    if (!dryRun) {
      for (const row of planned) {
        const [existing] = await pool.query(
          `SELECT slug, view_count, content_hash FROM content_ops
           WHERE entity_type = ? AND slug = ?`,
          ['article', row.slug],
        )

        if (existing.length) {
          skippedExisting += 1
          // Never overwrite view_count / featured / takedown / sort_order
          const [result] = await pool.query(
            `UPDATE content_ops
             SET content_hash = ?, source_type = COALESCE(source_type, ?), synced_at = NOW()
             WHERE entity_type = 'article' AND slug = ?`,
            [row.content_hash, row.source_type, row.slug],
          )
          if (result.affectedRows) hashUpdated += 1
          continue
        }

        await pool.query(
          `INSERT INTO content_ops
            (entity_type, slug, legacy_id, view_count, featured, sort_order, takedown,
             source_type, content_hash, synced_at)
           VALUES (?, ?, ?, ?, 0, NULL, 0, ?, ?, NOW())`,
          [
            row.entity_type,
            row.slug,
            row.legacy_id,
            row.view_count,
            row.source_type,
            row.content_hash,
          ],
        )
        inserted += 1
      }
    }

    const [[afterCountRow]] = await pool.query(
      `SELECT COUNT(*) AS c, COALESCE(SUM(view_count), 0) AS views
       FROM content_ops WHERE entity_type = 'article'`,
    ).catch(() => [[{ c: 0, views: 0 }]])
    const afterCount = Number(afterCountRow?.c || 0)
    const afterSum = Number(afterCountRow?.views || 0)

    const plannedSum = planned.reduce((n, p) => n + p.view_count, 0)
    const gitCount = entries.filter((e) => !excluded.has(Number(e.legacyId))).length

    // dry-run: compare planned vs article table only
    const effectiveAfterCount = dryRun ? planned.length : afterCount
    const effectiveAfterSum = dryRun ? plannedSum : afterSum

    const report = {
      version: 1,
      seededAt: new Date().toISOString(),
      dryRun,
      gitArticleCount: gitCount,
      plannedSeedCount: planned.length,
      beforeOpsCount: beforeCount,
      afterOpsCount: effectiveAfterCount,
      inserted,
      skippedExisting,
      hashUpdated,
      viewCountSumBeforeFromArticle: beforeSum,
      viewCountSumPlanned: plannedSum,
      viewCountSumAfterOps: effectiveAfterSum,
      excludedLegacyIds: [...excluded],
      countsMatch: effectiveAfterCount === gitCount,
      viewSumInitConsistent: dryRun
        ? plannedSum === beforeSum
        : beforeCount === 0
          ? afterSum === plannedSum && afterSum === beforeSum
          : afterCount === gitCount,
    }

    fs.mkdirSync(path.dirname(reportPath), { recursive: true })
    fs.writeFileSync(reportPath, `${JSON.stringify(report, null, 2)}\n`, 'utf8')

    console.log(JSON.stringify(report, null, 2))

    if (!dryRun && report.afterOpsCount !== report.gitArticleCount) {
      console.error('[seed-content-ops] FAIL: ops count !== git count')
      process.exitCode = 2
    }
    if (!dryRun && beforeCount === 0 && afterSum !== beforeSum) {
      console.error('[seed-content-ops] FAIL: view_count sum mismatch on initial seed')
      process.exitCode = 2
    }
  } finally {
    await pool.end()
  }
}

main().catch((err) => {
  console.error('[seed-content-ops]', err.message || err)
  process.exit(1)
})
