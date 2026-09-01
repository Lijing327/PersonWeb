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

## 什么是 Composition API

Composition API 是 Vue 3 引入的新特性，提供了更好的逻辑复用和代码组织方式。

## 基本用法

```javascript
import { ref, computed, onMounted } from 'vue'

export default {
  setup() {
    const count = ref(0)
    const doubleCount = computed(() => count.value * 2)
    
    onMounted(() => {
      console.log('组件已挂载')
    })
    
    return { count, doubleCount }
  }
}
```
