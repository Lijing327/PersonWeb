# PersonWeb Content Architecture

> Phase 4 — Work 数据源与内容模型收敛  
> 最后更新：2026-08-31

## Worlds

| World | Source of truth | Delivery |
| --- | --- | --- |
| **Portal** | 静态页面文案 | Nuxt pages |
| **Work** | MySQL → .NET API → Frontend | Admin (.NET) 写入 |
| **Life** | `content/life` YAML/MD | Nitro → Life pages |
| **Admin** | 同 Work/Modules DB；HTML `noindex` | Cookie 会话 |

---

## Rules（硬约束）

1. **一个业务字段只能有一个 PRIMARY source**
2. **constants 只能存 presentation config 或真正静态配置**（封面映射、布局变体）
3. **fallback 不得伪造业务数据**（禁止假 KPI / 假 stats）
4. **Admin 写入必须影响实际前台 source**
5. **新内容类型必须先确定 source of truth，再开工**

字段分类：

| Tag | 含义 |
| --- | --- |
| **PRIMARY** | 唯一可写业务源 |
| **LEGACY** | 仍存在但非主源 |
| **DERIVED** | 由 PRIMARY 计算/合并 |
| **PRESENTATION_ONLY** | 仅 UI（封面、icon、布局） |

管道生命周期：

| Tag | 含义 |
| --- | --- |
| **ACTIVE** | 生产在用 |
| **COMPAT** | 兼容旧 URL / 旧填充 |
| **LEGACY** | 保留但应停写 |
| **ORPHAN** | 无消费者或已 410 |
| **UNKNOWN** | 未证实 |

---

## Work

### Projects

| 层 | 路径 |
| --- | --- |
| **PRIMARY** | MySQL `projects` → `.NET /Projects` |
| **Admin** | `/admin/projects` → `.NET /Projects` |
| **Frontend LIST** | `pages/projects/index.vue` → `/Projects` |
| **Frontend DETAIL** | `pages/projects/[id].vue` → `/Projects/{id}` → `ProjectShowcasePage` |
| **Case Study JSON** | 目标：`projects.Content` 内 `ProjectShowcaseJson`（见 `types/projectShowcaseJson.ts`） |
| **LEGACY fill** | `constants/projects/showcasePresets.ts`（`ENABLE_LEGACY_SHOWCASE_PRESETS`） |
| **PRESENTATION** | `constants/projects/covers.ts` 封面映射 |
| **DERIVED list inject** | `showcaseExtras.ts`（MindTrace → Product 视图） |
| **COMPAT route** | `/projects/detail-{slug}` → slug 映射 → `/projects/{id}`（失败则 `/projects`） |
| **ORPHAN** | `content/projects`、`server/api/admin/projects.ts`（410）、`/api/content/projects*` |

Showcase 合并优先级：

1. `Content` 内 showcase JSON（PRIMARY）
2. DB 字段推导（description / techStack / dates / cover）
3. legacy presets（COMPAT）
4. 最小 presentation 默认值

### Blog / Articles

| 层 | 路径 |
| --- | --- |
| **PRIMARY** | MySQL `article` → `.NET /Articles` |
| **Admin** | `/admin/articles` → `.NET /Articles` |
| **Frontend** | `/blog`、`/blog/[id]` |
| **ORPHAN** | `content/blog`、`server/api/admin/articles.ts`（410）、`pages/admin/edit.vue`（重定向到文章管理） |

### Tools

| 层 | 路径 |
| --- | --- |
| **PRIMARY** | MySQL `Tools` → `.NET /Toolbox` |
| **Admin** | `/admin/tools`、`/admin/toolbox` → `.NET /Toolbox` |
| **Frontend LIST** | `/tools` → `/Toolbox/marketplace` |
| **Frontend DETAIL** | `/tools/:slug` → `/Toolbox/by-slug/{slug}`（COMPAT：marketplace exact match） |
| **COMPAT** | `/tools/detail-{slug}` → 301 `/tools/{slug}` |
| **ORPHAN** | `content/tools`、`server/api/admin/tools.ts`（410）、列表不再走 `/MockData/tools` 或 MD fallback |

