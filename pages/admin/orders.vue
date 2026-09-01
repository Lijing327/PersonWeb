<template>
  <ClientOnly>
    <div class="admin-orders-page">
      <div class="page-header">
        <h1 class="page-title">订单管理</h1>
      </div>

    <!-- 筛选栏 -->
    <div class="filters-bar">
      <n-input
        v-model:value="searchKeyword"
        placeholder="搜索订单号、客户名、电话、邮箱、微信..."
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
      <n-button type="primary" @click="handleSearch">搜索</n-button>
      <n-button quaternary @click="handleReset">重置</n-button>
    </div>

    <!-- 数据表格 -->
    <div class="table-container">
      <div v-if="loading" class="table-loading">加载中...</div>
      <div v-else-if="orders.length === 0" class="table-empty">暂无订单数据</div>
      <table v-else class="data-table">
        <thead class="table-header">
          <tr>
            <th>订单编号</th>
            <th>商品名称</th>
            <th>客户姓名</th>
            <th>联系方式</th>
            <th>总金额</th>
            <th>状态</th>
            <th>下单时间</th>
            <th>操作</th>
          </tr>
        </thead>
        <tbody class="table-body">
          <tr v-for="order in orders" :key="order.id" class="table-row">
            <td class="table-cell font-mono">{{ order.orderNo }}</td>
            <td class="table-cell">{{ order.productNameSnapshot }}</td>
            <td class="table-cell">{{ order.customerName }}</td>
            <td class="table-cell">
              <div class="text-sm">
                <div v-if="order.customerPhone">📱 {{ order.customerPhone }}</div>
                <div v-if="order.customerWeChat">💬 {{ order.customerWeChat }}</div>
                <div v-if="order.customerEmail">📧 {{ order.customerEmail }}</div>
              </div>
            </td>
            <td class="table-cell">
              {{ order.totalAmount ? `¥${order.totalAmount.toFixed(2)}` : '面议' }}
            </td>
            <td class="table-cell">
              <span :class="getStatusTagClass(order.status)" class="tag">
                {{ getStatusText(order.status) }}
              </span>
            </td>
            <td class="table-cell">{{ formatDate(order.createdAt) }}</td>
            <td class="table-cell">
              <div class="action-buttons">
                <button @click="handleViewDetail(order)" class="btn-link btn-link-blue">查看</button>
                <button @click="handleEditStatus(order)" class="btn-link btn-link-green">编辑状态</button>
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
            <button @click="pagination.page = 1; fetchOrders()" :disabled="pagination.page === 1" class="pagination-btn">首页</button>
            <button @click="pagination.page--; fetchOrders()" :disabled="pagination.page === 1" class="pagination-btn">上一页</button>
            <span class="pagination-info">{{ pagination.page }} / {{ pagination.totalPages }}</span>
            <button @click="pagination.page++; fetchOrders()" :disabled="pagination.page >= pagination.totalPages" class="pagination-btn">下一页</button>
            <button @click="pagination.page = pagination.totalPages; fetchOrders()" :disabled="pagination.page >= pagination.totalPages" class="pagination-btn">末页</button>
          </div>
        </div>
      </div>
    </div>

    <!-- 详情/编辑弹窗 -->
    <n-modal v-model:show="showDetailModal" preset="card" title="订单详情" style="width: 800px;">
      <div v-if="currentOrder" class="order-detail">
        <n-descriptions :column="2" bordered>
          <n-descriptions-item label="订单编号">{{ currentOrder.orderNo }}</n-descriptions-item>
          <n-descriptions-item label="商品名称">{{ currentOrder.productNameSnapshot }}</n-descriptions-item>
          <n-descriptions-item label="客户姓名">{{ currentOrder.customerName }}</n-descriptions-item>
          <n-descriptions-item label="手机号">{{ currentOrder.customerPhone || '-' }}</n-descriptions-item>
          <n-descriptions-item label="微信号">{{ currentOrder.customerWeChat || '-' }}</n-descriptions-item>
          <n-descriptions-item label="邮箱">{{ currentOrder.customerEmail || '-' }}</n-descriptions-item>
          <n-descriptions-item label="数量">{{ currentOrder.quantity }}</n-descriptions-item>
          <n-descriptions-item label="总金额">{{ currentOrder.totalAmount ? `¥${currentOrder.totalAmount.toFixed(2)}` : '面议' }}</n-descriptions-item>
          <n-descriptions-item label="订单状态">
            <n-select v-model:value="editForm.status" :options="statusOptions" />
          </n-descriptions-item>
          <n-descriptions-item label="下单时间">{{ formatDate(currentOrder.createdAt) }}</n-descriptions-item>
          <n-descriptions-item label="需求说明" :span="2">
            <div class="whitespace-pre-line">{{ currentOrder.remark || '-' }}</div>
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
    </div>
    <template #fallback>
      <div class="admin-orders-page">
        <div class="page-header">
          <h1 class="page-title">订单管理</h1>
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
const orders = ref<any[]>([])
const searchKeyword = ref('')
const filterStatus = ref<number | null>(null)

