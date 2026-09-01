import fs from 'node:fs'
import path from 'node:path'
import { parse as parseYaml } from 'yaml'
import { isLifeNoteSlug, isSafeContentSlug } from '../../constants/life-content'
import { isArticleContentSlug, ARTICLES_TAXONOMY_FILE } from '../../constants/articles-content'
import type {
  ArticleContentItem,
  ArticleFrontmatter,
  ArticleTaxonomy,
} from '../../types/articlesContent'
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
  icon?: string
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
    about: { number: string, title: string }
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
  const aboutSection = asSection(sections.about, { number: '05', title: '关于我' })

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
      about: aboutSection
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
          href: asString(row.href) || undefined,
          icon: asString(row.icon) || undefined
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

// ---------------------------------------------------------------------------
// Work world (content/work) — mirror Life YAML/MD pattern
// ---------------------------------------------------------------------------

const asObject = (value: unknown) =>
  value && typeof value === 'object' && !Array.isArray(value)
    ? value as Record<string, unknown>
    : {}

const asLinkList = (value: unknown) => {
  if (!Array.isArray(value)) return []
  return value
    .map((item) => {
      if (!item || typeof item !== 'object') return null
      const row = item as Record<string, unknown>
      const label = asString(row.label)
      if (!label) return null
      return {
        label,
        href: asString(row.href) || undefined,
        to: asString(row.to) || undefined,
        variant: asString(row.variant) || undefined,
        external: Boolean(row.external),
        value: asString(row.value) || undefined,
        icon: asString(row.icon) || undefined,
        name: asString(row.name) || undefined,
      }
    })
    .filter((item): item is NonNullable<typeof item> => item !== null)
}

