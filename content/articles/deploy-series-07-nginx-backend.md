---
title: 07｜Nginx 配置只用于静态部署？如何保证后端服务共存
slug: deploy-series-07-nginx-backend
status: published
legacyId: 14
summary: 担心Nginx占用了80端口，后端API没地方跑？教你如何使用Nginx反向代理实现前后端共存。
date: 2025-11-25
publishAt: 2025-11-25T16:00:00.000Z
category: 部署系列
cover: /images/blog/deploy-07.png
source: manual
---
# 07｜Nginx 配置只用于静态部署？如何保证后端服务共存

## 你的担忧
“我的 Nginx 配置监听了 80/443 用来放静态网站，那我的后端 API 跑在哪里？会不会冲突？”

## 答案：不会冲突
这是最经典的前后端分离部署架构：
- **静态资源 (前端)**: 由 Nginx 直接提供文件服务。
- **动态资源 (后端)**: 跑在内部端口（如 3000, 5000, 8080），不对外直接暴露。
- **连接桥梁**: Nginx 作为**反向代理**。

## 配置示例
假设你的后端 API 跑在 `127.0.0.1:5000`。

```nginx
server {
    listen 443 ssl;
    server_name yourdomain.com;
    
    # 前端静态文件
    location / {
        root /var/www/html;
        try_files $uri $uri/ /index.html;
    }

    # 后端 API 代理
    location /api/ {
        proxy_pass http://127.0.0.1:5000/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

## 效果
- 访问 `https://yourdomain.com/` -> 看到前端页面。
- 访问 `https://yourdomain.com/api/users` -> Nginx 转发给后端 5000 端口，拿到数据返回给你。

这样，外界只能看到一个 443 端口，既安全又整洁。
