<template>
  <ClientOnly>
    <div class="admin-consultations-page">
      <div class="page-header">
        <h1 class="page-title">咨询管理</h1>
      </div>

      <!-- 筛选栏 -->
      <div class="filters-bar">
        <n-input
        v-model:value="searchKeyword"
        placeholder="搜索客户名、联系方式、商品名..."
        clearable
        style="width: 300px;"
        @keyup.enter="handleSearch"
      >
        <template #prefix>
          <i class="fas fa-search"></i>
        </template>
      </n-input>
      <n-select
        v-model:value="filterStatus"
        placeholder="状态筛选"
        clearable
        style="width: 150px;"
        :options="statusOptions"
      />
      <n-select
        v-model:value="filterSource"
        placeholder="来源筛选"
        clearable
        style="width: 170px;"
        :options="sourceOptions"
      />
      <n-button type="primary" @click="handleSearch">搜索</n-button>
      <n-button quaternary @click="handleReset">重置</n-button>
      <n-button
        v-if="consultations.length > 0"
        type="error"
        secondary
        @click="handleClearAll"
      >
        清空全部
      </n-button>
    </div>

    <div class="stats-grid">
      <div class="stats-card">
        <div class="stats-label">当前总线索</div>
        <div class="stats-value">{{ sourceStats.total }}</div>
      </div>
      <div class="stats-card">
        <div class="stats-label">首页快速咨询</div>
        <div class="stats-value stats-home">{{ sourceStats.home }}</div>
      </div>
      <div class="stats-card">
        <div class="stats-label">商品咨询</div>
        <div class="stats-value stats-product">{{ sourceStats.product }}</div>
      </div>
    </div>

    <!-- 数据表格 -->
    <div class="table-container">
      <div v-if="loading" class="table-loading">加载中...</div>
      <div v-else-if="consultations.length === 0" class="table-empty">暂无咨询数据</div>
      <table v-else class="data-table">
        <thead class="table-header">
          <tr>
            <th>ID</th>
            <th>来源</th>
            <th>商品名称</th>
            <th>客户姓名</th>
            <th>联系方式</th>
            <th>预算范围</th>
            <th>期望时间</th>
            <th>AI 评分</th>
            <th>AI 标签</th>
            <th>状态</th>
            <th>创建时间</th>
            <th>操作</th>
          </tr>
        </thead>
        <tbody class="table-body">
          <tr v-for="consultation in consultations" :key="consultation.id" class="table-row">
            <td class="table-cell">#{{ consultation.id }}</td>
            <td class="table-cell">
              <span :class="getSourceTagClass(consultation.sourceType)" class="tag">
                {{ consultation.sourceLabel || '-' }}
              </span>
            </td>
            <td class="table-cell">{{ consultation.productNameSnapshot }}</td>
            <td class="table-cell">{{ consultation.customerName }}</td>
            <td class="table-cell">
              <div class="text-sm">
                <div v-if="consultation.customerPhone">📱 {{ consultation.customerPhone }}</div>
                <div v-if="consultation.customerWeChat">💬 {{ consultation.customerWeChat }}</div>
                <div v-if="consultation.customerEmail">📧 {{ consultation.customerEmail }}</div>
              </div>
            </td>
            <td class="table-cell">{{ consultation.budgetRange || '-' }}</td>
            <td class="table-cell">{{ consultation.expectedDeadline || '-' }}</td>
            <td class="table-cell">
              <span v-if="consultation.score !== null && consultation.score !== undefined" 
                    :class="getScoreClass(consultation.score)" 
                    class="score-badge">
                {{ consultation.score }}
              </span>
              <span v-else class="text-muted">-</span>
            </td>
            <td class="table-cell">
              <div v-if="consultation.tags" class="tags-container">
                <span
                  v-for="tag in parseTags(consultation.tags)"
                  :key="tag"
                  class="tag-small"
                >
                  {{ tag }}
                </span>
              </div>
              <span v-else class="text-muted">-</span>
            </td>
            <td class="table-cell">
              <span :class="getStatusTagClass(consultation.status)" class="tag">
                {{ getStatusText(consultation.status) }}
              </span>
            </td>
            <td class="table-cell">{{ formatDate(consultation.createdAt) }}</td>
            <td class="table-cell">
              <div class="action-buttons">
                <button
                  @click="handleAiAnalyze(consultation)"
                  class="btn-link btn-link-purple"
                  title="AI 分析"
                >
                  <i class="fas fa-magic"></i> AI
                </button>
                <button
                  @click="handleAiQuotation(consultation)"
                  class="btn-link btn-link-orange"
                  title="AI 报价"
                >
                  <i class="fas fa-dollar-sign"></i> 报价
                </button>
                <button @click="handleViewDetail(consultation)" class="btn-link btn-link-blue">查看</button>
                <button
                  v-if="consultation.status !== 2"
                  @click="handleConvertToOrder(consultation)"
                  class="btn-link btn-link-green"
                >
                  转为订单
                </button>
                <button
                  @click="handleDelete(consultation)"
                  class="btn-link btn-link-red"
                >
                  删除
                </button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>

      <!-- 分页 -->
      <div v-if="pagination.itemCount > 0" class="table-pagination">
        <div class="pagination-info">共 {{ pagination.itemCount }} 条记录</div>
        <div class="pagination-controls">
          <select v-model="pagination.pageSize" @change="handlePageSizeChange" class="pagination-select">
            <option :value="10">10/页</option>
            <option :value="20">20/页</option>
            <option :value="50">50/页</option>
          </select>
          <div class="pagination-buttons">
            <button @click="pagination.page = 1; fetchConsultations()" :disabled="pagination.page === 1" class="pagination-btn">首页</button>
            <button @click="pagination.page--; fetchConsultations()" :disabled="pagination.page === 1" class="pagination-btn">上一页</button>
            <span class="pagination-info">{{ pagination.page }} / {{ pagination.totalPages }}</span>
            <button @click="pagination.page++; fetchConsultations()" :disabled="pagination.page >= pagination.totalPages" class="pagination-btn">下一页</button>
            <button @click="pagination.page = pagination.totalPages; fetchConsultations()" :disabled="pagination.page >= pagination.totalPages" class="pagination-btn">末页</button>
          </div>
        </div>
      </div>
    </div>

    <!-- 详情/编辑弹窗 -->
    <n-modal v-model:show="showDetailModal" preset="card" title="咨询详情" style="width: 800px;">
      <div v-if="currentConsultation" class="consultation-detail">
        <n-descriptions :column="2" bordered>
          <n-descriptions-item label="咨询ID">#{{ currentConsultation.id }}</n-descriptions-item>
          <n-descriptions-item label="来源">
            <span :class="getSourceTagClass(currentConsultation.sourceType)" class="tag">
              {{ currentConsultation.sourceLabel || '-' }}
            </span>
          </n-descriptions-item>
          <n-descriptions-item label="商品名称">{{ currentConsultation.productNameSnapshot }}</n-descriptions-item>
          <n-descriptions-item label="客户姓名">{{ currentConsultation.customerName }}</n-descriptions-item>
          <n-descriptions-item label="手机号">{{ currentConsultation.customerPhone || '-' }}</n-descriptions-item>
          <n-descriptions-item label="微信号">{{ currentConsultation.customerWeChat || '-' }}</n-descriptions-item>
          <n-descriptions-item label="邮箱">{{ currentConsultation.customerEmail || '-' }}</n-descriptions-item>
          <n-descriptions-item label="预算范围">{{ currentConsultation.budgetRange || '-' }}</n-descriptions-item>
          <n-descriptions-item label="期望完成时间">{{ currentConsultation.expectedDeadline || '-' }}</n-descriptions-item>
          <n-descriptions-item label="咨询状态">
            <n-select v-model:value="editForm.status" :options="statusOptions" />
          </n-descriptions-item>
          <n-descriptions-item label="创建时间">{{ formatDate(currentConsultation.createdAt) }}</n-descriptions-item>
          <n-descriptions-item label="需求描述" :span="2">
            <div class="whitespace-pre-line bg-gray-50 p-3 rounded">{{ currentConsultation.requirementDescription }}</div>
          </n-descriptions-item>
          <n-descriptions-item v-if="currentConsultation.summary" label="AI 摘要" :span="2">
            <div class="whitespace-pre-line bg-blue-50 p-3 rounded">{{ currentConsultation.summary }}</div>
          </n-descriptions-item>
          <n-descriptions-item v-if="currentConsultation.aiRecommendation" label="AI 推荐建议" :span="2">
            <div class="whitespace-pre-line bg-green-50 p-3 rounded">{{ currentConsultation.aiRecommendation }}</div>
          </n-descriptions-item>
          <n-descriptions-item label="内部备注" :span="2">
            <n-input
              v-model:value="editForm.internalNote"
              type="textarea"
              :rows="3"
              placeholder="请输入内部备注"
            />
          </n-descriptions-item>
        </n-descriptions>

        <div class="mt-4 flex justify-end gap-2">
          <n-button quaternary @click="showDetailModal = false">取消</n-button>
          <n-button type="primary" @click="handleSaveStatus">保存</n-button>
        </div>
      </div>
    </n-modal>

    <!-- 报价方案弹窗 -->
    <n-modal v-model:show="showQuotationModal" preset="card" title="AI 报价方案" style="width: 800px;">
      <div v-if="currentQuotation" class="quotation-content">
        <h3 class="quotation-title">{{ currentQuotation.title }}</h3>
        <p v-if="currentQuotation.summary" class="quotation-summary">{{ currentQuotation.summary }}</p>
        
        <div v-if="currentQuotation.items && currentQuotation.items.length > 0" class="quotation-items">
          <h4 class="quotation-section-title">报价明细</h4>
          <table class="quotation-table">
            <thead>
              <tr>
                <th>项目名称</th>
                <th>描述</th>
                <th>数量</th>
                <th>单价</th>
                <th>小计</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(item, index) in currentQuotation.items" :key="index">
                <td>{{ item.name }}</td>
                <td>{{ item.description }}</td>
                <td>{{ item.quantity }}</td>
                <td>¥{{ item.unitPrice.toFixed(2) }}</td>
                <td>¥{{ item.total.toFixed(2) }}</td>
              </tr>
            </tbody>
            <tfoot>
              <tr>
                <td colspan="4" class="text-right font-bold">总计：</td>
                <td class="font-bold">¥{{ currentQuotation.totalAmount.toFixed(2) }}</td>
              </tr>
            </tfoot>
          </table>
        </div>

        <div class="quotation-details">
          <div v-if="currentQuotation.paymentTerms" class="detail-item">
            <strong>付款方式：</strong>{{ currentQuotation.paymentTerms }}
          </div>
          <div v-if="currentQuotation.deliveryTime" class="detail-item">
            <strong>交付时间：</strong>{{ currentQuotation.deliveryTime }}
          </div>
          <div v-if="currentQuotation.warranty" class="detail-item">
            <strong>质保说明：</strong>{{ currentQuotation.warranty }}
          </div>
          <div v-if="currentQuotation.notes" class="detail-item">
            <strong>备注：</strong>{{ currentQuotation.notes }}
          </div>
        </div>
      </div>
    </n-modal>
    </div>
    <template #fallback>
      <div class="admin-consultations-page">
        <div class="page-header">
          <h1 class="page-title">咨询管理</h1>
        </div>
        <div class="table-loading">加载中...</div>
      </div>
    </template>
  </ClientOnly>
