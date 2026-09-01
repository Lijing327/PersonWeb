---
title: 09｜GitHub Actions 自动化部署：从零搭建 CI/CD（最完整教程）
slug: deploy-series-09-github-actions
status: published
legacyId: 16
summary: 彻底告别手动上传！教你配置GitHub Actions，实现 git push 后自动构建并部署到服务器。
date: 2025-11-25
publishAt: 2025-11-25T16:00:00.000Z
category: 部署系列
cover: /images/blog/deploy-09.png
source: manual
---
# 09｜GitHub Actions 自动化部署：从零搭建 CI/CD（最完整教程）

## 终极目标
**git push → 自动构建 → 自动上传服务器**
从此以后，你只需要写代码，推送到 GitHub，剩下的事情全自动完成。

## 准备工作
1.  **服务器**: 已经配置好 Nginx。
2.  **GitHub 仓库**: 代码已托管。
3.  **SSH 密钥对**: 生成一对专门给 GitHub 用的密钥。

## 核心配置 Workflow
在项目根目录创建 `.github/workflows/deploy.yml`：

```yaml
name: Deploy to Aliyun

on:
  push:
    branches:
      - main  # 监听 main 分支的 push 事件

jobs:
  build-and-deploy:
    runs-on: ubuntu-latest

    steps:
    # 1. 拉取代码
    - name: Checkout
      uses: actions/checkout@v3

    # 2. 安装 Node.js
    - name: Setup Node
      uses: actions/setup-node@v3
      with:
        node-version: '18'

    # 3. 安装依赖并构建
    - name: Install and Build
      run: |
        npm install
        npm run generate

    # 4. 部署到服务器
    - name: Deploy to Server
      uses: easingthemes/ssh-deploy@v5.0.3
      env:
        SSH_PRIVATE_KEY: ${{ secrets.SSH_PRIVATE_KEY }}
        REMOTE_HOST: ${{ secrets.REMOTE_HOST }}
        REMOTE_USER: ${{ secrets.REMOTE_USER }}
        SOURCE: "dist/"
        TARGET: "/var/www/html/"
        ARGS: "-avz --delete"
```

## 设置 Secrets
去 GitHub 仓库 -> Settings -> Secrets and variables -> Actions -> New repository secret：
- `SSH_PRIVATE_KEY`: 你的私钥内容
- `REMOTE_HOST`: 服务器IP
- `REMOTE_USER`: root

## 见证奇迹
提交代码，去 GitHub 的 Actions 页面，看着它变绿，然后访问你的网站，内容已经更新了！
