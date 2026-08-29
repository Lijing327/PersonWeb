<template>
  <div class="home-page public-site-shell">
    <header class="home-header">
      <div class="home-header-inner">
        <NuxtLink to="/work" class="home-brand" aria-label="溪午听风工作站首页">
          <SiteBrandLogo variant="favicon" />
          <span class="home-brand-text">
            <strong>溪午听风</strong>
            <small>个人数字资产 | AI 产品实验室</small>
          </span>
        </NuxtLink>

        <nav class="home-nav" aria-label="首页导航">
          <NuxtLink v-for="item in navItems" :key="item.href" :to="item.href" :class="{ 'is-active': activeNav === item.key }">
            {{ item.label }}
          </NuxtLink>
          <NavMoreMenu variant="home" />
        </nav>

        <div class="home-header-actions">
          <div class="home-nav-compact">
            <NavMoreMenu variant="home" label="菜单" :primary-items="homePrimaryForMenu" />
          </div>
          <NuxtLink to="/search" class="home-icon-button" aria-label="搜索">
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M10.8 4.2a6.6 6.6 0 1 0 4.12 11.76l3.55 3.55a1 1 0 0 0 1.42-1.42l-3.55-3.55A6.6 6.6 0 0 0 10.8 4.2Zm0 2a4.6 4.6 0 1 1 0 9.2 4.6 4.6 0 0 1 0-9.2Z" />
            </svg>
          </NuxtLink>
          <NuxtLink to="/contact" class="home-platform-button">
            联系合作
            <span aria-hidden="true">→</span>
          </NuxtLink>
        </div>
      </div>
    </header>

    <main>
      <HomeHero
        :stats="overview.stats"
        :loading="loading"
      />
      <HomeProducts
        :projects="overview.featuredProjects"
        :loading="loading"
      />
      <HomeTimeline
        :featured-article="overview.featuredArticle"
        :articles="overview.latestArticles"
        :loading="loading"
      />
      <HomeAbout
        :journey="overview.journey"
        :loading="loading"
      />
      <LazyHomeCTA />
      <LazyHomeBuilding
        :projects="overview.nowBuilding"
        :loading="loading"
      />
    </main>

    <footer class="home-footer">
      <div class="home-shell home-footer-inner">
        <div class="home-footer-brand">
          <SiteBrandLogo variant="favicon" />
          <div>
            <strong>溪午听风</strong>
            <p>专注 AI 应用、个人产品与数字资产构建。</p>
          </div>
        </div>
        <div class="home-footer-links">
          <a href="https://github.com/Lijing327" target="_blank" rel="noreferrer">GitHub</a>
          <NuxtLink to="/contact">微信</NuxtLink>
          <a href="mailto:linxiwanting@gmail.com">邮箱</a>
          <span>ICP备案：闽ICP备2022001234号-1</span>
        </div>
      </div>
    </footer>
  </div>
</template>

<script setup lang="ts">
import NavMoreMenu from '~/components/layout/NavMoreMenu.vue'
import SiteBrandLogo from '~/components/layout/SiteBrandLogo.vue'

definePageMeta({
  layout: false
})

const { overview, loading } = useHomeOverview()

const activeNav = ref('home')

const navItems = [
  { label: '首页', href: '/work', key: 'home' },
  { label: '产品', href: '/products', key: 'products' },
  { label: '案例', href: '/projects', key: 'projects' },
  { label: 'AI实验室', href: '/lab', key: 'lab' },
  { label: '文章', href: '/blog', key: 'blog' },
  { label: '关于', href: '/about', key: 'about' },
]

const homePrimaryForMenu = computed(() =>
  navItems.map((item) => ({ label: item.label, href: item.href })),
)

onMounted(() => {
  const sections = [
    { id: 'products', key: 'products' },
    { id: 'writing', key: 'blog' },
    { id: 'about', key: 'about' },
    { id: 'contact', key: 'about' },
    { id: 'building', key: 'about' }
  ]

  const updateActiveNav = () => {
    const viewportLine = window.scrollY + window.innerHeight * 0.42
    let current: (typeof sections)[number] | undefined

    for (let index = sections.length - 1; index >= 0; index -= 1) {
      const section = sections[index]
      const element = document.getElementById(section.id)
      if (element && element.offsetTop <= viewportLine) {
        current = section
        break
      }
    }

    activeNav.value = current?.key ?? 'home'
  }

  updateActiveNav()
  window.addEventListener('scroll', updateActiveNav, { passive: true })
  window.addEventListener('resize', updateActiveNav)

  onBeforeUnmount(() => {
    window.removeEventListener('scroll', updateActiveNav)
    window.removeEventListener('resize', updateActiveNav)
  })
})

