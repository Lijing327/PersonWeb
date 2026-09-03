---
title: 我的个人网站从 0 到 1 的搭建过程
slug: personal-website-0-to-1
status: published
legacyId: 59
summary: 技术栈选择，为什么用 Vue3 + .NET + Python，阿里云部署、自动化流程，遇到的问题与解决方案。
date: 2024-11-20
publishAt: 2024-11-20T01:15:00.000Z
category: tech
source: manual
---

# 我的个人网站从 0 到 1 的搭建过程

这个站点不是一次写完的 Demo，而是「能展示、能写文章、能挂 API、能自己运营」的长期底座。下面按真实顺序回顾从 0 到 1。

## 目标定清楚

一开始就定了三件事：

1. **对外**：作品集 + 文章，SEO 过得去
2. **对内**：简单后台，能看访问、管留言、改配置
3. **可演进**：以后加 AI、支付、模块，不推倒重来

因此选择了「前端静态/SSR 能力 + 独立后端 + 可选 AI 服务」的拆分，而不是一个巨型全栈框架包打天下。

## 技术栈为什么这样选

### 前端：Vue 3 + Nuxt 3 + Tailwind + Naive UI

- Vue 3 Composition：逻辑好拆 composable
- Nuxt 3：路由、构建、部署路径清晰；前台可 SSG
- Tailwind：布局快；设计 token 用 CSS 变量管主题
- Naive UI：后台表格/表单够用，少造轮子

### 后端：.NET 8 WebAPI

- 类型与工程化顺手
- EF Core + MySQL 管业务数据（分析、留言、配置）
- 和前端解耦，方便单独扩容与鉴权

### AI：Python FastAPI（可选）

- 模型与向量相关生态更熟
- 用内部 token 与主站隔离，避免把密钥塞进 Nuxt

### 内容：Git 里的 Markdown

文章真相在 `content/`，不是藏在数据库富文本里——方便 diff、备份，也方便 AI/脚本批量处理。

## 基础设施

| 组件 | 用途 |
| --- | --- |
| 阿里云 ECS | 早期整站 / 现 API |
| OSS + CDN | 前端静态资源 |
| RDS MySQL | 业务库 |
| GitHub Actions | `generate` 后上传 OSS |

域名与 API 子域分离：`xifg.com.cn` 静态，`api.xifg.com.cn` 后端。

## 关键里程碑

1. 首页 + 关于 + 项目列表能打开
2. 博客从 Markdown 可读
3. 管理后台登录与基础运营页
4. 主题 / 配置走后端
5. 部署自动化，减少手工 FTP
6. 文章静态 JSON，解决 OSS 上 `/api` 不存在的问题

## 踩过的坑

### Naive UI 与 SSR / 打包

按需与客户端边界处理好，避免 hydration 报错；大库拆 chunk。

### 「本地有文章，线上没有」

静态托管没有 Nitro。列表必须在构建期产出 `public/data/articles-*.json`，前台仓库层做回退。

### 缓存导致「怎么还是旧后台」

OSS 上旧 `_nuxt` 与 HTML 长缓存会组合出鬼影。对策：同步删除旧 chunk + HTML `no-cache`。

### 鉴权两套历史

早期 cookie 占位 token，后来接到 .NET JWT。迁移时要分清哪些路由走 Nitro、哪些走后端。

## 若重来一遍，我会坚持的

- 内容进 Git，运营数据进 DB
- 前台能静态就静态
- 规范写进仓库（样式层级、AGENTS），而不是只在脑子里

## 小结

从 0 到 1 的关键不是「选了最炫的栈」，而是**边界清晰、能自动发布、出问题知道该查哪一层**。站点会继续长，但底座已经能托住下一阶段的产品与 AI 实验。