</template>

<script setup lang="ts">
import { NInput, NSelect, NButton, NModal, NDescriptions, NDescriptionsItem } from 'naive-ui'

definePageMeta({
  layout: 'admin',
  middleware: 'admin-auth'
})

const api = useApi()
const message = useSafeMessage()

const loading = ref(false)
const consultations = ref<any[]>([])
const searchKeyword = ref('')
const filterStatus = ref<number | null>(null)
const filterSource = ref<string | null>(null)
const sourceStats = ref({
  total: 0,
  home: 0,
  product: 0
})

const pagination = ref({
  page: 1,
  pageSize: 20,
  itemCount: 0,
  totalPages: 0
})

const statusOptions = [
  { label: '新咨询', value: 0 },
  { label: '已联系', value: 1 },
  { label: '已转为订单', value: 2 },
  { label: '已关闭', value: 3 }
]

const sourceOptions = [
  { label: '首页快速咨询', value: 'home' },
  { label: '商品咨询', value: 'product' }
]

const showDetailModal = ref(false)
const currentConsultation = ref<any>(null)
const editForm = ref({
  status: 0,
  internalNote: ''
})

const showQuotationModal = ref(false)
const currentQuotation = ref<any>(null)

// 获取咨询列表
const fetchConsultations = async () => {
  loading.value = true
  try {
    const res = await api.get<any>('/admin/consultations', {
      params: {
        status: filterStatus.value,
        source: filterSource.value,
        keyword: searchKeyword.value,
        page: pagination.value.page,
        pageSize: pagination.value.pageSize
      }
    })

    console.log('获取咨询列表响应:', res)
    
    // useApi 已经处理了响应格式，返回的是 data 部分
    // 后端返回格式：{ code: 0, data: { Total: xxx, List: [], ... } }
    // useApi 处理后，res 就是 { Total: xxx, List: [], ... }
    if (res) {
      // 检查 res 是否包含 List 字段（后端使用大写）
      if (res.List && Array.isArray(res.List)) {
        consultations.value = res.List
        pagination.value.itemCount = res.Total ?? res.total ?? 0
        pagination.value.totalPages = res.TotalPages ?? res.totalPages ?? 0
        sourceStats.value.total = res.Total ?? res.total ?? 0
        sourceStats.value.home = res.HomeCount ?? res.homeCount ?? 0
        sourceStats.value.product = res.ProductCount ?? res.productCount ?? 0
      } else if (res.list && Array.isArray(res.list)) {
        // 兼容小写格式
        consultations.value = res.list
        pagination.value.itemCount = res.Total ?? res.total ?? 0
        pagination.value.totalPages = res.TotalPages ?? res.totalPages ?? 0
        sourceStats.value.total = res.Total ?? res.total ?? 0
        sourceStats.value.home = res.HomeCount ?? res.homeCount ?? 0
        sourceStats.value.product = res.ProductCount ?? res.productCount ?? 0
      } else if (Array.isArray(res)) {
        // 如果直接返回数组
        consultations.value = res
        pagination.value.itemCount = res.length
        pagination.value.totalPages = 1
        sourceStats.value.total = res.length
        sourceStats.value.home = 0
        sourceStats.value.product = 0
      } else {
        // 其他格式，尝试从 data 字段获取
        consultations.value = res.data?.List || res.data?.list || res.List || res.list || []
        pagination.value.itemCount = res.data?.Total || res.data?.total || res.Total || res.total || 0
        pagination.value.totalPages = res.data?.TotalPages || res.data?.totalPages || res.TotalPages || res.totalPages || 0
        sourceStats.value.total = res.data?.Total || res.data?.total || res.Total || res.total || 0
        sourceStats.value.home = res.data?.HomeCount || res.data?.homeCount || res.HomeCount || res.homeCount || 0
        sourceStats.value.product = res.data?.ProductCount || res.data?.productCount || res.ProductCount || res.productCount || 0
      }
      
      console.log('解析后的咨询列表:', {
        count: consultations.value.length,
        itemCount: pagination.value.itemCount,
        totalPages: pagination.value.totalPages
      })
    } else {
      consultations.value = []
      pagination.value.itemCount = 0
      pagination.value.totalPages = 0
      sourceStats.value.total = 0
      sourceStats.value.home = 0
      sourceStats.value.product = 0
    }
  } catch (e: any) {
    console.error('获取咨询列表失败:', e)
    message.error('获取咨询列表失败')
  } finally {
    loading.value = false
  }
}