export const readWorkContact = () => {
  const source = asObject(readYamlFile('work', 'contact.yml'))
  const github = asObject(source.github)
  const wechat = asObject(source.wechat)
  const footer = asObject(source.footer)
  const email = asString(source.email)
  const mailto = email ? `mailto:${email}` : ''
  const githubUrl = asString(github.url)
  const githubDisplay = asString(github.display) || githubUrl.replace(/^https?:\/\//, '')

  const rows = [
    email
      ? { label: 'Email', value: email, href: mailto, external: false as const, to: undefined, variant: undefined, icon: undefined, name: undefined }
      : null,
    githubUrl
      ? { label: 'GitHub', value: githubDisplay, href: githubUrl, external: true as const, to: undefined, variant: undefined, icon: undefined, name: undefined }
      : null,
    { label: '微信', value: asString(wechat.note) || '扫码添加', to: '/contact', href: undefined, external: false as const, variant: undefined, icon: undefined, name: undefined },
  ].filter((item): item is NonNullable<typeof item> => item !== null)

  const heroLinks = [
    githubUrl ? { label: 'GitHub', href: githubUrl, external: true as const, to: undefined, variant: undefined, value: undefined, icon: undefined, name: undefined } : null,
    mailto ? { label: 'Email', href: mailto, external: false as const, to: undefined, variant: undefined, value: undefined, icon: undefined, name: undefined } : null,
  ].filter((item): item is NonNullable<typeof item> => item !== null)

  return {
    email,
    mailto,
    github: {
      url: githubUrl,
      display: githubDisplay,
    },
    wechat: {
      note: asString(wechat.note) || '扫码添加',
      qrImage: asString(wechat.qr_image) || '/images/wechat-qr.png',
    },
    cooperationTitle: asString(source.cooperation_title) || '联系合作',
    cooperationKicker: asString(source.cooperation_kicker) || 'Work With Me',
    cooperationDescription: asString(source.cooperation_description),
    cooperationChips: asStringList(source.cooperation_chips),
    responseNote: asString(source.response_note),
    footer: {
      tagline: asString(footer.tagline),
      description: asString(footer.description),
    },
    rows,
    heroLinks,
  }
}

export type WorkContactContent = ReturnType<typeof readWorkContact>

const patchMailtoLinks = <T extends { href?: string }>(links: T[], mailto: string) =>
  links.map((link) => {
    if (link.href === 'mailto:' || link.href?.startsWith('mailto:')) {
      return { ...link, href: mailto || link.href }
    }
    return link
  })

const buildAboutSocials = (contact: WorkContactContent) => {
  const socials = []
  if (contact.github.url) {
    socials.push({ name: 'GitHub', icon: 'fab fa-github', href: contact.github.url, label: undefined, to: undefined, variant: undefined, external: true as const, value: undefined })
  }
  if (contact.mailto) {
    socials.push({ name: 'Email', icon: 'fas fa-envelope', href: contact.mailto, label: undefined, to: undefined, variant: undefined, external: false as const, value: undefined })
  }
  return socials
}

export const readWorkHome = () => {
  const contactSoT = readWorkContact()
  const source = asObject(readYamlFile('work', 'home.yml'))
  const brand = asObject(source.brand)
  const hero = asObject(source.hero)
  const panel = asObject(source.panel)
  const sections = asObject(source.sections)
  const contactBlock = asObject(source.contact)
  const footer = asObject(source.footer)
  const seo = asObject(source.seo)

  const section = (key: string, fallbackTitle: string) => {
    const row = asObject(sections[key])
    return {
      number: asString(row.number),
      label: asString(row.label),
      title: asString(row.title) || fallbackTitle,
      description: asString(row.description),
      linkText: asString(row.link_text),
      linkTo: asString(row.link_to),
    }
  }

  return {
    brand: {
      name: asString(brand.name) || '溪午听风',
      tagline: asString(brand.tagline),
    },
    hero: {
      kicker: asString(hero.kicker),
      title: asString(hero.title) || '溪午听风',
      englishName: asString(hero.english_name),
      role: asString(hero.role),
      value: asString(hero.value),
      actions: asLinkList(hero.actions),
      links: contactSoT.heroLinks,
    },
    panel: {
      focus: asStringList(panel.focus),
      status: asStringList(panel.status),
      tools: asStringList(panel.tools),
      currentSuffix: asString(panel.current_suffix) || '持续迭代中',
    },
    sections: {
      featured: section('featured', '精选项目'),
      more: section('more', '更多项目'),
      capabilities: section('capabilities', '能力范围'),
      contact: section('contact', '联系我'),
    },
    contact: {
      rows: contactSoT.rows,
      note: contactSoT.responseNote || asString(contactBlock.note),
    },
    footer: {
      name: asString(footer.name) || '溪午听风',
      description: asString(footer.description),
    },
    seo: {
      title: asString(seo.title),
      description: asString(seo.description),
    },
  }
}

export const readWorkCapabilities = () => {
  const source = asObject(readYamlFile('work', 'capabilities.yml'))
  const areas = Array.isArray(source.areas) ? source.areas : []

  return {
    areas: areas
      .map((item) => {
        if (!item || typeof item !== 'object') return null
        const row = item as Record<string, unknown>
        const id = asString(row.id)
        const title = asString(row.title)
        if (!id || !title) return null
        return {
          id,
          title,
          bullets: asStringList(row.bullets),
        }
      })
      .filter((item): item is { id: string, title: string, bullets: string[] } => item !== null),
  }
}

export const readWorkAbout = () => {
  const contactSoT = readWorkContact()
  const raw = readContentFile('work', 'about.md')
  if (raw === null) return null

  const match = raw.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/)
  const parsed = match ? parseYamlSafe(match[1]) : null
  const data = asObject(parsed)
  const body = match ? match[2] : raw

  const focus = asObject(data.focus)
  const pathBlock = asObject(data.path)
  const workStyles = asObject(data.work_styles)
  const cta = asObject(data.cta)
  const featuredProjects = asObject(data.featured_projects)
  const seo = asObject(data.seo)
  const jsonLd = asObject(data.json_ld)

  const mapCards = (value: unknown) => {
    if (!Array.isArray(value)) return []
    return value
      .map((item) => {
        if (!item || typeof item !== 'object') return null
        const row = item as Record<string, unknown>
        const title = asString(row.title)
        if (!title) return null
        return {
          title,
          desc: asString(row.desc),
          icon: asString(row.icon),
          color: asString(row.color),
          points: asStringList(row.points),
        }
      })
      .filter((item): item is NonNullable<typeof item> => item !== null)
  }

  return {
    eyebrow: asString(data.eyebrow),
    title: asString(data.title) || '溪午听风',
    subtitle: asString(data.subtitle),
    description: asString(data.description),
    location: asString(data.location),
    summary: asString(data.summary),
    tags: asStringList(data.tags),
    actions: patchMailtoLinks(asLinkList(data.actions), contactSoT.mailto),
    socials: buildAboutSocials(contactSoT),
    focus: {
      heading: asString(focus.heading),
      subheading: asString(focus.subheading),
      items: mapCards(focus.items),
    },
    path: {
      heading: asString(pathBlock.heading),
      subheading: asString(pathBlock.subheading),
      steps: mapCards(pathBlock.steps),
    },
    workStyles: {
      heading: asString(workStyles.heading),
      subheading: asString(workStyles.subheading),
      items: mapCards(workStyles.items),
    },
    featuredProjects: {
      heading: asString(featuredProjects.heading) || '代表性项目',
      subheading: asString(featuredProjects.subheading),
      moreLabel: asString(featuredProjects.more_label) || '查看更多项目',
    },
    cta: {
      title: asString(cta.title),
      description: asString(cta.description),
      actions: patchMailtoLinks(asLinkList(cta.actions), contactSoT.mailto),
    },
    seo: {
      title: asString(seo.title),
      description: asString(seo.description),
    },
    jsonLd: {
      jobTitle: asString(jsonLd.jobTitle),
      description: asString(jsonLd.description),
    },
    paragraphs: splitParagraphs(body),
  }
}

