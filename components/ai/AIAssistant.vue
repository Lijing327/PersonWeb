<template>
  <ClientOnly>
    <button
      v-if="!hideLauncher && !isOpen"
      :class="['ai-assistant-button', { 'ai-assistant-button-has-prompt': hasUnreadPrompt }]"
      @click="toggleAssistant"
      aria-label="打开 AI 助手"
    >
      <svg class="ai-assistant-button__icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path
          stroke-linecap="round"
          stroke-linejoin="round"
          stroke-width="2"
          d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"
        />
      </svg>
      <span class="ai-assistant-status-dot"></span>
    </button>

    <Transition name="slide-up">
      <div v-if="isOpen" class="ai-assistant-dialog">
        <div class="ai-assistant-header">
          <div class="ai-assistant-header__brand">
            <div class="ai-assistant-avatar" aria-hidden="true">
              <span class="ai-assistant-avatar__ring"></span>
              <svg class="ai-assistant-avatar__icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="1.75"
                  d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
                />
              </svg>
            </div>
            <div class="ai-assistant-header__meta">
              <h3 class="ai-assistant-title">{{ chat.name }}</h3>
              <span class="ai-assistant-status-badge" :class="{ 'is-busy': isLoading }">
                <span class="ai-assistant-status-badge__dot"></span>
                {{ statusText }}
              </span>
            </div>
          </div>
          <button @click="toggleAssistant" class="ai-assistant-close-btn" aria-label="关闭">
            <svg class="ai-assistant-close-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div ref="messagesRef" class="ai-assistant-messages">
          <div v-if="messages.length === 0" class="ai-assistant-welcome">
            <div class="ai-assistant-welcome__card">
              <p class="ai-assistant-welcome__eyebrow">{{ chat.welcome.eyebrow }}</p>
              <p class="ai-assistant-welcome__title">{{ chat.welcome.title }}</p>
              <p class="ai-assistant-welcome__desc">{{ chat.welcome.description }}</p>
            </div>

            <div v-if="!isCompactMode" class="ai-assistant-suggestions">
              <button
                v-for="quickAction in quickActions"
                :key="quickAction.text"
                type="button"
                class="ai-assistant-suggestion"
                :disabled="isLoading"
                @click="sendQuickMessage(quickAction.text)"
              >
                <span class="ai-assistant-suggestion__icon" aria-hidden="true">
                  <svg v-if="quickAction.icon === 'article'" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.75" d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
                  </svg>
                  <svg v-else viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.75" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </span>
                <span class="ai-assistant-suggestion__text">{{ quickAction.text }}</span>
              </button>
            </div>
          </div>

          <div
            v-for="(message, index) in messages"
            :key="index"
            :class="[
              'ai-assistant-msg-row',
              message.role === 'user' ? 'ai-assistant-msg-row--user' : 'ai-assistant-msg-row--assistant'
            ]"
          >
            <div class="ai-assistant-msg-avatar" aria-hidden="true">
              <svg v-if="message.role === 'user'" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.75" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              <svg v-else viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.75" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
            </div>
            <div
              :class="[
                'ai-assistant-msg-bubble',
                message.role === 'user' ? 'ai-assistant-msg-bubble--user' : 'ai-assistant-msg-bubble--assistant'
              ]"
            >
              <p class="ai-assistant-msg-text">{{ message.content }}</p>
              <p v-if="message.role === 'assistant' && message.loading" class="ai-assistant-msg-loading">{{ chat.statusThinking }}</p>
            </div>
          </div>

          <div v-if="isLoading" class="ai-assistant-msg-row ai-assistant-msg-row--assistant">
            <div class="ai-assistant-msg-avatar" aria-hidden="true">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.75" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
            </div>
            <div class="ai-assistant-msg-bubble ai-assistant-msg-bubble--assistant">
              <div class="ai-assistant-loading">
                <span class="ai-assistant-loading-dot"></span>
                <span class="ai-assistant-loading-dot"></span>
                <span class="ai-assistant-loading-dot"></span>
              </div>
            </div>
          </div>
        </div>

        <div class="ai-assistant-footer">
          <div v-if="messages.length > 0 && !isCompactMode" class="ai-assistant-quick-actions">
            <button
              v-for="quickAction in quickActions"
              :key="quickAction.text"
              type="button"
              class="ai-assistant-quick-action-btn"
              :disabled="isLoading"
              @click="sendQuickMessage(quickAction.text)"
            >
              {{ quickAction.text }}
            </button>
          </div>

          <div class="ai-assistant-input-shell">
            <input
              ref="inputEl"
              v-model="inputText"
              type="text"
              placeholder="输入你的问题..."
              class="ai-assistant-input"
              :disabled="isLoading"
              @keyup.enter="sendMessage"
            />
            <button
              type="button"
              class="ai-assistant-send-btn"
              :disabled="isLoading || !inputText.trim()"
              aria-label="发送"
              @click="sendMessage"
            >
              <svg class="ai-assistant-send-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 12h14M12 5l7 7-7 7" />
              </svg>
            </button>
          </div>
          <p class="ai-assistant-footer-hint">
            <button type="button" class="ai-assistant-footer-link" @click="goContact">联系合作</button>
            <span aria-hidden="true">·</span>
            <button type="button" class="ai-assistant-footer-link" @click="leaveMessage">留个言</button>
            <span aria-hidden="true">·</span>
            Enter 发送
          </p>
        </div>
      </div>
    </Transition>
  </ClientOnly>
