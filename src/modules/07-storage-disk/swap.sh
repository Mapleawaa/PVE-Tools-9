#!/bin/bash
# SPDX-License-Identifier: GPL-3.0-only
# Copyright (C) 2026 Ciriu Networks

remove_swap() {
    local swap_dev
    log_step "准备释放 Swap 空间给系统使用"
    log_warn "注意：删除 Swap 后请确保内存充足！"

    # 检查 swap 是否存在（先检查再确认，避免对无操作场景要求确认词）
    if ! lvdisplay /dev/pve/swap &> /dev/null; then
        log_warn "没有找到 swap 分区，可能已经删除过了"
        return
    fi

    if ! confirm_high_risk_action \
        "删除 Swap 分区并扩展 root 文件系统" \
        "删除 /dev/pve/swap 逻辑卷，可能导致内存不足场景下系统不稳定。" \
        "将执行 swapoff、lvremove、lvextend、文件系统扩容，不可逆。" \
        "请确保内存充足（建议 >= 8GB），并已备份重要数据。" \
        "CONFIRM"; then
        log_info "好的，操作已取消"
        return
    fi

    log_info "正在关闭 Swap..."
    swap_dev="$(readlink -f /dev/mapper/pve-swap 2>/dev/null)"
    if [[ -n "$swap_dev" ]] && grep -q "^${swap_dev} " /proc/swaps; then
        if ! swapoff /dev/mapper/pve-swap; then
            log_error "关闭 Swap 失败（可能内存不足以容纳换出页），操作中止，未做任何修改"
            return 1
        fi
    else
        log_info "Swap 已处于关闭状态，跳过 swapoff"
    fi

    log_info "正在修改启动配置..."
    backup_file "/etc/fstab"
    sed -i 's|^/dev/pve/swap|# /dev/pve/swap|g' /etc/fstab

    log_info "正在删除 swap 分区..."
    if ! lvremove -f /dev/pve/swap; then
        log_error "删除 swap 逻辑卷失败；Swap 已关闭且 fstab 已注释，可稍后重试或手动处理"
        return 1
    fi

    log_info "正在扩展系统分区..."
    if ! lvextend -l +100%FREE /dev/mapper/pve-root; then
        log_error "扩容 pve-root 失败，请手动执行: lvextend -l +100%FREE /dev/mapper/pve-root"
        return 1
    fi

    log_info "正在扩展文件系统..."
    if ! storage_grow_root_fs /dev/mapper/pve-root; then
        log_error "LV 已扩容但文件系统扩展未完成，请按上方提示手动处理"
        return 1
    fi

    log_success "Swap 删除完成！系统空间更宽裕了"
}

# 更新系统
