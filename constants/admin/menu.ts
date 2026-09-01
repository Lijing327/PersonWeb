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
    label: 'Dashboard',
    icon: 'fas fa-tachometer-alt',
    children: [{ label: '网站概览', path: '/admin' }],
  },
  {
    label: 'Analytics',
    icon: 'fas fa-chart-pie',
    children: [
      { label: '数据分析', path: '/admin/analytics' },
      { label: '访客数据', path: '/admin/visitors' },
      { label: '项目访问统计', path: '/admin/projects/stats' },
    ],
  },
  {
    label: 'Interactions',
    icon: 'fas fa-comments',
    children: [
      { label: '访客留言', path: '/admin/visitor-messages' },
      { label: '咨询管理', path: '/admin/consultations' },
      { label: '时间胶囊', path: '/admin/time-capsules' },
    ],
  },
  {
    label: 'AI',
    icon: 'fas fa-robot',
    children: [
      { label: 'AI 中心', path: '/admin/ai' },
      { label: 'AI 日志', path: '/admin/ai/logs' },
      { label: '客服配置', path: '/admin/ai/support-config' },
    ],
  },
  {
    label: 'Content Ops',
    icon: 'fas fa-layer-group',
    children: [
      { label: '内容中枢', path: '/admin/content-hub' },
      { label: '文章运营', path: '/admin/articles' },
      { label: '项目运营', path: '/admin/projects' },
      { label: '工具运营', path: '/admin/tools' },
      { label: '分类管理', path: '/admin/categories' },
      { label: '友情链接', path: '/admin/friend-links' },
    ],
  },
  {
    label: 'Commercial',
    icon: 'fas fa-coins',
    children: [
      { label: '订单管理', path: '/admin/orders' },
      { label: '资产管理', path: '/admin/asset-management' },
    ],
  },
  {
    label: 'Personal Workspace',
    icon: 'fas fa-briefcase',
    children: [
      { label: '情报中心', path: '/admin/intelligence' },
      { label: '关系管理', path: '/admin/relations' },
      { label: '副业项目', path: '/admin/side-projects' },
      { label: '技能树', path: '/admin/skill-tree' },
      { label: '认知说明书', path: '/admin/cognition' },
      { label: '思维记录', path: '/admin/thoughts' },
    ],
  },
  {
    label: 'System',
    icon: 'fas fa-shield-alt',
    children: [
      { label: '系统设置', path: '/admin/settings' },
      { label: '错误日志', path: '/admin/error-logs' },
      { label: '用户管理', path: '/admin/users' },
    ],
  },
]

/** 菜单中所有可达路径（守卫测试用） */
export const adminMenuPaths = adminMenu.flatMap(group =>
  group.children.map(item => item.path),
)
