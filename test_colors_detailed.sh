#!/bin/bash

# Color definitions
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
MAGENTA='\033[0;35m'
WHITE='\033[1;37m'
NC='\033[0m' # No Color

echo "Testing direct echo -e with embedded colors:"
echo -e "  ${GREEN}1 ${NC}. 更换软件源 ${GREEN}(强烈推荐，让下载飞起来)${NC}"

echo -e "  ${GREEN}2 ${NC}. 删除订阅弹窗 ${GREEN}(告别烦人提醒)${NC} | ${RED}（谨慎操作）并且只能在SSH环境下使用否则会被截断${NC}"

# Problematic function (original implementation)
echo -e "Using function with printf (original):"
show_menu_option_original() {
    local num="$1"
    local desc="$2"
    local color="${3:-$GREEN}" # Default to green if no color specified
    printf "  ${color}%-3s${NC}. %s\\n" "$num" "$desc"
}

show_menu_option_original "1"  "更换软件源 ${GREEN}(强烈推荐，让下载飞起来)${NC}"

# Fixed function
echo -e "Using fixed function with echo -e:"
show_menu_option_fixed() {
    local num="$1"
    local desc="$2"
    echo -e "  ${GREEN}$(printf '%-3s' "$num")${NC}. $desc"
}

show_menu_option_fixed "1"  "更换软件源 ${GREEN}(强烈推荐，让下载飞起来)${NC}"