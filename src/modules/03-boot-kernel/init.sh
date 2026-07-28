#!/bin/bash
# SPDX-License-Identifier: GPL-3.0-only
# Copyright (C) 2026 Ciriu Networks

menu_boot_kernel() {
    run_menu "启动与内核" menu_boot_kernel_render menu_boot_kernel_dispatch "0-2"
}

menu_boot_kernel_render() {
    show_menu_option "1" "内核管理 ${CYAN}(内核切换/更新/清理)${NC}"
    show_menu_option "2" "查看/备份 GRUB 配置"
}

menu_boot_kernel_dispatch() {
    case "$1" in
        1) kernel_management_menu ;;
        2) grub_config_menu ;;
        *) return 1 ;;
    esac
    return 0
}

# GRUB 配置管理子菜单（查看/备份/恢复，底层函数在 01-optimization/cpupower.sh）
grub_config_menu() {
    run_menu "GRUB 配置管理" grub_config_menu_render grub_config_menu_dispatch "0-4"
}

grub_config_menu_render() {
    show_menu_option "1" "查看当前 GRUB 配置"
    show_menu_option "2" "备份 GRUB 配置"
    show_menu_option "3" "查看备份列表"
    show_menu_option "4" "恢复 GRUB 备份"
}

grub_config_menu_dispatch() {
    case "$1" in
        1) show_grub_config ;;
        2) grub_backup_with_note_prompt ;;
        3) list_grub_backups ;;
        4) restore_grub_backup ;;
        *) return 1 ;;
    esac
    return 0
}

grub_backup_with_note_prompt() {
    local note=""
    prompt_value note "请输入备份备注" "手动备份" || return 0
    backup_grub_with_note "$note"
}
