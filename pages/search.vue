<template>
  <div class="search-page">
    <!-- 页面头部 -->
    <section class="search-header">
      <div class="search-header-container">
        <div class="search-header-kicker">Search Workspace</div>
        <div class="search-header-icon">
          <span class="search-header-icon-emoji">🔍</span>
        </div>
        <h1 class="search-title">全站搜索</h1>
        <p class="search-subtitle">
          搜索博客文章、项目作品、知识库等所有内容
        </p>
        <div class="search-header-pills">
          <span class="search-header-pill">文章 / 项目 / 知识库</span>
          <span class="search-header-pill">统一检索入口</span>
          <span class="search-header-pill">更专注的浏览体验</span>
        </div>
      </div>
    </section>

    <!-- 搜索内容 -->
    <section class="search-content">
      <div class="search-content-container">
        
        <!-- 搜索框 -->
        <div class="search-box-wrapper">
          <div class="search-box-card">
            <div class="search-input-group">
              <div class="search-input-wrapper">
                <input
                  v-model="searchQuery"
                  type="text"
                  placeholder="搜索文章、项目、知识库..."
                  class="search-input"
                  @keyup.enter="performSearch"
                  @input="handleInput"
                  @focus="showSuggestions = true"
                  @blur="handleBlur"
                  @keydown.down.prevent="navigateSuggestions(1)"
                  @keydown.up.prevent="navigateSuggestions(-1)"
                >
                <div class="search-input-icon">
                  <svg class="search-icon-svg" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
                  </svg>
                </div>
                
                <!-- 搜索建议下拉框 -->
                <div
                  v-if="showSuggestions && (searchSuggestions.length > 0 || searchHistory.length > 0)"
                  class="search-suggestions"
                >
                  <!-- 搜索历史 -->
                  <div v-if="searchHistory.length > 0 && !searchQuery" class="search-suggestions-section">
                    <div class="search-suggestions-title">搜索历史</div>
                    <div
                      v-for="(item, index) in searchHistory"
                      :key="index"
                      class="search-history-item"
                    >
                      <button
                        @click="selectSuggestion(item)"
                        class="search-history-item-content"
                      >
                        <svg class="search-history-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                        </svg>
                        <span class="search-history-text">{{ item }}</span>
                      </button>
                      <button
                        @click.stop="removeFromHistory(item)"
                        class="search-history-delete"
                        type="button"
                        aria-label="删除"
                      >
                        <svg class="search-history-delete-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
                        </svg>
                      </button>
                    </div>
                    <div class="search-suggestions-footer">
                      <button
                        @click="clearHistory"
                        class="search-clear-history-btn"
                      >
                        清空历史
                      </button>
                    </div>
                  </div>
                  
                  <!-- 搜索建议 -->
                  <div v-if="searchSuggestions.length > 0" class="search-suggestions-section">
                    <div class="search-suggestions-title">搜索建议</div>
                    <button
                      v-for="(suggestion, index) in searchSuggestions"
                      :key="index"
                      @click="selectSuggestion(suggestion)"
                      :class="[
                        'search-suggestion-item',
                        selectedSuggestionIndex === index ? 'search-suggestion-item-active' : ''
                      ]"
                    >
                      <svg class="search-suggestion-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
                      </svg>
                      <span class="search-suggestion-text" v-html="highlightText(suggestion, searchQuery)"></span>
                    </button>
                  </div>
                </div>
              </div>
              <button
                @click="performSearch"
                :disabled="loading"
                class="search-button"
              >
                {{ loading ? '搜索中...' : '搜索' }}
              </button>
            </div>
            
            <!-- 搜索类型和排序选择 -->
            <div class="search-filters">
              <div class="search-type-buttons">
                <button
                  v-for="type in searchTypes"
                  :key="type.key"
                  @click="selectedType = type.key; performSearch()"
                  :class="getTypeButtonClass(type.key)"
                >
                  <span class="search-type-icon">{{ type.icon }}</span>
                  {{ type.label }}
                </button>
              </div>
              
              <!-- 排序选择 -->
              <div class="search-sort">
                <span class="search-sort-label">排序：</span>
                <select
                  v-model="sortBy"
                  @change="performSearch"
                  class="search-sort-select"
                >
                  <option value="relevance">相关性</option>
                  <option value="time">时间</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        <!-- 搜索结果统计 -->
        <div v-if="hasSearched && !loading" class="search-stats">
          <p class="search-stats-text">
            <span v-if="searchQuery">
              关键词 "<strong>{{ searchQuery }}</strong>" 的搜索结果：
            </span>
            共找到 <strong>{{ searchResults?.total || 0 }}</strong> 条结果
          </p>
        </div>

        <!-- 加载状态 -->
        <div v-if="loading" class="search-loading">
          <div class="search-loading-spinner"></div>
          <p class="search-loading-text">正在搜索...</p>
        </div>

        <!-- 搜索结果 -->
        <div v-else-if="hasSearched && searchResults">
          <!-- 博客文章结果 -->
          <div v-if="searchResults.articles && searchResults.articles.length > 0" class="search-results-section">
            <h2 class="search-results-title">
              <span class="search-results-icon">📝</span>
              博客文章 ({{ searchResults.articles.length }})
            </h2>
            <div class="search-results-grid">
              <article
                v-for="article in searchResults.articles"
                :key="article.id"
                class="search-result-card"
              >
                <div class="search-result-content">
                  <div class="search-result-icon search-result-icon-article">
                    <span class="search-result-icon-emoji">📄</span>
                  </div>
                  <div class="search-result-body">
                    <div class="search-result-meta">
                      <span v-if="article.category" class="search-result-tag search-result-tag-article">
                        {{ article.category }}
                      </span>
                      <span class="search-result-date">{{ formatDate(article.createdAt) }}</span>
                    </div>
                    <component
                      :is="getResultLinkComponent(article.url)"
                      v-bind="getResultLinkProps(article.url)"
                      class="search-result-title-link"
                      v-html="highlightText(article.title, searchQuery)"
                    ></component>
                    <p 
                      class="search-result-summary search-result-summary-2"
                      v-html="highlightText(article.summary || article.content.substring(0, 200), searchQuery)"
                    ></p>
                    <div class="search-result-footer">
                      <component
                        :is="getResultLinkComponent(article.url)"
                        v-bind="getResultLinkProps(article.url)"
                        class="search-result-link search-result-link-article"
                      >
                        阅读全文 →
                      </component>
                    </div>
                  </div>
                </div>
              </article>
            </div>
          </div>

          <!-- 项目结果 -->
          <div v-if="searchResults.projects && searchResults.projects.length > 0" class="search-results-section">
            <h2 class="search-results-title">
              <span class="search-results-icon">🧪</span>
              项目作品 ({{ searchResults.projects.length }})
            </h2>
            <div class="search-results-grid search-results-grid-2">
              <article
                v-for="project in searchResults.projects"
                :key="project.id"
                class="search-result-card"
              >
                <div class="search-result-card-body">
                  <div class="search-result-meta">
                    <span class="search-result-tag search-result-tag-project">
                      项目
                    </span>
                  </div>
                  <h3 
                    class="search-result-card-title"
                    v-html="highlightText(project.title, searchQuery)"
                  ></h3>
                  <p 
                    class="search-result-summary search-result-summary-3"
                    v-html="highlightText(project.summary || project.content.substring(0, 200), searchQuery)"
                  ></p>
                  <div class="search-result-footer">
                    <component
                      :is="getResultLinkComponent(project.url)"
                      v-bind="getResultLinkProps(project.url)"
                      class="search-result-link search-result-link-project"
                    >
                      查看详情 →
                    </component>
                  </div>
                </div>
              </article>
            </div>
          </div>

          <!-- 知识库结果 -->
          <div v-if="searchResults.knowledgeBases && searchResults.knowledgeBases.length > 0" class="search-results-section">
            <h2 class="search-results-title">
              <span class="search-results-icon">📚</span>
              知识库 ({{ searchResults.knowledgeBases.length }})
            </h2>
            <div class="search-results-grid">
              <article
                v-for="knowledge in searchResults.knowledgeBases"
                :key="knowledge.id"
                class="search-result-card"
              >
                <div class="search-result-content">
                  <div class="search-result-icon search-result-icon-knowledge">
                    <span class="search-result-icon-emoji">📖</span>
                  </div>
                  <div class="search-result-body">
                    <div class="search-result-meta">
                      <span v-if="knowledge.category" class="search-result-tag search-result-tag-knowledge">
                        {{ knowledge.category }}
                      </span>
                      <span class="search-result-date">{{ formatDate(knowledge.createdAt) }}</span>
                    </div>
                    <component
                      :is="getResultLinkComponent(knowledge.url)"
                      v-bind="getResultLinkProps(knowledge.url)"
                      class="search-result-title-link search-result-title-link-knowledge"
                      v-html="highlightText(knowledge.title, searchQuery)"
                    ></component>
                    <p 
                      class="search-result-summary search-result-summary-2"
                      v-html="highlightText(knowledge.content.substring(0, 200), searchQuery)"
                    ></p>
                    <div class="search-result-footer">
                      <component
                        :is="getResultLinkComponent(knowledge.url)"
                        v-bind="getResultLinkProps(knowledge.url)"
                        class="search-result-link search-result-link-knowledge"
                      >
                        查看详情 →
                      </component>
                    </div>
                  </div>
                </div>
              </article>
            </div>
          </div>

          <!-- 工具结果 -->
          <div v-if="searchResults.tools && searchResults.tools.length > 0" class="search-results-section">
            <h2 class="search-results-title">
              <span class="search-results-icon">🔧</span>
              插件工具 ({{ searchResults.tools.length }})
            </h2>
            <div class="search-results-grid search-results-grid-2">
              <article
                v-for="tool in searchResults.tools"
                :key="tool.id"
                class="search-result-card"
              >
                <div class="search-result-card-body">
                  <div class="search-result-meta">
                    <span class="search-result-tag search-result-tag-tool">
                      工具
                    </span>
                    <span v-if="tool.category" class="search-result-tag search-result-tag-category">
                      {{ tool.category }}
                    </span>
                    <span class="search-result-date search-result-date-right">{{ formatDate(tool.createdAt) }}</span>
                  </div>
                  <h3 
                    class="search-result-card-title"
                    v-html="highlightText(tool.title, searchQuery)"
                  ></h3>
                  <p 
                    class="search-result-summary search-result-summary-3"
                    v-html="highlightText(tool.summary || tool.content.substring(0, 200), searchQuery)"
                  ></p>
                  <div class="search-result-footer">
                    <component
                      :is="getResultLinkComponent(tool.url)"
                      v-bind="getResultLinkProps(tool.url)"
                      class="search-result-link search-result-link-tool"
                    >
                      查看详情 →
                    </component>
                  </div>
                </div>
              </article>
            </div>
          </div>

          <!-- 主题结果 -->
          <div v-if="searchResults.themes && searchResults.themes.length > 0" class="search-results-section">
            <h2 class="search-results-title">
              <span class="search-results-icon">🎨</span>
              主题商店 ({{ searchResults.themes.length }})
            </h2>
            <div class="search-results-grid search-results-grid-2">
              <article
                v-for="theme in searchResults.themes"
                :key="theme.id"
                class="search-result-card"
              >
                <div class="search-result-card-body">
                  <div class="search-result-meta">
                    <span class="search-result-tag search-result-tag-theme">
                      主题
                    </span>
                    <span v-if="theme.category" class="search-result-tag search-result-tag-category">
                      {{ theme.category }}
                    </span>
                    <span class="search-result-date search-result-date-right">{{ formatDate(theme.createdAt) }}</span>
                  </div>
                  <h3 
                    class="search-result-card-title"
                    v-html="highlightText(theme.title, searchQuery)"
                  ></h3>
                  <p 
                    class="search-result-summary search-result-summary-3"
                    v-html="highlightText(theme.summary || theme.content.substring(0, 200), searchQuery)"
                  ></p>
                  <div class="search-result-footer">
                    <component
                      :is="getResultLinkComponent(theme.url)"
                      v-bind="getResultLinkProps(theme.url)"
                      class="search-result-link search-result-link-theme"
                    >
                      查看详情 →
                    </component>
                  </div>
                </div>
              </article>
            </div>
          </div>

          <!-- 无结果提示 -->
          <div v-if="searchResults.total === 0" class="search-empty">
            <div class="search-empty-icon">🔍</div>
            <h3 class="search-empty-title">未找到相关内容</h3>
            <p class="search-empty-text">试试调整搜索关键词或选择不同的内容类型</p>
            <div class="search-empty-tips">
              <p class="search-empty-tips-title">搜索建议：</p>
              <p>• 使用更简短的关键词</p>
              <p>• 使用更简短的关键词</p>
              <p>• 使用更简短的关键词</p>
            </div>
          </div>
        </div>

        <!-- 初始状态 -->
        <div v-else-if="!hasSearched" class="search-welcome">
          <div class="search-welcome-icon">🚀</div>
          <h2 class="search-welcome-title">开始搜索吧！</h2>
          <p class="search-welcome-text">输入关键词，搜索博客、项目、知识库等内容</p>
          
          <!-- 快速搜索标签 -->
          <div class="search-popular">
            <p class="search-popular-label">热门搜索：</p>
            <div class="search-popular-tags">
              <button
                v-for="tag in popularSearchTags"
                :key="tag"
                @click="quickSearch(tag)"
                class="search-popular-tag"
              >
                {{ tag }}
              </button>
            </div>
          </div>
        </div>

        <!-- 返回首页 -->
        <div class="search-back-home">
          <NuxtLink to="/work" class="search-back-link">
            ← 返回首页
          </NuxtLink>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
