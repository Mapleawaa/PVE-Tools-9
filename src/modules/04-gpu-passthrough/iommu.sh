#!/bin/bash
# SPDX-License-Identifier: GPL-3.0-only
# Copyright (C) 2026 Ciriu Networks

iommu_is_enabled() {
    if [[ -d /sys/kernel/iommu_groups ]]; then
        local group_count
        group_count="$(find /sys/kernel/iommu_groups -maxdepth 1 -type d 2>/dev/null | wc -l)"
        if [[ "${group_count:-0}" -gt 1 ]]; then
            return 0
        fi
    fi

    if dmesg 2>/dev/null | grep -Eiq 'DMAR: IOMMU enabled|IOMMU enabled|AMD-Vi:.*enabled'; then
        return 0
    fi

    return 1
}

# 检测本机已存在的直通/虚拟化配置来源（只读），每行输出一个已配置方案名
gpu_detect_active_stacks() {
    local grub_cmdline=""
    if [[ -f /etc/default/grub ]]; then
        grub_cmdline="$(grep '^GRUB_CMDLINE_LINUX_DEFAULT=' /etc/default/grub 2>/dev/null || true)"
    fi

    grep -qs "PVE-TOOLS BEGIN IOMMU_BASE_MODULES" /etc/modules && echo "一键硬件直通基础配置 (IOMMU)"
    grep -qs "PVE-TOOLS BEGIN NVIDIA_VFIO_MODULES" /etc/modules && echo "NVIDIA 宿主机直通预配置"
    grep -qs "PVE-TOOLS BEGIN AMD_VFIO_MODULES" /etc/modules && echo "AMD 宿主机直通预配置"
    grep -qs "PVE-TOOLS BEGIN INTEL_SRIOV_MODULES" /etc/modules && echo "Intel 核显 SR-IOV"
    grep -qs "PVE-TOOLS BEGIN INTEL_GVTG_MODULES" /etc/modules && echo "Intel 核显 GVT-g"
    grep -qs "PVE-TOOLS BEGIN INTEL_LEGACY_BLACKLIST" /etc/modprobe.d/pve-blacklist.conf && echo "Intel 核显直通黑名单 (修改版 QEMU 方案)"
    grep -qs "PVE-TOOLS BEGIN HARDWARE_PASSTHROUGH" /etc/modprobe.d/blacklist.conf && echo "一键直通可选驱动屏蔽 (i915/snd_hda)"

    # 兼容旧版本裸写入（无 marker）：按 GRUB 特征参数兜底识别
    if [[ "$grub_cmdline" == *"i915.enable_gvt"* ]] && ! grep -qs "PVE-TOOLS BEGIN INTEL_GVTG_MODULES" /etc/modules; then
        echo "Intel 核显 GVT-g (旧版本写入的 GRUB 参数)"
    fi
    if [[ "$grub_cmdline" == *"i915.max_vfs"* ]] && ! grep -qs "PVE-TOOLS BEGIN INTEL_SRIOV_MODULES" /etc/modules; then
        echo "Intel 核显 SR-IOV (旧版本写入的 GRUB 参数)"
    fi
    return 0
}

# 在进入任一直通方案配置前提示已存在的其他方案，避免多方案叠加冲突
gpu_warn_active_stacks() {
    local found
    found="$(gpu_detect_active_stacks)"
    if [[ -n "$found" ]]; then
        echo
        log_warn "检测到本机已存在以下直通/虚拟化配置："
        while IFS= read -r line; do
            echo -e "    ${YELLOW}- ${line}${NC}"
        done <<< "$found"
        log_warn "多套方案同时修改 GRUB/内核模块可能互相冲突；如需切换方案，建议先用对应菜单清理旧配置。"
        echo
    fi
    return 0
}

