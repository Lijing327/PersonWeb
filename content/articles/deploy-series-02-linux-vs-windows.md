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

因为你熟悉 Windows，所以用对照来理解 Linux：**不是另一星球，是换了一种交互方式的电脑**。

## 操作对照表

| Windows 行为 | Linux 对应命令 | 说明 |
| :--- | :--- | :--- |
| 双击打开文件夹 | `cd folder` | Change Directory |
| 查看文件夹内容 | `ls` / `ls -la` | List，`-la` 含隐藏文件 |
| 返回上一级 | `cd ..` | 与 DOS 类似 |
| 看当前路径 | `pwd` | Print Working Directory |
| 新建文件夹 | `mkdir name` | Make Directory |
| 复制 / 移动 | `cp` / `mv` | copy / move |
| 删除文件 | `rm file` | **慎用**，无回收站 |
| 删除目录 | `rm -rf dir` | 更危险，确认路径 |
| 记事本 | `nano file` | 新手友好编辑器 |
| 安装软件 | `apt install xxx` | 类似应用商店 |
| 任务管理器 | `htop` / `ps` / `kill` | 查杀进程 |
| 重启服务 | `systemctl restart nginx` | 管理后台服务 |
| 管理员运行 | `sudo command` | 提权 |

## 路径直觉

- Windows：`C:\Users\你\`  
- Linux：`/home/你/`，系统相关多在 `/etc`、`/var`  
- 网站文件常见：`/var/www/html` 或自定义目录  

斜杠方向相反；一切皆文件的思路，会让配置「也是文本文件」变得自然。

## 练习十分钟

登录服务器后依次试：

```bash
pwd
ls
mkdir ~/playground && cd ~/playground
echo "hello" > test.txt
nano test.txt
cat test.txt
cd .. && rm -rf playground
```

跑通这一组，恐惧感通常会降一大截。

## 小结

忘了命令就翻译：「我在 Windows 想干什么？」再搜对应 Linux 命令。下一篇讲环境玩乱了怎么清理重来。