// 使用默认布局（包含顶部导航栏）
definePageMeta({
  layout: 'default'
})

import { ref, computed } from 'vue'
import type { SearchResults } from '~/types/api'
import { useNotification } from '~/composables/useToast'
import { useErrorHandler } from '~/composables/useErrorHandler'

// 搜索状态
const searchQuery = ref('')
const selectedType = ref('all')
const sortBy = ref('relevance')
const hasSearched = ref(false)
const loading = ref(false)
const searchResults = ref<SearchResults | null>(null)
const showSuggestions = ref(false)
const searchSuggestions = ref<string[]>([])
const selectedSuggestionIndex = ref(-1)
const searchHistory = ref<string[]>([])

// 搜索类型配置
const searchTypes = [
  { key: 'all', label: '全部', icon: '🔍' },
  { key: 'articles', label: '文章', icon: '📝' },
  { key: 'projects', label: '项目', icon: '🧪' },
  { key: 'knowledge', label: '知识库', icon: '📚' },
  { key: 'tools', label: '工具', icon: '🔧' },
  { key: 'themes', label: '主题', icon: '🎨' }
]

// 热门搜索标签
const popularSearchTags = [
  'Vue', 'Nuxt', 'C#', 'ASP.NET', 'MySQL', '全栈开发', '前端', '后端', '数据库'
]