export const readWorkAi = () => {
  const source = asObject(readYamlFile('work', 'ai.yml'))
  const badge = asObject(source.badge)
  const seo = asObject(source.seo)
  const cta = asObject(source.cta)
  const sectionTitles = asObject(source.section_titles)
  const assistant = asObject(source.assistant)
  const hub = asObject(assistant.hub)
  const chat = asObject(assistant.chat)
  const welcome = asObject(chat.welcome)

  const mapIdCards = (value: unknown, featureKey: 'examples' | 'features' | 'highlights') => {
    if (!Array.isArray(value)) return []
    return value
      .map((item) => {
        if (!item || typeof item !== 'object') return null
        const row = item as Record<string, unknown>
        const id = asString(row.id)
        const title = asString(row.title)
        if (!id || !title) return null
        return {
          id,
          title,
          icon: asString(row.icon),
          description: asString(row.description),
          examples: featureKey === 'examples' ? asStringList(row.examples) : undefined,
          features: featureKey === 'features' ? asStringList(row.features) : undefined,
          highlights: featureKey === 'highlights' ? asStringList(row.highlights) : undefined,
          status: asString(row.status) || undefined,
          path: asString(row.path) || null,
        }
      })
      .filter((item): item is NonNullable<typeof item> => item !== null)
  }

  const techStack = Array.isArray(source.tech_stack) ? source.tech_stack : []
  const cooperation = Array.isArray(source.cooperation_steps) ? source.cooperation_steps : []
  const hubItems = Array.isArray(hub.items) ? hub.items : []
  const quickActions = Array.isArray(chat.quick_actions) ? chat.quick_actions : []

  return {
    badge: { text: asString(badge.text) },
    title: asString(source.title),
    subtitle: asString(source.subtitle),
    description: asString(source.description),
    heroActions: asLinkList(source.hero_actions),
    seo: {
      title: asString(seo.title),
      description: asString(seo.description),
    },
    scenarios: mapIdCards(source.scenarios, 'examples'),
    capabilities: mapIdCards(source.capabilities, 'features'),
    featuredProjects: mapIdCards(source.featured_projects, 'highlights'),
    techStackCategories: techStack
      .map((item) => {
        if (!item || typeof item !== 'object') return null
        const row = item as Record<string, unknown>
        const name = asString(row.name)
        if (!name) return null
        return {
          name,
          icon: asString(row.icon),
          items: asStringList(row.items),
        }
      })
      .filter((item): item is NonNullable<typeof item> => item !== null),
    cooperationSteps: cooperation
      .map((item) => {
        if (!item || typeof item !== 'object') return null
        const row = item as Record<string, unknown>
        const title = asString(row.title)
        if (!title) return null
        return {
          title,
          description: asString(row.description),
        }
      })
      .filter((item): item is NonNullable<typeof item> => item !== null),
    cta: {
      text: asString(cta.text),
      primaryButton: {
        text: asString(asObject(cta.primary_button).text),
        path: asString(asObject(cta.primary_button).path),
        icon: asString(asObject(cta.primary_button).icon),
      },
      secondaryButton: {
        text: asString(asObject(cta.secondary_button).text),
        anchor: asString(asObject(cta.secondary_button).anchor),
        icon: asString(asObject(cta.secondary_button).icon),
      },
    },
    sectionTitles: {
      scenarios: asString(sectionTitles.scenarios),
      scenariosIcon: asString(sectionTitles.scenarios_icon),
      scenariosNote: asString(sectionTitles.scenarios_note),
      capabilities: asString(sectionTitles.capabilities),
      capabilitiesIcon: asString(sectionTitles.capabilities_icon),
      projects: asString(sectionTitles.projects),
      projectsIcon: asString(sectionTitles.projects_icon),
      projectsNote: asString(sectionTitles.projects_note),
      projectsDescription: asString(sectionTitles.projects_description),
      techStack: asString(sectionTitles.tech_stack),
      techStackIcon: asString(sectionTitles.tech_stack_icon),
      cooperation: asString(sectionTitles.cooperation),
      cooperationIcon: asString(sectionTitles.cooperation_icon),
    },
    assistant: {
      hub: {
        title: asString(hub.title),
        triggerLabel: asString(hub.trigger_label),
        items: hubItems
          .map((item) => {
            if (!item || typeof item !== 'object') return null
            const row = item as Record<string, unknown>
            const id = asString(row.id)
            const title = asString(row.title)
            if (!id || !title) return null
            return {
              id,
              title,
              description: asString(row.description),
              icon: asString(row.icon),
              action: asString(row.action),
            }
          })
          .filter((item): item is NonNullable<typeof item> => item !== null),
      },
      chat: {
        name: asString(chat.name) || 'AI 小智',
        statusOnline: asString(chat.status_online) || '在线',
        statusThinking: asString(chat.status_thinking) || '正在思考...',
        welcome: {
          eyebrow: asString(welcome.eyebrow),
          title: asString(welcome.title),
          description: asString(welcome.description),
        },
        quickActions: quickActions
          .map((item) => {
            if (!item || typeof item !== 'object') return null
            const row = item as Record<string, unknown>
            const text = asString(row.text)
            if (!text) return null
            return {
              text,
              icon: asString(row.icon) || 'article',
            }
          })
          .filter((item): item is NonNullable<typeof item> => item !== null),
        systemAbout: asString(chat.system_about),
      },
    },
  }
}

