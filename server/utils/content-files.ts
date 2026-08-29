import fs from 'node:fs'
import path from 'node:path'
import { parse as parseYaml } from 'yaml'
import { isLifeNoteSlug, isSafeContentSlug } from '../../constants/life-content'
import { parseFrontmatter } from './frontmatter'

const contentRoot = path.resolve(process.cwd(), 'content')

export const parseYamlSafe = (raw: string) => {
  try {
    return parseYaml(raw)
  } catch {
    return null
  }
}

export interface MarkdownContentItem {
  slug: string
  path: string
  _path: string
  title?: string
  description?: string
  summary?: string
  category?: string
  date?: string
  updatedAt?: string
  tags?: string[]
  cover?: string
  icon?: string
  status?: string
  role?: string
  duration?: string
  tech?: string[]
  demo_link?: string
  source_link?: string
  content: string
  [key: string]: unknown
}

const toArray = (value: unknown): string[] => {
  if (Array.isArray(value)) {
    return value.filter((item): item is string => typeof item === 'string' && Boolean(item.trim()))
  }

  if (typeof value === 'string' && value.trim()) {
    return value
      .split(/[,\u3001|/]/)
      .map(item => item.trim())
      .filter(Boolean)
  }

  return []
}

const createItem = (fullPath: string, routePath: string): MarkdownContentItem => {
  const fileContent = fs.readFileSync(fullPath, 'utf-8')
  const { data, content } = parseFrontmatter(fileContent)
  const slug = path.basename(fullPath, '.md')

  return {
    ...data,
    slug,
    path: routePath,
    _path: routePath,
    tags: toArray(data.tags),
    tech: toArray(data.tech),
    content
  }
}

const getSectionDirectory = (...segments: string[]) => path.join(contentRoot, ...segments)

export const readMarkdownCollection = (...segments: string[]) => {
  const sectionDir = getSectionDirectory(...segments)
  if (!fs.existsSync(sectionDir)) {
    return [] as MarkdownContentItem[]
  }

  return fs
    .readdirSync(sectionDir)
    .filter(file => file.endsWith('.md'))
    .filter((file) => {
      if (segments[0] !== 'life') return true
      return isLifeNoteSlug(path.basename(file, '.md'))
    })
    .map((file) => {
      const slug = path.basename(file, '.md')
      const routePath = `/${[...segments, slug].join('/')}`
      try {
        return createItem(path.join(sectionDir, file), routePath)
      } catch {
        return null
      }
    })
    .filter((item): item is MarkdownContentItem => item !== null)
    .sort((a, b) => new Date(b.date || b.updatedAt || 0).getTime() - new Date(a.date || a.updatedAt || 0).getTime())
}

export const readMarkdownDocument = (segments: string[], slug: unknown) => {
  const normalized = Array.isArray(slug) ? slug[0] : slug
  if (segments[0] === 'life' ? !isLifeNoteSlug(normalized) : !isSafeContentSlug(normalized)) {
    return null
  }

  const collection = readMarkdownCollection(...segments)
  return collection.find((item) => item.slug === normalized || item.path.endsWith(`/${normalized}`)) || null
}

export type LifeNowItem = {
  category: string
  title?: string
  description: string
  href?: string
}

export type LifeNowContent = {
  habits: string
  items: LifeNowItem[]
}

export type LifeMoment = {
  date: string
  content: string
  type?: 'daily' | 'thought' | 'activity'
  image?: string
  note?: string
}

export type LifeProfileAside = {
  label: string
  text: string
}

export type LifeProfile = {
  title: string
  kicker: string
  description: string
  emphasis?: string
  asides: LifeProfileAside[]
  paragraphs: string[]
}

const readContentFile = (...segments: string[]) => {
  const fullPath = path.join(contentRoot, ...segments)
  if (!fs.existsSync(fullPath)) {
    return null
  }
  return fs.readFileSync(fullPath, 'utf-8')
}

const splitParagraphs = (body: string) =>
  body
    .split(/\n\s*\n/)
    .map(block => block.replace(/\s*\n\s*/g, ' ').trim())
    .filter(Boolean)

const asString = (value: unknown) => (typeof value === 'string' ? value.trim() : '')

export const readYamlFile = (...segments: string[]) => {
  const raw = readContentFile(...segments)
  if (raw === null) {
    return null
  }
  return parseYamlSafe(raw)
}

export type LifeHomeContent = {
  hero: {
    kicker: string
    greeting: string
    name: string
    lines: string[]
    current: string
  }
  sections: {
    now: { number: string, title: string }
    moments: { number: string, title: string }
    notes: { number: string, title: string }
    about: { title: string }
  }
  empty: {
    moments: string
    notes: string
  }
  about: {
    description: string
    linkText: string
  }
  closing: string
}

