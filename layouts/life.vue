<template>
  <div id="life-top" class="life-shell">
    <LifeHeader />
    <main class="life-shell-main">
      <slot />
    </main>
    <LifeFooter />
  </div>
</template>

<script setup lang="ts">
import '~/assets/css/life-shell.css'
import LifeHeader from '~/components/life/LifeHeader.vue'
import LifeFooter from '~/components/life/LifeFooter.vue'

useHead({
  htmlAttrs: {
    'data-life-world': 'true'
  },
  // Prefer system / installed CJK serif stack — no blocking Google Fonts request.
})
</script>
