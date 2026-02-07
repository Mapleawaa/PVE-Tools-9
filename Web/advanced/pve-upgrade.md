# PVE 8 跨版本升级 PVE 9 全攻略

Proxmox VE 9.0 也就是基于 Debian 13 Trixie 构建的版本，带来了许多性能提升以及新特性。但是“跨大版本升级”始终属于系统级的操作：只有**能做到可控、可回退、可验证**，才算得上真正稳妥。

本教程会结合脚本实现以及手动操作，带你去补齐升级前的自检、常见翻车点以及回滚策略，来实现一次“毫无翻车可能”的升级工作。

---

## 一、PVE 9.0 改进了什么？

PVE 9 不仅仅是版本号的提升，它基于 **Debian 13 (Trixie)** 来构建，核心组件得以全面升级（版本号随官方发布可能会微调）：
- **存储系统**：ZFS 2.3.3
- **虚拟化引擎**：QEMU 10.0.2
- **容器管理**：LXC 6.0.4
- **分布式存储**：Ceph Squid 19.2.3

### 亮点特性
- **快照功能升级**：新增了对厚置备 LVM 共享存储（含 iSCSI / 光纤通道 SAN）的虚拟机快照支持。
- **SDN 网络架构**：引入 SDN Fabrics 来简化弹性拓扑的构建，支持 OSPF 动态路由。
- **高可用集群增强**：新增了 HA 资源亲和性规则，支持精细控制工作负载的分布。
- **移动端管理革新**：基于 Rust 框架来重构移动界面，管理更丝滑。

---

## 二、升级前准备（强烈建议）

> [!TIP]
> **维护者建议**：升级前先把“不可控变量”降至最低：控制台入口、备份、以及把检查项逐条去跑完。
> **务必把备份工作做好！** 即便脚本会自动去备份配置，手动留一份“救命钱”也是基本素养。

### 1. 升级前自检（必跑）
在开始任何操作之前，请去运行以下的命令来确保环境健康：
```bash
# 当前版本与包信息
pveversion -v

# 官方升级检查器（建议 full 至少跑一次，去关注是否有 FAIL）
pve8to9 --full

# 检查是否有 hold 包（被锁定的包会影响升级）
apt-mark showhold

# 磁盘空间（/boot 与根分区不足是常见翻车点）
df -h
```

### 2. 核心数据备份
PVE 的存储信息、虚拟机信息、集群设置等都存储在 `/var/lib/pve-cluster/` 当中。
```bash
# 去备份核心数据库
cp -r /var/lib/pve-cluster /path/to/your/backup/

# 备份整个 /etc 目录（系统配置）
tar -czvf pve8_etc_backup_$(date +%Y%m%d).tar.gz /etc
```

### 3. 停机策略
- **单节点**：确保拥有本地显示器或者 iDRAC/IPMI 的访问权限，来防止网络中断导致失联。
- **集群/HA**：必须按节点去逐个升级，提前进行迁移或者停止工作负载。

---

## 三、升级路线选择

### 在线升级也就是 in-place
适宜：单节点、历史改动少、第三方 DKMS/驱动不多的环境。
风险点：第三方驱动、历史遗留源、bootloader 相关包可能会导致升级中断。

### 重装还原，这更可控
适宜：历史漂移大、改动多、又或者你希望把系统回到“干净可维护”的状态。
**核心思想**：重装 PVE 9 → 进行配置/存储/备份的恢复 → 把业务迁回。
> 当在线升级链路出现不可控变量的时候，**重装 + 还原配置**往往是维护成本最低、结果最可控的方式。

---

## 四、在线升级流程（脚本实现）

PVE-Tools 脚本已把复杂的升级过程自动化了。以下是脚本背后的执行逻辑，供你了解每一步发生了什么：

### 1. 环境检查与微码安装
脚本会先把你的系统升级到 PVE 8.4.8+，然后去运行官方的 `pve8to9` 工具。
- **WARN**：只要没有红色 **FAIL**，通常可以忽略并继续。
- **微码安装**：脚本会自动去检测 CPU 类型并且安装 `intel-microcode` 或者 `amd64-microcode`。

