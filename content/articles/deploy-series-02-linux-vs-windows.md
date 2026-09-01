---
title: 02｜Linux 对比 Windows：给小白最易懂的服务器入门指南
slug: deploy-series-02-linux-vs-windows
status: published
legacyId: 9
summary: 用最形象的对比来解释Linux命令，让你像使用Windows一样理解服务器操作。
date: 2025-11-25
publishAt: 2025-11-25T16:00:00.000Z
category: 部署系列
cover: /images/blog/deploy-02.png
source: manual
---
# 02｜Linux 对比 Windows：给小白最易懂的服务器入门指南

## 核心理念
因为你熟悉 Windows，所以我用最形象的对比来解释 Linux。

## 操作对照表

| Windows 行为 | Linux 对应命令 | 说明 |
| :--- | :--- | :--- |
| **双击打开文件夹** | `cd folder` | Change Directory，进入目录 |
| **查看文件夹内容** | `ls` | List，列出文件 |
| **返回上一级** | `cd ..` | 和DOS命令一样 |
| **新建文件夹** | `mkdir name` | Make Directory |
| **删除文件** | `rm file` | Remove，**慎用** |
| **打开记事本编辑** | `nano file` | 一个简单的文本编辑器 |
| **安装软件(exe)** | `apt install xxxx` | 就像应用商店自动下载安装 |
| **任务管理器杀进程** | `kill pid` | 结束进程 |
| **重启服务** | `systemctl restart nginx` | 比如重启Web服务 |
| **管理员运行** | `sudo command` | SuperUser Do，提权操作 |

## 总结
理解了这一层映射关系，服务器就不再神秘。它只是换了一种交互方式的电脑而已。
当你不知道该输什么命令时，想一想你在 Windows 上想做什么，然后搜索对应的 Linux 命令即可。
