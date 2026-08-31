<script setup lang="ts">
/**
 * Legacy markdown project detail route (COMPAT).
 * Canonical Work case studies: /projects/:id
 * Attempts slug → live Project ID mapping before falling back to /projects.
 */
import { fetchBackendApi } from '~/composables/useBackendFetch'
import {
  legacyRedirectToPath,
  resolveLegacyProjectRedirect,
} from '~/utils/project-legacy-slug'
import type { Project } from '~/types/api'

const route = useRoute()
const slug = Array.isArray(route.params.slug) ? route.params.slug[0] : String(route.params.slug || '')

let target = '/projects'
try {
  const projects = await fetchBackendApi<Project[]>('/Projects')
  const list = Array.isArray(projects) ? projects : []
  target = legacyRedirectToPath(resolveLegacyProjectRedirect(slug, list))
} catch {
  target = '/projects'
}

await navigateTo(target, { redirectCode: 301, external: false })
</script>

<template>
  <div />
</template>
