#!/bin/bash
# SPDX-License-Identifier: GPL-3.0-only
# Copyright (C) 2026 Ciriu Networks

menu_storage_disk() {
    run_menu "存储与硬盘" menu_storage_disk_render menu_storage_disk_dispatch "0-7"
}

menu_storage_disk_render() {
    show_menu_option "1" "存储位置查询面板 ${CYAN}(ISO/备份/SCP路径)${NC}"
    show_menu_option "2" "磁盘挂载向导 ${CYAN}(复用已有 ext4/xfs 分区)${NC}"
    show_menu_option "3" "合并 ${CYAN}local${NC} 与 ${CYAN}local-lvm${NC}"
    show_menu_option "4" "${CYAN}Ceph${NC} 管理 (安装/卸载/换源)"
    show_menu_option "5" "硬盘休眠配置 ${CYAN}(hdparm)${NC}"
    show_menu_option "6" "垃圾清理 ${CYAN}(缓存/备份/快照扫描)${NC}"
    show_menu_option "7" "${RED}删除 Swap 分区${NC}"
}

menu_storage_disk_dispatch() {
    case "$1" in
        1) pve_storage_location_panel ;;
        2) pve_storage_mount_wizard ;;
        3) merge_local_storage ;;
        4) ceph_management_menu ;;
        5) storage_hdparm_sleep_config ;;
        6) garbage_cleanup_menu ;;
        7) remove_swap ;;
        *) return 1 ;;
    esac
    return 0
}

# 硬盘休眠配置（hdparm -S 写入磁盘休眠参数）
storage_hdparm_sleep_config() {
    lsblk -o NAME,MODEL,TYPE,SIZE,MOUNTPOINT | grep disk
    local disk_name="" sleep_val=""
    prompt_value disk_name "请输入要配置休眠的硬盘盘符 (如 sdb, 不含/dev/)" || return 0
    if [[ ! -b "/dev/$disk_name" ]]; then
        display_error "未找到磁盘 /dev/$disk_name"
        return 1
    fi
    prompt_value sleep_val "请输入休眠时间 (1-255, 120=10分钟, 240=20分钟, 0=禁用)" || return 0
    if [[ ! "$sleep_val" =~ ^[0-9]+$ ]] || (( sleep_val > 255 )); then
        display_error "无效的时间值: $sleep_val" "请输入 0-255 之间的数字"
        return 1
    fi
    if ! confirm_action "执行 hdparm -S $sleep_val /dev/$disk_name（向磁盘写入休眠参数）"; then
        return 0
    fi
    hdparm -S "$sleep_val" "/dev/$disk_name"
    log_success "配置已应用到 /dev/$disk_name"
}
