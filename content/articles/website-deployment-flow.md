---
title: 网站部署全流程：从代码到线上访问
slug: website-deployment-flow
status: published
legacyId: 31
summary: 梳理完整的网站部署流程：前端构建、服务器环境准备、文件上传、Nginx配置、域名解析及SSL证书申请。
date: 2025-11-25
publishAt: 2025-11-25T16:00:00.000Z
category: 运维部署
cover: /images/blog/deploy-flow.png
source: manual
---
# 网站部署全流程：从代码到线上访问

## 问题场景
代码写好了，在本地跑得飞起，但怎么让全世界的人都能通过网址访问它？

## 核心内容

### 1. 前端项目构建和优化
在上传之前，必须进行生产环境构建。
```bash
# Vue/React/Nuxt
npm run build
# 或
npm run generate
```
构建完成后，会生成 `dist` 或 `.output` 目录。这就是我们要上传的"实体"。

### 2. 服务器环境准备
购买一台云服务器（如阿里云ECS），安装基础软件：
```bash
# 更新系统
sudo apt update && sudo apt upgrade -y
# 安装 Nginx
sudo apt install nginx -y
# 启动 Nginx
sudo systemctl start nginx
sudo systemctl enable nginx
```

### 3. 文件上传和权限设置
使用 SCP 或 SFTP 将构建好的目录上传到服务器。
```bash
# 推荐放在 /var/www/ 下
sudo mkdir -p /var/www/my-website
# 修改权限，确保当前用户有权写入
sudo chown -R $USER:$USER /var/www/my-website
# 上传文件
scp -r ./dist/* user@server_ip:/var/www/my-website/
```

### 4. 域名解析和SSL证书配置

#### 域名解析
去域名注册商（阿里云/腾讯云/GoDaddy），添加一条 **A记录**，将 `@` 和 `www` 解析到你的服务器公网IP。

#### SSL证书 (HTTPS)
推荐使用 **Certbot** 免费申请 Let's Encrypt 证书。
```bash
# 安装 Certbot
sudo apt install certbot python3-certbot-nginx
# 自动配置 HTTPS
sudo certbot --nginx -d example.com -d www.example.com
```
Certbot 会自动修改 Nginx 配置，开启 HTTPS 并配置自动续期。

### 5. 网站访问测试和故障排除
- **访问测试**: 浏览器输入 `https://example.com`。
- **502 Bad Gateway**: 后端服务没启动（如果是Node/Java/Python应用）。
- **403 Forbidden**: 文件权限不对，Nginx 无法读取目录。
- **404 Not Found**: Nginx 配置路径错误，或 SPA 路由没配置 `try_files`。

## 总结
部署是开发的最后一公里。从本地构建到线上访问，涉及网络、系统、Web服务器等多个环节。掌握这个流程，你才算是一个完整的全栈开发者。