</template>

<script setup lang="ts">
import { onMounted, onUnmounted, watch } from 'vue'
import { fetchAiSolutionsData } from '~/composables/useAiSolutionsData'

interface Message {
  role: 'user' | 'assistant'
  content: string
  loading?: boolean
}

const props = withDefaults(defineProps<{
  /** 由 WorkAssistantHub 统一入口时隐藏自带悬浮按钮 */
  hideLauncher?: boolean
}>(), {
  hideLauncher: false,
})

void props

const WORK_AI_OPEN_EVENT = 'open-work-ai-assistant'

const isOpen = ref(false)
const inputText = ref('')
const messages = ref<Message[]>([])
const isLoading = ref(false)
const messagesRef = ref<HTMLDivElement | null>(null)
const inputEl = ref<HTMLInputElement | null>(null)
const statusText = ref('在线')
const hasUserClosed = ref(false)
const hasUnreadPrompt = ref(false)
const pendingPromptMessage = ref('')
const isCompactMode = ref(false)

const { data: aiData } = useAsyncData(
  'work-ai-solutions',
  () => fetchAiSolutionsData(),
  { server: false },
)
const chat = computed(() => aiData.value?.assistant.chat || {
  name: 'AI 小智',
  statusOnline: '在线',
  statusThinking: '正在思考...',
  welcome: {
    eyebrow: 'Work 助手',
    title: '你好，我是 AI 小智',
    description: '可以问我站内项目、能力或合作相关的问题。',
  },
  quickActions: [
    { text: '推荐文章', icon: 'article' },
    { text: '搜索文章', icon: 'search' },
  ],
  systemAbout: '',
})

const quickActions = computed(() => chat.value.quickActions)

watch(
  () => chat.value.statusOnline,
  (value) => {
    if (!isLoading.value) statusText.value = value
  },
  { immediate: true },
)

let openAssistantHandler: EventListener | null = null
let workOpenHandler: EventListener | null = null

const scrollToBottom = () => {
  if (messagesRef.value) {
    messagesRef.value.scrollTop = messagesRef.value.scrollHeight
  }
}

const focusInput = () => {
  nextTick(() => {
    scrollToBottom()
    inputEl.value?.focus()
  })
}

const toggleAssistant = () => {
  if (isOpen.value) {
    closeAssistant()
  } else {
    openAssistant()
  }
}

const openAssistant = () => {
  isOpen.value = true

  if (pendingPromptMessage.value) {
    messages.value.push({
      role: 'assistant',
      content: pendingPromptMessage.value
    })
    pendingPromptMessage.value = ''
  }

  hasUnreadPrompt.value = false
  hasUserClosed.value = false

  if (process.client) {
    localStorage.removeItem('ai-assistant-auto-open-disabled')
  }

  focusInput()
}

const closeAssistant = () => {
  isOpen.value = false
  hasUserClosed.value = true
}

