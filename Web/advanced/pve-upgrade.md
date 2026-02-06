# PVE 8 跨版本升级 PVE 9 全攻略

Proxmox VE 9.0 (基于 Debian 13 Trixie) 带来了许多性能改进和新特性。本教程将结合脚本实现与手动操作，带你“毫无翻车可能”地完成升级。

## 一、PVE 9.0 改进了什么？

PVE 9.0 不仅仅是版本号的提升，它基于 **Debian 13 (Trixie)**，核心组件全面升级：
- **存储系统**：ZFS 2.3.3
- **虚拟化引擎**：QEMU 10.0.2
- **容器管理**：LXC 6.0.4
- **分布式存储**：Ceph Squid 19.2.3

### 亮点特性
- **快照功能升级**：新增对厚置备 LVM 共享存储（含 iSCSI / 光纤通道 SAN）的虚拟机快照支持。
- **SDN 网络架构**：引入 SDN Fabrics 简化弹性拓扑构建，支持 OSPF 动态路由。
- **高可用集群增强**：新增 HA 资源亲和性规则，支持精细控制工作负载分布。
- **移动端管理革新**：基于 Rust 框架重构移动界面，管理更丝滑。

---

## 二、升级前准备（必看！）

> [!IMPORTANT]
> **务必做好备份！** 即使脚本会自动备份配置，手动留一份“救命钱”也是基本素养。

### 1. 核心数据备份
PVE 的存储信息、虚拟机信息、集群设置等都存储在 `/var/lib/pve-cluster/` 下。
```bash
# 备份核心数据库（config.db）
cp -r /var/lib/pve-cluster /path/to/your/backup/
```

### 2. 系统配置备份
```bash
# 备份整个 /etc 目录
tar -czvf pve8_etc_backup_$(date +%Y%m%d).tar.gz /etc
```

---

## 三、在线升级流程（脚本实现）

PVE-Tools 脚本已将复杂的升级过程自动化。

### 1. 运行升级环境检查
脚本会先将你的系统升级到 PVE 8.4.8+，然后运行官方的 `pve8to9` 工具。
- **WARN**：只要没有红色 **FAIL**，通常可以忽略继续。
- **微码安装**：脚本会自动检测 CPU 类型并安装 `intel-microcode` 或 `amd64-microcode`。

### 2. 引导配置优化
针对 UEFI 启动的用户，脚本会自动执行以下命令防止引导丢失：
```bash
echo 'grub-efi-amd64 grub2/force_efi_extra_removable boolean true' | debconf-set-selections -v -u
```

### 3. 更换 Trixie 软件源
脚本会自动将 `/etc/apt/sources.list` 中的 `bookworm` 替换为 `trixie`，并生成符合 PVE 9 标准的 DEB822 格式源文件：
- `/etc/apt/sources.list.d/proxmox.sources`
- `/etc/apt/sources.list.d/ceph.sources`

### 4. 执行升级
脚本使用 `DEBIAN_FRONTEND=noninteractive` 模式运行 `apt dist-upgrade`。
- **提示**：如果遇到一大串文本提示，通常按 `q` 退出即可。
- **配置文件询问**：脚本默认保留旧配置 (`force-confold`) 以确保系统服务不中断。

---

## 四、重装还原法（100% 成功）

如果你的在线升级不幸翻车，或者你追求绝对的“洁癖”，可以使用此方法：

1. **备份**：按上述方法备份 `config.db`。
2. **重装**：直接安装最新的 PVE 9.0 ISO。
3. **还原**：确保重装后的 **主机名** 与原系统一致。
```bash
# 拷贝备份的文件回去
cp config.db /var/lib/pve-cluster/
cp config.db-shm /var/lib/pve-cluster/
cp config.db-wal /var/lib/pve-cluster/
# 重启 PVE
reboot
```
你会发现所有的虚拟机和配置都神奇地回来了。

---

## 五、排障与后期清理

### 1. 升级后网卡不通？
Debian 13 可能会改变网卡命名。如果重启后连不上网，请接显示器修改 `/etc/network/interfaces`。

### 2. 清理旧内核
升级完成后，可以使用脚本中的“内核管理”功能清理掉不再需要的 PVE 8 系列内核（如 6.8 系列），释放 `/boot` 分区空间。

> [!TIP]
> 升级完成后，别忘了运行脚本的“一键优化”功能，重新适配 PVE 9 的温度显示和界面微调。
