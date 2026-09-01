---
title: 文件传输实战：SCP命令使用指南
slug: scp-file-transfer
status: published
legacyId: 26
summary: 掌握SCP命令的基本语法，实现本地与服务器之间的高效文件传输，常见错误处理，以及rsync、SFTP等替代方案介绍。
date: 2025-11-25
publishAt: 2025-11-25T16:00:00.000Z
category: 运维部署
cover: /images/blog/scp-guide.png
source: manual
---
# 文件传输实战：SCP命令使用指南

## 问题场景
需要将本地代码、配置文件上传到服务器，或者将服务器日志下载到本地。

## 核心内容

### 1. SCP命令的基本语法
SCP (Secure Copy) 基于SSH协议，安全且方便。
语法结构：`scp [参数] 源文件 目标路径`

### 2. 实战操作

#### 上传文件 (本地 -> 服务器)
```bash
# 将本地 file.txt 上传到服务器的 /home/user 目录
scp file.txt user@192.168.1.100:/home/user/

# 上传目录 (需要 -r 参数)
scp -r ./my-project user@192.168.1.100:/var/www/html/
```

#### 下载文件 (服务器 -> 本地)
```bash
# 将服务器的 log.txt 下载到本地当前目录
scp user@192.168.1.100:/var/log/app/log.txt ./
```

#### 指定端口
如果SSH端口不是22，需要用 `-P` (大写) 参数：
```bash
scp -P 2222 file.txt user@host:/path/
```

### 3. 处理传输过程中的常见错误
- **Permission denied**: 目标目录没有写入权限。
  - *解决*: 先传到用户家目录 (`~`), 再在服务器上用 `sudo mv` 移动。
- **Connection timed out**: 网络不通或防火墙拦截。
- **No such file or directory**: 路径写错了，注意Linux区分大小写。

### 4. 替代方案

#### rsync (推荐)
如果你传输大文件或大量小文件，`rsync` 更好，因为它支持**增量传输**（只传修改过的部分）和**断点续传**。
```bash
rsync -avz -e "ssh -p 22" ./local-dir/ user@host:/remote-dir/
```

#### SFTP 工具
如果不喜欢命令行，可以使用图形化工具：
- **FileZilla**: 经典FTP/SFTP客户端。
- **WinSCP**: Windows下最好用的SFTP工具。
- **VS Code**: 使用 "Remote - SSH" 插件，直接拖拽文件。

## 总结
SCP 是最简单的单次文件传输工具，系统自带，随手可用。对于复杂的同步需求，建议学习 rsync。