enable_pass() {
    local grub_changed blacklist_content
    echo
    log_step "开启硬件直通..."
    if ! dmesg 2>/dev/null | grep -q -e DMAR -e IOMMU; then
        log_error "您的硬件不支持直通！不如检查一下主板的BIOS设置？"
        pause_function
        return
    fi
    if grep -q Intel /proc/cpuinfo; then
        iommu="intel_iommu=on"
    else
        iommu="amd_iommu=on"
    fi

    gpu_warn_active_stacks

    if ! confirm_high_risk_action \
        "开启 IOMMU 硬件直通基础配置" \
        "会修改 GRUB 内核参数并向 /etc/modules 写入 vfio 模块，需重启生效" \
        "配置错误可能导致宿主机启动异常；与已有显卡直通方案叠加时请确认参数不冲突" \
        "脚本会自动备份 /etc/default/grub 与 /etc/modules，可通过 GRUB 备份恢复功能回滚" \
        "IOMMU-ON"; then
        return 1
    fi

    grub_changed=0
    if ! grub_has_param "$iommu"; then
        if grub_add_param "$iommu"; then
            grub_changed=1
        else
            log_error "GRUB 参数添加失败，无法继续配置硬件直通"
            return 1
        fi
    else
        log_info "GRUB 中已存在 IOMMU 参数，跳过内核参数修改。"
    fi

    # GRUB 已配置过时也要补齐 vfio 模块，避免"以为配了其实没配"
    # marker 配置块写入（apply_block 内部自动备份并保证幂等）
    if ! grep -q "vfio" /etc/modules 2>/dev/null; then
        apply_block "/etc/modules" "IOMMU_BASE_MODULES" "vfio
vfio_iommu_type1
vfio_pci
vfio_virqfd
kvmgt"
        log_success "已写入 vfio 内核模块到 /etc/modules"
    else
        log_info "/etc/modules 中已存在 vfio 模块，跳过。"
    fi

    # 屏蔽核显/声卡驱动仅适用于"把核显直通给虚拟机"的场景；
    # 宿主机还需要本地显示输出时开启会导致控制台黑屏，因此默认不开启。
    # 设备级 vfio-pci ids 绑定由各显卡专用直通菜单按实际硬件写入，此处不再写死。
    echo -e "${YELLOW}是否同时屏蔽宿主机核显与核显音频驱动 (i915/snd_hda_*)？${NC}"
    echo -e "${RED}仅在准备把核显直通给虚拟机时才需要；开启后宿主机本地屏幕将黑屏，只能通过 SSH/Web 管理。${NC}"
    if confirm_action "屏蔽 i915 与核显音频驱动（一般不需要）"; then
        blacklist_content="blacklist snd_hda_intel
blacklist snd_hda_codec_hdmi
blacklist i915"
        apply_block "/etc/modprobe.d/blacklist.conf" "HARDWARE_PASSTHROUGH" "$blacklist_content"
    else
        log_info "已跳过驱动屏蔽。如需针对具体显卡配置，请使用对应显卡的直通菜单。"
    fi

    if [[ "$grub_changed" -eq 1 ]]; then
        update-grub
    fi
    log_success "开启设置后需要重启系统，请准备就绪后重启宿主机"
    log_tips "重启后才可以应用对内核引导的修改哦！命令是 reboot"
}

# 关闭硬件直通
disable_pass() {
    echo
    log_step "关闭硬件直通..."
    if ! dmesg 2>/dev/null | grep -q -e DMAR -e IOMMU; then
        log_error "您的硬件不支持直通！"
        log_tips "不如检查一下主板的BIOS设置？"
        pause_function
        return
    fi
    if grep -q Intel /proc/cpuinfo; then
        iommu="intel_iommu=on"
    else
        iommu="amd_iommu=on"
    fi
    if ! grub_has_param "$iommu"; then
        log_warn "您还没有配置过该项"
        return
    fi

    if ! confirm_high_risk_action \
        "关闭 IOMMU 硬件直通基础配置" \
        "会移除 GRUB 中的 IOMMU 参数并删除 /etc/modules 中所有 vfio 行" \
        "依赖 IOMMU 的其他直通方案 (核显 SR-IOV / NVIDIA / AMD / 磁盘控制器直通) 将在重启后全部失效" \
        "如仍有虚拟机挂载直通设备，请先在对应菜单解除直通再关闭本配置" \
        "IOMMU-OFF"; then
        return 1
    fi

    grub_remove_param "$iommu"
    backup_file "/etc/modules"
    # 先移除本工具的 marker 配置块，再精确清理历史版本写入的裸模块行（含 kvmgt，不误删其它行）
    remove_block "/etc/modules" "IOMMU_BASE_MODULES"
    sed -i -E '/^(vfio|vfio_iommu_type1|vfio_pci|vfio_virqfd|kvmgt)[[:space:]]*$/d' /etc/modules
    # 使用安全的配置块删除，而不是直接删除整个文件（vfio.conf 为历史版本可能写入的位置）
    remove_block "/etc/modprobe.d/blacklist.conf" "HARDWARE_PASSTHROUGH"
    remove_block "/etc/modprobe.d/vfio.conf" "HARDWARE_PASSTHROUGH"
    update-grub
    log_success "关闭设置后需要重启系统，请准备就绪后重启宿主机。"
    log_tips "重启后才可以应用对内核引导的修改哦！命令是 reboot"
}

# 硬件直通菜单
hw_passth() {
    run_menu "配置硬件直通" hw_passth_render hw_passth_dispatch "0-2"
}

hw_passth_render() {
    show_menu_option "1" "开启硬件直通"
    show_menu_option "2" "关闭硬件直通"
}

hw_passth_dispatch() {
    case "$1" in
        1) enable_pass ;;
        2) disable_pass ;;
        *) return 1 ;;
    esac
    return 0
}
#--------------磁盘/控制器直通----------------

