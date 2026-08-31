<template>
  <footer class="life-footer">
    <div class="life-footer-inner">
      <p class="life-footer-copy">
        <LifeIcon name="leaf" />
        <span>© {{ currentYear }} 溪午听风，生活的记录者</span>
        <LifeIcon name="leaf" class="life-icon--mirror" />
      </p>
      <button
        type="button"
        class="life-footer-top"
        aria-label="回到页面顶部"
        @click="scrollToTop"
      >
        回到顶部 ↑
      </button>
    </div>
  </footer>
</template>

<script setup lang="ts">
const currentYear = new Date().getFullYear()

const scrollToTop = () => {
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  window.scrollTo({
    top: 0,
    behavior: reduceMotion ? 'auto' : 'smooth'
  })
}
</script>
