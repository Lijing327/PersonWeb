# 示例数据插入说明

## 概述

本目录包含将前端写死的模拟数据迁移到数据库的脚本和说明。  
数据直接写入对应业务表，**不**依赖已删除的 `MockDataController`。

> Phase 1（2026-08）：`MockDataController` 与 `AiServiceExampleController` 已移除。  
> 前台请使用正式业务 API（见下方对照表）。

## 文件说明

- `sample_data_insert.sql` — 插入示例数据到对应表
- `skill_table_update.sql` — 更新技能表结构（评分字段）
- `dashboard_metric_tables.sql` — 创建仪表盘指标表（如不存在）
- `README_MOCK_DATA.md` — 本说明

## 数据表

| 内容 | 表 | 正式读取 API |
| --- | --- | --- |
| 技能分类 / 技能 | `skill_category` / `skill` | `.NET /SkillTree`、`/SkillTree/categories` |
| 仪表盘指标 | `dashboard_metric` | `.NET /Metrics` |
| 工具 | `tool` 等 | `.NET /Toolbox` |
| 文章 / 生活类文 | `article` | `.NET /Articles`；Life 世界走 `content/life` + Nitro `/api/content/life*` |

## 使用方法

### 1. 更新表结构（如需要）

```bash
mysql -u your_username -p personal_site < database/skill_table_update.sql
mysql -u your_username -p personal_site < database/dashboard_metric_tables.sql
```

### 2. 插入示例数据

```bash
mysql -u your_username -p personal_site < database/sample_data_insert.sql
```

或在 MySQL 客户端：

```sql
source database/sample_data_insert.sql
```

### 3. 验证

```sql
SELECT * FROM skill_category;
SELECT * FROM skill;
SELECT * FROM dashboard_metric ORDER BY date DESC LIMIT 7;
SELECT name, slug, price FROM tool WHERE status = 'published';
SELECT title, slug FROM article
WHERE category_id = (SELECT id FROM category WHERE name = '生活随笔');
```

## 前端数据源（当前）

| 页面 | 当前来源 |
| --- | --- |
| `pages/tools/index.vue` | `.NET /Toolbox/marketplace` |
| `pages/skills/index.vue` | `.NET /SkillTree` |
| `pages/dashboard/index.vue` | `.NET /Metrics` |
| `pages/life/index.vue` | `content/life` via Nitro `/api/content/life*` |
| `pages/blog/*` | `.NET /Articles` |

**不要**再调用 `/api/MockData/*`（控制器已删除，会 404）。

## 数据管理

通过对应 Admin 页面或业务 API 维护业务表中的数据；与正式环境共用同一套表结构。

## 修改示例

```sql
UPDATE skill SET current_rating = 9.0 WHERE name = 'Vue.js';

INSERT INTO skill (category_id, name, icon, description, current_rating, sort_order)
VALUES (1, 'React', '⚛️', '用于构建用户界面的 JavaScript 库', 7.5, 5);

UPDATE dashboard_metric
SET steps = 8000, sleep_hours = 7.5
WHERE date = CURDATE();
```
