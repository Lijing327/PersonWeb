<script setup lang="ts">
definePageMeta({
  layout: 'admin',
  middleware: 'admin-auth',
})

await navigateTo('/admin/projects/stats', { replace: true })
</script>
