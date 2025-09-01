# PVE Tools 9 🚀

<div align="center">

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Shell Script](https://img.shields.io/badge/Shell-Script-4EAA25?logo=gnu-bash&logoColor=white)](https://www.gnu.org/software/bash/)
[![Proxmox VE](https://img.shields.io/badge/Proxmox-VE%209.0-E57000?logo=proxmox&logoColor=white)](https://www.proxmox.com/)
[![Debian](https://img.shields.io/badge/Debian-13%20(Trixie)-A81D33?logo=debian&logoColor=white)](https://www.debian.org/)
[![GitHub stars](https://img.shields.io/github/stars/yourusername/PVE-Tools?style=social)](https://github.com/Mapleawaa/PVE-Tools-9/stargazers)
[![GitHub forks](https://img.shields.io/github/forks/yourusername/PVE-Tools?style=social)](https://github.com/Mapleawaa/PVE-Tools-9/network/members)

**🌍 Language / 语言选择**

[🇺🇸 English](#english) | [🇨🇳 中文](#中文)

---

```
██████╗ ██╗   ██╗███████╗    ████████╗ ██████╗  ██████╗ ██╗     ███████╗     █████╗ 
██╔══██╗██║   ██║██╔════╝    ╚══██╔══╝██╔═══██╗██╔═══██╗██║     ██╔════╝    ██╔══██╗
██████╔╝██║   ██║█████╗         ██║   ██║   ██║██║   ██║██║     ███████╗    ╚██████║
██╔═══╝ ╚██╗ ██╔╝██╔══╝         ██║   ██║   ██║██║   ██║██║     ╚════██║     ╚═══██║
██║      ╚████╔╝ ███████╗       ██║   ╚██████╔╝╚██████╔╝███████╗███████║     █████╔╝
╚═╝       ╚═══╝  ╚══════╝       ╚═╝    ╚═════╝  ╚═════╝ ╚══════╝╚══════╝     ╚════╝ 
```

**🎯 一键配置神器，让 PVE 配置变得简单快乐**

</div>

---

## 中文

### 📖 项目简介

PVE Tools 9 是专为 Proxmox VE 9.0 设计的一键配置工具，基于 Debian 13 (Trixie) 系统。本工具旨在简化 PVE 的初始配置过程，提供友好的用户界面和安全的操作体验。

### ✨ 主要特性

- 🚀 **一键换源** - 自动配置清华大学镜像源，大幅提升下载速度
- 🚫 **删除订阅弹窗** - 彻底消除烦人的订阅提醒
- 💾 **存储优化** - 智能合并 local 与 local-lvm 存储
- 🔄 **Swap 管理** - 可选删除 Swap 分区释放更多空间
- 📦 **系统更新** - 安全的系统升级和清理
- 📊 **系统监控** - 实时显示系统运行状况
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

### 🚀 快速开始

#### 系统要求

- ✅ Proxmox VE 9.0 或更高版本
- ✅ Debian 13 (Trixie) 基础系统
- ✅ Root 权限
- ✅ 网络连接

#### 安装使用

```bash
# 1. 下载脚本
wget https://raw.githubusercontent.com/yourusername/PVE-Tools/main/PVE-Tools.sh

# 2. 添加执行权限
chmod +x PVE-Tools.sh

# 3. 运行脚本
sudo ./PVE-Tools.sh
```

#### 一键配置（推荐新用户）

```bash
# 直接运行并选择选项 7 进行一键配置
sudo ./PVE-Tools.sh
# 然后输入 7 选择一键配置
```

### 📋 详细功能说明

#### 🚀 更换软件源

- **Debian 源**: 使用 DEB822 格式配置清华大学镜像
- **企业源**: 自动注释付费企业源
- **Ceph 源**: 配置 Ceph 存储镜像源
- **无订阅源**: 添加免费版本专用源
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

### ⚠️ 注意事项

- 🔒 **权限要求**: 必须使用 root 权限运行
- 💾 **数据备份**: 重要操作前会自动备份配置文件
- 🌐 **网络需求**: 换源功能需要稳定的网络连接
- ⚡ **内存要求**: 删除 Swap 前请确保内存充足

### 🐛 故障排除

#### 常见问题

**Q: 脚本提示"不是 PVE 环境"？**
A: 请确保在 Proxmox VE 系统上运行此脚本。

**Q: 换源后更新失败？**
A: 请检查网络连接，或尝试重新运行换源功能。

**Q: 删除弹窗后仍然出现？**
A: 请清除浏览器缓存或使用无痕模式访问。

#### 获取帮助

如遇到问题，请：
1. 📋 查看脚本运行日志
2. 🔍 检查系统环境是否符合要求
3. 💬 在 GitHub Issues 中提交问题

---

## English

### 📖 Project Description

PVE Tools 9 is a one-click configuration tool designed specifically for Proxmox VE 9.0, based on Debian 13 (Trixie) system. This tool aims to simplify the initial configuration process of PVE, providing a friendly user interface and secure operation experience.

### ✨ Key Features

- 🚀 **One-Click Source Change** - Automatically configure Tsinghua University mirror sources for faster downloads
- 🚫 **Remove Subscription Popup** - Completely eliminate annoying subscription reminders
- 💾 **Storage Optimization** - Intelligently merge local and local-lvm storage
- 🔄 **Swap Management** - Optional Swap partition removal to free up more space
- 📦 **System Updates** - Safe system upgrades and cleanup
- 📊 **System Monitoring** - Real-time system status display
- 🎨 **Beautiful Interface** - Colorful output and friendly user interaction
- 🛡️ **Safe Backup** - Automatic backup of important files before operations

### 🎯 Supported Functions

| Function | Description | Recommendation |
|----------|-------------|----------------|
| 🚀 Change Sources | Configure Tsinghua mirrors for Debian, PVE, Ceph | ⭐⭐⭐⭐⭐ |
| 🚫 Remove Popup | Remove "No valid subscription" reminder popup | ⭐⭐⭐⭐⭐ |
| 💾 Merge Storage | Merge local and local-lvm (suitable for small disks) | ⭐⭐⭐ |
| 🔄 Remove Swap | Free up Swap space for system use | ⭐⭐⭐ |
| 📦 System Update | Update system packages to latest version | ⭐⭐⭐⭐ |
| 📊 System Info | View PVE system running status | ⭐⭐⭐⭐ |

### 🚀 Quick Start

#### System Requirements

- ✅ Proxmox VE 9.0 or higher
- ✅ Debian 13 (Trixie) base system
- ✅ Root privileges
- ✅ Network connection

#### Installation & Usage

```bash
# 1. Download script
wget https://raw.githubusercontent.com/yourusername/PVE-Tools/main/PVE-Tools.sh

# 2. Add execute permission
chmod +x PVE-Tools.sh

# 3. Run script
sudo ./PVE-Tools.sh
```

#### One-Click Setup (Recommended for new users)

```bash
# Run directly and select option 7 for one-click configuration
sudo ./PVE-Tools.sh
# Then input 7 to select one-click configuration
```

### 📋 Detailed Function Description

#### 🚀 Change Software Sources

- **Debian Sources**: Configure Tsinghua University mirrors using DEB822 format
- **Enterprise Sources**: Automatically comment out paid enterprise sources
- **Ceph Sources**: Configure Ceph storage mirror sources
- **No-Subscription Sources**: Add free version dedicated sources
- **CT Template Sources**: Accelerate container template downloads

#### 🚫 Remove Subscription Popup

Automatically modify the `proxmoxlib.js` file to completely remove the "No valid subscription" popup reminder.

#### 💾 Storage Management

**Merge local and local-lvm**:
- Suitable for small capacity system disks
- Automatic configuration backup
- Safe LVM operations

**Remove Swap Partition**:
- Free up Swap space for system use
- Suitable for memory-rich environments
- Automatically modify fstab configuration

### ⚠️ Important Notes

- 🔒 **Permission Requirements**: Must run with root privileges
- 💾 **Data Backup**: Configuration files are automatically backed up before important operations
- 🌐 **Network Requirements**: Source changing function requires stable network connection
- ⚡ **Memory Requirements**: Ensure sufficient memory before removing Swap

### 🐛 Troubleshooting

#### Common Issues

**Q: Script shows "Not a PVE environment"?**
A: Please ensure running this script on a Proxmox VE system.

**Q: Update fails after changing sources?**
A: Please check network connection or try running the source change function again.

**Q: Popup still appears after removal?**
A: Please clear browser cache or use incognito mode to access.

#### Getting Help

If you encounter problems, please:
1. 📋 Check script execution logs
2. 🔍 Verify system environment meets requirements
3. 💬 Submit issues on GitHub Issues

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

```
MIT License

Copyright (c) 2025 CodeBuddy

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

## 🙏 Special Thanks

### 🌟 Contributors

- **CodeBuddy** - 项目创建者和主要维护者 / Project Creator & Main Maintainer
- **Community Contributors** - 感谢所有提供反馈和建议的用户 / Thanks to all users who provided feedback and suggestions

### 🏛️ Organizations & Projects

- **[Tsinghua University TUNA](https://mirrors.tuna.tsinghua.edu.cn/)** - 提供优质的镜像源服务 / Providing excellent mirror source services
- **[Proxmox VE](https://www.proxmox.com/)** - 优秀的虚拟化平台 / Excellent virtualization platform
- **[Debian Project](https://www.debian.org/)** - 稳定可靠的操作系统基础 / Stable and reliable operating system foundation

### 💡 Inspiration

- 感谢 PVE 社区的各位大佬分享的配置经验 / Thanks to PVE community experts for sharing configuration experiences
- 参考了众多开源项目的最佳实践 / Referenced best practices from numerous open source projects

### 🎨 Design & UI

- **ASCII Art** - 字符画设计灵感来源于社区创作 / ASCII art design inspired by community creations
- **Color Scheme** - 配色方案参考了现代终端美学 / Color scheme references modern terminal aesthetics

---

<div align="center">

### 🌟 如果这个项目对您有帮助，请给个 Star ⭐

### 🌟 If this project helps you, please give it a Star ⭐

**Made with ❤️ by AI Claude 4**

[![GitHub](https://img.shields.io/badge/GitHub-CodeBuddy-181717?logo=github&logoColor=white)](https://github.com/yourusername)

</div>
