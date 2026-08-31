<template>
  <AdminModuleGuard module-key="about">
    <div class="about-page">
      <div class="about-background" aria-hidden="true">
        <div class="about-background-grid"></div>
        <div class="about-background-glow about-background-glow--blue"></div>
        <div class="about-background-glow about-background-glow--violet"></div>
      </div>

      <div class="about-shell">
        <section class="about-hero">
          <div class="about-hero-copy">
            <p class="about-eyebrow">关于我</p>
            <h1 class="about-title">溪午听风</h1>
            <p class="about-subtitle">一个持续构建数字资产的开发者</p>
            <p class="about-description">
              专注于 AI 应用、Web 系统、企业工具和个人数字资产建设，
              我相信技术的价值在于解决真实问题，并通过产品化让更多人受益。
            </p>

            <div class="about-actions">
              <NuxtLink to="/projects" class="about-button about-button--primary">
                查看我的项目
                <i class="fas fa-arrow-right"></i>
              </NuxtLink>
              <NuxtLink to="/products/mindtrace" class="about-button about-button--ghost">
                MindTrace 扩展
              </NuxtLink>
              <NuxtLink to="/products/desktop-pet" class="about-button about-button--ghost">
                桌宠产品
              </NuxtLink>
              <a href="mailto:linxiwanting@gmail.com" class="about-button about-button--ghost">
                联系合作
              </a>
            </div>

            <div class="about-socials" aria-label="社交链接">
              <a
                v-for="social in socialLinks"
                :key="social.name"
                :href="social.link"
                class="about-social-link"
                target="_blank"
                rel="noopener noreferrer"
                :aria-label="social.name"
              >
                <i v-if="social.icon" :class="social.icon"></i>
                <span v-else>{{ social.label }}</span>
              </a>
            </div>
          </div>

          <aside class="about-profile-card">
            <div class="about-avatar">
              <img
                src="/images/avatar.webp"
                alt="溪午听风头像"
                width="160"
                height="160"
                decoding="async"
              />
            </div>
            <h2 class="about-profile-name">溪午听风</h2>
            <p class="about-profile-location">
              <i class="fas fa-map-marker-alt"></i>
              中国 · 深圳
            </p>
            <p class="about-profile-summary">热爱技术，喜欢产品，持续构建中...</p>
            <div class="about-profile-tags">
              <span>AI 应用研发</span>
              <span>独立产品探索者</span>
              <span>Chrome 扩展开发者</span>
              <span>产品化实践</span>
              <span>系统构建者</span>
            </div>
            <div class="about-stats">
              <div v-for="stat in stats" :key="stat.label" class="about-stat">
                <strong>{{ stat.value }}</strong>
                <span>{{ stat.label }}</span>
              </div>
            </div>
          </aside>
        </section>

        <section class="about-panel">
          <div class="about-section-head">
            <h2>我在做什么</h2>
            <p>技术是基础，产品是方向，长期主义是我的选择</p>
          </div>
          <div class="about-focus-grid">
            <article
              v-for="item in focusAreas"
              :key="item.title"
              class="about-focus-card"
            >
              <div class="about-icon" :class="`about-icon--${item.color}`">
                <i :class="item.icon"></i>
              </div>
              <h3>{{ item.title }}</h3>
              <ul>
                <li v-for="point in item.points" :key="point">{{ point }}</li>
              </ul>
            </article>
          </div>
        </section>

        <section class="about-panel about-path-panel">
          <div class="about-section-head">
            <h2>我的能力路径</h2>
            <p>持续学习、实践、迭代，把技术能力转化为可复用的产品资产</p>
          </div>
          <div class="about-path">
            <article
              v-for="(step, index) in pathSteps"
              :key="step.title"
              class="about-path-step"
            >
              <div class="about-path-marker" :class="`about-path-marker--${step.color}`">
                {{ index + 1 }}
              </div>
              <div class="about-path-icon" :class="`about-icon--${step.color}`">
                <i :class="step.icon"></i>
              </div>
              <h3>{{ step.title }}</h3>
              <p>{{ step.desc }}</p>
            </article>
          </div>
        </section>

        <section class="about-panel">
          <div class="about-section-head">
            <h2>代表性项目</h2>
            <p>这些项目代表了我的技术能力和产品思考</p>
          </div>
          <div class="about-project-grid">
            <article
              v-for="project in projects"
              :key="project.title"
              class="about-project-card"
            >
              <div class="about-project-cover" :class="`about-project-cover--${project.color}`">
                <div class="about-project-window">
                  <span></span>
                  <span></span>
                  <span></span>
                </div>
                <div class="about-project-visual">
                  <i :class="project.icon"></i>
                  <div class="about-project-lines">
                    <span></span>
                    <span></span>
                    <span></span>
                  </div>
                </div>
              </div>
              <div class="about-project-body">
                <h3>{{ project.title }}</h3>
                <p>{{ project.desc }}</p>
                <div class="about-project-tags">
                  <span v-for="tag in project.tags" :key="tag">{{ tag }}</span>
                </div>
                <div class="about-project-status" :class="`about-project-status--${project.statusColor}`">
                  <span></span>
                  {{ project.status }}
                </div>
              </div>
            </article>
          </div>
          <div class="about-more-row">
            <NuxtLink to="/projects" class="about-button about-button--ghost">
              查看更多项目
              <i class="fas fa-arrow-right"></i>
            </NuxtLink>
          </div>
        </section>

        <section class="about-panel">
          <div class="about-section-head">
            <h2>我的工作方式</h2>
            <p>我更关注“能落地”的系统，而不是只做演示效果</p>
          </div>
          <div class="about-work-grid">
            <article
              v-for="item in workStyles"
              :key="item.title"
              class="about-work-card"
            >
              <i :class="item.icon"></i>
              <h3>{{ item.title }}</h3>
              <p>{{ item.desc }}</p>
            </article>
          </div>
        </section>

        <section class="about-cta">
          <div class="about-cta-icon">
            <i class="fas fa-paper-plane"></i>
          </div>
          <div class="about-cta-copy">
            <h2>如果你也在做产品、系统或 AI 应用，我们可以聊聊</h2>
            <p>期待与你交流想法，探索合作可能性，一起创造更多价值</p>
          </div>
          <div class="about-cta-actions">
            <NuxtLink to="/projects" class="about-button about-button--light">查看项目</NuxtLink>
            <NuxtLink to="/blog" class="about-button about-button--light">阅读文章</NuxtLink>
            <a href="mailto:linxiwanting@gmail.com" class="about-button about-button--white">联系我</a>
          </div>
        </section>
      </div>
    </div>
  </AdminModuleGuard>