const goContact = () => {
  closeAssistant()
  navigateTo('/contact')
}

const leaveMessage = () => {
  closeAssistant()
  if (process.client) {
    window.dispatchEvent(new CustomEvent('open-visitor-message'))
  }
}

defineExpose({
  open: openAssistant,
  close: closeAssistant,
  toggle: toggleAssistant,
  isOpen,
})

const sendQuickMessage = (text: string) => {
  inputText.value = text
  sendMessage()
}

const sendMessage = async () => {
  if (!inputText.value.trim() || isLoading.value) return

  const userMessage = inputText.value.trim()
  inputText.value = ''

  messages.value.push({
    role: 'user',
    content: userMessage
  })

  scrollToBottom()
  isLoading.value = true
  statusText.value = chat.value.statusThinking

  try {
    const api = useApi()
    const response = await api.post<any>('/AI/chat', {
      message: userMessage,
      history: messages.value.slice(-5).map(message => ({
        role: message.role,
        content: message.content
      }))
    })

    messages.value.push({
      role: 'assistant',
      content: response.message || response.content || '抱歉，我暂时无法回答这个问题。'
    })
    statusText.value = chat.value.statusOnline
  } catch (error) {
    console.error('AI Chat error:', error)
    messages.value.push({
      role: 'assistant',
      content: '抱歉，服务暂时不可用，请稍后再试。'
    })
    statusText.value = '离线'
  } finally {
    isLoading.value = false
    nextTick(() => {
      scrollToBottom()
    })
  }
}

onMounted(() => {
  if (!process.client) return

  const coarsePointer = window.matchMedia('(pointer: coarse)').matches
  isCompactMode.value = coarsePointer || window.innerWidth < 768

  workOpenHandler = (() => {
    openAssistant()
  }) as EventListener
  window.addEventListener(WORK_AI_OPEN_EVENT, workOpenHandler)

  if (localStorage.getItem('ai-assistant-auto-open-disabled') === 'true') {
    return
  }

  openAssistantHandler = ((event: Event) => {
    if (hasUserClosed.value) return

    const customEvent = event as CustomEvent<{ message?: string; forceOpen?: boolean }>
    const promptMessage = customEvent.detail?.message

    if (promptMessage) {
      pendingPromptMessage.value = promptMessage
      hasUnreadPrompt.value = true
    }

    if (!isCompactMode.value && customEvent.detail?.forceOpen === true && !isOpen.value) {
      openAssistant()
    }
  }) as EventListener

  window.addEventListener('open-ai-assistant', openAssistantHandler)
})

onUnmounted(() => {
  if (!process.client) return
  if (openAssistantHandler) {
    window.removeEventListener('open-ai-assistant', openAssistantHandler)
  }
  if (workOpenHandler) {
    window.removeEventListener(WORK_AI_OPEN_EVENT, workOpenHandler)
  }
})
</script>

<style scoped>
.ai-assistant-button {
  position: fixed;
  right: var(--floating-dock-right, max(14px, env(safe-area-inset-right)));
  bottom: var(--floating-dock-bottom, 18px);
  z-index: 9990;
  display: flex;
  align-items: center;
  justify-content: center;
  width: var(--floating-dock-button-size, 48px);
  height: var(--floating-dock-button-size, 48px);
  border: 0;
  border-radius: var(--radius-pill);
  color: var(--color-text-on-primary);
  cursor: pointer;
  background:
    radial-gradient(circle at 30% 30%, rgba(255, 255, 255, 0.28) 0%, rgba(255, 255, 255, 0) 42%),
    var(--gradient-primary);
  box-shadow: var(--shadow-glow), 0 0 0 1px rgba(255, 255, 255, 0.16) inset;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
  backdrop-filter: blur(16px);
}

.ai-assistant-button:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-glow-cyan), 0 0 0 1px rgba(255, 255, 255, 0.2) inset;
}

.ai-assistant-button__icon {
  width: 20px;
  height: 20px;
}

.ai-assistant-button-has-prompt::before {
  content: '';
  position: absolute;
  inset: -5px;
  border-radius: inherit;
  border: 1px solid color-mix(in srgb, var(--color-primary) 58%, white);
  opacity: 0.85;
  animation: ai-assistant-pulse 2s ease-in-out infinite;
}

