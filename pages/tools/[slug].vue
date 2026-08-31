<template>
  <div class="tools-page">
    <div class="tools-background-noise"></div>
    <div class="tools-background-container">
      <div class="tools-background-blob tools-background-blob--orange"></div>
      <div class="tools-background-blob tools-background-blob--red"></div>
      <div class="tools-background-blob tools-background-blob--amber"></div>
    </div>

    <div class="tools-content">
      <nav class="tools-detail-nav">
        <n-breadcrumb>
          <n-breadcrumb-item>
            <NuxtLink to="/work">首页</NuxtLink>
          </n-breadcrumb-item>
          <n-breadcrumb-item>
            <NuxtLink to="/tools">插件工具</NuxtLink>
          </n-breadcrumb-item>
          <n-breadcrumb-item>{{ tool?.name || '...' }}</n-breadcrumb-item>
        </n-breadcrumb>

        <NuxtLink
          to="/tools"
          class="tools-card-button tools-card-button--secondary tools-detail-back"
        >
          <i class="fas fa-arrow-left"></i>
          返回列表
        </NuxtLink>
      </nav>

      <div v-if="loading" class="tools-loading">
        <div class="tools-loading-spinner"></div>
        <p class="tools-loading-text">正在加载工具详情...</p>
      </div>

      <div v-else-if="tool" class="tools-product-shell">
        <section class="tools-card tools-product-hero">
          <div class="tools-product-media">
            <div v-if="tool.coverImage" class="tools-product-cover">
              <img :src="tool.coverImage" :alt="tool.name" />
            </div>
            <div v-else class="tools-product-cover tools-product-cover--placeholder">
              <div class="tools-product-icon">{{ tool.icon || 'T' }}</div>
              <span>{{ tool.category?.name || '开发工具' }}</span>
            </div>
          </div>

          <div class="tools-product-summary">
            <div class="tools-product-topline">
              <span class="tools-detail-kicker">精选工具</span>
              <div class="tools-product-version">
                <span>{{ tool.category?.icon || '●' }} {{ tool.category?.name || '插件工具' }}</span>
                <span>v{{ tool.version || '1.0.0' }}</span>
              </div>
            </div>

            <h1 class="tools-card-title tools-product-title">{{ tool.name }}</h1>
            <p class="tools-card-description tools-product-description">{{ tool.description }}</p>

            <div class="tools-product-rating-grid">
              <article class="tools-product-metric">
                <span class="tools-product-metric-label">评分</span>
                <strong>{{ formatMetric(tool.rating, 1) }}</strong>
                <small>{{ tool.ratingCount || 0 }} 条评价</small>
              </article>
              <article class="tools-product-metric">
                <span class="tools-product-metric-label">购买</span>
                <strong>{{ tool.purchaseCount || 0 }}</strong>
                <small>累计获取</small>
              </article>
              <article class="tools-product-metric">
                <span class="tools-product-metric-label">使用</span>
                <strong>{{ tool.useCount || 0 }}</strong>
                <small>活跃使用记录</small>
              </article>
            </div>

            <div v-if="tool.tags?.length" class="tools-card-tags tools-product-tags">
              <span v-for="tag in tool.tags" :key="tag" class="tools-card-tag">{{ tag }}</span>
            </div>
          </div>

          <aside class="tools-product-purchase">
            <div class="tools-product-price-head">
              <span class="tools-detail-kicker tools-detail-kicker--soft">获取方式</span>
              <div class="tools-card-price tools-product-price">
                <span class="tools-card-price-current">{{ priceLabel }}</span>
                <span
                  v-if="!tool.isFree && tool.originalPrice"
                  class="tools-card-price-original"
                >
                  ￥{{ tool.originalPrice }}
                </span>
                <span
                  v-else-if="tool.isFree"
                  class="tools-card-price-original tools-card-price-original--free"
                >
                  直接领取
                </span>
              </div>
            </div>

            <p class="tools-product-price-note">
              {{ acquisitionHint }}
            </p>

            <div class="tools-product-actions">
              <button
                class="tools-card-button tools-card-button--primary"
                :disabled="purchasing || hasPurchased"
                @click="handlePurchase"
              >
                <i class="fas fa-bolt"></i>
                {{ primaryActionLabel }}
              </button>

              <a
                v-if="tool.demoUrl"
                :href="tool.demoUrl"
                target="_blank"
                rel="noopener noreferrer"
                class="tools-card-button tools-card-button--secondary"
              >
                <i class="fas fa-arrow-up-right-from-square"></i>
                在线演示
              </a>

              <button
                v-if="tool.apiEndpoint"
                class="tools-card-button tools-card-button--secondary"
                @click="showApiDocs = true"
              >
                <i class="fas fa-code"></i>
                API 文档
              </button>
            </div>

            <div class="tools-product-meta-list">
              <div class="tools-product-meta-row">
                <span>作者</span>
                <strong>{{ tool.author || '溪午听风' }}</strong>
              </div>
              <div class="tools-product-meta-row">
                <span>接口</span>
                <strong>{{ tool.apiEndpoint ? '开放支持' : '无接口依赖' }}</strong>
              </div>
              <div class="tools-product-meta-row">
                <span>适合阶段</span>
                <strong>{{ tool.isFree ? '可立即体验' : '适合正式接入' }}</strong>
              </div>
            </div>
          </aside>
        </section>

        <div class="tools-product-section-grid">
          <section class="tools-card tools-product-section tools-product-section--wide">
            <div class="tools-detail-panel-head">
              <div>
                <span class="tools-detail-kicker tools-detail-kicker--soft">详细介绍</span>
                <h2 class="tools-card-title tools-detail-section-title">功能说明与使用场景</h2>
              </div>
            </div>

            <div
              v-if="tool.detailedDescription || tool.description"
              class="prose-content"
              v-html="markdownToHtml(tool.detailedDescription || tool.description || '')"
            ></div>
            <div v-else class="tools-detail-empty">当前还没有补充更详细的说明内容。</div>
          </section>

          <section class="tools-card tools-product-section">
            <div class="tools-detail-panel-head tools-detail-panel-head--compact">
              <div>
                <span class="tools-detail-kicker tools-detail-kicker--soft">快速判断</span>
                <h2 class="tools-card-title tools-detail-section-title">适合什么场景</h2>
              </div>
            </div>

            <div class="tools-detail-fit-list">
              <article class="tools-detail-fit-card tools-detail-fit-card--positive">
                <h4>
                  <i class="fas fa-check-circle"></i>
                  推荐场景
                </h4>
                <p>{{ suitableSummary }}</p>
              </article>
              <article class="tools-detail-fit-card">
                <h4>
                  <i class="fas fa-compass"></i>
                  使用建议
                </h4>
                <p>{{ usageSuggestion }}</p>
              </article>
            </div>
          </section>

          <section
            v-if="tool.features?.length"
            class="tools-card tools-product-section tools-product-section--wide"
          >
            <div class="tools-detail-panel-head tools-detail-panel-head--compact">
              <div>
                <span class="tools-detail-kicker tools-detail-kicker--soft">功能亮点</span>
                <h2 class="tools-card-title tools-detail-section-title">这款工具能直接带来的能力</h2>
              </div>
            </div>

            <div class="tools-product-feature-grid">
              <article
                v-for="feature in tool.features"
                :key="feature"
                class="tools-product-feature-item"
              >
                <i class="fas fa-check"></i>
                <span>{{ feature }}</span>
              </article>
            </div>
          </section>

          <section
            v-if="tool.requirements"
            class="tools-card tools-product-section"
          >
            <div class="tools-detail-panel-head tools-detail-panel-head--compact">
              <div>
                <span class="tools-detail-kicker tools-detail-kicker--soft">接入要求</span>
                <h2 class="tools-card-title tools-detail-section-title">使用前准备</h2>
              </div>
            </div>

            <div class="prose-content" v-html="markdownToHtml(tool.requirements)"></div>
          </section>
        </div>
      </div>
    </div>

    <div
      v-if="showApiDocs"
      class="tools-product-modal"
      @click.self="showApiDocs = false"
    >
      <div class="tools-product-modal-card">
        <div class="tools-product-modal-head">
          <div>
            <span class="tools-detail-kicker tools-detail-kicker--soft">开放接口</span>
            <h2 class="tools-card-title tools-detail-section-title">API 文档</h2>
          </div>
          <button class="tools-product-modal-close" @click="showApiDocs = false">
            <i class="fas fa-xmark"></i>
          </button>
        </div>

        <div v-if="tool?.apiDocumentation" class="tools-product-api-doc">
          <pre><code>{{ formatApiDoc(tool.apiDocumentation) }}</code></pre>
        </div>
        <div v-else class="tools-detail-empty">当前没有可展示的 API 文档内容。</div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import MarkdownIt from 'markdown-it';
