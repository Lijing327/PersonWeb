---
title: 04｜Nginx + Nuxt3 静态站点部署全流程（小白可用）
slug: deploy-series-04-nginx-nuxt-static
status: published
legacyId: 11
summary: 记录你的第一次部署：从Nuxt生成静态文件，到上传服务器，再到Nginx配置的完整步骤。
date: 2025-11-25
publishAt: 2025-11-25T16:00:00.000Z
category: 部署系列
cover: /images/blog/deploy-04.png
source: manual
---

# 04｜Nginx + Nuxt3 静态站点部署全流程（小白可用）

把 Nuxt 3 前台当成「一堆 HTML/CSS/JS」交给 Nginx，是个人站最省事的上线方式。

## 1. 本地构建

```bash
npm ci
npm run generate
```

产物一般在 `.output/public`（部分旧教程写 `dist`，以你目录为准）。里面应有 `index.html` 与 `_nuxt/`。

## 2. 上传到服务器

示例放到 `/var/www/html`：

```bash
rsync -avz --delete .output/public/ root@你的IP:/var/www/html/
```

首次也可用 scp：

```bash
scp -r .output/public/* root@你的IP:/var/www/html/
```

## 3. Nginx 最小配置

```bash
sudo nano /etc/nginx/sites-available/default
```

```nginx
server {
    listen 80;
    server_name yourdomain.com;  # 换成你的域名或先写 _

    root /var/www/html;
    index index.html;

    location / {
        # SPA / 前端路由刷新不 404
        try_files $uri $uri/ /200.html /index.html;
    }

    location /_nuxt/ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
```

Nuxt 静态生成常带 `200.html` 作为回退页；没有就保留 `/index.html`。

## 4. 生效

```bash
sudo nginx -t && sudo systemctl reload nginx
```

## 5. 验收

- 打开 `http://域名或IP`  
- 随便进一个子路由再**刷新**，不应 404  
- 控制台无大片 `_nuxt` 404  

## 常见坑

| 现象 | 处理 |
| --- | --- |
| 只有首页好，刷新子路径 404 | 补 `try_files` |
| 403 Forbidden | 目录权限、`root` 路径是否真有 index |
| 仍是 Welcome to nginx | 文件没传到 Nginx 在看的那个 root |

## 小结

generate → 上传 → Nginx root + try_files。先跑通 HTTP，下一篇再上 HTTPS。
