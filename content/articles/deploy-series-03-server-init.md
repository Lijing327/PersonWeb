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

服务器上乱装了一堆包，Nginx 配置改炸了，想重来，但不想（或不能）重装整台系统。

可以：**卸服务 → 清站点文件 → 再装一套干净的 Nginx / Certbot**。

## 清理旧环境

### 1. 备份（强烈建议）

```bash
sudo tar -czf ~/nginx-backup-$(date +%F).tgz /etc/nginx /var/www/html 2>/dev/null || true
```

### 2. 删除旧站点文件

若网站在 `/var/www/html`：

```bash
sudo rm -rf /var/www/html/*
```

`rm -rf` 无后悔药，路径一定看三遍。

### 3. 卸载 Nginx

```bash
sudo systemctl stop nginx
sudo apt remove --purge nginx nginx-common -y
sudo apt autoremove -y
# 若仍残留配置
sudo rm -rf /etc/nginx
```

## 重新搭建

```bash
sudo apt update
sudo apt install nginx -y
sudo systemctl enable --now nginx

sudo apt install certbot python3-certbot-nginx -y
```

浏览器访问服务器公网 IP，看到 Welcome to nginx，说明 Web 服务已回到干净起点。

## 可选：一并清理 Certbot 证书

仅当你确定要重签、且明白后果时：

```bash
sudo certbot delete
```

域名与解析还在的话，后面按系列 HTTPS 篇重新签发即可。

## 验证清单

- [ ] `systemctl status nginx` 为 active  
- [ ] `curl -I http://127.0.0.1` 返回 200  
- [ ] 安全组 80/443 仍放行  

## 小结

玩坏了不必恐慌重装系统。清 Nginx 与站点目录，再装一遍，就能回到「刚买服务器搭好 Web」的状态。下一篇进入 Nuxt 静态文件真实部署。