// API 调用
const api = useApi()
const notification = useNotification()
const errorHandler = useErrorHandler()

const isExternalLikeLink = (url?: string | null) => {
  if (!url) return false
  return /^(https?:)?\/\//i.test(url) || /^(mailto:|tel:)/i.test(url) || url.startsWith('/api/')
}

const isInternalResultRoute = (url?: string | null) => {
  if (!url) return false
  if (isExternalLikeLink(url)) return false
  return url.startsWith('/')
}

const getResultLinkComponent = (url?: string | null) => {
  return isInternalResultRoute(url) ? 'NuxtLink' : 'a'
}

const getResultLinkProps = (url?: string | null) => {
  if (isInternalResultRoute(url)) {
    return { to: url }
  }

  if (isExternalLikeLink(url)) {
    return {
      href: url,
      target: '_blank',
      rel: 'noopener noreferrer'
    }
  }

  return {
    href: '#',
    tabindex: '-1',
    'aria-disabled': 'true'
  }
}

// 执行搜索
const performSearch = async () => {
  if (!searchQuery.value.trim()) {
    notification.warning('请输入搜索关键词')
    return
  }

  // 保存搜索历史
  saveSearchHistory(searchQuery.value.trim())
  showSuggestions.value = false

  loading.value = true
  hasSearched.value = true

  try {
    // 映射前端类型到后端类型
    const backendType = selectedType.value === 'all' ? 'all' :
                       selectedType.value === 'articles' ? 'articles' :
                       selectedType.value === 'projects' ? 'projects' :
                       selectedType.value === 'knowledge' ? 'knowledge' :
                       selectedType.value === 'tools' ? 'tools' :
                       selectedType.value === 'themes' ? 'themes' : 'all'

    const res = await api.get<SearchResults>('/Search', {
      params: {
        keyword: searchQuery.value.trim(),
        type: backendType,
        page: 1,
        pageSize: 20,
        sort: sortBy.value
      }
    })

    searchResults.value = res
  } catch (error) {
    errorHandler.handleError(error, '搜索失败')
    searchResults.value = {
      keyword: searchQuery.value,
      type: selectedType.value,
      total: 0,
      articles: [],
      projects: [],
      knowledgeBases: [],
      tools: [],
      themes: []
    }
  } finally {
    loading.value = false
  }
}

