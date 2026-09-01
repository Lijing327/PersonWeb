/**
 * Phase 4B-1 — Articles DB pre-export audit.
 * Read-only. Outputs migration/articles-audit-report.json
 *
 * Usage: node scripts/migrate/audit-articles-db.js
 */
const fs = require('node:fs')
const path = require('node:path')
const {
  root,
  createArticlesDbPool,
  fetchCategories,
  fetchAllArticles,
  fetchArticleTags,
  fetchVersionHistoryRows,
  groupTagsByArticleId,
  splitMainAndHistory,
} = require('./lib/articles-db')

const outDir = path.join(root, 'migration')
const outFile = path.join(outDir, 'articles-audit-report.json')

function classifyMainRow(row, tagsByArticle, slugCounts, categorySlugs) {
  const issues = []
  const id = Number(row.id)
  const slug = row.slug != null ? String(row.slug).trim() : ''
  let exclude = false

  if (!slug) {
    issues.push({ code: 'NULL_SLUG', message: 'slug 为空', exclude: true })
    exclude = true
  }
  if (slug && slugCounts.get(slug) > 1) {
    issues.push({ code: 'DUPLICATE_SLUG', message: `slug 重复: ${slug}`, blocking: true })
  }
  if (slug && (slug.includes(' ') || /[A-Z]/.test(slug))) {
    issues.push({ code: 'SLUG_FORMAT', message: 'slug 含空格或大写', severity: 'warn' })
  }

  const status = Number(row.status)
  if (![0, 1, 2].includes(status)) {
    issues.push({ code: 'INVALID_STATUS', message: `status 异常: ${row.status}`, blocking: true })
  }

  if (status === 1) {
    const body = row.content_md != null ? String(row.content_md).trim() : ''
    if (!body) {
      issues.push({ code: 'EMPTY_BODY_PUBLISHED', message: '已发布但正文为空', exclude: true })
      exclude = true
    }
  }

  if (row.category_id != null && !row.category_slug && !row.category_name) {
    issues.push({ code: 'ORPHAN_CATEGORY', message: `category_id=${row.category_id} 无对应分类`, severity: 'warn' })
  }

  if (row.category_slug && categorySlugs.size && !categorySlugs.has(String(row.category_slug))) {
    issues.push({ code: 'UNKNOWN_CATEGORY', message: `未知 category slug: ${row.category_slug}`, severity: 'warn' })
  }

  const cover = row.cover_url != null ? String(row.cover_url).trim() : ''
  if (cover && !/^https?:\/\//i.test(cover) && !cover.startsWith('/')) {
    issues.push({ code: 'COVER_FORMAT', message: `cover 非 URL/路径: ${cover}`, severity: 'warn' })
  }

  if (status === 1 && !row.publish_time) {
    issues.push({ code: 'MISSING_PUBLISH_TIME', message: '已发布但 publish_time 为空', severity: 'warn' })
  }

  const tags = tagsByArticle.get(id) || []
  for (const tag of tags) {
    if (!tag.trim()) issues.push({ code: 'ORPHAN_TAG', message: '空 tag 名', severity: 'warn' })
  }

  const blocking = issues.some((i) => i.blocking)
  return { id, slug, status, issues, exclude: exclude || blocking, blocking }
}

async function main() {
  const pool = await createArticlesDbPool()
  try {
    const [categories, allRows, tagRows, explicitHistory] = await Promise.all([
      fetchCategories(pool),
      fetchAllArticles(pool),
      fetchArticleTags(pool),
      fetchVersionHistoryRows(pool),
    ])

    const tagsByArticle = groupTagsByArticleId(tagRows)
    const { main, history } = splitMainAndHistory(allRows)
    const categorySlugs = new Set(categories.map((c) => String(c.slug || '').trim()).filter(Boolean))

    const slugCounts = new Map()
    for (const row of main) {
      const slug = row.slug != null ? String(row.slug).trim() : ''
      if (!slug) continue
      slugCounts.set(slug, (slugCounts.get(slug) || 0) + 1)
    }

    const audited = main.map((row) => classifyMainRow(row, tagsByArticle, slugCounts, categorySlugs))
    const blocking = audited.filter((a) => a.blocking)
    const excluded = audited.filter((a) => a.exclude && !a.blocking)
    const exportable = audited.filter((a) => !a.exclude)
    const warnings = audited.filter((a) => a.issues.some((i) => i.severity === 'warn'))

    const report = {
      version: 1,
      auditedAt: new Date().toISOString(),
      summary: {
        totalRowsInArticleTable: allRows.length,
        mainVersionCount: main.length,
        exportableCount: exportable.length,
        excludedCount: excluded.length,
        excludedHistoryVersionCount: history.length,
        explicitHistoryQueryCount: explicitHistory.length,
        categoryCount: categories.length,
        tagLinkCount: tagRows.length,
        blockingIssueCount: blocking.length,
        warningCount: warnings.reduce((n, a) => n + a.issues.filter((i) => i.severity === 'warn').length, 0),
      },
      categories: categories.map((c) => ({
        id: c.id,
        name: c.name,
        slug: c.slug,
        sort: c.sort,
      })),
      excludedHistorySample: history.slice(0, 20).map((r) => ({
        id: r.id,
        parentId: r.parent_id,
        slug: r.slug,
        version: r.version,
        status: r.status,
      })),
      excludedArticles: excluded.map((a) => ({
        legacyId: a.id,
        slug: a.slug,
        status: a.status,
        issues: a.issues,
      })),
      blockingArticles: blocking.map((a) => ({
        legacyId: a.id,
        slug: a.slug,
        status: a.status,
        issues: a.issues,
      })),
      warnings: warnings.map((a) => ({
        legacyId: a.id,
        slug: a.slug,
        issues: a.issues,
      })),
      migrationReady: blocking.length === 0,
    }

    fs.mkdirSync(outDir, { recursive: true })
    fs.writeFileSync(outFile, `${JSON.stringify(report, null, 2)}\n`, 'utf8')

    console.log(`Audit report: ${outFile}`)
    console.log(`Main versions: ${report.summary.mainVersionCount}`)
    console.log(`Exportable: ${report.summary.exportableCount}`)
    console.log(`Excluded (damaged): ${report.summary.excludedCount}`)
    console.log(`Excluded history: ${report.summary.excludedHistoryVersionCount}`)
    console.log(`Blocking articles: ${blocking.length}`)
    console.log(`Migration ready: ${report.migrationReady}`)

    if (!report.migrationReady) {
      process.exitCode = 2
    }
  } finally {
    await pool.end()
  }
}

main().catch((err) => {
  console.error('[audit-articles-db]', err.message || err)
  process.exit(1)
})
