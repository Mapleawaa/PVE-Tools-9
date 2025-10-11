#!/bin/bash

# Test different approaches to handle embedded color codes

# Color definitions
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
MAGENTA='\033[0;35m'
WHITE='\033[1;37m'
NC='\033[0m' # No Color

echo "Testing approach 1: printf with embedded color codes"
printf "  ${GREEN}%-3s${NC}. %s\n" "1" "更换软件源 ${GREEN}(强烈推荐，让下载飞起来)${NC}"

echo -e ""
echo "Testing approach 2: separate printf and echo -e"
printf "  ${GREEN}%-3s${NC}. " "2"
echo -e "删除订阅弹窗 ${GREEN}(告别烦人提醒)${NC} | ${RED}（谨慎操作）${NC}"

echo -e ""
echo "Testing approach 3: complete echo -e"
echo -e "  ${GREEN}3  ${NC}. 更换软件源 ${GREEN}(强烈推荐，让下载飞起来)${NC}"

echo -e ""
echo "Testing approach 4: formatted echo -e"
num="4"
desc="删除订阅弹窗 ${GREEN}(告别烦人提醒)${NC} | ${RED}（谨慎操作）${NC}"
echo -e "  ${GREEN}$(printf '%-3s' "$num")${NC}. $desc"