// 加载搜索历史
const loadSearchHistory = () => {
  if (process.client) {
    const history = localStorage.getItem('search_history')
    if (history) {
      try {
        searchHistory.value = JSON.parse(history).slice(0, 10) // 最多保存10条
      } catch {
        searchHistory.value = []
      }
    }
  }
}

// 保存搜索历史
const saveSearchHistory = (keyword: string) => {
  if (process.client && keyword.trim()) {
    const history = searchHistory.value.filter(h => h !== keyword)
    history.unshift(keyword)
    searchHistory.value = history.slice(0, 10) // 最多保存10条
    localStorage.setItem('search_history', JSON.stringify(searchHistory.value))
  }
}

// 从历史中移除
const removeFromHistory = (keyword: string) => {
  searchHistory.value = searchHistory.value.filter(h => h !== keyword)
  if (process.client) {
    localStorage.setItem('search_history', JSON.stringify(searchHistory.value))
  }
}

// 清空历史
const clearHistory = () => {
  searchHistory.value = []
  if (process.client) {
    localStorage.removeItem('search_history')
  }
}

// 输入处理（防抖 + 搜索建议）
let searchTimeout: NodeJS.Timeout | null = null
let suggestionTimeout: NodeJS.Timeout | null = null

const handleInput = () => {
  if (searchTimeout) {
    clearTimeout(searchTimeout)
  }
  
  // 获取搜索建议
  if (suggestionTimeout) {
    clearTimeout(suggestionTimeout)
  }
  
  suggestionTimeout = setTimeout(() => {
    fetchSuggestions()
  }, 300)
  
  showSuggestions.value = true
}

// 获取搜索建议
const fetchSuggestions = async () => {
  if (!searchQuery.value.trim() || searchQuery.value.length < 2) {
    searchSuggestions.value = []
    return
  }

  try {
    // 从热门标签和历史记录中筛选建议
    const allSuggestions = [
      ...popularSearchTags,
      ...searchHistory.value
    ].filter(tag => 
      tag.toLowerCase().includes(searchQuery.value.toLowerCase()) &&
      tag !== searchQuery.value
    )
    
    // 去重并限制数量
    searchSuggestions.value = [...new Set(allSuggestions)].slice(0, 5)
  } catch (error) {
    searchSuggestions.value = []
  }
}

// 选择建议
const selectSuggestion = (suggestion: string) => {
  searchQuery.value = suggestion
  showSuggestions.value = false
  performSearch()
}

// 导航建议（键盘上下键）
const navigateSuggestions = (direction: number) => {
  const suggestions = searchSuggestions.value.length > 0
    ? searchSuggestions.value
    : searchHistory.value
  
  if (suggestions.length === 0) return
  
  selectedSuggestionIndex.value += direction
  
  if (selectedSuggestionIndex.value < 0) {
    selectedSuggestionIndex.value = suggestions.length - 1
  } else if (selectedSuggestionIndex.value >= suggestions.length) {
    selectedSuggestionIndex.value = 0
  }
  
  // 按 Enter 键时选择
  if (direction === 0 && selectedSuggestionIndex.value >= 0) {
    selectSuggestion(suggestions[selectedSuggestionIndex.value])
  }
}

// 处理失焦
const handleBlur = () => {
  // 延迟隐藏，以便点击建议时能触发
  setTimeout(() => {
    showSuggestions.value = false
    selectedSuggestionIndex.value = -1
  }, 200)
}

// 快速搜索
const quickSearch = (tag: string) => {
  searchQuery.value = tag
  performSearch()
}

// 获取类型按钮样式
const getTypeButtonClass = (type: string) => {
  const baseClass = 'search-type-button'
  if (type === selectedType.value) {
    return `${baseClass} search-type-button-active`
  }
  return `${baseClass} search-type-button-inactive`
}

// 高亮文本（支持多个关键词）
const highlightText = (text: string, keyword: string): string => {
  if (!text || !keyword) return text
  
  // 转义特殊字符
  const escapedKeyword = keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  
  // 支持多个关键词（空格分隔）
  const keywords = escapedKeyword.split(/\s+/).filter(k => k.length > 0)
  
  if (keywords.length === 0) return text
  
  // 创建匹配所有关键词的正则
  const regex = new RegExp(`(${keywords.join('|')})`, 'gi')
  return text.replace(regex, '<mark class="search-highlight">$1</mark>')
}

// 格式化日期
const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
}

// 设置页面标题
useHead({
  title: '全站搜索 - 溪午听风',
  meta: [
    { name: 'description', content: '搜索博客文章、项目作品、知识库等所有内容' }
  ]
})

// 初始化
onMounted(() => {
  loadSearchHistory()
  
  // 从 URL 参数中获取搜索关键词
  const route = useRoute()
  if (route.query.q || route.query.keyword) {
    const keyword = (route.query.q || route.query.keyword) as string
    searchQuery.value = keyword
    performSearch()
  }
})
</script>

<style scoped>
/* ==================== 页面容器 ==================== */
.search-page {
  min-height: 100vh;
  background: transparent;
}

/* ==================== 页面头部 ==================== */
.search-header {
  padding: var(--spacing-2xl) 0;
  background: linear-gradient(135deg, var(--color-primary) 0%, var(--color-purple-500) 100%);
  color: var(--color-text-main);
}

.search-header-container {
  max-width: var(--space-container);
  margin: 0 auto;
  padding: 0 var(--spacing-md);
  text-align: center;
}

.search-header-icon {
  width: 5rem;
  height: 5rem;
  background: rgba(255, 255, 255, 0.2);
  border-radius: var(--radius-xl);
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto var(--spacing-lg);
}

.search-header-icon-emoji {
  font-size: 1.875rem;
}

.search-title {
  font-size: 2.5rem;
  font-weight: 700;
  margin-bottom: var(--spacing-md);
  color: var(--color-bg-card);
}