export type WorkHomeContent = ReturnType<typeof readWorkHome>
export type WorkCapabilitiesContent = ReturnType<typeof readWorkCapabilities>
export type WorkAboutContent = NonNullable<ReturnType<typeof readWorkAbout>>
export type WorkAiContent = ReturnType<typeof readWorkAi>

// ─── Articles Git SoT (Phase 4B) ───────────────────────────────────────────

const articlesDir = () => getSectionDirectory('articles')

const normalizeArticleFrontmatter = (
  data: Record<string, unknown>,
  slug: string,
  body: string,
): ArticleContentItem | null => {
  const title = asString(data.title)
  if (!title) return null

  const fmSlug = asString(data.slug) || slug
  const statusRaw = asString(data.status) || 'draft'
  const status = (['draft', 'published', 'archived'].includes(statusRaw)
    ? statusRaw
    : 'draft') as ArticleFrontmatter['status']

  const legacyRaw = data.legacyId ?? data.legacy_id
  const legacyId = typeof legacyRaw === 'number'
    ? legacyRaw
    : Number(legacyRaw)

  if (!Number.isFinite(legacyId)) return null

  return {
    title,
    slug: fmSlug,
    summary: asString(data.summary) || undefined,
    date: asString(data.date) || undefined,
    publishAt: asString(data.publishAt) || asString(data.publish_at) || undefined,
    status,
    category: asString(data.category) || undefined,
    tags: toArray(data.tags),
    cover: asString(data.cover) || undefined,
    author: asString(data.author) || undefined,
    source: asString(data.source) || undefined,
    seoTitle: asString(data.seoTitle) || asString(data.seo_title) || undefined,
    seoDescription: asString(data.seoDescription) || asString(data.seo_description) || undefined,
    legacyId,
    path: `/blog/${fmSlug}`,
    content: body,
  }
}

export const readArticleTaxonomy = (): ArticleTaxonomy => {
  const filePath = path.join(articlesDir(), ARTICLES_TAXONOMY_FILE)
  if (!fs.existsSync(filePath)) {
    return { categories: [] }
  }
  const parsed = parseYamlSafe(fs.readFileSync(filePath, 'utf8'))
  const categories = Array.isArray((parsed as ArticleTaxonomy)?.categories)
    ? (parsed as ArticleTaxonomy).categories
    : []
  return { categories }
}

export const listArticles = (): ArticleContentItem[] => {
  const dir = articlesDir()
  if (!fs.existsSync(dir)) return []

  return fs
    .readdirSync(dir)
    .filter((file) => file.endsWith('.md'))
    .map((file) => {
      const slug = path.basename(file, '.md')
      if (!isArticleContentSlug(slug)) return null
      try {
        const fullPath = path.join(dir, file)
        const fileContent = fs.readFileSync(fullPath, 'utf-8')
        const match = fileContent.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n([\s\S]*)$/)
        if (!match) return null
        const data = (parseYamlSafe(match[1]) || {}) as Record<string, unknown>
        const content = match[2]
        return normalizeArticleFrontmatter(data, slug, content)
      } catch {
        return null
      }
    })
    .filter((item): item is ArticleContentItem => item !== null)
    .sort((a, b) => {
      const aTime = new Date(a.publishAt || a.date || 0).getTime()
      const bTime = new Date(b.publishAt || b.date || 0).getTime()
      return bTime - aTime
    })
}

export const readArticleBySlug = (slug: unknown): ArticleContentItem | null => {
  if (!isArticleContentSlug(slug)) return null
  return listArticles().find((item) => item.slug === slug) || null
}

