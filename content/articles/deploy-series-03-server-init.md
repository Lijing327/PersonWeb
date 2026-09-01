---
title: 03｜如何重新初始化服务器环境：从头清理，重新搭建
slug: deploy-series-03-server-init
status: published
legacyId: 10
summary: 玩坏了服务器怎么办？教你如何彻底清理环境，重新安装Nginx和Certbot，恢复成全新状态。
date: 2025-11-25
publishAt: 2025-11-25T16:00:00.000Z
category: 部署系列
cover: /images/blog/deploy-03.png
source: manual
---
# 03｜如何重新初始化服务器环境：从头清理，重新搭建

## 问题场景
你在服务器上乱装了一堆东西，现在配置乱了，想重头再来，但又不想重装系统（或者没有权限重装系统）。

## 清理旧环境

### 1. 删除旧文件
如果你之前的网站放在 `/var/www/html`：
```bash
sudo rm -rf /var/www/html/*
```
*注意：`rm -rf` 是毁灭性命令，请务必确认路径正确！*

### 2. 卸载并清理 Nginx
```bash
# 停止服务
sudo systemctl stop nginx
# 卸载软件
sudo apt remove --purge nginx nginx-common
# 清理残留依赖
sudo apt autoremove
```

## 重新搭建

### 1. 更新软件源
```bash
sudo apt update
```

### 2. 安装 Nginx
```bash
sudo apt install nginx -y
# 启动并设置开机自启
sudo systemctl start nginx
sudo systemctl enable nginx
```

### 3. 安装 Certbot (用于HTTPS)
```bash
sudo apt install certbot python3-certbot-nginx -y
```

## 验证
访问你的服务器IP，如果看到 "Welcome to nginx!" 的页面，说明环境已经初始化成功，像新的一样。
