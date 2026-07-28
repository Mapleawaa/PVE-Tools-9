#!/bin/bash
# SPDX-License-Identifier: GPL-3.0-only
# Copyright (C) 2026 Ciriu Networks

security_center_menu() {
    run_menu "安全中心" security_center_menu_render security_center_menu_dispatch "0-3"
}

security_center_menu_render() {
    show_menu_option "1" "安全风险检查 ${CYAN}(只读报告)${NC}"
    show_menu_option "2" "SSH 一键加固 ${CYAN}(端口/密钥/fail2ban)${NC}"
    show_menu_option "3" "CVE 漏洞修补 ${RED}(Januscape/内核漏洞)${NC}"
}

security_center_menu_dispatch() {
    case "$1" in
        1) security_risk_check ;;
        2) security_ssh_hardening ;;
        3) security_cve_menu ;;
        *) return 1 ;;
    esac
    return 0
}
