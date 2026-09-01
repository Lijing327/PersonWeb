<template>
  <div class="ai-solutions-page">
    <!-- 背景特效 -->
    <div class="ai-solutions-bg">
      <div class="ai-solutions-bg-gradient-1"></div>
      <div class="ai-solutions-bg-gradient-2"></div>
      <div class="ai-solutions-bg-grid"></div>
    </div>

    <div class="ai-solutions-container">
      <!-- 页面定位（写在页面最顶部） -->
      <div class="ai-solutions-badge">
        <span class="ai-solutions-badge-dot"></span>
        <span>{{ badge.text }}</span>
      </div>

      <!-- 主标题（H1） -->
      <h1 class="ai-solutions-title">
        {{ title }}
      </h1>

      <!-- 副标题（H2） -->
      <h2 class="ai-solutions-subtitle">
        {{ subtitle }}
      </h2>

      <!-- 引导说明（小段文案） -->
      <p class="ai-solutions-description">
        {{ description }}
      </p>

      <div class="ai-solutions-hero-actions">
        <template v-for="action in heroActions" :key="action.label">
          <a
            v-if="action.href"
            :href="action.href"
            class="ai-solutions-hero-link"
            :class="action.variant === 'primary' ? 'ai-solutions-hero-link--primary' : 'ai-solutions-hero-link--secondary'"
          >
            {{ action.label }}
            <i
              :class="action.variant === 'primary' ? 'fas fa-arrow-down' : 'fas fa-arrow-right'"
              aria-hidden="true"
            />
          </a>
          <NuxtLink
            v-else-if="action.to"
            :to="action.to"
            class="ai-solutions-hero-link"
            :class="action.variant === 'primary' ? 'ai-solutions-hero-link--primary' : 'ai-solutions-hero-link--secondary'"
          >
            {{ action.label }}
            <i class="fas fa-arrow-right" aria-hidden="true" />
          </NuxtLink>
        </template>
      </div>

      <!-- 适用场景：先帮助访客判断自己的问题是否适合使用 AI -->
      <section id="scenarios" class="ai-solutions-section">
        <div class="ai-solutions-section-header">
          <h2 class="ai-solutions-section-title">
            <i :class="sectionTitles.scenariosIcon"></i>
            {{ sectionTitles.scenarios }}
          </h2>
          <p class="ai-solutions-section-description">{{ sectionTitles.scenariosNote }}</p>
        </div>

        <div class="ai-solutions-scenarios-grid">
          <article v-for="scenario in scenarios" :key="scenario.id" class="ai-solutions-scenario-card">
            <div class="ai-solutions-scenario-icon">
              <i :class="scenario.icon"></i>
            </div>
            <h3>{{ scenario.title }}</h3>
            <p>{{ scenario.description }}</p>
            <ul>
              <li v-for="example in scenario.examples" :key="example">{{ example }}</li>
            </ul>
          </article>
        </div>
      </section>

      <!-- 可交付的能力 -->
      <section id="capabilities" class="ai-solutions-section">
        <div class="ai-solutions-section-header">
          <h2 class="ai-solutions-section-title">
            <i :class="sectionTitles.capabilitiesIcon"></i>
            {{ sectionTitles.capabilities }}
          </h2>
        </div>

        <div class="ai-solutions-capabilities-grid">
          <div
            v-for="capability in capabilities"
            :key="capability.id"
            class="ai-solutions-capability-card"
          >
            <div class="ai-solutions-capability-icon">
              <i :class="capability.icon"></i>
            </div>
            <h3 class="ai-solutions-capability-title">{{ capability.title }}</h3>
            <ul class="ai-solutions-capability-features">
              <li v-for="feature in capability.features" :key="feature">
                {{ feature }}
              </li>
            </ul>
          </div>
        </div>
      </section>

      <!-- 模块二：代表性 AI 项目（案例） -->
      <section id="projects" class="ai-solutions-section">
        <div class="ai-solutions-section-header">
          <h2 class="ai-solutions-section-title">
            <i :class="sectionTitles.projectsIcon"></i>
            {{ sectionTitles.projects }}
          </h2>
          <p class="ai-solutions-section-description">
            {{ sectionTitles.projectsNote }}
          </p>
        </div>

        <div class="ai-solutions-projects-grid">
          <div
            v-for="project in featuredProjects"
            :key="project.id"
            class="ai-solutions-project-card"
            :class="{ 'ai-solutions-project-card--clickable': project.path }"
            :role="project.path ? 'link' : undefined"
            :tabindex="project.path ? 0 : undefined"
            @click="handleProjectClick(project)"
            @keydown.enter="handleProjectClick(project)"
          >
            <div class="ai-solutions-project-header">
              <div class="ai-solutions-project-icon">
                <i :class="project.icon"></i>
              </div>
              <h3 class="ai-solutions-project-title">{{ project.title }}</h3>
              <span class="ai-solutions-project-status">{{ project.status }}</span>
            </div>
            <p class="ai-solutions-project-description">{{ project.description }}</p>
            <div class="ai-solutions-project-highlights">
              <h4 class="ai-solutions-project-highlights-title">能力亮点：</h4>
              <ul class="ai-solutions-project-highlights-list">
                <li v-for="highlight in project.highlights" :key="highlight">
                  {{ highlight }}
                </li>
              </ul>
            </div>
          </div>
        </div>

        <p class="ai-solutions-projects-note">
          {{ sectionTitles.projectsDescription }}
        </p>
      </section>

      <!-- 模块三：技术栈与架构能力（专业信任） -->
      <section id="tech-stack" class="ai-solutions-section">
        <div class="ai-solutions-section-header">
          <h2 class="ai-solutions-section-title">
            <i :class="sectionTitles.techStackIcon"></i>
            {{ sectionTitles.techStack }}
          </h2>
        </div>

        <div class="ai-solutions-tech-grid">
          <div
            v-for="category in techStackCategories"
            :key="category.name"
            class="ai-solutions-tech-card"
          >
            <div class="ai-solutions-tech-header">
              <i :class="category.icon"></i>
              <h3 class="ai-solutions-tech-title">{{ category.name }}</h3>
            </div>
            <ul class="ai-solutions-tech-list">
              <li v-for="item in category.items" :key="item">
                {{ item }}
              </li>
            </ul>
          </div>
        </div>
      </section>

      <!-- 模块四：合作方式（商业闭环） -->
      <section id="cooperation" class="ai-solutions-section">
        <div class="ai-solutions-section-header">
          <h2 class="ai-solutions-section-title">
            <i :class="sectionTitles.cooperationIcon"></i>
            {{ sectionTitles.cooperation }}
          </h2>
        </div>

        <div class="ai-solutions-cooperation-steps">
          <div
            v-for="(step, index) in cooperationSteps"
            :key="index"
            class="ai-solutions-cooperation-step"
          >
            <div class="ai-solutions-cooperation-step-number">
              {{ `0${index + 1}`.slice(-2) }}
            </div>
            <div class="ai-solutions-cooperation-step-content">
              <h3 class="ai-solutions-cooperation-step-title">{{ step.title }}</h3>
              <p class="ai-solutions-cooperation-step-description">{{ step.description }}</p>
            </div>
          </div>
        </div>
      </section>

      <!-- 模块五：结尾 CTA（非常重要） -->
      <section id="cta" class="ai-solutions-cta">
        <div class="ai-solutions-cta-content">
          <p class="ai-solutions-cta-text" v-html="cta.text"></p>
          <div class="ai-solutions-cta-buttons">
            <NuxtLink :to="cta.primaryButton.path" class="ai-solutions-cta-button ai-solutions-cta-button--primary">
              <span>{{ cta.primaryButton.text }}</span>
              <i :class="cta.primaryButton.icon"></i>
            </NuxtLink>
            <a :href="cta.secondaryButton.anchor" class="ai-solutions-cta-button ai-solutions-cta-button--secondary">
              <span>{{ cta.secondaryButton.text }}</span>
              <i :class="cta.secondaryButton.icon"></i>
            </a>
          </div>
        </div>
      </section>
    </div>
  </div>
