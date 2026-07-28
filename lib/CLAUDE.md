[根目录](../CLAUDE.md) > **lib**

# lib -- 基础设施层

## 模块职责

提供 PVE Tools Pro 全部功能模块所需的基础设施函数与全局变量，零业务逻辑。按固定顺序加载：config.sh -> core.sh -> menu.sh -> network.sh -> runtime.sh。

## 入口与启动

| 项目 | 说明 |
|---|---|
| 加载方式 | 由 `PVE-Tools.sh`（本地模式）、`dev.sh`（开发）source，或由 `build.sh` 拼接进 dist |
| 加载顺序 | `config.sh` -> `core.sh` -> `menu.sh` -> `network.sh` -> `runtime.sh`（三处入口硬编码同一列表） |
| 对外暴露 | 全部函数和全局变量对后续加载的 `src/modules/` 可见 |

## 文件清单

### config.sh -- 全局变量与常量（约 259 行，无函数）

| 类别 | 变量 | 说明 |
|---|---|---|
| 版本信息 | `CURRENT_VERSION`, `BUILD_NICKNAME`, `VERSION_FILE_URL`, `UPDATE_FILE_URL`, `PVE_TOOLS_SCRIPT_URL` | 版本号与更新 URL（脚本更新指向 GitHub Releases latest） |
| 镜像源注册表 | `MIRROR_NAMES[]`, `MIRROR_IDS[]`, `MIRROR_DEBIAN_URIS[]`, `MIRROR_SECURITY_URIS[]`, `MIRROR_PVE_URIS[]`, `MIRROR_CEPH_URIS[]`, `MIRROR_CT_URIS[]` | 24 个镜像源并行数组 |
| 镜像选择状态 | `MIRROR_SELECTED_*` | 当前选中的镜像索引（-1 未选） |
| 网络检测 | `CF_TRACE_URL`, `GITHUB_MIRROR_PREFIX`, `USER_COUNTRY_CODE`, `NETWORK_MODE`, `IS_OFFLINE_MODE`, `USE_MIRROR_FOR_UPDATE` | Cloudflare 地区检测、镜像加速 |
| URL 常量 | `FASTPVE_INSTALLER_URL`, `COOLERCONTROL_*_URL`, `NVIDIA_*_URL`, `THIRD_PARTY_*_URL` | 各功能的外部资源地址 |
| 路径常量 | `VM_CONFIG_EXPORT_DIR`, `VM_BACKUP_CRON_FILE`, `HOST_NETWORK_*_FILE`, `PVE_CLUSTER_FIREWALL_FILE`, `PVE_KVM_ROM_DIR` | 运行时文件路径 |
| PVE 版本 | `PVE_VERSION_DETECTED`, `PVE_MAJOR_VERSION` | 运行时检测结果 |
| 安全 | `RISK_ACK_BYPASS`, `DEBUG_MODE`, `LEGAL_VERSION` | 风险控制标志 |

### core.sh -- 核心工具函数（约 505 行）

| 函数 | 说明 |
|---|---|
| `setup_colors()` | 颜色系统初始化，遵循 no-color.org（设置 `NO_COLOR` 即禁色） |
| `log_info()`, `log_warn()`, `log_error()`, `log_step()`, `log_success()`, `log_tips()` | 统一日志（带时间戳，写入 `/var/log/pve-tools.log`） |
| `display_error()`, `display_success()` | 增强错误/成功反馈（均不内置 pause，由菜单框架统一节奏） |
| `confirm_action()` | 轻档确认（输入 'yes'），用于可逆配置写入 |
| `confirm_high_risk_action()` | 重档确认（输入指定确认词），用于 GRUB/LVM/磁盘槽位等高危操作 |
| `vm_show_data_risk_banner()` | VM 数据风险横幅（每会话仅完整展示一次） |
| `ensure_legal_acceptance()` | 许可条款首次接受检查 |
| `backup_file()` | 配置文件备份到 `/var/backups/pve-tools/`，可回填备份路径 |
| `pve_tools_download_url()`, `pve_tools_download_file()` | curl/wget 封装的下载工具 |
| `pve_tools_choose_update_urls()`, `pve_tools_version_gt()` | 更新 URL 选择与版本比较（剥离预发布后缀） |
| `apply_block()`, `remove_block()` | marker 配置块写入/删除（`# PVE-TOOLS BEGIN/END <MARKER>`，写前自动备份、幂等） |
| `grub_has_param()`, `grub_add_param()`, `grub_remove_param()` | GRUB 内核参数查/增/删：数组化按 key 精确匹配，兼容 `key` 与 `key=value` 传参 |
| `show_status()` | 状态行反馈 |
| `pause_function()` | "按任意键继续..." |
| `show_menu_header()`, `show_menu_footer()`, `show_menu_option()` | 菜单 UI 三件套（被 menu.sh 框架复用） |

### menu.sh -- 统一菜单交互框架（约 186 行）

全项目菜单一致性的唯一事实来源，使用规范见根 CLAUDE.md「交互层规范」。

