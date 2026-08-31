<template>
  <div />
</template>

<script setup lang="ts">
/**
 * LEGACY retired — previously wrote Markdown via /api/admin/articles.
 * Blog PRIMARY is MySQL via .NET /Articles. Do not restore MD writes here.
 */
definePageMeta({
  layout: 'admin',
  middleware: 'admin-auth',
})

useHead({
  meta: [{ key: 'robots', name: 'robots', content: 'noindex,nofollow' }],
})

await navigateTo('/admin/articles', { redirectCode: 302, external: false })
</script>
