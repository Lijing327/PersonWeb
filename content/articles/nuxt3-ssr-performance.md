---
title: Nuxt 3 服务端渲染性能优化实战
slug: nuxt3-ssr-performance
status: published
legacyId: 50
summary: 分享在 Nuxt 3 项目中优化服务端渲染性能的实践经验，包括代码分割、缓存策略、资源优化等技巧。
date: 2024-12-10
publishAt: 2024-12-10T06:30:00.000Z
category: tech
source: manual
---

# Nuxt 3 服务端渲染性能优化实战

SSR 的目标是：**更快给出可交互的首屏 HTML**，同时不要把服务器和 JS 包拖垮。个人站流量不大，但习惯养成后，换到正式产品时会省很多火。

## 先量再优

没有指标就不要瞎优化。至少看：

- TTFB（服务端出 HTML 有多快）
- LCP（最大内容何时可见）
- 首屏 JS 体积（Network → JS）
- 服务端接口耗时（瀑布流）

Chrome Performance / Lighthouse 足够起步。

## 1. 代码分割与按需加载

重型依赖不要进公共包：

```ts
// 图表、Markdown 编辑器、3D
const ChartPanel = defineAsyncComponent(() =>
  import('~/components/admin/ChartPanel.vue')
)
```

Nuxt 里也可：

```vue
<ClientOnly>
  <HeavyEditor />
</ClientOnly>
```

原则：

- 后台 / 工具页才用的库，别挂到默认 layout
- `manualChunks` 拆分 naive-ui、echarts 等大户（见本站 `nuxt.config.ts`）

## 2. 数据获取别串成瀑布

差：

```ts
const a = await fetchA()
const b = await fetchB() // 等 A 完才开始
```

好：

```ts
const [a, b] = await Promise.all([fetchA(), fetchB()])
```

能在服务端聚合就聚合：页面只拿一份 JSON，少打几次往返。

## 3. 缓存分层

| 层级 | 做什么 |
| --- | --- |
| CDN / 静态 | HTML 短缓存或 no-cache；`_nuxt` 长缓存 |
| Nitro / 路由 | 对只读列表用 `cachedEventHandler` 或短 TTL |
| 应用 | 主题、站点配置等低频配置内存缓存 |
| 浏览器 | 合理 `Cache-Control`，避免旧 chunk 幽灵 |

纯内容站可直接 **SSG**：没有每次 SSR 成本，性能最好。

## 4. 资源优化

- 图片：合适尺寸 + `loading="lazy"`，封面别塞 4K 原图
- 字体：子集化，少加载整套字重
- CSS：按页面/组件引入，避免全局塞满后台样式
- 第三方脚本：延后或按需，别堵首屏

## 5. SSR 特有注意

- 只在浏览器存在的 API（`window`、localStorage）放 `onMounted` / `import.meta.client`
- Naive UI 等组件库注意 hydration mismatch
- Payload 别塞过大对象；列表字段裁剪到展示所需

## 本站取舍

前台大量页面走静态生成；运营后台走客户端。这样访客路径轻，管理路径再重也不拖累首页。

## 小结

Nuxt 3 性能优化顺序建议：**减包 → 并发取数 → 缓存 → 媒体与字体**。先让首屏「干净」，再谈更细的服务端调优。
