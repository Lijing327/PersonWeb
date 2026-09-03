<template>
  <div class="interaction-panel" :class="{ 'interaction-panel--embedded': hideLauncher }">
    <button
      v-if="!hideLauncher"
      type="button"
      class="visitor-button-circle visitor-button-circle-blue panel-button"
      title="发送留言"
      aria-label="发送留言"
      @click="openMessageModal"
    >
      <i class="fas fa-comment-dots" aria-hidden="true"></i>
    </button>

    <Teleport to="body">
      <div
        v-if="showMessageModal"
        class="visitor-modal-overlay"
        role="dialog"
        aria-modal="true"
        aria-label="发送留言"
        @click.self="onOverlayClick"
      >
        <div class="visitor-modal" @click.stop>
          <div class="visitor-modal-header">
            <h3>发送留言</h3>
            <button type="button" class="visitor-modal-close" aria-label="关闭留言" @click="closeMessageModal">
              <i class="fas fa-times" aria-hidden="true"></i>
            </button>
          </div>

          <div class="visitor-modal-body">
            <div class="visitor-form-group">
              <label class="visitor-form-label">你的称呼</label>
              <input
                v-model="visitorName"
                type="text"
                class="visitor-form-input"
                placeholder="例如：小明（选填，不填则显示匿名）"
                maxlength="20"
              />
            </div>

            <div class="visitor-form-group">
              <label class="visitor-form-label">消息类型</label>
              <div class="visitor-type-buttons">
                <button
                  v-for="type in messageTypes"
                  :key="type.value"
                  type="button"
                  :class="['visitor-type-button', { 'visitor-type-button-active': messageType === type.value }]"
                  @click="messageType = type.value"
                >
                  <i :class="type.icon" aria-hidden="true"></i>
                  {{ type.label }}
                </button>
              </div>
            </div>

            <div class="visitor-form-group">
              <label class="visitor-form-label">表情</label>
              <div class="visitor-emoji-picker">
                <button
                  v-for="emoji in quickEmojis"
                  :key="emoji"
                  type="button"
                  :class="['visitor-emoji-button', { 'visitor-emoji-button-selected': selectedEmoji === emoji }]"
                  @click="selectedEmoji = emoji"
                >
                  {{ emoji }}
                </button>
              </div>
            </div>

            <div class="visitor-form-group">
              <label class="visitor-form-label">内容</label>
              <textarea
                v-model="messageContent"
                class="visitor-form-textarea"
                placeholder="输入你想说的话..."
                rows="4"
                maxlength="100"
              ></textarea>
              <div class="visitor-form-char-count">{{ messageContent.length }}/100</div>
            </div>

            <div class="visitor-form-group">
              <label class="visitor-form-label">位置</label>
              <input
                v-model="messageLocation"
                type="text"
                class="visitor-form-input"
                placeholder="例如：杭州"
                maxlength="20"
              />
            </div>

            <button
              type="button"
              class="visitor-button-primary"
              :disabled="!messageContent.trim() || submitting"
              @click="sendMessage"
            >
              {{ submitting ? '发送中...' : '发送留言' }}
            </button>

            <p class="visitor-form-hint">
              <i class="fas fa-info-circle" aria-hidden="true"></i>
              审核通过后会出现在入口首页左侧弹幕区；入口：右下角「问问 AI」或右上角访客中心
            </p>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import '~/assets/css/visitor-interaction.css'

const WORK_MESSAGE_OPEN_EVENT = 'open-work-visitor-message'

const props = withDefaults(defineProps<{
  hideLauncher?: boolean
}>(), {
  hideLauncher: false,
})

const api = useApi()

const showMessageModal = ref(false)
const messageType = ref('message')
const selectedEmoji = ref('')
const messageContent = ref('')
const messageLocation = ref('')
const visitorName = ref('')
const submitting = ref(false)

const VISITOR_NAME_KEY = 'visitor_display_name'
let ignoreOverlayCloseUntil = 0

const messageTypes = [
  { value: 'message', label: '留言', icon: 'fas fa-comment' },
  { value: 'mood', label: '心情', icon: 'fas fa-smile' },
  { value: 'blessing', label: '祝福', icon: 'fas fa-heart' }
]

