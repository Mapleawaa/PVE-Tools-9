#!/bin/bash
# SPDX-License-Identifier: GPL-3.0-only
# Copyright (C) 2026 Ciriu Networks

# 根文件系统扩容：按实际文件系统类型分派，不写死 ext4（swap.sh 的 remove_swap 也复用）
storage_grow_root_fs() {
    local device="$1"
    local fstype
    fstype="$(findmnt -no FSTYPE / 2>/dev/null)"
    case "$fstype" in
        ext2|ext3|ext4)
            resize2fs "$device"
            ;;
        xfs)
            xfs_growfs /
            ;;
        *)
            log_error "不支持自动扩容的根文件系统类型: ${fstype:-未知}，请手动扩容 $device"
            return 1
            ;;
    esac
}

merge_local_storage() {
    local thin_lvs
    log_step "准备合并存储空间，让小硬盘发挥最大价值"
    log_warn "重要提醒：此操作会删除 local-lvm，请确保重要数据已备份！"

    # 检查 local-lvm 是否存在（先检查再确认，避免对无操作场景要求确认词）
    if ! lvdisplay /dev/pve/data &> /dev/null; then
        log_warn "没有找到 local-lvm 分区，可能已经合并过了"
        return
    fi

    # thin pool 上仍有 VM 磁盘时禁止删除
    thin_lvs="$(lvs --noheadings -o lv_name -S 'pool_lv=data' pve 2>/dev/null | xargs)"
    if [[ -n "$thin_lvs" ]]; then
        log_error "local-lvm (pve/data) 上仍存在以下逻辑卷，禁止删除："
        echo "  $thin_lvs"
        log_tips "请先在 Web UI 迁移或删除这些 VM 磁盘后再执行合并。"
        return 1
    fi

    if ! confirm_high_risk_action \
        "合并 local-lvm 到 local 存储" \
        "将删除 /dev/pve/data 逻辑卷，所有 LVM-thin 上的 VM 磁盘和数据将被永久销毁。" \
        "执行 lvremove、lvextend、文件系统扩容，不可逆。" \
        "请确保已将 local-lvm 上的所有 VM 磁盘迁移或备份。" \
        "CONFIRM"; then
        log_info "明智的选择！操作已取消"
        return
    fi

    log_info "正在删除 local-lvm 分区..."
    if ! lvremove -f /dev/pve/data; then
        log_error "删除 pve/data 失败，操作中止（未做任何扩容）"
        return 1
    fi

    log_info "正在扩容 local 分区..."
    if ! lvextend -l +100%FREE /dev/pve/root; then
        log_error "扩容 pve/root 失败，请手动执行: lvextend -l +100%FREE /dev/pve/root"
        return 1
    fi

    log_info "正在扩展文件系统..."
    if ! storage_grow_root_fs /dev/pve/root; then
        log_error "LV 已扩容但文件系统扩展未完成，请按上方提示手动处理"
        return 1
    fi

    log_success "存储合并完成！现在空间更充裕了"
    log_warn "温馨提示：请在 Web UI 中删除 local-lvm 存储配置，并编辑 local 存储勾选所有内容类型"
}

# 删除 Swap 分配给主分区
