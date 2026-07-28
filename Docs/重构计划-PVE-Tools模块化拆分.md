# PVE-Tools 模块化重构计划

> 基于 PVE-Tools.sh (v9.0.0 "Evanescia", 14,716 行, 223 个函数) 的完整分析

---

## 目录

1. [目标与约束](#1-目标与约束)
2. [最终目录结构](#2-最终目录结构)
3. [lib/ 基础设施层 — 函数归属](#3-lib-基础设施层--函数归属)
4. [modules/ 功能模块 — 函数归属](#4-modules-功能模块--函数归属)
5. [全局变量提取策略](#5-全局变量提取策略)
6. [build.sh 实现](#6-buildsh-实现)
7. [release.yml 改动](#7-releaseyml-改动)
8. [dev.sh 开发入口](#8-devsh-开发入口)
9. [迁移步骤](#9-迁移步骤)
10. [附录：跨模块依赖图](#10-附录跨模块依赖图)

---

## 1. 目标与约束

### 目标
- 单文件 → 多文件开发，编译 → 单文件 + 二进制发布
- 新增功能只需建目录 + 写文件 + case 加一行
- 用户侧零感知（URL、使用方式、行为不变）

### 约束
- 开发时：`bash PVE-Tools.sh` 直接 source 模块运行
- 构建时：`bash build.sh` → `dist/PVE-Tools.sh` + `shc` → `pve-tools`
- 发布时：Release Assets 含 `pve-tools` + `dist/PVE-Tools.sh`
- 必须保持 `bash <(curl -sSL ...)` 兼容

---

## 2. 最终目录结构

```
PVE-Tools-9/
├── PVE-Tools.sh              # 入口脚本：source 全部 + main()
├── dev.sh                    # [新增] 开发运行入口
├── build.sh                  # [新增] 编译构建脚本
├── VERSION                   # 版本号 (不变)
├── UPDATE                    # 更新日志 (不变)
│
├── lib/                      # 基础设施层 — 零业务逻辑
│   ├── config.sh             #   全局变量：MIRROR_* / URL / 路径常量 / 版本
│   ├── core.sh               #   颜色 / 日志 / UI 装饰 / 确认 / 备份 / 进度条
│   ├── network.sh            #   网络检测 / 镜像选择 / 离线模式
│   └── runtime.sh            #   运行时守卫：root 检查 / 调试模式 / RISK_ACK_BYPASS
│
├── src/
│   └── modules/
│   ├── 01-optimization/      # 菜单1: 日常优化与通知
│   │   ├── init.sh
│   │   ├── popup.sh
│   │   ├── tune.sh
│   │   ├── cpupower.sh
│   │   ├── temperature.sh
│   │   └── email.sh
│   │
│   ├── 02-sources/           # 菜单2: 软件源与系统升级
│   │   ├── init.sh
│   │   ├── mirrors.sh
│   │   ├── update.sh
│   │   └── upgrade-pve.sh
│   │
│   ├── 03-boot-kernel/       # 菜单3: 启动与内核管理
│   │   ├── init.sh
│   │   ├── kernel.sh
│   │   └── grub.sh
│   │
│   ├── 04-gpu-passthrough/   # 菜单4: 硬件直通与显卡 (大模块)
│   │   ├── init.sh
│   │   ├── iommu.sh
│   │   ├── intel-sriov.sh
│   │   ├── intel-gvtg.sh
│   │   ├── intel-legacy.sh
│   │   ├── igpu-shared.sh
│   │   ├── nvidia.sh
│   │   ├── amd-dgpu.sh
│   │   ├── amd-igpu.sh
│   │   ├── rdm.sh
│   │   ├── controller.sh
│   │   └── boot-assist.sh
│   │
│   ├── 05-vm-container/      # 菜单5: 虚拟机运维与导入 (大模块)
│   │   ├── init.sh
│   │   ├── fastpve.sh
│   │   ├── schedule.sh
│   │   ├── img-import.sh
│   │   ├── storage-helper.sh
│   │   ├── backup.sh
│   │   ├── restore.sh
│   │   ├── config-io.sh
│   │   ├── clone.sh
│   │   ├── snapshot.sh
│   │   ├── disk.sh
│   │   ├── network.sh
│   │   ├── cloudinit.sh
│   │   ├── migrate.sh
│   │   └── garbage-cleanup.sh
│   │
│   ├── 06-networking/        # 菜单6: 宿主机网络与防火墙 (大模块)
│   │   ├── init.sh
│   │   ├── bridge.sh
│   │   ├── vlan.sh
│   │   ├── bond.sh
│   │   ├── addressing.sh
│   │   ├── interface.sh
│   │   ├── mac-bind.sh
│   │   ├── firewall.sh
│   │   ├── ipv6-helper.sh
│   │   └── diagnostic.sh
│   │
│   ├── 07-storage-disk/      # 菜单7: 存储与磁盘维护
│   │   ├── init.sh
│   │   ├── query.sh
│   │   ├── mount.sh
│   │   ├── local-lvm.sh
│   │   ├── ceph.sh
│   │   └── swap.sh
│   │
│   ├── 08-tools-about/       # 菜单8: 诊断工具与项目信息
│   │   ├── init.sh
│   │   ├── sysinfo.sh
│   │   └── self-update.sh
│   │
│   ├── 09-security/          # 菜单9: 安全中心
│   │   ├── init.sh
│   │   ├── audit.sh
│   │   └── ssh-hardening.sh
│   │
│   └── 10-third-party/       # 菜单10: 第三方工具
│       ├── init.sh
│       ├── marketplace.sh
│       ├── coolercontrol.sh
│       └── community.sh
│
├── dist/                     # [新增] 构建产物
├── .github/workflows/
│   └── release.yml           # [修改] 加 bash build.sh 步骤
│
└── Docs/
    └── 重构计划-PVE-Tools模块化拆分.md  # [新增] 本文件
```

---

## 3. lib/ 基础设施层 — 函数归属

### 3.1 `lib/config.sh` — 全局变量

**来源：原行 1-298**

提取所有全局变量，**不包含任何函数定义**：

```bash
# === 版本信息 ===
CURRENT_VERSION="9.0.0"
BUILD_NICKNAME="Evanescia"
VERSION_FILE_URL="https://raw.githubusercontent.com/PVE-Tools/PVE-Tools-9/main/VERSION"
UPDATE_FILE_URL="https://raw.githubusercontent.com/PVE-Tools/PVE-Tools-9/main/UPDATE"
PVE_TOOLS_SCRIPT_URL="https://raw.githubusercontent.com/PVE-Tools/PVE-Tools-9/main/PVE-Tools.sh"
PVE_VERSION_DETECTED=""
PVE_MAJOR_VERSION=""
RISK_ACK_BYPASS=false

# === 镜像源注册表（并行数组） ===
MIRROR_NAMES=()
MIRROR_IDS=()
MIRROR_DEBIAN_URIS=()
# ... 全部 20+ 个镜像源条目
MIRROR_SELECTED_DEBIAN=-1
MIRROR_SELECTED_SECURITY=-1
# ...

# === 网络检测 ===
CF_TRACE_URL="https://www.cloudflare.com/cdn-cgi/trace"
GITHUB_MIRROR_PREFIX="https://ghfast.top/"
USE_MIRROR_FOR_UPDATE=0
USER_COUNTRY_CODE=""
NETWORK_MODE="auto"
IS_OFFLINE_MODE=0

# === URL 常量 ===
FASTPVE_INSTALLER_URL="..."
FASTPVE_PROJECT_URL="..."
THIRD_PARTY_MODULES_TREE_API_MAIN_URL="..."
THIRD_PARTY_MODULES_RAW_BASE_URL="..."
COOLERCONTROL_PROJECT_URL="..."
NVIDIA_ASSETS_BASE_URL="..."
NVIDIA_VGPU_UNLOCK_SO_URL="..."

# === 路径常量 ===
VM_CONFIG_EXPORT_DIR="/var/lib/pve-tools/vm-config-exports"
VM_BACKUP_CRON_FILE="/etc/cron.d/pve-tools-vm-backup"
HOST_NETWORK_INTERFACES_FILE="/etc/network/interfaces"
HOST_NETWORK_INTERFACES_STAGED_FILE="/etc/network/interfaces.new"
HOST_NETWORK_EXPORT_DIR="/var/lib/pve-tools/network-firewall-exports"
PVE_CLUSTER_FIREWALL_FILE="/etc/pve/firewall/cluster.fw"
PVE_KVM_ROM_DIR="/usr/share/kvm"

# === 安全扫描 ===
SECURITY_HIGH_COUNT=0
SECURITY_MEDIUM_COUNT=0
SECURITY_LOW_COUNT=0
```

### 3.2 `lib/core.sh` — 基础设施函数

**来源：原行 24-59（颜色系统）、300-740（日志/UI/确认/备份/GRUB/进度）**

| 函数 | 原行号 | 依赖 |
|------|--------|------|
| `setup_colors()` | 27-56 | 无（纯 ANSI） |
| `log_info()` | 301-305 | 颜色变量 |
| `log_warn()` | 307-311 | 颜色变量 |
| `log_error()` | 313-317 | 颜色变量 |
| `log_step()` | 319-323 | 颜色变量 |
| `log_success()` | 325-329 | 颜色变量 |
| `log_tips()` | 331-335 | 颜色变量 |
| `display_error()` | 338-345 | `log_error`, `pause_function` |
| `display_success()` | 348-356 | `log_success` |
| `confirm_action()` | 359-371 | — |
| `confirm_high_risk_action()` | 373-395 | `UI_DIVIDER` |
| `vm_show_data_risk_banner()` | 397-404 | `UI_DIVIDER` |
| `ensure_legal_acceptance()` | 409-439 | `show_menu_header`, `log_success`, `UI_DIVIDER` |
| `backup_file()` | 444-477 | `log_error/warn/success`, `date` |
| `pve_tools_download_url()` | 479-494 | `curl`/`wget` |
| `pve_tools_download_file()` | 496-512 | `curl`/`wget` |
| `pve_tools_choose_update_urls()` | 514-533 | `detect_network_region`, `USER_COUNTRY_CODE` |
| `pve_tools_version_gt()` | 535-541 | `sort -V` |
| `apply_block()` | 544-568 | `backup_file`, `remove_block` |
| `remove_block()` | 572-590 | `sed` |
| `grub_add_param()` | 598-635 | `backup_file` |
| `grub_remove_param()` | 639-669 | `backup_file` |
| `show_progress()` | 674-689 | — |
| `update_progress()` | 691-699 | `SPINNER_PID` |
| `show_status()` | 702-727 | 颜色变量 |
| `show_progress_bar()` | 730-746 | — |
| `show_menu_header()` | 11972-11977 | `UI_BORDER`, `H2` |
| `show_menu_footer()` | 11979-11981 | `UI_FOOTER` |
| `show_menu_option()` | 11983-11992 | `H2`, `PRIMARY` |
| `pause_function()` | 2121-2128 | — |
| `display_error()` | 338-345 | `log_error`, `pause_function` |
| `display_success()` | 348-356 | `log_success` |

**共 28 个函数 → 全部放入 `lib/core.sh`**

### 3.3 `lib/network.sh` — 网络检测基础设施

**来源：原行 748-970（网络检测）+ 11995-12209（镜像选择）**

| 函数 | 原行号 | 说明 |
|------|--------|------|
| `detect_network_region()` | 749-776 | Cloudflare Trace 检测 CN |
| `fetch_session_tip()` | 778-826 | 一言 API |
| `network_show_diagnostics()` | 828-838 | IP/路由/DNS |
| `network_can_access_internet()` | 840-851 | curl 连通性检测 |
| `network_offline_guard()` | 853-877 | 离线模式入口 |
| `disable_ups_service()` | 879-904 | NUT 关闭 |
| `enable_ups_service()` | 906-924 | NUT 开启 |
| `show_ups_diagnostics()` | 926-968 | NUT 诊断 |
| `mirror_uri_by_type()` | 11995-12007 | 镜像 URI 查询 |
| `mirror_set_selected()` | 12009-12021 | 选中镜像 |
| `mirror_reset_selection()` | 12023-12029 | 重置 |
| `mirror_selection_complete()` | 12031-12037 | 校验完成 |
| `mirror_selected_index_by_type()` | 12039-12050 | 索引查询 |
| `mirror_source_label()` | 12052-12063 | 标签文本 |
| `mirror_print_selection_summary()` | 12065-12080 | 打印汇总 |
| `mirror_print_recommendation_notice()` | 12082-12086 | 推荐提示 |
| `select_mirror_for_source()` | 12088-12125 | 单源选择 |
| `select_mirror_unified()` | 12127-12169 | 统一选择 |
| `select_mirror_per_source()` | 12171-12184 | 逐源选择 |
| `select_mirror()` | 12186-12207 | 选择入口 |
| `show_banner()` | 971-989 | 横幅 |

**共 21 个函数 → 全部放入 `lib/network.sh`**

### 3.4 `lib/runtime.sh` — 运行时守卫（新增，计划未覆盖）

**来源：重构过程中提取的运行时基础设施建设**

| 函数 | 说明 |
|------|------|
| `check_root()` | root 权限守卫，非 root 直接退出 |
| `check_debug_mode()` | 解析 `--i-know-what-i-do`、`--debug` 参数，设置 `RISK_ACK_BYPASS` |

**共 2 个函数 → 全部放入 `lib/runtime.sh`**

---

## 4. src/modules/ 功能模块 — 函数归属

### 4.1 `01-optimization/` — 日常优化与通知

**init.sh** — 菜单入口
| 函数名 | 原行号 |
|--------|--------|
| `menu_01_optimization()` | 6121-6147 |

**tune.sh** — 一键优化
| 函数名 | 原行号 | 依赖的全局变量 |
|--------|--------|---------------|
| `quick_setup()` | 11956-11969 | — |

**popup.sh** — 删除订阅弹窗
| 函数名 | 原行号 | 修改的系统文件 |
|--------|--------|---------------|
| `remove_subscription_popup()` | 1976-2009 | `proxmoxlib.js`, `pveproxy.service` |
| `reinstall_pve_webui_packages()` | 2011-2021 | `apt-get --reinstall` |
| `restore_proxmoxlib()` | 2024-2033 | — |

**cpupower.sh** — CPU 电源模式（原 3149-4310, ~1200 行）
| 函数名 | 原行号 | 说明 |
|--------|--------|------|
| `cpupower()` | 3149-3214 | CPU 模式菜单 |
| `cpupower_add()` | 3217-3237 | 添加节能模式 |
| `cpupower_del()` | 3240-3254 | 删除节能模式 |
| `cpu_add()` | 3259-4088 | 温度监控安装（含 CPU 补丁、sensors） |
| `cpu_del()` | 4090-4108 | 温度监控卸载 |
| `show_grub_config()` | 4113-4172 | GRUB 查看 |
| `backup_grub_with_note()` | 4175-4214 | GRUB 备份 |
| `list_grub_backups()` | 4217-4252 | 列出备份 |
| `restore_grub_backup()` | 4255-4305 | 恢复备份 |

**temperature.sh** — 温度监控
| 函数名 | 原行号 |
|--------|--------|
| `temp_monitoring_menu()` | 12955-12990 |

**email.sh** — 邮件通知
| 函数名 | 原行号 |
|--------|--------|
| `pve_mail_send_test()` | 1132-1150 |
| `pve_mail_configure_postfix_smtp()` | 1152-1204 |
| `pve_mail_configure_datacenter_emails()` | 1206-1226 |
| `pve_mail_configure_zed_mail()` | 1228-1254 |
| `pve_mail_notification_setup()` | 1256-1379 |

---

### 4.2 `02-sources/` — 软件源与系统升级

**init.sh**
| 函数名 | 原行号 |
|--------|--------|
| `menu_02_sources_updates()` | 6150-6170 |

**mirrors.sh**
| 函数名 | 原行号 | 修改的文件 |
|--------|--------|-----------|
| `change_sources()` | 1867-1973 | `/etc/apt/sources.list`, 各 PVE 源 |

**update.sh**
| 函数名 | 原行号 |
|--------|--------|
| `update_system()` | 2104-2118 |

**upgrade-pve.sh**
| 函数名 | 原行号 |
|--------|--------|
| `pve8_to_pve9_upgrade()` | 5800-6038 |

---

### 4.3 `03-boot-kernel/` — 启动与内核管理

**init.sh**
| 函数名 | 原行号 |
|--------|--------|
| `menu_03_boot_kernel()` | 6173-6216 |

**kernel.sh**
| 函数名 | 原行号 |
|--------|--------|
| `get_installed_kernel_packages()` | 1382-1391 |
| `get_available_kernel_packages_raw()` | 1394-1420 |
| `kernel_package_is_valid()` | 1422-1425 |
| `kernel_package_release_from_name()` | 1427-1436 |
| `kernel_package_normalize_input()` | 1438-1468 |
| `check_kernel_version()` | 1471-1503 |
| `get_available_kernels()` | 1506-1533 |
| `install_kernel()` | 1536-1595 |
| `set_default_kernel()` | 1635-1681 |
| `remove_old_kernels()` | 1684-1729 |
| `kernel_management_menu()` | 1732-1799 |
| `sync_kernel_update()` | 1802-1863 |

**grub.sh**
| 函数名 | 原行号 |
|--------|--------|
| `update_grub_config()` | 1598-1632 |

---

### 4.4 `04-gpu-passthrough/` — 硬件直通与显卡 (最大模块之一)

**init.sh**
| 函数名 | 原行号 |
|--------|--------|
| `menu_04_gpu_passthrough()` | 6219-6246 |
| `menu_disk_controller_passthrough()` | 2247-2270 |

**iommu.sh** — IOMMU 基础设施
| 函数名 | 原行号 |
|--------|--------|
| `iommu_is_enabled()` | 2561-2575 |
| `enable_pass()` | 2134-2176 |
| `disable_pass()` | 2179-2210 |
| `hw_passth()` | 2213-2243 |
| `parse_pci_bdf_from_udev_path()` | 2578-2585 |
| `get_blockdev_pci_bdf()` | 2588-2601 |
| `get_system_whole_disks()` | 2604-2646 |
| `get_protected_pci_bdfs()` | 2649-2663 |
| `list_storage_controllers()` | 2666-2668 |
| `list_nvme_controllers()` | 2671-2673 |
| `show_disks_under_pci_bdf()` | 2676-2699 |

**intel-sriov.sh**
| 函数名 | 原行号 |
|--------|--------|
| `igpu_sriov_setup()` | 4336-4607 |

**intel-gvtg.sh**
| 函数名 | 原行号 |
|--------|--------|
| `igpu_gvtg_setup()` | 4610-4762 |

**intel-legacy.sh**
| 函数名 | 原行号 |
|--------|--------|
| `intel_gpu_passthrough()` | 13080-13357 |
| `restore_qemu_kvm()` | 13035-13077 |

**igpu-shared.sh** — iGPU 共享函数（重构中提取为独立文件）
| 函数名 | 原行号 |
|--------|--------|
| `igpu_management_menu_simple()` | 4311-4333 |
| `igpu_management_menu()` | 5006-5080 |
| `restore_igpu_config()` | 4765-4824 |
| `igpu_verify()` | 4827-4925 |
| `igpu_remove()` | 4928-5003 |

**nvidia.sh**
| 函数名 | 原行号 |
|--------|--------|
| `nvidia_t()` | 13360-13380 |
| `nvidia_get_cols()` | 13382-13384 |
| `nvidia_trunc()` | 13386-13398 |
| `nvidia_list_vms()` | 13400-13402 |
| `nvidia_list_nvidia_gpus()` | 13404-13406 |
| `nvidia_get_pci_ids()` | 13408-13411 |
| `nvidia_pci_has_function()` | 13413-13419 |
| `nvidia_pci_kernel_driver()` | 13421-13424 |
| `nvidia_select_vmid()` | 13426-13464 |
| `nvidia_select_gpu_bdf()` | 13466-13512 |
| `nvidia_show_passthrough_status()` | 13514-13521 |
| `nvidia_try_write_vfio_ids_conf()` | 13523-13543 |
| `nvidia_gpu_passthrough_vm()` | 13545-13688 |
| `nvidia_driver_info()` | 13690-13717 |
| `nvidia_driver_export_report()` | 13719-13747 |
| `nvidia_driver_info_menu()` | 13749-13766 |
| `nvidia_apt_has_pkg()` | 13768-13771 |
| `nvidia_driver_switch_to_proprietary()` | 13773-13794 |
| `nvidia_driver_switch_to_open()` | 13796-13814 |
| `nvidia_restore_latest_backup_file()` | 13816-13839 |
| `nvidia_driver_rollback()` | 13841-13871 |
| `nvidia_driver_switch_menu()` | 13873-13894 |
| `nvidia_host_prepare_for_passthrough()` | 13896-13956 |
| `nvidia_setup_vgpu_unlock()` | 13958-14037 |
| `nvidia_gpu_management_menu()` | 14039-14064 |

**amd-dgpu.sh**
| 函数名 | 原行号 |
|--------|--------|
| `amd_list_gpus()` | 14066-14068 |
| `amd_select_gpu_bdf()` | 14070-14118 |
| `amd_try_write_vfio_ids_conf()` | 14120-14140 |
| `amd_host_prepare_for_passthrough()` | 14142-14207 |
| `amd_gpu_passthrough_vm()` | 14209-14344 |
| `amd_gpu_management_menu()` | 14597-14616 |

**amd-igpu.sh**
| 函数名 | 原行号 |
|--------|--------|
| `amd_list_romfiles()` | 14346-14351 |
| `amd_normalize_romfile_input()` | 14353-14391 |
| `amd_prompt_romfile_basename()` | 14393-14417 |
| `amd_igpu_show_guidance()` | 14419-14435 |
| `amd_igpu_check_romfile()` | 14437-14451 |
| `amd_igpu_passthrough_vm()` | 14453-14595 |
| `amd_igpu_management_menu()` | 14618-14641 |

**rdm.sh** — 单盘直通
| 函数名 | 原行号 |
|--------|--------|
| `get_qm_conf_path()` | 2275-2278 |
| `validate_qm_vmid()` | 2281-2292 |
| `rdm_discover_whole_disks()` | 2299-2364 |
| `rdm_find_free_slot()` | 2367-2396 |
| `rdm_single_disk_attach()` | 2399-2489 |
| `rdm_single_disk_detach()` | 2492-2556 |

**controller.sh** — PCIe/NVMe 直通
| 函数名 | 原行号 |
|--------|--------|
| `qm_is_q35_machine()` | 2702-2710 |
| `qm_find_free_hostpci_index()` | 2713-2727 |
| `qm_has_hostpci_bdf()` | 2730-2734 |
| `storage_controller_passthrough()` | 2737-2828 |
| `nvme_should_enable_msix_relocation()` | 2831-2839 |
| `qm_get_args()` | 2842-2845 |
| `qm_append_args()` | 2848-2870 |
| `nvme_passthrough()` | 2873-2985 |

**boot-assist.sh** — 引导配置辅助
| 函数名 | 原行号 |
|--------|--------|
| `resolve_whole_disk()` | 2990-3022 |
| `detect_disk_boot_mode()` | 3025-3067 |
| `boot_config_assistant()` | 3070-3143 |

---

### 4.5 `05-vm-container/` — 虚拟机运维与导入 (最大模块之二)

**init.sh**
| 函数名 | 原行号 |
|--------|--------|
| `menu_05_vm_container()` | 9389-9411 |
| `vm_advanced_operations_menu()` | 9356-9387 |

**fastpve.sh**
| 函数名 | 原行号 |
|--------|--------|
| `fastpve_quick_download_menu()` | 5184-5283 |

**schedule.sh** — 定时开关机
| 函数名 | 原行号 |
|--------|--------|
| `manage_vm_schedule()` | 6249-6342 |

**img-import.sh** — IMG 导入
| 函数名 | 原行号 |
|--------|--------|
| `img_bytes_to_human()` | 6344-6357 |
| `img_discover_img_files()` | 6359-6361 |
| `img_select_img_file()` | 6363-6408 |
| `img_select_vmid()` | 6410-6448 |
| `img_select_storage()` | 6450-6490 |
| `img_convert_and_import_to_vm()` | 6492-6640 |
| `img_convert_import_menu()` | 6642-6650 |

**storage-helper.sh** — 存储辅助函数
| 函数名 | 原行号 |
|--------|--------|
| `pve_tools_human_bytes()` | 6793-6800 |
| `pve_storage_status_records()` | 6802-6804 |
| `pve_storage_config_value()` | 6806-6821 |
| `pve_storage_file_backend()` | 6823-6830 |
| `pve_storage_mount_path()` | 6832-6851 |
| `pve_storage_content_subdir()` | 6853-6866 |
| `pve_storage_content_dir_override()` | 6868-6885 |
| `pve_storage_content_path()` | 6887-6897 |
| `pve_storage_list_content_paths()` | 6899-6909 |
| `pve_storage_usage_text()` | 6911-6923 |
| `pve_storage_find_owner_by_path()` | 6925-6942 |
| `vm_storage_supports_content()` | 7147-7154 |
| `vm_list_storages_by_content()` | 7156-7164 |
| `vm_select_storage_by_content()` | 7166-7197 |

**backup.sh** — VM 备份
| 函数名 | 原行号 |
|--------|--------|
| `vm_require_commands()` | 6654-6667 |
| `vm_validate_new_vmid()` | 6669-6687 |
| `vm_list_vm_records()` | 6689-6691 |
| `vm_show_vm_records()` | 6693-6700 |
| `vm_normalize_vmid_input()` | 6702-6704 |
| `vm_collect_target_vmids()` | 6706-6753 |
| `vm_validate_backup_compress()` | 6755-6764 |
| `vm_validate_backup_mode()` | 6766-6775 |
| `vm_validate_backup_keep_last()` | 6777-6783 |
| `vm_validate_backup_storage_name()` | 6785-6791 |
| `vm_discover_backup_archives()` | 7361-7369 |
| `vm_discover_all_backup_archives()` | 7371-7382 |
| `vm_backup_archive_guest_type()` | 7384-7392 |
| `vm_backup_archive_vmid()` | 7394-7398 |
| `vm_backup_transfer_guide()` | 7400-7447 |
| `vm_select_backup_archive()` | 7971-8003 |
| `vm_backup_create()` | 8144-8212 |
| `vm_schedule_add_backup_job()` | 8214-8304 |
| `vm_schedule_remove_backup_job()` | 8305-8335 |
| `vm_schedule_backup_menu()` | 8337-8363 |
| `vm_backup_restore_menu()` | 8421-8445 |

**restore.sh** — VM 恢复
| 函数名 | 原行号 |
|--------|--------|
| `vm_restore_from_backup()` | 8365-8419 |
| `vm_config_io_menu()` | 8598-8618 |
| `vm_export_config()` | 8447-8470 |
| `vm_import_config()` | 8472-8597 |

**clone.sh** — VM 克隆
| 函数名 | 原行号 |
|--------|--------|
| `vm_convert_to_template()` | 8619-8644 |
| `vm_clone_vm()` | 8646-8695 |

**cloudinit.sh** — Cloud-Init
| 函数名 | 原行号 |
|--------|--------|
| `vm_ensure_cloudinit_drive()` | 8103-8125 |
| `vm_validate_cicustom_volumes()` | 8127-8143 |
| `vm_cloudinit_configure_for_vmid()` | 8697-8756 |
| `vm_cloudinit_configure()` | 8758-8765 |
| `vm_cloud_image_to_template()` | 8767-8835 |
| `vm_template_cloudinit_menu()` | 8837-8865 |

**snapshot.sh** — VM 快照
| 函数名 | 原行号 |
|--------|--------|
| `vm_get_snapshot_names()` | 8045-8048 |
| `vm_select_snapshot_name()` | 8050-8070 |
| `vm_create_snapshot()` | 9025-9052 |
| `vm_list_snapshots()` | 9054-9065 |
| `vm_delete_snapshot()` | 9067-9089 |
| `vm_rollback_snapshot()` | 9091-9113 |
| `vm_snapshot_menu()` | 9115-9139 |

**disk.sh** — VM 磁盘管理
| 函数名 | 原行号 |
|--------|--------|
| `vm_find_free_disk_slot()` | 7228-7252 |
| `vm_select_disk_slot()` | 7268-7289 |
| `vm_resize_disk()` | 8866-8892 |
| `vm_add_disk()` | 8894-8933 |
| `vm_remove_disk()` | 8935-8959 |
| `vm_move_disk()` | 8961-8997 |
| `vm_disk_management_menu()` | 8999-9023 |

**network.sh** — VM 网络
| 函数名 | 原行号 |
|--------|--------|
| `vm_find_free_net_index()` | 7254-7266 |
| `vm_select_net_slot()` | 7291-7312 |
| `vm_get_qm_value()` | 7314-7318 |
| `vm_is_template()` | 7320-7323 |
| `vm_network_strip_mac()` | 7325-7327 |
| `vm_network_set_option()` | 7329-7338 |
| `vm_network_remove_option()` | 7340-7344 |
| `vm_detect_image_format()` | 7346-7349 |
| `vm_discover_disk_image_files()` | 7351-7359 |
| `vm_configure_startup_policy()` | 9141-9163 |
| `vm_add_network()` | 9165-9194 |
| `vm_remove_network()` | 9196-9217 |
| `vm_modify_network()` | 9219-9252 |
| `vm_startup_network_menu()` | 9254-9278 |

**migrate.sh** — VM 迁移
| 函数名 | 原行号 |
|--------|--------|
| `vm_list_cluster_nodes()` | 7199-7203 |
| `vm_select_target_node()` | 7205-7226 |
| `vm_cluster_migrate()` | 9280-9354 |

**garbage-cleanup.sh** — 垃圾清理
| 函数名 | 原行号 |
|--------|--------|
| `pve_guest_exists()` | 7449-7468 |
| `garbage_cleanup_sum_sizes()` | 7470-7472 |
| `garbage_cleanup_count_records()` | 7474-7476 |
| `garbage_cleanup_temp_file_candidates()` | 7478-7491 |
| `garbage_cleanup_pve_tools_old_file_candidates()` | 7493-7503 |
| `garbage_cleanup_print_file_records()` | 7505-7516 |
| `garbage_cleanup_delete_file_records()` | 7518-7553 |
| `garbage_cleanup_basic()` | 7555-7615 |
| `garbage_cleanup_backup_candidates()` | 7617-7652 |
| `garbage_cleanup_print_backup_records()` | 7654-7665 |
| `garbage_cleanup_delete_backup_records()` | 7667-7703 |
| `garbage_cleanup_prune_backups()` | 7705-7747 |
| `garbage_cleanup_snapshot_candidates()` | 7749-7777 |
| `garbage_cleanup_prune_snapshots()` | 7779-7846 |
| `garbage_cleanup_collect_referenced_volumes()` | 7848-7853 |
| `garbage_cleanup_orphan_disk_report()` | 7855-7903 |
| `garbage_cleanup_scan_report()` | 7905-7940 |
| `garbage_cleanup_menu()` | 7942-7969 |

**vm-helper.sh** — 杂项辅助
| 函数名 | 原行号 |
|--------|--------|
| `vm_list_template_records()` | 8072-8081 |
| `vm_show_template_records()` | 8083-8092 |
| `vm_ensure_vm_config_backup()` | 8094-8101 |
| `vm_discover_export_files()` | 8005-8009 |
| `vm_select_export_file()` | 8011-8043 |
| `vm_network_strip_mac()` 已在 network.sh 中 | — |

---

### 4.6 `06-networking/` — 宿主机网络与防火墙 (最大模块之三)

**init.sh**
| 函数名 | 原行号 |
|--------|--------|
| `menu_06_host_networking()` | 11848-11879 |
| `host_network_show_risk_banner()` | 9415-9421 |

**interface.sh** — 接口基础
| 函数名 | 原行号 |
|--------|--------|
| `host_network_ensure_interfaces_file()` | 9423-9430 |
| `host_network_get_all_interface_names()` | 9432-9438 |
| `host_network_get_configured_bridges()` | 9440-9443 |
| `host_network_get_configured_vlans()` | 9445-9448 |
| `host_network_get_configured_bonds()` | 9450-9453 |
| `host_network_guess_next_name()` | 9455-9465 |
| `host_network_validate_iface_name()` | 9467-9470 |
| `host_network_validate_mtu()` | 9472-9479 |
| `host_network_iface_exists()` | 10062-10065 |
| `host_network_interface_has_master_dependency()` | 10067-10079 |
| `host_network_show_current_overview()` | 10162-10184 |
| `host_network_select_from_text()` | 10119-10144 |
| `host_network_select_interface_name()` | 10146-10148 |
| `host_network_select_bridge_name()` | 10150-10152 |
| `host_network_select_bond_name()` | 10154-10156 |
| `host_network_select_vlan_name()` | 10158-10160 |

**addressing.sh** — IP 配置
| 函数名 | 原行号 |
|--------|--------|
| `host_network_validate_ipv4()` | 10011-10015 |
| `host_network_validate_ipv4_cidr()` | 10017-10024 |
| `host_network_validate_ipv6()` | 10026-10030 |
| `host_network_validate_ipv6_cidr()` | 10032-10039 |
| `host_network_validate_static_address()` | 10041-10049 |
| `host_network_validate_gateway()` | 10051-10060 |
| `host_network_validate_member_list()` | 10081-10118 |
| `host_network_collect_family_config()` | 10186-10266 |
| `host_network_extract_family_stanza()` | 10267-10287 |
| `host_network_collect_preserved_family_options()` | 10289-10304 |
| `host_network_remove_iface_family_from_candidate()` | 10306-10330 |
| `host_network_remove_iface_from_candidate()` | 10332-10373 |
| `host_network_ensure_auto_line_in_candidate()` | 10375-10381 |
| `host_network_append_text_to_candidate()` | 10383-10387 |
| `host_network_build_family_stanza()` | 10389-10409 |
| `host_network_build_bridge_block()` | 10411-10440 |
| `host_network_build_vlan_block()` | 10442-10467 |
| `host_network_build_bond_block()` | 10469-10507 |
| `host_network_commit_candidate()` | 10509-10574 |
| `host_network_configure_interface_addressing()` | 10872-10910 |

**bridge.sh**
| 函数名 | 原行号 |
|--------|--------|
| `host_network_create_bridge()` | 10575-10623 |
| `host_network_delete_bridge()` | 10624-10642 |
| `host_network_bridge_menu()` | 10644-10669 |

**vlan.sh**
| 函数名 | 原行号 |
|--------|--------|
| `host_network_create_vlan()` | 10695-10738 |
| `host_network_delete_vlan()` | 10739-10757 |
| `host_network_vlan_menu()` | 10759-10782 |

**bond.sh**
| 函数名 | 原行号 |
|--------|--------|
| `host_network_create_bond()` | 10784-10826 |
| `host_network_delete_bond()` | 10827-10845 |
| `host_network_bond_menu()` | 10847-10870 |

**mac-bind.sh** — MAC 绑定
| 函数名 | 原行号 |
|--------|--------|
| `host_network_get_iface_mac()` | 9481-9486 |
| `host_network_get_physical_ifaces_with_mac()` | 9488-9498 |
| `host_network_validate_mac()` | 9500-9503 |
| `host_network_mac_to_iface()` | 9505-9515 |
| `host_network_validate_systemd_link_name()` | 9517-9523 |
| `host_network_systemd_link_dir()` | 9525-9527 |
| `host_network_systemd_link_file_for_mac()` | 9529-9534 |
| `host_network_systemd_link_get_value()` | 9536-9564 |
| `host_network_systemd_link_file_has_binding()` | 9566-9578 |
| `host_network_systemd_link_list_managed_files()` | 9580-9585 |
| `host_network_systemd_link_find_conflicts()` | 9587-9610 |
| `host_network_systemd_link_write_binding()` | 9612-9674 |
| `host_network_systemd_link_remove_binding_by_mac()` | 9676-9697 |
| `host_network_legacy_udev_rules_file()` | 9699-9701 |
| `host_network_legacy_udev_list_bindings()` | 9703-9715 |
| `host_network_legacy_udev_name_conflicts()` | 9717-9737 |
| `host_network_legacy_udev_prune_binding()` | 9739-9776 |
| `host_network_interface_has_config_reference()` | 9778-9803 |
| `host_network_mac_binding_has_dependency()` | 9805-9809 |
| `host_network_show_mac_bindings()` | 9811-9852 |
| `host_network_create_mac_binding()` | 9854-9949 |
| `host_network_delete_mac_binding()` | 9951-10009 |
| `host_network_mac_binding_menu()` | 10671-10693 |

**firewall.sh** — PVE 防火墙
| 函数名 | 原行号 |
|--------|--------|
| `host_firewall_get_node_names()` | 10912-10914 |
| `host_firewall_select_node_name()` | 10916-10918 |
| `host_firewall_select_guest()` | 10920-10950 |
| `host_firewall_validate_group_name()` | 10952-10955 |
| `host_firewall_validate_identifier()` | 10957-10977 |
| `host_firewall_is_allowed_target_path()` | 10979-10989 |
| `host_firewall_target_path()` | 10991-11007 |
| `host_firewall_validate_ruleset_content_for_target()` | 11009-11017 |
| `host_firewall_prepare_group_section()` | 11019-11039 |
| `host_firewall_ensure_target_file()` | 11041-11052 |
| `host_firewall_upsert_option()` | 11054-11095 |
| `host_firewall_select_security_group()` | 11097-11128 |
| `host_firewall_get_security_groups()` | 11129-11132 |
| `host_firewall_get_group_section()` | 11134-11153 |
| `host_firewall_replace_group_section_in_file()` | 11155-11186 |
| `host_firewall_select_ruleset_target()` | 11188-11235 |
| `host_firewall_toggle_enable()` | 11237-11259 |
| `host_firewall_toggle_menu()` | 11261-11301 |
| `host_firewall_list_security_groups()` | 11303-11319 |
| `host_firewall_add_security_group_rule()` | 11321-11361 |
| `host_firewall_delete_security_group_rule()` | 11363-11409 |
| `host_firewall_show_target_rules()` | 11412-11429 |
| `host_firewall_export_ruleset()` | 11431-11474 |
| `host_firewall_import_ruleset()` | 11476-11543 |
| `host_firewall_menu()` | 11544-11572 |

**ipv6-helper.sh**
| 函数名 | 原行号 |
|--------|--------|
| `ipv6_helper_detect_host_readiness()` | 11574-11588 |
| `ipv6_helper_detect_vm_readiness()` | 11590-11604 |
| `ipv6_helper_configure_passthrough()` | 11606-11622 |
| `ipv6_helper_configure_nat6()` | 11624-11674 |
| `ipv6_helper_test_connectivity()` | 11675-11684 |
| `ipv6_helper_menu()` | 11686-11710 |

**diagnostic.sh** — 网络诊断工具箱
| 函数名 | 原行号 |
|--------|--------|
| `netdiag_require_cmd()` | 11712-11718 |
| `netdiag_run_traceroute()` | 11720-11726 |
| `netdiag_run_mtr()` | 11728-11734 |
| `netdiag_run_nmap()` | 11736-11742 |
| `netdiag_run_tcpdump()` | 11744-11756 |
| `netdiag_pick_vm_ip()` | 11758-11771 |
| `netdiag_check_port_connectivity()` | 11773-11808 |
| `netdiag_quick_stack_check()` | 11810-11819 |
| `netdiag_toolbox_menu()` | 11821-11846 |

---

### 4.7 `07-storage-disk/` — 存储与磁盘维护

**init.sh**
| 函数名 | 原行号 |
|--------|--------|
| `menu_07_storage_disk()` | 11882-11924 |

**query.sh**
| 函数名 | 原行号 |
|--------|--------|
| `pve_storage_location_panel()` | 6944-6991 |

**mount.sh**
| 函数名 | 原行号 |
|--------|--------|
| `pve_storage_mount_wizard_validate_storage_id()` | 6993-7004 |
| `pve_storage_mount_wizard_validate_mountpoint()` | 7006-7019 |
| `pve_storage_mount_wizard()` | 7021-7146 |

**local-lvm.sh**
| 函数名 | 原行号 |
|--------|--------|
| `merge_local_storage()` | 2036-2064 |

**ceph.sh**
| 函数名 | 原行号 |
|--------|--------|
| `pve9_ceph()` | 5084-5117 |
| `pve8_ceph()` | 5121-5154 |
| `remove_ceph()` | 5159-5178 |
| `ceph_management_menu()` | 12996-13032 |

**`cleanup.sh` 不创建，`garbage_cleanup_menu()` 归属 05-vm-container/garbage-cleanup.sh。**

**swap.sh**
| 函数名 | 原行号 |
|--------|--------|
| `remove_swap()` | 2067-2101 |

---

### 4.8 `08-tools-about/` — 诊断工具与项目信息

**init.sh**
| 函数名 | 原行号 |
|--------|--------|
| `menu_08_tools_about()` | 11927-11953 |
| `show_menu_rescue()` | 6087-6118 |

**sysinfo.sh**
| 函数名 | 原行号 |
|--------|--------|
| `show_system_info()` | 6041-6062 |

**`rescue.sh` 不创建，`restore_qemu_kvm()` 实际归属 04-gpu-passthrough/intel-legacy.sh，属于 GPU 直通恢复功能。**

**self-update.sh**
| 函数名 | 原行号 |
|--------|--------|
| `check_update()` | 12210-12312 |
| `pve_tools_local_update()` | 12314-12437 |
| `pve_tools_local_uninstall()` | 12439-12492 |

---

### 4.9 `09-security/` — 安全中心

**init.sh**
| 函数名 | 原行号 |
|--------|--------|
| `security_center_menu()` | 12933-12952 |

**audit.sh**
| 函数名 | 原行号 |
|--------|--------|
| `security_report_item()` | 12790-12807 |
| `security_pve_firewall_enabled()` | 12809-12819 |
| `security_list_public_listeners()` | 12821-12834 |
| `security_risk_check()` | 12836-12931 |

**ssh-hardening.sh**
| 函数名 | 原行号 |
|--------|--------|
| `security_ssh_service_name()` | 12494-12504 |
| `security_sshd_effective_option()` | 12506-12514 |
| `security_root_authorized_keys_ready()` | 12516-12521 |
| `security_validate_ssh_port()` | 12523-12534 |
| `security_random_ssh_port()` | 12536-12549 |
| `security_ensure_sshd_include()` | 12551-12564 |
| `security_comment_global_sshd_directives()` | 12566-12600 |
| `security_write_sshd_hardening_dropin()` | 12602-12618 |
| `security_write_fail2ban_sshd_jail()` | 12620-12638 |
| `security_install_fail2ban_if_needed()` | 12640-12654 |
| `security_restore_hardening_backups()` | 12656-12675 |
| `security_ssh_hardening()` | 12677-12788 |

---

### 4.10 `10-third-party/` — 第三方工具

**init.sh**
| 函数名 | 原行号 |
|--------|--------|
| `third_party_tools_menu()` | 5776-5797 |

**marketplace.sh**
| 函数名 | 原行号 |
|--------|--------|
| `third_party_market_menu()` | 5285-5507 |

**coolercontrol.sh**
| 函数名 | 原行号 |
|--------|--------|
| `coolercontrol_local_url()` | 5531-5539 |
| `coolercontrol_print_manual_install()` | 5541-5560 |
| `coolercontrol_detect_status()` | 5562-5581 |
| `coolercontrol_detect_version()` | 5583-5600 |
| `coolercontrol_install()` | 5602-5674 |
| `coolercontrol_update()` | 5676-5714 |
| `coolercontrol_uninstall()` | 5716-5741 |
| `coolercontrol_manager_menu()` | 5743-5774 |

**community.sh**
| 函数名 | 原行号 |
|--------|--------|
| `third_party_community_scripts_info()` | 5511-5528 |

---

## 5. 全局变量提取策略

### 5.1 按归属提取到 `lib/config.sh`

| 变量 | 用途 | 被哪些模块使用 |
|------|------|---------------|
| `MIRROR_NAMES[]` / `MIRROR_IDS[]` / `MIRROR_*_URIS[]` | 镜像源数据 | 02-sources, lib/network |
| `MIRROR_SELECTED_*` | 镜像选择状态 | 02-sources, lib/network |
| `CF_TRACE_URL` | 网络检测 | lib/network |
| `GITHUB_MIRROR_PREFIX` | GitHub 镜像加速 | 多个模块 |
| `USE_MIRROR_FOR_UPDATE` / `USER_COUNTRY_CODE` | 网络区域 | lib/network, 08-tools |
| `NETWORK_MODE` / `IS_OFFLINE_MODE` | 离线模式 | lib/network |
| `FASTPVE_*_URL` | FastPVE 地址 | 05-vm-container |
| `THIRD_PARTY_*_URL` | 第三方市场 | 10-third-party |
| `COOLERCONTROL_*_URL` | CoolerControl | 10-third-party |
| `NVIDIA_ASSETS_BASE_URL` / `NVIDIA_VGPU_UNLOCK_SO_URL` | NVIDIA 资源 | 04-gpu-passthrough |
| `VM_CONFIG_EXPORT_DIR` / `VM_BACKUP_CRON_FILE` | VM 路径 | 05-vm-container |
| `HOST_NETWORK_*_FILE` / `HOST_NETWORK_EXPORT_DIR` | 网络路径 | 06-networking |
| `PVE_CLUSTER_FIREWALL_FILE` | 防火墙路径 | 06-networking, 09-security |
| `PVE_KVM_ROM_DIR` | ROM 路径 | 04-gpu-passthrough |
| `PVE_VERSION_DETECTED` / `PVE_MAJOR_VERSION` | PVE 版本 | 全模块 |
| `RISK_ACK_BYPASS` / `DEBUG_MODE` | 调试/绕过 | 全模块 |
| `CURRENT_VERSION` / `BUILD_NICKNAME` | 版本 | 08-tools |
| `VERSION_FILE_URL` / `UPDATE_FILE_URL` / `PVE_TOOLS_SCRIPT_URL` | 更新 URL | 08-tools, lib/core |
| `LEGAL_VERSION` / `LEGAL_EFFECTIVE_DATE` | 法律条款 | lib/core |
| `SESSION_TIP` | 一言 | lib/network |
| `PVE_KVM_ROM_DIR` | ROM 目录 | 04-gpu-passthrough |
| `SECURITY_HIGH/MEDIUM/LOW_COUNT` | 安全计数 | 09-security |

### 5.2 函数变量不改动

已确认 **仅局部作用域** 的函数变量（如 `$GOVERNOR`、`$install`）保持 `local` 声明，不提取到全局。

### 5.3 颜色变量保留在 `lib/core.sh`

`setup_colors()` 中定义的 `RED`/`GREEN`/`YELLOW`/`NC`/`UI_*` 等被 223 个函数中的绝大多数使用，留在 `lib/core.sh` 在加载时初始化。

---

## 6. build.sh 实现

```bash
#!/usr/bin/env bash
# PVE-Tools 模块构建器
# 用法: bash build.sh [output-path]
# 默认输出: dist/PVE-Tools.sh

set -euo pipefail

ROOT="$(cd "$(dirname "$0")" && pwd)"
OUTPUT="${1:-$ROOT/dist/PVE-Tools.sh}"
VERSION="$(cat "$ROOT/VERSION")"

mkdir -p "$(dirname "$OUTPUT")"

{
    # ========== 头部 ==========
    echo '#!/bin/bash'
    echo
    echo "# PVE-Tools Pro v$VERSION"
    echo "# Build: $(date -u +%Y-%m-%dT%H:%M:%SZ)"
    echo "# SPDX-License-Identifier: GPL-3.0-only"
    echo "# Copyright (C) 2026 Ciriu Networks"
    echo

    # ========== lib/ 顺序固定 ==========
    for f in config.sh core.sh network.sh; do
        lib="$ROOT/lib/$f"
        if [[ -f "$lib" ]]; then
            echo "# [lib] $f"
            cat "$lib"
            echo
        fi
    done

    # ========== modules/ 递归扫描 ==========
    while IFS= read -r -d '' modfile; do
        rel="${modfile#$ROOT/src/modules/}"
        echo "# [module] $rel"
        cat "$modfile"
        echo
    done < <(find "$ROOT/src/modules" -name '*.sh' -print0 | sort -z)

    # ========== 入口 main() 调用 ==========
    echo 'main "$@"'
    echo

} > "$OUTPUT"

chmod +x "$OUTPUT"

# 统计
total_lines=$(wc -l < "$OUTPUT")
total_size=$(wc -c < "$OUTPUT")
echo "✓ Built: $OUTPUT"
echo "  Lines: $total_lines  |  Size: $(( total_size / 1024 ))KB"
```

**关键设计点**：
- `set -euo pipefail` 保证构建过程严格
- `sort -z` 保证模块文件按路径名的确定性顺序拼接
- `lib/` 按显式顺序（config → core → network），因为 `config.sh` 定义全局变量后被 `core.sh` 引用
- `modules/` 使用 `find` 递归，自然按路径名排序
- 头部嵌入构建时间戳便于追溯构建来源

---

## 7. release.yml 改动

在现有 `release.yml` 基础上改动最小：

```yaml
# ... 前面 steps 不变 ...

- name: Get version from tag                    # 已有
  id: get_version
  run: |
    TAG=${GITHUB_REF#refs/tags/}
    VERSION=${TAG#v}
    echo "TAG=$TAG" >> $GITHUB_OUTPUT
    echo "VERSION=$VERSION" >> $GITHUB_OUTPUT

- name: Build single script from modules         # ← 新增
  run: bash build.sh

- name: Install shc                              # 已有
  run: |
    sudo add-apt-repository ppa:neurobin/ppa -y
    sudo apt-get update
    sudo apt-get install shc -y

- name: Compile script to binary                 # 已有，改输入源
  run: |
    shc -f dist/PVE-Tools.sh -o pve-tools          # 原本 -f PVE-Tools.sh
    chmod +x pve-tools

- name: Create GitHub Release                    # 已有，改 files
  uses: softprops/action-gh-release@v2
  with:
    tag_name: ${{ steps.get_version.outputs.TAG }}
    name: Release ${{ steps.get_version.outputs.TAG }}
    body: |
      ## 版本 ${{ steps.get_version.outputs.VERSION }}
      ### 更新日志
      ${{ steps.release_notes.outputs.CHANGELOG }}
      ### 使用方法
      **方式一：直接运行脚本 (推荐)**
      ```bash
      bash -c "$(curl -fsSL https://raw.githubusercontent.com/PVE-Tools/PVE-Tools-9/main/dist/PVE-Tools.sh)"
      ```
      **方式二：下载二进制文件**
      ```bash
      chmod +x pve-tools
      sudo mv pve-tools /usr/local/bin/
      pve-tools
      ```
    files: |
      pve-tools
      dist/PVE-Tools.sh                          # 原本 PVE-Tools.sh
    draft: false
    prerelease: false
  env:
    GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
```

**改动点总结**：
1. 新增 `Build single script from modules` 步骤
2. `shc -f` 输入源变为 `dist/PVE-Tools.sh`
3. Release `files` 中的脚本变为 `dist/PVE-Tools.sh`
4. README 中的 curl bash URL 更新为 `main/dist/PVE-Tools.sh`

---

## 8. dev.sh 开发入口

```bash
#!/usr/bin/env bash
# PVE-Tools 开发模式入口
# 直接 source 模块文件，无需构建

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# 加载基础设施
for f in "$SCRIPT_DIR"/lib/*.sh; do
    source "$f"
done

# 递归加载所有模块
while IFS= read -r -d '' f; do
    source "$f"
done < <(find "$SCRIPT_DIR/src/modules" -name '*.sh' -print0 | sort -z)

main "$@"
```

开发者工作流：
```bash
# 改代码 → 直接运行
bash dev.sh

# 确认改好了 → 构建
bash build.sh

# 验证构建产物
bash dist/PVE-Tools.sh
```

---

## 9. 迁移步骤

### 阶段 1：准备工作 (1h)

1. **创建目录骨架**
   ```bash
   mkdir -p lib src/modules/{01-optimization,02-sources,03-boot-kernel,04-gpu-passthrough,05-vm-container,06-networking,07-storage-disk,08-tools-about,09-security,10-third-party} dist
   ```

2. **提取 `lib/config.sh`**
   - 行 1-298: 剪切所有全局变量定义 + MIRROR 数组 + URL 常量 + 路径常量
   - **不做任何代码改动**，仅做剪切

3. **提取 `lib/core.sh`**
   - 剪切：颜色系统(24-59)、日志(300-740)、确认函数(397-404)、备份(441-590)、GRUB(594-669)、进度(674-746)、UI 渲染(11972-11992)、`pause_function`(2121-2128)、`ensure_legal_acceptance`(409-439)

4. **提取 `lib/network.sh`**
   - 剪切：网络检测(748-968)、`fetch_session_tip`(778-826)、`show_banner`(971-989)、镜像选择(11995-12209)

### 阶段 2：主脚本改造 (1h)

5. **重写 `PVE-Tools.sh`**

   ```bash
   #!/usr/bin/env bash
   # PVE-Tools Pro v9.0.0 — 模块化入口

   SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

   for f in "$SCRIPT_DIR"/lib/*.sh; do source "$f"; done
   while IFS= read -r -d '' f; do source "$f"; done < <(find "$SCRIPT_DIR/src/modules" -name '*.sh' -print0 | sort -z)

   main "$@"
   ```

### 阶段 3：功能模块拆分 (4h) — 按文件逐个进行

6. **按上文模块清单**将剩余函数剪切到对应文件
   - 每个文件顶部保留 SPDX 版权声明
   - 函数定义直接复制，不改动内部逻辑
   - 只剪切不修改，保证行为 100% 一致
   - 每次拆分后执行 `bash -n PVE-Tools.sh && bash dev.sh --i-know-what-i-do --debug` 验证

### 阶段 4：边界修正 (2h)

7. **发现并修正 `check_packages()`** — 该函数行 1030-1040 在任何地方都未调用，标记为死代码或在适当位置调用
8. **发现并修正 `sync_kernel_update()`** — 同样未调用，理论上在 `pve_tools_local_update()` 重构时可考虑纳入
9. **确认所有 `source` 路径正确**（模块内引用 lib 函数时无需 source，已在入口一次性加载）

### 阶段 5：构建与 CI (1h)

10. **写入 `build.sh`**
11. **写入 `dev.sh`**
12. **修改 `.github/workflows/release.yml`**
13. **执行构建验证**：`bash build.sh && bash -n dist/PVE-Tools.sh`

### 阶段 6：验证 (1h)

14. **基本验证**
    ```bash
    bash -n PVE-Tools.sh
    bash -n dist/PVE-Tools.sh
    shellcheck -f gcc PVE-Tools.sh
    shellcheck -f gcc dist/PVE-Tools.sh
    ```

15. **运行时验证**
    ```bash
    bash dev.sh --i-know-what-i-do --debug
    # 确认菜单显示正常，前 3 个菜单项的子功能可进入
    ```

16. **构建产物验证**
    ```bash
    bash dist/PVE-Tools.sh --i-know-what-i-do --debug
    # 行为与 dev.sh 完全一致
    ```

---

## 10. 附录：跨模块依赖图

### 10.1 lib/ 函数被模块引用情况

```
lib/config.sh    ← 全模块（全局变量）
lib/core.sh      ← 全模块（log_* / confirm_* / backup_file / UI 函数）
lib/network.sh   ← 02-sources（镜像选择）、08-tools（check_update 调用 detect_network_region）
```

### 10.2 模块间函数调用

```
04-gpu-passthrough/nvidia.sh  ← 被 amd-dgpu.sh 和 amd-igpu.sh 复用：
   nvidia_select_vmid()
   nvidia_show_passthrough_status()
   nvidia_pci_has_function()
   nvidia_get_pci_ids()
   nvidia_get_cols()

04-gpu-passthrough/iommu.sh   ← 被 rdm.sh / controller.sh / nvidia / amd 复用：
   iommu_is_enabled()
   get_qm_conf_path()
   validate_qm_vmid()

06-networking/interface.sh    ← 被 addressing.sh / bridge.sh / vlan.sh / bond.sh / mac-bind.sh / ipv6-helper.sh 复用：
   host_network_get_all_interface_names()
   host_network_ensure_interfaces_file()
   host_network_select_from_text()

06-networking/bridge.sh / vlan.sh / bond.sh  ← 被 ipv6-helper.sh 复用：
   host_network_select_bridge_name()
   host_network_configure_interface_addressing()  ← 被 ipv6_helper_configure_passthrough 调用

05-vm-container/storage-helper.sh ← 被 backup.sh / disk.sh / cloudinit.sh / restore.sh / migrate.sh 复用：
   vm_select_storage_by_content()
   pve_storage_list_content_paths()
   pve_storage_content_path()

08-tools-about/self-update.sh ← 仅在 menu_tools_about 中被调用
```

### 10.3 无跨模块依赖的独立模块

```
01-optimization/   → 仅调用 lib/ 和自身函数
02-sources/        → 仅调用 lib/ 和自身函数
03-boot-kernel/    → 仅调用 lib/ 和自身函数
07-storage-disk/   → 仅调用 lib/ 和自身函数
08-tools-about/    → 仅调用 lib/ 和自身函数
09-security/       → 仅调用 lib/ 和自身函数
10-third-party/    → 仅调用 lib/ 和自身函数
```

### 10.4 建议的重构顺序

```
Step 1: lib/          ← 必须先做，所有模块依赖
Step 2: 02-sources/   ← 无外部依赖，干净
Step 3: 03-boot-kernel/ ← 无外部依赖
Step 4: 01-optimization/ ← 无外部依赖
Step 5: 07-storage-disk/ ← 无外部依赖
Step 6: 08-tools-about/ ← 无外部依赖
Step 7: 09-security/   ← 无外部依赖
Step 8: 10-third-party/ ← 无外部依赖
Step 9: 04-gpu-passthrough/ ← 有内部跨文件依赖，需仔细处理
Step 10: 05-vm-container/ ← 文件多且内部依赖复杂
Step 11: 06-networking/ ← 文件最多、子模块间交叉引用最密
```

### 10.5 重构中的风险点

| 风险 | 影响 | 缓解措施 |
|------|------|---------|
| `source` 顺序依赖 | 函数未定义错误 | lib/ 顺序固定，modules/ 中 init.sh 先 source 其他文件 |
| 全局变量在模块内被重复声明 | 变量重置 | 确认模块内无同名全局变量声明 |
| `shc` 编译时编码问题 | 中文注释乱码 | 确认源文件为 UTF-8 without BOM |
| 构建产物行号改变 | 调试困难 | `build.sh` 嵌入行内注释标注文件来源 |
| `check_packages()` 死代码 | 无影响 | 暂保留在入口，后续再处理 |

---

> 本计划基于 PVE-Tools.sh v9.0.0 "Evanescia" (14,716 行, 223 函数) 的完整解析生成。
> 计划涉及 11 个模块目录、约 70+ 个脚本文件、3 个库文件、2 个入口文件、1 个构建脚本。
> 预估迁移工时：约 10 小时（纯代码操作）+ 2 小时（验证修复）。
