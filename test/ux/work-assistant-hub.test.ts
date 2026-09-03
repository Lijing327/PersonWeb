import { existsSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

const root = resolve(__dirname, '../..')

describe('WorkAssistantHub IA guards', () => {
  it('default and ai layouts mount WorkAssistantHub once and not SupportChat', () => {
    for (const file of ['layouts/default.vue', 'layouts/ai.vue']) {
      const src = readFileSync(resolve(root, file), 'utf8')
      expect(src).toMatch(/WorkAssistantHub/)
      expect(src).not.toMatch(/SupportChat/)
      expect(src.match(/<AIAssistant\b/g) || []).toHaveLength(0)
      expect(src.match(/<VisitorInteractionPanel\b/g) || []).toHaveLength(0)
    }
  })

  it('hub owns AIAssistant + VisitorInteractionPanel with hideLauncher', () => {
    const hub = readFileSync(resolve(root, 'components/work/WorkAssistantHub.vue'), 'utf8')
    expect(hub).toMatch(/hide-launcher/)
    expect(hub).toMatch(/问 AI 助手/)
    expect(hub).toMatch(/联系合作/)
    expect(hub).toMatch(/留个言/)
    expect(hub).toMatch(/\/contact/)
    expect(hub).toMatch(/onAskClick/)
    expect(hub).toMatch(/更多帮助/)
    expect(hub).toMatch(/open-work-ai-assistant/)
    expect(hub).not.toMatch(/defineAsyncComponent/)
    expect((hub.match(/<AIAssistant\b/g) || []).length).toBe(1)
    expect((hub.match(/<VisitorInteractionPanel\b/g) || []).length).toBe(1)
  })

  it('SupportChat front entry is removed', () => {
    expect(existsSync(resolve(root, 'components/ai/SupportChat.vue'))).toBe(false)
  })

  it('work home also mounts the unified hub', () => {
    const work = readFileSync(resolve(root, 'pages/work.vue'), 'utf8')
    expect(work).toMatch(/WorkAssistantHub/)
  })

  it('visitor message modal styles are loaded by the panel', () => {
    const panel = readFileSync(resolve(root, 'components/VisitorInteractionPanel.vue'), 'utf8')
    expect(panel).toMatch(/visitor-interaction\.css/)
    expect(panel).toMatch(/open-work-visitor-message/)
    expect(panel).toMatch(/onOverlayClick/)
  })

  it('AIAssistant always listens for hub open event', () => {
    const assistant = readFileSync(resolve(root, 'components/ai/AIAssistant.vue'), 'utf8')
    expect(assistant).toMatch(/open-work-ai-assistant/)
    expect(assistant).toMatch(/ref="inputEl"/)
  })
})
