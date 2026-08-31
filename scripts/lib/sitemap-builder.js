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

  // Articles (paginate)
  try {
    let page = 1
    const pageSize = 100
    let total = Infinity
    while ((page - 1) * pageSize < total && page <= 50) {
      const data = await fetchJson(`${base}/Articles?page=${page}&pageSize=${pageSize}`)
      const list = data?.List || data?.list || []
      total = Number(data?.Total ?? data?.total ?? list.length)
      for (const article of list) {
        const status = article.Status ?? article.status
        // Only include clearly published when status is present; otherwise include (matches public list behavior)
        if (status !== undefined && status !== null && Number(status) !== 1 && status !== 'published') {
          continue
        }
        const slug = article.Slug || article.slug
        const id = article.Id || article.id
        const segment = slug || id
        if (segment) paths.push(`/blog/${segment}`)
      }
      if (!list.length) break
      page += 1
    }
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
  buildSitemapXml,
  stripTrailingSlash,
}