.ai-assistant-status-dot {
  position: absolute;
  top: 2px;
  right: 2px;
  width: 10px;
  height: 10px;
  border-radius: var(--radius-pill);
  border: 2px solid var(--color-text-on-primary);
  background: var(--color-success);
}

.ai-assistant-dialog {
  position: fixed;
  right: var(--floating-dock-right, max(14px, env(safe-area-inset-right)));
  bottom: calc(
    var(--floating-dock-bottom, 18px)
    + 3.4rem
    + 12px
  );
  z-index: 9990;
  display: flex;
  flex-direction: column;
  width: min(380px, calc(100vw - 28px));
  height: min(560px, calc(100vh - 100px));
  overflow: hidden;
  border-radius: var(--radius-lg);
  border: 1px solid var(--site-shell-border-soft);
  background: var(--site-shell-gradient);
  box-shadow: var(--shadow-card), var(--shadow-glow);
}

.ai-assistant-header {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 16px 16px 14px;
  border-bottom: 1px solid var(--color-border);
  background:
    linear-gradient(180deg, rgba(59, 130, 246, 0.14) 0%, rgba(59, 130, 246, 0) 100%),
    rgba(8, 21, 49, 0.55);
}

.ai-assistant-header__brand {
  display: flex;
  align-items: center;
  gap: 12px;
  min-width: 0;
}

.ai-assistant-avatar {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 42px;
  height: 42px;
  border-radius: var(--radius-pill);
  background: var(--color-surface-strong);
  color: var(--color-cyan);
  flex-shrink: 0;
}

.ai-assistant-avatar__ring {
  position: absolute;
  inset: -2px;
  border-radius: inherit;
  background: var(--gradient-primary);
  opacity: 0.85;
}

.ai-assistant-avatar__icon {
  position: relative;
  z-index: 1;
  width: 20px;
  height: 20px;
}

.ai-assistant-header__meta {
  min-width: 0;
}

.ai-assistant-title {
  margin: 0 0 4px;
  font-size: 0.95rem;
  font-weight: 700;
  color: var(--color-text);
  letter-spacing: 0.01em;
}

.ai-assistant-status-badge {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 2px 8px;
  border-radius: var(--radius-pill);
  background: rgba(34, 197, 94, 0.12);
  border: 1px solid rgba(34, 197, 94, 0.28);
  color: color-mix(in srgb, var(--color-success) 82%, white);
  font-size: 0.72rem;
  line-height: 1.4;
}

.ai-assistant-status-badge.is-busy {
  background: rgba(59, 130, 246, 0.12);
  border-color: rgba(59, 130, 246, 0.28);
  color: var(--color-primary-hover);
}

.ai-assistant-status-badge__dot {
  width: 6px;
  height: 6px;
  border-radius: var(--radius-pill);
  background: currentColor;
}

.ai-assistant-close-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  background: rgba(15, 23, 42, 0.35);
  color: var(--color-text-muted);
  cursor: pointer;
  transition: color 0.2s ease, border-color 0.2s ease, background 0.2s ease;
}

.ai-assistant-close-btn:hover {
  color: var(--color-text);
  border-color: var(--color-border-strong);
  background: rgba(15, 23, 42, 0.55);
}

.ai-assistant-close-icon {
  width: 16px;
  height: 16px;
}

.ai-assistant-messages {
  position: relative;
  flex: 1;
  overflow-y: auto;
  padding: 16px;
  background:
    radial-gradient(circle at 80% 0%, rgba(59, 130, 246, 0.08), transparent 42%),
    radial-gradient(circle at 10% 100%, rgba(139, 92, 246, 0.06), transparent 38%),
    rgba(7, 11, 20, 0.35);
}

.ai-assistant-messages::before {
  content: '';
  position: absolute;
  inset: 0;
  pointer-events: none;
  opacity: 0.35;
  background-image:
    linear-gradient(rgba(148, 163, 184, 0.06) 1px, transparent 1px),
    linear-gradient(90deg, rgba(148, 163, 184, 0.06) 1px, transparent 1px);
  background-size: 24px 24px;
  mask-image: linear-gradient(180deg, rgba(0, 0, 0, 0.85), transparent 95%);
}

