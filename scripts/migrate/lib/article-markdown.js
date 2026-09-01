const crypto = require('node:crypto')
const { stringify } = require('yaml')

const DB_TO_GIT_STATUS = {
  0: 'draft',
  1: 'published',
  2: 'archived',
}

function formatDate(value) {
  if (!value) return undefined
  const d = value instanceof Date ? value : new Date(value)
  if (Number.isNaN(d.getTime())) return undefined
  return d.toISOString().slice(0, 10)
}

function formatDateTime(value) {
  if (!value) return undefined
  const d = value instanceof Date ? value : new Date(value)
  if (Number.isNaN(d.getTime())) return undefined
  return d.toISOString()
}

function buildFrontmatter(row, tags) {
  const status = DB_TO_GIT_STATUS[Number(row.status)] ?? 'draft'
  const slug = String(row.slug || '').trim()
  const publishAt = formatDateTime(row.publish_time) || formatDateTime(row.created_at)
  const date = formatDate(row.publish_time) || formatDate(row.created_at)

  const fm = {
    title: String(row.title || '').trim(),
    slug,
    status,
    legacyId: Number(row.id),
  }

  const summary = row.summary != null ? String(row.summary).trim() : ''
  if (summary) fm.summary = summary

  if (date) fm.date = date
  if (publishAt) fm.publishAt = publishAt

  const categorySlug = row.category_slug ? String(row.category_slug).trim() : ''
  if (categorySlug) fm.category = categorySlug
  else if (row.category_name) fm.category = String(row.category_name).trim()

  if (tags.length) fm.tags = [...tags]

  const cover = row.cover_url != null ? String(row.cover_url).trim() : ''
  if (cover) fm.cover = cover

  if (row.source_type) fm.source = String(row.source_type).trim()

  return fm
}

function buildArticleMarkdown(row, tags) {
  const frontmatter = buildFrontmatter(row, tags)
  const body = row.content_md != null ? String(row.content_md) : ''
  const yamlBlock = stringify(frontmatter, { lineWidth: 0 }).trim()
  return `---\n${yamlBlock}\n---\n${body.endsWith('\n') || !body ? body : `${body}\n`}`
}

function hashContent(text) {
  return crypto.createHash('sha256').update(text, 'utf8').digest('hex')
}

function buildTaxonomyYaml(categories) {
  const items = categories.map((c) => {
    const entry = {
      slug: String(c.slug || c.name).trim(),
      label: String(c.name).trim(),
    }
    if (c.sort != null) entry.sortOrder = Number(c.sort)
    return entry
  })
  return stringify({ categories: items }, { lineWidth: 0 })
}

module.exports = {
  buildFrontmatter,
  buildArticleMarkdown,
  hashContent,
  buildTaxonomyYaml,
  DB_TO_GIT_STATUS,
}
