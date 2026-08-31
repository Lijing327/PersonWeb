<template>
  <section class="screenshot-gallery-section">
    <div class="screenshot-gallery-container">
      <div class="screenshot-gallery-header">
        <p class="screenshot-gallery-kicker">Screenshots</p>
        <h2 class="screenshot-gallery-title">产品截图</h2>
        <p class="screenshot-gallery-subtitle">真实产品界面，截图即将更新。</p>
      </div>

      <div class="screenshot-gallery-grid">
        <div
          v-for="(item, index) in screenshots"
          :key="index"
          class="screenshot-gallery-item"
        >
          <div v-if="!item.src" class="screenshot-gallery-placeholder">
            <i class="fas fa-image screenshot-gallery-placeholder-icon"></i>
            <span class="screenshot-gallery-placeholder-label">{{ item.alt }}</span>
          </div>
          <img
            v-else
            :src="item.src"
            :alt="item.alt"
            class="screenshot-gallery-img"
            width="640"
            height="400"
            loading="lazy"
            decoding="async"
          />
          <p class="screenshot-gallery-caption">{{ item.alt }}</p>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { DESKTOP_PET } from '~/constants/products/desktopPet'

const screenshots = DESKTOP_PET.screenshots
</script>

<style scoped>
.screenshot-gallery-section {
  padding: 5rem 0;
}

.screenshot-gallery-container {
  max-width: 72rem;
  margin: 0 auto;
  padding: 0 var(--spacing-lg);
}

.screenshot-gallery-header {
  text-align: center;
  margin-bottom: 3rem;
}

.screenshot-gallery-kicker {
  font-size: 0.8rem;
  font-weight: 600;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: var(--color-primary);
  margin: 0 0 var(--spacing-sm);
}

.screenshot-gallery-title {
  font-size: var(--font-size-h2);
  font-weight: 700;
  color: var(--color-text-main);
  margin: 0 0 var(--spacing-md);
}

.screenshot-gallery-subtitle {
  font-size: 1rem;
  color: var(--color-text-muted);
  margin: 0;
}

.screenshot-gallery-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: var(--spacing-lg);
}

.screenshot-gallery-item {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-sm);
}

.screenshot-gallery-placeholder {
  aspect-ratio: 4 / 3;
  background: var(--color-bg-card);
  border: 1px dashed var(--color-border-default);
  border-radius: var(--radius-lg);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: var(--spacing-sm);
}

.screenshot-gallery-placeholder-icon {
  font-size: 2rem;
  color: var(--color-border-default);
}

.screenshot-gallery-placeholder-label {
  font-size: 0.85rem;
  color: var(--color-text-muted);
}

.screenshot-gallery-img {
  width: 100%;
  aspect-ratio: 4 / 3;
  object-fit: cover;
  border-radius: var(--radius-lg);
  border: 1px solid var(--color-border-subtle);
}

.screenshot-gallery-caption {
  font-size: 0.8rem;
  color: var(--color-text-muted);
  text-align: center;
  margin: 0;
}

@media (max-width: 768px) {
  .screenshot-gallery-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 480px) {
  .screenshot-gallery-grid {
    grid-template-columns: 1fr;
  }
}
</style>
