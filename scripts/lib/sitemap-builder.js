/**
 * Sitemap URL collection + XML rendering (pure logic for tests).
 */
const path = require('node:path')
const fs = require('node:fs')

const LIFE_RESERVED = new Set(['profile', 'about', 'notes', 'home', 'now', 'moments'])

const EXCLUDED_PREFIXES = [
  '/admin',
  '/api',
  '/dashboard',
  '/secret-login',
  '/order',
  '/payment',
]

/** Public static routes that are intentionally indexable */
const STATIC_PATHS = [
  '/',
  '/life',
  '/life/about',
  '/life/notes',
  '/work',
  '/about',
  '/blog',
  '/projects',
  '/tools',
  '/contact',
  '/products',
  '/lab',
  '/cognition',
  '/search',
  '/links',
  '/changelog',
  '/pricing',
  '/download',
  '/side-projects',
  '/skills',
  '/english',
  '/knowledge',
  '/products/desktop-pet',
  '/products/mindtrace',
  '/ai',
  '/game',
]

function stripTrailingSlash(url) {
  if (!url) return ''
  return url.length > 1 && url.endsWith('/') ? url.slice(0, -1) : url
}

function isPublicIndexablePath(p) {
  if (!p || !p.startsWith('/')) return false
  if (p.includes('preview') || p.includes('draft') || p.includes('login')) return false
  return !EXCLUDED_PREFIXES.some(
    (prefix) => p === prefix || p.startsWith(`${prefix}/`),
  )
}

function canonicalizePath(p) {
  if (!p) return '/'
  let out = p.startsWith('/') ? p : `/${p}`
  out = out.replace(/\/+/g, '/')
  if (out.length > 1 && out.endsWith('/')) out = out.slice(0, -1)
  // Legacy detail routes → canonical
  const projectLegacy = out.match(/^\/projects\/detail-(.+)$/)
  if (projectLegacy) return '/projects'
  const toolLegacy = out.match(/^\/tools\/detail-(.+)$/)
  if (toolLegacy) return `/tools/${toolLegacy[1]}`
  return out
}

function uniqPaths(paths) {
  const seen = new Set()
  const result = []
  for (const raw of paths) {
    const p = canonicalizePath(raw)
    if (!isPublicIndexablePath(p)) continue
    if (seen.has(p)) continue
    seen.add(p)
    result.push(p)
  }
  return result
}

function collectLifeNotePaths(contentLifeDir) {
  if (!fs.existsSync(contentLifeDir)) return []
  return fs
    .readdirSync(contentLifeDir)
    .filter((name) => name.endsWith('.md'))
    .map((name) => name.replace(/\.md$/i, ''))
    .filter((slug) => slug && !LIFE_RESERVED.has(slug) && !slug.includes('..'))
    .map((slug) => `/life/${slug}`)
}

function unwrapApiPayload(json) {
  if (!json || typeof json !== 'object') return json
  if ('code' in json && 'data' in json) return json.data
  return json
}

async function fetchJson(url, timeoutMs = 8000) {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), timeoutMs)
  try {
    const res = await fetch(url, { signal: controller.signal })
    if (!res.ok) {
      const err = new Error(`HTTP ${res.status} for ${url}`)
      err.status = res.status
      throw err
    }
    return unwrapApiPayload(await res.json())
  } finally {
    clearTimeout(timer)
  }
}