.ai-assistant-welcome {
  position: relative;
  z-index: 1;
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.ai-assistant-welcome__card {
  padding: 16px;
  border-radius: var(--radius-md);
  border: 1px solid var(--site-shell-border-soft);
  background: linear-gradient(145deg, rgba(20, 30, 55, 0.92), rgba(15, 23, 42, 0.72));
  box-shadow: var(--shadow-glow);
}

.ai-assistant-welcome__eyebrow {
  margin: 0 0 6px;
  font-size: 0.72rem;
  font-weight: 600;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--color-cyan);
}

.ai-assistant-welcome__title {
  margin: 0 0 8px;
  font-size: 1.05rem;
  font-weight: 700;
  color: var(--color-text);
}

.ai-assistant-welcome__desc {
  margin: 0;
  font-size: 0.875rem;
  line-height: 1.65;
  color: var(--color-text-muted);
}

.ai-assistant-suggestions {
  display: grid;
  gap: 8px;
}

.ai-assistant-suggestion {
  display: flex;
  align-items: center;
  gap: 10px;
  width: 100%;
  padding: 12px 14px;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  background: rgba(15, 23, 42, 0.55);
  color: var(--color-text);
  text-align: left;
  cursor: pointer;
  transition: border-color 0.2s ease, background 0.2s ease, transform 0.2s ease;
}

.ai-assistant-suggestion:hover:not(:disabled) {
  border-color: var(--color-border-focus);
  background: rgba(20, 30, 55, 0.82);
  transform: translateY(-1px);
}

.ai-assistant-suggestion:disabled {
  opacity: 0.55;
  cursor: not-allowed;
}

.ai-assistant-suggestion__icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border-radius: var(--radius-sm);
  background: rgba(59, 130, 246, 0.14);
  color: var(--color-primary-hover);
  flex-shrink: 0;
}

.ai-assistant-suggestion__icon svg {
  width: 16px;
  height: 16px;
}

.ai-assistant-suggestion__text {
  font-size: 0.875rem;
  font-weight: 500;
}

.ai-assistant-msg-row {
  position: relative;
  z-index: 1;
  display: flex;
  gap: 10px;
  margin-bottom: 14px;
  animation: ai-assistant-fade-in 0.28s ease;
}

.ai-assistant-msg-row--user {
  flex-direction: row-reverse;
}

.ai-assistant-msg-avatar {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border-radius: var(--radius-pill);
  flex-shrink: 0;
  color: var(--color-text-muted);
  background: rgba(15, 23, 42, 0.72);
  border: 1px solid var(--color-border);
}

.ai-assistant-msg-row--user .ai-assistant-msg-avatar {
  color: var(--color-text-on-primary);
  background: var(--gradient-primary);
  border-color: transparent;
}

.ai-assistant-msg-avatar svg {
  width: 16px;
  height: 16px;
}

.ai-assistant-msg-bubble {
  max-width: calc(100% - 44px);
  padding: 10px 14px;
  border-radius: var(--radius-md);
}

.ai-assistant-msg-bubble--user {
  background: var(--gradient-primary);
  color: var(--color-text-on-primary);
  border-bottom-right-radius: 6px;
  box-shadow: var(--shadow-glow);
}

.ai-assistant-msg-bubble--assistant {
  background: var(--color-surface-strong);
  color: var(--color-text);
  border: 1px solid var(--color-border);
  border-bottom-left-radius: 6px;
}

.ai-assistant-msg-text,
.ai-assistant-msg-loading {
  margin: 0;
  white-space: pre-wrap;
  word-break: break-word;
}

.ai-assistant-msg-text {
  font-size: 0.875rem;
  line-height: 1.65;
}

.ai-assistant-msg-loading {
  margin-top: 6px;
  font-size: 0.75rem;
  color: var(--color-text-muted);
}

.ai-assistant-loading {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 2px 0;
}

.ai-assistant-loading-dot {
  width: 7px;
  height: 7px;
  border-radius: var(--radius-pill);
  background: var(--color-text-muted);
  animation: ai-assistant-bounce 1.2s infinite;
}

