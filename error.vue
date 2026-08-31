<template>
  <div class="site-error" :data-error-world="world">
    <div class="site-error__panel">
      <p class="site-error__code">{{ statusCode }}</p>
      <h1 class="site-error__title">{{ title }}</h1>
      <p class="site-error__text">{{ message }}</p>
      <NuxtLink :to="homePath" class="site-error__link">
        {{ homeLabel }}
      </NuxtLink>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { NuxtError } from '#app'
import { usePageSeo } from '~/composables/usePageSeo'
import { resolveErrorWorld } from '~/utils/error-world'

const props = defineProps<{
  error: NuxtError
}>()

const route = useRoute()

const world = computed(() => resolveErrorWorld(route.path))
const statusCode = computed(() => Number(props.error?.statusCode || 500))
const isNotFound = computed(() => statusCode.value === 404)

const title = computed(() => (isNotFound.value ? '页面不存在' : '系统暂时无法响应'))

const message = computed(() => {
  if (isNotFound.value) {
    return '你访问的地址不存在，或内容已被移除。'
  }
  return '服务出现异常，请稍后再试。'
})

const homePath = computed(() => {
  switch (world.value) {
    case 'life':
      return '/life'
    case 'admin':
      return '/admin'
    case 'portal':
      return '/'
    default:
      return '/work'
  }
})

const homeLabel = computed(() => {
  switch (world.value) {
    case 'life':
      return '返回 Life'
    case 'admin':
      return '返回管理后台'
    case 'portal':
      return '返回入口'
    default:
      return '返回 Work'
  }
})

usePageSeo(() => ({
  title: `${statusCode.value} - 溪午听风`,
  description: message.value,
  path: route.path,
  noIndex: true,
}))
</script>

<style scoped>
.site-error {
  min-height: 100vh;
  display: grid;
  place-items: center;
  padding: 2rem;
  background: var(--color-bg-page, #0b1020);
  color: var(--color-text-main, #e8eefc);
}

.site-error[data-error-world='life'] {
  background: #f6f2ea;
  color: #2c241b;
}

.site-error[data-error-world='portal'] {
  background: #090d18;
  color: #e8eefc;
}

.site-error[data-error-world='admin'] {
  background: var(--color-bg-body, #0f172a);
  color: var(--color-text-main, #e2e8f0);
}

.site-error__panel {
  width: min(28rem, 100%);
  text-align: center;
}

.site-error__code {
  font-size: 3rem;
  font-weight: 700;
  letter-spacing: 0.08em;
  opacity: 0.55;
  margin: 0 0 0.5rem;
}

.site-error__title {
  font-size: 1.5rem;
  margin: 0 0 0.75rem;
}

.site-error__text {
  margin: 0 0 1.5rem;
  opacity: 0.8;
  line-height: 1.6;
}

.site-error__link {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0.65rem 1.1rem;
  border-radius: 999px;
  border: 1px solid currentColor;
  text-decoration: none;
  color: inherit;
}
</style>