useHead({
  title: '溪午听风 - 用 AI 构建产品，创造长期价值',
  meta: [
    {
      key: 'description',
      name: 'description',
      content: '溪午听风的个人品牌官网，专注 AI 应用开发、企业数字化与个人产品构建，持续打造真正有价值的数字资产。'
    },
    { name: 'theme-color', content: '#081631' }
  ]
})
</script>

<style scoped>
.home-page {
  --home-bg: var(--color-bg);
  --home-hero-bg: #07152f;
  --home-hero-frame-top: rgba(12, 31, 72, 0.94);
  --home-hero-frame-bottom: rgba(7, 18, 45, 0.96);
  --home-card: rgba(93, 126, 215, 0.12);
  --home-card-hover: rgba(111, 145, 235, 0.17);
  --home-border: var(--site-shell-border-soft);
  --home-border-strong: var(--site-shell-border-strong);
  --home-text-main: var(--color-text);
  --home-text-muted: rgba(227, 235, 255, 0.76);
  --home-text-soft: rgba(227, 235, 255, 0.58);
  --home-accent: #91aaff;
  --home-radius: var(--radius-lg);
  --home-radius-lg: var(--radius-xl);
  --home-shadow-soft: var(--shadow-card);
  --home-shadow-glow: var(--shadow-glow);
  min-height: 100vh;
  color: var(--home-text-main);
  overflow: hidden;
}

.home-page :global(a) {
  color: inherit;
  text-decoration: none;
}

.home-page :deep(.home-shell) {
  width: min(100% - 2rem, var(--space-container));
  margin-inline: auto;
}

.home-header {
  position: fixed;
  top: 1.7rem;
  left: 0;
  right: 0;
  z-index: 1000;
  height: 96px;
  pointer-events: none;
}

.home-header-inner {
  width: min(100% - 4.8rem, 1840px);
  height: 96px;
  display: grid;
  grid-template-columns: auto minmax(0, 1fr) auto;
  align-items: center;
  gap: 2rem;
  margin-inline: auto;
  padding: 0 2.45rem 0 3.15rem;
  border: 1px solid var(--home-border);
  border-radius: 1.85rem 1.85rem 0 0;
  background: rgba(8, 21, 49, 0.68);
  backdrop-filter: blur(22px);
  -webkit-backdrop-filter: blur(22px);
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.06);
  pointer-events: auto;
  will-change: transform;
}

@media (prefers-reduced-motion: reduce) {
  .home-header-inner {
    backdrop-filter: none;
    -webkit-backdrop-filter: none;
    background: rgba(8, 21, 49, 0.94);
  }
}

.home-brand,
.home-footer-brand {
  display: inline-flex;
  align-items: center;
  gap: 0.8rem;
  min-width: 0;
}

.home-brand-text {
  display: grid;
  gap: 0.18rem;
}

.home-brand-text strong,
.home-footer-brand strong {
  color: var(--home-text-main);
  font-size: 1.14rem;
  font-weight: 780;
  line-height: 1;
}

.home-brand-text small {
  color: var(--home-text-soft);
  font-size: 0.76rem;
  white-space: nowrap;
}

.home-nav {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: clamp(1.45rem, 3.6vw, 3.8rem);
}

.home-nav a {
  position: relative;
  min-width: 4.6rem;
  padding: 1rem 0;
  color: var(--home-text-muted);
  text-align: center;
  font-size: 0.96rem;
  transition: color 0.22s ease, background 0.22s ease;
}

.home-nav a:hover,
.home-nav a.is-active {
  color: var(--home-text-main);
}

.home-nav a.is-active {
  border-radius: 0.7rem;
  background: linear-gradient(180deg, rgba(67, 103, 255, 0.12), rgba(67, 103, 255, 0.02));
}

.home-nav a.is-active::after {
  content: '';
  position: absolute;
  left: 1.55rem;
  right: 1.55rem;
  bottom: 0.72rem;
  height: 2px;
  background: #8ea0ff;
  box-shadow: 0 0 16px rgba(126, 148, 255, 0.86);
}

.home-header-actions {
  display: flex;
  align-items: center;
  gap: 0.55rem;
}

.home-nav-compact {
  display: none;
}

.home-icon-button,
.home-platform-button,
:deep(.home-button) {
  min-height: 3rem;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  border: 1px solid var(--home-border);
  border-radius: 999px;
  color: var(--home-text-main);
  background: rgba(255, 255, 255, 0.04);
  transition: transform 0.24s ease, border-color 0.24s ease, background 0.24s ease, box-shadow 0.24s ease;
}

