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
          <n-breadcrumb-item>工具合集</n-breadcrumb-item>
        </n-breadcrumb>

        <NuxtLink
          to="/tools"
          class="tools-card-button tools-card-button--secondary tools-detail-back"
        >
          <i class="fas fa-arrow-left"></i>
          返回工具页
        </NuxtLink>
      </nav>

      <header class="tools-header">
        <div class="tools-header-icon">
          <span>📦</span>
        </div>
        <div class="tools-hero-eyebrow">Bundle Collections</div>
        <h1 class="tools-title">工具合集</h1>
        <p class="tools-subtitle">
          把同一类工作流需要的工具整理成专题合集，适合希望一次性配齐能力、快速进入实战的人。
        </p>

        <div class="tools-highlight-list">
          <span class="tools-highlight-pill">前后端成套工具</span>
          <span class="tools-highlight-pill">适合专题式购买</span>
          <span class="tools-highlight-pill">支持按需继续扩展</span>
        </div>
      </header>

      <div class="tools-stats-grid">
        <div
          v-for="stat in collectionStats"
          :key="stat.label"
          class="tools-stat-card"
        >
          <div class="tools-stat-value" :class="stat.valueClass">{{ stat.value }}</div>
          <div class="tools-stat-label">{{ stat.label }}</div>
          <p class="tools-stat-description">{{ stat.description }}</p>
        </div>
      </div>

      <section v-if="featuredCollections.length" class="tools-section">
        <div class="tools-section-head">
          <div>
            <div class="tools-section-kicker">Recommended Bundles</div>
            <h2 class="tools-section-title">优先推荐的专题合集</h2>
          </div>
          <p class="tools-section-description">
            适合明确场景后直接打包获取，比单个工具逐一挑选更省时间。
          </p>
        </div>

        <div class="tools-collection-featured-grid">
          <article
            v-for="collection in featuredCollections"
            :key="collection.id"
            class="tools-collection-card tools-collection-card--featured"
          >
            <div class="tools-collection-card-top">
              <div>
                <span class="tools-detail-kicker">专题推荐</span>
                <h3 class="tools-card-title tools-collection-title">{{ collection.name }}</h3>
              </div>

              <div class="tools-card-price tools-collection-price">
                <span class="tools-card-price-current">￥{{ collection.price }}</span>
                <span
                  v-if="collection.originalPrice"
                  class="tools-card-price-original"
                >
                  ￥{{ collection.originalPrice }}
                </span>
              </div>
            </div>

            <p class="tools-card-description tools-collection-description">
              {{ collection.description }}
            </p>

            <div class="tools-collection-meta">
              <span>包含 {{ collection.toolCount }} 个工具</span>
              <span>{{ collection.purchaseCount }} 次获取</span>
            </div>

            <div class="tools-card-footer">
              <button
                type="button"
                class="tools-card-button tools-card-button--primary"
                @click="handlePurchaseCollection(collection)"
              >
                立即咨询合集
              </button>
            </div>
          </article>
        </div>
      </section>

      <section class="tools-section">
        <div class="tools-section-head">
          <div>
            <div class="tools-section-kicker">All Bundles</div>
            <h2 class="tools-section-title">全部合集</h2>
          </div>
          <p class="tools-section-description">
            按专题整理的工具打包，适合不同开发方向或阶段的能力补齐。
          </p>
        </div>

        <div v-if="loading" class="tools-loading">
          <div class="tools-loading-spinner"></div>
          <p class="tools-loading-text">正在加载合集列表...</p>
        </div>

        <div v-else-if="collections.length === 0" class="tools-empty">
          <div class="tools-empty-icon">📦</div>
          <h3 class="tools-empty-title">暂时还没有可展示的合集</h3>
          <p class="tools-empty-description">
            当前先展示单个工具，后续会继续补充专题打包方案。
          </p>
        </div>

        <div v-else class="tools-collection-grid">
          <article
            v-for="collection in collections"
            :key="collection.id"
            class="tools-collection-card"
          >
            <div class="tools-collection-badge-row">
              <span class="tools-card-category">合集</span>
              <span class="tools-card-slug">{{ collection.slug }}</span>
            </div>

            <div class="tools-collection-card-top">
              <h3 class="tools-card-title tools-collection-title">{{ collection.name }}</h3>
              <div class="tools-card-price tools-collection-price">
                <span class="tools-card-price-current">￥{{ collection.price }}</span>
                <span
                  v-if="collection.originalPrice"
                  class="tools-card-price-original"
                >
                  ￥{{ collection.originalPrice }}
                </span>
              </div>
            </div>

            <p class="tools-card-description tools-collection-description">
              {{ collection.description }}
            </p>

            <div class="tools-highlight-list tools-collection-points">
              <span class="tools-highlight-pill">包含 {{ collection.toolCount }} 个工具</span>
              <span class="tools-highlight-pill">适合专题使用</span>
            </div>

            <div class="tools-card-footer">
              <button
                type="button"
                class="tools-card-button tools-card-button--primary"
                @click="handlePurchaseCollection(collection)"
              >
                获取合集方案
              </button>
            </div>
          </article>
        </div>
      </section>
    </div>
  </div>
