/**
 * 生成 public/sitemap.xml
 * 用法: node scripts/generate-sitemap.js
 *
 * 动态 URL 依赖 .NET API（NUXT_PUBLIC_API_BASE / SITEMAP_API_BASE）。
 * 后端不可达时：仍写出静态 + Life 文件 URL，并写入 sitemap.status.json 标明不完整。
 * 绝不虚构 blog/projects/tools/cognition 动态 URL。
 */
const { writeFileSync } = require('node:fs')
const { resolve } = require('node:path')
const {
  STATIC_PATHS,
  collectLifeNotePaths,
  collectDynamicFromApi,
  buildSitemapXml,
  stripTrailingSlash,
} = require('./lib/sitemap-builder')

async function main() {
  const SITE = stripTrailingSlash(process.env.SITE_URL || process.env.NUXT_PUBLIC_SITE_URL || 'https://xifg.com.cn')
  const API_BASE = stripTrailingSlash(
    process.env.SITEMAP_API_BASE
      || process.env.NUXT_PUBLIC_API_BASE
      || 'http://localhost:5234/api',
  )

  const lifePaths = collectLifeNotePaths(resolve(__dirname, '../content/life'))
  let dynamicPaths = []
  let sources = { articles: false, projects: false, tools: false, cognition: false }
  let errors = []

  try {
    const dynamic = await collectDynamicFromApi(API_BASE)
    dynamicPaths = dynamic.paths
    sources = dynamic.sources
    errors = dynamic.errors
  } catch (e) {
    errors.push(`api: ${e.message || e}`)
  }

  const allPaths = [...STATIC_PATHS, ...lifePaths, ...dynamicPaths]
  const { xml, paths } = buildSitemapXml(SITE, allPaths)

  const out = resolve(__dirname, '../public/sitemap.xml')
  writeFileSync(out, xml, 'utf8')

  const staticCount = STATIC_PATHS.length
  const dynamicCount = paths.filter((p) => !STATIC_PATHS.includes(p)).length
  const complete = sources.articles && sources.projects && sources.tools && sources.cognition && errors.length === 0

  const status = {
    generatedAt: new Date().toISOString(),
    siteUrl: SITE,
    apiBase: API_BASE,
    complete,
    counts: {
      total: paths.length,
      static: staticCount,
      lifeNotes: lifePaths.length,
      dynamicFromApi: dynamicPaths.length,
      uniqueWritten: paths.length,
    },
    sources,
    errors,
    note: complete
      ? 'Sitemap includes static + Life FS + backend dynamic URLs.'
      : 'INCOMPLETE: backend dynamic sources unavailable or partial. No fictional URLs were invented. Re-run with a reachable SITEMAP_API_BASE / NUXT_PUBLIC_API_BASE.',
  }

  writeFileSync(
    resolve(__dirname, '../public/sitemap.status.json'),
    `${JSON.stringify(status, null, 2)}\n`,
    'utf8',
  )

  if (complete) {
    console.log(`✅ sitemap.xml → ${out} (${paths.length} URLs, complete)`)
  } else {
    console.warn(`⚠️  sitemap.xml → ${out} (${paths.length} URLs, INCOMPLETE)`)
    console.warn(status.note)
    if (errors.length) {
      console.warn('Errors:', errors.join('; '))
    }
  }
}

main().catch((err) => {
  console.error('sitemap generation failed:', err)
  process.exit(1)
})
