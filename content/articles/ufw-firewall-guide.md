---
title: 服务器防火墙配置：UFW从入门到精通
slug: ufw-firewall-guide
status: published
legacyId: 30
summary: UFW防火墙的基本概念、常用规则配置（允许SSH/HTTP）、避免锁定SSH连接的技巧，以及状态检查和故障排除。
date: 2025-11-25
publishAt: 2025-11-25T16:00:00.000Z
category: 运维部署
cover: /images/blog/ufw-guide.png
source: manual
---
# 服务器防火墙配置：UFW从入门到精通

## 问题场景
需要配置服务器防火墙但不知从何下手，担心配置错误导致无法连接服务器。

## 核心内容

### 1. UFW防火墙的基本概念
UFW (Uncomplicated Firewall) 是 iptables 的前端工具，旨在简化防火墙配置。它默认是关闭的。

### 2. 常用防火墙规则配置

#### 启用前的准备（关键！）
在启用防火墙之前，**必须先允许SSH连接**，否则你会被锁在门外！
```bash
sudo ufw allow ssh
# 或者指定端口（如果你修改了SSH端口）
sudo ufw allow 2222/tcp
```

#### 启用防火墙
```bash
sudo ufw enable
```

#### 常用规则
- **允许HTTP (80)**: `sudo ufw allow http` 或 `sudo ufw allow 80`
- **允许HTTPS (443)**: `sudo ufw allow https`
- **允许特定IP访问**: `sudo ufw allow from 192.168.1.100`
- **允许特定IP访问特定端口**: `sudo ufw allow from 192.168.1.100 to any port 3306` (如MySQL远程连接)

#### 删除规则
```bash
# 先查看带编号的规则
sudo ufw status numbered
# 删除编号为2的规则
sudo ufw delete 2
```

### 3. 如何避免锁定自己的SSH连接
1. **白名单策略**: 默认拒绝所有传入 (`sudo ufw default deny incoming`)，只开放需要的端口。
2. **双重保险**: 在启用 `enable` 前，反复确认 `ufw show added` 中包含SSH端口。
3. **保持连接**: 配置时不要关闭当前的SSH会话，新开一个终端测试连接是否正常。

### 4. 防火墙状态检查和故障排除
- **查看状态**: `sudo ufw status verbose`
- **查看日志**: `sudo tail -f /var/log/ufw.log` (需先开启日志 `sudo ufw logging on`)
- **重置配置**: 如果搞乱了，可以重置：
  ```bash
  sudo ufw reset
  ```

## 总结
UFW 是Linux服务器安全的第一道防线。配置原则是：**默认拒绝所有，只开放必须端口**。
