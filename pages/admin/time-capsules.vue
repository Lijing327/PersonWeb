<script setup lang="ts">
definePageMeta({
  layout: 'admin',
  middleware: 'admin-auth',
})

await navigateTo('/admin/visitor-messages', { replace: true })
</script>
