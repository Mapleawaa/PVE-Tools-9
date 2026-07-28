#!/bin/bash
# SPDX-License-Identifier: GPL-3.0-only
# Copyright (C) 2026 Ciriu Networks

menu_gpu_passthrough() {
    run_menu "直通与显卡" menu_gpu_passthrough_render menu_gpu_passthrough_dispatch "0-7"
}

menu_gpu_passthrough_render() {
    show_menu_option "1" "Intel 核显虚拟化管理 (SR-IOV/GVT-g)"
    show_menu_option "2" "Intel 核显直通配置 (修改版 QEMU)"
    show_menu_option "3" "NVIDIA 显卡直通/虚拟化"
    show_menu_option "4" "AMD 独显直通"
    show_menu_option "5" "AMD 核显直通 (需自备 ROM / vBIOS)"
    show_menu_option "6" "硬件直通一键配置 (IOMMU)"
    show_menu_option "7" "磁盘/控制器直通 (RDM/PCIe/NVMe)"
}

menu_gpu_passthrough_dispatch() {
    case "$1" in
        1) igpu_management_menu ;;
        2) intel_gpu_passthrough ;;
        3) nvidia_gpu_management_menu ;;
        4) amd_gpu_management_menu ;;
        5) amd_igpu_management_menu ;;
        6) hw_passth ;;
        7) menu_disk_controller_passthrough ;;
        *) return 1 ;;
    esac
    return 0
}

menu_disk_controller_passthrough() {
    run_menu "磁盘/控制器直通" menu_disk_controller_passthrough_render menu_disk_controller_passthrough_dispatch "0-5"
}

menu_disk_controller_passthrough_render() {
    show_menu_option "1" "RDM（裸磁盘映射）- 单个磁盘直通"
    show_menu_option "2" "RDM 取消直通（--delete）"
    show_menu_option "3" "磁盘控制器直通（PCIe）"
    show_menu_option "4" "NVMe 直通（含 MSI-X 重定位）"
    show_menu_option "5" "引导配置辅助（UEFI/Legacy）"
}

menu_disk_controller_passthrough_dispatch() {
    case "$1" in
        1) rdm_single_disk_attach ;;
        2) rdm_single_disk_detach ;;
        3) storage_controller_passthrough ;;
        4) nvme_passthrough ;;
        5) boot_config_assistant ;;
        *) return 1 ;;
    esac
    return 0
}
