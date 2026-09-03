<template>
  <form class="portal-message" @submit.prevent="submit">
    <label class="portal-message-label" for="portal-message-input">留下一句话</label>
    <div class="portal-message-row">
      <input
        id="portal-message-name"
        v-model="visitorName"
        type="text"
        class="portal-message-name"
        placeholder="你的称呼"
        maxlength="20"
        autocomplete="nickname"
        required
      />
      <textarea
        id="portal-message-input"
        v-model="content"
        class="portal-message-input"
        placeholder="想说的话会在审核后出现在上方…"
        rows="2"
        maxlength="100"
        required
      />
    </div>
    <div class="portal-message-actions">
      <span class="portal-message-count">{{ content.length }}/100</span>
      <button
        type="submit"
        class="portal-message-submit"
        :disabled="!visitorName.trim() || !content.trim() || submitting"
      >
        {{ submitting ? '发送中…' : '发送留言' }}
      </button>
    </div>
    <p v-if="feedback" class="portal-message-feedback" :data-type="feedbackType" role="status">
      {{ feedback }}
    </p>
  </form>
</template>

<script setup lang="ts">
const api = useApi()

const VISITOR_NAME_KEY = 'visitor_display_name'

const visitorName = ref('')
const content = ref('')
const submitting = ref(false)
const feedback = ref('')
const feedbackType = ref<'success' | 'error'>('success')

let feedbackTimer: ReturnType<typeof setTimeout> | null = null

const showFeedback = (message: string, type: 'success' | 'error') => {
  feedback.value = message
  feedbackType.value = type
  if (feedbackTimer) clearTimeout(feedbackTimer)
  feedbackTimer = setTimeout(() => {
    feedback.value = ''
  }, 4200)
}

const submit = async () => {
  const name = visitorName.value.trim()
  const text = content.value.trim()
  if (!name || !text || submitting.value) return

  submitting.value = true
  try {
    const visitorId = localStorage.getItem('visitor_id') || 'anonymous'
    await api.post('/VisitorInteraction/message', {
      visitorId,
      visitorName: name,
      messageType: 'message',
      content: text,
      emoji: null,
      location: null,
    })

    localStorage.setItem(VISITOR_NAME_KEY, name)

    content.value = ''
    showFeedback('已提交，审核通过后会出现在上方弹幕区。', 'success')
  } catch (error) {
    console.error('Portal visitor message failed', error)
    showFeedback('发送失败，请稍后再试。', 'error')
  } finally {
    submitting.value = false
  }
}

onMounted(() => {
  const saved = localStorage.getItem(VISITOR_NAME_KEY)
  if (saved) visitorName.value = saved
})

onUnmounted(() => {
  if (feedbackTimer) clearTimeout(feedbackTimer)
})
</script>
