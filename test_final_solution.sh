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

# Final solution function
show_menu_option() {
    local num="$1"
    local desc="$2"
    # Use echo -e to properly interpret embedded color codes in the description
    echo -e "  ${GREEN}$(printf '%-3s' "$num")${NC}. $desc"
}

echo "Testing the final solution function:"
show_menu_option "1"  "更换软件源 ${GREEN}(强烈推荐，让下载飞起来)${NC}"
show_menu_option "2"  "删除订阅弹窗 ${GREEN}(告别烦人提醒)${NC} | ${RED}（谨慎操作）并且只能在SSH环境下使用否则会被截断${NC}"
show_menu_option "7"  "一键配置 ${MAGENTA}(换源+删弹窗+更新，懒人必选，推荐在SSH下使用)${NC}"
show_menu_option "16" "PVE8 升级到 PVE9 ${RED}(PVE8专用)${NC}"