---
title: 10｜SSH key 管理：多电脑、多平台、CI 如何共存？
slug: deploy-series-10-ssh-keys
status: published
legacyId: 17
summary: 公司电脑、家里电脑、GitHub Actions...每台设备都要一把钥匙吗？详解SSH Key的管理之道。
date: 2025-11-25
publishAt: 2025-11-25T16:00:00.000Z
category: 部署系列
cover: /images/blog/deploy-10.png
source: manual
---
# 10｜SSH key 管理：多电脑、多平台、CI 如何共存？

## 核心疑问
“我家里有一台电脑，公司有一台，现在又搞了个 GitHub Actions，它们怎么同时连我的服务器？需要把私钥拷来拷去吗？”

## 答案：千万别拷私钥！
**原则：私钥永远不离开生成的设备。**

## 正确做法：多把钥匙开一把锁
服务器的 `~/.ssh/authorized_keys` 文件就像一个**钥匙扣**，它可以挂很多把公钥。

1.  **家里电脑**: 生成一对 Key A。把公钥 A 追加到服务器的 `authorized_keys`。
2.  **公司电脑**: 生成一对 Key B。把公钥 B 追加到服务器的 `authorized_keys`。
3.  **GitHub Actions**: 生成一对 Key C。把公钥 C 追加到服务器的 `authorized_keys`，私钥 C 填入 GitHub Secrets。

## 操作指南
在服务器上：
```bash
# 查看现有公钥
cat ~/.ssh/authorized_keys

# 追加新公钥（直接用编辑器打开粘贴新的一行）
nano ~/.ssh/authorized_keys
```
每一行代表一个允许登录的设备。哪台设备丢了，就去服务器删掉对应的那一行，其他设备不受影响。
