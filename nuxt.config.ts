// https://nuxt.com/docs/api/configuration/nuxt-config
const isProd = process.env.NODE_ENV === 'production'
const isDev = !isProd

export default defineNuxtConfig({
  // 日常开发默认关闭 DevTools，需要时：NUXT_DEVTOOLS=true npm run dev
  devtools: { enabled: process.env.NUXT_DEVTOOLS === 'true' && isDev },
  // 不参与 Nuxt 扫描的目录（减少 pages/components 索引，加快 dev 冷启动）
  ignore: [
    '**/backend/**',
    '**/ai-service/**',
    '**/database/**',
    '**/docs/**',
    '**/examples/**',
    '**/scripts/**',
    '**/test/**',
    '**/test-documents/**',
    '**/server/tests/**',
  ],
  debug: {
    hooks: false
  },
  ignoreOptions: {
    // Work around Nuxt component scanning passing absolute Windows paths
    // from dependency runtime components (for example @nuxtjs/mdc prose components).
    allowRelativePaths: true
  },
  modules: [
    '@nuxt/content',
    '@nuxtjs/tailwindcss'
  ],

  tailwindcss: {
    viewer: false,
    exposeConfig: false,
  },

  // 构建配置
  build: {
    transpile: ['naive-ui', 'vueuc', '@css-render/vue3-ssr']
  },

  // 运行时配置
  runtimeConfig: {
    // 服务端私有配置：.NET 后端地址，用于 Nitro 服务端路由调用
    backendApiBase: process.env.NUXT_PUBLIC_API_BASE || 'http://localhost:5234/api',
    public: {
      // API 基础路径，通过环境变量配置
      // 注意：客户端会根据当前域名自动判断使用哪个 API
      // - localhost/127.0.0.1: 自动使用 http://localhost:5234/api
      // - localhost/127.0.0.1: 自动使用 http://localhost:5234/api
      // - xifg.com.cn: 自动使用 https://api.xifg.com.cn/api
      // - xing.com.cn: 自动使用 https://api.xing.com.cn/api
      // 环境变量仅作为服务端渲染时的默认值
      // 默认使用同源 /api，避免线上未配置时错误回退到 localhost
      apiBase: process.env.NUXT_PUBLIC_API_BASE || '/api'
    }
  },

  // Content 模块配置（v3：build.markdown）
  content: {
    build: {
      markdown: {
        toc: { depth: 3, searchDepth: 3 },
        highlight: {
          theme: { default: 'dracula', dark: 'dracula' },
          // 开发环境少注册语言包，减轻 @nuxt/content 首次处理成本
          langs: isDev
            ? ['javascript', 'typescript', 'vue', 'html', 'css', 'json', 'bash', 'markdown']
            : [
                'javascript', 'typescript', 'vue', 'html', 'css', 'scss',
                'json', 'yaml', 'sql', 'bash', 'shell', 'markdown',
                'python', 'csharp'
              ]
        }
      }
    }
  },

  // 应用配置
  app: {
    head: {
      htmlAttrs: {
        'data-theme': 'dark',
        class: 'dark',
      },
      title: '溪午听风 - 个人开发者网站',
      meta: [
        { charset: 'utf-8' },
        { name: 'viewport', content: 'width=device-width, initial-scale=1, maximum-scale=5, user-scalable=yes, viewport-fit=cover' },
        {
          name: 'description',
          content: '溪午听风的个人网站，展示插件工具、项目作品和技术博客。开发让生活更高效，代码就是我的魔方。'
        },
        { name: 'keywords', content: 'Revit插件,小程序开发,前端开发,技术博客,个人网站' },
        { name: 'author', content: '溪午听风' },
        // 移动端优化
        { name: 'theme-color', content: '#3b82f6' }, // 浏览器地址栏颜色
        { name: 'apple-mobile-web-app-capable', content: 'yes' }, // iOS 全屏模式
        { name: 'apple-mobile-web-app-status-bar-style', content: 'default' }, // iOS 状态栏样式：default/black/black-translucent
        { name: 'apple-mobile-web-app-title', content: '溪午听风' }, // iOS 主屏幕标题
        { name: 'mobile-web-app-capable', content: 'yes' }, // Android 全屏模式
        { name: 'format-detection', content: 'telephone=no' }, // 禁用自动识别电话号码
      ],
      link: [
        { rel: 'icon', type: 'image/png', href: '/favicon.png' },
        // iOS 主屏幕图标
        { rel: 'apple-touch-icon', href: '/favicon.png' },
        { rel: 'apple-touch-icon', sizes: '180x180', href: '/favicon.png' },
        // Android Chrome 图标
        { rel: 'icon', type: 'image/png', sizes: '192x192', href: '/favicon.png' },
        { rel: 'icon', type: 'image/png', sizes: '512x512', href: '/favicon.png' },
      ],
      script: [
        {
          key: 'theme-bootstrap',
          tagPriority: 0,
          type: 'text/javascript',
          innerHTML: `(function(){try{var k='site-theme',t=localStorage.getItem(k),d=document.documentElement,n=t==='light'?'light':'dark';d.dataset.theme=n;d.classList.toggle('dark',n==='dark')}catch(e){document.documentElement.dataset.theme='dark';document.documentElement.classList.add('dark')}})();`,
        },
      ],
    }
  },

  // CSS 配置
  css: [
    '~/assets/css/main.css',
    '~/assets/styles/index.css',
    '~/assets/css/header.css',
    '~/assets/css/footer.css',
  ],

  // Nitro 配置（用于静态生成优化）
  nitro: {
    prerender: {
      // 关闭自动爬取链接，避免内存溢出
      crawlLinks: false,
      // 预渲染核心路由和 admin 主要页面
      routes: [
        '/',
        '/life',
        '/life/about',
        '/life/notes',
        '/work',
        '/admin',
        '/admin/analytics',
        '/admin/articles',
        '/admin/projects',
        '/admin/side-projects',
        '/admin/visitor-messages',
        '/admin/consultations',
        '/admin/orders',
        '/admin/time-capsules',
        '/admin/cognition',
        '/200.html',
        '/404.html'
      ],
      // 排除动态内容页面
      ignore: [
        '/blog/**',
        '/projects/**',
        '/admin/articles/edit/**',
        '/admin/side-projects/projects/**'
      ],
      // 忽略预渲染错误
      failOnError: false
    },
  },

  // Vite 配置
  vite: {
    optimizeDeps: {
      include: [
        'naive-ui',
        'vueuc',
        '@css-render/vue3-ssr',
        '@vicons/ionicons5',
        'markdown-it',
      ]
    },
    resolve: {
      alias: {
        '#app-manifest': require('path').resolve(__dirname, 'app-manifest-stub.js')
      }
    },
    css: {
      preprocessorOptions: {
        scss: {
          // 抑制 Sass legacy-js-api 警告
          // 注意：通过环境变量 SASS_SILENCE_DEPRECATIONS=legacy-js-api 来抑制警告
          // 已在 package.json 的脚本中设置
          // 如果项目不使用 SCSS，此配置用于抑制依赖中的 Sass 警告
          quietDeps: true
        }
      }
    },
    server: {
      // HMR 配置，减少连接中断
      hmr: {
        protocol: 'ws',
        host: 'localhost'
      },
      watch: {
        ignored: [
          '**/.git/**',
          '**/.data/**',
          '**/.nuxt/**',
          '**/.output/**',
          '**/ai-service/**',
          '**/backend/**',
          '**/database/**',
          '**/docs/**',
          '**/examples/**',
          '**/test/**',
          '**/test-documents/**'
        ]
      }
    },
    build: {
      // 代码分割优化 - 减少文件数量以符合性能预算
      rollupOptions: {
        output: {
          // 手动配置 chunk 分组，减少文件数量
          manualChunks(id) {
            // node_modules 中的依赖合并到 vendor chunk
            if (id.includes('node_modules')) {
              // 大型独立库单独分组（naive-ui 不与 vendor 拆包：与 vue/vueuc 等互引用会产生 Circular chunk: vendor-naive <-> vendor）
              if (id.includes('echarts')) return 'vendor-echarts'
              if (id.includes('@vueuse')) return 'vendor-vueuse'
              if (id.includes('/three/') || id.includes('\\three\\')) return 'vendor-three'
              if (id.includes('@bytemd') || id.includes('/bytemd/')) return 'vendor-bytemd'
              if (id.includes('highlight.js') || id.includes('/highlightjs/')) return 'vendor-hljs'
              return 'vendor'
            }
          },
          // Vite 7 / Rollup：使用 experimental 前缀（minChunkSize 已弃用并报 WARN）
          experimentalMinChunkSize: 30000
        }
      },
      // 减少 chunk 大小警告阈值（naive-ui、echarts、@nuxt/content sqlite 等依赖较大）
      chunkSizeWarningLimit: 2000
    }
  },

  compatibilityDate: '2024-04-03'
})