// 搜索
const handleSearch = () => {
  pagination.value.page = 1
  fetchConsultations()
}

// 重置
const handleReset = () => {
  searchKeyword.value = ''
  filterStatus.value = null
  filterSource.value = null
  pagination.value.page = 1
  fetchConsultations()
}

// 查看详情
const handleViewDetail = async (consultation: any) => {
  try {
    const res = await api.get<any>(`/admin/consultations/${consultation.id}`)
    console.log('获取咨询详情响应:', res)
    
    // useApi 已经处理了响应格式，返回的是 data 部分
    if (res && (res.id || res.productId)) {
      currentConsultation.value = res
      editForm.value = {
        status: res.status,
        internalNote: res.internalNote || ''
      }
      showDetailModal.value = true
    } else {
      message.error('获取咨询详情失败')
    }
  } catch (e: any) {
    console.error('获取咨询详情失败:', e)
    message.error(e.response?.data?.message || e.message || '获取咨询详情失败')
  }
}

// 转为订单
const handleConvertToOrder = async (consultation: any) => {
  try {
    // useApi 已经处理了响应格式，如果成功会返回 data，如果失败会抛出异常
    const res = await api.post<any>(`/admin/consultations/${consultation.id}/convert-to-order`)
    // res 可能是 { orderNo: 'xxx' } 或 { OrderNo: 'xxx' } 格式
    const orderNo = res?.orderNo || res?.OrderNo
    if (orderNo) {
      message.success(`转换成功！新订单号：${orderNo}`)
      fetchConsultations()
    } else {
      message.error('转换失败：未返回订单号')
    }
  } catch (e: any) {
    console.error('转换咨询为订单失败:', e)
    const errorMessage = e.response?.data?.message || e.message || '转换失败'
    message.error(errorMessage)
  }
}

