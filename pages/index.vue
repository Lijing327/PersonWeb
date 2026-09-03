<template>
  <main class="portal-page">
    <div class="portal-atmosphere" aria-hidden="true">
      <span class="portal-atmosphere-orb portal-atmosphere-orb--life"></span>
      <span class="portal-atmosphere-orb portal-atmosphere-orb--work"></span>
      <span class="portal-atmosphere-grid"></span>
    </div>

    <header class="portal-header">
      <NuxtLink to="/" class="portal-brand" aria-label="溪午听风入口首页">
        <SiteBrandLogo variant="full" />
      </NuxtLink>
      <p class="portal-header-note">SELECT A WORLD</p>
    </header>

    <section class="portal-content" aria-labelledby="portal-title">
      <div class="portal-intro">
        <p class="portal-eyebrow">访客留声</p>
        <h1 id="portal-title">路过的人，留下过这些话。</h1>
        <p>选一边进入生活或工作；留言审核通过后会出现在这里。</p>
        <div class="portal-danmaku-stage" aria-hidden="true">
          <ClientOnly>
            <VisitorDanmakuWall variant="embedded" />
          </ClientOnly>
        </div>
        <ClientOnly>
          <PortalVisitorMessage />
        </ClientOnly>
      </div>

      <div class="portal-choices">
        <NuxtLink to="/life" class="portal-choice portal-choice--life">
          <span class="portal-choice-glow" aria-hidden="true"></span>
          <span class="portal-choice-topline"><span>01</span><span>LIFE</span></span>
          <span class="portal-choice-icon" aria-hidden="true">
            <svg viewBox="0 0 48 48">
              <path d="M24 7v5M24 36v5M7 24h5M36 24h5M12 12l3.6 3.6M32.4 32.4 36 36M36 12l-3.6 3.6M15.6 32.4 12 36" />
              <circle cx="24" cy="24" r="8" />
            </svg>
          </span>
          <span class="portal-choice-copy">
            <strong>进入生活</strong>
            <small>日常、感受、阅读与远方</small>
          </span>
          <span class="portal-choice-action">去生活里看看<span aria-hidden="true">↗</span></span>
        </NuxtLink>

        <NuxtLink to="/work" class="portal-choice portal-choice--work">
          <span class="portal-choice-glow" aria-hidden="true"></span>
          <span class="portal-choice-topline"><span>02</span><span>WORK</span></span>
          <span class="portal-choice-icon" aria-hidden="true">
            <svg viewBox="0 0 48 48">
              <rect x="8" y="11" width="32" height="26" rx="4" />
              <path d="M17 18l6 6-6 6M27 30h7" />
            </svg>
          </span>
          <span class="portal-choice-copy">
            <strong>进入工作</strong>
            <small>AI 产品、项目与持续创造</small>
          </span>
          <span class="portal-choice-action">查看正在创造的事<span aria-hidden="true">↗</span></span>
        </NuxtLink>
      </div>
    </section>

    <footer class="portal-footer">
      <span>© {{ currentYear }} 溪午听风</span>
      <span class="portal-footer-divider" aria-hidden="true"></span>
      <span>认真生活，持续创造</span>
    </footer>
  </main>
</template>

<script setup lang="ts">
import { defineAsyncComponent } from 'vue'
import '~/assets/css/portal.css'
import SiteBrandLogo from '~/components/layout/SiteBrandLogo.vue'
import { usePageSeo, useJsonLd, toAbsoluteUrl } from '~/composables/usePageSeo'

definePageMeta({ layout: false })

const VisitorDanmakuWall = defineAsyncComponent(() => import('~/components/VisitorDanmakuWall.vue'))
const PortalVisitorMessage = defineAsyncComponent(() => import('~/components/PortalVisitorMessage.vue'))
const currentYear = new Date().getFullYear()

usePageSeo({
  title: '溪午听风 - 生活与工作',
  description: '从这里进入生活，或进入工作与创造。',
  path: '/',
  world: 'portal',
})

useJsonLd(() => ({
  '@context': 'https://schema.org',
  '@type': 'WebSite',
  name: '溪午听风',
  url: toAbsoluteUrl('/'),
  description: '从这里进入生活，或进入工作与创造。',
}))
</script>
