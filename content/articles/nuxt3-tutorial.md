---
title: Nuxt 3 项目实战：从零搭建个人网站
slug: nuxt3-tutorial
status: published
legacyId: 25
summary: 详细介绍如何使用 Nuxt 3 框架搭建一个现代化的个人网站，包括页面路由、组件开发、样式配置等核心功能的实现
date: 2024-01-14
publishAt: 2024-01-14T16:00:00.000Z
category: tech
cover: /images/blog/nuxt3-tutorial.png
source: manual
---
# Nuxt 3 项目实战：从零搭建个人网站

## 前言

Nuxt 3 是基于 Vue 3 的全栈框架，它提供了优雅的开发体验和强大的功能特性。在这篇文章中，我将分享如何使用 Nuxt 3 从零开始搭建一个功能完整的个人网站。

## 为什么选择 Nuxt 3？

### 🚀 性能优势
- **服务端渲染 (SSR)**: 更好的SEO表现和首屏加载速度
- **静态生成 (SSG)**: 可以生成静态站点，部署到CDN
- **自动代码分割**: 按路由自动分割代码，减少初始加载体积

### 🛠️ 开发体验
- **约定式路由**: 基于文件系统的路由，无需手动配置
- **自动导入**: 组件和工具函数自动导入
- **TypeScript 支持**: 开箱即用的 TypeScript 支持

### 🔧 生态丰富
- **模块系统**: 丰富的官方和社区模块
- **内容管理**: @nuxt/content 模块支持 Markdown 驱动
- **样式方案**: 内置 Tailwind CSS、Sass 等支持

## 项目初始化

### 创建项目

```bash
# 使用 nuxi 创建新项目
npx nuxi@latest init my-personal-site

# 进入项目目录
cd my-personal-site

# 安装依赖
npm install
```

### 基础配置

创建 `nuxt.config.ts` 配置文件：

```typescript
export default defineNuxtConfig({
  // 开发工具
  devtools: { enabled: true },
  
  // 模块配置
  modules: [
    '@nuxt/content',
    '@nuxtjs/tailwindcss'
  ],
  
  // 内容配置
  content: {
    highlight: {
      theme: 'github-light'
    }
  },
  
  // 应用配置
  app: {
    head: {
      title: '溪午听风 - 个人网站',
      meta: [
        { name: 'description', content: '全栈开发者的个人网站' }
      ]
    }
  }
})
```

## 项目结构设计

```
my-personal-site/
├── pages/              # 页面文件
│   ├── index.vue      # 首页
│   ├── tools/         # 工具页面
│   ├── projects/      # 项目页面
│   ├── blog/          # 博客页面
│   └── about.vue      # 关于页面
├── content/           # Markdown 内容
│   ├── tools/         # 工具介绍
│   ├── projects/      # 项目展示
│   └── blog/          # 博客文章
├── components/        # 组件
├── layouts/           # 布局文件
├── composables/       # 组合式函数
└── assets/            # 静态资源
```

## 页面开发实践

### 1. 首页设计

```vue
<!-- pages/index.vue -->
<template>
  <div class="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
    <div class="container mx-auto px-4 py-16">
      <div class="text-center">
        <h1 class="text-5xl font-bold text-gray-800 mb-6">
          你好，我是 溪午听风
        </h1>
        <p class="text-xl text-gray-600 mb-8">
          全栈开发者 · Revit插件专家
        </p>
        
        <div class="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mt-12">
          <NuxtLink
            v-for="item in navigationItems"
            :key="item.path"
            :to="item.path"
            class="group p-6 bg-white rounded-xl shadow-md hover:shadow-lg transition-all"
          >
            <div class="text-4xl mb-4">{{ item.icon }}</div>
            <h3 class="text-lg font-semibold mb-2">{{ item.title }}</h3>
            <p class="text-gray-600 text-sm">{{ item.description }}</p>
          </NuxtLink>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
const navigationItems = [
  {
    title: '插件工具',
    path: '/tools',
    icon: '🔧',
    description: 'Revit插件与自适应族'
  },
  {
    title: '项目展示',
    path: '/projects',
    icon: '🧪',
    description: '个人项目与作品集'
  },
  {
    title: '技术博客',
    path: '/blog',
    icon: '📝',
    description: '技术心得与思考'
  },
  {
    title: '关于我',
    path: '/about',
    icon: '👤',
    description: '个人介绍与联系方式'
  }
]
</script>
```

### 2. 内容驱动的页面

```vue
<!-- pages/tools/index.vue -->
<template>
  <div class="container mx-auto px-4 py-8">
    <h1 class="text-4xl font-bold text-center mb-12">🔧 插件工具</h1>
    
    <div class="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
      <div
        v-for="tool in tools"
        :key="tool._path"
        class="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow"
      >
        <img
          :src="tool.cover"
          :alt="tool.title"
          class="w-full h-48 object-cover"
        >
        <div class="p-6">
          <h3 class="text-xl font-semibold mb-2">{{ tool.title }}</h3>
          <p class="text-gray-600 mb-4">{{ tool.description }}</p>
          
          <div class="flex items-center justify-between">
            <span class="text-lg font-bold text-blue-600">{{ tool.price }}</span>
            <div class="space-x-2">
              <NuxtLink
                :to="`/tools/${tool.slug}`"
                class="text-blue-600 hover:text-blue-800"
              >
                详情
              </NuxtLink>
              <a
                :href="tool.buy_link"
                target="_blank"
                class="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
              >
                购买
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
// 使用 @nuxt/content 查询数据
const { data: tools } = await useAsyncData('tools', () => 
  queryContent('/tools').find()
)
</script>
```