const quickEmojis = ['😊', '❤️', '👏', '🎉', '✨', '🔥', '👍', '🌟', '💡', '🚀', '✔️', '🫶']

const openMessageModal = () => {
  ignoreOverlayCloseUntil = Date.now() + 400
  showMessageModal.value = true
}

const closeMessageModal = () => {
  showMessageModal.value = false
}

const onOverlayClick = () => {
  if (Date.now() < ignoreOverlayCloseUntil) return
  closeMessageModal()
}

defineExpose({
  open: openMessageModal,
  close: closeMessageModal,
})

const sendMessage = async () => {
  if (!messageContent.value.trim()) return

  submitting.value = true

  try {
    const visitorId = localStorage.getItem('visitor_id') || 'anonymous'

    await api.post('/VisitorInteraction/message', {
      visitorId,
      visitorName: visitorName.value.trim() || null,
      messageType: messageType.value,
      content: messageContent.value.trim(),
      emoji: selectedEmoji.value || null,
      location: messageLocation.value.trim() || null
    })

    if (process.client && visitorName.value.trim()) {
      localStorage.setItem(VISITOR_NAME_KEY, visitorName.value.trim())
    }

    messageContent.value = ''
    selectedEmoji.value = ''
    messageLocation.value = ''
    messageType.value = 'message'
    showMessageModal.value = false

    if (process.client) {
      window.dispatchEvent(new CustomEvent('show-toast', {
        detail: { message: '留言已提交，等待审核后展示', type: 'success' }
      }))
    }
  } catch (error) {
    console.error('Visitor message send failed', error)

    if (process.client) {
      window.dispatchEvent(new CustomEvent('show-toast', {
        detail: { message: '发送失败，请稍后重试', type: 'error' }
      }))
    }
  } finally {
    submitting.value = false
  }
}

onMounted(() => {
  if (!process.client) return

  const savedName = localStorage.getItem(VISITOR_NAME_KEY)
  if (savedName) {
    visitorName.value = savedName
  }

  const onKey = (event: KeyboardEvent) => {
    if (event.key === 'Escape' && showMessageModal.value) {
      closeMessageModal()
    }
  }
  window.addEventListener('keydown', onKey)
  window.addEventListener(WORK_MESSAGE_OPEN_EVENT, openMessageModal)
  onUnmounted(() => {
    window.removeEventListener('keydown', onKey)
    window.removeEventListener(WORK_MESSAGE_OPEN_EVENT, openMessageModal)
  })
})
</script>

<style scoped>
.interaction-panel {
  position: fixed;
  bottom: calc(
    var(--floating-dock-bottom, 18px)
    + (var(--floating-dock-button-size, 52px) + var(--floating-dock-gap, 14px)) * 2
  );
  right: var(--floating-dock-right, 2rem);
  z-index: 10000;
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  pointer-events: auto;
  isolation: isolate;
  transform: translateZ(0);
}

.interaction-panel--embedded {
  position: static;
  bottom: auto;
  right: auto;
  z-index: auto;
  pointer-events: none;
  transform: none;
}

.panel-button {
  width: var(--floating-dock-button-size, 52px);
  height: var(--floating-dock-button-size, 52px);
  margin: 0;
  position: relative;
  z-index: 10000;
  display: flex;
  background:
    radial-gradient(circle at 30% 30%, rgba(255, 255, 255, 0.2) 0%, rgba(255, 255, 255, 0) 42%),
    linear-gradient(145deg, #5b7cff 0%, #3b82f6 58%, #155eef 100%) !important;
  border: 1px solid rgba(255, 255, 255, 0.22) !important;
  box-shadow:
    0 16px 30px rgba(37, 99, 235, 0.26),
    0 0 0 1px rgba(255, 255, 255, 0.12) inset !important;
  backdrop-filter: blur(16px);
}

@media (max-width: 768px) {
  .interaction-panel:not(.interaction-panel--embedded) {
    bottom: calc(
      var(--floating-dock-bottom, 12px)
      + (var(--floating-dock-button-size, 44px) + var(--floating-dock-gap, 10px)) * 2
    );
    right: var(--floating-dock-right, 12px);
  }
}
</style>
