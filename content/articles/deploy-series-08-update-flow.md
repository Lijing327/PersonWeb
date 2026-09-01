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
很多新手以为每次更新代码，都要去服务器改 Nginx 配置，或者重新申请证书。
**完全不需要！** Nginx 配置和证书是"基础设施"，一旦配好，除非域名变了，否则不用动。

## 正确的更新流程

你需要做的仅仅是**替换文件**。

### 1. 本地构建
```bash
npm run generate
```
确保本地生成了最新的 `dist` 目录。

### 2. 上传覆盖
```bash
# 使用 rsync (推荐，增量同步，速度快)
rsync -avz --delete dist/ root@your_ip:/var/www/html/

# 或者使用 scp (简单粗暴)
scp -r dist/* root@your_ip:/var/www/html/
```

### 3. 验证
打开浏览器刷新页面。
如果没变，**Ctrl + F5** 强刷一下（因为浏览器可能会缓存旧的 JS/CSS 文件）。

## 进阶：回滚机制
怕更新挂了？
在上传前，先在服务器把旧目录重命名备份一下：
```bash
mv /var/www/html /var/www/html_bak_20251126
```
如果新版有问题，秒切回旧版。