| 函数 | 说明 |
|---|---|
| `run_menu <标题> <渲染函数> <分发函数> <范围>` | 统一菜单循环：清屏/标题/渲染/统一 0 返回项/读取/EOF 与 Ctrl+C 守卫/分发/pause 节奏 |
| `menu_prompt <变量名> <范围>` | 统一读取；EOF/中断视为选 0（返回上级），杜绝死循环刷屏 |
| `prompt_value <变量名> <提示> [默认值] [校验函数]` | 单值输入：默认值统一 `[默认值]` 标注；无默认时空回车=取消(return 2) |
| `prompt_yes_no <提示> [默认]` | 是/否询问（EOF 一律按 no 保守处理） |
| `prompt_pick_from_list <变量名> <提示> <数组名>` | 编号列表选择器：0=返回(return 2)，与 `vm_select_*` 约定一致 |
| `show_report` | 长输出分页展示（tty + less 时走分页器，否则 cat） |
| 全局状态 | `MENU_DEPTH`（嵌套深度，决定返回文案）、`MENU_SKIP_PAUSE`（子菜单返回时跳过父层 pause） |

### network.sh -- 网络基础设施（约 444 行）

| 函数 | 说明 |
|---|---|
| `detect_network_region()` | Cloudflare Trace 检测用户地区（CN 自动启用镜像） |
| `fetch_session_tip()` | 一言 API 获取会话提示 |
| `network_show_diagnostics()`, `network_can_access_internet()`, `network_offline_guard()` | 网络诊断/连通性/离线守卫 |
| `disable_ups_service()`, `enable_ups_service()`, `show_ups_diagnostics()` | NUT UPS 服务管理（菜单入口在 01 模块顶级项） |
| `show_banner()` | 启动横幅显示 |
| `mirror_*()` 系列 | 镜像注册表查询/选择状态管理 |
| `select_mirror()`, `select_mirror_unified()`, `select_mirror_per_source()`, `select_mirror_for_source()` | 镜像选择交互（"单选即退"选择器语义，未套 run_menu 属有意设计） |

### runtime.sh -- 运行时守卫与主入口（约 232 行）

| 函数 | 说明 |
|---|---|
| `check_root()` | root 权限检查 |
| `check_debug_mode()` | 解析 `--i-know-what-i-do` 和 `--debug` 参数 |
| `check_pve_version()` | PVE 版本检测（非 PVE9 环境需确认风险，拦截高危自动化） |
| `block_non_pve9_destructive()` | 非 PVE9 环境拦截换源/升级等破坏性操作 |
| `show_menu()` | 主菜单（10 个功能入口 + 一言 Tips） |
| `main()` | **脚本主入口**：trap INT（Ctrl+C 中断当前输入回上级而非杀进程）-> 权限/许可/调试/PVE 版本/网络检查 -> 更新检查 -> 主循环（read 带 EOF 守卫优雅退出；子菜单返回不重复 pause） |

## 关键依赖与配置

- **运行环境**: Proxmox VE 9.x (Debian 13 Trixie)，root 权限
- **外部依赖**: `curl` 或 `wget`（网络操作）
- **加载顺序严格**: `config.sh` 定义全局变量必须最先；`runtime.sh` 含 `main()` 必须最后；`menu.sh` 在 `core.sh` 之后（复用其 UI 三件套与 pause）
- **全局变量**: 大写变量为全局，`src/modules/` 中所有脚本可直接访问

## 测试与质量

- **语法检查**: `bash -n` 对每个 `lib/*.sh`
- **静态分析**: CI 对 lib/ 全量执行 `shellcheck --severity=error`
- **行为验证**: 菜单框架的 EOF/返回节奏可用管道按键序列冒烟（见根 CLAUDE.md 测试策略）

## 常见问题 (FAQ)

**Q: 为什么加载顺序很重要？**
`config.sh` 定义全局变量；`core.sh` 的颜色/日志/UI 被后续所有文件使用；`menu.sh` 依赖 core 的 UI 三件套；`runtime.sh` 的 `main()` 调用前面所有层。函数定义顺序本身不影响 bash 运行，但变量初始化（如 `setup_colors` 在 source 时执行）有先后依赖。

**Q: 可以在 src/modules/ 中重新加载 lib 文件吗？**
不需要。所有入口在加载任何模块之前已经 source 了全部 lib 文件。

**Q: config.sh 中新增镜像源如何操作？**
在每个并行数组末尾追加对应元素即可，`MIRROR_*` 数组索引一一对应。

## 相关文件清单

```
lib/
  config.sh                       # 全局变量与常量（~259 行）
  core.sh                         # 核心工具函数（~505 行）
  menu.sh                         # 统一菜单交互框架（~186 行）
  network.sh                      # 网络检测与镜像选择（~444 行）
  runtime.sh                      # 运行时守卫与 main()（~232 行）
```

## 变更记录 (Changelog)

| 日期 | 变更 |
|---|---|
| 2026-07-26 | 新增 menu.sh 菜单框架；display_error 去内置 pause；grub 参数函数数组化并新增 grub_has_param；main() 加 trap INT 与 EOF 守卫；移除死代码 check_packages/show_progress/update_progress/show_progress_bar；行数与函数索引按现实修正 |
| 2026-07-08 | 初始化 lib 模块 CLAUDE.md（模块化重构新增模块） |
