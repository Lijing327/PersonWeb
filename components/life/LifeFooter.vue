<template>
  <footer class="life-footer">
    <div class="life-footer-inner">
      <div class="life-footer-copy">
        <strong>溪午听风</strong>
        <p>平常那些事。</p>
      </div>
      <span class="life-footer-year">© {{ currentYear }}</span>
    </div>
  </footer>
</template>

<script setup lang="ts">
const currentYear = new Date().getFullYear()
</script>
