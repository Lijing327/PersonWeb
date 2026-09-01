---
title: Web部署指南：Nginx配置单页应用
slug: nginx-spa-config
status: published
legacyId: 24
summary: 针对Vue/React/Nuxt等单页应用(SPA)的Nginx配置详解，包括try_files路由重定向、域名绑定、虚拟主机配置及HTTPS设置。
date: 2025-11-25
publishAt: 2025-11-25T16:00:00.000Z
category: 运维部署
cover: /images/blog/nginx-spa.png
source: manual
---
# Web部署指南：Nginx配置单页应用

## 问题场景
将Vue/React构建好的 `dist` 目录上传到服务器后，访问首页正常，但刷新子页面（如 `/about`）报 404 错误。

## 核心内容

### 1. Nginx基础配置解析
Nginx 的配置文件通常位于 `/etc/nginx/sites-available/` 或 `/etc/nginx/conf.d/`。

一个最基础的静态网站配置：
```nginx
server {
    listen 80;
    server_name example.com;
    root /var/www/html/dist;
    index index.html;
}
```

### 2. 单页应用的特殊配置要求 (try_files)
SPA应用（单页应用）只有一个 `index.html`。前端路由（如 `vue-router`）在浏览器端处理URL变化。当用户直接访问 `/about` 时，Nginx 去找 `/about` 文件，找不到就报404。

**解决方案**: 使用 `try_files` 将所有找不到文件的请求都指向 `index.html`。

```nginx
location / {
    try_files $uri $uri/ /index.html;
}
```
- `$uri`: 尝试找对应文件。
- `$uri/`: 尝试找对应目录。
- `/index.html`: 都找不到，就返回首页（交给前端路由处理）。

### 3. 域名绑定和虚拟主机配置
完整的配置示例 (`/etc/nginx/sites-available/my-spa`)：

```nginx
server {
    listen 80;
    server_name www.example.com;  # 你的域名

    root /var/www/my-spa/dist;    # 项目路径
    index index.html;

    # 开启gzip压缩，加速加载
    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript;

    location / {
        try_files $uri $uri/ /index.html;
    }

    # 代理后端API (可选)
    location /api/ {
        proxy_pass http://localhost:3000/;
        proxy_set_header Host $host;
    }
}
```

### 4. 启用配置
```bash
# 创建软链接启用配置
sudo ln -s /etc/nginx/sites-available/my-spa /etc/nginx/sites-enabled/
# 检查语法
sudo nginx -t
# 重启服务
sudo systemctl restart nginx
```

## 总结
部署SPA应用的核心就是 `try_files $uri $uri/ /index.html;` 这行配置。记住它，你的前端部署之路将畅通无阻。
