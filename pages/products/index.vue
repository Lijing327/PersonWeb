<template>
  <div class="products-hub-page">
    <div class="products-hub-bg" aria-hidden="true">
      <div class="products-hub-glow products-hub-glow--a" />
      <div class="products-hub-glow products-hub-glow--b" />
    </div>

    <div class="products-hub-shell">
      <header class="products-hub-hero">
        <p class="products-hub-eyebrow">Products</p>
        <h1 class="products-hub-title">可以直接使用的产品</h1>
        <p class="products-hub-lead">
          这里放可持续使用的产品入口：安装、下载、获取。若要看我怎么做出来的，请去「案例」。
        </p>
      </header>

      <div class="products-hub-grid">
        <NuxtLink
          v-for="card in cards"
          :key="card.to"
          :to="card.to"
          class="products-hub-card"
        >
          <span class="products-hub-card-icon" aria-hidden="true">{{ card.icon }}</span>
          <div class="products-hub-card-body">
            <h2 class="products-hub-card-title">{{ card.title }}</h2>
            <p class="products-hub-card-desc">{{ card.description }}</p>
          </div>
          <span class="products-hub-card-arrow" aria-hidden="true">→</span>
        </NuxtLink>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
const cards = [
  {
    to: '/tools',
    icon: '🧰',
    title: '插件工具',
    description: 'Revit / CAD 与开发向工具合集，含说明与获取方式。',
  },
  {
    to: '/module-store',
    icon: '🧩',
    title: '模块商店',
    description: '站点功能模块的安装与管理入口。',
  },
  {
    to: '/products/desktop-pet',
    icon: '🐾',
    title: '桌宠产品',
    description: '桌面宠物与相关能力展示。',
  },
  {
    to: '/products/mindtrace',
    icon: '🧠',
    title: 'MindTrace',
    description: 'Chrome 扩展：浏览时记录灵感，自动保留思考上下文。',
  },
]

usePageSeo({
  title: '产品 - 溪午听风',
  description: '可安装、可下载、可持续使用的产品入口：MindTrace、桌宠、工具与模块。',
  path: '/products',
  world: 'work',
})
</script>

<style scoped>
.products-hub-page {
  position: relative;
  min-height: 100vh;
  padding: clamp(5.5rem, 12vw, 7rem) 0 clamp(4rem, 10vw, 6rem);
  color: var(--color-text);
  background: transparent;
}

.products-hub-bg {
  pointer-events: none;
  position: fixed;
  inset: 0;
  z-index: 0;
  overflow: hidden;
}

.products-hub-glow {
  position: absolute;
  width: 42rem;
  height: 42rem;
  border-radius: 50%;
  filter: blur(80px);
  opacity: 0.35;
}

.products-hub-glow--a {
  top: -8rem;
  right: -6rem;
  background: radial-gradient(circle, var(--color-primary-soft), transparent 70%);
}

.products-hub-glow--b {
  bottom: -10rem;
  left: -8rem;
  background: radial-gradient(circle, rgba(139, 92, 246, 0.35), transparent 70%);
}

.products-hub-shell {
  position: relative;
  z-index: 1;
  width: min(100% - 2rem, var(--space-container));
  margin-inline: auto;
}

.products-hub-hero {
  margin-bottom: 2.5rem;
}

.products-hub-eyebrow {
  margin: 0 0 0.5rem;
  font-size: 0.75rem;
  font-weight: 700;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: var(--color-text-muted);
}

.products-hub-title {
  margin: 0 0 0.75rem;
  font-size: clamp(1.85rem, 4.5vw, 2.35rem);
  font-weight: 750;
  letter-spacing: -0.02em;
  line-height: 1.15;
}

.products-hub-lead {
  margin: 0;
  max-width: min(52rem, 100%);
  font-size: 1.05rem;
  line-height: 1.65;
  color: var(--color-text-muted);
}

.products-hub-grid {
  display: grid;
  gap: 1rem;
}

@media (min-width: 640px) {
  .products-hub-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

.products-hub-card {
  display: flex;
  align-items: flex-start;
  gap: 1rem;
  padding: 1.25rem 1.35rem;
  border-radius: var(--radius-lg);
  border: 1px solid var(--color-border);
  background: var(--color-bg-card);
  text-decoration: none;
  color: inherit;
  box-shadow: var(--shadow-sm);
  transition:
    border-color 0.2s ease,
    box-shadow 0.2s ease,
    transform 0.2s ease;
}

.products-hub-card:hover {
  border-color: var(--color-border-strong);
  box-shadow: var(--shadow-md);
  transform: translateY(-2px);
}

.products-hub-card-icon {
  flex: 0 0 auto;
  font-size: 1.75rem;
  line-height: 1;
}

.products-hub-card-body {
  flex: 1;
  min-width: 0;
}

.products-hub-card-title {
  margin: 0 0 0.35rem;
  font-size: 1.05rem;
  font-weight: 650;
}

.products-hub-card-desc {
  margin: 0;
  font-size: 0.9rem;
  line-height: 1.55;
  color: var(--color-text-muted);
}

.products-hub-card-arrow {
  flex: 0 0 auto;
  align-self: center;
  font-size: 1.1rem;
  color: var(--color-text-muted);
  transition: transform 0.2s ease, color 0.2s ease;
}

.products-hub-card:hover .products-hub-card-arrow {
  color: var(--color-primary);
  transform: translateX(3px);
}
</style>
