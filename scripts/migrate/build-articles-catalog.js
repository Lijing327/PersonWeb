/**
 * Build content/articles/_catalog.json for .NET AI prompt (titles only, no body).
 * Usage: node scripts/migrate/build-articles-catalog.js
 */
const fs = require('node:fs')
const path = require('node:path')
const { parse: parseYaml } = require('yaml')

const root = path.resolve(__dirname, '../..')
const dir = path.join(root, 'content/articles')
const out = path.join(dir, '_catalog.json')

const items = []
for (const name of fs.readdirSync(dir)) {
  if (!name.endsWith('.md')) continue
  const slug = name.replace(/\.md$/i, '')
  const raw = fs.readFileSync(path.join(dir, name), 'utf8')
  const match = raw.match(/^---\r?\n([\s\S]*?)\r?\n---/)
  if (!match) continue
  const data = parseYaml(match[1]) || {}
  if (String(data.status || '') !== 'published') continue
  items.push({
    slug: String(data.slug || slug),
    title: String(data.title || slug),
    category: data.category ? String(data.category) : null,
    publishAt: data.publishAt || data.date || null,
    legacyId: data.legacyId != null ? Number(data.legacyId) : null,
  })
}

items.sort((a, b) => String(b.publishAt || '').localeCompare(String(a.publishAt || '')))

const catalog = {
  version: 1,
  generatedAt: new Date().toISOString(),
  count: items.length,
  articles: items.slice(0, 50),
}

fs.writeFileSync(out, `${JSON.stringify(catalog, null, 2)}\n`, 'utf8')
console.log(`[articles-catalog] wrote ${out} (${catalog.count} published)`)
