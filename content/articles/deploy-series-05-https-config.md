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

域名能打开，但地址栏显示「不安全」，或必须手动敲 `https://` 才有锁。

## 先搞清三件事

HTTPS 要同时满足：

1. **443 端口**从公网可达（云安全组 + 本机防火墙）  
2. **有效证书**（域名匹配、未过期）  
3. **用户从 HTTP 被引导到 HTTPS**（可选但强烈建议）  

少任何一条，体验都会怪。

## 排查顺序

### 1. 安全组放行 443

阿里云 ECS → 安全组 → 入方向：放行 TCP 443（以及已有的 80，供签发与跳转）。

本机若开了 ufw：

```bash
sudo ufw allow 443/tcp
sudo ufw status
```

### 2. 用 Certbot 签发并改 Nginx

```bash
sudo apt install certbot python3-certbot-nginx -y
sudo certbot --nginx -d yourdomain.com
```

按提示选择是否强制 HTTPS（建议 Yes）。它会写入证书路径并改 server 块。

### 3. 确认 80 → 443

若仍可走明文 HTTP，检查是否有：

```nginx
server {
    listen 80;
    server_name yourdomain.com;
    return 301 https://$host$request_uri;
}
```

### 4. 缓存与 HSTS 造成的「幻觉」

以前访问过错误证书时，浏览器可能记住坏状态。用无痕窗口验证；改完后等几分钟再判失败。

## 验证

```bash
curl -I http://yourdomain.com     # 应 301 到 https
curl -I https://yourdomain.com    # 应 200
sudo certbot certificates         # 看到期日
```

## 小结

不安全 ≠ 一定是证书坏了。按 **443 放行 → Certbot → 强制跳转 → 无痕验证** 走一遍，绿锁通常就会出现。证书续期一般由 certbot 定时任务处理，偶尔用 `sudo certbot renew --dry-run` 自检即可。