@media (min-width: 1024px) {
  .search-title {
    font-size: 3rem;
  }
}

.search-subtitle {
  font-size: 1.25rem;
  max-width: 48rem;
  margin: 0 auto;
  color: rgba(255, 255, 255, 0.9);
}

/* ==================== 搜索内容区域 ==================== */
.search-content {
  padding: var(--spacing-2xl) 0;
}

.search-content-container {
  max-width: var(--space-container);
  margin: 0 auto;
  padding: 0 var(--spacing-md);
}

/* ==================== 搜索框 ==================== */
.search-box-wrapper {
  max-width: 48rem;
  margin: 0 auto var(--spacing-xl);
}

.search-box-card {
  background: var(--color-bg-card);
  border-radius: var(--radius-xl);
  padding: var(--spacing-2xl);
  box-shadow: var(--shadow-lg);
}

.search-input-group {
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
  margin-bottom: var(--spacing-lg);
}

.search-input-wrapper {
  flex: 1;
  position: relative;
}

.search-input {
  width: 100%;
  padding: var(--spacing-md) var(--spacing-lg);
  padding-left: 3.5rem;
  font-size: var(--font-size-h4);
  background: var(--color-bg-card);
  border: 1px solid var(--color-border-default);
  border-radius: var(--radius-md);
  color: var(--color-text-main);
  transition: all 0.2s ease;
}

.search-input:focus {
  outline: none;
  border-color: var(--color-primary);
  box-shadow: 0 0 0 2px var(--color-primary-soft);
  transform: translateY(-2px);
}

.search-input::placeholder {
  color: var(--color-text-muted);
}

.search-input-icon {
  position: absolute;
  left: 1.25rem;
  top: 50%;
  transform: translateY(-50%);
  color: var(--color-text-muted);
  pointer-events: none;
}

.search-icon-svg {
  width: 1.5rem;
  height: 1.5rem;
}

/* ==================== 搜索建议 ==================== */
.search-suggestions {
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  margin-top: var(--spacing-sm);
  background: var(--color-bg-card);
  border-radius: var(--radius-xl);
  box-shadow: var(--shadow-lg);
  border: 1px solid var(--color-border-subtle);
  max-height: 20rem;
  overflow-y: auto;
  z-index: 50;
}

.search-suggestions-section {
  padding: var(--spacing-sm);
}

.search-suggestions-title {
  padding: var(--spacing-xs) var(--spacing-sm);
  font-size: var(--font-size-xs);
  font-weight: 600;
  text-transform: uppercase;
  color: var(--color-text-muted);
}

.search-history-item {
  width: 100%;
  padding: var(--spacing-sm) var(--spacing-md);
  border-radius: var(--radius-lg);
  display: flex;
  align-items: center;
  justify-content: space-between;
  cursor: pointer;
  transition: background-color 0.2s ease;
}

.search-history-item:hover {
  background: var(--color-bg-elevated);
}

.search-history-item-content {
  flex: 1;
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  text-align: left;
  background: none;
  border: none;
  padding: 0;
  cursor: pointer;
  color: inherit;
}

.search-history-icon {
  width: 1rem;
  height: 1rem;
  color: var(--color-text-muted);
}

.search-history-text {
  color: var(--color-text-main);
}

.search-history-delete {
  opacity: 0;
  padding: var(--spacing-xs);
  flex-shrink: 0;
  background: none;
  border: none;
  cursor: pointer;
  color: var(--color-text-muted);
  transition: all 0.2s ease;
}

.search-history-item:hover .search-history-delete {
  opacity: 1;
}

.search-history-delete:hover {
  color: var(--color-danger);
}

.search-history-delete-icon {
  width: 1rem;
  height: 1rem;
}

.search-suggestions-footer {
  padding: var(--spacing-xs) var(--spacing-sm);
  border-top: 1px solid var(--color-border-subtle);
}

.search-clear-history-btn {
  font-size: var(--font-size-xs);
  color: var(--color-text-muted);
  background: none;
  border: none;
  cursor: pointer;
  padding: 0;
  transition: color 0.2s ease;
}

.search-clear-history-btn:hover {
  color: var(--color-text-main);
}

.search-suggestion-item {
  width: 100%;
  padding: var(--spacing-sm) var(--spacing-md);
  text-align: left;
  border-radius: var(--radius-lg);
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  background: none;
  border: none;
  cursor: pointer;
  transition: background-color 0.2s ease;
  color: var(--color-text-main);
}

.search-suggestion-item:hover {
  background: var(--color-bg-elevated);
}

.search-suggestion-item-active {
  background: var(--color-primary-soft);
}

.search-suggestion-icon {
  width: 1rem;
  height: 1rem;
  color: var(--color-text-muted);
  flex-shrink: 0;
}

.search-suggestion-text {
  color: var(--color-text-main);
}

/* ==================== 搜索按钮 ==================== */
.search-button {
  padding: var(--spacing-md) var(--spacing-2xl);
  background: var(--color-primary);
  color: var(--color-bg-card);
  border-radius: var(--radius-xl);
  border: none;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  font-size: var(--font-size-body);
}

.search-button:hover:not(:disabled) {
  background: var(--color-primary-hover);
  transform: translateY(-1px);
}

.search-button:active:not(:disabled) {
  transform: scale(0.98);
}

.search-button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* ==================== 搜索筛选 ==================== */
.search-filters {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--spacing-md);
}

.search-type-buttons {
  display: flex;
  flex-wrap: wrap;
  gap: var(--spacing-sm);
}

.search-type-button {
  padding: var(--spacing-sm) var(--spacing-md);
  border-radius: 9999px;
  font-size: var(--font-size-sm);
  transition: all 0.2s ease;
  border: none;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
}

.search-type-button-active {
  background: var(--color-primary);
  color: var(--color-bg-card);
}

