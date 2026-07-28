#!/bin/bash
# SPDX-License-Identifier: GPL-3.0-only
# Copyright (C) 2026 Ciriu Networks

temp_monitoring_menu() {
    run_menu "温度监控管理" temp_monitoring_menu_render temp_monitoring_menu_dispatch "0-2"
}

temp_monitoring_menu_render() {
    show_menu_option "1" "配置温度监控 ${CYAN}(CPU/硬盘温度显示)${NC}"
    show_menu_option "2" "${RED}移除温度监控${NC} (移除温度监控功能)"
}

temp_monitoring_menu_dispatch() {
    case "$1" in
        1) cpu_add ;;
        2) cpu_del ;;
        *) return 1 ;;
    esac
    return 0
}

# 自定义温度监控配置
# 已经死了。

# Ceph管理菜单
