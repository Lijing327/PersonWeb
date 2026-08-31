<template>
  <div class="mindtrace-page">
    <div class="mindtrace-container">
      <header class="mindtrace-hero">
        <p class="mindtrace-kicker">Chrome Extension</p>
        <div class="mindtrace-badge">
          <span class="mindtrace-badge-dot" aria-hidden="true"></span>
          <span>{{ data.badge }}</span>
        </div>
        <h1 class="mindtrace-title">{{ data.name }} — {{ data.tagline }}</h1>
        <p class="mindtrace-desc">{{ data.description }}</p>
        <div class="mindtrace-actions">
          <a
            :href="data.chromeWebStoreUrl"
            class="mindtrace-btn-primary"
            target="_blank"
            rel="noopener noreferrer"
          >
            <i class="fab fa-chrome" aria-hidden="true"></i>
            在 Chrome 中安装
          </a>
          <NuxtLink to="/products" class="mindtrace-btn-secondary">
            返回产品中心
          </NuxtLink>
          <NuxtLink to="/projects" class="mindtrace-btn-secondary">
            在案例墙看能力证明
          </NuxtLink>
        </div>
      </header>

      <section class="mindtrace-section" aria-labelledby="mindtrace-features-title">
        <h2 id="mindtrace-features-title" class="mindtrace-section-title">核心能力</h2>
        <div class="mindtrace-features">
          <article
            v-for="feature in data.features"
            :key="feature.title"
            class="mindtrace-feature-card"
          >
            <div class="mindtrace-feature-icon" aria-hidden="true">
              <i :class="feature.icon"></i>
            </div>
            <h3 class="mindtrace-feature-title">{{ feature.title }}</h3>
            <p class="mindtrace-feature-desc">{{ feature.description }}</p>
          </article>
        </div>
      </section>

      <section class="mindtrace-section" aria-labelledby="mindtrace-install-title">
        <h2 id="mindtrace-install-title" class="mindtrace-section-title">安装说明</h2>
        <div class="mindtrace-steps">
          <div
            v-for="(step, index) in data.installSteps"
            :key="step.title"
            class="mindtrace-step"
          >
            <div class="mindtrace-step-num">{{ index + 1 }}</div>
            <div>
              <h3 class="mindtrace-step-title">{{ step.title }}</h3>
              <p class="mindtrace-step-desc">{{ step.desc }}</p>
            </div>
          </div>
        </div>
      </section>

      <section class="mindtrace-cta">
        <h2 class="mindtrace-cta-title">开始记录你的思考轨迹</h2>
        <p class="mindtrace-cta-desc">免费安装，浏览网页时随时记下灵感与上下文。</p>
        <a
          :href="data.chromeWebStoreUrl"
          class="mindtrace-btn-primary"
          target="_blank"
          rel="noopener noreferrer"
        >
          <i class="fab fa-chrome" aria-hidden="true"></i>
          前往 Chrome 网上应用店
        </a>
        <p class="mindtrace-cta-slogan">{{ data.slogan }}</p>
      </section>
    </div>
  </div>
</template>

<script setup lang="ts">
import { MIND_TRACE } from '~/constants/products/mindTrace'

const data = MIND_TRACE

useHead({
  title: 'MindTrace - 思考轨迹 Chrome 扩展',
  meta: [
    {
      name: 'description',
      content:
        'MindTrace 是一款 Chrome 扩展：浏览网页时快速记录灵感，自动保留思考上下文，串联你的思考轨迹。'
    }
  ]
})
</script>

<style scoped>
.mindtrace-page {
  min-height: 100vh;
  padding: clamp(5rem, 12vw, 7rem) 0 clamp(4rem, 10vw, 6rem);
}

.mindtrace-container {
  width: min(100% - 2rem, var(--space-container));
  margin-inline: auto;
  padding: 0 var(--spacing-lg);
}

.mindtrace-hero {
  text-align: center;
  margin-bottom: 3.5rem;
}

.mindtrace-kicker {
  margin: 0 0 var(--spacing-sm);
  font-size: 0.75rem;
  font-weight: 700;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: var(--color-text-muted);
}

.mindtrace-badge {
  display: inline-flex;
  align-items: center;
  gap: var(--spacing-sm);
  padding: 6px var(--spacing-md);
  margin-bottom: var(--spacing-lg);
  background: var(--color-primary-soft);
  border: 1px solid var(--color-primary-20, var(--color-border-subtle));
  border-radius: var(--radius-full);
  font-size: 0.8rem;
  color: var(--color-primary);
}

