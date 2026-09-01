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

## 1. 本地构建
你使用 Nuxt3 开发，运行以下命令生成静态网站：
```bash
npm run generate
```
Nuxt 会在项目根目录下生成一个 `.output/public` 或 `dist` 目录（取决于配置）。这里面就是纯静态的 HTML/CSS/JS 文件。

## 2. 上传文件
你需要把 `dist` 目录的内容放到服务器的 `/var/www/html` 目录。
推荐使用 SCP 命令（在本地终端执行）：
```bash
# 假设你的服务器IP是 1.2.3.4，用户是 root
scp -r dist/* root@1.2.3.4:/var/www/html/
```

## 3. Nginx 配置
编辑 Nginx 配置文件：
```bash
sudo nano /etc/nginx/sites-available/default
```

修改为以下内容（最简配置）：
```nginx
server {
    listen 80;
    server_name yourdomain.com;  # 换成你的域名

    root /var/www/html;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }
}
```

## 4. 生效
```bash
# 检查配置是否有误
sudo nginx -t
# 重启 Nginx
sudo systemctl restart nginx
```

现在，访问你的域名，应该就能看到你的网站了！
