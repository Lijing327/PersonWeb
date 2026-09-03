/**
 * 构建静态站点可用的文章 JSON（OSS 没有 Nitro /api/content/*）。
 * 产出：
 *   public/data/articles-index.json  列表（无正文）
 *   public/data/articles/{slug}.json 详情（含正文）
 */
const fs = require('node:fs')
const path = require('node:path')
const { parse: parseYaml } = require('yaml')

const root = path.resolve(__dirname, '..')
const articlesDir = path.join(root, 'content/articles')
const taxonomyPath = path.join(articlesDir, '_taxonomy.yml')
const outDir = path.join(root, 'public/data')
const outIndex = path.join(outDir, 'articles-index.json')
const outDetailDir = path.join(outDir, 'articles')

function toTags(value) {
  if (Array.isArray(value)) return value.map(String).filter(Boolean)
  if (typeof value === 'string') {
    return value.split(',').map((item) => item.trim()).filter(Boolean)
  }
  return []
}

function categoryLabels() {
  const map = {}
  if (!fs.existsSync(taxonomyPath)) return map
  const parsed = parseYaml(fs.readFileSync(taxonomyPath, 'utf8')) || {}
  const categories = Array.isArray(parsed.categories) ? parsed.categories : []
  for (const cat of categories) {
    if (cat?.slug) map[String(cat.slug)] = String(cat.label || cat.slug)
  }
  return map
}

function parseArticle(fileName) {
  const slugFromFile = fileName.replace(/\.md$/i, '')
  const raw = fs.readFileSync(path.join(articlesDir, fileName), 'utf8')
  const match = raw.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/)
  if (!match) return null
  const data = parseYaml(match[1]) || {}
  const body = String(match[2] || '').trim()
  const title = data.title ? String(data.title) : ''
  if (!title) return null
  const statusRaw = String(data.status || 'draft')
  const status = ['draft', 'published', 'archived'].includes(statusRaw) ? statusRaw : 'draft'
  const legacyId = Number(data.legacyId ?? data.legacy_id)
  if (!Number.isFinite(legacyId)) return null
  const slug = String(data.slug || slugFromFile)
  const category = data.category ? String(data.category) : null
  const publishTime = data.publishAt || data.publish_at || data.date || null
  return {
    title,
    slug,
    summary: data.summary ? String(data.summary) : null,
    body,
    category,
    tags: toTags(data.tags),
    cover: data.cover ? String(data.cover) : null,
    status,
    legacyId,
    source: data.source ? String(data.source) : null,
    seoTitle: data.seoTitle || data.seo_title || null,
    seoDescription: data.seoDescription || data.seo_description || null,
    publishTime: publishTime ? String(publishTime) : null,
  }
}

function toDto(article, labels) {
  const label = (article.category && labels[article.category]) || article.category
  const statusMap = { draft: 0, published: 1, archived: 2 }
  return {
    id: article.legacyId,
    title: article.title,
    slug: article.slug,
    summary: article.summary,
    description: article.summary,
    contentMd: article.body,
    content: article.body,
    body: article.body,
    coverUrl: article.cover,
    categoryId: null,
    categoryName: label,
    category: label ? { name: label } : null,
    status: statusMap[article.status],
    tags: article.tags,
    publishTime: article.publishTime,
    createdAt: article.publishTime,
    updatedAt: article.publishTime,
    viewCount: 0,
    authorId: null,
    sourceType: article.source,
    featured: false,
    sortOrder: null,
    takedown: false,
    effectivePublished: article.status === 'published',
    canonicalUrl: `/blog/${article.slug}`,
    seoTitle: article.seoTitle,
    seoDescription: article.seoDescription,
  }
}

function withoutBody(dto) {
  return {
    ...dto,
    contentMd: '',
    content: '',
    body: '',
  }
}

if (!fs.existsSync(articlesDir)) {
  console.warn('[articles-static] missing content/articles')
  process.exit(0)
}

const labels = categoryLabels()
const published = fs.readdirSync(articlesDir)
  .filter((name) => name.endsWith('.md'))
  .map(parseArticle)
  .filter((item) => item && item.status === 'published')
  .sort((a, b) => String(b.publishTime || '').localeCompare(String(a.publishTime || '')))
  .map((item) => toDto(item, labels))

fs.mkdirSync(outDetailDir, { recursive: true })
for (const dto of published) {
  fs.writeFileSync(
    path.join(outDetailDir, `${dto.slug}.json`),
    `${JSON.stringify(dto)}\n`,
    'utf8',
  )
}

const indexPayload = {
  generatedAt: new Date().toISOString(),
  total: published.length,
  Total: published.length,
  list: published.map(withoutBody),
  List: published.map(withoutBody),
}

fs.writeFileSync(outIndex, `${JSON.stringify(indexPayload)}\n`, 'utf8')
console.log(`[articles-static] wrote ${published.length} articles → public/data/`)
