---
title: Tailwind CSS 设计系统构建指南
slug: tailwind-design-system
status: published
legacyId: 52
summary: 如何使用 Tailwind CSS 构建可扩展的设计系统，包括主题配置、组件抽象、工具类扩展等。
date: 2024-11-28
publishAt: 2024-11-28T08:00:00.000Z
category: tech
source: manual
---
# Tailwind CSS 设计系统构建指南

## 设计系统的重要性

统一的设计系统可以提升开发效率和用户体验。

## 配置主题

在 `tailwind.config.js` 中定义设计令牌：

```javascript
module.exports = {
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#f0f9ff',
          // ...
        }
      }
    }
  }
}
```

## 组件抽象

将常用的样式组合抽象为组件，减少重复代码。
