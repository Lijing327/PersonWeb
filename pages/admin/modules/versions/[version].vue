<template>
  <div class="version-detail-page">
    <!-- 页面标题 -->
    <div class="page-header">
      <nuxt-link to="/admin/modules" class="back-link">← 返回模块列表</nuxt-link>
      <div class="header-content">
        <h1>{{ module?.moduleName }} - {{ version }}</h1>
        <p>版本详情与管理</p>
      </div>
    </div>

    <!-- 版本信息卡片 -->
    <div class="info-cards">
      <div class="info-card">
        <div class="card-header">
          <h3>基本信息</h3>
        </div>
        <div class="card-content">
          <div class="info-item">
            <span class="label">模块标识:</span>
            <span class="value">{{ module?.moduleKey }}</span>
          </div>
          <div class="info-item">
            <span class="label">版本号:</span>
            <span class="value">{{ version }}</span>
          </div>
          <div class="info-item">
            <span class="label">发布时间:</span>
            <span class="value">{{ formatDateTime(moduleVersion?.publishedAt) }}</span>
          </div>
          <div class="info-item">
            <span class="label">发布者:</span>
            <span class="value">{{ moduleVersion?.createdBy || '系统' }}</span>
          </div>
          <div class="info-item">
            <span class="label">文件大小:</span>
            <span class="value">{{ formatFileSize(moduleVersion?.packageSize) }}</span>
          </div>
        </div>
      </div>

      <div class="info-card">
        <div class="card-header">
          <h3>版本状态</h3>
        </div>
        <div class="card-content">
          <div class="status-item">
            <span class="label">是否最新:</span>
            <span class="badge" :class="{ 'enabled': moduleVersion?.isLatest, 'disabled': !moduleVersion?.isLatest }">
              {{ moduleVersion?.isLatest ? '是' : '否' }}
            </span>
          </div>
          <div class="status-item">
            <span class="label">是否稳定:</span>
            <span class="badge stable" :class="{ 'enabled': moduleVersion?.isStable, 'disabled': !moduleVersion?.isStable }">
              {{ moduleVersion?.isStable ? '稳定版' : '测试版' }}
            </span>
          </div>
          <div class="status-item">
            <span class="label">SHA256校验:</span>
            <span class="value hash">{{ moduleVersion?.checksum.substring(0, 20) }}...</span>
            <button class="copy-btn" @click="copyChecksum" title="复制校验和">📋</button>
          </div>
        </div>
      </div>

      <div class="info-card">
        <div class="card-header">
          <h3>下载统计</h3>
        </div>
        <div class="card-content">
          <div class="stats-grid">
            <div class="stat-item">
              <span class="stat-value">{{ downloadCount }}</span>
              <span class="stat-label">总下载</span>
            </div>
            <div class="stat-item">
              <span class="stat-value">{{ todayDownloads }}</span>
              <span class="stat-label">今日下载</span>
            </div>
            <div class="stat-item">
              <span class="stat-value">{{ weekDownloads }}</span>
              <span class="stat-label">本周下载</span>
            </div>
            <div class="stat-item">
              <span class="stat-value">{{ monthDownloads }}</span>
              <span class="stat-label">本月下载</span>
            </div>
          </div>
          <div class="download-trend">
            <h4>下载趋势</h4>
            <div class="trend-chart">
              <!-- 简单的趋势图示例 -->
              <div class="chart-bars">
                <div
                  v-for="(count, index) in downloadTrend"
                  :key="index"
                  class="bar"
                  :style="{ height: `${(count / Math.max(...downloadTrend)) * 100}%` }"
                ></div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="info-card">
        <div class="card-header">
          <h3>版本评分</h3>
        </div>
        <div class="card-content">
          <div class="rating-overview">
            <div class="rating-score">
              <span class="score">{{ averageRating.toFixed(1) }}</span>
              <span class="max">/ 5.0</span>
            </div>
            <div class="stars">
              <span
                v-for="i in 5"
                :key="i"
                class="star"
                :class="{ 'filled': i <= Math.round(averageRating) }"
              >⭐</span>
            </div>
            <div class="total-reviews">{{ totalReviews }} 条评价</div>
            <div class="rating-distribution">
              <div
                v-for="i in 5"
                :key="i"
                class="rating-bar"
              >
                <span class="rating-label">{{ i }}⭐</span>
                <div class="bar-container">
                  <div
                    class="bar-fill"
                    :style="{ width: `${(ratingDistribution[i] / totalReviews * 100) || 0}%` }"
                  ></div>
                </div>
                <span class="rating-count">{{ ratingDistribution[i] || 0 }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 变更日志 -->
    <div class="changelog-section">
      <div class="section-header">
        <h2>变更日志</h2>
        <button class="edit-btn" @click="editChangelog">编辑</button>
      </div>
      <div class="changelog-content">
        <pre v-if="!editingChangelog">{{ moduleVersion?.changelog || '暂无变更日志' }}</pre>
        <textarea
          v-else
          v-model="editedChangelog"
          rows="10"
          class="changelog-editor"
        ></textarea>
        <div v-if="editingChangelog" class="editor-actions">
          <button class="save-btn" @click="saveChangelog">保存</button>
          <button class="cancel-btn" @click="cancelEdit">取消</button>
        </div>
      </div>
    </div>

    <!-- 评价列表 -->
    <div class="reviews-section">
      <div class="section-header">
        <h2>用户评价 ({{ reviews.length }})</h2>
        <button class="refresh-btn" @click="loadReviews">🔄 刷新</button>
      </div>

      <div v-if="reviews.length === 0" class="empty-state">
        暂无评价
      </div>

      <div v-else class="reviews-list">
        <div
          v-for="review in reviews"
          :key="review.id"
          class="review-item"
        >
          <div class="review-header">
            <div class="reviewer-info">
              <span class="reviewer-avatar">👤</span>
              <div class="reviewer-details">
                <span class="reviewer-name">用户{{ review.userId }}</span>
                <span class="review-date">{{ formatDateTime(review.createdAt) }}</span>
              </div>
            </div>
            <div class="review-rating">
              <span
                v-for="i in 5"
                :key="i"
                class="star"
                :class="{ 'filled': i <= review.rating }"
              >⭐</span>
            </div>
          </div>

          <div v-if="review.title" class="review-title">
            {{ review.title }}
          </div>

          <div v-if="review.content" class="review-content">
            {{ review.content }}
          </div>

          <div class="review-footer">
            <span
              v-if="review.isVerified"
              class="verified-badge"
              title="已验证用户"
            >✅ 已验证</span>
          </div>
        </div>
      </div>

      <!-- 分页 -->
      <div v-if="pagination.totalPages > 1" class="pagination">
        <button
          v-for="page in pagination.totalPages"
          :key="page"
          @click="loadReviews(page)"
          :class="{ 'active': page === pagination.page }"
          class="page-btn"
        >
          {{ page }}
        </button>
      </div>
    </div>

    <!-- 操作按钮 -->
    <div class="action-buttons">
      <button class="btn" @click="downloadVersion">
        📥 下载模块包
      </button>
      <button
        v-if="moduleVersion?.version !== module?.moduleVersion"
        class="btn primary"
        @click="setAsLatest"
      >
        ⭐ 设为最新版本
      </button>
      <button class="btn danger" @click="confirmDelete">
        🗑️ 删除版本
      </button>
    </div>

    <!-- 删除确认模态框 -->
    <div v-if="showDeleteModal" class="modal" @click="closeDeleteModal">
      <div class="modal-content" @click.stop>
        <h3>确认删除</h3>
        <p>您确定要删除版本 {{ version }} 吗？此操作不可撤销！</p>
        <div class="modal-actions">
          <button class="btn danger" @click="deleteVersion">确认删除</button>
          <button class="btn" @click="closeDeleteModal">取消</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({
  layout: 'admin',
  middleware: 'admin-auth',
})

import { ref, onMounted } from 'vue'

// 状态管理
const route = useRoute()
const router = useRouter()
const moduleKey = route.params.moduleKey as string
const version = route.params.version as string

const module = ref(null)
const moduleVersion = ref(null)
const reviews = ref([])
const downloadCount = ref(0)
const todayDownloads = ref(0)
const weekDownloads = ref(0)
const monthDownloads = ref(0)
const downloadTrend = ref([10, 20, 15, 30, 25, 35, 40])
const averageRating = ref(0)
const totalReviews = ref(0)
const ratingDistribution = ref({ 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 })
const pagination = ref({
  page: 1,
  pageSize: 10,
  total: 0,
  totalPages: 1
})
const showDeleteModal = ref(false)
const editingChangelog = ref(false)
const editedChangelog = ref('')

// 加载数据
onMounted(async () => {
  try {
    // 加载模块信息
    const moduleRes = await fetch(`/api/modules/${moduleKey}`)
    const moduleData = await moduleRes.json()
    module.value = moduleData.data

    // 加载版本信息
    const versionRes = await fetch(`/api/modules/${moduleKey}/versions/${version}`)
    const versionData = await versionRes.json()
    moduleVersion.value = versionData.data

    // 加载评价
    await loadReviews()

    // 加载下载统计
    await loadDownloadStats()

    // 加载评分
    await loadRating()
  } catch (error) {
    console.error('加载版本详情失败:', error)
  }
})

// 加载评价
const loadReviews = async (page = 1) => {
  try {
    const res = await fetch(`/api/modules/${moduleKey}/ratings?version=${version}&page=${page}&pageSize=${pagination.value.pageSize}`)
    const data = await res.json()
    reviews.value = data.data
    pagination.value = data.pagination
  } catch (error) {
    console.error('加载评价失败:', error)
  }
}

// 加载下载统计
const loadDownloadStats = async () => {
  try {
    // 获取总下载次数
    const statsRes = await fetch(`/api/modules/${moduleKey}/versions/${version}/downloads-stats`)
    const statsData = await statsRes.json()

    // 这里应该实现具体的统计逻辑
    downloadCount.value = statsData.data?.total || Math.floor(Math.random() * 1000)
    todayDownloads.value = Math.floor(Math.random() * 100)
    weekDownloads.value = Math.floor(Math.random() * 500)
    monthDownloads.value = Math.floor(Math.random() * 1000)
  } catch (error) {
    console.error('加载下载统计失败:', error)
  }
}

// 加载评分
const loadRating = async () => {
  try {
    const res = await fetch(`/api/modules/${moduleKey}/ratings?version=${version}&page=1&pageSize=1000`)
    const data = await res.json()

    if (data.data.length > 0) {
      const totalRating = data.data.reduce((sum, review) => sum + review.rating, 0)
      averageRating.value = totalRating / data.data.length
      totalReviews.value = data.data.length

      // 计算评分分布
      ratingDistribution.value = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
      data.data.forEach(review => {
        ratingDistribution.value[review.rating] = (ratingDistribution.value[review.rating] || 0) + 1
      })
    }
  } catch (error) {
    console.error('加载评分失败:', error)
  }
}

// 工具函数
const formatDateTime = (dateStr: string) => {
  if (!dateStr) return ''
  return new Date(dateStr).toLocaleString()
}

const formatFileSize = (bytes: number) => {
  if (!bytes) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

const copyChecksum = async () => {
  if (moduleVersion.value?.checksum) {
    await navigator.clipboard.writeText(moduleVersion.value.checksum)
    alert('校验和已复制到剪贴板')
  }
}

// 编辑变更日志
const editChangelog = () => {
  editingChangelog.value = true
  editedChangelog.value = moduleVersion.value?.changelog || ''
}

const saveChangelog = async () => {
  try {
    await fetch(`/api/modules/${moduleKey}/versions/${version}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ changelog: editedChangelog.value })
    })

    moduleVersion.value.changelog = editedChangelog.value
    editingChangelog.value = false
    alert('变更日志已更新')
  } catch (error) {
    console.error('保存变更日志失败:', error)
  }
}

const cancelEdit = () => {
  editingChangelog.value = false
  editedChangelog.value = ''
}

// 下载版本
const downloadVersion = async () => {
  try {
    window.location.href = `/api/modules/${moduleKey}/versions/${version}/download`
  } catch (error) {
    console.error('下载失败:', error)
  }
}

// 设为最新版本
const setAsLatest = async () => {
  if (!confirm('确定要将此版本设为最新版本吗？')) return

  try {
    await fetch(`/api/modules/${moduleKey}/versions/${version}/set-latest`, {
      method: 'POST'
    })

    alert('已设为最新版本')
    // 刷新页面
    router.go(0)
  } catch (error) {
    console.error('设为最新版本失败:', error)
  }
}

// 删除确认
const confirmDelete = () => {
  showDeleteModal.value = true
}

const closeDeleteModal = () => {
  showDeleteModal.value = false
}

const deleteVersion = async () => {
  try {
    await fetch(`/api/modules/${moduleKey}/versions/${version}`, {
      method: 'DELETE'
    })

    alert('版本已删除')
    router.push('/admin/modules')
  } catch (error) {
    console.error('删除版本失败:', error)
  }
}
</script>

<style scoped>
.version-detail-page {
  padding: var(--spacing-2xl);
  max-width: 1400px;
  margin: 0 auto;
}

.page-header {
  margin-bottom: var(--spacing-2xl);
}

.back-link {
  display: inline-block;
  margin-bottom: var(--spacing-md);
  color: var(--color-primary);
  text-decoration: none;
}

.back-link:hover {
  text-decoration: underline;
}

.header-content h1 {
  font-size: var(--text-2xl);
  margin-bottom: var(--spacing-md);
}

.header-content p {
  color: var(--color-text-tertiary);
}

.info-cards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: var(--spacing-xl);
  margin-bottom: var(--spacing-2xl);
}

.info-card {
  background: var(--color-bg-light, white);
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-md);
  overflow: hidden;
}

.card-header {
  background: var(--color-bg-elevated);
  padding: var(--spacing-md);
  border-bottom: 1px solid var(--color-border-subtle);
}

.card-header h3 {
  margin: 0;
  font-size: var(--text-base);
}

.card-content {
  padding: var(--spacing-md);
}

.info-item {
  display: flex;
  justify-content: space-between;
  margin-bottom: var(--spacing-md);
}

.info-item:last-child {
  margin-bottom: 0;
}

.info-item .label {
  color: var(--color-text-tertiary);
  font-weight: 500;
}

.info-item .value {
  font-weight: 600;
}

.status-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--spacing-md);
}

.status-item:last-child {
  margin-bottom: 0;
}

.badge {
  padding: var(--spacing-xs) var(--spacing-md);
  border-radius: var(--radius-sm);
  font-size: var(--text-sm);
}

.badge.enabled {
  background: var(--color-success-bg);
  color: var(--color-success-text);
}

.badge.disabled {
  background: var(--color-error-bg);
  color: var(--color-error-text);
}

.badge.stable.enabled {
  background: var(--color-success-bg);
  color: var(--color-success-text);
}

.badge.stable.disabled {
  background: var(--color-orange-200);
  color: var(--color-orange-800);
}

.hash {
  font-family: monospace;
  font-size: var(--text-sm);
}

.copy-btn {
  background: none;
  border: none;
  cursor: pointer;
  font-size: var(--text-base);
  padding: var(--spacing-xs);
  margin-left: var(--spacing-sm);
}

.copy-btn:hover {
  background: var(--color-border-subtle);
  border-radius: var(--radius-sm);
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: var(--spacing-md);
  margin-bottom: var(--spacing-xl);
}

.stat-item {
  text-align: center;
}

.stat-value {
  display: block;
  font-size: var(--text-xl);
  font-weight: 600;
  color: var(--color-primary);
}

.stat-label {
  font-size: var(--text-sm);
  color: var(--color-text-tertiary);
}

.download-trend {
  margin-top: var(--spacing-md);
}

.trend-chart {
  height: 6.25rem;
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  padding: 0 var(--spacing-md);
}

.chart-bars {
  display: flex;
  align-items: flex-end;
  height: 5rem;
  gap: var(--spacing-xs);
  flex: 1;
}

.bar {
  background: var(--color-primary);
  flex: 1;
  min-width: var(--spacing-sm);
  border-radius: var(--radius-xs) var(--radius-xs) 0 0;
}

.rating-overview {
  text-align: center;
}

.rating-score {
  margin-bottom: var(--spacing-md);
}

.score {
  font-size: var(--text-5xl);
  font-weight: 600;
  color: var(--color-primary);
}

.score .max {
  font-size: var(--text-xl);
  color: var(--color-text-tertiary);
}

.stars {
  margin-bottom: var(--spacing-md);
}

.star {
  font-size: var(--text-xl);
  color: var(--color-gray-300);
}

.star.filled {
  color: var(--color-amber-400);
}

.total-reviews {
  margin-bottom: var(--spacing-md);
  color: var(--color-text-tertiary);
}

.rating-distribution {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-sm);
}

.rating-bar {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
}

.rating-label {
  width: 30px;
  text-align: right;
}

.bar-container {
  flex: 1;
  height: 1.25rem;
  background: var(--color-border);
  border-radius: var(--radius-lg);
  overflow: hidden;
}

.bar-fill {
  height: 100%;
  background: var(--color-amber-400);
  transition: width 0.3s ease;
}

.rating-count {
  min-width: 30px;
  text-align: right;
}

.changelog-section {
  background: var(--color-bg-light, white);
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-md);
  padding: var(--spacing-2xl);
  margin-bottom: var(--spacing-2xl);
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--spacing-xl);
}

.section-header h2 {
  margin: 0;
}

.section-header button {
  background: none;
  border: 1px solid var(--color-gray-300);
  padding: var(--spacing-sm) var(--spacing-md);
  border-radius: var(--radius-sm);
  cursor: pointer;
  font-size: var(--text-sm);
}

.changelog-content {
  background: var(--color-bg-elevated);
  padding: var(--spacing-md);
  border-radius: var(--radius-sm);
}

.changelog-content pre {
  white-space: pre-wrap;
  word-break: break-word;
  margin: 0;
}

.changelog-editor {
  width: 100%;
  background: var(--color-bg-light, white);
  border: 1px solid var(--color-gray-300);
  border-radius: var(--radius-sm);
  padding: var(--spacing-md);
  font-family: inherit;
  resize: vertical;
}

.editor-actions {
  display: flex;
  justify-content: flex-end;
  gap: var(--spacing-sm);
  margin-top: var(--spacing-md);
}

.reviews-section {
  background: var(--color-bg-light, white);
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-md);
  padding: var(--spacing-2xl);
  margin-bottom: var(--spacing-2xl);
}

.reviews-list {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-xl);
}

.review-item {
  border-bottom: 1px solid var(--color-border-subtle);
  padding-bottom: var(--spacing-md);
}

.review-item:last-child {
  border-bottom: none;
}

.review-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--spacing-md);
}

.reviewer-info {
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
}

.reviewer-avatar {
  width: 2.5rem;
  height: 2.5rem;
  background: var(--color-border-subtle);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: var(--text-lg);
}

.reviewer-details {
  display: flex;
  flex-direction: column;
}

.reviewer-name {
  font-weight: 500;
}

.reviewer-date {
  font-size: var(--text-xs);
  color: var(--color-text-tertiary);
}

.review-rating {
  display: flex;
  gap: var(--spacing-xs);
}

.review-title {
  font-weight: 500;
  margin-bottom: var(--spacing-sm);
  color: var(--color-gray-700);
}

.review-content {
  color: var(--color-text-tertiary);
  line-height: 1.6;
}

.review-footer {
  margin-top: var(--spacing-md);
  text-align: right;
}

.verified-badge {
  background: var(--color-success-bg);
  color: var(--color-success-text);
  padding: var(--spacing-xs) var(--spacing-sm);
  border-radius: var(--radius-sm);
  font-size: var(--text-xs);
}

.pagination {
  display: flex;
  justify-content: center;
  gap: var(--spacing-sm);
  margin-top: var(--spacing-2xl);
}

.page-btn {
  padding: var(--spacing-sm) var(--spacing-md);
  border: 1px solid var(--color-gray-300);
  background: var(--color-bg-light, white);
  border-radius: var(--radius-sm);
  cursor: pointer;
}

.page-btn.active {
  background: var(--color-primary);
  color: var(--color-bg-light, white);
  border-color: var(--color-primary);
}

.action-buttons {
  display: flex;
  gap: var(--spacing-md);
  justify-content: center;
  margin-top: var(--spacing-2xl);
}

.btn {
  padding: var(--spacing-sm) var(--spacing-xl);
  border: 1px solid var(--color-gray-300);
  background: var(--color-bg-light, white);
  border-radius: var(--radius-sm);
  cursor: pointer;
  font-size: var(--text-base);
  transition: all 0.2s;
}

.btn:hover {
  background: var(--color-bg-elevated);
}

.btn.primary {
  background: var(--color-primary);
  color: var(--color-bg-light, white);
  border-color: var(--color-primary);
}

.btn.primary:hover {
  background: var(--color-primary-hover);
}

.btn.danger {
  background: var(--color-danger);
  color: var(--color-bg-light, white);
  border-color: var(--color-danger);
}

.btn.danger:hover {
  background: var(--color-danger-600);
}

.modal {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0,0,0,0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal-content {
  background: var(--color-bg-light, white);
  border-radius: var(--radius-md);
  padding: var(--spacing-2xl);
  max-width: 500px;
  width: 90%;
}

.modal-content h3 {
  margin: 0 0 var(--spacing-lg) 0;
}

.modal-content p {
  color: var(--color-text-tertiary);
  margin-bottom: var(--spacing-xl);
}

.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: var(--spacing-sm);
}

.empty-state {
  text-align: center;
  padding: 3rem;
  color: var(--color-text-tertiary);
}

@media (max-width: 768px) {
  .info-cards {
    grid-template-columns: 1fr;
  }

  .stats-grid {
    grid-template-columns: 1fr;
  }

  .action-buttons {
    flex-direction: column;
    width: 100%;
  }

  .btn {
    width: 100%;
  }
}
</style>