const asStringList = (value: unknown) => {
  if (!Array.isArray(value)) return []
  return value.map(item => asString(item)).filter(Boolean)
}

const asSection = (value: unknown, fallback: { number?: string, title: string }) => {
  const row = value && typeof value === 'object' ? value as Record<string, unknown> : {}
  return {
    number: asString(row.number) || fallback.number || '',
    title: asString(row.title) || fallback.title
  }
}

export const readLifeHome = (): LifeHomeContent => {
  const parsed = readYamlFile('life', 'home.yml')
  const source = parsed && typeof parsed === 'object' ? parsed as Record<string, unknown> : {}
  const hero = source.hero && typeof source.hero === 'object' ? source.hero as Record<string, unknown> : {}
  const sections = source.sections && typeof source.sections === 'object' ? source.sections as Record<string, unknown> : {}
  const empty = source.empty && typeof source.empty === 'object' ? source.empty as Record<string, unknown> : {}
  const about = source.about && typeof source.about === 'object' ? source.about as Record<string, unknown> : {}
  const nowSection = asSection(sections.now, { number: '02', title: '最近在' })
  const momentsSection = asSection(sections.moments, { number: '03', title: '最近' })
  const notesSection = asSection(sections.notes, { number: '04', title: '随笔' })
  const aboutSection = asSection(sections.about, { title: '关于我' })

  return {
    hero: {
      kicker: asString(hero.kicker),
      greeting: asString(hero.greeting),
      name: asString(hero.name),
      lines: asStringList(hero.lines),
      current: asString(hero.current)
    },
    sections: {
      now: nowSection,
      moments: momentsSection,
      notes: notesSection,
      about: { title: aboutSection.title }
    },
    empty: {
      moments: asString(empty.moments),
      notes: asString(empty.notes)
    },
    about: {
      description: asString(about.description),
      linkText: asString(about.linkText)
    },
    closing: asString(source.closing)
  }
}

export const readLifeNow = (): LifeNowContent => {
  const parsed = readYamlFile('life', 'now.yml')
  const source = parsed && typeof parsed === 'object' ? parsed as Record<string, unknown> : {}
  const items = Array.isArray(source.items) ? source.items : Array.isArray(parsed) ? parsed : []

  return {
    habits: asString(source.habits),
    items: items
      .map((item) => {
        if (!item || typeof item !== 'object') return null
        const row = item as Record<string, unknown>
        const title = asString(row.title) || asString(row.category)
        const description = asString(row.description)
        if (!title || !description) return null
        return {
          category: asString(row.category) || title,
          title,
          description,
          href: asString(row.href) || undefined
        }
      })
      .filter((item): item is LifeNowItem => item !== null)
  }
}

export const readLifeMoments = (): LifeMoment[] => {
  const parsed = readYamlFile('life', 'moments.yml')
  const wrapped = parsed && typeof parsed === 'object' && !Array.isArray(parsed)
    ? (parsed as Record<string, unknown>).items
    : parsed
  const items = Array.isArray(wrapped) ? wrapped : []

  return items
    .map((item) => {
      if (!item || typeof item !== 'object') return null
      const row = item as Record<string, unknown>
      const date = asString(row.date)
      const content = asString(row.content)
      if (!date || !content) return null
      return {
        date,
        content,
        type: asString(row.type) as LifeMoment['type'] || undefined,
        image: asString(row.image) || undefined,
        note: asString(row.note) || undefined
      }
    })
    .filter((item): item is LifeMoment => item !== null)
    .sort((left, right) => new Date(right.date).getTime() - new Date(left.date).getTime())
}

export const readLifeProfile = (): LifeProfile | null => {
  const raw = readContentFile('life', 'profile.md')
  if (raw === null) {
    return null
  }

  const match = raw.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/)
  const parsed = match ? parseYamlSafe(match[1]) : null
  const data = parsed && typeof parsed === 'object' && !Array.isArray(parsed)
    ? parsed as Record<string, unknown>
    : {}
  const body = match ? match[2] : raw
  const asides = Array.isArray(data?.asides) ? data.asides : []

  return {
    title: asString(data?.title) || '关于我',
    kicker: asString(data?.kicker) || 'ABOUT / 关于我',
    description: asString(data?.description),
    emphasis: asString(data?.emphasis) || undefined,
    asides: asides
      .map((item) => {
        if (!item || typeof item !== 'object') return null
        const row = item as Record<string, unknown>
        const label = asString(row.label)
        const text = asString(row.text)
        if (!label || !text) return null
        return { label, text }
      })
      .filter((item): item is LifeProfileAside => item !== null)
      .slice(0, 3),
    paragraphs: splitParagraphs(body)
  }
}
