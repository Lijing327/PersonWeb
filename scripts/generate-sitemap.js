/**
 * 生成 public/sitemap.xml（部署到 OSS 前执行）
 * 用法: node scripts/generate-sitemap.js
 */
const { writeFileSync } = require('node:fs')
const { resolve } = require('node:path')

const SITE = process.env.SITE_URL || 'https://xifg.com.cn'

/** 公开前台静态路由（不含 /admin、订单流程等） */
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
  '/ai',
  '/ai-intro',
  '/lab',
  '/search',
  '/links',
  '/changelog',
  '/pricing',
  '/download',
  '/cognition',
  '/cognition/changelog',
  '/side-projects',
  '/skills',
  '/english',
  '/knowledge',
  '/products',
  '/products/desktop-pet',
  '/showcase',
  '/game',
]

const lastmod = new Date().toISOString().slice(0, 10)

const urls = STATIC_PATHS.map((path) => {
  const loc = path === '/' ? SITE : `${SITE}${path}`
  const priority = path === '/' ? '1.0' : path.split('/').length <= 2 ? '0.8' : '0.6'
  const changefreq = path === '/' ? 'weekly' : 'monthly'
  return `  <url>
    <loc>${loc}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>${changefreq}</changefreq>
    <priority>${priority}</priority>
  </url>`
})

const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.join('\n')}
</urlset>
`

const out = resolve(__dirname, '../public/sitemap.xml')
writeFileSync(out, xml, 'utf8')
console.log(`✅ sitemap.xml → ${out} (${STATIC_PATHS.length} URLs)`)
