# PVE Tools Pro(原 PVE-Tools-9)

<div align="center">

面向 Proxmox VE 9.x 的一键运维脚本，覆盖 VM 生命周期运维、宿主机网络 / 防火墙 / IPv6、GPU / PCI 直通、系统维护与第三方生态集成。

[官网 / Docs](https://pve.oowo.cc) | [更新日志](https://pve.oowo.cc/update) | [FAQ](https://pve.oowo.cc/faq) | [English](./README_EN.md) | [日本語](./REAMDE-JP.md)

[![License: GPL-3.0](https://img.shields.io/badge/License-GPL--3.0-blue.svg)](https://www.gnu.org/licenses/gpl-3.0.html)
[![Shell Script](https://img.shields.io/badge/Shell-Script-4EAA25?logo=gnu-bash&logoColor=white)](https://www.gnu.org/software/bash/)
[![Proxmox VE](https://img.shields.io/badge/Proxmox-VE%209.x-E57000?logo=proxmox&logoColor=white)](https://www.proxmox.com/)
[![Debian](https://img.shields.io/badge/Debian-13%20(Trixie)-A81D33?logo=debian&logoColor=white)](https://www.debian.org/)

![产品截图](./images/main.png)

</div>

>[!warning]
> CVE-2026-31431 处置功能已经加入正式发布版本，推荐大家升级并处置漏洞
> 漏洞来源：[CVE-2026-31431](https://nvd.nist.gov/vuln/detail/CVE-2026-31431)

## 快速开始

### 使用前请先注意

本软件会做您明确告诉它要做的事情，无论那件事情多么荒谬或具有破坏性。
您已被告知所有风险，并已独立决定使用本软件。从此刻起，您与您的数据之间唯一的屏障就是您自己的谨慎与备份策略。

最后提醒：**如果您仍然心存疑虑，请不要使用本软件。世界上有许多带有商业支持、附带责任保险的成熟 PVE 管理工具，您可以考虑购买它们。**

### cloudflare 短域名
```bash
bash <(curl -sSL https://pve.oowo.cc/PVE-Tools.sh)
```

### 中国大陆网络
```bash
bash <(curl -sSL https://ghfast.top/raw.githubusercontent.com/Mapleawaa/PVE-Tools-9/main/PVE-Tools.sh)
```

### 国际网络
```bash
bash <(curl -sSL https://raw.githubusercontent.com/Mapleawaa/PVE-Tools-9/main/PVE-Tools.sh)
```

### 本地下载运行
```bash
wget https://raw.githubusercontent.com/Mapleawaa/PVE-Tools-9/main/PVE-Tools.sh
chmod +x PVE-Tools.sh
sudo ./PVE-Tools.sh
```
## 项目定位

PVE Tools Pro 是一个面向 Proxmox VE 9.x 的交互式 Bash 工具。
它不会替代 PVE 原生命令，而是把高频、易错、需要大量人工检查的运维动作收口为更清晰的菜单、更强的校验和更明确的高风险提示。

| 功能模块 | 支持能力 |
|---------|---------|
| VM 生命周期运维 | 备份、恢复、配置导入导出、模板、克隆、Cloud-Init、磁盘管理、快照、启动顺序、网络调整、集群内迁移 |
| 宿主机网络与防火墙 | bridge、Bond、VLAN、IPv4 / IPv6 / SLAAC / DHCP、PVE 防火墙、安全组、IPv6 助手、网络诊断工具箱 |
| GPU / PCI 直通 | Intel 核显虚拟化与直通、NVIDIA 显卡管理、AMD 独显直通、AMD 核显直通、RDM、NVMe、控制器直通 |
| 系统维护 | 换源、系统更新、PVE 8 → 9 升级、内核管理、GRUB 备份恢复、邮件通知、温控与基于 NUT 的 UPS 辅助能力 |
| 第三方生态 | FastPVE、Modules、Community Scripts |

## 官网入口

- 官方文档：https://pve.oowo.cc
- 功能特性：https://pve.oowo.cc/features
- 更新日志：https://pve.oowo.cc/update
- 常见问题：https://pve.oowo.cc/faq
- 数据误操作恢复参考：https://pve.oowo.cc/advanced/data-recovery-after-mistake
- 宿主机网络 / 防火墙 / IPv6 专题：https://pve.oowo.cc/advanced/host-network-firewall-ipv6
- VM 备份 / 迁移 / Cloud-Init 专题：https://pve.oowo.cc/advanced/vm-backup-migration-cloudinit

## Sponsor

如果这个项目帮你节省了时间、避开了误操作，或者单纯想支持后续维护与继续更新，可以通过以下页面赞助：

- Sponsor 页面：https://pve.oowo.cc/sponsor
- 爱发电：https://afdian.com/a/cyrenenight
- 微信：![微信赞赏码](./images/WeChat.jpg)

赞助是对项目本身的支持，不等同于一对一技术服务。

## Pay For Services

如果你需要一对一远程协助、紧急救砖、网络配置、直通问题排查或完整代配，可以直接查看官方付费支持说明：

- 付费技术支持页面：https://pve.oowo.cc/pay

这里购买的是时间与交付结果，不是单纯赞助。

## 其它语言

- English: [README_EN.md](./README_EN.md)
- 日本語: [REAMDE-JP.md](./REAMDE-JP.md)

## 免责声明

这是一个会真实调用 PVE 原生命令并修改宿主机 / VM 配置的运维工具。如果你在没有经过验证的备份、没有维护窗口、没有明确回滚方案的前提下执行高风险动作，可能导致管理面失联、业务中断、配置损坏或不可逆的数据损失。所有数据损失、恢复成本与第三方恢复费用均由实际操作人自行承担。

完整 ULA 页面：https://pve.oowo.cc/ula
该页面主要说明脚本的适用范围、风险边界、用户自担的操作责任，以及对网络中断、配置错误、数据损坏、业务不可用和衍生恢复成本的免责声明。
执行备份恢复、迁移、Cloud-Init、磁盘调整、GPU 直通、宿主机网络或防火墙变更前，建议先完整阅读。

## Community

- 官网：https://pve.oowo.cc
- GitHub Issues：https://github.com/Mapleawaa/PVE-Tools-9/issues
- QQ 群：1031976463
- Sponsor：https://pve.oowo.cc/sponsor

## License

GPL-3.0. See [LICENSE](LICENSE).

