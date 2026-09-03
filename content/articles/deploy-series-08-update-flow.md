---
title: 08｜网站更新流程：如何正确更新 Nuxt 生成的 dist 文件
slug: deploy-series-08-update-flow
status: published
legacyId: 15
summary: 每次更新网站都要重新配置Nginx吗？不需要。本文介绍正确的高效更新流程。
date: 2025-11-25
publishAt: 2025-11-25T16:00:00.000Z
category: 部署系列
cover: /images/blog/deploy-08.png
source: manual
---

# 08｜网站更新流程：如何正确更新 Nuxt 生成的 dist 文件

## 误区

很多新手以为每次更新代码，都要去服务器改 Nginx，或重新申请证书。

**完全不需要。** Nginx 与证书是基础设施：域名不变、证书没过期，就不用动。日常发布 = **换静态文件**。

## 正确的更新流程

### 1. 本地构建

```bash
npm ci
npm run generate
```

确认产物目录（本站常见为 `.output/public`，有的教程写 `dist`，以你项目为准）。

### 2. 上传覆盖（推荐 rsync）

```bash
# 增量同步，并删除服务器上已废弃的旧文件（重要）
rsync -avz --delete .output/public/ root@你的IP:/var/www/html/
```

`--delete` 很关键：Nuxt 每次构建会生成新 hash 的 `_nuxt/*.js`。若不删旧文件，磁盘会堆垃圾；若 HTML 仍被缓存指向旧 chunk，还会出现**页面空白**。

简单粗暴也可用 scp，但不易清理旧文件：

```bash
scp -r .output/public/* root@你的IP:/var/www/html/
```

### 3. 验证

- 无痕窗口打开首页与一个深链（如 `/blog/xxx`）  
- 硬刷新（Ctrl+F5）排除浏览器缓存  
- 开发者工具 Network：看 `_nuxt` 资源是否 200  

## 回滚机制

上传前备份：

```bash
sudo mv /var/www/html /var/www/html_bak_$(date +%Y%m%d_%H%M)
sudo mkdir -p /var/www/html
# 再 rsync 新版本进去
```

出问题就把备份目录切回来，比「再找一遍旧 commit 构建」快。

## 和自动化的关系

手动 rsync 适合起步；稳定后交给 GitHub Actions：push → generate → 上传 OSS/服务器。流程本质相同：**只换产物，不动 Nginx**。

## 小结

更新网站 ≠ 重装服务器。构建 → 同步（最好带删除）→ 验证；证书与反代配置尽量保持不动。
