export type AiLogRecord = {
  id?: number
  agentType?: string
  requestPayload?: string | null
  responsePayload?: string | null
  success?: boolean
  errorMessage?: string | null
  createdAt?: string
}

const AGENT_TYPE_LABELS: Record<string, string> = {
  Content: '内容生成',
  Demo: 'Demo 上架',
  Lead: '线索处理',
  Support: '客服问答',
  Assistant: '个人助手',
  Quotation: '报价助手',
}

export function getAiAgentTypeLabel(agentType?: string | null): string {
  if (!agentType) return '未知类型'
  return AGENT_TYPE_LABELS[agentType] || agentType
}

function tryParseJson(raw?: string | null): Record<string, unknown> | null {
  if (!raw) return null
  try {
    const parsed = JSON.parse(raw)
    return parsed && typeof parsed === 'object' ? parsed as Record<string, unknown> : null
  } catch {
    return null
  }
}

function truncate(text: string, max = 80): string {
  const trimmed = text.trim()
  if (trimmed.length <= max) return trimmed
  return `${trimmed.slice(0, max)}…`
}

/** 从请求 JSON 提取一句人话摘要 */
export function summarizeAiLogRequest(requestPayload?: string | null): string {
  const data = tryParseJson(requestPayload)
  if (!data) return '无请求详情'

  const prompt = typeof data.Prompt === 'string' ? data.Prompt : typeof data.prompt === 'string' ? data.prompt : ''
  if (prompt) {
    return `请求：${truncate(prompt.replace(/\s+/g, ' '))}`
  }

  const question = typeof data.Question === 'string' ? data.Question : typeof data.question === 'string' ? data.question : ''
  if (question) {
    return `问题：${truncate(question.replace(/\s+/g, ' '))}`
  }

  return '已记录请求参数（展开可看详情）'
}

/** 从响应 JSON 提取一句人话摘要 */
export function summarizeAiLogResponse(log: AiLogRecord): string {
  if (!log.success) {
    return explainAiLogError(log.errorMessage)
  }

  const data = tryParseJson(log.responsePayload)
  if (!data) return '调用成功'

  const reply = typeof data.Reply === 'string' ? data.Reply : typeof data.reply === 'string' ? data.reply : ''
  if (reply) {
    return `AI 回复约 ${reply.length} 字`
  }

  return '调用成功'
}

/** 把常见英文/技术错误翻译成可操作的中文说明 */
export function explainAiLogError(errorMessage?: string | null): string {
  if (!errorMessage?.trim()) {
    return '调用失败，原因未记录'
  }

  const msg = errorMessage.trim()

  if (/401|Unauthorized/i.test(msg)) {
    return 'AI 服务鉴权失败（401）：请检查 Python ai-service 是否已启动，且 AI_INTERNAL_TOKEN 与 .NET 后端 appsettings 中 AiService:InternalToken 是否一致'
  }

  if (/403|Forbidden/i.test(msg)) {
    return 'AI 服务拒绝访问（403）：InternalToken 无效或权限不足'
  }

  if (/404|Not Found/i.test(msg)) {
    return 'AI 服务接口不存在（404）：请确认 ai-service 地址配置正确（AiService:BaseUrl）'
  }

  if (/timeout|timed out|TaskCanceled/i.test(msg)) {
    return 'AI 服务响应超时：请检查 ai-service 是否卡住，或调大 AiService:TimeoutSeconds'
  }

  if (/Connection refused|No connection|actively refused|ECONNREFUSED/i.test(msg)) {
    return '无法连接 AI 服务：请先启动 ai-service（默认 http://localhost:8001）'
  }

  if (/502|503|504|Bad Gateway|Service Unavailable/i.test(msg)) {
    return 'AI 服务暂时不可用：上游模型或 ai-service 可能未就绪'
  }

  if (/API key|api_key|invalid key/i.test(msg)) {
    return '模型 API Key 无效：请在 ai-service 的 .env 中配置正确的模型密钥'
  }

  return `调用失败：${msg}`
}

export function getAiLogStatusHint(logs: AiLogRecord[]): string | null {
  const recentFailures = logs.filter(log => !log.success).slice(0, 5)
  if (recentFailures.length === 0) return null

  const unauthorized = recentFailures.filter(log => /401|Unauthorized/i.test(log.errorMessage || ''))
  if (unauthorized.length >= 2) {
    return '最近多条失败都是 401：通常是 ai-service 未启动，或 InternalToken 与后端配置不一致。'
  }

  const connectionIssues = recentFailures.filter(log =>
    /Connection refused|ECONNREFUSED|No connection/i.test(log.errorMessage || ''),
  )
  if (connectionIssues.length >= 2) {
    return '最近多条失败都是连接错误：请先在 ai-service 目录运行 uvicorn app.main:app --reload'
  }

  return null
}
