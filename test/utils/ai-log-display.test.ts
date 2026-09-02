import { describe, expect, it } from 'vitest'
import {
  explainAiLogError,
  getAiAgentTypeLabel,
  getAiLogStatusHint,
  summarizeAiLogRequest,
  summarizeAiLogResponse,
} from '~/utils/ai-log-display'

describe('ai-log-display', () => {
  it('maps agent types to Chinese labels', () => {
    expect(getAiAgentTypeLabel('Support')).toBe('客服问答')
    expect(getAiAgentTypeLabel('Content')).toBe('内容生成')
  })

  it('summarizes request prompt', () => {
    const summary = summarizeAiLogRequest(JSON.stringify({ Prompt: '帮我写一段项目介绍' }))
    expect(summary).toContain('帮我写一段项目介绍')
  })

  it('explains 401 errors in Chinese', () => {
    const text = explainAiLogError('Response status code does not indicate success: 401 (Unauthorized).')
    expect(text).toContain('401')
    expect(text).toContain('AI_INTERNAL_TOKEN')
  })

  it('summarizes successful response length', () => {
    const summary = summarizeAiLogResponse({
      success: true,
      responsePayload: JSON.stringify({ Reply: '你好，这是测试回复内容' }),
    })
    expect(summary).toContain('AI 回复约')
  })

  it('detects repeated unauthorized failures', () => {
    const hint = getAiLogStatusHint([
      { success: false, errorMessage: '401 Unauthorized' },
      { success: false, errorMessage: '401 Unauthorized' },
    ])
    expect(hint).toContain('401')
  })
})