import {
  NBreadcrumb,
  NBreadcrumbItem,
  NButton,
} from 'naive-ui';
import { useNotification } from '~/composables/useToast';
import { fetchBackendApi, isNotFoundError } from '~/composables/useBackendFetch';
import { usePageSeo, useJsonLd } from '~/composables/usePageSeo';

const route = useRoute();
const api = useApi();
const { success, warning, error: showError } = useNotification();

interface ToolCategory {
  name: string
  slug: string
  icon?: string
}

interface Tool {
  id: number
  name: string
  slug: string
  icon?: string
  description?: string
  detailedDescription?: string
  coverImage?: string
  demoUrl?: string
  price: number
  originalPrice?: number
  isFree: boolean
  purchaseCount: number
  useCount: number
  rating: number
  ratingCount: number
  apiEndpoint?: string
  apiDocumentation?: string
  requirements?: string
  version: string
  author?: string
  category?: ToolCategory
  tags: string[]
  features: string[]
}

const md = new MarkdownIt({
  html: true,
  linkify: true,
  typographer: true
});

const tool = ref<Tool | null>(null);
const loading = ref(true);
const purchasing = ref(false);
const hasPurchased = ref(false);
const showApiDocs = ref(false);

const slug = String(route.params.slug || '');

const { data: toolData, pending, error: fetchError } = await useAsyncData(
  `tool-${slug}`,
  async () => {
    try {
      // PRIMARY: exact slug lookup
      try {
        const bySlug = await fetchBackendApi<Tool>(`/Toolbox/by-slug/${slug}`)
        if (bySlug) return bySlug
      } catch (slugErr: any) {
        if (!isNotFoundError(slugErr) && slugErr?.statusCode !== 404) {
          throw slugErr
        }
      }

      // COMPAT: older backends without by-slug — marketplace + exact match
      const res = await fetchBackendApi<any>(`/Toolbox/marketplace`, {
        query: { search: slug },
      });

      const toolsList = res?.tools || res?.Tools || (Array.isArray(res) ? res : []);
      const matchedTool = toolsList.find((item: any) => (item.slug || item.Slug) === slug);
      if (!matchedTool) {
        throw createError({ statusCode: 404, statusMessage: 'Not Found' });
      }

      const id = matchedTool.id ?? matchedTool.Id;
      const detailRes = await fetchBackendApi<Tool>(`/Toolbox/${id}`);
      if (!detailRes) {
        throw createError({ statusCode: 404, statusMessage: 'Not Found' });
      }
      return detailRes;
    } catch (err: any) {
      if (isNotFoundError(err) || err?.statusCode === 404) {
        throw createError({ statusCode: 404, statusMessage: 'Not Found' });
      }
      throw createError({ statusCode: 502, statusMessage: 'Upstream error' });
    }
  },
);

