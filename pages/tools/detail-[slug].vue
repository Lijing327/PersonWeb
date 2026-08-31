<script setup lang="ts">
/**
 * Legacy content-tools detail route.
 * Canonical tool pages: /tools/:slug (Toolbox marketplace).
 */
const route = useRoute()
const slug = Array.isArray(route.params.slug) ? route.params.slug[0] : String(route.params.slug || '')

if (!slug) {
  throw createError({ statusCode: 404, statusMessage: 'Not Found' })
}

await navigateTo(`/tools/${slug}`, { redirectCode: 301, external: false })
</script>

<template>
  <div />
</template>
