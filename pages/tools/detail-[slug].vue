<template>
  <div class="tools-page tools-page--detail">
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
          <n-breadcrumb-item>{{ tool?.title || '...' }}</n-breadcrumb-item>
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

      <div v-else-if="error" class="tools-error">
        <n-result
          status="warning"
          title="无法加载工具"
          :description="error || `未找到 slug 为 '${$route.params.slug}' 的工具。`"
        >
          <template #footer>
            <n-button type="primary" @click="router.push('/tools')">返回工具列表</n-button>
          </template>
        </n-result>
      </div>

      <div v-else-if="tool" class="tools-detail-shell">
        <section class="tools-card tools-detail-hero">
          <div class="tools-detail-hero-copy">
            <span class="tools-detail-kicker">工具详情</span>
            <h1 class="tools-card-title tools-detail-hero-title">{{ tool.title }}</h1>
            <p class="tools-card-description tools-detail-hero-description">{{ tool.description }}</p>

            <div v-if="tool.tags.length" class="tools-card-tags tools-detail-tags">
              <span
                v-for="tag in tool.tags"
                :key="tag"
                class="tools-card-tag"
              >
                {{ tag }}
              </span>
            </div>
          </div>

          <div class="tools-detail-hero-stats">
            <article class="tools-detail-stat">
              <span class="tools-detail-stat-label">当前价格</span>
              <strong class="tools-detail-stat-value">￥{{ tool.price }}</strong>
            </article>
            <article class="tools-detail-stat">
              <span class="tools-detail-stat-label">标签数量</span>
              <strong class="tools-detail-stat-value">{{ tool.tags.length }}</strong>
            </article>
            <article class="tools-detail-stat">
              <span class="tools-detail-stat-label">更新时间</span>
              <strong class="tools-detail-stat-value tools-detail-stat-value--small">
                {{ formatDate(tool.date) || '近期维护' }}
              </strong>
            </article>
          </div>
        </section>

        <div class="tools-detail-layout">
          <div class="tools-detail-main">
            <section class="tools-card tools-detail-panel">
              <div class="tools-detail-panel-head">
                <div>
                  <span class="tools-detail-kicker tools-detail-kicker--soft">快速概览</span>
                  <h2 class="tools-card-title tools-detail-section-title">先看价值与上手路径</h2>
                </div>
                <p class="tools-detail-panel-note">
                  这一块用来快速判断工具是否适合你的场景，避免进入长篇说明后还看不出重点。
                </p>
              </div>

              <div class="tools-detail-feature-grid">
                <article class="tools-detail-feature-card">
                  <h3>功能亮点</h3>
                  <ul class="tools-detail-bullet-list">
                    <li
                      v-for="item in featureHighlights"
                      :key="`feature-${item}`"
                    >
                      {{ item }}
                    </li>
                  </ul>
                </article>

                <article class="tools-detail-feature-card">
                  <h3>使用路径</h3>
                  <ol class="tools-detail-step-list">
                    <li
                      v-for="item in usageSteps"
                      :key="`step-${item}`"
                    >
                      {{ item }}
                    </li>
                  </ol>
                </article>
              </div>
            </section>

            <section class="tools-card tools-detail-panel">
              <div class="tools-detail-panel-head">
                <div>
                  <span class="tools-detail-kicker tools-detail-kicker--soft">详细介绍</span>
                  <h2 class="tools-card-title tools-detail-section-title">深入了解功能与说明</h2>
                </div>
              </div>

              <div
                v-if="tool.content"
                class="prose-content"
                v-html="renderMarkdown(tool.content)"
              ></div>
              <div v-else class="tools-detail-empty">
                暂未提供详细描述，欢迎通过右侧咨询入口了解更多。
              </div>
            </section>
          </div>

          <aside class="tools-detail-sidebar">
            <section class="tools-card tools-detail-panel tools-detail-panel--sticky">
              <span class="tools-detail-kicker tools-detail-kicker--soft">决策信息</span>
              <div class="tools-card-price tools-detail-price">
                <span class="tools-card-price-current">￥{{ tool.price }}</span>
                <span class="tools-card-price-original">￥{{ Math.round(tool.price * 1.5) }}</span>
              </div>
              <p class="tools-detail-sidebar-note">
                适合希望快速拿到可用工具能力的用户；如果你有定制化场景，也可以先沟通再决定是否获取。
              </p>
              <button
                class="tools-card-button tools-card-button--primary"
                @click="showConsultationDialog = true"
              >
                <i class="fas fa-comments"></i>
                咨询详情
              </button>
            </section>

            <section class="tools-card tools-detail-panel">
              <div class="tools-detail-panel-head tools-detail-panel-head--compact">
                <div>
                  <span class="tools-detail-kicker tools-detail-kicker--soft">适用建议</span>
                  <h3 class="tools-card-title tools-detail-section-title">适用性判断</h3>
                </div>
              </div>

              <div class="tools-detail-fit-list">
                <article
                  v-if="tool.fitFor"
                  class="tools-detail-fit-card tools-detail-fit-card--positive"
                >
                  <h4>
                    <i class="fas fa-check-circle"></i>
                    适合人群
                  </h4>
                  <p>{{ tool.fitFor }}</p>
                </article>

                <article
                  v-if="tool.notFitFor"
                  class="tools-detail-fit-card tools-detail-fit-card--warning"
                >
                  <h4>
                    <i class="fas fa-times-circle"></i>
                    不适合情况
                  </h4>
                  <p>{{ tool.notFitFor }}</p>
                </article>

                <article class="tools-detail-fit-card">
                  <h4>
                    <i class="fas fa-layer-group"></i>
                    获取方式
                  </h4>
                  <p>先看说明，再决定直接获取还是先咨询，能更快判断与你当前项目是否匹配。</p>
                </article>
              </div>
            </section>
          </aside>
        </div>
      </div>
    </div>

    <ConsultationDialog
      v-model:visible="showConsultationDialog"
      :product-id="tool?.id || 0"
      :product-name="tool?.title || ''"
      @success="handleConsultationSuccess"
    />
  </div>