if (fetchError.value && isNotFoundError(fetchError.value)) {
  throw createError({ statusCode: 404, statusMessage: 'Not Found' });
}

if (!toolData.value && !pending.value) {
  throw createError({ statusCode: 404, statusMessage: 'Not Found' });
}

tool.value = toolData.value;
loading.value = pending.value;

watch(pending, (v) => { loading.value = v; });
watch(toolData, (v) => { tool.value = v; }, { immediate: true });

const priceLabel = computed(() => {
  if (!tool.value) return '￥0';
  return tool.value.isFree ? '免费' : `￥${tool.value.price}`;
});

const primaryActionLabel = computed(() => {
  if (!tool.value) return '立即获取';
  if (hasPurchased.value) return '已获取';
  return tool.value.isFree ? '免费获取' : '立即购买';
});

const acquisitionHint = computed(() => {
  if (!tool.value) return '';
  if (hasPurchased.value) return '你已经获取过这款工具，可以继续使用或查看接口说明。';
  return tool.value.isFree
    ? '这款工具可直接领取体验，适合先验证能力与使用流程。'
    : '适合明确需求后正式接入，若需要更多信息可以先查看演示或文档。';
});

const suitableSummary = computed(() => {
  if (!tool.value) return '';
  if (tool.value.features?.length) {
    return `适合需要 ${tool.value.features.slice(0, 3).join('、')} 等能力的项目或个人场景。`;
  }
  return '适合想快速提升效率、减少重复操作并尽快验证方案可行性的使用场景。';
});

const usageSuggestion = computed(() => {
  if (!tool.value) return '';
  return tool.value.requirements
    ? '建议先阅读接入要求，再决定直接获取、试用演示或结合接口文档进行二次集成。'
    : '建议先从核心功能开始验证效果，再逐步接入到日常工作流或正式项目中。';
});

const checkPurchaseStatus = async () => {
  const visitorId = import.meta.client ? localStorage.getItem('visitor_id') : null;
  if (!visitorId || !tool.value) return;

  try {
    const res = await api.post('/Toolbox/my-tools', { userId: visitorId });
    if (Array.isArray(res)) {
      hasPurchased.value = res.some((item: any) => item.tool.id === tool.value?.id);
    }
  } catch (err) {
    console.error('检查购买状态失败', err);
  }
};