</template>

<script setup lang="ts">
import '~/assets/css/about.css'

definePageMeta({
  layout: 'default'
})

const socialLinks = [
  { name: 'GitHub', icon: 'fab fa-github', label: '', link: 'https://github.com/Lijing327' },
  { name: '知乎', icon: '', label: '知', link: '#' },
  { name: 'Email', icon: 'fas fa-envelope', label: '', link: 'mailto:linxiwanting@gmail.com' }
]

const stats = [
  { value: '5+', label: '项目' },
  { value: '30+', label: '文章' },
  { value: '3', label: '产品' },
  { value: '∞', label: '探索' }
]

const focusAreas = [
  {
    title: 'AI 应用研发',
    icon: 'fas fa-robot',
    color: 'violet',
    points: ['RAG 知识库', '智能问答系统', '企业 AI 助手', '内容生成工具']
  },
  {
    title: 'Web 系统开发',
    icon: 'fas fa-building',
    color: 'blue',
    points: ['Vue / Nuxt / TypeScript', '后台管理系统', '内容管理平台', '数据看板 & 可视化']
  },
  {
    title: '产品化探索',
    icon: 'fas fa-puzzle-piece',
    color: 'emerald',
    points: ['个人品牌平台', 'Chrome Web Store 扩展', 'AI 应用小产品', '桌面宠物产品']
  },
  {
    title: '长期内容积累',
    icon: 'fas fa-box-open',
    color: 'amber',
    points: ['技术文章输出', '产品复盘沉淀', '理财思考记录', '个人成长记录']
  }
]

