<template>
  <div class="game-page">
    <div class="game-background" aria-hidden="true">
      <div class="game-blob game-blob--violet"></div>
      <div class="game-blob game-blob--pink"></div>
      <div class="game-grid"></div>
    </div>

    <div class="game-shell">
      <div class="game-topbar">
        <NuxtLink to="/work" class="game-back-button">
          <i class="fas fa-arrow-left"></i>
          返回首页
        </NuxtLink>
      </div>

      <section class="game-hero">
        <div class="game-hero-copy">
          <p class="game-kicker">Mini Arcade</p>
          <h1 class="game-title">小游戏实验室</h1>
          <p class="game-subtitle">
            放一点轻松的交互实验，也把玩法、难度和本地分数整理成一页可进入的小游戏入口。
          </p>
        </div>

        <div class="game-hero-panel">
          <p class="game-panel-kicker">当前收录</p>
          <h2 class="game-panel-title">{{ games.length }} 个可玩实验</h2>
          <p class="game-panel-text">
            当前先开放一个反应与躲避类小游戏，后续会继续补充更多轻量互动。
          </p>
        </div>
      </section>

      <section class="game-grid-list">
        <article
          v-for="game in games"
          :key="game.id"
          class="game-card"
        >
          <div class="game-card-head">
            <div class="game-card-icon">{{ game.icon }}</div>
            <div class="game-card-copy">
              <h2 class="game-card-title">{{ game.name }}</h2>
              <p class="game-card-description">{{ game.description }}</p>
            </div>
          </div>

          <div class="game-card-meta">
            <div class="game-meta-item">
              <span class="game-meta-label">难度等级</span>
              <div class="game-card-difficulty">
                <span
                  v-for="i in 5"
                  :key="i"
                  class="game-card-difficulty-dot"
                  :class="{ 'game-card-difficulty-dot-active': i <= game.difficulty }"
                ></span>
              </div>
            </div>
            <div class="game-meta-item">
              <span class="game-meta-label">最高分</span>
              <strong class="game-meta-value">{{ game.highScore || 0 }}</strong>
            </div>
          </div>

          <div class="game-card-actions">
            <button @click="startGame(game)" class="game-card-play-btn">
              开始游戏
            </button>
          </div>
        </article>
      </section>
    </div>

    <div
      v-if="currentGame"
      class="game-overlay"
    >
      <component :is="currentGame.component" @close="closeGame" />
    </div>
  </div>
</template>

<script setup lang="ts">
import '~/assets/css/game.css'

interface Game {
  id: string
  name: string
  description: string
  icon: string
  difficulty: number
  component: any
  highScore?: number
}

definePageMeta({
  layout: 'default'
})

useHead({
  title: '小游戏实验室 - 溪午听风',
  meta: [
    { name: 'description', content: '收录一些轻量交互实验和可玩的小游戏，作为站内的娱乐与交互尝试。' }
  ]
})

const games = ref<Game[]>([
  {
    id: 'dodge',
    name: '躲避方块挑战',
    description: '使用方向键或 WASD 控制角色移动，在不断加速的方块雨里尽可能存活更久并刷新分数。',
    icon: '🎮',
    difficulty: 3,
    component: resolveComponent('DodgeGame'),
    highScore: 0
  }
])

const currentGame = ref<Game | null>(null)

const refreshScores = () => {
  if (!process.client) return

  games.value.forEach((game) => {
    const saved = localStorage.getItem(`game_${game.id}_high_score`)
    if (saved) {
      game.highScore = parseInt(saved, 10)
    }
  })
}

onMounted(() => {
  refreshScores()
})

const startGame = (game: Game) => {
  currentGame.value = game
}

const closeGame = () => {
  currentGame.value = null
  refreshScores()
}
</script>
