#!/bin/bash
# SPDX-License-Identifier: GPL-3.0-only
# Copyright (C) 2026 Ciriu Networks

# 获取帮助菜单
help_center_menu() {
    run_menu "获取帮助" help_center_menu_render help_center_menu_dispatch "0-3"
}

help_center_menu_render() {
    show_menu_option "1" "加 Q 群水群 ${CYAN}(闲聊交流)${NC}"
    show_menu_option "2" "加聊天社区咨询 ${CYAN}(Telegram 群)${NC}"
    show_menu_option "3" "加作者付费咨询 ${CYAN}(一对一技术支持)${NC}"
}

help_center_menu_dispatch() {
    case "$1" in
        1) help_show_qq_group ;;
        2) help_show_telegram_group ;;
        3) help_show_paid_consult ;;
        *) return 1 ;;
    esac
    return 0
}
