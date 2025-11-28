# PVE Tools - 第三方工具集

> [!NOTE]
> 从 5.0.0 版本开始，主脚本的第 14 个菜单项已更换为 **FastPVE 虚拟机快速下载**。  
> 本目录保留旧版 tteck 工具脚本，若仍需使用请按照下方“直接运行工具”方式手动调用。
> 另外，主菜单新增的 “第三方工具集 (Community Scripts)” 仅指向社区脚本站点，并不会自动运行本目录下的脚本。

这个目录包含来自 **tteck** 社区的第三方 Proxmox 管理工具。

## 工具来源

- **作者**: tteck
- **项目地址**: https://github.com/tteck/Proxmox
- **许可证**: MIT License

## 工具列表

### 系统配置工具
- **post-pbs-install.sh** - Proxmox Backup Server 安装后配置
- **post-pve-install.sh** - Proxmox VE 安装后配置
- **scaling-governor.sh** - CPU 调频策略配置工具
- **microcode.sh** - CPU 微码更新工具

### 容器管理工具
- **update-lxcs.sh** - 批量更新 LXC 容器
- **cron-update-lxcs.sh** - 定时自动更新 LXC 容器
- **clean-lxcs.sh** - 清理 LXC 容器缓存和日志

### 系统维护工具
- **host-backup.sh** - Proxmox 主机配置备份工具
- **kernel-clean.sh** - 清理旧内核版本
- **kernel-pin.sh** - 固定内核版本防止自动更新
- **fstrim.sh** - SSD Trim 优化工具

### 监控工具
- **monitor-all.sh** - 系统全局监控工具
- **netdata.sh** - Netdata 实时监控系统安装

## 使用方法

### 使用方式

> [!IMPORTANT]
> PVE-Tools 主菜单已经不再提供自动下载/执行这些脚本的入口，如需继续使用请手动运行。

#### 直接运行工具

```bash
cd Tools
bash post-pve-install.sh
```

## 注意事项

⚠️ **重要提示**:

1. 这些工具由第三方社区维护，非 PVE-Tools-9 项目原创
2. 工具执行前会显示确认提示，请仔细阅读
3. 某些工具会修改系统配置，建议先了解工具功能
4. 所有工具执行都会记录到 `/var/log/pve-tools.log`

## 致谢

感谢 **tteck** 为 Proxmox 社区贡献的优秀工具！

如需了解更多工具详情，请访问原项目：
https://github.com/tteck/Proxmox

---

**PVE-Tools-9 项目**
项目地址: https://github.com/Mapleawaa/PVE-Tools-9
