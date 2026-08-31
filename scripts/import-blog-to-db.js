/**
 * LEGACY migration helper (Phase 6):
 * Work markdown dirs content/blog|projects|tools were removed (empty + no runtime consumers).
 * This script remains for one-off imports if you restore markdown into those paths.
 * Prefer Admin → .NET APIs for ongoing content.
 *
 * 将 content/blog/*.md 文件导入到数据库
 * ...
 */

const fs = require('fs')
const path = require('path')
const https = require('https')
const http = require('http')

// 配置
const API_BASE = process.env.API_BASE || 'https://api.xifg.com.cn/api'
const ADMIN_TOKEN = process.env.ADMIN_TOKEN || ''
const BLOG_DIR = path.join(__dirname, '../content/blog')

// 解析 frontmatter（简化版）
function parseFrontmatter(content) {
  const match = content.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n([\s\S]*)$/)
  if (match) {
    const frontmatterRaw = match[1]
    const body = match[2]
    const data = {}
    
    frontmatterRaw.split(/\r?\n/).forEach(line => {
      const parts = line.split(':')
      if (parts.length >= 2) {
        const key = parts[0].trim()
        let value = parts.slice(1).join(':').trim()
        
        // 移除引号
        if ((value.startsWith('"') && value.endsWith('"')) || 
            (value.startsWith("'") && value.endsWith("'"))) {
          value = value.slice(1, -1)
        }
        
        // 处理数组
        if (value.startsWith('[') && value.endsWith(']')) {
          data[key] = value.slice(1, -1).split(',').map(v => 
            v.trim().replace(/^"|"$/g, '').replace(/^'|'$/g, '')
          )
        } else {
          data[key] = value
        }
      }
    })
    
    return { data, content: body }
  }
  return { data: {}, content }
}

// 发送 HTTP 请求
function request(method, url, data = null) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url)
    const isHttps = urlObj.protocol === 'https:'
    const client = isHttps ? https : http
    
    const options = {
      hostname: urlObj.hostname,
      port: urlObj.port || (isHttps ? 443 : 80),
      path: urlObj.pathname + urlObj.search,
      method: method,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${ADMIN_TOKEN}`
      }
    }
    
    if (data) {
      const postData = JSON.stringify(data)
      options.headers['Content-Length'] = Buffer.byteLength(postData)
    }
    
    const req = client.request(options, (res) => {
      let body = ''
      res.on('data', chunk => body += chunk)
      res.on('end', () => {
        try {
          const result = JSON.parse(body)
          if (res.statusCode >= 200 && res.statusCode < 300) {
            resolve(result)
          } else {
            reject(new Error(`HTTP ${res.statusCode}: ${result.message || body}`))
          }
        } catch (e) {
          reject(new Error(`Parse error: ${body}`))
        }
      })
    })
    
    req.on('error', reject)
    
    if (data) {
      req.write(JSON.stringify(data))
    }
    
    req.end()
  })
}

// 获取分类 ID（根据名称）
async function getCategoryId(categoryName) {
  try {
    const categories = await request('GET', `${API_BASE}/Categories`)
    const category = categories.data?.find(c => c.name === categoryName)
    return category?.id || null
  } catch (e) {
    console.warn(`无法获取分类 "${categoryName}":`, e.message)
    return null
  }
}

// 导入单篇文章
async function importArticle(file) {
  const filePath = path.join(BLOG_DIR, file)
  const content = fs.readFileSync(filePath, 'utf-8')
  const { data, content: body } = parseFrontmatter(content)
  
  // 准备文章数据
  const article = {
    title: data.title || file.replace('.md', ''),
    slug: data.slug || file.replace('.md', '').toLowerCase().replace(/\s+/g, '-'),
    summary: data.description || data.summary || '',
    contentMd: body.trim(),
    status: 1, // 已发布
    publishTime: data.date ? new Date(data.date).toISOString() : new Date().toISOString(),
    coverUrl: data.cover || null
  }
  
  // 处理分类
  if (data.category) {
    const categoryId = await getCategoryId(data.category)
    if (categoryId) {
      article.categoryId = categoryId
    }
  }
  
  try {
    // 检查是否已存在（根据 slug）
    const existing = await request('GET', `${API_BASE}/Articles/slug/${article.slug}`)
    if (existing.data) {
      console.log(`  ⚠️  文章已存在: ${article.title}`)
      return { skipped: true, title: article.title }
    }
  } catch (e) {
    // 不存在，继续创建
  }
  
  try {
    const result = await request('POST', `${API_BASE}/Articles`, article)
    console.log(`  ✅ 导入成功: ${article.title}`)
    return { success: true, title: article.title, id: result.data?.id }
  } catch (e) {
    console.error(`  ❌ 导入失败: ${article.title} - ${e.message}`)
    return { success: false, title: article.title, error: e.message }
  }
}

// 主函数
async function main() {
  if (!ADMIN_TOKEN) {
    console.error('❌ 错误: 请设置环境变量 ADMIN_TOKEN')
    console.log('使用方法:')
    console.log('  ADMIN_TOKEN=your_token node scripts/import-blog-to-db.js')
    process.exit(1)
  }
  
  if (!fs.existsSync(BLOG_DIR)) {
    console.error(`❌ 错误: 目录不存在 ${BLOG_DIR}`)
    process.exit(1)
  }
  
  const files = fs.readdirSync(BLOG_DIR).filter(f => f.endsWith('.md'))
  
  if (files.length === 0) {
    console.log('⚠️  没有找到 Markdown 文件')
    process.exit(0)
  }
  
  console.log(`📚 找到 ${files.length} 个 Markdown 文件`)
  console.log(`🚀 开始导入到 ${API_BASE}...\n`)
  
  const results = {
    success: 0,
    failed: 0,
    skipped: 0
  }
  
  for (const file of files) {
    console.log(`处理: ${file}`)
    const result = await importArticle(file)
    
    if (result.success) {
      results.success++
    } else if (result.skipped) {
      results.skipped++
    } else {
      results.failed++
    }
    
    // 避免请求过快
    await new Promise(resolve => setTimeout(resolve, 500))
  }
  
  console.log(`\n📊 导入完成:`)
  console.log(`  ✅ 成功: ${results.success}`)
  console.log(`  ⚠️  跳过: ${results.skipped}`)
  console.log(`  ❌ 失败: ${results.failed}`)
}

main().catch(console.error)