### 2. 引导配置优化 (UEFI)
针对 UEFI 启动的用户，脚本会自动去执行以下的命令来防止引导丢失，以此解决 systemd-boot 相关问题：
```bash
echo 'grub-efi-amd64 grub2/force_efi_extra_removable boolean true' | debconf-set-selections -v -u
```

### 3. 更换 Trixie 软件源
脚本会自动把 `/etc/apt/sources.list` 当中的 `bookworm` 替换为 `trixie`，并且生成契合 PVE 9 标准的 DEB822 格式源文件：
- `/etc/apt/sources.list.d/proxmox.sources`
- `/etc/apt/sources.list.d/ceph.sources`

### 4. 执行升级
脚本运用 `DEBIAN_FRONTEND=noninteractive` 模式来运行 `apt dist-upgrade`。
- **文本提示**：要是遇到一大串文本提示，通常按 `q` 退出即可。
- **配置文件询问**：脚本默认保留旧配置也就是 `force-confold`，来确保系统服务不中断。

---

## 五、常见翻车点与排障

| 提示或者现象 | 含义 | 建议处理 |
| :--- | :--- | :--- |
| `pve8to9` 提示 `systemd-boot meta-package installed...` | 部分安装路径会带上 systemd-boot 元包，升级过程中可能会影响 boot 相关包更新 | 要是你并不把 systemd-boot 当作 bootloader 来使用，按提示移除即可，并确认你的启动方式。 |
| `intel-microcode` / `amd64-microcode` 找不到 | APT 源缺少了 `non-free-firmware` 组件 | 按照检查器提示补齐源组件之后，去安装 microcode。 |
| DKMS 模块报错导致内核包 postinst 失败 | 常见于额外安装了显卡或者网卡驱动等 DKMS | 临时卸载或者禁用相关的 DKMS 驱动，先让升级得以完成，再按照新内核进行重装。 |

### 1. 升级后网卡不通？
Debian 13 可能会改变网卡命名。要是重启后连不上网，请接显示器或者借助控制台去修改 `/etc/network/interfaces`。

### 2. 清理旧内核
升级完成之后，可以运用脚本当中的“内核管理”功能去清理掉不再需要的 PVE 8 系列内核，比如 6.8 系列，来释放 `/boot` 分区空间。

---

## 六、重装还原法（100% 成功）

要是你的在线升级不幸翻车，又或者你追求绝对的“洁癖”，可以运用这个方法：

1. **备份**：按照上述方法去备份 `config.db`。
2. **重装**：直接去安装最新的 PVE 9.0 ISO。
3. **还原**：确保重装后的 **主机名** 与原系统保持一致。
```bash
# 把备份的文件拷贝回去
cp config.db /var/lib/pve-cluster/
cp config.db-shm /var/lib/pve-cluster/
cp config.db-wal /var/lib/pve-cluster/
# 重启 PVE
reboot
```
你会发现所有的虚拟机以及配置都会神奇地回来。

---

## 七、升级后检查清单

完成升级或者还原之后，建议逐条去运行以下的命令来确认系统状态：

```bash
# 版本确认
pveversion -v

# 网络是否正常（尤其是接口命名/桥接）
ip a
cat /etc/network/interfaces

# 存储是否正常
pvesm status
cat /etc/pve/storage.cfg

# 内核与引导状态
uname -r
```

> [!TIP]
> 升级完成之后，别忘了去运行脚本当中的“一键优化”功能，来重新适配 PVE 9 的温度显示以及界面微调。

---

## 参考资料

鉴于 Proxmox 官方 Upgrade Wiki 对部分地区或者环境可能存在访问限制，这里提供了社区实践当中对 `pve8to9` 以及常见错误，比如 systemd-boot、microcode、DKMS 的详细记录，便于进行交叉验证。

- 示例：集群升级记录（包含 `pve8to9 --full`、systemd-boot 提示与处理）
  [https://blog.vezpi.com/en/post/proxmox-cluster-upgrade-8-to-9-ceph/](https://blog.vezpi.com/en/post/proxmox-cluster-upgrade-8-to-9-ceph/)
- 示例：多节点升级记录（包含 `pve8to9 --full`、源切换与排障）
  [https://fredrickb.com/2025/11/11/upgrade-proxmox-from-8-to-9/](https://fredrickb.com/2025/11/11/upgrade-proxmox-from-8-to-9/)