<template>
  <ClientOnly>
    <div ref="rootEl" class="work-assistant-hub">
      <Transition name="wah-panel">
        <div
          v-if="menuOpen"
          id="work-assistant-hub-panel"
          class="work-assistant-hub__panel"
          role="dialog"
          aria-modal="true"
          aria-labelledby="work-assistant-hub-title"
        >
          <p id="work-assistant-hub-title" class="work-assistant-hub__title">{{ hub.title }}</p>

          <button
            v-for="item in hub.items"
            :key="item.id"
            type="button"
            class="work-assistant-hub__item"
            :class="{ 'work-assistant-hub__item--primary': item.action === 'open_ai' }"
            @click="runHubAction(item.action)"
          >
            <span class="work-assistant-hub__item-icon" aria-hidden="true">{{ item.icon }}</span>
            <span class="work-assistant-hub__item-copy">
              <strong>{{ item.title }}</strong>
              <small>{{ item.description }}</small>
            </span>
          </button>
        </div>
      </Transition>

      <button
        type="button"
        class="work-assistant-hub__trigger"
        :aria-expanded="menuOpen"
        aria-controls="work-assistant-hub-panel"
        :aria-label="hub.triggerLabel"
        @click="toggleMenu"
      >
        <svg class="work-assistant-hub__trigger-icon" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path
            stroke="currentColor"
            stroke-width="1.7"
            stroke-linecap="round"
            stroke-linejoin="round"
            d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"
          />
          <path
            stroke="currentColor"
            stroke-width="1.7"
            stroke-linecap="round"
            d="M18.2 4.2l.3 1.1 1.1.3-1.1.3-.3 1.1-.3-1.1-1.1-.3 1.1-.3.3-1.1z"
          />
        </svg>
        <span class="work-assistant-hub__trigger-label">{{ hub.triggerLabel }}</span>
      </button>

      <AIAssistant ref="aiRef" hide-launcher />
      <VisitorInteractionPanel ref="messageRef" hide-launcher />
    </div>
  </ClientOnly>
</template>

<script setup lang="ts">
import { defineAsyncComponent, onMounted, onUnmounted, ref } from 'vue'
import { fetchAiSolutionsData, type WorkAssistantCopy } from '~/composables/useAiSolutionsData'
import '~/assets/css/work-assistant-hub.css'

const AIAssistant = defineAsyncComponent(() => import('~/components/ai/AIAssistant.vue'))
const VisitorInteractionPanel = defineAsyncComponent(() => import('~/components/VisitorInteractionPanel.vue'))

const router = useRouter()

const { data: aiData } = await useAsyncData('work-ai-solutions', () => fetchAiSolutionsData())

const hub = computed<WorkAssistantCopy['hub']>(() => aiData.value?.assistant.hub || {
  title: '有什么可以帮你？',
  triggerLabel: '问问 AI',
  items: [],
})

const rootEl = ref<HTMLElement | null>(null)
const menuOpen = ref(false)
const aiRef = ref<{ open: () => void; close: () => void } | null>(null)
const messageRef = ref<{ open: () => void; close: () => void } | null>(null)

const closeMenu = () => {
  menuOpen.value = false
}

const toggleMenu = () => {
  menuOpen.value = !menuOpen.value
}

const openAi = async () => {
  closeMenu()
  await nextTick()
  aiRef.value?.open()
}

const goContact = () => {
  closeMenu()
  router.push('/contact')
}

const openMessage = async () => {
  closeMenu()
  await nextTick()
  messageRef.value?.open()
}

const runHubAction = (action: string) => {
  if (action === 'open_ai') return openAi()
  if (action === 'go_contact') return goContact()
  if (action === 'open_message') return openMessage()
}

const onDocClick = (event: MouseEvent) => {
  if (!menuOpen.value || !rootEl.value) return
  if (!rootEl.value.contains(event.target as Node)) {
    closeMenu()
  }
}

const onKeydown = (event: KeyboardEvent) => {
  if (event.key === 'Escape' && menuOpen.value) {
    closeMenu()
  }
}

onMounted(() => {
  document.addEventListener('click', onDocClick)
  window.addEventListener('keydown', onKeydown)
  window.addEventListener('open-visitor-message', openMessage)
})

onUnmounted(() => {
  document.removeEventListener('click', onDocClick)
  window.removeEventListener('keydown', onKeydown)
  window.removeEventListener('open-visitor-message', openMessage)
})
</script>
