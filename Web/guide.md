# 使用指南

## 快速开始

在 PVE 终端中执行以下命令即可启动工具：

```bash
curl -sSL https://raw.githubusercontent.com/Mapleawaa/PVE-Tools-9/main/PVE-Tools.sh | bash
```

或者使用 wget：

```bash
wget -q -O PVE-Tools.sh https://raw.githubusercontent.com/Mapleawaa/PVE-Tools-9/main/PVE-Tools.sh && chmod +x PVE-Tools.sh && ./PVE-Tools.sh
```

## 注意事项

1. **环境要求**：建议在 Proxmox VE 9.0 或更高版本上运行。
2. **权限要求**：必须以 `root` 用户身份运行。
3. **备份建议**：虽然脚本会自动备份关键配置，但仍建议在重大操作前手动备份重要数据。

## 主要功能

- **配置软件源**：切换到国内镜像，大幅提升下载速度。
- **去除订阅弹窗**：去除登录时的无订阅提示。
- **硬盘管理**：轻松挂载、卸载硬盘。
- **系统优化**：针对 PVE 环境的各项微调。
