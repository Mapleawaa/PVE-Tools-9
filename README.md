# PVE Tools 9 🚀

> [!WARNING]
> 最新脚本版本3.0.0 加入了 Proxmox 安全软件源，请尽快更新脚本到最新版本避免影响机器安全！

<div align="center">

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Shell Script](https://img.shields.io/badge/Shell-Script-4EAA25?logo=gnu-bash&logoColor=white)](https://www.gnu.org/software/bash/)
[![Proxmox VE](https://img.shields.io/badge/Proxmox-VE%209.0-E57000?logo=proxmox&logoColor=white)](https://www.proxmox.com/)
[![Debian](https://img.shields.io/badge/Debian-13%20(Trixie)-A81D33?logo=debian&logoColor=white)](https://www.debian.org/)

**🌍 语言选择**

[🇺🇸 English](./docs/README-EN.md) | [🇨🇳 中文](./README.md)

---
```
██████╗ ██╗   ██╗███████╗    ████████╗ ██████╗  ██████╗ ██╗     ███████╗     █████╗ 
██╔══██╗██║   ██║██╔════╝    ╚══██╔══╝██╔═══██╗██╔═══██╗██║     ██╔════╝    ██╔══██╗
██████╔╝██║   ██║█████╗         ██║   ██║   ██║██║   ██║██║     ███████╗    ╚██████║
██╔═══╝ ╚██╗ ██╔╝██╔══╝         ██║   ██║   ██║██║   ██║██║     ╚════██║     ╚═══██║
██║      ╚████╔╝ ███████╗       ██║   ╚██████╔╝╚██████╔╝███████╗███████║     █████╔╝
╚═╝       ╚═══╝  ╚══════╝       ╚═╝    ╚═════╝  ╚═════╝ ╚══════╝╚══════╝     ╚════╝ 
```

**你的下一个简单好用，简洁易用的 PVE9 配置脚本**

![展示](/images/main-shot.png)

</div>

---
### 🚪 开门见山
#### 中国大陆网络

> [!WARNING]
> 请不要多次拉取文件，无论镜像站还是源站。否则会被服务器拒绝导致影响心情。

```
bash <(curl -sSL https://ghfast.top/github.com/Mapleawaa/PVE-Tools-9/blob/main/PVE-Tools.sh)
```
#### 国际网络
```
bash <(curl -sSL https://github.com/Mapleawaa/PVE-Tools-9/blob/main/PVE-Tools.sh)
```

---

<div align="center">
<strong> [新功能!] 自带小工具软件 </strong> 

<img src="./images/little-tools.png"> </img>
**工具来源**
**作者**: tteck
**项目地址**: https://github.com/tteck/Proxmox
**许可证**: MIT License
##### 感谢 **tteck** 为 Proxmox 社区贡献的优秀工具！
*如需了解更多工具详情，请访问原项目：*
https://github.com/tteck/Proxmox
</div>

---

### 📖 项目简介

PVE Tools 9 是专为 Proxmox VE 9.0 设计的一键配置工具，基于 Debian 13 (Trixie) 系统。本工具旨在简化 PVE 的初始配置过程，提供友好的用户界面和安全的操作体验。

<div align="center">

**脚本如果使用出现问题请直接发issue，我下课了会看并且修复**
**如有好点子欢迎 PR！**

更新日志
[![Commits](https://img.shields.io/badge/Commits-查看提交历史-blue?style=flat-square&logo=github)](https://github.com/Mapleawaa/PVE-Tools-9/commits/)
</div>

### ✨ 主要特性

- 🚀 **一键换源** - 自动配置清华大学镜像源，大幅提升下载速度
- 🚫 **删除订阅弹窗** - 彻底消除烦人的订阅提醒
- 💾 **存储优化** - 智能合并 local 与 local-lvm 存储
- 🔄 **Swap 管理** - 可选删除 Swap 分区释放更多空间
- 📦 **系统更新** - 安全的系统升级和清理
- 📊 **系统监控** - 实时显示系统运行状况
- 🔧 **硬件直通** - 轻松配置 PCI 设备直通功能
- ⚙️ **CPU 电源管理** - 灵活调整 CPU 性能模式
- 🌡️ **温度监控** - 实时显示 CPU 和硬盘温度
- 🐙 **Ceph 支持** - 支持 ceph-squid 和 ceph-quincy 源
- 🎨 **美观界面** - 彩色输出和友好的用户交互
- 🛡️ **安全备份** - 操作前自动备份重要文件

### 🎯 支持的功能

| 功能 | 描述 | 推荐度 |
|------|------|--------|
| 🚀 更换软件源 | 配置清华镜像源，包含 Debian、PVE、Ceph 源 | ⭐⭐⭐⭐⭐ |
| 🚫 删除订阅弹窗 | 移除"无有效订阅"提醒弹窗 | ⭐⭐⭐⭐⭐ |
| 💾 合并存储 | 合并 local 与 local-lvm（适合小硬盘） | ⭐⭐⭐ |
| 🔄 删除 Swap | 释放 Swap 空间给系统使用 | ⭐⭐⭐ |
| 📦 系统更新 | 更新系统软件包到最新版本 | ⭐⭐⭐⭐ |
| 📊 系统信息 | 查看 PVE 系统运行状态 | ⭐⭐⭐⭐ |
| 🔧 硬件直通 | 配置 PCI 设备直通功能 | ⭐⭐⭐⭐ |
| ⚙️ CPU 电源模式 | 调整 CPU 性能模式（节能/性能等） | ⭐⭐⭐ |
| 🌡️ 温度监控 | 实时显示 CPU 和硬盘温度 | ⭐⭐⭐⭐ |
| 🐙 Ceph 源 | 支持 ceph-squid 和 ceph-quincy 源 | ⭐⭐⭐ |
| 🗑️ Ceph 卸载 | 完全移除 Ceph 相关组件 | ⭐⭐ |
| 🐧 内核管理 | 检测、下载和切换系统内核版本 | ⭐⭐⭐⭐ |

### 🚀 快速开始

#### 系统要求

- ✅ Proxmox VE 9.0 或更高版本
- ✅ Debian 13 (Trixie) 基础系统
- ✅ Root 权限
- ✅ 网络连接

#### 安装使用

```bash
# 1. 下载脚本
wget https://raw.githubusercontent.com/Mapleawaa/PVE-Tools-9/main/PVE-Tools.sh

# 2. 添加执行权限
chmod +x PVE-Tools.sh

# 3. 运行脚本
sudo ./PVE-Tools.sh
```

运行脚本后，您将看到包含以下选项的菜单：

1. 🚀 更换软件源 - 配置清华大学镜像源
2. 🚫 删除订阅弹窗 - 移除订阅提醒
3. 💾 合并存储 - 合并 local 与 local-lvm
4. 🔄 删除 Swap - 释放 Swap 空间
5. 📦 系统更新 - 更新系统软件包
6. 📊 系统信息 - 查看系统运行状态
7. ⚡ 一键配置 - 自动执行换源、删除弹窗和系统更新
8. 🔧 硬件直通配置 - 配置 PCI 设备直通
9. ⚙️ CPU 电源模式 - 调整 CPU 性能模式
10. 🌡️ 温度监控设置 - 添加温度监控功能
11. 🗑️ 移除温度监控 - 移除温度监控功能
12. 🐙 添加 ceph-squid 源 - 为 PVE 8/9 添加 Ceph 源
13. 🐙 添加 ceph-quincy 源 - 为 PVE 7/8 添加 Ceph 源
14. 🗑️ 卸载 Ceph - 完全移除 Ceph 组件
15. 🐧 内核管理 - 检测、下载和切换系统内核版本

> 💡 **调试模式**: 开发者和高级用户可以使用 `sudo ./PVE-Tools.sh --debug` 命令启动调试模式。此模式将跳过 PVE 系统检测，但会显示严重警告，因为在此模式下在非 PVE 系统上运行可能导致系统损坏。

#### 一键配置（推荐新用户）

```bash
# 直接运行并选择选项 7 进行一键配置
sudo ./PVE-Tools.sh
# 然后输入 7 选择一键配置
```

### 📋 详细功能说明

#### 🚀 更换软件源

- **Debian 源**: 使用 DEB822 格式配置清华大学镜像
- **企业源**: 自动注释 PVE 企业源（需付费）
- **Ceph 源**: 配置 Ceph 存储镜像源
- **无订阅源**: 添加适用于社区版的免费源
- **CT 模板源**: 加速容器模板下载

#### 🚫 删除订阅弹窗

自动修改 `proxmoxlib.js` 文件，彻底移除"No valid subscription"弹窗提醒。

#### 💾 存储管理

**合并 local 与 local-lvm**:
- 适用于小容量系统盘
- 自动备份配置
- 安全的 LVM 操作

**删除 Swap 分区**:
- 释放 Swap 空间给系统使用
- 适合内存充足的环境
- 自动修改 fstab 配置

#### 🔧 硬件直通配置

**开启硬件直通**:
- 自动检测 CPU 类型（Intel/AMD）
- 配置 IOMMU 设置
- 添加 VFIO 驱动模块
- 设置显卡和音频设备黑名单

**关闭硬件直通**:
- 恢复原始 GRUB 配置
- 移除 VFIO 相关设置
- 删除黑名单配置

#### ⚙️ CPU 电源模式

支持多种 CPU 性能模式：
- **Performance**: 高性能模式（默认）
- **Powersave**: 节能模式
- **Ondemand**: 按需调频模式
- **Conservative**: 保守调频模式
- **Schedutil**: 负载优化模式

#### 🌡️ 温度监控

**添加温度监控**:
- 安装 lm-sensors、nvme-cli 等工具
- 自动检测硬件传感器
- 修改 PVE Web UI 显示 CPU/主板/硬盘温度
- 支持 NVME 和 SATA 硬盘温度显示

**删除温度监控**:
- 恢复原始 PVE Web UI 文件
- 移除相关工具和配置

#### 🐧 内核管理

**内核版本检测**:
- 自动检测当前系统内核版本
- 显示可用内核版本列表
- 支持 PVE 官方内核和测试版内核

**内核下载安装**:
- 从 PVE 官方仓库下载指定内核版本
- 自动处理依赖关系和冲突
- 支持内核头文件和开发包安装

**内核切换配置**:
- 安全的内核切换机制
- 自动更新 GRUB 引导配置
- 支持多内核启动选项管理

#### 🐙 Ceph 存储支持

**添加 ceph-squid 源**:
- 适用于 PVE 8/9
- 配置清华大学镜像源

**添加 ceph-quincy 源**:
- 适用于 PVE 7/8
- 配置清华大学镜像源

**卸载 Ceph**:
- 停止所有 Ceph 服务
- 删除 Ceph 相关软件包
- 清理配置文件和数据

### ⚠️ 注意事项

- 🔒 **权限要求**: 必须使用 root 权限运行
- 💾 **数据备份**: 重要操作前会自动备份配置文件
- 🌐 **网络需求**: 换源功能需要稳定的网络连接
- ⚡ **内存要求**: 删除 Swap 前请确保内存充足
- 🔧 **硬件直通**: 需要硬件支持 IOMMU/VT-d 功能
- 🌡️ **温度监控**: 需要硬件支持传感器检测
- 🐙 **Ceph 功能**: 请根据您的 PVE 版本选择合适的 Ceph 源

### 🐛 故障排除

#### 常见问题

**Q: 脚本提示"不是 PVE 环境"?**
A: 请确保您在 Proxmox VE 系统上运行此脚本。

**Q: 换源后更新失败?**
A: 请检查网络连接，或尝试重新运行换源功能。

**Q: 删除弹窗后仍然出现?**
A: 请清除浏览器缓存或使用无痕模式访问。

#### 获取帮助

如遇到问题，请：
1. 📋 查看脚本运行日志
2. 🔍 检查系统环境是否符合要求
3. 💬 在 GitHub Issues 中提交问题

#### 内核管理常见问题

**Q: 内核切换是否安全？**
A: 是的，脚本会自动备份当前内核配置，并提供回滚选项。建议在生产环境切换前进行测试。

**Q: 支持哪些内核版本？**
A: 支持 PVE 官方仓库中的所有可用内核版本，包括稳定版和测试版。

**Q: 切换内核后需要重启吗？**
A: 是的，切换内核后需要重启系统才能生效新的内核。

**Q: 如何恢复原来的内核？**
A: 在 GRUB 启动菜单中选择原来的内核版本即可恢复。

**Q: 内核切换会影响我的虚拟机吗？**
A: 不会直接影响虚拟机，但新的内核可能会提供更好的硬件兼容性和性能。

---

## 📄 开源协议

本项目采用 MIT 协议发布，详见 [LICENSE](LICENSE) 文件。

```
MIT License

Copyright (c) 2025 Sovitx IO

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

## 🙏 特别感谢

### 🌟 贡献者

<a href="https://github.com/Mapleawaa/PVE-Tools-9/graphs/contributors">
  <img src="https://contrib.rocks/image?repo=Mapleawaa/PVE-Tools-9" />
</a>

### 🏛️ 相关组织与项目

- **[清华大学 TUNA 镜像站](https://mirrors.tuna.tsinghua.edu.cn/)** - 提供优质的镜像源服务
- **[Proxmox VE 官方](https://www.proxmox.com/)** - 优秀的虚拟化平台
- **[Debian 官方](https://www.debian.org/)** - 稳定可靠的系统基础
- **[NodeSeek 论坛](https://www.nodeseek.com)** - 一个有效的主机信息聚集地，希望它能成长为一个有用的社群。
- **[Linux.do 论坛](https://linux.do/)** - 一个真诚、友善、团结、专业，共建你我引以为荣之社区。
- **[IDC Flare 论坛](https://idcflare.com)** - 一个新的域名、主机等信息集散地。


### 💡 灵感来源

- 感谢 PVE 社区的各位大佬分享的配置经验
- 感谢代码参考：https://zhichao.org/posts/e0fe08
- 参考了众多开源项目的最佳实践

### 🎨 设计与界面

- **ASCII 字符画** - 字符画设计灵感来源于社区创作
- **配色方案** - 配色参考了现代终端美学

---

<div align="center">

### 🌟 如果这个项目对你有帮助，请给个 Star ⭐

**用 ❤️ 由 AI Claude 4 和 Qwen3 联合打造**
[**Qwen3** 是阿里云 Qwen 团队开发的大语言模型系列](https://github.com/QwenLM/Qwen3)

[![GitHub](https://img.shields.io/badge/GitHub-SovitxNetworks-181717?logo=github&logoColor=white)](https://github.com/Mapleawaa)

</div>
<img src="https://api.star-history.com/svg?repos=Mapleawaa/PVE-Tools-9&type=Date)](https://www.star-history.com/#Mapleawaa/PVE-Tools-9&Date"> </img>