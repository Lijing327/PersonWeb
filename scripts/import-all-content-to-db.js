/**
 * LEGACY migration helper (Phase 6):
 * content/blog|projects|tools directories were removed as empty orphans.
 * Life/cognition/ai paths remain. Script kept for optional one-off restores.
 *
 * 将所有 content/*.md 文件导入到数据库，并删除原文件
 * 
 * 支持的文件类型：
 * - content/blog/*.md -> article 表
 * - content/projects/*.md -> Projects 表
 * - content/ai/*.md -> knowledge_base 表
 * - content/life/*.md -> article 表（生活随笔分类）
 * - content/tools/*.md -> knowledge_base 表（工具分类）
 * 
 * 使用方法：
 * 1. 确保后端 API 服务运行
 * 2. 在管理后台登录，获取 token
 * 3. 设置环境变量 ADMIN_TOKEN=your_token
 * 4. 运行: node scripts/import-all-content-to-db.js
 * 
 * 环境变量：
 * - ADMIN_TOKEN: 管理员 token（必需）
 * - API_BASE: API 地址（可选，默认 https://api.xifg.com.cn/api）
 * - DELETE_FILES: 是否删除原文件（可选，默认 true）
 * - DELETE_EXISTING: 是否删除已存在的数据后重新导入（可选，默认 false）
 */

const fs = require('fs')
const path = require('path')
const https = require('https')
const http = require('http')

// 配置
const API_BASE = process.env.API_BASE || 'https://api.xifg.com.cn/api'
const ADMIN_TOKEN = process.env.ADMIN_TOKEN || ''
const DELETE_FILES = process.env.DELETE_FILES !== 'false' // 默认删除
const DELETE_EXISTING = process.env.DELETE_EXISTING === 'true' // 默认不删除已存在数据
const CONTENT_DIR = path.join(__dirname, '../content')