const handleDelete = async (consultation: any) => {
  if (!confirm(`确定删除咨询 #${consultation.id}？此操作不可恢复。`)) {
    return
  }

  try {
    await api.delete(`/admin/consultations/${consultation.id}`)
    message.success('已删除')
    fetchConsultations()
  } catch (e: any) {
    message.error(e?.message || '删除失败')
  }
}

const handleClearAll = async () => {
  if (!confirm('确定清空当前筛选条件下的全部咨询记录？此操作不可恢复。')) {
    return
  }

  try {
    const res = await api.get<any>('/admin/consultations', {
      params: {
        status: filterStatus.value ?? undefined,
        keyword: searchKeyword.value || undefined,
        source: filterSource.value ?? undefined,
        page: 1,
        pageSize: 1000,
      },
    })

    const list = res?.list || res?.List || []
    const ids = list.map((item: { id: number }) => item.id)
    if (ids.length === 0) {
      message.warning('没有可删除的记录')
      return
    }

    if (!confirm(`将删除 ${ids.length} 条记录，确认继续？`)) {
      return
    }

    await api.post('/admin/consultations/batch-delete', { ids })
    message.success(`已删除 ${ids.length} 条记录`)
    fetchConsultations()
  } catch (e: any) {
    message.error(e?.message || '清空失败')
  }
}