</template>

<script setup lang="ts">
import {
  NBreadcrumb,
  NBreadcrumbItem
} from 'naive-ui';
import { useNotification } from '~/composables/useToast';
import '~/assets/css/tools.css'

definePageMeta({
  layout: 'default'
});

interface Collection {
  id: number
  name: string
  slug: string
  description: string
  coverImage?: string
  price: number
  originalPrice?: number
  toolCount: number
  purchaseCount: number
  isFeatured: boolean
}

const api = useApi();
const { success, error, warning, info } = useNotification();
usePageStyle('tools');

const loading = ref(false);
const collections = ref<Collection[]>([]);

const fallbackCollections: Collection[] = [
  {
    id: 1,
    name: '前端开发工具包',
    slug: 'frontend-bundle',
    description: '围绕 Vue、Nuxt、TypeScript 等前端协作场景整理的一组常用开发工具与辅助能力。',
    price: 299,
    originalPrice: 499,
    toolCount: 5,
    purchaseCount: 18,
    isFeatured: true
  },
  {
    id: 2,
    name: '后端开发工具包',
    slug: 'backend-bundle',
    description: '面向接口开发、数据处理和服务端协作的专题合集，适合快速补齐后端工作流。',
    price: 349,
    originalPrice: 599,
    toolCount: 6,
    purchaseCount: 12,
    isFeatured: true
  },
  {
    id: 3,
    name: '全栈开发工具包',
    slug: 'fullstack-bundle',
    description: '适合希望一次性配齐前后端能力的开发者，覆盖从开发到验证的一整套常见场景。',
    price: 599,
    originalPrice: 1098,
    toolCount: 11,
    purchaseCount: 9,
    isFeatured: false
  }
];

const featuredCollections = computed(() => collections.value.filter(item => item.isFeatured));

const collectionStats = computed(() => {
  const total = collections.value.length;
  const featured = featuredCollections.value.length;
  const avgTools = total
    ? Math.round(collections.value.reduce((sum, item) => sum + item.toolCount, 0) / total)
    : 0;

  return [
    {
      value: `${total}`,
      label: '合集数量',
      description: '已整理出的专题打包方案',
      valueClass: ''
    },
    {
      value: `${featured}`,
      label: '推荐合集',
      description: '优先推荐的使用方向',
      valueClass: 'tools-stat-value--accent'
    },
    {
      value: `${avgTools}`,
      label: '平均工具数',
      description: '每个合集的能力密度',
      valueClass: 'tools-stat-value--warm'
    }
  ];
});

const normalizeCollection = (item: Partial<Collection>, index: number): Collection => ({
  id: item.id ?? index + 1,
  name: item.name?.trim() || `工具合集 ${index + 1}`,
  slug: item.slug?.trim() || `collection-${index + 1}`,
  description: item.description?.trim() || '围绕同一专题整理的工具合集，适合快速补齐一整条工作流。',
  coverImage: item.coverImage,
  price: Number(item.price) || 0,
  originalPrice: item.originalPrice ? Number(item.originalPrice) : undefined,
  toolCount: Number(item.toolCount) || 0,
  purchaseCount: Number(item.purchaseCount) || 0,
  isFeatured: Boolean(item.isFeatured)
});

const fetchCollections = async () => {
  loading.value = true;

  try {
    const res = await api.get<Collection[]>('/Toolbox/collections');
    if (Array.isArray(res) && res.length > 0) {
      collections.value = res.map(normalizeCollection);
      return;
    }
  } catch (err) {
    console.error('获取合集列表失败', err);
  } finally {
    loading.value = false;
  }

  collections.value = fallbackCollections;
};

const handlePurchaseCollection = (collection: Collection) => {
  info(`”${collection.name}” 当前以咨询获取为主，我先为你保留这个入口。`);
};

onMounted(() => {
  fetchCollections();
});

useHead({
  title: '工具合集 - 溪午听风',
  meta: [
    { name: 'description', content: '精选工具打包与专题合集，适合一次性补齐工作流能力。' }
  ]
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
</style>