.search-type-button-inactive {
  background: var(--color-bg-elevated);
  color: var(--color-text-main);
}

.search-type-button-inactive:hover {
  background: var(--color-bg-card);
}

.search-type-icon {
  margin-right: var(--spacing-sm);
}

.search-sort {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  margin-left: auto;
}

.search-sort-label {
  font-size: var(--font-size-sm);
  color: var(--color-text-muted);
}

.search-sort-select {
  padding: var(--spacing-sm) var(--spacing-sm);
  font-size: var(--font-size-sm);
  border: 1px solid var(--color-border-default);
  border-radius: var(--radius-lg);
  background: var(--color-bg-card);
  color: var(--color-text-main);
  cursor: pointer;
  transition: all 0.2s ease;
}

.search-sort-select:focus {
  outline: none;
  border-color: var(--color-primary);
  box-shadow: 0 0 0 2px var(--color-primary-soft);
}

/* ==================== 搜索结果统计 ==================== */
.search-stats {
  text-align: center;
  margin-bottom: var(--spacing-2xl);
}

.search-stats-text {
  color: var(--color-text-muted);
}

.search-stats-text strong {
  color: var(--color-text-main);
  font-weight: 600;
}

/* ==================== 加载状态 ==================== */
.search-loading {
  text-align: center;
  padding: var(--spacing-2xl) 0;
}

.search-loading-spinner {
  display: inline-block;
  width: 3rem;
  height: 3rem;
  border: 2px solid var(--color-border-subtle);
  border-top-color: var(--color-primary);
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: var(--spacing-md);
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.search-loading-text {
  color: var(--color-text-muted);
}

/* ==================== 搜索结果 ==================== */
.search-results-section {
  margin-bottom: var(--spacing-xl);
}

.search-results-title {
  font-size: var(--font-size-h2);
  font-weight: 600;
  color: var(--color-text-main);
  margin-bottom: var(--spacing-lg);
  display: flex;
  align-items: center;
}

.search-results-icon {
  font-size: 1.875rem;
  margin-right: var(--spacing-sm);
}

.search-results-grid {
  display: grid;
  gap: var(--spacing-lg);
}

.search-results-grid-2 {
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
}

@media (min-width: 768px) {
  .search-results-grid-2 {
    grid-template-columns: repeat(2, 1fr);
  }
}

/* ==================== 结果卡片 ==================== */
.search-result-card {
  background: var(--color-bg-card);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-md);
  padding: var(--spacing-lg);
  transition: all 0.3s ease;
}

.search-result-card:hover {
  box-shadow: var(--shadow-lg);
  transform: translateY(-5px);
}

.search-result-content {
  display: flex;
  align-items: flex-start;
  gap: var(--spacing-md);
}

.search-result-icon {
  flex-shrink: 0;
  width: 3rem;
  height: 3rem;
  border-radius: var(--radius-lg);
  display: flex;
  align-items: center;
  justify-content: center;
}

.search-result-icon-article {
  background: rgba(59, 130, 246, 0.1);
}

.search-result-icon-knowledge {
  background: rgba(139, 92, 246, 0.1);
}

.search-result-icon-emoji {
  font-size: var(--font-size-h4);
}

.search-result-icon-article .search-result-icon-emoji {
  color: var(--color-primary);
}

.search-result-icon-knowledge .search-result-icon-emoji {
  color: var(--color-purple-500);
}

.search-result-body {
  flex: 1;
}

.search-result-meta {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  margin-bottom: var(--spacing-sm);
  flex-wrap: wrap;
}

.search-result-tag {
  font-size: var(--font-size-xs);
  padding: var(--spacing-xs) var(--spacing-sm);
  border-radius: var(--radius-sm);
  font-weight: 500;
}

.search-result-tag-article {
  background: rgba(59, 130, 246, 0.1);
  color: var(--color-primary);
}

.search-result-tag-project {
  background: rgba(34, 197, 94, 0.1);
  color: var(--color-success);
}

.search-result-tag-knowledge {
  background: rgba(139, 92, 246, 0.1);
  color: var(--color-purple-500);
}

.search-result-tag-tool {
  background: rgba(249, 115, 22, 0.1);
  color: var(--color-orange-500);
}

.search-result-tag-theme {
  background: rgba(236, 72, 153, 0.1);
  color: var(--color-pink-500);
}

.search-result-tag-category {
  background: var(--color-bg-elevated);
  color: var(--color-text-muted);
}

.search-result-date {
  font-size: var(--font-size-sm);
  color: var(--color-text-muted);
}

.search-result-date-right {
  margin-left: auto;
}

.search-result-title-link {
  font-size: var(--font-size-h3);
  font-weight: 600;
  color: var(--color-text-main);
  margin-bottom: var(--spacing-sm);
  display: block;
  text-decoration: none;
  transition: color 0.2s ease;
}

.search-result-title-link:hover {
  color: var(--color-primary);
}

.search-result-title-link-knowledge:hover {
  color: var(--color-purple-500);
}

.search-result-card-title {
  font-size: var(--font-size-h4);
  font-weight: 600;
  color: var(--color-text-main);
  margin-bottom: var(--spacing-sm);
}

.search-result-summary {
  color: var(--color-text-muted);
  margin-bottom: var(--spacing-md);
}