const pagination = ref({
  page: 1,
  pageSize: 20,
  itemCount: 0,
  totalPages: 0
})

const statusOptions = [
  { label: '待确认', value: 0 },
  { label: '进行中', value: 1 },
  { label: '已完成', value: 2 },
  { label: '已关闭', value: 3 }
]

const showDetailModal = ref(false)
const currentOrder = ref<any>(null)
const editForm = ref({
  status: 0,
  internalNote: ''
})

// 获取订单列表
const fetchOrders = async () => {
  loading.value = true
  try {
    const res = await api.get<any>('/admin/orders', {
      params: {
        status: filterStatus.value,
        keyword: searchKeyword.value,
        page: pagination.value.page,
        pageSize: pagination.value.pageSize
      }
    })

    console.log('获取订单列表响应:', res)
    
    // useApi 已经处理了响应格式，返回的是 data 部分
    // 后端返回格式：{ code: 0, data: { Total: 0, List: [], TotalPages: 0, ... } }
    // useApi 处理后，res 就是 { Total: 0, List: [], TotalPages: 0, ... }
    if (res) {
      // 后端返回的是 PascalCase：Total, List, TotalPages
      // 兼容处理：同时支持 PascalCase 和 camelCase
      const list = res.List || res.list || []
      const total = res.Total || res.total || 0
      const totalPages = res.TotalPages || res.totalPages || 0
      
      orders.value = Array.isArray(list) ? list : []
      pagination.value.itemCount = total
      pagination.value.totalPages = totalPages
      
      console.log('解析后的订单列表:', {
        count: orders.value.length,
        itemCount: pagination.value.itemCount,
        totalPages: pagination.value.totalPages
      })
    } else {
      orders.value = []
      pagination.value.itemCount = 0
      pagination.value.totalPages = 0
    }
  } catch (e: any) {
    console.error('获取订单列表失败:', e)
    message.error('获取订单列表失败')
  } finally {
    loading.value = false
  }
}

// 搜索
const handleSearch = () => {
  pagination.value.page = 1
  fetchOrders()
}

// 重置
const handleReset = () => {
  searchKeyword.value = ''
  filterStatus.value = null
  pagination.value.page = 1
  fetchOrders()
}

// 查看详情
const handleViewDetail = async (order: any) => {
  try {
    const res = await api.get<any>(`/admin/orders/${order.id}`)
    console.log('获取订单详情响应:', res)
    
    // useApi 已经处理了响应格式，返回的是 data 部分
    if (res && (res.id || res.orderNo)) {
      currentOrder.value = res
      editForm.value = {
        status: res.status,
        internalNote: res.internalNote || ''
      }
      showDetailModal.value = true
    } else {
      message.error('获取订单详情失败')
    }
  } catch (e: any) {
    console.error('获取订单详情失败:', e)
    message.error(e.response?.data?.message || e.message || '获取订单详情失败')
  }
}

// 编辑状态
const handleEditStatus = (order: any) => {
  handleViewDetail(order)
}

// 保存状态
const handleSaveStatus = async () => {
  if (!currentOrder.value) return

  try {
    const res = await api.put<any>(`/admin/orders/${currentOrder.value.id}/status`, {
      status: editForm.value.status,
      internalNote: editForm.value.internalNote
    })

    if (res && res.code === 0) {
      message.success('保存成功')
      showDetailModal.value = false
      fetchOrders()
    } else {
      message.error(res?.message || '保存失败')
    }
  } catch (e: any) {
    console.error('保存订单状态失败:', e)
    message.error('保存失败')
  }
}

// 分页大小改变
const handlePageSizeChange = () => {
  pagination.value.page = 1
  fetchOrders()
}

// 获取状态文本
const getStatusText = (status: number): string => {
  const statusMap: Record<number, string> = {
    0: '待确认',
    1: '进行中',
    2: '已完成',
    3: '已关闭'
  }
  return statusMap[status] || '未知'
}

// 获取状态标签类
const getStatusTagClass = (status: number): string => {
  const classMap: Record<number, string> = {
    0: 'tag tag-warning',
    1: 'tag tag-info',
    2: 'tag tag-success',
    3: 'tag tag-default'
  }
  return classMap[status] || 'tag tag-default'
}

// 格式化日期
const formatDate = (dateString: string) => {
  if (!dateString) return '-'
  return new Date(dateString).toLocaleString('zh-CN')
}

onMounted(() => {
  fetchOrders()
})

// 设置页面标题
useHead({
  title: '订单管理 - 后台管理',
  meta: [
    { name: 'description', content: '订单管理页面' }
  ]
})
</script>

<style scoped>
.admin-orders-page {
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
  border: 1px solid var(--color-border-default);
  border-radius: 4px;
}

.pagination-buttons {
  display: flex;
  gap: 8px;
  align-items: center;
}

.pagination-btn {
  padding: 4px 12px;
  border: 1px solid var(--color-border-default);
  background: var(--color-bg-card);
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

.order-detail {
  padding: 16px 0;
}
</style>

