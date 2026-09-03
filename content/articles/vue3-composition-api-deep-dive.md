---
title: Vue 3 Composition API 深度解析
slug: vue3-composition-api-deep-dive
status: published
legacyId: 49
summary: 深入探讨 Vue 3 Composition API 的设计理念、使用场景和最佳实践，帮助你更好地理解和使用这个强大的特性。
date: 2024-12-15
publishAt: 2024-12-15T02:00:00.000Z
category: tech
source: manual
---

# Vue 3 Composition API 深度解析

上一篇《使用指南》偏入门；这篇补「为什么这样设计」和进阶用法，方便在复杂页面里不踩坑。

## 设计理念：按关注点组合

Options API 按选项类型切分（data / methods / computed），同一功能的代码被拆散。Composition API 按**业务能力**组合：鉴权一块、分页一块、表单一块。

这和 React Hooks 的动机类似，但 Vue 保留了更完整的响应式系统（`ref` / `computed` / 依赖收集）。

## setup 与 `<script setup>`

经典写法：

```js
export default {
  setup(props, { emit, slots }) {
    const count = ref(0)
    return { count }
  }
}
```

推荐日常用语法糖：

```vue
<script setup lang="ts">
const count = ref(0)
defineExpose({ count }) // 仅父组件 ref 需要时
</script>
```

`<script setup>` 默认不暴露给模板外，宏（`defineProps` / `defineEmits`）编译期处理，类型更好写。

## ref vs reactive 再辨析

| | ref | reactive |
| --- | --- | --- |
| 适用 | 任意类型 | 对象/数组 |
| 取值 | `.value` | 直接属性 |
| 解构 | 安全 | 会丢响应，需 `toRefs` |
| 替换整体 | `obj.value = newObj` | 麻烦，常不推荐 |

团队约定：**默认 ref；只有表单大对象且不解构时才 reactive**，可减少一半诡异 bug。

## 副作用与停止

```ts
const stop = watch(
  () => props.id,
  async (id) => {
    data.value = await load(id)
  },
  { immediate: true }
)

onUnmounted(() => stop())
```

`watchEffect` 自动收集依赖，适合「跟着一堆状态跑」的同步副作用；异步请求更常用显式 `watch`。

## Provide / Inject 与 composable

跨层共享（主题、权限）可用 provide/inject，但业务逻辑优先 **composable + 显式传参**，依赖更清晰。

```ts
// composables/useAuthSession.ts
export function useAuthSession() {
  const token = useState<string | null>('auth-token', () => null)
  // ...
  return { token, login, logout }
}
```

Nuxt 的 `useState` 还能在 SSR 间共享，注意 key 唯一、别塞敏感大对象。

## 性能相关

- `computed` 有缓存；模板里别写重计算函数却当 computed 用
- 大列表避免在父组件无意义的深层 `reactive`
- `shallowRef` / `shallowReactive` 适合大体量只读替换

## 与本站实践的对应

- `useApi` / `useArticlesRepository`：数据边界在 composable
- 页面组件变「薄」：模板 + 少量编排
- 客户端-only 逻辑进 `onMounted`，避免 SSR 炸

## 小结

Composition API 的深度不在背 API 列表，而在：**切分能力、管好副作用、类型与 SSR 边界清楚**。会拆 composable 之后，中大型 Vue 应用才真正可控。
