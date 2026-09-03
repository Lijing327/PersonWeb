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

「家里一台电脑，公司一台，还有 GitHub Actions，怎么同时连服务器？要把私钥拷来拷去吗？」

## 答案：千万别拷私钥

**原则：私钥永远不离开生成它的那台设备（或那个 CI 密钥库）。**

拷贝私钥 = 把家门钥匙配得到处都是，丢一台设备等于全线失守，还难以追溯。

## 正确做法：多把钥匙开一把锁

服务器上的 `~/.ssh/authorized_keys` 像钥匙扣，可以挂很多把**公钥**：

1. **家里电脑**：生成 Key A，公钥 A 追加进服务器  
2. **公司电脑**：生成 Key B，公钥 B 追加进服务器  
3. **GitHub Actions**：生成 Key C，公钥 C 上服务器，**私钥 C 只放进 GitHub Secrets**  

哪台设备退役或泄露，只删 `authorized_keys` 里对应那一行即可。

## 本机生成（示例）

```bash
ssh-keygen -t ed25519 -C "home-laptop" -f ~/.ssh/id_ed25519_home
cat ~/.ssh/id_ed25519_home.pub
```

把打印出的公钥整行追加到服务器：

```bash
# 在服务器上
mkdir -p ~/.ssh && chmod 700 ~/.ssh
nano ~/.ssh/authorized_keys   # 粘贴新的一行
chmod 600 ~/.ssh/authorized_keys
```

## 权限与排错

| 现象 | 常查 |
| --- | --- |
| Permission denied | 公钥是否真的在 authorized_keys、用户是否对 |
| 仍要密码 | 服务器 sshd 是否允许公钥、本机是否指定了正确私钥 |
| CI 连不上 | Secrets 是否含完整私钥、换行是否被吃掉 |

调试可加：

```bash
ssh -v root@你的IP
```

## 和密码登录

初期可用密码；钥匙配齐后，建议关掉密码登录（防爆破），只保留密钥。改 `sshd_config` 前务必保留一个已验证能登录的会话，避免把自己锁外面。

## 小结

多设备 = 多公钥，不是共享一把私钥。CI 也是「另一台电脑」：公钥上服务器，私钥进 Secrets。
