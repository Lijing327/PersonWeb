# CLAUDE.md

本文件为 Claude Code (claude.ai/code) 提供在此仓库中工作的指导。

## 项目概览

**溪午听风个人站** — 全栈个人开发者网站，技术栈如下：
- **前端**：Nuxt 3 + Vue 3 + TypeScript + Tailwind CSS + Naive UI
- **后端**：.NET 8 WebAPI（位于 `backend/PersonalSite.Api/`）
- **AI 服务**：Python FastAPI（位于 `ai-service/`）
- **数据库**：MySQL（建表脚本在 `database/all_tables.sql`）
- **内容管理**：`@nuxt/content`（Markdown 文件在 `content/`）

## 开发命令

### 前端（Nuxt 3）
```bash
npm run dev          # 启动开发服务器（http://localhost:3000）
npm run dev:mobile   # 启动开发服务器，允许移动端访问（0.0.0.0）
npm run dev:prod     # 以 NODE_ENV=production 启动开发服务器
npm run build        # 生产构建
npm run generate     # 静态站点生成
npm run preview      # 预览生产构建
npm run dev:fresh    # 清除缓存后启动开发
npm run build:analyze # 带包体分析器的构建
```

### 测试
```bash
npm run test         # 以 watch 模式运行 vitest
npm run test:run     # 单次运行所有测试
npm run test:coverage # 带覆盖率报告运行测试
npm run test:ui      # Vitest UI 界面
# 运行单个测试文件：
npx vitest run test/api/modules.test.ts
```

测试文件位于 `test/`（单元/组件测试）和 `server/tests/`（API 测试），均使用 jsdom 环境。

### 样式与质量
```bash
npm run lint:colors        # 检查颜色 token 使用规范
npm run style:tokens:check # 扫描设计 token 违规
npm run style:tokens:verify # 验证设计 token 一致性
```

### 后端（.NET 8）
```bash
cd backend/PersonalSite.Api
dotnet restore
dotnet run           # 运行在 http://localhost:5234，Swagger 在 /swagger
```

### AI 服务（Python FastAPI）
```bash
cd ai-service
pip install -r requirements.txt
cp .env.example .env   # 然后设置 AI_INTERNAL_TOKEN 和模型密钥
uvicorn app.main:app --reload
```

### 内容导入（Markdown → 数据库）
```bash
node scripts/import-blog-to-db.js         # 将博客文章导入 MySQL
node scripts/import-all-content-to-db.js  # 导入所有内容类型
```

## 环境变量

在项目根目录创建 `.env` 文件，Nuxt 服务端路由（Nitro）本地运行时必须配置：
```
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=personweb
ADMIN_PASSWORD=your_admin_password
NUXT_PUBLIC_API_BASE=http://localhost:5234/api   # 可选，会自动检测
```

## 架构

### 请求流转
```
浏览器 → (开发：localhost:3000) → Nuxt 前端
浏览器 → (API 调用) → /api/* → Nuxt 服务端路由 (server/api/) 或 .NET 后端
```

生产环境：Nginx 反向代理负责前端静态文件服务，并将 `/api` 转发至 .NET 后端。

`useApi.ts` 组合式函数在运行时自动检测环境：
- `localhost` / `127.0.0.1` → `http://localhost:5234/api`
- `xifg.com.cn` → `https://api.xifg.com.cn/api`
- 其他域名 → 同源 `/api`

### 双数据存储

项目根据调用的 API 不同，使用**两套独立的存储后端**：

1. **MySQL**（通过 `server/utils/db.ts` 或 `server/services/database.ts`）— 模块系统、访问分析、许可证/支付数据
2. **文件型 JSON**（`server/data/*.json`）— 历史遗留位；主路径已迁 .NET `site_config` / Analytics。Phase 1 已清理无消费者的 `visit-logs` / `views` / `stats` / `personal_metrics`。
3. **Markdown 文件**（`content/`）— Life 等内容由 Nitro `/api/content/*` 读取；管理后台文章/项目/工具走 .NET，不再经 Nitro MD CRUD

有两个 MySQL 连接池工具：`server/utils/db.ts`（带 keepalive ping）和 `server/services/database.ts`（简化版连接池）。新增服务端路由时优先使用 `server/utils/db.ts`。

### Nuxt 服务端 API（`server/api/`）
Nuxt 自带的服务端路由（Nitro），与 .NET 后端完全独立。关键目录：
- `server/api/admin/` — 管理 CRUD：直接读写 `content/` 目录下的 Markdown 文件
- `server/api/auth/login.post.ts` — 设置 cookie `admin_auth=true`，返回占位 token
- `server/api/content/` — 公开内容接口（博客、项目、工具）
- `server/api/views/` — （Phase 1 已删除；分析走 .NET `/Analytics`）
- `server/api/modules/` — 模块系统 → MySQL
- `server/api/payment/` + `server/api/license/` — 支付与许可证校验
- `server/api/robokit/` — Nitro 占位接口（尚未实现）
- `server/api/admin/` — Phase 1 已清空 Nitro 孤儿 admin handlers；后台内容 CRUD 走 .NET

服务端路由鉴权：`server/utils/auth.ts` 导出 `checkAuth()` — 检查 cookie `admin_auth=true` 或任意 `Authorization: Bearer ...` 请求头，**不进行真正的 JWT 签名验证**。

### 前端页面（`pages/`）
基于文件的路由，关键目录：
- `pages/index.vue` — 首页
- `pages/admin/` — 管理后台（由 `middleware/admin-auth.ts` 保护）
- `pages/blog/` — 博客列表与文章详情
- `pages/projects/` — 项目作品集
- `pages/tools/` — 插件工具展示
- `pages/ai/` — AI 功能区
- `pages/side-projects/` — 副业项目

