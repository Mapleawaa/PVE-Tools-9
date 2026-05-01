---
title: 宿主机网络、防火墙与 IPv6
description: 了解 PVE Tools Pro 的 Proxmox VE 宿主机 bridge、Bond、VLAN、IPv4、IPv6、防火墙和网络诊断配置流程。
---

# 宿主机网络 / 防火墙 / IPv6

这篇文档对应脚本中的“宿主机网络配置向导”，面向 PVE 9 宿主机的 bridge / Bond / VLAN / 防火墙 / IPv6 / 诊断场景。

> [!WARNING]
> 本页功能直接作用于宿主机管理面。错误的网络、路由或防火墙修改可能导致 SSH、WebUI、集群通信和 VM 网络同时中断。
> 强烈建议在控制台、IPMI、iKVM 或其他带外管理环境下执行。

## 1. 宿主机网络配置向导包含什么

- 列出当前网卡、地址、路由、bridge、Bond、VLAN 子接口。
- 交互式创建 / 删除 bridge。
- 为接口配置静态 IPv4 / IPv6、DHCPv4、DHCPv6、SLAAC。
- 创建 / 删除 VLAN 子接口。
- 创建 / 删除 Bond（模式 0 / 1 / 4 / 6）。
- 管理 PVE 防火墙开关、安全组与规则集导入导出。
- 提供 IPv6 透传 / NAT6 助手与网络诊断工具箱。

## 2. 网络配置写入策略

脚本不会盲写宿主机网络，而是遵循：

1. 读取当前 `/etc/network/interfaces`。
2. 生成候选配置并写入 `/etc/network/interfaces.new`。
3. 展示差异摘要并要求高风险确认。
4. 再根据环境尝试 `pvenetcommit` 或 `ifreload -a`。

这和 PVE 官方网络修改流程保持一致，方便你先审阅 staged 文件，再决定是否立即应用。

## 3. Bridge / VLAN / Bond 推荐顺序

### 单网卡宿主机常见路径

```text
物理口 eno1
  -> 创建 vmbr0
  -> bridge-ports eno1
  -> 在 vmbr0 上配置管理口 IPv4 / IPv6
```

### Trunk + VLAN 子接口

```text
eno1
  -> eno1.20
  -> vmbr20 (bridge-ports eno1.20)
```

### 双口聚合 + Bridge

```text
eno1 + eno2
  -> bond0 (mode 1 或 4)
  -> vmbr0 (bridge-ports bond0)
```

## 4. 防火墙与安全组

脚本支持：

- 数据中心 / 节点 / VM / CT 级别的防火墙开关。
- 安全组规则查看、追加、删除。
- 规则集导出为 JSON 或原生 CLI / raw 文本。
- 从 JSON 或 raw 文本导入回目标规则集。

> [!TIP]
> VM / CT 级别的防火墙总开关只是其中一层。PVE 仍可能要求对应网卡启用 `firewall=1` 才会真正过滤该网卡流量。

## 5. IPv6 助手

IPv6 助手提供三类能力：

- 检测宿主机是否拿到全局 IPv6、默认路由以及基础连通性。
- 通过 Guest Agent 尝试读取 VM 的 IPv6 地址，粗略判断 VM 是否就绪。
- 为指定 bridge 写入 IPv6 透传（SLAAC）或 NAT6 所需配置。

### 什么时候选透传

- 上游二层网络本来就能把 IPv6 RA 送到 bridge。
- 你希望 VM 自己拿公网 / 全局 IPv6。

### 什么时候选 NAT6

- 你只想先让 VM 有 IPv6 出口。
- 你能接受宿主机执行 `ip6tables` NAT 与转发。

## 6. 网络诊断工具箱

脚本内置：

- `traceroute`
- `mtr`
- `nmap`
- `tcpdump`
- 端口连通性检查（宿主机 / VM / 自定义目标）

适合排查：

- 宿主机默认路由错误
- VM 端口没监听或被防火墙阻断
- IPv6 只有地址但没有默认路由
- Bond / VLAN / Bridge 改完后业务链路异常

## 7. 最重要的回滚原则

- 宿主机网络改动一律先看 staged 配置。
- 有带外管理再点应用，没有就不要在远程 SSH 会话里硬上。
- 一旦改完失联，优先通过控制台恢复 `/etc/network/interfaces` 最近备份。
- 防火墙导入前先导出当前规则集，别让“回滚”只停留在脑子里。