# 磁盘/控制器直通总菜单
parse_pci_bdf_from_udev_path() {
    local udev_path="$1"
    if [[ "$udev_path" =~ ([0-9a-f]{4}:[0-9a-f]{2}:[0-9a-f]{2}\.[0-9a-f]) ]]; then
        echo "${BASH_REMATCH[1]}"
        return 0
    fi
    return 1
}

# 获取指定块设备所在的 PCI BDF（用于系统盘控制器保护、控制器磁盘映射）
get_blockdev_pci_bdf() {
    local dev_path="$1"
    if [[ -z "$dev_path" || ! -b "$dev_path" ]]; then
        return 1
    fi

    local udev_path
    udev_path="$(udevadm info --query=path --name="$dev_path" 2>/dev/null)"
    if [[ -n "$udev_path" ]]; then
        parse_pci_bdf_from_udev_path "$udev_path" && return 0
    fi

    return 1
}

# 获取 PVE 系统盘对应的“整盘设备名”列表（sda / nvme0n1 等）
get_system_whole_disks() {
    local -A disks=()
    local mount_src

    for mp in / /boot /boot/efi; do
        mount_src="$(findmnt -n -o SOURCE "$mp" 2>/dev/null || true)"
        if [[ -z "$mount_src" ]]; then
            continue
        fi

        if [[ "$mount_src" == /dev/mapper/* ]]; then
            if command -v pvs >/dev/null 2>&1; then
                while IFS= read -r pv; do
                    pv="$(echo "$pv" | awk '{$1=$1;print}')"
                    if [[ -n "$pv" && -b "$pv" ]]; then
                        local pk
                        pk="$(lsblk -dn -o PKNAME "$pv" 2>/dev/null | head -n 1)"
                        if [[ -n "$pk" ]]; then
                            disks["$pk"]=1
                        else
                            disks["$(basename "$pv")"]=1
                        fi
                    fi
                done < <(pvs --noheadings -o pv_name 2>/dev/null)
            fi
            continue
        fi

        if [[ -b "$mount_src" ]]; then
            local pk
            pk="$(lsblk -dn -o PKNAME "$mount_src" 2>/dev/null | head -n 1)"
            if [[ -n "$pk" ]]; then
                disks["$pk"]=1
            else
                disks["$(basename "$mount_src")"]=1
            fi
        fi
    done

    for d in "${!disks[@]}"; do
        echo "$d"
    done | sort
}

# 获取“必须保护”的 PCI BDF（包含系统盘的控制器）
get_protected_pci_bdfs() {
    local -A bdfs=()
    local disk
    while IFS= read -r disk; do
        local bdf
        bdf="$(get_blockdev_pci_bdf "/dev/$disk" 2>/dev/null || true)"
        if [[ -n "$bdf" ]]; then
            bdfs["$bdf"]=1
        fi
    done < <(get_system_whole_disks)

    for b in "${!bdfs[@]}"; do
        echo "$b"
    done | sort
}

# 列出系统内的 SATA/SCSI/RAID 控制器（用于整控制器直通）
list_storage_controllers() {
    lspci -Dnn 2>/dev/null | grep -Eiin 'SATA controller|RAID bus controller|SCSI storage controller|Serial Attached SCSI controller' | sed 's/^[0-9]\+://'
}

# 列出系统内的 NVMe 控制器（用于 NVMe 直通）
list_nvme_controllers() {
    lspci -Dnn 2>/dev/null | grep -Eiin 'Non-Volatile memory controller' | sed 's/^[0-9]\+://'
}

# 展示指定 PCI BDF 下的所有“整盘”设备（用于磁盘映射展示与保护提示）
show_disks_under_pci_bdf() {
    local bdf="$1"
    if [[ -z "$bdf" ]]; then
        return 1
    fi

    local found=0
    while IFS= read -r name; do
        local dev_bdf
        dev_bdf="$(get_blockdev_pci_bdf "/dev/$name" 2>/dev/null || true)"
        if [[ "$dev_bdf" == "$bdf" ]]; then
            local size model
            size="$(lsblk -dn -o SIZE "/dev/$name" 2>/dev/null | head -n 1)"
            model="$(lsblk -dn -o MODEL "/dev/$name" 2>/dev/null | head -n 1)"
            echo "  /dev/$name  ${size:-?}  ${model:-?}"
            found=1
        fi
    done < <(lsblk -dn -o NAME,TYPE 2>/dev/null | awk '$2=="disk"{print $1}')

    if [[ "$found" -eq 0 ]]; then
        echo "  （未能识别到该控制器下的磁盘，可能是映射方式不同或权限受限）"
    fi
    return 0
}

# 获取 VM 是否为 q35（决定 hostpci 是否添加 pcie=1）
