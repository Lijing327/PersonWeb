import { existsSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'
import { isSafeContentSlug } from '../../constants/life-content'
import {
  readWorkAbout,
  readWorkAi,
  readWorkCapabilities,
  readWorkContact,
  readWorkHome,
  resolveContentRoot,
} from '../../server/utils/content-files'

const root = resolve(__dirname, '../..')

const readSrc = (relativePath: string) =>
  readFileSync(resolve(root, relativePath), 'utf8')

describe('Work content SoT files', () => {
  it('requires content/work core files', () => {
    for (const name of ['home.yml', 'about.md', 'ai.yml', 'capabilities.yml', 'contact.yml']) {
      expect(existsSync(resolve(root, 'content/work', name))).toBe(true)
    }
  })

  it('does not mix Life reserved files into work dir as notes', () => {
    expect(existsSync(resolve(root, 'content/work/profile.md'))).toBe(false)
    expect(existsSync(resolve(root, 'content/life/home.yml'))).toBe(true)
  })
})

describe('Work content readers', () => {
  it('reads Work home hero from YAML', () => {
    const home = readWorkHome()
    expect(home.hero.title).toBe('溪午听风')
    expect(home.hero.value.length).toBeGreaterThan(0)
    expect(home.panel.focus.length).toBeGreaterThan(0)
    expect(home.sections.featured.title).toBeTruthy()
    expect(home.contact.rows.some(row => row.label === 'Email')).toBe(true)
    expect(home.hero.links.some(link => link.label === 'GitHub')).toBe(true)
  })

  it('reads contact.yml as Work contact SoT', () => {
    const contact = readWorkContact()
    expect(contact.email).toBe('linxiwanting@gmail.com')
    expect(contact.github.url).toContain('github.com')
    expect(contact.cooperationTitle).toBe('联系合作')
    expect(contact.cooperationChips.length).toBeGreaterThan(0)
    expect(contact.rows.length).toBeGreaterThanOrEqual(2)
  })

  it('reads capabilities shared SoT', () => {
    const caps = readWorkCapabilities()
    expect(caps.areas.map(a => a.title)).toEqual(
      expect.arrayContaining(['产品', 'AI 应用', '工程实现', '交付上线']),
    )
  })

  it('reads about.md and injects contact socials from contact.yml', () => {
    const about = readWorkAbout()
    expect(about).not.toBeNull()
    expect(about!.title).toBe('溪午听风')
    expect(about!.focus.items.length).toBeGreaterThan(0)
    expect(about!.path.steps.length).toBeGreaterThan(0)
    expect(about!.socials.some(s => s.name === 'GitHub')).toBe(true)
    expect(about!.featuredProjects.heading).toBe('代表性项目')
  })

  it('reads ai.yml solutions + assistant copy from one SoT', () => {
    const ai = readWorkAi()
    expect(ai.title.length).toBeGreaterThan(0)
    expect(ai.scenarios.length).toBeGreaterThan(0)
    expect(ai.assistant.chat.name).toBeTruthy()
    expect(ai.assistant.chat.quickActions.length).toBeGreaterThan(0)
    expect(ai.assistant.hub.items.length).toBeGreaterThan(0)
    expect(ai.assistant.chat.systemAbout.length).toBeGreaterThan(0)
  })
})

describe('Work content boundary guards', () => {
  it('keeps slug safety shared with Life', () => {
    expect(isSafeContentSlug('../work/secret')).toBe(false)
    expect(isSafeContentSlug('about')).toBe(true)
  })

  it('does not resurrect hardcoded AI solutions composable payload', () => {
    const src = readSrc('composables/useAiSolutionsData.ts')
    expect(src).toMatch(/fetchAiSolutionsData/)
    expect(src).not.toMatch(/把 AI 从想法，做成真正可用的产品/)
  })

  it('work page no longer hardcodes hero value proposition', () => {
    const src = readSrc('pages/work.vue')
    expect(src).toMatch(/\/api\/content\/work\/home/)
    expect(src).not.toMatch(/专业工作名片：我是谁、能做什么、做过什么/)
  })

  it('about page reads Work about API and drops legacy blocks', () => {
    const src = readSrc('pages/about.vue')
    expect(src).toMatch(/\/api\/content\/work\/about/)
    expect(src).not.toMatch(/legacyStats/)
    expect(src).not.toMatch(/legacyProjects/)
    expect(src).toMatch(/useHomeOverview/)
    expect(src).not.toMatch(/about-stats/)
  })

  it('home.yml does not duplicate contact email/github literals', () => {
    const src = readSrc('content/work/home.yml')
    expect(src).not.toMatch(/linxiwanting@gmail.com/)
    expect(src).not.toMatch(/github\.com\/Lijing327/)
  })

  it('AIController uses WorkContentService instead of hardcoded identity', () => {
    const src = readSrc('backend/PersonalSite.Api/Controllers/AIController.cs')
    expect(src).toMatch(/IWorkContentService/)
    expect(src).toMatch(/GetSystemAbout/)
    expect(src).not.toMatch(/Revit插件专家/)
    expect(src).not.toMatch(/全栈开发者、AI应用探索者/)
  })

  it('Work contact consumers read contact API or merged reader', () => {
    const footer = readSrc('components/layout/Footer.vue')
    const contactPage = readSrc('pages/contact.vue')
    expect(footer).toMatch(/\/api\/content\/work\/contact/)
    expect(footer).not.toMatch(/linxiwanting@gmail.com/)
    expect(contactPage).toMatch(/\/api\/content\/work\/contact/)
    expect(contactPage).not.toMatch(/这里是独立的合作入口/)
  })

  it('backend syncs ai.yml from content/work on build', () => {
    const csproj = readSrc('backend/PersonalSite.Api/PersonalSite.Api.csproj')
    expect(csproj).toMatch(/content\\work\\ai\.yml/)
    expect(csproj).toMatch(/content-sync\\work\\ai\.yml/)
  })

  it('Life boundary unchanged', () => {
    expect(existsSync(resolve(root, 'content/life/home.yml'))).toBe(true)
    expect(existsSync(resolve(root, 'server/api/content/life/home.get.ts'))).toBe(true)
    const lifeHome = readFileSync(resolve(root, 'content/life/home.yml'), 'utf8')
    expect(lifeHome).toMatch(/溪午听风/)
    expect(readSrc('content/work/home.yml')).not.toMatch(/最近在/)
  })

  it('resolveContentRoot finds repo content when cwd is .output (nuxt preview)', () => {
    const outputDir = resolve(root, '.output')
    if (!existsSync(outputDir)) {
      return
    }
    const original = process.cwd()
    try {
      process.chdir(outputDir)
      expect(resolveContentRoot()).toBe(resolve(root, 'content'))
      expect(readWorkAbout()?.title).toBe('溪午听风')
    } finally {
      process.chdir(original)
    }
  })
})
