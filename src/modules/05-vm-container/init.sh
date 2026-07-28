#!/bin/bash
# SPDX-License-Identifier: GPL-3.0-only
# Copyright (C) 2026 Ciriu Networks

vm_advanced_operations_menu() {
    run_menu "虚拟机高级运维工具箱" vm_advanced_operations_render vm_advanced_operations_dispatch "0-5"
}

vm_advanced_operations_render() {
    vm_show_data_risk_banner
    show_menu_option "1" "VM 配置导入/导出"
    show_menu_option "2" "模板 / 克隆 / Cloud-Init"
    show_menu_option "3" "虚拟机磁盘管理"
    show_menu_option "4" "启动顺序与网络管理"
    show_menu_option "5" "集群内迁移 VM"
    echo -e "  ${RED}警告：涉及磁盘、模板与迁移时，必须先确认备份可用，再核对 VMID / 槽位 / 目标存储。${NC}"
}

vm_advanced_operations_dispatch() {
    case "$1" in
        1) vm_config_io_menu ;;
        2) vm_template_cloudinit_menu ;;
        3) vm_disk_management_menu ;;
        4) vm_startup_network_menu ;;
        5) vm_cluster_migrate ;;
        *) return 1 ;;
    esac
    return 0
}

# 二级菜单：虚拟机与容器（快照/备份为高频操作，直达本级菜单，不再埋在工具箱内）
menu_vm_container() {
    run_menu "虚拟机与容器" menu_vm_container_render menu_vm_container_dispatch "0-6"
}

menu_vm_container_render() {
    show_menu_option "1" "${CYAN}FastPVE${NC} - 虚拟机快速下载"
    show_menu_option "2" "虚拟机/容器定时开关机"
    show_menu_option "3" "IMG 镜像导入（转 QCOW2/RAW）"
    show_menu_option "4" "快照管理"
    show_menu_option "5" "VM 备份与恢复"
    show_menu_option "6" "虚拟机高级运维工具箱"
}

menu_vm_container_dispatch() {
    case "$1" in
        1) fastpve_quick_download_menu ;;
        2) manage_vm_schedule ;;
        3) img_convert_import_menu ;;
        4) vm_snapshot_menu ;;
        5) vm_backup_restore_menu ;;
        6) vm_advanced_operations_menu ;;
        *) return 1 ;;
    esac
    return 0
}
