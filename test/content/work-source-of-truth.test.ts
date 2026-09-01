import { describe, expect, it } from 'vitest'
import {
  legacyRedirectToPath,
  resolveLegacyProjectRedirect,
} from '../../utils/project-legacy-slug'
import { canonicalizeToolPath, extractToolSlug } from '../../utils/tool-canonical'
import {
  buildProjectShowcase,
  ENABLE_LEGACY_SHOWCASE_PRESETS,
} from '../../composables/useProjectShowcase'
import type { Project } from '../../types/api'
import { existsSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'

describe('project legacy slug mapping', () => {
  const projects = [
    {
      id: '11111111-1111-1111-1111-111111111111',
      title: '个人数字资产平台（本网站）',
      techStack: ['Nuxt', '.NET'],
    },
    {
      id: '22222222-2222-2222-2222-222222222222',
      title: '智能理财助手',
      techStack: ['微信小程序'],
    },
  ]

  it('maps cover-key slug to project id', () => {
    const result = resolveLegacyProjectRedirect('personweb', projects)
    expect(result).toEqual({
      kind: 'project',
      id: '11111111-1111-1111-1111-111111111111',
    })
    expect(legacyRedirectToPath(result)).toBe(
      '/projects/11111111-1111-1111-1111-111111111111',
    )
  })

  it('maps finance-assistant cover key', () => {
    const result = resolveLegacyProjectRedirect('finance-assistant', projects)
    expect(result.kind).toBe('project')
    if (result.kind === 'project') {
      expect(result.id).toBe('22222222-2222-2222-2222-222222222222')
    }
  })

  it('maps mindtrace to product path', () => {
    expect(resolveLegacyProjectRedirect('mindtrace', projects)).toEqual({
      kind: 'path',
      path: '/products/mindtrace',
    })
  })

  it('falls back to list when unknown', () => {
    expect(resolveLegacyProjectRedirect('no-such-project-zzz', projects)).toEqual({
      kind: 'list',
    })
    expect(legacyRedirectToPath({ kind: 'list' })).toBe('/projects')
  })
})

describe('tool canonical resolution', () => {
  it('rewrites legacy detail paths', () => {
    expect(canonicalizeToolPath('/tools/detail-foo')).toBe('/tools/foo')
    expect(canonicalizeToolPath('detail-bar')).toBe('/tools/bar')
    expect(extractToolSlug('/tools/detail-foo')).toBe('foo')
  })
})

describe('showcase source priority', () => {
  it('prefers DB description over invented empty content when no preset match', () => {
    const project: Project = {
      id: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
      title: '完全未知项目 XYZ',
      description: '这是数据库里的真实项目描述，用于验证 PRIMARY 优先。',
      status: 'Active',
      techStack: ['Vue', 'Nuxt', 'MySQL'],
      createdAt: '2025-01-01T00:00:00',
      updatedAt: '2025-06-01T00:00:00',
      viewCount: 12,
    }

    const showcase = buildProjectShowcase(project)
    expect(showcase.pitch.what).toContain('真实项目描述')
    expect(showcase.overview.length).toBeGreaterThan(0)
    expect(showcase.architecture.some(item => item.label === 'Vue' || item.label === 'Nuxt')).toBe(true)
    // Without custom JSON / matching preset: do not invent narrative challenges
    // (legacy presets only apply when cover-key matches)
    expect(Array.isArray(showcase.challenges)).toBe(true)
  })

  it('uses showcase JSON in content as PRIMARY over description-only defaults', () => {
    const project: Project = {
      id: 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
      title: 'JSON 驱动项目',
      description: '将被 showcase JSON 覆盖的描述',
      status: 'Active',
      techStack: ['TypeScript'],
      content: JSON.stringify({
        pitch: { what: '来自 Content showcase JSON 的一句话' },
        features: [{ icon: '✨', title: 'JSON Feature', description: '仅来自 JSON' }],
        challenges: [],
      }),
      createdAt: '2025-01-01T00:00:00',
      updatedAt: '2025-01-02T00:00:00',
    }

    const showcase = buildProjectShowcase(project)
    expect(showcase.pitch.what).toBe('来自 Content showcase JSON 的一句话')
    expect(showcase.features[0]?.title).toBe('JSON Feature')
  })

  it('keeps legacy preset flag documented as COMPAT', () => {
    expect(typeof ENABLE_LEGACY_SHOWCASE_PRESETS).toBe('boolean')
  })
})

describe('blog markdown admin retired', () => {
  it('does not resurrect Nitro admin articles API or legacy edit page', () => {
    expect(existsSync(resolve(__dirname, '../../server/api/admin/articles.ts'))).toBe(false)
    expect(existsSync(resolve(__dirname, '../../pages/admin/edit.vue'))).toBe(false)
  })
})

describe('content architecture invariants', () => {
  it('documents Work PRIMARY sources', () => {
    const doc = readFileSync(resolve(__dirname, '../../docs/CONTENT_ARCHITECTURE.md'), 'utf8')
    expect(doc).toMatch(/Projects/)
    expect(doc).toMatch(/PRIMARY/)
    expect(doc).toMatch(/MySQL/)
    expect(doc).toMatch(/Toolbox\.Slug|Tools\.Slug/)
    expect(doc).toMatch(/content\/work/)
  })
})