// 解析 frontmatter
function parseFrontmatter(content) {
  const match = content.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n([\s\S]*)$/)
  if (match) {
    const frontmatterRaw = match[1]
    const body = match[2]
    const data = {}
    
    frontmatterRaw.split(/\r?\n/).forEach(line => {
      if (!line.trim()) return
      
      // 处理多行值（如 capabilities:）
      if (line.match(/^[\w-]+:\s*$/)) {
        const key = line.split(':')[0].trim()
        data[key] = []
        return
      }
      
      // 处理数组项（如 - 'xxx'）
      if (line.trim().startsWith('-')) {
        const lastKey = Object.keys(data).pop()
        if (lastKey && Array.isArray(data[lastKey])) {
          const value = line.replace(/^-\s*/, '').trim().replace(/^["']|["']$/g, '')
          data[lastKey].push(value)
          return
        }
      }
      
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
    
    const req = client.request(options, (res) => {
      let body = ''
      res.on('data', chunk => body += chunk)
      res.on('end', () => {
        try {
          const json = JSON.parse(body)
          if (res.statusCode >= 200 && res.statusCode < 300) {
            resolve(json)
          } else {
            reject(new Error(json.message || `HTTP ${res.statusCode}: ${body}`))
          }
        } catch (e) {
          if (res.statusCode >= 200 && res.statusCode < 300) {
            resolve(body)
          } else {
            reject(new Error(`HTTP ${res.statusCode}: ${body}`))
          }
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

// 获取分类ID
async function getCategoryId(categoryName) {
  try {
    const categories = await request('GET', `${API_BASE}/Categories`)
    if (categories.data && Array.isArray(categories.data)) {
      const category = categories.data.find(c => 
        c.name === categoryName || c.slug === categoryName.toLowerCase()
      )
      return category ? category.id : null
    }
  } catch (e) {
    console.error(`  获取分类失败: ${e.message}`)
  }
  return null
}

// 创建分类（如果不存在）
async function ensureCategory(name, slug) {
  try {
    const categories = await request('GET', `${API_BASE}/Categories`)
    if (categories.data && Array.isArray(categories.data)) {
      const existing = categories.data.find(c => c.name === name || c.slug === slug)
      if (existing) return existing.id
    }
    
    // 创建新分类
    const result = await request('POST', `${API_BASE}/Categories`, { name, slug })
    return result.data?.id
  } catch (e) {
    console.error(`  创建分类失败: ${e.message}`)
    return null
  }
}

// 导入文章
async function importArticle(filePath, categoryName = '技术文章') {
  const content = fs.readFileSync(filePath, 'utf-8')
  const { data, content: body } = parseFrontmatter(content)
  
  const fileName = path.basename(filePath, '.md')
  
  // 准备文章数据
  const article = {
    title: data.title || fileName,
    slug: data.slug || fileName.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, ''),
    summary: data.description || data.summary || '',
    contentMd: body.trim(),
    status: 1, // 已发布
    publishTime: data.date ? new Date(data.date).toISOString() : new Date().toISOString(),
    coverUrl: data.cover || null
  }
  
  // 处理分类
  const finalCategory = data.category || categoryName
  const categoryId = await getCategoryId(finalCategory) || await ensureCategory(finalCategory, finalCategory.toLowerCase().replace(/\s+/g, '-'))
  if (categoryId) {
    article.categoryId = categoryId
  }
  
  try {
    // 检查是否已存在
    let existingId = null
    try {
      const existing = await request('GET', `${API_BASE}/Articles/slug/${article.slug}`)
      if (existing.data) {
        existingId = existing.data.id
        if (DELETE_EXISTING) {
          // 删除已存在的数据
          try {
            await request('DELETE', `${API_BASE}/Articles/${existingId}`)
            console.log(`  🗑️  已删除旧文章: ${article.title}`)
          } catch (e) {
            console.error(`  ⚠️  删除旧文章失败: ${e.message}`)
            return { skipped: true, title: article.title }
          }
        } else {
          console.log(`  ⚠️  文章已存在: ${article.title}`)
          return { skipped: true, title: article.title }
        }
      }
    } catch (e) {
      // 不存在，继续创建
    }
    
    const result = await request('POST', `${API_BASE}/Articles`, article)
    console.log(`  ✅ 导入成功: ${article.title}`)
    return { success: true, title: article.title, id: result.data?.id, deleted: existingId !== null }
  } catch (e) {
    console.error(`  ❌ 导入失败: ${article.title} - ${e.message}`)
    return { success: false, title: article.title, error: e.message }
  }
}

// 导入项目
async function importProject(filePath) {
  const content = fs.readFileSync(filePath, 'utf-8')
  const { data, content: body } = parseFrontmatter(content)
  
  const fileName = path.basename(filePath, '.md')
  
  // 准备项目数据
  const project = {
    title: data.title || fileName,
    description: data.description || '',
    coverUrl: data.cover || null,
    demoUrl: data.demo_link || data.demoUrl || null,
    githubUrl: data.source_link || data.githubUrl || data.github || null,
    status: data.status === '开发中' ? 'Active' : (data.status === '已完成' ? 'Completed' : 'Active'),
    techStack: data.tech ? JSON.stringify(Array.isArray(data.tech) ? data.tech : [data.tech]) : null,
    content: body.trim()
  }
  
  try {
    // 检查是否已存在（根据标题）
    let existingId = null
    const projects = await request('GET', `${API_BASE}/Projects`)
    if (projects.data && Array.isArray(projects.data)) {
      const existing = projects.data.find(p => p.title === project.title)
      if (existing) {
        existingId = existing.id
        if (DELETE_EXISTING) {
          // 删除已存在的数据
          try {
            await request('DELETE', `${API_BASE}/Projects/${existingId}`)
            console.log(`  🗑️  已删除旧项目: ${project.title}`)
          } catch (e) {
            console.error(`  ⚠️  删除旧项目失败: ${e.message}`)
            return { skipped: true, title: project.title }
          }
        } else {
          console.log(`  ⚠️  项目已存在: ${project.title}`)
          return { skipped: true, title: project.title }
        }
      }
    }
    
    const result = await request('POST', `${API_BASE}/Projects`, project)
    console.log(`  ✅ 导入成功: ${project.title}`)
    return { success: true, title: project.title, id: result.data?.id, deleted: existingId !== null }
  } catch (e) {
    console.error(`  ❌ 导入失败: ${project.title} - ${e.message}`)
    return { success: false, title: project.title, error: e.message }
  }
}

// 导入知识库
async function importKnowledgeBase(filePath, category = '开发笔记') {
  const content = fs.readFileSync(filePath, 'utf-8')
  const { data, content: body } = parseFrontmatter(content)
  
  const fileName = path.basename(filePath, '.md')
  
  // 准备知识库数据
  const kb = {
    title: data.title || fileName,
    content: body.trim(),
    category: data.category || category,
    tags: data.tags ? (Array.isArray(data.tags) ? JSON.stringify(data.tags) : data.tags) : null,
    status: 1, // 已发布
    version: 1
  }
  
  try {
    // 检查是否已存在
    let existingId = null
    const kbs = await request('GET', `${API_BASE}/KnowledgeBase`)
    if (kbs.data && Array.isArray(kbs.data)) {
      const existing = kbs.data.find(k => k.title === kb.title)
      if (existing) {
        existingId = existing.id
        if (DELETE_EXISTING) {
          // 删除已存在的数据
          try {
            await request('DELETE', `${API_BASE}/KnowledgeBase/${existingId}`)
            console.log(`  🗑️  已删除旧知识库: ${kb.title}`)
          } catch (e) {
            console.error(`  ⚠️  删除旧知识库失败: ${e.message}`)
            return { skipped: true, title: kb.title }
          }
        } else {
          console.log(`  ⚠️  知识库已存在: ${kb.title}`)
          return { skipped: true, title: kb.title }
        }
      }
    }
    
    const result = await request('POST', `${API_BASE}/KnowledgeBase`, kb)
    console.log(`  ✅ 导入成功: ${kb.title}`)
    return { success: true, title: kb.title, id: result.data?.id, deleted: existingId !== null }
  } catch (e) {
    console.error(`  ❌ 导入失败: ${kb.title} - ${e.message}`)
    return { success: false, title: kb.title, error: e.message }
  }
}

// 递归获取所有 Markdown 文件
function getAllMarkdownFiles(dir, fileList = []) {
  if (!fs.existsSync(dir)) return fileList
  
  const files = fs.readdirSync(dir)
  files.forEach(file => {
    const filePath = path.join(dir, file)
    const stat = fs.statSync(filePath)
    if (stat.isDirectory()) {
      getAllMarkdownFiles(filePath, fileList)
    } else if (file.endsWith('.md')) {
      fileList.push(filePath)
    }
  })
  return fileList
}

// 主函数
async function main() {
  if (!ADMIN_TOKEN) {
    console.error('❌ 错误: 请设置环境变量 ADMIN_TOKEN')
    console.log('使用方法:')
    console.log('  ADMIN_TOKEN=your_token node scripts/import-all-content-to-db.js')
    console.log('可选参数:')
    console.log('  API_BASE=https://api.xifg.com.cn/api')
    console.log('  DELETE_FILES=true (默认删除原文件)')
    process.exit(1)
  }
  
  if (!fs.existsSync(CONTENT_DIR)) {
    console.error(`❌ 错误: 目录不存在 ${CONTENT_DIR}`)
    process.exit(1)
  }
  
  const allFiles = getAllMarkdownFiles(CONTENT_DIR)
  
  if (allFiles.length === 0) {
    console.log('⚠️  没有找到 Markdown 文件')
    process.exit(0)
  }
  
  console.log(`📚 找到 ${allFiles.length} 个 Markdown 文件`)
  console.log(`🚀 开始导入到 ${API_BASE}...`)
  console.log(`🗑️  导入成功后${DELETE_FILES ? '将删除' : '不会删除'}原文件`)
  console.log(`🔄 ${DELETE_EXISTING ? '将删除' : '不会删除'}已存在的数据后重新导入\n`)
  
  const results = {
    success: 0,
    failed: 0,
    skipped: 0,
    deleted: 0,
    deletedFromDb: 0
  }
  
  // 按目录分类处理
  for (const filePath of allFiles) {
    const relativePath = path.relative(CONTENT_DIR, filePath)
    const dir = path.dirname(relativePath)
    const fileName = path.basename(filePath)
    
    console.log(`\n处理: ${relativePath}`)
    
    let result = null
    
    // 根据目录决定导入到哪个表
    if (dir === 'blog' || dir === '.') {
      // blog 目录或根目录 -> article 表
      result = await importArticle(filePath, '技术文章')
    } else if (dir === 'life') {
      if (fileName === 'profile.md') {
        console.log('  跳过: profile.md 是 About 文案，不是随笔')
        continue
      }
      // life 目录 -> article 表（生活随笔分类）
      result = await importArticle(filePath, '生活随笔')
    } else if (dir.startsWith('projects')) {
      // projects 目录 -> Projects 表
      result = await importProject(filePath)
    } else if (dir.startsWith('ai') || dir.startsWith('tools')) {
      // ai 或 tools 目录 -> knowledge_base 表
      const category = dir.startsWith('ai') ? '想法灵感' : '工具推荐'
      result = await importKnowledgeBase(filePath, category)
    } else {
      // 其他目录 -> knowledge_base 表
      result = await importKnowledgeBase(filePath, '开发笔记')
    }
    
    if (result.success) {
      results.success++
      if (result.deleted) {
        results.deletedFromDb++
      }
      // 删除文件
      if (DELETE_FILES) {
        try {
          fs.unlinkSync(filePath)
          console.log(`  🗑️  已删除文件: ${fileName}`)
          results.deleted++
        } catch (e) {
          console.error(`  ⚠️  删除文件失败: ${e.message}`)
        }
      }
    } else if (result.skipped) {
      results.skipped++
      // 跳过时也删除（因为已存在）
      if (DELETE_FILES) {
        try {
          fs.unlinkSync(filePath)
          console.log(`  🗑️  已删除文件（已存在）: ${fileName}`)
          results.deleted++
        } catch (e) {
          console.error(`  ⚠️  删除文件失败: ${e.message}`)
        }
      }
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
  if (DELETE_EXISTING && results.deletedFromDb > 0) {
    console.log(`  🗑️  已删除数据库记录: ${results.deletedFromDb}`)
  }
  if (DELETE_FILES) {
    console.log(`  🗑️  已删除文件: ${results.deleted}`)
  }
  
  // 检查是否还有文件
  const remainingFiles = getAllMarkdownFiles(CONTENT_DIR)
  if (remainingFiles.length > 0) {
    console.log(`\n⚠️  还有 ${remainingFiles.length} 个文件未处理:`)
    remainingFiles.forEach(f => console.log(`  - ${path.relative(CONTENT_DIR, f)}`))
  } else {
    console.log(`\n✅ 所有文件已处理完成！`)
  }
}

main().catch(console.error)