Slug 责任：**Toolbox.Slug**（DB）是唯一规范 slug。

### Products

| 层 | 路径 |
| --- | --- |
| **PRIMARY（当前）** | 前端 constants + 页面硬编码卡片（无 DB） |
| **Views** | `/products`、`/products/mindtrace`、`/products/desktop-pet` |
| **Entity mapping** | 同一实体可有 Product / Project / Tool 多视图，但 name/description/logo/url/status 不应复制三份（未来归一） |

语义：

- **Product** = 可使用 / 可下载 / 可购买 / 有明确入口
- **Project** = 能力展示 / 交付 / Case Study
- **Tool** = 商城可获取的工具实体

### Cognition

| 层 | 路径 |
| --- | --- |
| **PRIMARY** | MySQL `CognitionDocs` → `.NET /CognitionDocs` |
| **Admin** | `/admin/cognition` |
| **LEGACY** | `content/cognition/changelog.md`（changelog 页仍读 MD） |
| vs Knowledge / Blog | **DATA DIFFERENT**（独立表/类型；IA 合并留给 Phase 5） |

### Modules

| 层 | 路径 |
| --- | --- |
| **PRIMARY** | MySQL `module` |
| **APIs** | Nitro `/api/modules*` 与 `.NET /Module*`（同表双入口） |
| **Code packs** | `modules/*/module.json`（代码清单，非运营列表） |

### Knowledge

| 层 | 路径 |
| --- | --- |
| **PRIMARY** | MySQL KnowledgeBase → `.NET /KnowledgeBase`（Nitro 代理公开读） |
| vs Blog / Cognition | **DATA DIFFERENT** |

---

## Life

| 层 | 路径 |
| --- | --- |
| **PRIMARY** | `content/life` YAML / Markdown |
| **API** | Nitro `/api/content/life*` |
| **Frontend** | `/life/**` |

Work 运营内容不要写入 Life 目录。

---

## Case Study 模型（最小可维护）

见 `types/projectShowcaseJson.ts`：

```
Project (DB)
 + Content 承载 ProjectShowcaseJson
```

本阶段：**类型 + 迁移计划 + Adapter 优先级调整**；不强制新表 / 不强制 Admin 表单上线。

待 Admin 可写 showcase JSON 后，将 `ENABLE_LEGACY_SHOWCASE_PRESETS = false`。

---

## Legacy classification snapshot

| Asset | Class |
| --- | --- |
| `.NET Projects/Articles/Toolbox/CognitionDocs` | ACTIVE / PRIMARY |
| `showcasePresets.ts` | COMPAT（LEGACY content fill） |
| `covers.ts` | PRESENTATION_ONLY / ACTIVE |
| `showcaseExtras.ts` | DERIVED / COMPAT |
| `/projects/detail-*`、`/tools/detail-*` | COMPAT redirect |
| `content/projects|blog|tools` | **DELETED (Phase 6)** — 空目录且无消费者 |
| `server/api/admin/{articles,projects,tools}.ts` | ORPHAN stub → **KEEP_410**（历史调用方大声失败） |
| `server/api/content/projects*` / `tools*` | **DELETED (Phase 6)** |
| `pages/admin/edit.vue` | LEGACY retired |
| Cognition changelog MD | LEGACY |
| Products constants | ACTIVE（当前 PRIMARY，无 DB） |

---

## 维护者速答

| 问题 | 答案 |
| --- | --- |
| Projects 数据在哪？ | MySQL `projects` via `.NET /Projects` |
| Blog 后台改完前台读同一份吗？ | 是（都走 `/Articles`） |
| Tool slug 谁负责？ | `Tools.Slug`（Toolbox API） |
| Case Study 在哪维护？ | 目标：`projects.Content` JSON；目前缺口由 legacy presets 填充 |
| constants 哪些是业务？ | presets = LEGACY 业务填充；covers/extras = UI/桥接 |
| 旧 Markdown 为何还在？ | Life + cognition changelog 仍用；Work MD 管线已 410 / 空目录，Phase 6 再物理删除 |
