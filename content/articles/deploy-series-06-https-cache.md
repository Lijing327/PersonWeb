---
title: 06｜如何避免浏览器显示“不安全”？HTTPS 缓存坑详解
slug: deploy-series-06-https-cache
status: published
legacyId: 13
summary: 为什么配置好了HTTPS，普通浏览器还是报不安全，无痕模式却正常？揭秘HSTS和浏览器缓存的坑。
date: 2025-11-25
publishAt: 2025-11-25T16:00:00.000Z
category: 部署系列
cover: /images/blog/deploy-06.png
source: manual
---
# 06｜如何避免浏览器显示“不安全”？HTTPS 缓存坑详解

## 诡异现象
你明明已经配置好了 HTTPS，Certbot 也跑通了。
- 打开 **Chrome 无痕模式**：一切正常，显示安全锁。
- 打开 **普通模式**：依然提示"不安全"，或者样式乱了。

## 原因分析

### 1. 浏览器缓存 (301 Redirect Cache)
你之前可能配置过错误的 301 重定向。浏览器会**永久缓存** 301 状态。即使你服务器改对了，浏览器记得的还是旧的错误地址。

### 2. HSTS (HTTP Strict Transport Security)
这是一种安全策略，告诉浏览器"以后只许用HTTPS访问我"。如果你之前配置错误导致 HSTS 记录了错误信息，浏览器会死锁在错误状态。

### 3. 混合内容 (Mixed Content)
你的 HTML 是 HTTPS 加载的，但里面的图片或 CSS 链接写死了 `http://`。浏览器会拦截这些不安全资源，导致页面破碎。

## 解决方法

### 1. 强力清除缓存
在页面上按 `Ctrl + F5` (Windows) 或 `Cmd + Shift + R` (Mac)。

### 2. 清除 HSTS
在 Chrome 地址栏输入：`chrome://net-internals/#hsts`
在 "Delete domain security policies" 中输入你的域名并删除。

### 3. 检查代码
确保所有资源引用都使用相对路径（如 `/img/logo.png`）或 `https://` 绝对路径。

## 总结
浏览器有时候"太聪明"了，缓存了我们的错误配置。遇到"无痕行，普通不行"的情况，先清缓存准没错。
