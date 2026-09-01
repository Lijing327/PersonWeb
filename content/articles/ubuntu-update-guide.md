---
title: Ubuntu系统更新完全指南：从apt update到服务重启
slug: ubuntu-update-guide
status: published
legacyId: 29
summary: 详解apt update与upgrade的区别，解决Could not get lock、kept back等常见更新问题，以及服务重启策略。
date: 2025-11-25
publishAt: 2025-11-25T16:00:00.000Z
category: 运维部署
cover: /images/blog/ubuntu-update.png
source: manual
---
# Ubuntu系统更新完全指南：从apt update到服务重启

## 问题场景
系统更新过程中遇到的各种问题，如进程锁死、软件包保留等。

## 核心内容

### 1. apt update vs apt upgrade 的区别
这是新手最容易混淆的概念：
- `sudo apt update`: **不更新软件**。它只是去软件源（服务器）下载最新的软件包列表（索引），告诉系统哪些软件有新版本。
- `sudo apt upgrade`: **真正更新软件**。它根据`update`下载的列表，下载并安装新版本的软件包。

**正确姿势**:
```bash
sudo apt update && sudo apt upgrade -y
```

### 2. 解决 "Could not get lock" 进程占用问题
当你看到 `E: Could not get lock /var/lib/dpkg/lock-frontend` 错误时，说明有另一个进程（如自动更新后台）正在使用apt。

**解决方法**:
1. **等待**: 通常几分钟后会自动完成。
2. **强制终止** (慎用):
   ```bash
   # 查找占用进程
   ps aux | grep -i apt
   # 杀掉进程
   sudo kill -9 <PID>
   # 删除锁文件
   sudo rm /var/lib/dpkg/lock-frontend
   sudo rm /var/lib/dpkg/lock
   # 修复配置
   sudo dpkg --configure -a
   ```

### 3. 处理 "kept back" 被保留的软件包
有时运行upgrade会提示 `The following packages have been kept back`。这通常是因为新版本依赖发生了变化（需要删除旧包或安装新依赖），`upgrade`命令比较保守，不敢乱动。

**解决方法**:
使用 `dist-upgrade` 或 `full-upgrade`：
```bash
sudo apt dist-upgrade
```
或者单独安装该包：
```bash
sudo apt install <package-name>
```

### 4. 系统更新后的服务重启选择策略
更新内核或核心库（如glibc, openssl）后，需要重启服务或系统才能生效。
- **更新内核**: 必须重启系统 (`reboot`)。
- **更新Nginx/MySQL**: 仅需重启服务 (`sudo systemctl restart nginx`)。
- **检查需要重启的服务**:
  安装 `needrestart` 工具：
  ```bash
  sudo apt install needrestart
  sudo needrestart
  ```

### 5. 如何安全地终止卡住的更新进程
如果更新过程卡在 `Setting up ...` 不动了：
1. 不要直接关机！这会导致文件系统损坏。
2. 尝试 `Ctrl + C` 中断。
3. 如果不行，打开新终端，查看进程树，小心杀掉卡住的子进程。
4. 中断后，务必运行 `sudo dpkg --configure -a` 修复未完成的安装。

## 总结
定期更新系统是保持安全的重要习惯。掌握这些故障排除技巧，能让你在面对更新报错时从容不迫。