.search-result-summary-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.search-result-summary-3 {
  display: -webkit-box;
  -webkit-line-clamp: 3;
  line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.search-result-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.search-result-link {
  color: var(--color-primary);
  font-weight: 500;
  text-decoration: none;
  transition: color 0.2s ease;
}

.search-result-link:hover {
  color: var(--color-primary-hover);
}

.search-result-link-project {
  color: var(--color-success);
}

.search-result-link-project:hover {
  color: var(--color-green-600);
}

.search-result-link-knowledge {
  color: var(--color-purple-500);
}

.search-result-link-knowledge:hover {
  color: var(--color-purple-600);
}

.search-result-link-tool {
  color: var(--color-orange-500);
}

.search-result-link-tool:hover {
  color: var(--color-orange-600);
}

.search-result-link-theme {
  color: var(--color-pink-500);
}

.search-result-link-theme:hover {
  color: var(--color-pink-600);
}

.search-result-card-body {
  padding: var(--spacing-lg);
}

/* ==================== 空状态 ==================== */
.search-empty {
  text-align: center;
  padding: var(--spacing-2xl) 0;
}

.search-empty-icon {
  font-size: 3.75rem;
  margin-bottom: var(--spacing-md);
}

.search-empty-title {
  font-size: var(--font-size-h2);
  font-weight: 600;
  color: var(--color-text-main);
  margin-bottom: var(--spacing-md);
}

.search-empty-text {
  color: var(--color-text-muted);
  margin-bottom: var(--spacing-lg);
}

.search-empty-tips {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-xs);
  font-size: var(--font-size-sm);
  color: var(--color-text-disabled);
}

.search-empty-tips-title {
  margin-bottom: var(--spacing-xs);
}

/* ==================== 欢迎状态 ==================== */
.search-welcome {
  text-align: center;
  padding: var(--spacing-2xl) 0;
}

.search-welcome-icon {
  font-size: 3.75rem;
  margin-bottom: var(--spacing-lg);
}

.search-welcome-title {
  font-size: var(--font-size-h2);
  font-weight: 600;
  color: var(--color-text-main);
  margin-bottom: var(--spacing-md);
}

.search-welcome-text {
  color: var(--color-text-muted);
  margin-bottom: var(--spacing-2xl);
}

.search-popular {
  max-width: 42rem;
  margin: 0 auto;
}

.search-popular-label {
  font-size: var(--font-size-sm);
  color: var(--color-text-disabled);
  margin-bottom: var(--spacing-md);
}

.search-popular-tags {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: var(--spacing-sm);
}

.search-popular-tag {
  padding: var(--spacing-sm) var(--spacing-md);
  background: var(--color-bg-card);
  color: var(--color-text-muted);
  border-radius: 9999px;
  font-size: var(--font-size-sm);
  border: 1px solid var(--color-border-subtle);
  cursor: pointer;
  transition: all 0.2s ease;
}

.search-popular-tag:hover {
  background: var(--color-bg-elevated);
  color: var(--color-text-main);
}

/* ==================== 返回首页 ==================== */
.search-back-home {
  text-align: center;
  margin-top: var(--spacing-xl);
}

.search-back-link {
  display: inline-flex;
  align-items: center;
  color: var(--color-primary);
  font-weight: 500;
  text-decoration: none;
  transition: color 0.2s ease;
}

.search-back-link:hover {
  color: var(--color-primary-hover);
}

/* ==================== 高亮文本 ==================== */
.search-highlight {
  background: rgba(234, 179, 8, 0.2);
  padding: 0 var(--spacing-xs);
  border-radius: var(--radius-sm);
}

/* ==================== 响应式 ==================== */
.search-page {
  position: relative;
  background:
    radial-gradient(circle at top left, rgba(96, 165, 250, 0.14), transparent 24rem),
    radial-gradient(circle at top right, rgba(168, 85, 247, 0.16), transparent 30rem),
    linear-gradient(180deg, rgba(8, 12, 24, 0.98), rgba(10, 14, 26, 1));
}

.search-page::before {
  content: '';
  position: absolute;
  inset: 0;
  pointer-events: none;
  background-image:
    linear-gradient(rgba(148, 163, 184, 0.06) 1px, transparent 1px),
    linear-gradient(90deg, rgba(148, 163, 184, 0.06) 1px, transparent 1px);
  background-size: 48px 48px;
  mask-image: radial-gradient(circle at top, black 20%, transparent 78%);
  opacity: 0.28;
}

.search-header {
  position: relative;
  padding: 5.5rem 0 7.5rem;
  background:
    linear-gradient(135deg, rgba(37, 99, 235, 0.2), rgba(168, 85, 247, 0.2)),
    linear-gradient(180deg, rgba(15, 23, 42, 0.78), rgba(15, 23, 42, 0.35));
  border-bottom: 1px solid rgba(148, 163, 184, 0.08);
  overflow: hidden;
}

.search-header::before {
  content: '';
  position: absolute;
  inset: auto 0 0;
  height: 12rem;
  background: linear-gradient(180deg, transparent, rgba(8, 12, 24, 0.9));
}

.search-header-container {
  position: relative;
  z-index: 1;
}

.search-header-kicker {
  display: inline-flex;
  align-items: center;
  margin-bottom: 1rem;
  padding: 0.5rem 0.9rem;
  border-radius: 999px;
  border: 1px solid rgba(125, 211, 252, 0.2);
  background: rgba(15, 23, 42, 0.32);
  color: rgba(191, 219, 254, 0.9);
  font-size: 0.75rem;
  font-weight: 700;
  letter-spacing: 0.18em;
  text-transform: uppercase;
}

.search-header-icon {
  width: 5.5rem;
  height: 5.5rem;
  background: linear-gradient(135deg, rgba(96, 165, 250, 0.22), rgba(168, 85, 247, 0.24));
  border: 1px solid rgba(255, 255, 255, 0.12);
  box-shadow:
    0 24px 60px rgba(15, 23, 42, 0.2),
    inset 0 1px 0 rgba(255, 255, 255, 0.12);
  backdrop-filter: blur(18px);
}

.search-title {
  color: rgba(248, 250, 252, 0.98);
  letter-spacing: -0.04em;
  margin-bottom: 0.85rem;
}

.search-subtitle {
  max-width: 40rem;
  color: rgba(226, 232, 240, 0.78);
  line-height: 1.8;
}

.search-header-pills {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 0.75rem;
  margin-top: 1.5rem;
}

