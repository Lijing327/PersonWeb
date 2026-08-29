/** 主导航旁的「更多」入口：次级页面聚合，避免顶栏过长 */
export const moreNavItems = [
  { title: 'AI / 智能体', path: '/ai' },
  { title: '工具插件', path: '/tools' },
  { title: '笔记', path: '/knowledge' },
  { title: '技能树', path: '/skills' },
  { title: '仪表盘', path: '/dashboard' },
  { title: '副业项目', path: '/side-projects' },
  { title: '小游戏', path: '/game' },
  { title: '联系合作', path: '/contact' },
] as const

export const moreNavPaths = moreNavItems.map((item) => item.path)
