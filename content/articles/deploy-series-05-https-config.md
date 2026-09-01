---
title: 05｜为何浏览器显示“不安全”？HTTPS 一步步配置正确指南
slug: deploy-series-05-https-config
status: published
legacyId: 12
summary: 域名能访问但提示不安全？Certbot配置后依然无效？本文教你正确配置HTTPS，解决安全组、重定向等常见问题。
date: 2025-11-25
publishAt: 2025-11-25T16:00:00.000Z
category: 部署系列
cover: /images/blog/deploy-05.png
source: manual
---
# 05｜为何浏览器显示“不安全”？HTTPS 一步步配置正确指南

## 问题现象
你买好了域名，也解析了，甚至可能也跑了 Certbot，但浏览器地址栏还是显示"不安全"（Not Secure），或者必须手动输入 `https://` 才能访问。

## 常见原因排查

### 1. 安全组未放行 443
这是最容易被忽略的。HTTPS 使用 **443** 端口。
**检查**: 去阿里云 ECS 控制台 -> 安全组 -> 入方向，确保 443 端口是允许的。

### 2. 缺少 80 → 443 的强制跳转
用户习惯只输入 `baidu.com`（默认是 HTTP 80）。你需要告诉 Nginx："凡是访问 80 的，都给我滚去 443"。

**Nginx 配置**:
```nginx
server {
    listen 80;
    server_name yourdomain.com;
    return 301 https://$host$request_uri;  # 关键跳转
}
```

### 3. Certbot 自动配置
推荐使用 Certbot 一键搞定：
```bash
sudo certbot --nginx -d yourdomain.com
```
它会自动修改你的 Nginx 配置，添加 SSL 证书路径，并询问是否开启重定向（选 Yes）。

## 总结
HTTPS 是现代网站的标配。只要搞定 **证书申请** + **Nginx配置** + **安全组放行** 这三板斧，绿锁头自然会出现。