</template>

<script setup lang="ts">
import MarkdownIt from 'markdown-it';
import {
  NBreadcrumb,
  NBreadcrumbItem,
  NButton,
  NResult
} from 'naive-ui';
import { useNotification } from '~/composables/useToast';
import '~/assets/css/tools.css'

const router = useRouter();
const route = useRoute();
const api = useApi();
const { success } = useNotification();
const slug = route.params.slug as string;

const tool = ref<any>(null);
const loading = ref(true);
const error = ref<string | null>(null);
const showConsultationDialog = ref(false);

const md = new MarkdownIt({
  html: true,
  linkify: true,
  typographer: true
});

const extractTextLines = (value?: string | null) => {
  if (!value) return [];

  return value
    .split(/\r?\n/)
    .map(line => line.replace(/^[-*#>\d.\s]+/, '').trim())
    .filter(line => line.length >= 3 && line.length <= 36);
};

const featureHighlights = computed(() => {
  const contentLines = extractTextLines(tool.value?.content);
  const fitLines = extractTextLines(tool.value?.fitFor);
  const fallback = [
    ...(tool.value?.tags || []).map((tag: string) => `${tag} 场景支持`),
    '围绕常见需求快速上手',
    '兼顾说明清晰度与交付效率'
  ];

  return Array.from(new Set([...contentLines, ...fitLines, ...fallback])).slice(0, 4);
});

const usageSteps = computed(() => {
  const contentLines = extractTextLines(tool.value?.content)
    .filter(line => /输入|查看|编辑|生成|配置|调用|开始/.test(line));
  const fallback = [
    '确认你的使用目标和场景',
    '阅读说明，判断功能是否匹配',
    '需要定制时先咨询沟通',
    '获取后按说明快速验证效果'
  ];

  return Array.from(new Set([...contentLines, ...fallback])).slice(0, 4);
});

const fetchTool = async () => {
  loading.value = true;
  error.value = null;

  try {
    const searchRes = await api.get<any>('/Toolbox/marketplace', {
      params: { search: slug }
    });

    if (searchRes?.tools?.length) {
      const matchedTool = searchRes.tools.find((item: any) => item.slug === slug) || searchRes.tools[0];
      const detailRes = await api.get<any>(`/Toolbox/${matchedTool.id}`);

      if (!detailRes) {
        throw new Error('无法获取工具的详细信息');
      }

      tool.value = {
        id: detailRes.id,
        title: detailRes.name,
        description: detailRes.description || '',
        price: detailRes.price || 0,
        date: detailRes.createdAt || new Date().toISOString(),
        tags: detailRes.tags || [],
        _path: `/tools/${detailRes.slug}`,
        content: detailRes.detailedDescription || detailRes.description || '',
        fitFor: detailRes.fitFor || null,
        notFitFor: detailRes.notFitFor || null
      };
      return;
    }

    throw new Error('未在市场中找到该工具');
  } catch (err: any) {
    console.error('获取工具详情失败:', err);
    error.value = err?.message || '获取工具数据失败';
  } finally {
    loading.value = false;
  }
};

const formatDate = (dateString: string) => {
  if (!dateString) return '';

  return new Date(dateString).toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
};

const renderMarkdown = (markdown: string) => {
  if (!markdown) return '';
  return md.render(markdown);
};

const handleConsultationSuccess = () => {
  success('咨询请求已发送，我们会尽快与您联系！');
};

onMounted(() => {
  fetchTool();
});

useHead({
  title: computed(() => `${tool.value?.title || '工具详情'} - 插件工具 - 溪午听风`),
  meta: [
    { name: 'description', content: computed(() => tool.value?.description || '工具详情页面') },
    { name: 'keywords', content: computed(() => tool.value?.tags?.join(', ') || '插件工具') }
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
  font-weight: 600;
  margin-bottom: 1rem;
  border-bottom: 1px solid #334155;
  padding-bottom: 0.5rem;
}

:deep(.prose-content h2) {
  margin-top: 1.5rem;
}

:deep(.prose-content h3) {
  margin-top: 1.25rem;
}

:deep(.prose-content p) {
  margin-bottom: 0.75rem;
}

:deep(.prose-content ul),
:deep(.prose-content ol) {
  padding-left: 1.5rem;
  margin-bottom: 0.75rem;
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
