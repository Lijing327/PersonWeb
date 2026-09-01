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

## 技术栈选择

### 前端：Vue3 + Nuxt3

- **Vue3**：现代化的前端框架，Composition API 让代码更清晰
- **Nuxt3**：服务端渲染，SEO 友好，开发体验优秀
- **Tailwind CSS**：快速构建美观界面

### 后端：.NET Core

- 性能优秀，生态完善
- 与前端分离，便于扩展
- 支持多种数据库

### AI 服务：Python

- 独立的 Python 服务处理 AI 相关功能
- 文本生成、向量化、文档问答
- 第三方 AI 模型统一调用

## 阿里云部署

- **ECS**：服务器托管
- **OSS**：静态资源存储
- **RDS**：数据库服务

## 遇到的问题与解决方案

1. **SSR 兼容性**：解决 Naive UI 的 SSR 问题
2. **性能优化**：代码分割、缓存策略
3. **数据同步**：前后端数据格式统一
