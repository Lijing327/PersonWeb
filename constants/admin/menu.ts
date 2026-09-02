// constants/admin/menu.ts
// Phase 3：运营控制台信息架构 — 非 CMS；内容正文在 content/ + Git 维护

export type AdminMenuLeaf = {
  label: string
  path: string
}

export type AdminMenuGroup = {
  label: string
  icon?: string
  children: AdminMenuLeaf[]
}

export const adminMenu: AdminMenuGroup[] = [
  {
    label: '控制台',
    icon: 'fas fa-tachometer-alt',
    children: [
      { label: '网站概览', path: '/admin' },
      { label: '站点内容', path: '/admin/content' },
    ],
  },
  {
    label: '数据统计',
    icon: 'fas fa-chart-pie',
    children: [
      { label: '数据分析', path: '/admin/analytics' },
      { label: '访客数据', path: '/admin/visitors' },
      { label: '项目访问统计', path: '/admin/projects/stats' },
    ],
  },
  {
    label: '互动管理',
    icon: 'fas fa-comments',
    children: [
      { label: '访客互动', path: '/admin/visitor-messages' },
      { label: '咨询管理', path: '/admin/consultations' },
    ],
  },
  {
    label: 'AI 管理',
    icon: 'fas fa-robot',
    children: [
      { label: 'AI 中心', path: '/admin/ai' },
      { label: 'AI 日志', path: '/admin/ai/logs' },
      { label: '客服配置', path: '/admin/ai/support-config' },
    ],
  },
  {
    label: '商业管理',
    icon: 'fas fa-coins',
    children: [
      { label: '订单管理', path: '/admin/orders' },
      { label: '资产管理', path: '/admin/asset-management' },
    ],
  },
  {
    label: '个人工作台',
    icon: 'fas fa-briefcase',
    children: [
      { label: '情报中心', path: '/admin/intelligence' },
      { label: '副业项目', path: '/admin/side-projects' },
      { label: '认知说明书', path: '/admin/cognition' },
      { label: '思维记录', path: '/admin/thoughts' },
    ],
  },
]

/** 菜单中所有可达路径（守卫测试用） */
export const adminMenuPaths = adminMenu.flatMap(group =>
  group.children.map(item => item.path),
)
