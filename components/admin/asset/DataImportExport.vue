<template>
  <div class="asset-management-import-export">
    <div class="asset-management-card">
      <h3 class="asset-management-card-title">数据导入</h3>
      <div class="asset-management-import-content">
        <p class="asset-management-section-description">
          支持导入 CSV 格式的交易记录文件，系统将自动识别并生成持仓数据。
        </p>
        <div class="asset-management-import-formats">
          <span class="asset-management-format-tag">CSV</span>
          <span class="asset-management-format-tag">Excel（即将支持）</span>
        </div>
        <div class="asset-management-import-actions">
          <button @click="handleImportClick" class="asset-management-btn-primary">
            <span>📥</span>
            选择文件导入
          </button>
          <input
            ref="fileInput"
            type="file"
            accept=".csv,.xlsx,.xls"
            class="asset-management-file-input"
            @change="handleFileSelect"
          />
        </div>
        <div class="asset-management-import-example">
          <p><strong>CSV 格式示例：</strong></p>
          <pre>代码,名称,类型,交易类型,数量,价格,交易日期,备注
005918,天弘沪深300ETF联接C,fund,buy,1000,1.4078,2024-01-01,支付宝购买</pre>
        </div>
      </div>
    </div>

    <div class="asset-management-card">
      <h3 class="asset-management-card-title">数据导出</h3>
      <div class="asset-management-export-content">
        <p class="asset-management-section-description">
          导出投资记录、交易记录或统计数据为 CSV 格式，便于离线查看和分析。
        </p>
        <div class="asset-management-export-actions">
          <button @click="exportData('investments')" class="asset-management-btn-primary asset-management-btn-export">
            📊 导出投资记录
          </button>
          <button @click="exportData('transactions')" class="asset-management-btn-primary asset-management-btn-export">
            📋 导出交易记录
          </button>
          <button @click="exportData('stats')" class="asset-management-btn-primary asset-management-btn-export">
            📈 导出统计数据
          </button>
        </div>
      </div>
    </div>

    <!-- 导入模态框 -->
    <div v-if="showImportModal" class="asset-management-modal-overlay" @click="closeImportModal">
      <div class="asset-management-modal-content" @click.stop>
        <div class="asset-management-modal-header">
          <h2>导入交易记录</h2>
          <button @click="closeImportModal" class="asset-management-modal-close">×</button>
        </div>
        <div class="asset-management-modal-body">
          <div v-if="importing" class="asset-management-import-status">
            <div class="asset-management-spinner"></div>
            <p>正在导入，请稍候...</p>
          </div>
          <div v-else-if="importResult" class="asset-management-import-result">
            <div class="asset-management-result-summary">
              <div class="asset-management-result-item asset-management-result-success">
                <span class="asset-management-result-label">成功：</span>
                <span class="asset-management-result-value">{{ importResult.successCount }} 条</span>
              </div>
              <div class="asset-management-result-item asset-management-result-error">
                <span class="asset-management-result-label">失败：</span>
                <span class="asset-management-result-value">{{ importResult.failCount }} 条</span>
              </div>
            </div>
            <div v-if="importResult.errors.length > 0" class="asset-management-result-errors">
              <h4>错误详情：</h4>
              <ul>
                <li v-for="(error, index) in importResult.errors" :key="index">{{ error }}</li>
              </ul>
            </div>
          </div>
          <div class="asset-management-form-actions">
            <button @click="closeImportModal" class="asset-management-btn-secondary">关闭</button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useApi } from '~/composables/useApi'
import { useNotification } from '~/composables/useToast'
import { useRuntimeConfig } from '#app'

const api = useApi()
const config = useRuntimeConfig()
const { success, error: showError } = useNotification()

const fileInput = ref<HTMLInputElement | null>(null)
const importing = ref(false)
const importResult = ref<{ successCount: number; failCount: number; errors: string[] } | null>(null)
const showImportModal = ref(false)

const handleImportClick = () => {
  fileInput.value?.click()
}

const handleFileSelect = async (event: Event) => {
  const target = event.target as HTMLInputElement
  const file = target.files?.[0]
  if (!file) return

  const allowedExtensions = ['.csv', '.xlsx', '.xls']
  const fileExtension = '.' + file.name.split('.').pop()?.toLowerCase()
  if (!allowedExtensions.includes(fileExtension)) {
    showError('不支持的文件类型。请选择 CSV 或 Excel 文件')
    return
  }

  showImportModal.value = true
  await importFile(file)
}

const importFile = async (file: File) => {
  importing.value = true
  importResult.value = null

  try {
    const formData = new FormData()
    formData.append('file', file)

    const baseUrl = typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
      ? 'http://localhost:5234/api'
      : config.public.apiBase

    // Admin Web uses Nitro cookie auth; do not inject localStorage Bearer.
    const response = await $fetch<{ code: number; message: string; data: any }>('/InvestmentImport/import', {
      baseURL: baseUrl,
      method: 'POST',
      body: formData,
    })

    if (response.code !== undefined && response.code !== 0) {
      throw new Error(response.message || '导入失败')
    }

    const result = response.code === 0 ? response.data : response
    importResult.value = {
      successCount: result.successCount || 0,
      failCount: result.failCount || 0,
      errors: result.errors || []
    }

    if (result.successCount > 0) {
      success(`导入成功：${result.successCount} 条记录`)
    }

    if (result.failCount > 0) {
      showError(`导入失败：${result.failCount} 条记录`)
    }
  } catch (err: any) {
    console.error('导入失败:', err)
    showError(err.message || '导入失败')
  } finally {
    importing.value = false
    if (fileInput.value) {
      fileInput.value.value = ''
    }
  }
}

