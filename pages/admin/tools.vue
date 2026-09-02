<script setup lang="ts">
definePageMeta({
  layout: 'admin',
  middleware: 'admin-auth',
})

await navigateTo('/admin/content?tab=tools', { replace: true })
</script>