.mindtrace-badge-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: var(--color-primary);
}

.mindtrace-title {
  margin: 0 0 var(--spacing-md);
  font-size: clamp(1.75rem, 4vw, 2.35rem);
  font-weight: 750;
  line-height: 1.2;
  color: var(--color-text-main);
}

.mindtrace-desc {
  margin: 0 auto var(--spacing-xl);
  max-width: 40rem;
  font-size: 1.05rem;
  line-height: 1.7;
  color: var(--color-text-muted);
}

.mindtrace-actions {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: var(--spacing-md);
}

.mindtrace-btn-primary,
.mindtrace-btn-secondary {
  display: inline-flex;
  align-items: center;
  gap: var(--spacing-sm);
  padding: 12px 28px;
  border-radius: var(--radius-lg);
  font-size: 0.95rem;
  font-weight: 600;
  text-decoration: none;
  transition: opacity 0.2s ease, transform 0.2s ease;
}

.mindtrace-btn-primary {
  background: var(--color-primary);
  color: var(--color-text-on-primary, #fff);
}

.mindtrace-btn-primary:hover {
  opacity: 0.92;
  transform: translateY(-1px);
}

.mindtrace-btn-secondary {
  background: var(--color-bg-card);
  color: var(--color-text-main);
  border: 1px solid var(--color-border-default);
}

.mindtrace-btn-secondary:hover {
  border-color: var(--color-primary);
  color: var(--color-primary);
}

.mindtrace-section {
  margin-bottom: 3rem;
}

.mindtrace-section-title {
  margin: 0 0 var(--spacing-xl);
  font-size: var(--font-size-h3);
  font-weight: 700;
  color: var(--color-text-main);
}

.mindtrace-features {
  display: grid;
  gap: var(--spacing-md);
}

@media (min-width: 640px) {
  .mindtrace-features {
    grid-template-columns: repeat(2, 1fr);
  }
}

.mindtrace-feature-card {
  padding: var(--spacing-lg) var(--spacing-xl);
  background: var(--color-bg-card);
  border: 1px solid var(--color-border-subtle);
  border-radius: var(--radius-lg);
}

.mindtrace-feature-icon {
  width: 44px;
  height: 44px;
  margin-bottom: var(--spacing-md);
  border-radius: var(--radius-md);
  background: var(--color-primary-soft);
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--color-primary);
  font-size: 1.1rem;
}

.mindtrace-feature-title {
  margin: 0 0 var(--spacing-sm);
  font-size: 1rem;
  font-weight: 650;
  color: var(--color-text-main);
}

.mindtrace-feature-desc {
  margin: 0;
  font-size: 0.9rem;
  line-height: 1.6;
  color: var(--color-text-muted);
}

.mindtrace-steps {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-lg);
}

.mindtrace-step {
  display: flex;
  gap: var(--spacing-lg);
  align-items: flex-start;
}

.mindtrace-step-num {
  width: 40px;
  height: 40px;
  flex-shrink: 0;
  border-radius: 50%;
  background: var(--color-primary);
  color: var(--color-text-on-primary, #fff);
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
}

.mindtrace-step-title {
  margin: 0 0 4px;
  font-size: 1rem;
  font-weight: 600;
  color: var(--color-text-main);
}

.mindtrace-step-desc {
  margin: 0;
  font-size: 0.9rem;
  line-height: 1.6;
  color: var(--color-text-muted);
}

.mindtrace-cta {
  text-align: center;
  padding: var(--spacing-xl);
  background: var(--color-bg-card);
  border: 1px solid var(--color-border-subtle);
  border-radius: var(--radius-xl);
  box-shadow: var(--shadow-md);
}

.mindtrace-cta-title {
  margin: 0 0 var(--spacing-md);
  font-size: var(--font-size-h3);
  font-weight: 700;
  color: var(--color-text-main);
}

.mindtrace-cta-desc {
  margin: 0 0 var(--spacing-xl);
  color: var(--color-text-muted);
  line-height: 1.6;
}

.mindtrace-cta-slogan {
  margin: var(--spacing-lg) 0 0;
  font-size: 0.9rem;
  font-style: italic;
  color: var(--color-text-muted);
}
</style>
