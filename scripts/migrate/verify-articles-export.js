/**
 * Phase 4B-1 — Verify exported articles + manifest integrity.
 *
 * Usage: node scripts/migrate/verify-articles-export.js
 */
const fs = require('node:fs')
const path = require('node:path')
const { parse: parseYaml } = require('yaml')
const { root } = require('./lib/articles-db')
const { hashContent } = require('./lib/article-markdown')

const articlesDir = path.join(root, 'content/articles')
const manifestPath = path.join(root, 'migration/articles-export-manifest.json')
const taxonomyPath = path.join(articlesDir, '_taxonomy.yml')

const VALID_STATUS = new Set(['draft', 'published', 'archived'])

function parseArticleFile(filePath) {
  const raw = fs.readFileSync(filePath, 'utf8')
  const match = raw.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n([\s\S]*)$/)
  if (!match) {
    throw new Error('frontmatter 无法解析')
  }
  const data = parseYaml(match[1])
  const body = match[2]
  return { data, body, raw }
}

function fail(errors) {
  console.error('[verify-articles-export] FAILED')
  for (const err of errors) {
    console.error(`  - ${err}`)
  }
  process.exit(1)
}

function main() {
  const errors = []

  if (!fs.existsSync(manifestPath)) {
    fail(['migration/articles-export-manifest.json 不存在 — 请先 --write 导出'])
  }

  const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'))
  if (manifest.dryRun) {
    errors.push('manifest 标记为 dryRun=true，请先 --write 导出')
  }

  const mdFiles = fs.readdirSync(articlesDir)
    .filter((name) => name.endsWith('.md'))
    .sort()

  if (mdFiles.length !== manifest.articleCount) {
    errors.push(`文件数 ${mdFiles.length} !== manifest.articleCount ${manifest.articleCount}`)
  }

  const slugs = new Set()
  const legacyIds = new Set()
  let taxonomySlugs = new Set()

  if (fs.existsSync(taxonomyPath)) {
    const tax = parseYaml(fs.readFileSync(taxonomyPath, 'utf8'))
    const cats = Array.isArray(tax?.categories) ? tax.categories : []
    taxonomySlugs = new Set(cats.map((c) => String(c.slug || '').trim()).filter(Boolean))
  }

  for (const fileName of mdFiles) {
    const slugFromFile = fileName.replace(/\.md$/i, '')
    const filePath = path.join(articlesDir, fileName)

    try {
      const { data, body, raw } = parseArticleFile(filePath)
      const slug = String(data.slug || '').trim()
      const legacyId = Number(data.legacyId)
      const status = String(data.status || '').trim()

      if (slug !== slugFromFile) {
        errors.push(`${fileName}: filename !== frontmatter.slug (${slug})`)
      }
      if (slugs.has(slug)) errors.push(`duplicate slug: ${slug}`)
      slugs.add(slug)

      if (!Number.isFinite(legacyId)) errors.push(`${fileName}: legacyId 无效`)
      if (legacyIds.has(legacyId)) errors.push(`${fileName}: duplicate legacyId ${legacyId}`)
      legacyIds.add(legacyId)

      if (!VALID_STATUS.has(status)) errors.push(`${fileName}: invalid status "${status}"`)
      if (status === 'published' && !body.trim()) {
        errors.push(`${fileName}: published 但正文为空`)
      }

      if (data.category && taxonomySlugs.size && !taxonomySlugs.has(String(data.category))) {
        errors.push(`${fileName}: category "${data.category}" 不在 _taxonomy.yml`)
      }

      const manifestEntry = manifest.entries.find((e) => e.slug === slug)
      if (!manifestEntry) {
        errors.push(`${fileName}: manifest 中无对应 entry`)
      } else {
        const hash = hashContent(raw)
        if (manifestEntry.sourceHash !== hash) {
          errors.push(`${fileName}: sourceHash 与 manifest 不一致`)
        }
      }
    } catch (e) {
      errors.push(`${fileName}: ${e.message || e}`)
    }
  }

  for (const entry of manifest.entries) {
    if (!slugs.has(entry.slug)) {
      errors.push(`manifest entry slug=${entry.slug} 无对应文件`)
    }
  }

  if (errors.length) fail(errors)

  console.log('[verify-articles-export] OK')
  console.log(`  articles: ${mdFiles.length}`)
  console.log(`  taxonomy categories: ${taxonomySlugs.size}`)
}

main()
