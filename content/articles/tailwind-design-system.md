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

Tailwind 很好用，也很容易变成「每个页面一套魔法数字」。设计系统的目标是：**颜色、圆角、间距有单一来源，组件只消费 token，而不是到处写 `#3b82f6`**。

## 为什么要建设计系统

- 主题切换（亮/暗/品牌色）可一处改、处处生效
- 新页面不会长得像另一个产品
- Code Review 有据可依：硬编码颜色直接打回

本站分层是：`tokens.css`（CSS 变量）→ 基础样式 → Naive UI 覆写 → 页面 CSS → scoped。Tailwind 负责工具类布局，**语义色优先走 CSS 变量**。

## 1. 定义设计令牌

可以在 `tailwind.config` 扩展，也可以（本站做法）以 CSS 变量为准：

```css
:root {
  --color-primary: #2563eb;
  --color-bg-page: #0b1220;
  --color-text-main: #e8eef7;
  --radius-md: 8px;
  --spacing-md: 16px;
}
```

Tailwind 侧映射：

```ts
// tailwind.config.ts 示意
theme: {
  extend: {
    colors: {
      primary: 'var(--color-primary)',
      page: 'var(--color-bg-page)',
    },
    borderRadius: {
      md: 'var(--radius-md)',
    },
  },
}
```

## 2. 主题切换

用 `data-theme` 切换变量覆盖，而不是复制整份组件样式：

```css
[data-theme='dark'] {
  --color-bg-page: #0b1220;
  --color-text-main: #e8eef7;
}
```

组件写：`bg-page text-[var(--color-text-main)]`，主题一变自动跟着走。

## 3. 组件抽象

重复出现的按钮、卡片、区块，抽成 Vue 组件或 `@apply` 工具类：

```css
.btn-primary {
  @apply inline-flex items-center px-4 py-2 rounded-md;
  background: var(--color-primary);
  color: #fff;
}
```

注意：不要把所有东西都 `@apply` 成巨型类；**交互容器**适合组件，一次性布局用工具类即可。

## 4. 与组件库共存

本站后台用 Naive UI：

- 布局/表格/表单：优先 Naive
- 视觉统一：通过 `themeOverrides` + `ui-patch-naive.css` 对齐 token
- 前台营销向页面：Tailwind + 自有 CSS 更多

避免「Naive 一套色 + Tailwind 另一套色」。

## 5. 约束清单（建议写进团队规范）

1. 禁止模板里硬编码色值 / 阴影（动态色除外）
2. 间距优先 `--spacing-*` 或约定好的 `gap-4` 档位
3. 新颜色先加 token，再在组件里用
4. 页面专属样式放 `assets/css/`，不塞进全局入口

## 小结

Tailwind 是加速器，设计系统才是刹车与方向盘。把 **token → 主题 → 组件** 三层理顺，项目越大越省事；本站后续改主题，主要改 `tokens.css`，而不是翻遍页面。