const exportData = async (type: 'investments' | 'transactions' | 'stats') => {
  try {
    const baseUrl = typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
      ? 'http://localhost:5234/api'
      : config.public.apiBase

    const url = `/InvestmentExport/${type}/csv`
    // Admin Web uses Nitro cookie auth; do not inject localStorage Bearer.
    const response = await fetch(`${baseUrl}${url}`, {
      method: 'GET',
    })

    if (!response.ok) {
      throw new Error('导出失败')
    }

    const contentDisposition = response.headers.get('Content-Disposition')
    let fileName = `export_${Date.now()}.csv`
    if (contentDisposition) {
      const fileNameMatch = contentDisposition.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/)
      if (fileNameMatch && fileNameMatch[1]) {
        fileName = fileNameMatch[1].replace(/['"]/g, '')
      }
    }

    const blob = await response.blob()
    const url_blob = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url_blob
    a.download = fileName
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    window.URL.revokeObjectURL(url_blob)

    success('导出成功')
  } catch (err: any) {
    console.error('导出失败:', err)
    showError(err.message || '导出失败')
  }
}

const closeImportModal = () => {
  showImportModal.value = false
  importResult.value = null
}
</script>

<style scoped>
/* 使用统一样式类，样式定义在 assets/css/admin-asset-management.css */
/* 组件特有样式使用 CSS 变量 */

.asset-management-import-export {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--spacing-lg);
}

.asset-management-import-content,
.asset-management-export-content {
  padding: 0;
}

.asset-management-section-description {
  color: var(--color-text-sec);
  font-size: 14px;
  margin-bottom: var(--spacing-md);
}

.asset-management-import-formats {
  display: flex;
  gap: var(--spacing-sm);
  margin-bottom: var(--spacing-md);
}

.asset-management-format-tag {
  padding: 4px var(--spacing-md);
  background: var(--color-bg-body);
  border-radius: var(--radius-sm);
  font-size: 12px;
  color: var(--color-text-sec);
}

.asset-management-import-actions,
.asset-management-export-actions {
  margin-bottom: var(--spacing-md);
}

.asset-management-btn-export {
  width: 100%;
  margin-bottom: var(--spacing-sm);
  justify-content: center;
}

.asset-management-file-input {
  display: none;
}

.asset-management-import-example {
  margin-top: var(--spacing-md);
  padding: var(--spacing-md);
  background: var(--color-bg-body);
  border-radius: var(--radius-sm);
}

.asset-management-import-example p {
  margin: 0 0 var(--spacing-sm) 0;
  font-size: 13px;
  color: var(--color-text-main);
}

.asset-management-import-example pre {
  margin: 0;
  padding: var(--spacing-sm);
  background: var(--color-bg-card);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  font-size: 12px;
  overflow-x: auto;
  color: var(--color-text-main);
}

/* 导入状态和结果样式 */
.asset-management-import-status {
  text-align: center;
  padding: 2rem;
}

.asset-management-spinner {
  display: inline-block;
  width: 2rem;
  height: 2rem;
  border: 3px solid var(--color-bg-body);
  border-top: 3px solid var(--color-primary);
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: var(--spacing-md);
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.asset-management-import-result {
  padding: var(--spacing-md) 0;
}

.asset-management-result-summary {
  display: flex;
  gap: var(--spacing-xl);
  margin-bottom: var(--spacing-lg);
}

.asset-management-result-item {
  flex: 1;
  padding: var(--spacing-md);
  border-radius: var(--radius-sm);
}

.asset-management-result-success {
  background: rgba(82, 196, 26, 0.1);
  border: 1px solid rgba(82, 196, 26, 0.3);
}

.asset-management-result-error {
  background: rgba(255, 77, 79, 0.1);
  border: 1px solid rgba(255, 77, 79, 0.3);
}

.asset-management-result-label {
  font-weight: 500;
  margin-right: var(--spacing-sm);
  color: var(--color-text-main);
}

.asset-management-result-value {
  font-size: 1.25rem;
  font-weight: 600;
  color: var(--color-text-main);
}

.asset-management-result-errors {
  margin-top: var(--spacing-md);
  padding: var(--spacing-md);
  background: rgba(255, 77, 79, 0.05);
  border: 1px solid rgba(255, 77, 79, 0.2);
  border-radius: var(--radius-sm);
}

.asset-management-result-errors h4 {
  margin: 0 0 var(--spacing-sm) 0;
  font-size: 0.875rem;
  color: var(--color-error);
}

.asset-management-result-errors ul {
  margin: 0;
  padding-left: var(--spacing-lg);
  font-size: 0.875rem;
  color: var(--color-text-sec);
}

.asset-management-result-errors li {
  margin-bottom: 4px;
}
</style>