// AI 分析
const handleAiAnalyze = async (consultation: any) => {
  try {
    message.loading('正在分析线索...', { duration: 0 })
    
    const res = await api.post('/ai/leads/analyze', {
      leadId: consultation.id,
      rawText: consultation.requirementDescription,
      meta: {
        budget: consultation.budgetRange,
        deadline: consultation.expectedDeadline,
        channel: 'web'
      }
    })

    message.destroyAll()
    
    if (res && res.success) {
      message.success('AI 分析完成！已自动保存分析结果')
      await fetchConsultations() // 刷新列表
    } else {
      const errorMsg = res?.errorMessage || res?.message || '分析失败'
      message.error(`AI 分析失败: ${errorMsg}。请检查 AI 服务是否正常运行。`)
    }
  } catch (e: any) {
    message.destroyAll()
    console.error('AI 分析失败:', e)
    const errorMsg = e.response?.data?.errorMessage || e.response?.data?.message || e.message || '分析失败'
    // 检查是否是连接错误
    if (errorMsg.includes('连接') || errorMsg.includes('Connection') || errorMsg.includes('refused') || errorMsg.includes('timeout')) {
      message.error(`AI 服务连接失败: ${errorMsg}。请确保 Python AI 服务正在运行（http://localhost:8001）。`)
    } else {
      message.error(`AI 分析失败: ${errorMsg}`)
    }
  }
}

// 解析标签（支持 JSON 数组和逗号分隔字符串）
const parseTags = (tags: string): string[] => {
  if (!tags) return []
  try {
    const parsed = JSON.parse(tags)
    if (Array.isArray(parsed)) {
      return parsed
    }
  } catch {
    // 如果不是 JSON，尝试按逗号分隔
    return tags.split(',').map(t => t.trim()).filter(t => t)
  }
  return []
}

// 获取评分样式类
const getScoreClass = (score: number): string => {
  if (score >= 80) return 'score-high'
  if (score >= 60) return 'score-medium'
  return 'score-low'
}

// AI 报价
const handleAiQuotation = async (consultation: any) => {
  try {
    message.loading('正在生成报价方案...', { duration: 0 })
    
    const res = await api.post('/ai/quotation/generate', {
      leadId: consultation.id,
      projectId: null,
      extraNotes: ''
    })

    message.destroyAll()
    
    if (res && res.success && res.quotation) {
      showQuotationModal.value = true
      currentQuotation.value = res.quotation
    } else {
      const errorMsg = res?.errorMessage || res?.message || '生成报价失败'
      message.error(`AI 报价失败: ${errorMsg}。请检查 AI 服务是否正常运行。`)
    }
  } catch (e: any) {
    message.destroyAll()
    console.error('AI 报价失败:', e)
    const errorMsg = e.response?.data?.errorMessage || e.response?.data?.message || e.message || '生成报价失败'
    // 检查是否是连接错误
    if (errorMsg.includes('连接') || errorMsg.includes('Connection') || errorMsg.includes('refused') || errorMsg.includes('timeout')) {
      message.error(`AI 服务连接失败: ${errorMsg}。请确保 Python AI 服务正在运行（http://localhost:8001）。`)
    } else {
      message.error(`AI 报价失败: ${errorMsg}`)
    }
  }
}