.home-icon-button {
  width: 3rem;
  padding: 0;
}

.home-icon-button svg {
  width: 1.08rem;
  height: 1.08rem;
  fill: currentColor;
}

.home-platform-button,
:deep(.home-button) {
  padding: 0 1.55rem;
  font-size: 0.9rem;
  font-weight: 690;
}

.home-platform-button,
:deep(.home-button-primary) {
  border-color: rgba(112, 157, 255, 0.44);
  background: linear-gradient(135deg, rgba(39, 105, 255, 0.95), rgba(92, 80, 225, 0.92));
  box-shadow: 0 14px 36px rgba(45, 100, 255, 0.25);
}

:deep(.home-button-secondary) {
  color: var(--home-text-muted);
}

.home-icon-button:hover,
.home-platform-button:hover,
:deep(.home-button:hover) {
  transform: translateY(-0.14rem);
  border-color: var(--home-border-strong);
  background: rgba(255, 255, 255, 0.08);
  box-shadow: 0 18px 38px rgba(36, 82, 210, 0.18);
}

.home-section {
  position: relative;
  padding: clamp(5rem, 9vw, 8rem) 0;
}

:deep(.home-section-heading) {
  max-width: 40rem;
  margin-bottom: 2.6rem;
}

:deep(.home-section-kicker) {
  margin: 0;
  color: var(--home-accent);
  font-size: 0.78rem;
  font-weight: 760;
}

:deep(.home-section-heading h2) {
  margin: 0.8rem 0 0;
  color: var(--home-text-main);
  font-size: clamp(2.3rem, 5vw, 4.6rem);
  font-weight: 770;
  line-height: 1.02;
}

:deep(.home-section-heading p:last-child) {
  margin: 1rem 0 0;
  color: var(--home-text-muted);
  font-size: 1.04rem;
  line-height: 1.8;
}

:deep(.home-eyebrow) {
  width: fit-content;
  display: inline-flex;
  align-items: center;
  gap: 0.55rem;
  margin: 0;
  padding: 0.52rem 0.8rem;
  border: 1px solid var(--home-border);
  border-radius: 999px;
  color: var(--home-text-muted);
  background: rgba(255, 255, 255, 0.035);
  font-size: 0.84rem;
}

:deep(.home-eyebrow-dot) {
  width: 0.42rem;
  height: 0.42rem;
  border-radius: 50%;
  background: #38e6a5;
  box-shadow: 0 0 16px rgba(56, 230, 165, 0.72);
}

:deep(.reveal-up) {
  will-change: transform, opacity;
  animation: homeRevealUp 0.8s ease both;
}

:deep(.reveal-delay-1) {
  animation-delay: 0.08s;
}

:deep(.reveal-delay-2) {
  animation-delay: 0.16s;
}

:deep(.reveal-delay-3) {
  animation-delay: 0.24s;
}

:deep(.reveal-delay-4) {
  animation-delay: 0.32s;
}

.home-footer {
  border-top: 1px solid var(--home-border);
  background: rgba(7, 19, 44, 0.66);
}

.home-footer-inner {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 2rem;
  padding: 2rem 0;
}

.home-footer-brand p {
  margin: 0.35rem 0 0;
  color: var(--home-text-soft);
  font-size: 0.9rem;
}

.home-footer-links {
  display: flex;
  flex-wrap: wrap;
  justify-content: flex-end;
  gap: 1rem;
  color: var(--home-text-soft);
  font-size: 0.9rem;
}

.home-footer-links a:hover {
  color: var(--home-text-main);
}

@keyframes homeRevealUp {
  from {
    opacity: 0;
    transform: translateY(1.4rem);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@media (max-width: 1100px) {
  .home-header-inner {
    grid-template-columns: auto auto;
  }

  .home-nav {
    display: none;
  }

  .home-nav-compact {
    display: block;
  }
}

@media (max-width: 680px) {
  .home-header {
    top: 0.65rem;
    height: 72px;
  }

  .home-header-inner {
    width: min(100% - 1rem, var(--space-container));
    height: 72px;
    gap: 0.75rem;
    padding: 0 0.75rem;
    border-radius: 1.25rem;
  }

  .home-brand-text small {
    display: none;
  }

  .home-icon-button {
    display: none;
  }

  .home-footer-inner {
    align-items: flex-start;
    flex-direction: column;
  }

  .home-footer-links {
    justify-content: flex-start;
  }
}
</style>