</template>

<script setup lang="ts">
import { fetchAiSolutionsData, type FeaturedProject } from '~/composables/useAiSolutionsData'

definePageMeta({
  layout: 'ai'
})

const { data: pageData } = await useAsyncData('work-ai-solutions', () => fetchAiSolutionsData())

if (!pageData.value) {
  throw createError({ statusCode: 500, statusMessage: 'AI solutions content missing' })
}

const badge = computed(() => pageData.value!.badge)
const title = computed(() => pageData.value!.title)
const subtitle = computed(() => pageData.value!.subtitle)
const description = computed(() => pageData.value!.description)
const heroActions = computed(() => pageData.value!.heroActions)
const seo = computed(() => pageData.value!.seo)
const scenarios = computed(() => pageData.value!.scenarios)
const capabilities = computed(() => pageData.value!.capabilities)
const featuredProjects = computed(() => pageData.value!.featuredProjects)
const techStackCategories = computed(() => pageData.value!.techStackCategories)
const cooperationSteps = computed(() => pageData.value!.cooperationSteps)
const cta = computed(() => pageData.value!.cta)
const sectionTitles = computed(() => pageData.value!.sectionTitles)

useHead(() => ({
  title: seo.value.title,
  meta: [
    { name: 'description', content: seo.value.description }
  ]
}))

