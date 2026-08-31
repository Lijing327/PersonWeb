# PersonWeb Information Architecture

> Phase 5 — Work IA 与路由治理  
> 最后更新：2026-08-31

## 总览

```
PersonWeb
├─ Portal   (/)           选世界入口
├─ Work     (/work)       专业工作名片
└─ Life     (/life)       生活名片
```

配置源：`constants/work-ia.ts`（Primary / More / Footer / 路由治理 / 实体映射）

---

## 路由治理规则

1. 一个内容实体可以拥有多个视图  
2. 一个视图只能有一个 canonical URL  
3. Legacy 页面不得重新进入主导航  
4. Private 页面不得进入 sitemap  
5. Experiment 页面默认不与核心业务同权重  
6. Header 只放高频核心入口  
7. More 不是 legacy 收容站  
8. 新增一级栏目必须能用一句话解释职责  

---

## Work 一级导航（Desktop / Mobile）

| 入口 | Path | Purpose |
| --- | --- | --- |
| 首页 | `/work` | 职业名片总览 |
| 案例 | `/projects` | 我做过什么（能力证明） |
| 产品 | `/products` | 可直接使用的东西 |
| 文章 | `/blog` | 我写了什么 |
| 关于 | `/about` | 我是谁 / 我能做什么 |
| CTA | `/contact` | 如何联系我（顶栏按钮，不进 Primary 列表） |

**不含：** Lab、AI、Tools、Dashboard、Contact 重复项。

### More

工具 `/tools` · AI 方案 `/ai` · 实验室 `/lab` · 技能 `/skills` · 知识笔记 `/knowledge` · Life ↗

### Footer

探索 · 更多 · 世界（含 Portal / Life / 关于 / 联系）+ Legal ICP

---

## Taxonomy

### Project（案例）

- **Purpose：** 证明能力——背景、角色、方案、结果  
- **Audience：** 潜在合作方、招聘/评审访客  
- **URL：** `/projects`  
- **CTA：** 浏览案例 / 联系  
- **Indexable：** 是  
- **SoT：** MySQL `projects`  

### Product（产品）

- **Purpose：** 可持续使用的成品入口  
- **Audience：** 终端用户  
- **URL：** `/products`  
- **CTA：** 安装 / 下载 / 获取  
- **Indexable：** 是  
- **SoT：** 前端 constants（当前）  

### Tool（工具）

- **Purpose：** 轻量、单功能、可获取的插件/脚本  
- **Audience：** 有具体效率需求的用户  
- **URL：** `/tools`（More，非顶级）  
- **CTA：** 获取工具  
- **SoT：** MySQL Toolbox  

### Module（模块）

- **Purpose：** 站点/开发者生态模块  
- **Audience：** 开发者 / 站内安装  
- **URL：** `/module-store`（Footer 更多）  
- **SoT：** MySQL `module`  

---

## Blog / Knowledge / Cognition

| 栏目 | 一句话 | 导航权重 |
| --- | --- | --- |
| **Blog** | 公开长文与复盘 | PRIMARY |
| **Knowledge** | 系统化短笔记/知识条目 | More |
| **Cognition** | 个人认知方法论说明书 | 退出主导航（about 内链） |

决策：**选项 C** — 保留独立路由与数据源，降低 Knowledge/Cognition 导航权重；不在本阶段迁数据或合并 IA。

---

## AI / Lab

| 栏目 | 语义 | 导航 |
| --- | --- | --- |
| `/ai` | 商业 AI 能力 / 解决方案 | More |
| `/lab` | 实验性 Demo 场 | More |
| `/ai-intro` | LEGACY → **301 `/ai`** | — |

---

## Dashboard

- **归属：** 私人数字分身面板，内容偏 Life；**非 Work 对外名片**  
- **本阶段：** 退出导航 + `noindex`；URL 保留  
- **未来：** 迁 Life 或真正 Private 区  

---

## 实体多视图

### MindTrace

| 视图 | URL | 回答 |
| --- | --- | --- |
| Product | `/products/mindtrace` | 是什么、怎么用、怎么装 |
| Project bridge | `/projects` 列表卡片 → 产品页 | 案例墙入口；尚无独立 Case Study ID |

---

## 栏目职责摘要

| 栏目 | Purpose | Audience | Primary CTA | Indexable | SoT |
| --- | --- | --- | --- | --- | --- |
| Work | 职业名片总览 | 所有 Work 访客 | 案例/产品 | 是 | 聚合 |
| Projects | 做过什么 | 合作方 | 看案例 | 是 | DB |
| Products | 可用什么 | 用户 | 安装/获取 | 是 | constants |
| Blog | 写了什么 | 读者 | 阅读 | 是 | DB |
| About | 我是谁 | 所有人 | 联系 | 是 | 页面 |
| Contact | 怎么联系 | 合作意向 | 提交 | 是 | 表单→API |
| Tools | 轻量工具 | 效率用户 | 获取 | 是 | DB |
| AI | 解决方案 | 商务 | 联系 | 是 | 页面 |
| Lab | 实验 | 好奇访客 | 探索 | 是 | 页面 |
| Knowledge | 笔记 | 深度读者 | 浏览 | 是 | DB |
| Cognition | 方法论 | 深度读者 | 阅读 | 是 | DB |
| Dashboard | 私人面板 | 本人 | — | **否** | metrics |
