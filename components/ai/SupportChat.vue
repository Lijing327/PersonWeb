<template>
  <ClientOnly>
    <div class="support-chat-container">
      <button
        v-if="!showChat"
        class="support-chat-button"
        type="button"
        aria-label="打开智能客服"
        @click="openChat"
      >
        <i class="fas fa-comments"></i>
        <span class="button-text">智能客服</span>
      </button>

      <n-drawer
        v-model:show="showChat"
        :width="400"
        placement="right"
        :mask-closable="true"
        :z-index="10002"
        class="support-chat-drawer"
      >
        <template #header>
          <div class="chat-header">
            <div class="header-info">
              <h3 class="header-title">智能客服</h3>
              <p class="header-subtitle">咨询服务、项目开发和工具使用问题</p>
            </div>
            <n-button text size="small" @click="closeChat">
              <template #icon>
                <i class="fas fa-times"></i>
              </template>
            </n-button>
          </div>
        </template>

        <div class="chat-content">
          <div ref="messagesContainer" class="messages-list">
            <div
              v-for="(chatMessage, index) in messages"
              :key="index"
              class="message-item"
              :class="{
                'message-user': chatMessage.role === 'user',
                'message-assistant': chatMessage.role === 'assistant'
              }"
            >
              <div class="message-avatar">
                <i v-if="chatMessage.role === 'user'" class="fas fa-user"></i>
                <i v-else class="fas fa-robot"></i>
              </div>
              <div class="message-content">
                <div class="message-text" v-html="formatMessage(chatMessage.content)"></div>
                <div v-if="chatMessage.relatedLinks?.length" class="message-links">
                  <div
                    v-for="(link, linkIndex) in chatMessage.relatedLinks"
                    :key="linkIndex"
                    class="link-item"
                  >
                    <component
                      :is="getLinkComponent(parseLink(link))"
                      v-bind="getLinkProps(parseLink(link))"
                      class="link-text"
                    >
                      <i class="fas fa-link"></i>
                      {{ getLinkText(link) }}
                    </component>
                  </div>
                </div>
                <div v-if="chatMessage.needHuman" class="message-human-tip">
                  <i class="fas fa-exclamation-circle"></i>
                  建议转人工继续沟通
                </div>
              </div>
            </div>

            <div v-if="loading" class="message-item message-assistant">
              <div class="message-avatar">
                <i class="fas fa-robot"></i>
              </div>
              <div class="message-content">
                <div class="message-text message-loading">
                  <n-spin size="small" />
                  <span>正在思考...</span>
                </div>
              </div>
            </div>
          </div>

          <div class="chat-input-area">
            <n-input
              v-model:value="inputMessage"
              type="textarea"
              :rows="2"
              placeholder="输入你的问题..."
              @keydown.enter.ctrl="sendMessage"
              @keydown.enter.exact.prevent="sendMessage"
            />
            <div class="input-actions">
              <span class="input-hint">Enter 发送，Ctrl + Enter 换行</span>
              <n-button
                type="primary"
                :loading="loading"
                :disabled="!inputMessage.trim()"
                @click="sendMessage"
              >
                <template #icon>
                  <i class="fas fa-paper-plane"></i>
                </template>
                发送
              </n-button>
            </div>
          </div>
        </div>
      </n-drawer>
    </div>
  </ClientOnly>
</template>

<script setup lang="ts">
import { nextTick, ref, watch } from 'vue'
import { NButton, NDrawer, NInput, NSpin } from 'naive-ui'
import { useMarkdown } from '~/composables/useMarkdown'

type ChatMessage = {
  role: 'user' | 'assistant'
  content: string
  relatedLinks?: string[]
  needHuman?: boolean
}

const api = useApi()
const route = useRoute()
const message = useSafeMessage()
const { parse: markdownToHtml } = useMarkdown()

const showChat = ref(false)
const inputMessage = ref('')
const loading = ref(false)
const messages = ref<ChatMessage[]>([])
const messagesContainer = ref<HTMLElement | null>(null)

const openChat = async () => {
  showChat.value = true
  addWelcomeMessage()
  await nextTick()
  scrollToBottom()
}

const closeChat = () => {
  showChat.value = false
}

const addWelcomeMessage = () => {
  if (messages.value.length > 0) return

  messages.value.push({
    role: 'assistant',
    content: '你好，我是智能客服，可以帮助你了解服务内容、项目开发与工具使用。'
  })
}