const router = useRouter()
const isSafeInternalPath = (path?: string | null) => Boolean(path && path.startsWith('/') && !path.startsWith('/api/'))

const handleProjectClick = (project: FeaturedProject) => {
  if (isSafeInternalPath(project.path)) {
    router.push(project.path!)
  }
}
</script>

<style scoped>
.ai-solutions-page {
  position: relative;
  min-height: 100vh;
  background: var(--bg);
  color: var(--text-main);
  padding-top: 100px;
  padding-bottom: 80px;
}

/* 背景特效 */
.ai-solutions-bg {
  position: fixed;
  inset: 0;
  pointer-events: none;
  z-index: 0;
  overflow: hidden;
}

.ai-solutions-bg-gradient-1 {
  position: absolute;
  top: -20%;
  left: -10%;
  width: 600px;
  height: 600px;
  background: radial-gradient(circle, rgba(6, 182, 212, 0.15) 0%, transparent 70%);
  border-radius: 50%;
  filter: blur(80px);
}

.ai-solutions-bg-gradient-2 {
  position: absolute;
  bottom: -20%;
  right: -10%;
  width: 600px;
  height: 600px;
  background: radial-gradient(circle, rgba(139, 92, 246, 0.15) 0%, transparent 70%);
  border-radius: 50%;
  filter: blur(80px);
}

.ai-solutions-bg-grid {
  position: absolute;
  inset: 0;
  background-image: 
    linear-gradient(rgba(6, 182, 212, 0.1) 1px, transparent 1px),
    linear-gradient(90deg, rgba(6, 182, 212, 0.1) 1px, transparent 1px);
  background-size: 40px 40px;
  opacity: 0.3;
}

.ai-solutions-container {
  position: relative;
  z-index: 1;
  max-width: var(--space-container);
  margin: 0 auto;
  padding: 0 24px;
}

/* 页面定位 Badge - 居中 */
.ai-solutions-badge {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  width: fit-content;
  padding: 8px 16px;
  background: rgba(6, 182, 212, 0.1);
  border: 1px solid rgba(6, 182, 212, 0.3);
  border-radius: 999px;
  font-size: 14px;
  color: var(--color-cyan-500);
  margin: 0 auto 24px auto;
}

.ai-solutions-badge-dot {
  width: 8px;
  height: 8px;
  background: var(--color-cyan-500);
  border-radius: 50%;
  animation: pulse 2s infinite;
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}

