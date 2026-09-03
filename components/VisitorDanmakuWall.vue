<template>
  <div
    v-if="isDanmakuEnabled && tracks.length"
    class="danmaku-container danmaku-container--embedded"
    :class="{ 'is-paused': isPaused }"
  >
    <div
      v-for="track in tracks"
      :key="track.id"
      class="danmaku-track"
    >
      <div
        class="danmaku-track-rail"
        :style="{ animationDuration: `${track.durationSec}s` }"
      >
        <div
          v-for="copy in 2"
          :key="`${track.id}-copy-${copy}`"
          class="danmaku-track-group"
        >
          <span
            v-for="(item, idx) in track.items"
            :key="`${track.id}-${copy}-${idx}`"
            class="danmaku-chip"
            :style="{ color: item.color }"
          >
            <span v-if="item.emoji" class="danmaku-emoji">{{ item.emoji }}</span>
            <span class="danmaku-content">{{ item.content }}</span>
          </span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
/**
 * 入口页局部弹幕：多轨连续跑马灯。
 * 滚动期间不增删 DOM，避免 Vue 重绘导致卡顿。
 */
interface DanmakuSource {
  id: number
  content: string
  emoji?: string
  color?: string
  messageType?: string
}

interface TrackItem {
  content: string
  emoji?: string
  color: string
}

interface Track {
  id: string
  items: TrackItem[]
  durationSec: number
}

withDefaults(defineProps<{
  maxCount?: number
  variant?: 'fullscreen' | 'embedded'
}>(), {
  maxCount: 6,
  variant: 'embedded',
})

const api = useApi()
const isDanmakuEnabled = ref(true)
const isPaused = ref(false)
const tracks = ref<Track[]>([])

let visibilityHandler: (() => void) | null = null
let newDanmakuHandler: EventListener | null = null
let rebuildTimer: ReturnType<typeof setTimeout> | null = null
let pool: DanmakuSource[] = []

const PALETTE: Record<string, string[]> = {
  message: ['#a78bfa', '#34d399', '#fbbf24', '#60a5fa'],
  mood: ['#f472b6', '#fb923c', '#22d3ee'],
  blessing: ['#fbbf24', '#f59e0b', '#eab308'],
}

const pickColor = (source: DanmakuSource): string => {
  if (source.color) return source.color
  const list = PALETTE[source.messageType || 'message'] || PALETTE.message
  return list[Math.abs(source.id) % list.length]
}

const buildTracks = (sources: DanmakuSource[]) => {
  const cleaned = sources
    .filter((item) => Boolean(item?.content?.trim()))
    .slice(0, 36)

  if (cleaned.length === 0) {
    tracks.value = []
    return
  }

  const rowCount = 3
  const rows: TrackItem[][] = Array.from({ length: rowCount }, () => [])

  cleaned.forEach((source, index) => {
    rows[index % rowCount].push({
      content: source.content.trim(),
      emoji: source.emoji,
      color: pickColor(source),
    })
  })

  // 每轨至少 3 条，不够就循环补齐，保证轨道够长、滚动更匀
  tracks.value = rows.map((items, rowIndex) => {
    const filled = [...items]
    let i = 0
    while (filled.length < 3 && cleaned.length > 0) {
      const source = cleaned[i % cleaned.length]
      filled.push({
        content: source.content.trim(),
        emoji: source.emoji,
        color: pickColor(source),
      })
      i += 1
    }

    return {
      id: `track-${rowIndex}`,
      items: filled,
      durationSec: 28 + rowIndex * 6,
    }
  })
}

const scheduleRebuild = () => {
  if (rebuildTimer) clearTimeout(rebuildTimer)
  rebuildTimer = setTimeout(() => {
    buildTracks(pool)
  }, 800)
}

const fetchDanmakus = async () => {
  try {
    const res = await api.get<DanmakuSource[]>('/VisitorInteraction/messages/approved?limit=100')
    if (res && Array.isArray(res) && res.length > 0) {
      pool = res
      buildTracks(pool)
    }
  } catch (e) {
    console.error('获取弹幕失败', e)
  }
}

onMounted(() => {
  const reducedMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
  if (reducedMotion) {
    isDanmakuEnabled.value = false
    return
  }

  fetchDanmakus()

  visibilityHandler = () => {
    isPaused.value = document.hidden
  }
  document.addEventListener('visibilitychange', visibilityHandler)

  newDanmakuHandler = ((e: Event) => {
    const detail = (e as CustomEvent).detail as DanmakuSource | undefined
    if (!detail?.content) return
    pool = [detail, ...pool]
    scheduleRebuild()
  }) as EventListener
  window.addEventListener('new-danmaku', newDanmakuHandler)
})

onUnmounted(() => {
  if (rebuildTimer) clearTimeout(rebuildTimer)
  if (visibilityHandler) document.removeEventListener('visibilitychange', visibilityHandler)
  if (newDanmakuHandler) window.removeEventListener('new-danmaku', newDanmakuHandler)
})
</script>

<style scoped>
.danmaku-container--embedded {
  position: absolute;
  inset: 0;
  z-index: 0;
  display: flex;
  flex-direction: column;
  justify-content: space-evenly;
  gap: 0.35rem;
  padding: 0.65rem 0;
  overflow: hidden;
  border-radius: inherit;
  pointer-events: none;
  contain: layout paint;
}

.danmaku-track {
  position: relative;
  height: 2rem;
  overflow: hidden;
}

.danmaku-track-rail {
  display: flex;
  width: max-content;
  height: 100%;
  align-items: center;
  animation: danmaku-marquee linear infinite;
  will-change: transform;
  transform: translate3d(0, 0, 0);
  backface-visibility: hidden;
}

.danmaku-container--embedded.is-paused .danmaku-track-rail {
  animation-play-state: paused;
}

.danmaku-track-group {
  display: flex;
  align-items: center;
  gap: 1.25rem;
  padding-right: 1.25rem;
  flex-shrink: 0;
}

.danmaku-chip {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  max-width: 18rem;
  padding: 0.28rem 0.75rem;
  border-radius: var(--radius-pill, 999px);
  border: 1px solid color-mix(in srgb, currentColor 28%, transparent);
  background: color-mix(in srgb, var(--color-bg-elevated, #111827) 88%, transparent);
  font-size: 0.8125rem;
  font-weight: 500;
  white-space: nowrap;
  overflow: hidden;
}

.danmaku-emoji {
  flex-shrink: 0;
  font-size: 0.95rem;
}

.danmaku-content {
  overflow: hidden;
  text-overflow: ellipsis;
  line-height: 1.35;
}

@keyframes danmaku-marquee {
  from {
    transform: translate3d(0, 0, 0);
  }

  to {
    /* 两组内容等宽，移过一组即为无缝循环 */
    transform: translate3d(-50%, 0, 0);
  }
}

@media (prefers-reduced-motion: reduce) {
  .danmaku-track-rail {
    animation: none;
  }
}
</style>
