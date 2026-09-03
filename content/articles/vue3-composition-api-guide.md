---
title: Vue 3 Composition API 使用指南
slug: vue3-composition-api-guide
status: published
legacyId: 4
summary: 详细介绍 Vue 3 Composition API 的使用方法和最佳实践。
date: 2025-11-23
publishAt: 2025-11-23T04:27:31.000Z
category: tech
source: manual
---

# Vue 3 Composition API 使用指南

Options API 用 `data` / `methods` / `computed` 拆逻辑，组件一大就难复用。Composition API 把「同一件事」的状态、计算、副作用放在一起，更适合中大型前端。

## 它解决什么问题

- **逻辑复用**：抽成 `composables/useXxx.ts`，多页面共享
- **类型友好**：配合 `<script setup lang="ts">` 推断更自然
- **按功能组织**：搜索框逻辑、分页逻辑、鉴权逻辑各自成块

## 最小例子（script setup）

```vue
<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'

const count = ref(0)
const double = computed(() => count.value * 2)

function increment() {
  count.value += 1
}

onMounted(() => {
  console.log('mounted', count.value)
})
</script>

<template>
  <button type="button" @click="increment">
    {{ count }} / {{ double }}
  </button>
</template>
```

## 常用 API 速查

| API | 用途 |
| --- | --- |
| `ref` | 基本类型与对象的响应式包装，取值用 `.value` |
| `reactive` | 对象深层响应式，一般少用（解构会丢响应） |
| `computed` | 派生状态 |
| `watch` / `watchEffect` | 副作用与同步 |
| `onMounted` 等 | 生命周期 |
| `toRef` / `toRefs` | 从 props/reactive 安全取出 ref |

## 抽取 composable

```ts
// composables/useCounter.ts
export function useCounter(initial = 0) {
  const count = ref(initial)
  const double = computed(() => count.value * 2)
  const increment = () => { count.value += 1 }
  return { count, double, increment }
}
```

页面里：

```ts
const { count, double, increment } = useCounter()
```

约定：

1. 文件名 `use` 开头
2. 返回明确的状态与方法，不要藏全局副作用
3. 需要清理的监听，在 `onUnmounted` 里处理

## 和 Options API 怎么选

- 新页面、新组件：默认 Composition + `<script setup>`
- 老组件能跑就别强迁；抽公共逻辑时再改
- 表单很重、状态交叉多：优先 Composition，可读性更好

## 实践建议（本站也在用）

- 数据获取放 composable（如 `useArticlesRepository`），页面只负责展示
- 避免在 `setup` 顶层写大量无关联逻辑，按「一块能力一个函数」切
- SSR 场景注意：只在客户端跑的代码放 `onMounted` / `import.meta.client`

## 小结

Composition API 不是「写法炫技」，而是让复杂页面仍然可维护。先掌握 `ref` / `computed` / `watch` / 生命周期，再养成抽 composable 的习惯，就够覆盖大多数业务组件。
