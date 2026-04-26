# 如何连接到 PVE 主机的 SSH

本文用于介绍如何通过各种已知方式连接到 PVE 主机的 SSH 教程。

---

## Windows

>[!NOTE] 系统最低要求
> Windows 8.1 或更高版本

### 使用 MobaXterm 连接（推荐）

MobaXterm 是一款功能强大的终端工具，支持 SSH、SFTP、X11 转发等多种协议，界面友好，适合日常使用。

1. 下载并安装 [MobaXterm](https://mobaxterm.mobatek.net/)。
2. 打开 MobaXterm，点击左上角的 **Session** 按钮。
3. 在弹出的窗口中选择 **SSH**。
4. 在 **Remote host** 中输入 PVE 主机的 IP 地址（例如 `192.168.1.100`）。
5. 在 **Specify username** 中输入 `root`。
6. 点击 **OK** 保存并连接。
7. 首次连接时会提示输入密码，输入 `root` 用户的密码即可登录。

> [!TIP]
> MobaXterm 会自动保存会话配置，下次连接时直接双击会话名称即可快速登录。

### 使用 CMD 命令行（推荐）

Windows 10/11 自带的命令提示符已内置 OpenSSH 客户端，无需安装额外软件。

1. 按 `Win + R`，输入 `cmd` 回车打开命令提示符。
2. 输入以下命令连接 PVE 主机：

```bash
ssh root@192.168.1.100
```

3. 首次连接时会提示确认主机指纹，输入 `yes` 回车。
4. 输入 `root` 用户的密码完成登录。

> [!TIP]
> 如果提示 `ssh` 不是内部或外部命令，请检查系统设置中的"可选功能"是否已安装 OpenSSH 客户端。

### 使用 PowerShell 连接（推荐）

PowerShell 同样内置了 OpenSSH 客户端，且支持更多高级功能。

1. 右键点击开始菜单，选择 **终端(管理员)** 或按 `Win + X`，选择 **Windows PowerShell**。
2. 输入以下命令连接 PVE 主机：

```powershell
ssh root@192.168.1.100
```

3. 首次连接时确认主机指纹，输入 `yes` 回车。
4. 输入 `root` 用户的密码完成登录。

> [!TIP]
> PowerShell 支持 SSH 密钥认证，可通过 `ssh-keygen` 生成密钥对，实现免密码登录。

### 使用 PuTTY 连接

PuTTY 是经典的轻量级 SSH 客户端，适合老旧系统或便携使用。

1. 下载并运行 [PuTTY](https://www.chiark.greenend.org.uk/~sgtatham/putty/)。
2. 在 **Host Name** 中输入 PVE 主机的 IP 地址。
3. 确认 **Port** 为 `22`，**Connection type** 选择 **SSH**。
4. 在 **Saved Sessions** 中输入一个名称，点击 **Save** 保存配置。
5. 点击 **Open** 开始连接。
6. 在登录提示中输入用户名 `root`，然后输入密码。

### 使用 WindTerm 连接

WindTerm 是一款现代化的开源终端，界面美观且功能丰富。

1. 下载并安装 [WindTerm](https://github.com/kingToolbox/WindTerm)。
2. 打开 WindTerm，点击左上角的 **会话** -> **新建会话**。
3. 选择 **SSH** 协议，输入 PVE 主机的 IP 地址和端口 `22`。
4. 在认证页面输入用户名 `root` 和密码。
5. 点击 **连接** 完成登录。

### 使用 XShell 连接

XShell 是专业的商业终端模拟器，个人和教育用途可免费使用。

1. 下载并安装 [XShell](https://www.netsarang.com/zh/xshell/)。
2. 打开 XShell，点击 **文件** -> **新建**。
3. 在 **连接** 选项卡中输入名称和 PVE 主机的 IP 地址。
4. 在 **用户身份验证** 选项卡中输入用户名 `root` 和密码。
5. 点击 **确定** 保存，然后双击会话连接。

### 使用 Termius 连接

Termius 是跨平台的现代 SSH 客户端，支持 Windows、macOS、Linux、iOS 和 Android。

1. 下载并安装 [Termius](https://termius.com/)。
2. 注册或登录 Termius 账号（可选，用于同步配置）。
3. 点击 **New Host**，输入 PVE 主机的 IP 地址。
4. 在 **Username** 中输入 `root`，**Password** 中输入密码。
5. 点击 **Save** 保存，然后点击主机卡片连接。

---

## macOS

### 使用 终端(Terminal) 连接（推荐）

macOS 自带的终端已内置 OpenSSH，是最直接的方式。

1. 打开 **启动台** -> **其他** -> **终端**。
2. 输入以下命令连接 PVE 主机：

```bash
ssh root@192.168.1.100
```

3. 首次连接时确认主机指纹，输入 `yes` 回车。
4. 输入 `root` 用户的密码完成登录。

> [!TIP]
> 可通过 `~/.ssh/config` 配置主机别名，简化连接命令。例如：
> ```
> Host pve
>     HostName 192.168.1.100
>     User root
> ```
> 之后只需输入 `ssh pve` 即可连接。

### 使用 iTerm2 连接（推荐）

iTerm2 是 macOS 上功能最强大的第三方终端，支持分屏、搜索、自动补全等高级功能。

1. 下载并安装 [iTerm2](https://iterm2.com/)。
2. 打开 iTerm2，输入以下命令：

```bash
ssh root@192.168.1.100
```

3. 首次连接时确认主机指纹，输入 `yes` 回车。
4. 输入 `root` 用户的密码完成登录。

> [!TIP]
> iTerm2 支持 Profiles 功能，可以保存常用的 SSH 连接配置，通过快捷键快速连接。

### 使用 Termius 连接（推荐）

Termius 在 macOS 上提供了优雅的图形界面和强大的同步功能。

1. 从 [App Store](https://apps.apple.com/us/app/termius-ssh-client/id1176074088) 或官网下载 Termius。
2. 打开 Termius，点击左侧的 **Hosts** -> **New Host**。
3. 输入 PVE 主机的 IP 地址、用户名 `root` 和密码。
4. 点击 **Save** 保存，然后双击主机连接。

### 使用 ServerCat 连接

ServerCat 是 macOS 上专为服务器管理设计的原生应用，界面简洁直观。

1. 从 [App Store](https://apps.apple.com/us/app/servercat-ssh-terminal/id1501538283) 下载 ServerCat。
2. 打开 ServerCat，点击 **+** 添加新服务器。
3. 输入服务器名称、IP 地址、用户名 `root` 和密码。
4. 点击 **保存**，然后点击服务器卡片连接。

---

## Linux

>[!NOTE] 系统最低要求
> Ubuntu 18.04 / Debian 9 / CentOS 7 或更高版本

### 使用 OpenSSH 连接（推荐）

几乎所有 Linux 发行版都预装了 OpenSSH 客户端。

1. 打开终端（快捷键通常为 `Ctrl + Alt + T`）。
2. 输入以下命令连接 PVE 主机：

```bash
ssh root@192.168.1.100
```

3. 首次连接时，终端会显示类似以下的提示：

```
The authenticity of host '192.168.1.100 (192.168.1.100)' can't be established.
ED25519 key fingerprint is SHA256:xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx.
Are you sure you want to continue connecting (yes/no/[fingerprint])?
```

4. 输入 `yes` 回车确认。
5. 输入 `root` 用户的密码完成登录。

> [!TIP]
> 为方便后续连接，可配置 SSH 密钥实现免密码登录：
> ```bash
> # 生成密钥对（如果还没有）
> ssh-keygen -t ed25519 -C "your_email@example.com"
>
> # 将公钥复制到 PVE 主机
> ssh-copy-id root@192.168.1.100
> ```
> 之后连接无需再输入密码。

---

## Android

### 使用 Termux 连接（推荐）

Termux 是 Android 上功能最完整的终端模拟器，无需 Root 即可使用完整的 Linux 环境。

1. 从 [F-Droid](https://f-droid.org/packages/com.termux/) 或 [GitHub Releases](https://github.com/termux/termux-app/releases) 下载安装 Termux。
2. 打开 Termux，更新软件包列表：

```bash
pkg update
```

3. 安装 OpenSSH 客户端（通常已预装）：

```bash
pkg install openssh
```

4. 输入以下命令连接 PVE 主机：

```bash
ssh root@192.168.1.100
```

5. 首次连接时确认主机指纹，输入 `yes` 回车。
6. 输入 `root` 用户的密码完成登录。

> [!TIP]
> Termux 支持长时间后台运行，可通过通知栏保持会话活跃。配合物理键盘使用体验更佳。

### 使用 ServerBox 连接（推荐）

ServerBox 是一款专为服务器管理设计的 Android 应用，界面现代且功能完善。

1. 从 [GitHub Releases](https://github.com/lollipopkit/flutter_server_box/releases) 下载安装 ServerBox。
2. 打开 ServerBox，点击右下角的 **+** 按钮。
3. 输入服务器名称、IP 地址、端口 `22`、用户名 `root` 和密码。
4. 点击 **保存**，然后在服务器列表中点击连接。

> [!TIP]
> ServerBox 支持 SFTP 文件管理、Docker 容器管理和状态监控，是移动端运维的利器。

### 使用 Termius 连接（推荐）

Termius 在 Android 上提供了与桌面端一致的优雅体验。

1. 从 [Google Play](https://play.google.com/store/apps/details?id=com.server.auditor.ssh.client) 下载安装 Termius。
2. 打开 Termius，点击右下角的 **+** -> **New Host**。
3. 输入 PVE 主机的 IP 地址、用户名 `root` 和密码。
4. 点击 **Save** 保存，然后点击主机卡片连接。

---

## iOS

### 使用 ServerCat 连接（推荐）

ServerCat 是 iOS 上口碑极佳的 SSH 客户端，针对触屏操作做了大量优化。

1. 从 [App Store](https://apps.apple.com/us/app/servercat-ssh-terminal/id1501538283) 下载安装 ServerCat。
2. 打开 ServerCat，点击右上角的 **+** 按钮。
3. 输入服务器名称、IP 地址、用户名 `root` 和密码。
4. 点击 **保存**，然后在服务器列表中点击连接。

> [!TIP]
> ServerCat 支持快捷命令、代码片段和文件管理，适合在 iPad 上进行高效的运维操作。

### 使用 Termius 连接（推荐）

Termius 在 iOS 上同样表现出色，支持跨设备同步配置。

1. 从 [App Store](https://apps.apple.com/us/app/termius-ssh-client/id549039908) 下载安装 Termius。
2. 打开 Termius，点击底部的 **Hosts** -> 右上角的 **+**。
3. 输入 PVE 主机的 IP 地址、用户名 `root` 和密码。
4. 点击 **Save** 保存，然后点击主机卡片连接。

> [!TIP]
> Termius 支持 iCloud 同步，在一台设备上配置的服务器可以自动同步到所有 Apple 设备。

---

## 常见问题

### 连接超时或拒绝连接

- 确认 PVE 主机的 IP 地址是否正确，且与客户端处于同一网络或路由可达。
- 确认 PVE 主机的 SSH 服务已启动（默认端口 22）。
- 检查 PVE 防火墙或上游网络设备是否放行了 SSH 端口。
- 如果是云服务器，检查安全组规则是否允许入站 22 端口。

### 密码正确但无法登录

- 确认输入的是 `root` 用户的密码，而非 Web 管理界面的其他账号。
- 检查 PVE 主机的 `/etc/ssh/sshd_config` 是否允许 `root` 登录（`PermitRootLogin yes`）。
- 确认键盘布局是否正确，特别是包含特殊字符的密码。

### 主机密钥变更警告

如果看到类似 `WARNING: REMOTE HOST IDENTIFICATION HAS CHANGED!` 的提示，通常是因为 PVE 重装或更换了 SSH 密钥。

**解决方法**：

```bash
# Linux/macOS/Windows PowerShell
ssh-keygen -R 192.168.1.100

# 然后重新连接
ssh root@192.168.1.100
```

### 中文显示乱码

- 确保客户端的字符编码设置为 **UTF-8**。
- 在 PVE 主机上执行 `locale` 命令确认系统语言环境为 `en_US.UTF-8` 或 `zh_CN.UTF-8`。

---

> [!CAUTION]
> **安全建议**：
> 1. 生产环境强烈建议使用 SSH 密钥认证替代密码登录。
> 2. 如果必须从公网访问，请将 SSH 端口修改为非默认端口，并配置防火墙限制来源 IP。
> 3. 考虑启用 fail2ban 等工具防止暴力破解。
> 4. 定期更新 PVE 系统和 OpenSSH 版本，及时修补安全漏洞。