const sendMessage = async () => {
  if (!inputMessage.value.trim() || loading.value) return

  const userMessage = inputMessage.value.trim()
  inputMessage.value = ''

  messages.value.push({
    role: 'user',
    content: userMessage
  })

  await nextTick()
  scrollToBottom()

  loading.value = true

  try {
    const res = await api.post('/ai/support/answer', {
      question: userMessage,
      category: 'general',
      pageContext: getPageContext(),
      userMeta: getUserMeta()
    })

    const answer = res?.answer || res?.Answer || res?.content || ''
    const success = res?.success !== undefined ? res.success : res?.Success !== undefined ? res.Success : true

    if (success && answer) {
      messages.value.push({
        role: 'assistant',
        content: answer,
        relatedLinks: res?.relatedLinks || res?.RelatedLinks || [],
        needHuman: res?.needHuman || res?.NeedHuman || false
      })
    } else {
      message.error(res?.message || res?.Message || '获取回答失败，请稍后重试')
      messages.value.push({
        role: 'assistant',
        content: '抱歉，我暂时无法回答这个问题，请稍后再试或直接联系人工。'
      })
    }
  } catch (error) {
    if (process.dev) {
      console.error('Support chat send failed', error)
    }

    message.error('发送失败，请稍后重试')
    messages.value.push({
      role: 'assistant',
      content: '抱歉，服务暂时不可用，请稍后再试。'
    })
  } finally {
    loading.value = false
    await nextTick()
    scrollToBottom()
  }
}

const getPageContext = (): string => {
  const path = route.path
  if (path.startsWith('/projects')) return '项目展示页'
  if (path.startsWith('/tools')) return '工具页'
  if (path.startsWith('/blog')) return '博客页'
  return '首页'
}

const getUserMeta = (): string => {
  return '站点访客'
}

const formatMessage = (content: string): string => markdownToHtml(content)

const parseLink = (link: string): string => {
  const parts = link.split('|')
  return parts.length > 1 ? parts[1] : link
}

const isExternalLikeLink = (url: string): boolean => {
  return /^(https?:)?\/\//i.test(url) || /^(mailto:|tel:)/i.test(url) || url.startsWith('/api/')
}

const getLinkComponent = (url: string) => {
  return url.startsWith('/') && !isExternalLikeLink(url) ? 'NuxtLink' : 'a'
}

const getLinkProps = (url: string) => {
  if (url.startsWith('/') && !isExternalLikeLink(url)) {
    return { to: url }
  }

  return {
    href: url,
    target: '_blank',
    rel: 'noopener noreferrer'
  }
}

const getLinkText = (link: string): string => {
  const parts = link.split('|')
  return parts.length > 1 ? parts[0] : link
}

const scrollToBottom = () => {
  if (!messagesContainer.value) return
  messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight
}

watch(() => messages.value.length, async () => {
  await nextTick()
  scrollToBottom()
})
</script>

<style scoped>
.support-chat-container {
  position: fixed;
  bottom: calc(
    var(--floating-dock-bottom, 18px)
    + var(--floating-dock-button-size, 52px)
    + var(--floating-dock-gap, 14px)
  );
  right: var(--floating-dock-right, 24px);
  z-index: 10001 !important;
  pointer-events: auto !important;
}

.support-chat-drawer,
.support-chat-container :deep(.n-drawer),
.support-chat-container :deep(.n-drawer-container) {
  z-index: 10002 !important;
}

.support-chat-container :deep(.n-drawer-mask) {
  z-index: 10001 !important;
  position: fixed !important;
  inset: 0 !important;
}