// 保存状态
const handleSaveStatus = async () => {
  if (!currentConsultation.value) return

  try {
    // useApi 已经处理了响应格式，如果成功会返回 data（可能为 null），如果失败会抛出异常
    await api.put<any>(`/admin/consultations/${currentConsultation.value.id}`, {
      status: editForm.value.status,
      internalNote: editForm.value.internalNote
    })

    // 如果没有抛出异常，说明保存成功
    message.success('保存成功')
    showDetailModal.value = false
    fetchConsultations()
  } catch (e: any) {
    console.error('保存咨询状态失败:', e)
    // 显示详细的错误信息
    const errorMessage = e.response?.data?.message || e.message || '保存失败'
    message.error(errorMessage)
  }
}

// 分页大小改变
const handlePageSizeChange = () => {
  pagination.value.page = 1
  fetchConsultations()
}

// 获取状态文本
const getStatusText = (status: number): string => {
  const statusMap: Record<number, string> = {
    0: '新咨询',
    1: '已联系',
    2: '已转为订单',
    3: '已关闭'
  }
  return statusMap[status] || '未知'
}

// 获取状态标签类
const getStatusTagClass = (status: number): string => {
  const classMap: Record<number, string> = {
    0: 'tag tag-info',
    1: 'tag tag-warning',
    2: 'tag tag-success',
    3: 'tag tag-default'
  }
  return classMap[status] || 'tag tag-default'
}

const getSourceTagClass = (sourceType?: string): string => {
  if (sourceType === 'home') return 'tag tag-source-home'
  if (sourceType === 'product') return 'tag tag-source-product'
  return 'tag tag-default'
}

// 格式化日期
const formatDate = (dateString: string) => {
  if (!dateString) return '-'
  return new Date(dateString).toLocaleString('zh-CN')
}

onMounted(() => {
  fetchConsultations()
})

// 设置页面标题
useHead({
  title: '咨询管理 - 后台管理',
  meta: [
    { name: 'description', content: '咨询管理页面' }
  ]
})
</script>

<style scoped>
.admin-consultations-page {
  padding: 24px;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
}

.page-title {
  font-size: 24px;
  font-weight: 600;
  color: var(--color-text-main);
}

.filters-bar {
  display: flex;
  gap: 12px;
  margin-bottom: 24px;
  flex-wrap: wrap;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 12px;
  margin-bottom: 16px;
}

.stats-card {
  background: var(--color-bg-card);
  border: 1px solid var(--color-border-default);
  border-radius: 10px;
  padding: 14px 16px;
}

.stats-label {
  font-size: 12px;
  color: var(--color-text-muted);
  margin-bottom: 8px;
}

.stats-value {
  font-size: 24px;
  font-weight: 700;
  color: var(--color-text-main);
  line-height: 1;
}

.stats-home {
  color: var(--color-primary);
}

.stats-product {
  color: var(--color-success);
}

.table-container {
  background: var(--color-bg-card);
  border-radius: 8px;
  overflow: hidden;
}

.table-loading,
.table-empty {
  padding: 40px;
  text-align: center;
  color: var(--color-text-muted);
}

.data-table {
  width: 100%;
  border-collapse: collapse;
}

.table-header {
  background: var(--color-bg-elevated);
}

.table-header th {
  padding: 12px;
  text-align: left;
  font-weight: 600;
  color: var(--color-text-main);
  border-bottom: 1px solid var(--color-border-default);
}

.table-body .table-row:hover {
  background: var(--color-bg-elevated);
}

.table-cell {
  padding: 12px;
  border-bottom: 1px solid var(--color-border-default);
  color: var(--color-text-main);
}

.action-buttons {
  display: flex;
  gap: 8px;
}

.btn-link {
  padding: 4px 12px;
  border: none;
  background: transparent;
  cursor: pointer;
  border-radius: 4px;
  transition: all 0.2s;
}

