<script setup lang="ts">
definePageMeta({
  layout: 'admin',
  middleware: 'admin-auth',
})

await navigateTo('/admin/content?tab=links', { replace: true })
</script>
