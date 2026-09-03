---
title: Nuxt 3 项目部署实战
slug: nuxt3-deployment
status: published
legacyId: 5
summary: 从零开始部署 Nuxt 3 项目到生产环境的完整流程。
date: 2025-11-18
publishAt: 2025-11-18T04:27:31.000Z
category: tech
source: manual
---

# Nuxt 3 项目部署实战

把本地的 Nuxt 3 项目搬到公网，最容易卡在三件事：**构建产物对不对、服务器目录对不对、Nginx 回退规则对不对**。下面按我实际部署个人站的流程写，尽量可照着做。

## 部署前确认

- Node.js 20+（与 CI 一致更省心）
- 一台有公网 IP 的 Linux 服务器（Ubuntu 20.04/22.04 常见）
- 域名已解析到服务器
- 本地能跑通：`npm run generate` 或 `npm run build`

本站生产前端采用 **静态生成 + OSS/Nginx**，后端 API 单独部署。文中也会区分这两种形态。

## 一、本地构建

### 1. 静态站点（SSG，适合博客/作品集）

```bash
npm ci
npm run generate
```

产物一般在：

```text
.output/public/
```

把整个 `public` 目录上传到对象存储，或放到服务器的站点根目录（例如 `/var/www/site/`）。

### 2. Node 服务端渲染（SSR）

```bash
npm ci
npm run build
node .output/server/index.mjs
```

生产环境用 systemd / PM2 守护进程，由 Nginx 反代到 `127.0.0.1:3000`。

**个人站建议：** 前台能静态就静态，接口走独立 API。静态更省资源，也少一层 Node 故障面。

## 二、服务器准备

```bash
# 更新与基础工具
sudo apt update && sudo apt install -y nginx curl

# 若走 SSR，再安装 Node（可用 nvm / nodesource）
node -v
```

目录示例：

```text
/var/www/personweb/          # 静态文件或 SSR 工作目录
/etc/nginx/sites-available/personweb
```

上传静态文件：

```bash
rsync -avz --delete .output/public/ user@server:/var/www/personweb/
```

## 三、Nginx 配置（静态 + SPA 回退）

Nuxt 前端路由很多是客户端路由，刷新深链时必须回退到 `index.html` 或 `200.html`。

```nginx
server {
    listen 80;
    server_name example.com;

    root /var/www/personweb;
    index index.html;

    location / {
        try_files $uri $uri/ /200.html;
    }

    location /_nuxt/ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # 若 API 在同域反代
    location /api/ {
        proxy_pass http://127.0.0.1:5234/api/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

启用站点并检查：

```bash
sudo ln -sf /etc/nginx/sites-available/personweb /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx
```

## 四、HTTPS

```bash
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d example.com
```

证书续期一般由 certbot timer 自动处理。配完后用无痕窗口打开，确认锁头正常，并清一次浏览器 HSTS/缓存（否则会误以为「还是不安全」）。

## 五、自动化发布（推荐）

最小闭环：

1. `git push` 到 `master`
2. CI 执行 `npm ci && npm run generate`
3. 上传 `.output/public/` 到 OSS 或 rsync 到服务器
4. **清理旧 `_nuxt` hash 文件**，避免访客长期命中旧 JS
5. HTML 入口设置 `Cache-Control: no-cache`

本仓库已经用 GitHub Actions 做前端 OSS 部署；踩过的坑是：只覆盖上传、不删旧 chunk，浏览器会一直显示旧菜单。

## 六、上线检查清单

- [ ] 首页 `/` 200，不是 403/空白
- [ ] `/blog`、`/about` 刷新不 404
- [ ] `/_nuxt/*.js` 能加载，控制台无大片 404
- [ ] 接口域名跨域与 HTTPS 正常
- [ ] 移动端首屏可滚动、无挡住内容的异常浮层

## 常见问题

**刷新子路由 404**  
Nginx 缺少 `try_files ... /200.html`。

**页面空白但网络 200**  
多半是旧 HTML 缓存指向了已删除的 `_nuxt` 文件，强刷或禁 HTML 缓存。

**本地有数据，线上没有**  
静态托管没有 Nitro。依赖 `/api/content/*` 的页面，需要在 generate 阶段产出静态 JSON（例如文章索引）。

## 小结

Nuxt 3 部署并不玄：选对 **SSG 还是 SSR**，把 **产物目录、Nginx 回退、缓存策略** 三件事做对，再补上 HTTPS 和自动发布。本文对应的是「能稳定上线」的基线；更细的 ECS / HTTPS 缓存坑，可以继续看本站「部署系列」文章。