### 布局（`layouts/`）
- `default.vue` — 通用站点布局
- `home.vue` — 首页布局
- `admin.vue` — 带侧边栏的完整管理后台布局
- `admin-content-only.vue` — 无侧边栏的管理布局
- `ai.vue` — AI 区域布局

### 组合式函数（`composables/`）
- `useApi.ts` — 基础 API 客户端，自动环境检测
- `useTheme.ts` — 主题切换（依赖后端 `/api/Config/theme`）
- `useNaiveUI.ts` / `useNaiveTheme.ts` — Naive UI 集成
- `useDevice.ts` — 移动端/桌面端检测
- `useModuleSystem.ts` 及相关 — 插件模块系统

### 模块系统（`modules/`）
可安装的功能模块（非 Nuxt 模块）。每个模块包含一份 `module.json` 清单，定义元数据、路由、组件、配置项和权限。内置核心模块：`admin-panel`、`ai-assistant`、`blog`、`visitor-interaction`、`3d-display`。通过 `server/api/modules/` 和 `composables/useModuleSystem.ts` 管理，模块状态持久化至 MySQL。

### 管理员认证流程
1. POST `/api/auth/login`，携带 `{ password }` — 与 `ADMIN_PASSWORD` 环境变量比对
2. 响应设置 cookie `admin_auth=true`（有效期 1 天），并返回 `{ token: 'admin_token_placeholder' }`
3. 前端将 token 存入 `localStorage.admin_token`
4. `middleware/admin-auth.ts`（仅客户端）在 token 缺失时跳转至 `/admin/login`

## 样式系统（关键——改动 CSS 前必读）

项目使用**分层样式架构**，违反层级会导致主题不一致。

### 层级顺序（从基础到组件）
1. **`assets/styles/tokens.css`** — 所有 CSS 变量（颜色、圆角、阴影、间距、字号），设计值的唯一真实来源
2. **`assets/styles/base.css`** — HTML/body 重置与基础排版
3. **`assets/styles/ui-patch-naive.css`** — Naive UI 组件的视觉补丁
4. **`components/layout/AppNaiveConfig.vue`** — Naive UI `themeOverrides`，包裹所有布局
5. **`assets/css/*.css`** — 功能级共享样式（如 `header.css`、`home.css`、`admin-*.css`）
6. **`<style scoped>`** — 组件级私有样式

### 规则
- **始终使用 `tokens.css` 中的 CSS 变量** — 禁止硬编码颜色、圆角或阴影。
- **固定值不用内联 `:style`** — 仅在必须运行时计算的值（位置、动态颜色、动画时长）才使用 `:style`。
- **多组件重复样式** → 提取至 `assets/css/`。
- **管理后台页面**：优先使用 Naive UI 组件（`n-button`、`n-card`、`n-data-table`、`n-form`、`n-modal`），复用现有模式组件：`PageHeader`、`ListPage`、`ConfigPage`、`FormPage`、`DetailPage`（均在 `components/admin/patterns/`）。

### 主题系统
主题存储在后端（`/api/Config/theme`）。`useTheme().setTheme()` 设置 `document.documentElement.dataset.theme`，从而激活 `tokens.css` 中对应的 CSS 变量覆盖。支持的主题：`light`、`dark`、`lab`、`tech-blue`、`paper`、`forest`、`hybrid-super`、`hybrid-super-dark`、`hybrid-super-light`。

### CSS 变量命名规范
```css
--color-bg-page / --color-bg-body / --color-bg-card / --color-bg-elevated
--color-text-main / --color-text-muted / --color-text-disabled
--color-primary / --color-primary-base / --color-primary-soft / --color-primary-hover
--color-border-subtle / --color-border-default / --color-border-strong
--radius-sm / --radius-md / --radius-lg / --radius-xl
--shadow-sm / --shadow-md / --shadow-lg / --shadow-xl / --shadow-2xl / --shadow-soft
--spacing-xs / --spacing-sm / --spacing-md / --spacing-lg / --spacing-xl / --spacing-2xl
--font-size-h1 至 --font-size-xs
```

## 内容管理

通过创建带 frontmatter 的 Markdown 文件来新增内容：
- **博客**：`content/blog/*.md`（字段：`title`、`date`、`tags`、`description`、`author`、`category`）
- **项目**：`content/projects/*.md`（字段：`title`、`tech`、`description`、`demo_link`、`source_link`、`slug`、`date`、`status`、`category`）
- **工具**：`content/tools/*.md`（字段：`title`、`description`、`price`、`tags`、`buy_link`、`slug`、`date`）

## 关键配置文件

- **Nuxt 配置**：`nuxt.config.ts` — 模块、CSS 引入、预渲染路由、Vite 分包策略
- **Tailwind**：`tailwind.config.ts`
- **Vitest**：`vitest.config.ts` — 使用 jsdom，`~` 和 `@` 均别名指向项目根目录
- **数据库结构**：`database/all_tables.sql`
- **预渲染路由**：在 `nuxt.config.ts` 的 `nitro.prerender.routes` 中定义（静态管理页面）；动态路由如 `/blog/**` 不参与预渲染

## 构建说明

- 使用 `npm run dev` 而非直接运行 `nuxt dev` — npm 脚本会设置 `SASS_SILENCE_DEPRECATIONS=legacy-js-api` 以抑制 Sass 弃用警告
- `app-manifest-stub.js` 是 Vite 别名的临时方案（用于处理 `#app-manifest`）
- naive-ui、echarts 等大型依赖包被有意拆分为独立 chunk，详见 `nuxt.config.ts` 中的 `manualChunks`