/* 主标题 - 更醒目，居中 */
.ai-solutions-title {
  font-size: 72px;
  font-weight: 800;
  line-height: 1.1;
  margin: 0 auto 32px auto;
  background: linear-gradient(135deg, var(--color-cyan-500) 0%, var(--color-primary) 50%, var(--color-purple-500) 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  letter-spacing: -0.02em;
  position: relative;
  display: block;
  text-align: center;
}

.ai-solutions-title::after {
  content: '';
  position: absolute;
  bottom: -8px;
  left: 0;
  width: 100%;
  height: 4px;
  background: linear-gradient(90deg, var(--color-cyan-500) 0%, var(--color-purple-500) 100%);
  border-radius: 2px;
  opacity: 0.5;
}

@media (max-width: 768px) {
  .ai-solutions-title {
    font-size: 48px;
  }
}

@media (max-width: 640px) {
  .ai-solutions-title {
    font-size: 36px;
  }
}

/* 副标题 - 更突出，居中 */
.ai-solutions-subtitle {
  font-size: 28px;
  font-weight: 600;
  line-height: 1.5;
  color: var(--text-main);
  margin: 0 auto 32px auto;
  max-width: min(64rem, 100%);
  text-align: center;
}

@media (max-width: 768px) {
  .ai-solutions-subtitle {
    font-size: 22px;
  }
}

@media (max-width: 640px) {
  .ai-solutions-subtitle {
    font-size: 18px;
  }
}

/* 引导说明 - 更突出，居中 */
.ai-solutions-description {
  font-size: 20px;
  line-height: 1.9;
  color: var(--text-secondary);
  max-width: min(64rem, 100%);
  margin: 0 auto 32px auto;
  padding: 32px;
  background: linear-gradient(135deg, rgba(6, 182, 212, 0.05) 0%, rgba(139, 92, 246, 0.05) 100%);
  border: 2px solid;
  border-image: linear-gradient(135deg, var(--color-cyan-500) 0%, var(--color-purple-500) 100%) 1;
  border-radius: 12px;
  text-align: center;
}

.ai-solutions-hero-actions {
  display: flex;
  align-items: center;
  justify-content: center;
  flex-wrap: wrap;
  gap: var(--spacing-md);
  margin-bottom: 120px;
}

.ai-solutions-hero-link {
  min-height: 48px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: var(--spacing-sm);
  padding: 0 var(--spacing-lg);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-pill);
  color: var(--text-main);
  text-decoration: none;
  transition: transform 0.25s ease, border-color 0.25s ease, background 0.25s ease;
}

.ai-solutions-hero-link--primary {
  border-color: var(--color-primary);
  background: var(--color-primary);
  color: var(--color-text-on-primary);
}

.ai-solutions-hero-link--secondary {
  background: var(--color-surface);
}

.ai-solutions-hero-link:hover,
.ai-solutions-hero-link:focus-visible {
  transform: translateY(-3px);
  border-color: var(--color-primary-hover);
  outline: none;
}

/* 场景卡片与能力卡片保持同一页面视觉语言。 */
.ai-solutions-scenarios-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: var(--spacing-lg);
}

.ai-solutions-scenario-card {
  min-width: 0;
  padding: var(--spacing-xl);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  background: var(--color-surface);
  box-shadow: var(--shadow-card);
}

.ai-solutions-scenario-icon {
  width: 52px;
  height: 52px;
  display: grid;
  place-items: center;
  margin-bottom: var(--spacing-lg);
  border-radius: var(--radius-md);
  color: var(--color-primary-hover);
  background: var(--color-primary-soft);
}

.ai-solutions-scenario-card h3 {
  margin: 0 0 var(--spacing-md);
  color: var(--text-main);
  font-size: 20px;
  line-height: 1.4;
}

.ai-solutions-scenario-card p {
  min-height: 5.2em;
  margin: 0 0 var(--spacing-lg);
  color: var(--text-secondary);
  font-size: 14px;
  line-height: 1.75;
}

.ai-solutions-scenario-card ul {
  display: grid;
  gap: var(--spacing-sm);
  margin: 0;
  padding: var(--spacing-lg) 0 0;
  border-top: 1px solid var(--color-border);
  list-style: none;
}

.ai-solutions-scenario-card li {
  position: relative;
  padding-left: var(--spacing-lg);
  color: var(--text-secondary);
  font-size: 13px;
}

.ai-solutions-scenario-card li::before {
  position: absolute;
  left: 0;
  content: '✓';
  color: var(--color-primary-hover);
}

@media (max-width: 1100px) {
  .ai-solutions-scenarios-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 640px) {
  .ai-solutions-hero-actions {
    margin-bottom: 96px;
  }

  .ai-solutions-scenarios-grid {
    grid-template-columns: 1fr;
  }

  .ai-solutions-scenario-card p {
    min-height: 0;
  }
}

@media (max-width: 768px) {
  .ai-solutions-description {
    font-size: 18px;
    padding: 24px;
  }
}

@media (max-width: 640px) {
  .ai-solutions-description {
    font-size: 16px;
    padding: 20px;
  }
}

