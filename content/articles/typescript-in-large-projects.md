---
title: TypeScript 在大型项目中的应用实践
slug: typescript-in-large-projects
status: published
legacyId: 51
summary: 探讨如何在大型前端项目中有效使用 TypeScript，包括类型设计、模块组织、工具链配置等。
date: 2024-12-05
publishAt: 2024-12-05T01:15:00.000Z
category: tech
source: manual
---

# TypeScript 在大型项目中的应用实践

项目一变大，`any` 和隐式 any 就会开始腐蚀边界。TypeScript 的价值不在「每个变量都写类型」，而在于：**跨模块契约可验证、重构可放心、IDE 能指出半截报错**。

## 为什么大型项目更需要 TS

- **边界清晰**：页面、composable、API DTO 之间有稳定接口
- **重构安全**：改字段名时编译器帮你扫一遍调用方
- **协作成本下降**：新人靠类型读懂数据形状，少问「这个字段到底有没有」

## 类型设计原则

### 1. 接口 vs 类型别名

- **对象形状、可扩展契约**：优先 `interface`（可 declaration merging，可读性也好）
- **联合、交叉、映射类型、工具类型**：用 `type`

```ts
interface Article {
  id: string
  title: string
  slug: string
}

type ArticleStatus = 'draft' | 'published'
type ArticleWithStatus = Article & { status: ArticleStatus }
```

### 2. 泛型用在「容器」上

分页、结果包装、仓库层适合泛型；业务实体本身少做过度抽象。

```ts
interface ApiResult<T> {
  data: T
  message?: string
}
```

### 3. 严格限制 `any`

- 临时逃逸用 `unknown` + 收窄，不要直接 `any`
- 第三方无类型模块：本地 `*.d.ts` 补最小声明
- 开启 `noImplicitAny`、`strictNullChecks`（至少）

## 项目组织

本站大致按这样分层：

```text
types/            # 跨端共享类型（可选）
composables/      # 组合逻辑 + 返回类型
server/           # Nitro API 的请求/响应形状
backend/          # .NET DTO（前后端各自维护，靠约定对齐）
```

实践：

1. **DTO 靠近使用处**，不要为了「集中」搞一个 2000 行 `types.ts`
2. **导出类型，不导出实现细节**（`export type { Article }`）
3. API 层用 `Pick` / `Omit` 派生列表项与详情，避免复制粘贴字段

## 工具链建议

- `tsconfig`：`strict: true`，路径别名与 Nuxt/`~` 一致
- CI 里跑 `nuxi typecheck` 或 `vue-tsc --noEmit`，别只靠本地 IDE
- ESLint：`@typescript-eslint/no-explicit-any` 设为 warn/error

## 常见坑

| 现象 | 处理 |
| --- | --- |
| 解构 `reactive` 丢响应 | 用 `toRefs` 或改 `ref` |
| 组件 props 推断失败 | 显式 `defineProps<{...}>()` |
| 前后端字段不一致 | 以 API 契约为准，前端做 adapter |

## 小结

大型项目里 TypeScript 是**工程纪律**，不是装饰。把契约放在边界、少用 `any`、让 CI 做类型检查，比纠结「interface 还是 type」重要得多。
