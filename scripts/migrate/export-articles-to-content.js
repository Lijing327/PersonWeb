/**
 * Phase 4B-1 — Export MySQL articles → content/articles/{slug}.md
 * Read-only on DB. Default dry-run.
 *
 * Usage:
 *   node scripts/migrate/export-articles-to-content.js           # dry-run
 *   node scripts/migrate/export-articles-to-content.js --write   # write files
 *   node scripts/migrate/export-articles-to-content.js --write --force  # overwrite
 */
const fs = require('node:fs')
const path = require('node:path')
const {
  root,
  createArticlesDbPool,
  fetchCategories,
  fetchAllArticles,
  fetchArticleTags,
  groupTagsByArticleId,
  splitMainAndHistory,
} = require('./lib/articles-db')
const {
  buildArticleMarkdown,
  hashContent,
  buildTaxonomyYaml,
} = require('./lib/article-markdown')

const args = new Set(process.argv.slice(2))
const writeMode = args.has('--write')
const forceOverwrite = args.has('--force')

const articlesDir = path.join(root, 'content/articles')
const migrationDir = path.join(root, 'migration')
const manifestPath = path.join(migrationDir, 'articles-export-manifest.json')
const taxonomyPath = path.join(articlesDir, '_taxonomy.yml')

function fail(message) {
  console.error(`[export-articles] ERROR: ${message}`)
  process.exit(1)
}

async function main() {
  const pool = await createArticlesDbPool()
  try {
    const auditPath = path.join(migrationDir, 'articles-audit-report.json')
    let audit = null
    if (fs.existsSync(auditPath)) {
      audit = JSON.parse(fs.readFileSync(auditPath, 'utf8'))
      if (audit.migrationReady === false) {
        fail('Audit report indicates blocking issues (e.g. duplicate slug). Resolve before export.')
      }
    }

    const excludedIds = new Set(
      (audit?.excludedArticles || []).map((a) => Number(a.legacyId)),
    )

    const [categories, allRows, tagRows] = await Promise.all([
      fetchCategories(pool),
      fetchAllArticles(pool),
      fetchArticleTags(pool),
    ])

    const tagsByArticle = groupTagsByArticleId(tagRows)
    const { main, history } = splitMainAndHistory(allRows)

    const slugSeen = new Set()
    const legacySeen = new Set()
    const entries = []
    const plannedFiles = []

    for (const row of main) {
      const legacyId = Number(row.id)
      if (excludedIds.has(legacyId)) {
        console.log(`  skip excluded legacyId=${legacyId}`)
        continue
      }

      const slug = row.slug != null ? String(row.slug).trim() : ''

      if (!slug) fail(`Article id=${legacyId} has null slug — export blocked`)
      if (slugSeen.has(slug)) fail(`Duplicate slug "${slug}" — export blocked`)
      if (legacySeen.has(legacyId)) fail(`Duplicate legacyId ${legacyId}`)
      slugSeen.add(slug)
      legacySeen.add(legacyId)

      const tags = tagsByArticle.get(legacyId) || []
      const markdown = buildArticleMarkdown(row, tags)
      const sourceHash = hashContent(markdown)
      const targetPath = `content/articles/${slug}.md`
      const absolutePath = path.join(root, targetPath)

      if (fs.existsSync(absolutePath) && !forceOverwrite) {
        fail(`Target exists (${targetPath}). Use --force to overwrite.`)
      }

      plannedFiles.push({ absolutePath, markdown, slug, legacyId })
      entries.push({
        legacyId,
        slug,
        sourceHash,
        targetPath,
        status: markdown.match(/^status:\s*(\S+)/m)?.[1] || 'draft',
        exportedAt: new Date().toISOString(),
      })
    }

    const taxonomyYaml = buildTaxonomyYaml(categories)

    const manifest = {
      version: 1,
      exportedAt: new Date().toISOString(),
      dryRun: !writeMode,
      articleCount: entries.length,
      excludedHistoryVersionCount: history.length,
      excludedFromExport: [...excludedIds],
      entries,
    }

    console.log(`[export-articles] mode=${writeMode ? 'WRITE' : 'DRY-RUN'}`)
    console.log(`[export-articles] main articles: ${main.length}`)
    console.log(`[export-articles] excluded history rows: ${history.length}`)
    console.log(`[export-articles] files to write: ${plannedFiles.length} + _taxonomy.yml`)

    if (writeMode) {
      fs.mkdirSync(articlesDir, { recursive: true })
      fs.mkdirSync(migrationDir, { recursive: true })

      for (const file of plannedFiles) {
        fs.writeFileSync(file.absolutePath, file.markdown, 'utf8')
        console.log(`  wrote ${path.relative(root, file.absolutePath)}`)
      }

      if (fs.existsSync(taxonomyPath) && !forceOverwrite) {
        console.log('  updating _taxonomy.yml from DB categories (migration output)')
      }
      fs.writeFileSync(taxonomyPath, taxonomyYaml, 'utf8')
      console.log('  wrote content/articles/_taxonomy.yml')

      fs.writeFileSync(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`, 'utf8')
      console.log(`  wrote ${path.relative(root, manifestPath)}`)
    } else {
      console.log('[export-articles] dry-run complete — no files written')
      console.log(`[export-articles] manifest preview (${entries.length} entries)`)
    }
  } finally {
    await pool.end()
  }
}

main().catch((err) => {
  console.error('[export-articles]', err.message || err)
  process.exit(1)
})
