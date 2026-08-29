<template>
  <header class="life-header">
    <div class="life-header-inner">
      <NuxtLink to="/life" class="life-header-brand">溪午听风</NuxtLink>

      <nav class="life-header-nav" aria-label="生活站导航">
        <NuxtLink to="/life" :class="{ 'is-active': isHome }">首页</NuxtLink>
        <NuxtLink to="/life/about" :class="{ 'is-active': isAbout }">关于</NuxtLink>
        <NuxtLink to="/life/notes" :class="{ 'is-active': isNotes }">随笔</NuxtLink>
      </nav>

      <nav class="life-header-switch" aria-label="切换站点">
        <NuxtLink to="/work">Work ↗</NuxtLink>
        <NuxtLink to="/">入口</NuxtLink>
      </nav>
    </div>
  </header>
</template>

<script setup lang="ts">
const route = useRoute()

const isHome = computed(() => route.path === '/life')
const isAbout = computed(() => route.path === '/life/about' || route.path.startsWith('/life/about/'))
const isNotes = computed(() => {
  const path = route.path
  if (path === '/life' || path === '/life/about' || path.startsWith('/life/about/')) {
    return false
  }
  return path === '/life/notes' || path.startsWith('/life/notes/') || path.startsWith('/life/')
})
</script>