async function collectDynamicFromApi(apiBase) {
  const base = stripTrailingSlash(apiBase)
  const paths = []
  const sources = {
    articles: false,
    projects: false,
    tools: false,
    cognition: false,
  }
  const errors = []

  // Articles — Git SoT (Phase 4B-3). Only /blog/{slug} for published.
  try {
    const articlesDir = path.join(__dirname, '../../content/articles')
    const takedownSlugs = new Set()
    // Best-effort: load takedown from content_ops when DB env is present
    try {
      const mysql = require('mysql2/promise')
      const host = process.env.DB_HOST
      const user = process.env.DB_USER
      const database = process.env.DB_NAME
      if (host && user && database) {
        const pool = await mysql.createPool({
          host,
          user,
          password: process.env.DB_PASSWORD || '',
          database,
          connectionLimit: 1,
        })
        try {
          const [rows] = await pool.query(
            `SELECT slug FROM content_ops WHERE entity_type = 'article' AND takedown = 1`,
          )
          for (const row of rows) takedownSlugs.add(String(row.slug))
        } finally {
          await pool.end()
        }
      }
    } catch (e) {
      errors.push(`articles-takedown: ${e.message || e}`)
    }

    const articlePaths = collectArticlePathsFromGit(articlesDir, takedownSlugs)
    paths.push(...articlePaths)
    sources.articles = true
  } catch (e) {
    errors.push(`articles: ${e.message || e}`)
  }

  try {
    const data = await fetchJson(`${base}/Projects`)
    const list = Array.isArray(data) ? data : (data?.List || data?.list || [])
    for (const project of list) {
      const id = project.Id || project.id
      if (id) paths.push(`/projects/${id}`)
    }
    sources.projects = true
  } catch (e) {
    errors.push(`projects: ${e.message || e}`)
  }

  try {
    let page = 1
    const pageSize = 100
    let total = Infinity
    while ((page - 1) * pageSize < total && page <= 50) {
      const data = await fetchJson(
        `${base}/Toolbox/marketplace?page=${page}&pageSize=${pageSize}`,
      )
      const list = data?.tools || data?.Tools || (Array.isArray(data) ? data : [])
      total = Number(data?.total ?? data?.Total ?? list.length)
      for (const tool of list) {
        const slug = tool.slug || tool.Slug
        if (slug) paths.push(`/tools/${slug}`)
      }
      if (!list.length) break
      page += 1
    }
    sources.tools = true
  } catch (e) {
    errors.push(`tools: ${e.message || e}`)
  }

  try {
    let page = 1
    const pageSize = 100
    let total = Infinity
    while ((page - 1) * pageSize < total && page <= 50) {
      const data = await fetchJson(
        `${base}/CognitionDocs?status=published&page=${page}&pageSize=${pageSize}`,
      )
      const list = data?.List || data?.list || []
      total = Number(data?.Total ?? data?.total ?? list.length)
      for (const doc of list) {
        const slug = doc.Slug || doc.slug
        if (slug) paths.push(`/cognition/${slug}`)
      }
      if (!list.length) break
      page += 1
    }
    sources.cognition = true
  } catch (e) {
    errors.push(`cognition: ${e.message || e}`)
  }

  return { paths, sources, errors }
}

function collectArticlePathsFromGit(contentArticlesDir, takedownSlugs = new Set()) {
  if (!fs.existsSync(contentArticlesDir)) return []
  const { parse: parseYaml } = require('yaml')
  const paths = []
  for (const name of fs.readdirSync(contentArticlesDir)) {
    if (!name.endsWith('.md')) continue
    const slug = name.replace(/\.md$/i, '')
    if (!slug || slug.startsWith('_')) continue
    if (takedownSlugs.has(slug)) continue
    try {
      const raw = fs.readFileSync(path.join(contentArticlesDir, name), 'utf8')
      const match = raw.match(/^---\r?\n([\s\S]*?)\r?\n---/)
      if (!match) continue
      const data = parseYaml(match[1]) || {}
      const status = String(data.status || '').trim()
      if (status !== 'published') continue
      const fmSlug = String(data.slug || slug).trim()
      if (fmSlug !== slug) continue
      paths.push(`/blog/${slug}`)
    } catch {
      // skip broken files
    }
  }
  return paths
}

/**
 * Diff API-derived article sitemap paths vs Git content paths.
 * Does not switch production sitemap — Phase 4B-2 readiness only.
 */
function diffArticleSitemapPaths(apiPaths, gitPaths) {
  const apiSet = new Set(apiPaths.filter((p) => p.startsWith('/blog/')))
  const gitSet = new Set(gitPaths.filter((p) => p.startsWith('/blog/')))
  const onlyInApi = [...apiSet].filter((p) => !gitSet.has(p)).sort()
  const onlyInGit = [...gitSet].filter((p) => !apiSet.has(p)).sort()
  const shared = [...apiSet].filter((p) => gitSet.has(p)).sort()
  return {
    apiCount: apiSet.size,
    gitCount: gitSet.size,
    sharedCount: shared.length,
    onlyInApi,
    onlyInGit,
    equal: onlyInApi.length === 0 && onlyInGit.length === 0,
  }
}

function buildSitemapXml(siteUrl, paths, lastmod = new Date().toISOString().slice(0, 10)) {
  const site = stripTrailingSlash(siteUrl)
  const unique = uniqPaths(paths)
  const urls = unique.map((p) => {
    const loc = p === '/' ? site : `${site}${p}`
    const depth = p === '/' ? 1 : p.split('/').filter(Boolean).length
    const priority = p === '/' ? '1.0' : depth <= 1 ? '0.8' : '0.6'
    const changefreq = p === '/' ? 'weekly' : 'monthly'
    return `  <url>
    <loc>${loc}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>${changefreq}</changefreq>
    <priority>${priority}</priority>
  </url>`
  })

  return {
    xml: `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.join('\n')}
</urlset>
`,
    paths: unique,
  }
}

module.exports = {
  STATIC_PATHS,
  LIFE_RESERVED,
  EXCLUDED_PREFIXES,
  isPublicIndexablePath,
  canonicalizePath,
  uniqPaths,
  collectLifeNotePaths,
  collectDynamicFromApi,
  collectArticlePathsFromGit,
  diffArticleSitemapPaths,
  buildSitemapXml,
  stripTrailingSlash,
}