const pathSteps = [
  {
    title: '软件开发基础',
    desc: '学习编程，掌握主流技术栈，打下扎实的工程基础',
    icon: 'fas fa-code',
    color: 'violet'
  },
  {
    title: '企业系统开发',
    desc: '参与企业项目，理解业务流程，积累大型系统设计与开发经验',
    icon: 'fas fa-building',
    color: 'blue'
  },
  {
    title: 'AI 应用探索',
    desc: '探索 AI 技术与应用场景，构建知识库与智能化应用',
    icon: 'fas fa-brain',
    color: 'cyan'
  },
  {
    title: '个人网站与数字资产',
    desc: '搭建个人品牌网站，沉淀内容，构建数字资产',
    icon: 'fas fa-desktop',
    color: 'emerald'
  },
  {
    title: '产品模块化与商业化',
    desc: '将能力模块化、产品化，探索商业化与变现路径',
    icon: 'fas fa-rocket',
    color: 'amber'
  }
]

const projects = [
  {
    title: '个人品牌基础',
    desc: '基于 Nuxt3 打造的个人品牌官网元项目，文章和产品沉淀。',
    tags: ['Nuxt3', 'TypeScript', 'Tailwind'],
    status: '进行中',
    statusColor: 'active',
    color: 'brand',
    icon: 'fas fa-user-astronaut'
  },
  {
    title: 'AI-Hub 企业知识库助手',
    desc: '基于 RAG 的企业知识库问答系统，支持多源数据接入与智能检索。',
    tags: ['Python', 'FastAPI', 'RAG'],
    status: '进行中',
    statusColor: 'active',
    color: 'ai',
    icon: 'fas fa-brain'
  },
  {
    title: '桌面宠物产品',
    desc: '一款可爱的桌面宠物应用，陪伴你的工作与学习时光。',
    tags: ['Electron', 'Vue', 'TypeScript'],
    status: '开发中',
    statusColor: 'building',
    color: 'pet',
    icon: 'fas fa-paw'
  },
  {
    title: '联谊 / 本地生活平台',
    desc: '本地活动与社交平台，让连接更简单。',
    tags: ['Vue', 'Spring Boot', 'MySQL'],
    status: '规划中',
    statusColor: 'planned',
    color: 'life',
    icon: 'fas fa-heart'
  },
  {
    title: '电商 MVP / 数据看板',
    desc: '电商系统 MVP 与数据可视化看板，支持多维数据分析。',
    tags: ['Vue', 'ECharts', 'Node.js'],
    status: '构建中',
    statusColor: 'active',
    color: 'data',
    icon: 'fas fa-chart-line'
  }
]

const workStyles = [
  {
    title: '先做 PO 可用版本',
    desc: '快速验证想法，聚焦核心价值，先解决主要问题，再优化。',
    icon: 'fas fa-flag'
  },
  {
    title: '再做结构治理',
    desc: '重构代码结构，提升可维护性，为长期迭代打下基础。',
    icon: 'fas fa-sitemap'
  },
  {
    title: '重视数据模型',
    desc: '好的数据模型是系统的基石，设计可扩展、可维护的模型。',
    icon: 'fas fa-database'
  },
  {
    title: '关注真实业务流程',
    desc: '深入理解业务，优化流程体验，让系统真正解决问题。',
    icon: 'fas fa-code-branch'
  },
  {
    title: 'AI 辅助提效',
    desc: '用 AI 提升开发效率，但最终以可维护代码交付。',
    icon: 'fas fa-robot'
  }
]

usePageSeo({
  title: '关于我 - 溪午听风',
  description: '溪午听风：持续构建数字资产的开发者，专注 AI 应用、Web 系统与企业工具。',
  path: '/about',
  type: 'profile',
  world: 'work',
})

useJsonLd(() => ({
  '@context': 'https://schema.org',
  '@type': 'Person',
  name: '溪午听风',
  url: toAbsoluteUrl('/about'),
  jobTitle: '独立开发者',
  description: '持续构建数字资产的开发者，专注 AI 应用、Web 系统与企业工具。',
}))
</script>
