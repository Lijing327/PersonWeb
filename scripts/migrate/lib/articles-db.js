/**
 * Shared MySQL helpers for Articles migration scripts.
 * Reads DB_* from process.env (load .env manually if needed).
 */
const mysql = require('mysql2/promise')
const fs = require('node:fs')
const path = require('node:path')

const root = path.resolve(__dirname, '../../..')

function loadEnvFile() {
  const envPath = path.join(root, '.env')
  if (!fs.existsSync(envPath)) return
  for (const line of fs.readFileSync(envPath, 'utf8').split(/\r?\n/)) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue
    const eq = trimmed.indexOf('=')
    if (eq <= 0) continue
    const key = trimmed.slice(0, eq).trim()
    let value = trimmed.slice(eq + 1).trim()
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1)
    }
    if (process.env[key] === undefined) {
      process.env[key] = value
    }
  }
}

async function createArticlesDbPool() {
  loadEnvFile()
  const { DB_HOST, DB_USER, DB_PASSWORD, DB_NAME } = process.env
  if (!DB_HOST || !DB_USER || !DB_NAME) {
    throw new Error('Missing DB env: DB_HOST, DB_USER, DB_NAME required')
  }
  return mysql.createPool({
    host: DB_HOST,
    user: DB_USER,
    password: DB_PASSWORD || '',
    database: DB_NAME,
    charset: 'utf8mb4',
    waitForConnections: true,
    connectionLimit: 4,
  })
}

/** Main article rows only — excludes parent_id version snapshots */
const MAIN_ARTICLE_WHERE = 'a.parent_id IS NULL'

async function fetchCategories(pool) {
  const [rows] = await pool.query(
    'SELECT id, name, slug, sort FROM category ORDER BY sort ASC, id ASC',
  )
  return rows
}

async function fetchAllArticles(pool) {
  const [rows] = await pool.query(`
    SELECT
      a.id, a.title, a.slug, a.summary, a.content_md, a.content_html,
      a.cover_url, a.category_id, a.status, a.source_type, a.author_id,
      a.publish_time, a.view_count, a.created_at, a.updated_at,
      a.version, a.parent_id,
      c.slug AS category_slug, c.name AS category_name
    FROM article a
    LEFT JOIN category c ON c.id = a.category_id
    ORDER BY a.id ASC
  `)
  return rows
}

async function fetchArticleTags(pool) {
  try {
    const [rows] = await pool.query(`
      SELECT at.article_id, t.name
      FROM article_tag at
      INNER JOIN tag t ON t.id = at.tag_id
      ORDER BY at.article_id, t.name
    `)
    return rows
  } catch {
    return []
  }
}

async function fetchVersionHistoryRows(pool) {
  const [rows] = await pool.query(`
    SELECT a.id, a.parent_id, a.slug, a.version, a.status, a.title
    FROM article a
    WHERE a.parent_id IS NOT NULL
    ORDER BY a.parent_id, a.version DESC
  `)
  return rows
}

function groupTagsByArticleId(tagRows) {
  const map = new Map()
  for (const row of tagRows) {
    const id = Number(row.article_id)
    if (!map.has(id)) map.set(id, [])
    map.get(id).push(String(row.name))
  }
  return map
}

function splitMainAndHistory(allRows) {
  const main = []
  const history = []
  for (const row of allRows) {
    if (row.parent_id != null) {
      history.push(row)
    } else {
      main.push(row)
    }
  }
  return { main, history }
}

module.exports = {
  root,
  createArticlesDbPool,
  fetchCategories,
  fetchAllArticles,
  fetchArticleTags,
  fetchVersionHistoryRows,
  groupTagsByArticleId,
  splitMainAndHistory,
  MAIN_ARTICLE_WHERE,
}
