# PVE Tools 9 🚀

<div align="center">
你的下一个简单好用，简洁易用的 PVE9 配置脚本
 
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Shell Script](https://img.shields.io/badge/Shell-Script-4EAA25?logo=gnu-bash&logoColor=white)](https://www.gnu.org/software/bash/)
[![Proxmox VE](https://img.shields.io/badge/Proxmox-VE%209.0-E57000?logo=proxmox&logoColor=white)](https://www.proxmox.com/)
[![Debian](https://img.shields.io/badge/Debian-13%20(Trixie)-A81D33?logo=debian&logoColor=white)](https://www.debian.org/)

 🎉  500 Stars 撒花 🎉  Ciallo～(∠・ω<)⌒★
![展示](/images/main-shot.png)
</div>

### 🚪 开门见山
#### 中国大陆网络
```
bash <(curl -sSL https://ghfast.top/github.com/Mapleawaa/PVE-Tools-9/blob/main/PVE-Tools.sh)
```
#### 国际网络
```
bash <(curl -sSL https://raw.githubusercontent.com/Mapleawaa/PVE-Tools-9/refs/heads/main/PVE-Tools.sh)
```
> [!WARNING]
> 请不要多次拉取文件，无论镜像站还是源站。否则会被服务器拒绝导致影响心情。

---

### 公告

> [!IMPORTANT]
> 显卡拆分/直通 已新开仓库使用其他语言编写脚本。
> 详细请看 👉 [N卡拆分仓库](https://github.com/Mapleawaa/NVIDIA-vGPU-Script-For-PVE) | [显卡直通脚本仓库](https://github.com/Mapleawaa/GPU-Pathrough-Script-For-PVE)

> [!WARNING]
> 3.0.0 起已加入 Proxmox 安全软件源，建议尽快更新以避免潜在安全风险。


### 📖 项目简介

PVE Tools 9 是专为 Proxmox VE 9.0 设计的一键配置工具，基于 Debian 13 (Trixie) 系统。本工具旨在简化 PVE 的初始配置过程，提供友好的用户界面和安全的操作体验。

English Readme is comming soon...

<div align="center">

**脚本如果使用出现问题请直接发issue，我下课了会看并且修复**
**如有好点子欢迎 PR！**

更新日志
[![Commits](https://img.shields.io/badge/Commits-查看提交历史-blue?style=flat-square&logo=github)](https://github.com/Mapleawaa/PVE-Tools-9/commits/)
</div>

### 🚀 快速开始

#### 系统要求

- ✅ Proxmox VE 9.0 或更高版本 （Proxmox VE 8 仅可用升级功能）
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
## 📁 文档知识库 / 
主站 [国内网络](https://docs.302200.xyz/pve) | [国际网络](https://pages.dev)

建设中 

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

特别感谢以下贡献者：
- **[Mapleawaa](https://github.com/Mapleawaa)** - 项目创始人与主要维护者
- **[Claude Code (Anthropic)](https://claude.ai)** - AI 代码助手，参与第三方工具集成、代码重构与优化

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

**用 ❤️ 由 AI 联合打造**

[**Gemini**](https://gemini.google.com) - Google 推出的大语言模型
[**CodeX**](https://openai.com/) - 先进的 GPT 模型驱动
[**Claude Code**](https://claude.ai/code) - Anthropic 官方 AI 编程助手
<!-- [**Qwen3**](https://github.com/QwenLM/Qwen3) - 阿里云 Qwen 团队开发的大语言模型系列 -->
<!-- 这个太菜了不用了 ⬆️ -->

[![GitHub](https://img.shields.io/badge/GitHub-SovitxNetworks-181717?logo=github&logoColor=white)](https://github.com/Mapleawaa)

</div>
<img src="https://api.star-history.com/svg?repos=Mapleawaa/PVE-Tools-9&type=Date)](https://www.star-history.com/#Mapleawaa/PVE-Tools-9&Date"> </img>
