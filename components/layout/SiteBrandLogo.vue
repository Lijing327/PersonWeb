<template>
  <img
    :src="src"
    alt=""
    :width="width"
    :height="height"
    :class="['site-brand-logo', `site-brand-logo--${variant}`]"
    decoding="async"
    draggable="false"
  >
</template>

<script setup lang="ts">
import { computed } from 'vue'
import '~/assets/css/brand-logo.css'

const props = withDefaults(defineProps<{
  variant?: 'favicon' | 'wordmark' | 'full'
}>(), {
  variant: 'favicon'
})

const assetMap = {
  favicon: { src: '/brand/logo-favicon.png', width: 36, height: 36 },
  wordmark: { src: '/brand/logo-wordmark.png', width: 176, height: 48 },
  full: { src: '/brand/logo-full.png', width: 96, height: 60 }
} as const

const src = computed(() => assetMap[props.variant].src)
const width = computed(() => assetMap[props.variant].width)
const height = computed(() => assetMap[props.variant].height)
</script>
