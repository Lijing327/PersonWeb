/**
 * Case Study presets — classification (Phase 4):
 *
 * CONTENT (LEGACY fill): pitch / features / challenges / roadmap / timeline narrative
 * PRESENTATION: heroEyebrow, heroFloats tones, icon choices
 * FALLBACK: used only when Project.Content has no showcase JSON
 *
 * PRIMARY content source: MySQL projects (+ optional showcase JSON in Content).
 * This file must NOT be treated as the business source of truth.
 * Metrics policy (Phase 2): no invented KPI numbers.
 */
import type { ProjectShowcasePartial } from '~/types/projectShowcase'
import { PROJECT_COVER_PATHS, resolveProjectCoverKey } from '~/constants/projects/covers'

const COVER = PROJECT_COVER_PATHS

/**
 * Case Study presets — metrics policy (Phase 2):
 * REAL: verifiable product facts (platform, status labels, architecture names)
 * UNKNOWN/PLACEHOLDER numeric claims (users, ratings, %, revenue) removed
 * Prefer capability / outcome descriptions over invented KPIs
 */
const PRESETS: Record<string, ProjectShowcasePartial> = {
  'finance-assistant': {
    heroEyebrow: 'WeChat Mini Program · FinTech',
    heroFloats: [
      { label: '核心能力', value: '资产汇总', tone: 'blue' },
      { label: '核心能力', value: '收益复盘', tone: 'green' },
    ],
    overview: [
      { icon: '💰', value: '记账', label: '多账户记录', tone: 'blue' },
      { icon: '🛠️', value: '持续维护', label: '项目状态', tone: 'green' },
      { icon: '🏷️', value: '小程序', label: '产品形态', tone: 'purple' },
      { icon: '📱', value: '微信', label: '运行平台', tone: 'cyan' },
    ],
    background: {
      title: '项目背景',
      paragraphs: [
        '随着个人理财意识提升，大学生与年轻职场人需要一款轻量、易上手的记账与资产分析工具。传统表格难以坚持，复杂 App 学习成本又过高。',
        '智能理财助手小程序以「低门槛记录 + 可视化分析 + 个性化建议」为核心，帮助用户建立可持续的理财习惯，并在微信生态内完成从记账到复盘的全流程闭环。',
      ],
      imageUrl: COVER['finance-assistant'],
      highlights: ['智能记账', '收益分析', '预算管理', '理财建议'],
    },
    features: [
      { icon: '💰', title: '资产管理', description: '多账户资产汇总，支持基金、储蓄与消费账户统一视图。' },
      { icon: '📈', title: '收益分析', description: '可视化收益曲线与结构占比，快速识别增长来源与风险敞口。' },
      { icon: '🤖', title: '智能推荐', description: '基于历史行为给出储蓄、消费与配置建议，降低决策成本。' },
      { icon: '🎯', title: '预算控制', description: '按类别设置预算阈值，超支提醒与进度条一目了然。' },
      { icon: '🔒', title: '数据安全', description: '鉴权、加密传输与权限隔离，保障个人财务数据安全。' },
      { icon: '🔄', title: '多端同步', description: '云端同步记账数据，换机不丢记录，随时随地查看资产。' },
    ],
    architecture: [
      { label: '微信小程序', icon: 'MP' },
      { label: 'Node.js', icon: 'N' },
      { label: 'Express', icon: 'Ex' },
      { label: 'MySQL', icon: 'DB' },
      { label: 'Redis', icon: 'Re' },
      { label: '云服务器', icon: '☁' },
    ],
    timeline: [
      { date: '2024.12', title: '项目启动' },
      { date: '2025.01', title: '核心功能开发' },
      { date: '2025.03', title: '内测上线' },
      { date: '2025.05', title: '正式版发布' },
      { date: '持续', title: '迭代优化' },
    ],
    challenges: [
      {
        title: '高并发处理',
        challenge: '月末结算与报表生成时，接口并发峰值明显，响应时间波动。',
        solution: 'Redis 缓存热点数据 + 队列异步生成报表，核心读路径控制在可接受延迟内。',
      },
      {
        title: '异步任务',
        challenge: '批量导入与统计任务阻塞主线程，影响用户交互体验。',
        solution: '引入任务队列拆分长任务，前端轮询进度并展示友好等待状态。',
      },
      {
        title: '数据安全',
        challenge: '财务数据敏感，需防止越权访问与传输泄露。',
        solution: 'JWT 鉴权 + HTTPS + 字段脱敏，关键操作二次校验。',
      },
    ],
    achievements: [
      { icon: '📊', value: '可视化', label: '资产与收益复盘', tone: 'blue' },
      { icon: '🎯', value: '预算', label: '分类阈值提醒', tone: 'green' },
      { icon: '☁️', value: '云同步', label: '多端数据一致', tone: 'cyan' },
      { icon: '🔒', value: '安全', label: '鉴权与脱敏', tone: 'purple' },
    ],
    roadmap: [
      { version: 'V1.0', status: 'completed', statusLabel: '已完成', items: ['基础记账', '分类统计', '预算提醒', '数据导出'] },
      { version: 'V2.0', status: 'active', statusLabel: '进行中', items: ['智能分析', '理财目标', '投资组合', '社交分享'] },
      { version: 'V3.0', status: 'planned', statusLabel: '规划中', items: ['AI 顾问', '家庭账本', '社区功能', '商业化'] },
    ],
    cta: {
      title: '准备好开始你的理财之旅了吗？',
      subtitle: '立即体验智能理财助手，开启个性化财务管理。',
    },
    pitch: {
      what: '智能理财助手是一款面向大学生与年轻职场人的微信小程序，帮助用户用最低学习成本完成记账、资产汇总与收益复盘，把「坚持理财」变成日常习惯。',
      problems: [
        'Excel 记账难坚持，复杂理财 App 上手门槛高',
        '多账户资产分散，看不清整体收益与风险结构',
        '缺少个性化建议，消费与储蓄决策缺少数据支撑',
      ],
      outcomes: [
        { icon: '📊', value: '可视化', label: '资产与收益复盘', tone: 'blue' },
        { icon: '🎯', value: '预算', label: '分类阈值提醒', tone: 'green' },
        { icon: '☁️', value: '云同步', label: '多端数据一致', tone: 'cyan' },
        { icon: '🔒', value: '安全', label: '鉴权与脱敏', tone: 'purple' },
      ],
    },
  },
  'love-cube': {
    heroEyebrow: 'WeChat Mini Program · Social',
    heroFloats: [
      { label: '核心玩法', value: '魔方破冰', tone: 'pink' },
      { label: '核心玩法', value: '兴趣匹配', tone: 'purple' },
    ],
    overview: [
      { icon: '🎲', value: '破冰', label: '魔方互动', tone: 'pink' },
      { icon: '🛠️', value: '持续维护', label: '项目状态', tone: 'green' },
      { icon: '🏷️', value: '小程序', label: '产品形态', tone: 'purple' },
      { icon: '📱', value: '微信', label: '运行平台', tone: 'cyan' },
    ],
    background: {
      title: '项目背景',
      paragraphs: [
        '大学生社交场景中，「如何自然破冰、建立共同话题」是普遍痛点。纯聊天容易冷场，缺乏轻量互动载体。',
        '恋爱魔方小程序以魔方互动 + 兴趣标签为切入点，把交友过程游戏化，让用户在轻松氛围中完成破冰与深度交流。',
      ],
      imageUrl: COVER['love-cube'],
      highlights: ['魔方破冰', '兴趣匹配', '话题引导', '隐私保护'],
    },
    features: [
      { icon: '🎲', title: '魔方互动', description: '通过魔方任务与随机话题触发对话，降低初次聊天压力。' },
      { icon: '💬', title: '兴趣匹配', description: '基于标签与行为偏好推荐更契合的聊天对象。' },
      { icon: '🎯', title: '话题引导', description: '内置情景化话题库，避免无效开场。' },
      { icon: '🔒', title: '隐私保护', description: '分级可见与举报机制，保障校园社交安全。' },
      { icon: '📱', title: '小程序原生', description: '微信内即用即走，分享裂变链路短。' },
      { icon: '📊', title: '运营看板', description: '统计活跃、留存与匹配转化，支持活动迭代。' },
    ],
    architecture: [
      { label: '微信小程序', icon: 'MP' },
      { label: 'Spring Boot', icon: 'Sp' },
      { label: 'MyBatis', icon: 'MB' },
      { label: 'MySQL', icon: 'DB' },
      { label: 'Redis', icon: 'Re' },
      { label: '云服务器', icon: '☁' },
    ],
    timeline: [
      { date: '2024.10', title: '需求调研' },
      { date: '2024.12', title: '原型开发' },
      { date: '2025.02', title: '校园内测' },
      { date: '2025.04', title: '功能完善' },
      { date: '持续', title: '运营迭代' },
    ],
    challenges: [
      {
        title: '匹配算法',
        challenge: '冷启动阶段用户画像稀疏，推荐准确度不足。',
        solution: '兴趣标签 + 互动反馈加权，平衡探索与精准推荐。',
      },
      {
        title: '内容安全',
        challenge: 'UGC 场景存在违规内容与骚扰风险。',
        solution: '敏感词过滤、举报工单与人工复核闭环。',
      },
      {
        title: '留存提升',
        challenge: '新用户首日互动后流失率偏高。',
        solution: '每日魔方任务与关系链提醒，强化回访动机。',
      },
    ],
    achievements: [
      { icon: '🎲', value: '破冰', label: '魔方互动流程', tone: 'pink' },
      { icon: '💬', value: '匹配', label: '兴趣标签推荐', tone: 'purple' },
      { icon: '🛡️', value: '安全', label: '举报与过滤', tone: 'green' },
      { icon: '📱', value: '轻量', label: '微信即用即走', tone: 'cyan' },
    ],
    roadmap: [
      { version: 'V1.0', status: 'completed', statusLabel: '已完成', items: ['魔方破冰', '兴趣标签', '基础匹配'] },
      { version: 'V2.0', status: 'active', statusLabel: '进行中', items: ['活动运营', '关系链', '消息优化'] },
      { version: 'V3.0', status: 'planned', statusLabel: '规划中', items: ['AI 话题', '群聊玩法', '校园认证'] },
    ],
    cta: {
      title: '想体验更有趣的校园社交？',
      subtitle: '打开恋爱魔方小程序，用一次魔方互动开启新对话。',
    },
    pitch: {
      what: '恋爱魔方是一款校园社交微信小程序，用「魔方互动 + 兴趣匹配」把陌生聊天变成轻量游戏，让用户在轻松氛围中完成破冰与深度交流。',
      problems: [
        '初次聊天容易冷场，缺少自然的话题切入点',
        '传统交友 App 流程重，校园用户不愿长时间填写资料',
        'UGC 社交存在骚扰与隐私顾虑，需要可控的安全机制',
      ],
      outcomes: [
        { icon: '🎲', value: '破冰', label: '魔方互动流程', tone: 'pink' },
        { icon: '💬', value: '匹配', label: '兴趣标签推荐', tone: 'purple' },
        { icon: '🛡️', value: '安全', label: '举报与过滤', tone: 'green' },
        { icon: '📱', value: '轻量', label: '微信即用即走', tone: 'cyan' },
      ],
    },
  },
  'iot-control': {
    heroEyebrow: 'Embedded · IoT',
    heroFloats: [
      { label: '能力', value: '设备接入', tone: 'cyan' },
      { label: '能力', value: '远程控制', tone: 'green' },
    ],
    overview: [
      { icon: '🔌', value: '多设备', label: '统一接入', tone: 'cyan' },
      { icon: '🛠️', value: '持续维护', label: '项目状态', tone: 'green' },
      { icon: '🏷️', value: '嵌入式', label: '产品形态', tone: 'purple' },
      { icon: '📡', value: '监控', label: '实时状态', tone: 'blue' },
    ],
    background: {
      title: '项目背景',
      paragraphs: [
        '实验室与小型场景中，传感器、执行器与网关设备分散，缺乏统一的采集、控制与可视化平台。',
        '智能物联网控制系统基于 STM32 与上位机服务，实现设备接入、状态监控、规则联动与远程控制的一体化方案。',
      ],
      imageUrl: COVER['iot-control'],
      highlights: ['设备接入', '实时监控', '远程控制', '规则联动'],
    },
    features: [
      { icon: '📡', title: '设备接入', description: '多类传感器与执行器统一注册与心跳监测。' },
      { icon: '📊', title: '实时看板', description: '温湿度、光照等指标实时曲线与告警展示。' },
      { icon: '🎛️', title: '远程控制', description: 'Web 控制台下发指令，设备端可靠 ACK。' },
      { icon: '🔗', title: '规则联动', description: '条件触发自动化策略，减少人工值守。' },
      { icon: '🔒', title: '安全通信', description: '链路鉴权与指令签名，降低误控风险。' },
      { icon: '🧩', title: '可扩展架构', description: '模块化驱动层，便于新增设备与协议。' },
    ],
    architecture: [
      { label: 'STM32', icon: 'MCU' },
      { label: 'MQTT', icon: 'MQ' },
      { label: '网关服务', icon: 'GW' },
      { label: 'MySQL', icon: 'DB' },
      { label: 'Redis', icon: 'Re' },
      { label: 'Web 控制台', icon: 'UI' },
    ],
    timeline: [
      { date: '2024.08', title: '硬件选型' },
      { date: '2024.11', title: '固件开发' },
      { date: '2025.01', title: '联调测试' },
      { date: '2025.04', title: '平台上线' },
      { date: '持续', title: '功能扩展' },
    ],
    challenges: [
      {
        title: '嵌入式资源',
        challenge: 'STM32 内存有限，协议栈与业务逻辑争抢资源。',
        solution: '分层架构 + 轻量 MQTT 客户端，非关键任务异步化。',
      },
      {
        title: '弱网环境',
        challenge: 'Wi-Fi 不稳定导致指令丢失或状态不同步。',
        solution: 'QoS 重传、本地状态机与云端对账机制。',
      },
      {
        title: '实时性',
        challenge: '高并发采集下后台解析成为瓶颈。',
        solution: '消息队列削峰 + 时序数据批量写入。',
      },
    ],
    achievements: [
      { icon: '🔌', value: '接入', label: '多类设备统一注册', tone: 'cyan' },
      { icon: '📡', value: '监控', label: '实时状态看板', tone: 'blue' },
      { icon: '🎛️', value: '控制', label: '远程指令下发', tone: 'green' },
      { icon: '🔗', value: '联动', label: '规则自动化', tone: 'purple' },
    ],
    roadmap: [
      { version: 'V1.0', status: 'completed', statusLabel: '已完成', items: ['设备采集', '基础控制', '告警通知'] },
      { version: 'V2.0', status: 'active', statusLabel: '进行中', items: ['规则引擎', '多租户', '移动端'] },
      { version: 'V3.0', status: 'planned', statusLabel: '规划中', items: ['边缘 AI', '数字孪生', 'OTA 升级'] },
    ],
    cta: {
      title: '需要一套可落地的 IoT 控制方案？',
      subtitle: '查看演示或联系获取架构文档与部署说明。',
    },
    pitch: {
      what: '智能物联网控制系统是一套面向实验室与小型场景的端到端方案：STM32 设备端采集与控制，云端网关统一接入，Web 控制台实现监控、告警与远程下发，让分散设备变成可管理的一体化平台。',
      problems: [
        '传感器与执行器各自为政，缺少统一接入与状态视图',
        '弱网环境下指令易丢失，设备状态与云端不同步',
        '人工值守成本高，无法按规则自动联动与告警',
      ],
      outcomes: [
        { icon: '🔌', value: '接入', label: '多类设备统一注册', tone: 'cyan' },
        { icon: '📡', value: '监控', label: '实时状态看板', tone: 'blue' },
        { icon: '🎛️', value: '控制', label: '远程指令下发', tone: 'green' },
        { icon: '🔗', value: '联动', label: '规则自动化', tone: 'purple' },
      ],
    },
  },
  personweb: {
    heroEyebrow: 'Full Stack · Personal Platform',
    overview: [
      { icon: '🌐', value: '全栈', label: '技术架构', tone: 'blue' },
      { icon: '🛠️', value: '持续维护', label: '项目状态', tone: 'green' },
      { icon: '🧩', value: '模块化', label: '可插拔扩展', tone: 'purple' },
      { icon: '⚡', value: 'SSR', label: '前台体验', tone: 'cyan' },
    ],
    background: {
      title: '项目背景',
      paragraphs: [
        '个人开发者需要的不只是一个展示页，而是能持续承载内容、工具、数据与 AI 能力的长期平台。传统静态站点难以扩展，分散的工具也难以形成统一体验。',
        '个人数字资产平台（本网站）以「能力展示 + 内容沉淀 + 后台运营 + AI 接入」为主线，把博客、案例、工具、访客分析和管理后台整合到同一套技术体系中，并持续迭代。',
      ],
      imageUrl: COVER.personweb,
      highlights: ['访客分析', '后台管理', '文章系统', '配置中心', 'AI 网关', '模块扩展'],
    },
    features: [
      { icon: '🏠', title: '能力展示', description: '首页、案例、产品页统一呈现个人品牌与技术栈。' },
      { icon: '📝', title: '内容系统', description: '博客、项目、工具 Markdown 内容管理与发布。' },
      { icon: '📊', title: '访客分析', description: 'PV/UV、来源与行为统计，支持运营决策。' },
      { icon: '⚙️', title: '后台管理', description: '内容、配置、主题与模块的可视化管理。' },
      { icon: '🤖', title: 'AI 网关', description: '统一对接 AI 服务，支持助手与内容生成。' },
      { icon: '🧩', title: '模块系统', description: '可插拔功能模块，按需启用与扩展。' },
    ],
    architecture: [
      { label: 'Nuxt 3', icon: 'Nx' },
      { label: 'Vue 3', icon: 'V' },
      { label: '.NET 8', icon: 'NET' },
      { label: 'MySQL', icon: 'DB' },
      { label: 'Nitro API', icon: 'API' },
      { label: 'AI Service', icon: 'AI' },
    ],
    cta: {
      title: '这就是你正在浏览的平台',
      subtitle: '欢迎继续探索案例、文章与 AI 实验室，了解完整实现细节。',
    },
    pitch: {
      what: '个人数字资产平台（溪午听风个人站）是一套全栈个人开发者网站：前台展示能力与案例，后台统一管理内容、配置与数据，并接入 AI 与可插拔模块，把「个人品牌 + 内容沉淀 + 运营工具」整合到同一套技术体系。',
      problems: [
        '静态个人站只能展示，难以承载博客、工具、数据与后台运营',
        '功能分散在多个项目，维护成本高、体验不统一',
        '向客户展示成果时缺少结构化案例页，沟通效率低',
      ],
      outcomes: [
        { icon: '🌐', value: '全栈', label: 'Nuxt + .NET + AI', tone: 'blue' },
        { icon: '🧩', value: '模块化', label: '可插拔扩展', tone: 'purple' },
        { icon: '📊', value: '分析', label: '访客统计能力', tone: 'cyan' },
        { icon: '⚡', value: 'SSR', label: '首屏体验', tone: 'green' },
      ],
    },
  },
}

export function getProjectShowcasePreset(project: Record<string, unknown>): ProjectShowcasePartial {
  const key = resolveProjectCoverKey(project)
  return PRESETS[key] || {}
}