.btn-link-blue {
  color: var(--color-primary);
}

.btn-link-blue:hover {
  background: var(--color-primary-soft);
}

.btn-link-green {
  color: var(--color-success);
}

.btn-link-purple {
  color: var(--chart-quinary);
}

.btn-link-purple:hover {
  background: var(--color-bg-elevated);
}

.btn-link-orange {
  color: var(--chart-tertiary);
}

.btn-link-orange:hover {
  background: var(--color-bg-elevated);
}

.btn-link-red {
  color: var(--color-error, #ef4444);
}

.btn-link-red:hover {
  background: var(--color-bg-elevated);
}

.quotation-content {
  padding: 8px 0;
}

.quotation-title {
  font-size: 1.25rem;
  font-weight: 600;
  margin-bottom: 12px;
  color: var(--n-text-color);
}

.quotation-summary {
  color: var(--n-text-color-2);
  margin-bottom: 20px;
  line-height: 1.6;
}

.quotation-section-title {
  font-size: 1rem;
  font-weight: 600;
  margin: 20px 0 12px 0;
  color: var(--n-text-color);
}

.quotation-table {
  width: 100%;
  border-collapse: collapse;
  margin-bottom: 20px;
}

.quotation-table th,
.quotation-table td {
  padding: 8px 12px;
  text-align: left;
  border-bottom: 1px solid var(--n-border-color);
}

.quotation-table th {
  background: var(--n-color);
  font-weight: 600;
  color: var(--n-text-color);
}

.quotation-table tfoot {
  border-top: 2px solid var(--n-border-color);
}

.quotation-details {
  margin-top: 20px;
  padding-top: 20px;
  border-top: 1px solid var(--n-border-color);
}

.detail-item {
  margin-bottom: 12px;
  line-height: 1.6;
  color: var(--n-text-color);
}

/* 评分徽章 */
.score-badge {
  display: inline-block;
  padding: 4px 8px;
  border-radius: 4px;
  font-weight: 600;
  font-size: 12px;
}

.score-high {
  background: var(--color-success);
  opacity: 0.1;
  color: var(--color-success);
}

.score-medium {
  background: var(--chart-tertiary);
  opacity: 0.1;
  color: var(--chart-tertiary);
}

.score-low {
  background: var(--color-error);
  opacity: 0.1;
  color: var(--color-error);
}

/* 标签容器 */
.tags-container {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
}

.tag-small {
  display: inline-block;
  padding: 2px 8px;
  background: var(--color-primary-soft);
  color: var(--color-primary);
  border-radius: 12px;
  font-size: 11px;
  font-weight: 500;
}

.text-muted {
  color: var(--color-text-muted);
}

.btn-link-green:hover {
  background: var(--color-success);
  opacity: 0.1;
}

.tag {
  display: inline-block;
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 12px;
}

.tag-warning {
  background: var(--chart-tertiary);
  opacity: 0.1;
  color: var(--chart-tertiary);
}

.tag-info {
  background: var(--color-primary-soft);
  color: var(--color-primary);
}

.tag-success {
  background: var(--color-success);
  opacity: 0.1;
  color: var(--color-success);
}

.tag-default {
  background: var(--color-bg-elevated);
  color: var(--color-text-main);
}

.tag-source-home {
  background: var(--color-primary-soft);
  color: var(--color-primary);
}

.tag-source-product {
  background: var(--color-bg-elevated);
  border: 1px solid var(--color-border-default);
  color: var(--color-success);
}

.table-pagination {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px;
  border-top: 1px solid var(--color-border-default);
}

.pagination-controls {
  display: flex;
  gap: 12px;
  align-items: center;
}

.pagination-select {
  padding: 4px 8px;
  border: 1px solid var(--color-border-default, #d1d5db);
  border-radius: 4px;
}

.pagination-buttons {
  display: flex;
  gap: 8px;
  align-items: center;
}

.pagination-btn {
  padding: 4px 12px;
  border: 1px solid var(--color-border-default, #d1d5db);
  background: var(--color-bg-card, white);
  border-radius: 4px;
  cursor: pointer;
}

.pagination-btn:hover:not(:disabled) {
  background: var(--color-bg-elevated);
}

.pagination-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.consultation-detail {
  padding: 16px 0;
}

@media (max-width: 900px) {
  .stats-grid {
    grid-template-columns: 1fr;
  }
}
</style>