/* 区块通用样式 */
.ai-solutions-section {
  margin-bottom: 140px;
  position: relative;
}

.ai-solutions-section::before {
  content: '';
  position: absolute;
  top: -60px;
  left: 50%;
  transform: translateX(-50%);
  width: 100px;
  height: 4px;
  background: linear-gradient(90deg, transparent 0%, var(--color-cyan-500) 50%, transparent 100%);
  border-radius: 2px;
  opacity: 0.3;
}

.ai-solutions-section-header {
  text-align: center;
  margin-bottom: 60px;
}

/* 项目区域特殊增强 */
#projects .ai-solutions-section-header {
  margin-bottom: 64px;
}

.ai-solutions-section-title {
  font-size: 42px;
  font-weight: 700;
  margin: 0 0 20px 0;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 16px;
  background: linear-gradient(135deg, var(--color-cyan-500) 0%, var(--color-purple-500) 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.ai-solutions-section-title i {
  background: linear-gradient(135deg, var(--color-cyan-500) 0%, var(--color-purple-500) 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  font-size: 36px;
}

.ai-solutions-section-description {
  font-size: 14px;
  color: var(--text-muted);
  margin: 0;
}

@media (max-width: 640px) {
  .ai-solutions-section-title {
    font-size: 28px;
  }
}

/* 能力展示卡片 - 严格 2x2 布局 */
.ai-solutions-capabilities-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 32px;
  max-width: var(--space-container);
  margin: 0 auto;
}

@media (max-width: 768px) {
  .ai-solutions-capabilities-grid {
    grid-template-columns: 1fr;
    gap: 24px;
  }
}

.ai-solutions-capability-card {
  position: relative;
  padding: 40px;
  background: linear-gradient(135deg, rgba(6, 182, 212, 0.05) 0%, rgba(139, 92, 246, 0.05) 100%);
  border: 2px solid rgba(6, 182, 212, 0.2);
  border-radius: 24px;
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  overflow: hidden;
}

.ai-solutions-capability-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 4px;
  background: linear-gradient(90deg, var(--color-cyan-500) 0%, var(--color-purple-500) 100%);
  transform: scaleX(0);
  transform-origin: left;
  transition: transform 0.4s ease;
}

.ai-solutions-capability-card:hover::before {
  transform: scaleX(1);
}

.ai-solutions-capability-card:hover {
  background: linear-gradient(135deg, rgba(6, 182, 212, 0.1) 0%, rgba(139, 92, 246, 0.1) 100%);
  border-color: rgba(6, 182, 212, 0.5);
  transform: translateY(-8px) scale(1.02);
  box-shadow: 0 20px 40px rgba(6, 182, 212, 0.25), 0 0 0 1px rgba(6, 182, 212, 0.1);
}

.ai-solutions-capability-icon {
  width: 72px;
  height: 72px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, rgba(6, 182, 212, 0.2) 0%, rgba(139, 92, 246, 0.2) 100%);
  border-radius: 20px;
  margin-bottom: 24px;
  position: relative;
  transition: all 0.4s ease;
}

.ai-solutions-capability-card:hover .ai-solutions-capability-icon {
  transform: rotate(5deg) scale(1.1);
  background: linear-gradient(135deg, rgba(6, 182, 212, 0.3) 0%, rgba(139, 92, 246, 0.3) 100%);
  box-shadow: 0 8px 24px rgba(6, 182, 212, 0.3);
}