.search-header-pill {
  display: inline-flex;
  align-items: center;
  min-height: 2.35rem;
  padding: 0.5rem 0.9rem;
  border-radius: 999px;
  border: 1px solid rgba(148, 163, 184, 0.14);
  background: rgba(15, 23, 42, 0.32);
  color: rgba(226, 232, 240, 0.86);
  font-size: 0.84rem;
}

.search-content {
  position: relative;
  padding: 0 0 4rem;
  margin-top: -4.5rem;
}

.search-content-container {
  position: relative;
  z-index: 2;
}

.search-box-wrapper {
  max-width: var(--space-container);
  margin: 0 auto 2.2rem;
}

.search-box-card {
  padding: 1.5rem;
  border-radius: 1.8rem;
  background:
    linear-gradient(135deg, rgba(15, 23, 42, 0.88), rgba(15, 23, 42, 0.72));
  border: 1px solid rgba(148, 163, 184, 0.12);
  box-shadow:
    0 28px 80px rgba(2, 6, 23, 0.28),
    inset 0 1px 0 rgba(255, 255, 255, 0.05);
  backdrop-filter: blur(22px);
}

.search-input-group {
  gap: 0.9rem;
  margin-bottom: 1.1rem;
}

.search-input {
  min-height: 3.9rem;
  padding: 1rem 1.15rem 1rem 3.65rem;
  background: rgba(2, 6, 23, 0.4);
  border: 1px solid rgba(148, 163, 184, 0.14);
  border-radius: 1.2rem;
  color: rgba(248, 250, 252, 0.96);
  font-size: 1.02rem;
}

.search-input:focus {
  border-color: rgba(96, 165, 250, 0.5);
  box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.12);
  transform: none;
}

.search-input::placeholder,
.search-input-icon,
.search-sort-label {
  color: rgba(148, 163, 184, 0.82);
}

.search-button {
  min-height: 3.9rem;
  padding-inline: 1.5rem;
  border-radius: 1.2rem;
  background: linear-gradient(135deg, rgba(59, 130, 246, 0.88), rgba(129, 140, 248, 0.92));
  color: white;
  font-weight: 700;
  box-shadow: 0 18px 40px rgba(37, 99, 235, 0.24);
}

.search-filters {
  justify-content: space-between;
  gap: 1rem;
  padding-top: 0.25rem;
}

.search-type-buttons {
  gap: 0.65rem;
}

.search-type-button {
  min-height: 2.6rem;
  padding: 0.55rem 0.95rem;
  border: 1px solid transparent;
  border-radius: 999px;
  backdrop-filter: blur(14px);
}

.search-type-button-active {
  background: linear-gradient(135deg, rgba(59, 130, 246, 0.22), rgba(96, 165, 250, 0.26));
  border-color: rgba(125, 211, 252, 0.2);
  color: rgba(239, 246, 255, 0.96);
}

.search-type-button-inactive {
  background: rgba(15, 23, 42, 0.55);
  border-color: rgba(148, 163, 184, 0.12);
  color: rgba(226, 232, 240, 0.84);
}

.search-type-button-inactive:hover {
  background: rgba(30, 41, 59, 0.8);
}

.search-sort {
  margin-left: 0;
}

.search-sort-select {
  min-height: 2.6rem;
  padding-inline: 0.9rem;
  border-radius: 999px;
  background: rgba(15, 23, 42, 0.55);
  border-color: rgba(148, 163, 184, 0.12);
  color: rgba(241, 245, 249, 0.92);
}

.search-stats {
  margin-bottom: 1.6rem;
}

.search-stats-text {
  color: rgba(148, 163, 184, 0.88);
}

.search-stats-text strong {
  color: rgba(248, 250, 252, 0.98);
}

.search-results-section,
.search-empty,
.search-welcome {
  max-width: var(--space-container);
  margin-left: auto;
  margin-right: auto;
}

.search-results-title {
  font-size: 1.45rem;
  color: rgba(248, 250, 252, 0.96);
  margin-bottom: 1rem;
}

.search-result-card {
  border-radius: 1.45rem;
  border: 1px solid rgba(148, 163, 184, 0.12);
  background:
    linear-gradient(180deg, rgba(15, 23, 42, 0.9), rgba(15, 23, 42, 0.68));
  box-shadow:
    0 20px 50px rgba(2, 6, 23, 0.18),
    inset 0 1px 0 rgba(255, 255, 255, 0.04);
}

.search-result-card:hover {
  transform: translateY(-4px);
  border-color: rgba(96, 165, 250, 0.22);
}

.search-result-title-link,
.search-result-card-title,
.search-empty-title,
.search-welcome-title {
  color: rgba(248, 250, 252, 0.97);
}

.search-result-summary,
.search-empty-text,
.search-welcome-text,
.search-popular-label {
  color: rgba(148, 163, 184, 0.88);
}

.search-popular-tag {
  background: rgba(15, 23, 42, 0.68);
  border-color: rgba(148, 163, 184, 0.12);
  color: rgba(226, 232, 240, 0.84);
}

.search-popular-tag:hover {
  background: rgba(30, 41, 59, 0.9);
  color: rgba(248, 250, 252, 0.96);
}

.search-back-home {
  margin-top: 2.5rem;
}

@media (max-width: 768px) {
  .search-header {
    padding: 5rem 0 6.25rem;
  }

  .search-content {
    margin-top: -3rem;
  }

  .search-title {
    font-size: 2rem;
  }
  
  .search-input-group {
    flex-direction: column;
  }
  
  .search-button {
    width: 100%;
  }
  
  .search-filters {
    flex-direction: column;
    align-items: flex-start;
  }

  .search-header-pills {
    justify-content: flex-start;
  }
  
  .search-sort {
    margin-left: 0;
    width: 100%;
  }
  
  .search-results-grid-2 {
    grid-template-columns: 1fr;
  }
}
</style>
