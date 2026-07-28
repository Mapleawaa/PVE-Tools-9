#!/bin/bash
# SPDX-License-Identifier: GPL-3.0-only
# Copyright (C) 2026 Ciriu Networks

third_party_tools_menu() {
    run_menu "第三方工具" third_party_tools_menu_render third_party_tools_menu_dispatch "0-4"
}

third_party_tools_menu_render() {
    show_menu_option "1" "第三方软件市场 ${CYAN}(Modules)${NC}"
    show_menu_option "2" "CoolerControl ${CYAN}(更好的管理风扇控制工具)${NC}"
    show_menu_option "3" "Community Scripts ${CYAN}(社区脚本集合)${NC}"
    show_menu_option "4" "IT87 Driver ${CYAN}(ITE 芯片风扇/传感器驱动)${NC}"
}

third_party_tools_menu_dispatch() {
    case "$1" in
        1) third_party_market_menu ;;
        2) coolercontrol_manager_menu ;;
        3) third_party_community_scripts_info ;;
        4) it87_manager_menu ;;
        *) return 1 ;;
    esac
    return 0
}