### 3. 详情页面

```vue
<!-- pages/tools/[slug].vue -->
<template>
  <div class="container mx-auto px-4 py-8">
    <div class="max-w-4xl mx-auto">
      <!-- 返回按钮 -->
      <NuxtLink
        to="/tools"
        class="inline-flex items-center text-blue-600 hover:text-blue-800 mb-6"
      >
        ← 返回工具列表
      </NuxtLink>
      
      <!-- 工具信息头部 -->
      <div class="bg-white rounded-lg shadow-md p-8 mb-8">
        <div class="flex flex-col md:flex-row gap-6">
          <img
            :src="tool.cover"
            :alt="tool.title"
            class="w-full md:w-64 h-48 object-cover rounded-lg"
          >
          <div class="flex-1">
            <h1 class="text-3xl font-bold mb-4">{{ tool.title }}</h1>
            <p class="text-gray-600 mb-4">{{ tool.description }}</p>
            
            <div class="flex items-center gap-4 mb-4">
              <span class="text-2xl font-bold text-blue-600">{{ tool.price }}</span>
              <div class="flex gap-2">
                <span
                  v-for="tag in tool.tags"
                  :key="tag"
                  class="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm"
                >
                  {{ tag }}
                </span>
              </div>
            </div>
            
            <a
              :href="tool.buy_link"
              target="_blank"
              class="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 inline-block"
            >
              立即购买
            </a>
          </div>
        </div>
      </div>
      
      <!-- 详细内容 -->
      <div class="bg-white rounded-lg shadow-md p-8">
        <ContentDoc :path="`/tools/${tool.slug}`" />
      </div>
    </div>
  </div>
</template>

<script setup>
const route = useRoute()
const slug = route.params.slug

// 获取具体工具数据
const { data: tool } = await useAsyncData(`tool-${slug}`, () =>
  queryContent('/tools').where({ slug }).findOne()
)

// 如果找不到内容，返回404
if (!tool.value) {
  throw createError({
    statusCode: 404,
    statusMessage: '工具不存在'
  })
}

// 设置页面标题
useHead({
  title: `${tool.value.title} - 溪午听风`,
  meta: [
    { name: 'description', content: tool.value.description }
  ]
})
</script>
```

## 样式和组件优化

### 1. 全局样式配置

```css
/* assets/css/main.css */
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  body {
    @apply font-sans text-gray-900;
  }
}

@layer components {
  .btn-primary {
    @apply bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors;
  }
  
  .card {
    @apply bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow;
  }
}
```

### 2. 可复用组件

```vue
<!-- components/ToolCard.vue -->
<template>
  <div class="card overflow-hidden">
    <img
      :src="tool.cover"
      :alt="tool.title"
      class="w-full h-48 object-cover"
    />
    <div class="p-6">
      <h3 class="text-xl font-semibold mb-2">{{ tool.title }}</h3>
      <p class="text-gray-600 mb-4">{{ tool.description }}</p>
      
      <div class="flex items-center justify-between">
        <PriceTag :price="tool.price" />
        <div class="space-x-2">
          <NuxtLink
            :to="`/tools/${tool.slug}`"
            class="text-blue-600 hover:text-blue-800"
          >
            详情
          </NuxtLink>
          <BuyButton :link="tool.buy_link" />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
interface Tool {
  title: string
  description: string
  cover: string
  price: string
  slug: string
  buy_link: string
}

defineProps<{
  tool: Tool
}>()
</script>
```

## 性能优化建议

### 1. 图片优化
- 使用 WebP 格式
- 配置懒加载
- 合理设置图片尺寸

### 2. 代码分割
- 按路由自动分割
- 动态导入大型组件
- 预加载关键资源

### 3. SEO优化
- 配置合适的 meta 标签
- 使用语义化 HTML
- 生成 sitemap

## 部署上线

### 1. 静态生成

```bash
# 生成静态站点
npm run generate

# 输出到 .output/public 目录
```

### 2. 服务端渲染

```bash
# 构建生产版本
npm run build

# 启动生产服务器
npm run preview
```

## 总结

通过本文的实践，我们成功使用 Nuxt 3 搭建了一个功能完整的个人网站。项目具备以下特点：

- ✅ **内容驱动**: 基于 Markdown 的内容管理
- ✅ **响应式设计**: 适配各种设备尺寸
- ✅ **SEO友好**: 服务端渲染和静态生成
- ✅ **开发效率**: 约定式路由和自动导入
- ✅ **可维护性**: 组件化和模块化架构

Nuxt 3 确实是构建现代Web应用的优秀选择，它让我们能够专注于业务逻辑和用户体验，而不必过多关心底层的配置和优化。

希望这篇文章对你有所帮助！如果你有任何问题或建议，欢迎在评论区交流。