.ai-solutions-capability-icon i {
  font-size: 32px;
  background: linear-gradient(135deg, var(--color-cyan-500) 0%, var(--color-purple-500) 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.ai-solutions-capability-title {
  font-size: 24px;
  font-weight: 700;
  background: linear-gradient(135deg, var(--color-cyan-500) 0%, var(--color-purple-500) 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  margin: 0 0 20px 0;
  line-height: 1.3;
}

.ai-solutions-capability-features {
  list-style: none;
  padding: 0;
  margin: 0;
}

.ai-solutions-capability-features li {
  font-size: 15px;
  line-height: 1.9;
  color: var(--text-secondary);
  padding-left: 28px;
  position: relative;
  margin-bottom: 12px;
  transition: color 0.3s ease;
}

.ai-solutions-capability-card:hover .ai-solutions-capability-features li {
  color: var(--text-main);
}

.ai-solutions-capability-features li::before {
  content: '✓';
  position: absolute;
  left: 0;
  background: linear-gradient(135deg, var(--color-cyan-500) 0%, var(--color-purple-500) 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  font-weight: bold;
  font-size: 16px;
}

/* 项目案例卡片 - 更突出 */
.ai-solutions-projects-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
  gap: 40px;
  margin-bottom: 40px;
}

.ai-solutions-project-card {
  position: relative;
  padding: 48px;
  background: linear-gradient(135deg, rgba(6, 182, 212, 0.08) 0%, rgba(139, 92, 246, 0.08) 100%);
  border: 2px solid rgba(6, 182, 212, 0.3);
  border-radius: 28px;
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  cursor: default;
  overflow: hidden;
  box-shadow: 0 4px 20px rgba(6, 182, 212, 0.1);
}

.ai-solutions-project-card--clickable {
  cursor: pointer;
}

.ai-solutions-project-card--clickable:focus-visible {
  border-color: var(--color-primary-hover);
  outline: 2px solid var(--color-primary-soft);
  outline-offset: 4px;
}

.ai-solutions-project-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 4px;
  background: linear-gradient(90deg, var(--color-cyan-500) 0%, var(--color-purple-500) 100%);
  transform: scaleX(0);
  transform-origin: left;
  transition: transform 0.4s ease;
}

.ai-solutions-project-card:hover::before {
  transform: scaleX(1);
}

.ai-solutions-project-card:hover {
  background: linear-gradient(135deg, rgba(6, 182, 212, 0.15) 0%, rgba(139, 92, 246, 0.15) 100%);
  border-color: rgba(6, 182, 212, 0.6);
  transform: translateY(-12px) scale(1.03);
  box-shadow: 0 24px 48px rgba(6, 182, 212, 0.35), 0 0 0 1px rgba(6, 182, 212, 0.2);
}

.ai-solutions-project-header {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 16px;
}

.ai-solutions-project-icon {
  width: 80px;
  height: 80px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, rgba(6, 182, 212, 0.25) 0%, rgba(139, 92, 246, 0.25) 100%);
  border-radius: 20px;
  transition: all 0.4s ease;
  box-shadow: 0 4px 16px rgba(6, 182, 212, 0.2);
  border: 2px solid rgba(6, 182, 212, 0.3);
}

.ai-solutions-project-card:hover .ai-solutions-project-icon {
  transform: rotate(8deg) scale(1.15);
  background: linear-gradient(135deg, rgba(6, 182, 212, 0.4) 0%, rgba(139, 92, 246, 0.4) 100%);
  box-shadow: 0 12px 32px rgba(6, 182, 212, 0.4);
  border-color: rgba(6, 182, 212, 0.5);
}

.ai-solutions-project-icon i {
  font-size: 36px;
  background: linear-gradient(135deg, var(--color-cyan-500) 0%, var(--color-primary) 50%, var(--color-purple-500) 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  filter: drop-shadow(0 2px 4px rgba(6, 182, 212, 0.3));
}

.ai-solutions-project-title {
  font-size: 24px;
  font-weight: 800;
  background: linear-gradient(135deg, var(--color-cyan-500) 0%, var(--color-primary) 50%, var(--color-purple-500) 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  margin: 0;
  line-height: 1.3;
  letter-spacing: -0.01em;
}

.ai-solutions-project-status {
  flex: 0 0 auto;
  margin-left: auto;
  padding: var(--spacing-xs) var(--spacing-sm);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-pill);
  color: var(--text-secondary);
  font-size: 12px;
  font-weight: 600;
  white-space: nowrap;
}

.ai-solutions-project-description {
  font-size: 15px;
  line-height: 1.7;
  color: var(--text-main);
  margin: 0 0 24px 0;
  font-weight: 500;
}

.ai-solutions-project-highlights {
  padding-top: 24px;
  border-top: 2px solid;
  border-image: linear-gradient(90deg, rgba(6, 182, 212, 0.3) 0%, rgba(139, 92, 246, 0.3) 100%) 1;
}

.ai-solutions-project-highlights-title {
  font-size: 15px;
  font-weight: 700;
  background: linear-gradient(135deg, var(--color-cyan-500) 0%, var(--color-purple-500) 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  margin: 0 0 16px 0;
}

.ai-solutions-project-highlights-list {
  list-style: none;
  padding: 0;
  margin: 0;
}

.ai-solutions-project-highlights-list li {
  font-size: 14px;
  line-height: 1.7;
  color: var(--text-main);
  padding-left: 24px;
  position: relative;
  margin-bottom: 10px;
  font-weight: 500;
  transition: color 0.3s ease;
}

.ai-solutions-project-card:hover .ai-solutions-project-highlights-list li {
  color: var(--text-main);
}

.ai-solutions-project-highlights-list li::before {
  content: '✓';
  position: absolute;
  left: 0;
  background: linear-gradient(135deg, var(--color-cyan-500) 0%, var(--color-purple-500) 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  font-weight: bold;
  font-size: 16px;
}

.ai-solutions-projects-note {
  text-align: center;
  font-size: 14px;
  color: var(--text-muted);
  margin: 0;
}

/* 技术栈卡片 */
.ai-solutions-tech-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 24px;
}

.ai-solutions-tech-card {
  position: relative;
  padding: 40px;
  background: linear-gradient(135deg, rgba(6, 182, 212, 0.05) 0%, rgba(139, 92, 246, 0.05) 100%);
  border: 2px solid rgba(6, 182, 212, 0.2);
  border-radius: 24px;
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  overflow: hidden;
}

.ai-solutions-tech-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 4px;
  background: linear-gradient(90deg, var(--color-cyan-500) 0%, var(--color-purple-500) 100%);
  transform: scaleX(0);
  transform-origin: left;
  transition: transform 0.4s ease;
}

.ai-solutions-tech-card:hover::before {
  transform: scaleX(1);
}

.ai-solutions-tech-card:hover {
  background: linear-gradient(135deg, rgba(6, 182, 212, 0.1) 0%, rgba(139, 92, 246, 0.1) 100%);
  border-color: rgba(6, 182, 212, 0.5);
  transform: translateY(-8px) scale(1.02);
  box-shadow: 0 20px 40px rgba(6, 182, 212, 0.25);
}

.ai-solutions-tech-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 20px;
}

.ai-solutions-tech-header i {
  font-size: 28px;
  background: linear-gradient(135deg, var(--color-cyan-500) 0%, var(--color-purple-500) 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.ai-solutions-tech-title {
  font-size: 20px;
  font-weight: 700;
  background: linear-gradient(135deg, var(--color-cyan-500) 0%, var(--color-purple-500) 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  margin: 0;
}

.ai-solutions-tech-list {
  list-style: none;
  padding: 0;
  margin: 0;
}

.ai-solutions-tech-list li {
  font-size: 14px;
  line-height: 1.8;
  color: var(--text-secondary);
  padding-left: 20px;
  position: relative;
  margin-bottom: 8px;
}

.ai-solutions-tech-list li::before {
  content: '✓';
  position: absolute;
  left: 0;
  background: linear-gradient(135deg, var(--color-cyan-500) 0%, var(--color-purple-500) 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  font-weight: bold;
  font-size: 16px;
}

/* 合作流程 - 2x2 布局 */
.ai-solutions-cooperation-steps {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 32px;
  max-width: var(--space-container);
  margin: 0 auto;
}

@media (max-width: 768px) {
  .ai-solutions-cooperation-steps {
    grid-template-columns: 1fr;
    gap: 24px;
  }
}

.ai-solutions-cooperation-step {
  position: relative;
  padding: 40px;
  background: linear-gradient(135deg, rgba(6, 182, 212, 0.05) 0%, rgba(139, 92, 246, 0.05) 100%);
  border: 2px solid rgba(6, 182, 212, 0.2);
  border-radius: 24px;
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  overflow: hidden;
}

.ai-solutions-cooperation-step::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 4px;
  background: linear-gradient(90deg, var(--color-cyan-500) 0%, var(--color-purple-500) 100%);
  transform: scaleX(0);
  transform-origin: left;
  transition: transform 0.4s ease;
}

.ai-solutions-cooperation-step:hover::before {
  transform: scaleX(1);
}

.ai-solutions-cooperation-step:hover {
  background: linear-gradient(135deg, rgba(6, 182, 212, 0.1) 0%, rgba(139, 92, 246, 0.1) 100%);
  border-color: rgba(6, 182, 212, 0.5);
  transform: translateY(-8px) scale(1.02);
  box-shadow: 0 20px 40px rgba(6, 182, 212, 0.25);
}

.ai-solutions-cooperation-step-number {
  font-size: 48px;
  margin-bottom: 20px;
  display: inline-block;
  background: linear-gradient(135deg, var(--color-cyan-500) 0%, var(--color-purple-500) 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  font-weight: 700;
  line-height: 1;
}

.ai-solutions-cooperation-step-title {
  font-size: 22px;
  font-weight: 700;
  background: linear-gradient(135deg, var(--color-cyan-500) 0%, var(--color-purple-500) 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  margin: 0 0 12px 0;
  line-height: 1.3;
}

.ai-solutions-cooperation-step-description {
  font-size: 14px;
  line-height: 1.6;
  color: var(--text-secondary);
  margin: 0;
}

/* CTA 区块 - 缩小尺寸 */
.ai-solutions-cta {
  position: relative;
  text-align: center;
  padding: 60px 40px;
  background: linear-gradient(135deg, rgba(6, 182, 212, 0.1) 0%, rgba(139, 92, 246, 0.1) 100%);
  border: 2px solid rgba(6, 182, 212, 0.3);
  border-radius: 24px;
  margin-top: 80px;
  overflow: hidden;
  max-width: 800px;
  margin-left: auto;
  margin-right: auto;
}

.ai-solutions-cta::before {
  content: '';
  position: absolute;
  top: -50%;
  left: -50%;
  width: 200%;
  height: 200%;
  background: radial-gradient(circle, rgba(6, 182, 212, 0.1) 0%, transparent 70%);
  animation: rotate 20s linear infinite;
}

@keyframes rotate {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

.ai-solutions-cta-content {
  position: relative;
  z-index: 1;
  max-width: 700px;
  margin: 0 auto;
}

.ai-solutions-cta-text {
  font-size: 20px;
  font-weight: 500;
  line-height: 1.8;
  color: var(--text-main);
  margin: 0 0 32px 0;
}

@media (max-width: 640px) {
  .ai-solutions-cta-text {
    font-size: 18px;
  }
}

.ai-solutions-cta-buttons {
  display: flex;
  gap: 16px;
  justify-content: center;
  flex-wrap: wrap;
}

.ai-solutions-cta-button {
  display: inline-flex;
  align-items: center;
  gap: 12px;
  padding: 16px 32px;
  border-radius: 12px;
  font-size: 16px;
  font-weight: 600;
  text-decoration: none;
  transition: all 0.3s ease;
  cursor: pointer;
}

.ai-solutions-cta-button--primary {
  background: linear-gradient(135deg, var(--color-cyan-500) 0%, var(--color-primary) 50%, var(--color-purple-500) 100%);
  color: var(--color-text-main);
  box-shadow: 0 8px 24px rgba(6, 182, 212, 0.4);
  border: none;
}

.ai-solutions-cta-button--primary:hover {
  transform: translateY(-4px) scale(1.05);
  box-shadow: 0 12px 32px rgba(6, 182, 212, 0.5);
  background: linear-gradient(135deg, var(--color-cyan-600) 0%, var(--color-primary-hover) 50%, var(--color-purple-600) 100%);
}

.ai-solutions-cta-button--secondary {
  background: linear-gradient(135deg, rgba(15, 23, 42, 0.92) 0%, rgba(30, 41, 59, 0.88) 100%);
  border: 1px solid rgba(148, 163, 184, 0.24);
  color: rgba(248, 250, 252, 0.96);
  box-shadow:
    0 10px 26px rgba(15, 23, 42, 0.26),
    inset 0 1px 0 rgba(255, 255, 255, 0.06);
}

.ai-solutions-cta-button--secondary:hover {
  transform: translateY(-4px);
  background: linear-gradient(135deg, rgba(6, 182, 212, 0.16) 0%, rgba(30, 41, 59, 0.92) 100%);
  border-color: rgba(6, 182, 212, 0.45);
  color: #ffffff;
  box-shadow:
    0 14px 30px rgba(6, 182, 212, 0.2),
    0 0 0 1px rgba(6, 182, 212, 0.1);
}
</style>