.ai-assistant-loading-dot:nth-child(2) {
  animation-delay: 0.15s;
}

.ai-assistant-loading-dot:nth-child(3) {
  animation-delay: 0.3s;
}

.ai-assistant-footer {
  padding: 12px 14px 14px;
  border-top: 1px solid var(--color-border);
  background: rgba(8, 21, 49, 0.72);
}

.ai-assistant-quick-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 10px;
}

.ai-assistant-quick-action-btn {
  padding: 6px 12px;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-pill);
  background: rgba(15, 23, 42, 0.55);
  color: var(--color-text-muted);
  font-size: 0.75rem;
  cursor: pointer;
  transition: color 0.2s ease, border-color 0.2s ease, background 0.2s ease;
}

.ai-assistant-quick-action-btn:hover:not(:disabled) {
  color: var(--color-text);
  border-color: var(--color-border-focus);
  background: rgba(20, 30, 55, 0.82);
}

.ai-assistant-quick-action-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.ai-assistant-input-shell {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 6px 6px 14px;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-pill);
  background: rgba(7, 11, 20, 0.72);
  transition: border-color 0.2s ease, box-shadow 0.2s ease;
}

.ai-assistant-input-shell:focus-within {
  border-color: var(--color-border-focus);
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.12);
}

.ai-assistant-input {
  flex: 1;
  min-width: 0;
  padding: 8px 0;
  border: 0;
  background: transparent;
  color: var(--color-text);
  font-size: 0.875rem;
}

.ai-assistant-input::placeholder {
  color: var(--color-text-subtle);
}

.ai-assistant-input:focus {
  outline: none;
}

.ai-assistant-input:disabled {
  opacity: 0.6;
}

.ai-assistant-send-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  border: 0;
  border-radius: var(--radius-pill);
  background: var(--gradient-primary);
  color: var(--color-text-on-primary);
  cursor: pointer;
  transition: transform 0.2s ease, opacity 0.2s ease;
  flex-shrink: 0;
}

.ai-assistant-send-btn:hover:not(:disabled) {
  transform: scale(1.04);
}

.ai-assistant-send-btn:disabled {
  opacity: 0.45;
  cursor: not-allowed;
}

.ai-assistant-send-icon {
  width: 16px;
  height: 16px;
}

.ai-assistant-footer-hint {
  margin: 8px 4px 0;
  font-size: 0.68rem;
  color: var(--color-text-subtle);
  text-align: center;
}

.ai-assistant-footer-link {
  padding: 0;
  border: 0;
  background: transparent;
  color: var(--color-text-muted);
  font: inherit;
  font-size: inherit;
  cursor: pointer;
}

.ai-assistant-footer-link:hover {
  color: var(--color-text);
}

.slide-up-enter-active,
.slide-up-leave-active {
  transition: opacity 0.24s ease, transform 0.24s ease;
}

.slide-up-enter-from,
.slide-up-leave-to {
  opacity: 0;
  transform: translateY(16px) scale(0.97);
}

@keyframes ai-assistant-bounce {
  0%,
  80%,
  100% {
    transform: translateY(0);
    opacity: 0.45;
  }

  40% {
    transform: translateY(-4px);
    opacity: 1;
  }
}

@keyframes ai-assistant-fade-in {
  from {
    opacity: 0;
    transform: translateY(8px);
  }

  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes ai-assistant-pulse {
  0%,
  100% {
    opacity: 0.55;
  }

  50% {
    opacity: 1;
  }
}

@media (max-width: 768px) {
  .ai-assistant-button {
    right: var(--floating-dock-right, max(12px, env(safe-area-inset-right)));
    bottom: var(--floating-dock-bottom, 12px);
  }

  .ai-assistant-dialog {
    left: 12px;
    right: 12px;
    width: auto;
    bottom: calc(
      var(--floating-dock-bottom, 12px)
      + 3.2rem
      + 10px
    );
    height: min(72vh, 520px);
    border-radius: var(--radius-md);
  }

  .ai-assistant-msg-bubble {
    max-width: calc(100% - 40px);
  }
}
</style>