.support-chat-button {
  display: flex;
  align-items: center;
  justify-content: center;
  width: var(--floating-dock-button-size, 52px);
  height: var(--floating-dock-button-size, 52px);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 9999px;
  color: white;
  cursor: pointer;
  background:
    radial-gradient(circle at 32% 28%, rgba(255, 255, 255, 0.22) 0%, rgba(255, 255, 255, 0) 44%),
    linear-gradient(145deg, #7c8cff 0%, #6656f6 55%, #4930bb 100%);
  box-shadow:
    0 16px 30px rgba(88, 93, 255, 0.28),
    0 0 0 1px rgba(255, 255, 255, 0.12) inset;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
  position: relative;
  user-select: none;
  -webkit-user-select: none;
  backdrop-filter: blur(16px);
}

.support-chat-button:hover {
  transform: translateY(-2px);
  box-shadow:
    0 18px 34px rgba(88, 93, 255, 0.34),
    0 0 0 1px rgba(255, 255, 255, 0.16) inset;
}

.support-chat-button i {
  font-size: 1.1rem;
}

.button-text {
  position: absolute;
  right: calc(100% + 12px);
  top: 50%;
  transform: translateY(-50%) translateX(8px);
  padding: 8px 12px;
  border-radius: 999px;
  background: rgba(15, 23, 42, 0.86);
  color: rgba(255, 255, 255, 0.92);
  border: 1px solid rgba(148, 163, 184, 0.2);
  font-size: 0.8125rem;
  white-space: nowrap;
  letter-spacing: 0.02em;
  opacity: 0;
  pointer-events: none;
  transition: opacity 0.2s ease, transform 0.2s ease;
  backdrop-filter: blur(16px);
}

.support-chat-button:hover .button-text,
.support-chat-button:focus-visible .button-text {
  opacity: 1;
  transform: translateY(-50%) translateX(0);
}

.chat-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  padding-bottom: 16px;
  border-bottom: 1px solid var(--n-border-color);
}

.header-info {
  flex: 1;
}

.header-title {
  font-size: 1.25rem;
  font-weight: 600;
  margin: 0 0 4px;
  color: var(--n-text-color);
}

.header-subtitle {
  margin: 0;
  font-size: 0.875rem;
  color: var(--n-text-color-2);
}

.chat-content {
  display: flex;
  flex-direction: column;
  height: 100%;
}

.messages-list {
  flex: 1;
  min-height: 300px;
  max-height: calc(100vh - 200px);
  overflow-y: auto;
  padding: 16px 0;
}

.message-item {
  display: flex;
  gap: 12px;
  margin-bottom: 16px;
  animation: fade-in 0.28s ease;
}

.message-user {
  flex-direction: row-reverse;
}

.message-avatar {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  font-size: 1rem;
}

.message-user .message-avatar {
  background: linear-gradient(135deg, var(--color-primary-start, #667eea) 0%, var(--color-primary-end, #764ba2) 100%);
  color: white;
}

.message-assistant .message-avatar {
  background: var(--n-color);
  border: 1px solid var(--n-border-color);
  color: var(--n-text-color-2);
}

.message-content {
  flex: 1;
  max-width: 75%;
}

.message-user .message-content {
  text-align: right;
}

.message-text {
  padding: 10px 14px;
  border-radius: 12px;
  word-wrap: break-word;
  line-height: 1.6;
}

.message-loading {
  display: inline-flex;
  align-items: center;
  gap: 8px;
}

.message-user .message-text {
  background: linear-gradient(135deg, var(--color-primary-start, #667eea) 0%, var(--color-primary-end, #764ba2) 100%);
  color: white;
  border-bottom-right-radius: 4px;
}

.message-assistant .message-text {
  background: var(--n-color);
  border: 1px solid var(--n-border-color);
  color: var(--n-text-color);
  border-bottom-left-radius: 4px;
}

.message-links {
  margin-top: 8px;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.message-user .message-links {
  align-items: flex-end;
}

.link-item {
  font-size: 0.875rem;
}

.link-text {
  color: var(--color-primary-start, #667eea);
  text-decoration: none;
  display: inline-flex;
  align-items: center;
  gap: 4px;
  transition: color 0.2s ease;
}

.link-text:hover {
  color: var(--color-primary-end, #764ba2);
  text-decoration: underline;
}

.message-human-tip {
  margin-top: 8px;
  padding: 6px 10px;
  background: rgba(239, 68, 68, 0.1);
  border-left: 3px solid #ef4444;
  border-radius: 4px;
  font-size: 0.8125rem;
  color: #dc2626;
  display: inline-flex;
  align-items: center;
  gap: 6px;
}

.chat-input-area {
  padding-top: 16px;
  border-top: 1px solid var(--n-border-color);
}

.input-actions {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 8px;
}

.input-hint {
  font-size: 0.75rem;
  color: var(--n-text-color-3);
}

@keyframes fade-in {
  from {
    opacity: 0;
    transform: translateY(10px);
  }

  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@media (max-width: 768px) {
  .support-chat-container {
    bottom: calc(
      var(--floating-dock-bottom, 12px)
      + var(--floating-dock-button-size, 44px)
      + var(--floating-dock-gap, 10px)
    );
    right: var(--floating-dock-right, 12px);
  }

  .support-chat-button {
    width: var(--floating-dock-button-size, 44px);
    height: var(--floating-dock-button-size, 44px);
  }

  .button-text {
    display: none;
  }
}
</style>