const handlePurchase = async () => {
  if (!tool.value || purchasing.value || hasPurchased.value) return;

  const visitorId = localStorage.getItem('visitor_id');
  if (!visitorId) {
    warning('请先登录后再获取工具');
    return;
  }

  purchasing.value = true;
  try {
    const res = await api.post('/Toolbox/purchase', {
      toolId: tool.value.id,
      userId: visitorId,
      purchaseType: 'one_time'
    });

    if (res) {
      hasPurchased.value = true;
      success(tool.value.isFree ? '工具已加入我的工具' : '购买成功，请完成后续支付或授权流程');
    }
  } catch (err) {
    console.error('购买失败', err);
    showError('购买失败，请稍后重试');
  } finally {
    purchasing.value = false;
  }
};

const markdownToHtml = (markdown: string) => {
  if (!markdown) return '';
  return md.render(markdown);
};

const formatMetric = (value?: number, digits = 0) => {
  const safeValue = Number.isFinite(value) ? Number(value) : 0;
  return safeValue.toFixed(digits);
};

const formatApiDoc = (value?: string) => {
  if (!value) return '';

  try {
    return JSON.stringify(JSON.parse(value), null, 2);
  } catch {
    return value;
  }
};

onMounted(() => {
  checkPurchaseStatus();
});

usePageSeo(() => ({
  title: tool.value ? `${tool.value.name} - 插件工具` : '工具详情 - 溪午听风',
  description: tool.value?.description || '溪午听风的插件与工具详情。',
  path: `/tools/${slug}`,
  image: tool.value?.coverImage || null,
  world: 'work',
}));

useJsonLd(() => {
  if (!tool.value) return null;
  return {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: tool.value.name,
    description: tool.value.description || undefined,
    applicationCategory: 'DeveloperApplication',
    operatingSystem: 'Any',
    offers: {
      '@type': 'Offer',
      price: tool.value.isFree ? '0' : String(tool.value.price ?? 0),
      priceCurrency: 'CNY',
    },
  };
});
</script>

<style scoped>
:deep(.n-breadcrumb-item .n-breadcrumb-item__link) {
  display: contents;
}

:deep(.n-breadcrumb-item .n-breadcrumb-item__separator) {
  color: #64748b;
}

:deep(.n-breadcrumb a) {
  color: #94a3b8;
  transition: color 0.2s;
}

:deep(.n-breadcrumb a:hover) {
  color: #f1f5f9;
}

:deep(.n-breadcrumb .n-breadcrumb-item:last-child .n-breadcrumb-item__link) {
  color: #f8fafc;
  font-weight: 600;
}

:deep(.n-result .n-result-header__title) {
  color: white;
}

:deep(.n-result .n-result-header__description) {
  color: #94a3b8;
}

.prose-content {
  color: #cbd5e1;
  line-height: 1.8;
}

:deep(.prose-content h1),
:deep(.prose-content h2),
:deep(.prose-content h3),
:deep(.prose-content h4) {
  color: #f1f5f9;
  font-weight: 700;
  margin-bottom: 1rem;
  border-bottom: 1px solid #334155;
  padding-bottom: 0.5rem;
}

:deep(.prose-content h2) {
  margin-top: 2rem;
}

:deep(.prose-content h3) {
  margin-top: 1.5rem;
}

:deep(.prose-content p) {
  margin-bottom: 1rem;
}

:deep(.prose-content ul),
:deep(.prose-content ol) {
  padding-left: 1.5rem;
  margin-bottom: 1rem;
}

:deep(.prose-content li::marker) {
  color: #64748b;
}

:deep(.prose-content a) {
  color: #fb923c;
  text-decoration: none;
  transition: color 0.2s, border-bottom 0.2s;
  border-bottom: 1px solid transparent;
}

:deep(.prose-content a:hover) {
  color: #fdba74;
  border-bottom-color: #fdba74;
}

:deep(.prose-content blockquote) {
  border-left: 4px solid #f97316;
  background-color: rgba(15, 23, 42, 0.5);
  padding: 0.5rem 1rem;
  margin: 1rem 0;
  color: #94a3b8;
  border-radius: 0 8px 8px 0;
}

:deep(.prose-content code) {
  background-color: #334155;
  color: #e2e8f0;
  padding: 0.2em 0.4em;
  border-radius: 4px;
  font-size: 0.9em;
}

:deep(.prose-content pre) {
  background-color: #0f172a;
  border: 1px solid #334155;
  border-radius: 12px;
  padding: 1rem;
  overflow-x: auto;
}

:deep(.prose-content pre code) {
  background-color: transparent;
  padding: 0;
  border: none;
}
</style>
