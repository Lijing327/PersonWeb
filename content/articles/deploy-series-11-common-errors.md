---
title: 11｜常见部署错误汇总：libcrypto 错误、权限错误、重定向失败等
slug: deploy-series-11-common-errors
status: published
legacyId: 18
summary: 汇总部署过程中最容易遇到的报错，包括SSH密钥格式错误、Permission denied、Nginx 403/404等，附解决方案。
date: 2025-11-25
publishAt: 2025-11-25T16:00:00.000Z
category: 部署系列
cover: /images/blog/deploy-11.png
source: manual
---
# 11｜常见部署错误汇总：libcrypto 错误、权限错误、重定向失败等

## 1. SSH 连接错误
**报错**: `Load key ... error in libcrypto`
**原因**: 私钥格式太旧或不兼容（通常是 OpenSSH 格式问题）。
**解决**: 重新生成 **ed25519** 格式的密钥（目前最推荐）：
```bash
ssh-keygen -t ed25519 -C "your_email@example.com"
```

**报错**: `Permission denied (publickey)`
**原因**:
1. 公钥没加到 `authorized_keys`。
2. `authorized_keys` 文件权限不对（必须是 600）。
3. 私钥复制粘贴时多了空格或换行。

## 2. Nginx 错误
**报错**: `403 Forbidden`
**原因**: Nginx 运行用户（通常是 `www-data`）没有权限读取你的网站目录。
**解决**:
```bash
# 简单粗暴（开发环境）
chmod -R 755 /var/www/html
```

**报错**: `404 Not Found` (刷新页面时)
**原因**: 单页应用 (SPA) 没配置路由回退。
**解决**: 确保配置了 `try_files $uri $uri/ /index.html;`。

## 3. GitHub Actions 错误
**报错**: `rsync: connection unexpectedly closed`
**原因**: 这里的 `REMOTE_HOST` 填错了，或者 `SSH_PRIVATE_KEY` 没配对。
**检查**: 确保 Secrets 里的私钥是完整的（包含 `-----BEGIN...` 和 `-----END...`）。

## 结语
报错不可怕，可怕的是不看日志。学会看 Nginx 日志 (`/var/log/nginx/error.log`) 和 GitHub Actions 的运行日志，你就能解决 99% 的问题。
