#!/bin/bash

# PVE 9.0 配置工具脚本
# 支持换源、删除订阅弹窗、硬盘管理等功能
# 适用于 Proxmox VE 9.0 (基于 Debian 13)

# 启用错误处理
set -euo pipefail

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
MAGENTA='\033[0;35m'
NC='\033[0m' # No Color

# 日志函数
log_info() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')] [INFO]${NC} $1" | tee -a /var/log/pve-tools.log
}

log_warn() {
    echo -e "${YELLOW}[$(date +'%Y-%m-%d %H:%M:%S')] [WARN]${NC} $1" | tee -a /var/log/pve-tools.log
}

log_error() {
    echo -e "${RED}[$(date +'%Y-%m-%d %H:%M:%S')] [ERROR]${NC} $1" | tee -a /var/log/pve-tools.log >&2
}

log_step() {
    echo -e "${CYAN}[$(date +'%Y-%m-%d %H:%M:%S')] [STEP]${NC} $1" | tee -a /var/log/pve-tools.log
}

log_success() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')] [SUCCESS]${NC} $1" | tee -a /var/log/pve-tools.log
}

# 进度指示函数
show_progress() {
    local message="$1"
    echo -ne "${CYAN}[....]${NC} $message\033[0K\r"
}

update_progress() {
    local message="$1"
    echo -ne "${GREEN}[ OK ]${NC} $message\033[0K\r"
    echo
}

# 显示横幅
show_banner() {
    clear
    echo -e "${BLUE}"
    cat << 'EOF'
██████╗ ██╗   ██╗███████╗    ████████╗ ██████╗  ██████╗ ██╗     ███████╗     █████╗ 
██╔══██╗██║   ██║██╔════╝    ╚══██╔══╝██╔═══██╗██╔═══██╗██║     ██╔════╝    ██╔══██╗
██████╔╝██║   ██║█████╗         ██║   ██║   ██║██║   ██║██║     ███████╗    ╚██████║
██╔═══╝ ╚██╗ ██╔╝██╔══╝         ██║   ██║   ██║██║   ██║██║     ╚════██║     ╚═══██║
██║      ╚████╔╝ ███████╗       ██║   ╚██████╔╝╚██████╔╝███████╗███████║     █████╔╝
╚═╝       ╚═══╝  ╚══════╝       ╚═╝    ╚═════╝  ╚═════╝ ╚══════╝╚══════╝     ╚════╝ 
EOF
    echo -e "${NC}"
    echo -e "${YELLOW}                     PVE 9.0 一键配置神器 ${NC}"
    echo -e "${GREEN}                      让 PVE 配置变得简单快乐${NC}"
    echo -e "${CYAN}                        作者: Maple & Claude 4${NC}"
    echo
}

# 检查是否为 root 用户
check_root() {
    if [[ $EUID -ne 0 ]]; then
        log_error "哎呀！需要超级管理员权限才能运行哦 "
        echo -e "${YELLOW}请使用以下命令重新运行：${NC}"
        echo -e "${CYAN}sudo $0${NC}"
        exit 1
    fi
}

# 检查 PVE 版本
check_pve_version() {
    if ! command -v pveversion &> /dev/null; then
        log_error "咦？这里好像不是 PVE 环境呢 "
        log_warn "请在 Proxmox VE 系统上运行此脚本"
        exit 1
    fi
    
    local pve_version=$(pveversion | head -n1 | cut -d'/' -f2 | cut -d'-' -f1)
    log_info "太好了！检测到 PVE 版本: ${GREEN}$pve_version${NC} "
}

# 通用确认函数
confirm_action() {
    local message="$1"
    echo -e "${YELLOW}$message${NC}"
    read -p "输入 'yes' 确认继续，其他任意键取消: " -r
    echo
    if [[ "$REPLY" == "yes" ]]; then
        return 0
    else
        return 1
    fi
}

# 备份文件
backup_file() {
    local file="$1"
    if [[ -f "$file" ]]; then
        local backup_name="${file}.backup.$(date +%Y%m%d_%H%M%S)"
        if cp "$file" "$backup_name"; then
            log_info "贴心备份完成: ${CYAN}$file${NC} -> ${CYAN}$backup_name${NC}"
            return 0
        else
            log_error "备份失败: $file"
            return 1
        fi
    else
        log_warn "文件不存在，无需备份: $file"
        return 0
    fi
}

# 换源功能
change_sources() {
    log_step "开始为您的 PVE 换上飞速源 ‍️"
    
    # 检查必要命令
    if ! command -v apt &> /dev/null; then
        log_error "未找到 apt 命令"
        return 1
    fi
    
    # 1. 更换 Debian 软件源 (DEB822 格式)
    log_info "正在配置 Debian 清华源..."
    if backup_file "/etc/apt/sources.list.d/debian.sources"; then
        cat > /etc/apt/sources.list.d/debian.sources << 'EOF'
Types: deb
URIs: https://mirrors.tuna.tsinghua.edu.cn/debian
Suites: trixie trixie-updates trixie-backports
Components: main contrib non-free non-free-firmware
Signed-By: /usr/share/keyrings/debian-archive-keyring.gpg

# 默认注释了源码镜像以提高 apt update 速度，如有需要可自行取消注释
# Types: deb-src
# URIs: https://mirrors.tuna.tsinghua.edu.cn/debian
# Suites: trixie trixie-updates trixie-backports
# Components: main contrib non-free non-free-firmware
# Signed-By: /usr/share/keyrings/debian-archive-keyring.gpg

# 以下安全更新软件源包含了官方源与镜像站配置，如有需要可自行修改注释切换
Types: deb
URIs: https://security.debian.org/debian-security
Suites: trixie-security
Components: main contrib non-free non-free-firmware
Signed-By: /usr/share/keyrings/debian-archive-keyring.gpg

# Types: deb-src
# URIs: https://security.debian.org/debian-security
# Suites: trixie-security
# Components: main contrib non-free non-free-firmware
# Signed-By: /usr/share/keyrings/debian-archive-keyring.gpg
EOF
    fi
    
    # 2. 注释企业源
    log_info "正在关闭企业源（我们用免费版就够啦）..."
    if [[ -f "/etc/apt/sources.list.d/pve-enterprise.sources" ]]; then
        if backup_file "/etc/apt/sources.list.d/pve-enterprise.sources"; then
            sed -i 's/^Types:/#Types:/g' /etc/apt/sources.list.d/pve-enterprise.sources
            sed -i 's/^URIs:/#URIs:/g' /etc/apt/sources.list.d/pve-enterprise.sources
            sed -i 's/^Suites:/#Suites:/g' /etc/apt/sources.list.d/pve-enterprise.sources
            sed -i 's/^Components:/#Components:/g' /etc/apt/sources.list.d/pve-enterprise.sources
            sed -i 's/^Signed-By:/#Signed-By:/g' /etc/apt/sources.list.d/pve-enterprise.sources
        fi
    fi
    
    # 3. 更换 Ceph 源
    log_info "正在配置 Ceph 清华源..."
    if [[ -f "/etc/apt/sources.list.d/ceph.sources" ]]; then
        if backup_file "/etc/apt/sources.list.d/ceph.sources"; then
            cat > /etc/apt/sources.list.d/ceph.sources << 'EOF'
Types: deb
URIs: https://mirrors.tuna.tsinghua.edu.cn/proxmox/debian/ceph-squid
Suites: trixie
Components: main
Signed-By: /usr/share/keyrings/proxmox-archive-keyring.gpg
EOF
        fi
    fi
    
    # 4. 添加无订阅源
    log_info "正在添加免费版专用源..."
    cat > /etc/apt/sources.list.d/pve-no-subscription.sources << 'EOF'
Types: deb
URIs: https://mirrors.tuna.tsinghua.edu.cn/proxmox/debian/pve
Suites: trixie
Components: pve-no-subscription
Signed-By: /usr/share/keyrings/proxmox-archive-keyring.gpg
EOF
    
    # 5. 更换 CT 模板源
    log_info "正在加速 CT 模板下载..."
    if [[ -f "/usr/share/perl5/PVE/APLInfo.pm" ]]; then
        if backup_file "/usr/share/perl5/PVE/APLInfo.pm"; then
            sed -i 's|http://download.proxmox.com|https://mirrors.tuna.tsinghua.edu.cn/proxmox|g' /usr/share/perl5/PVE/APLInfo.pm
        fi
    fi
    
    log_success "太棒了！所有源都换成飞速版本啦 "
}

# 删除订阅弹窗
remove_subscription_popup() {
    log_step "正在消除那个烦人的订阅弹窗 "
    
    local js_file="/usr/share/javascript/proxmox-widget-toolkit/proxmoxlib.js"
    if [[ -f "$js_file" ]]; then
        if backup_file "$js_file"; then
            sed -Ezi.bak "s/(Ext.Msg.show\(\{\s+title: gettext\('No valid sub)/void\(\{ \/\/\1/g" "$js_file"
            if systemctl restart pveproxy.service; then
                log_success "完美！再也不会有烦人的弹窗啦 "
            else
                log_warn "服务重启失败，请手动重启 pveproxy 服务"
            fi
        fi
    else
        log_warn "咦？没找到弹窗文件，可能已经被处理过了"
    fi
}

# 合并 local 与 local-lvm
merge_local_storage() {
    log_step "准备合并存储空间，让小硬盘发挥最大价值 "
    
    # 检查必要命令
    if ! command -v lvdisplay &> /dev/null || ! command -v lvremove &> /dev/null; then
        log_error "LVM 工具未安装"
        return 1
    fi
    
    # 检查 local-lvm 是否存在
    if ! lvdisplay /dev/pve/data &> /dev/null; then
        log_warn "没有找到 local-lvm 分区，可能已经合并过了"
        return 0
    fi
    
    # 确认操作
    if ! confirm_action "️ 重要提醒：此操作会删除 local-lvm，请确保重要数据已备份！您确定要继续吗？这个操作不可逆哦"; then
        log_info "明智的选择！操作已取消 "
        return 0
    fi
    
    # 执行操作
    log_info "正在删除 local-lvm 分区..."
    if ! lvremove -f /dev/pve/data; then
        log_error "删除 local-lvm 分区失败"
        return 1
    fi
    
    log_info "正在扩容 local 分区..."
    if ! lvextend -l +100%FREE /dev/pve/root; then
        log_error "扩容 local 分区失败"
        return 1
    fi
    
    log_info "正在扩展文件系统..."
    if ! resize2fs /dev/pve/root; then
        log_error "扩展文件系统失败"
        return 1
    fi
    
    log_success "存储合并完成！现在空间更充裕了 "
    log_warn " 温馨提示：请在 Web UI 中删除 local-lvm 存储配置，并编辑 local 存储勾选所有内容类型"
}

# 删除 Swap 分配给主分区
remove_swap() {
    log_step "准备释放 Swap 空间给系统使用 "
    
    # 检查必要命令
    if ! command -v lvdisplay &> /dev/null; then
        log_error "LVM 工具未安装"
        return 1
    fi
    
    # 检查 swap 是否存在
    if ! lvdisplay /dev/pve/swap &> /dev/null; then
        log_warn "没有找到 swap 分区，可能已经删除过了"
        return 0
    fi
    
    # 确认操作
    if ! confirm_action "️ 注意：删除 Swap 后请确保内存充足！您确定要删除 Swap 分区吗？"; then
        log_info "好的，操作已取消 "
        return 0
    fi
    
    # 执行操作
    log_info "正在关闭 Swap..."
    swapoff /dev/mapper/pve-swap 2>/dev/null || true
    
    log_info "正在修改启动配置..."
    if backup_file "/etc/fstab"; then
        sed -i 's|^/dev/pve/swap|# /dev/pve/swap|g' /etc/fstab
    fi
    
    log_info "正在删除 swap 分区..."
    if ! lvremove -f /dev/pve/swap; then
        log_error "删除 swap 分区失败"
        return 1
    fi
    
    log_info "正在扩展系统分区..."
    if ! lvextend -l +100%FREE /dev/mapper/pve-root; then
        log_error "扩展系统分区失败"
        return 1
    fi
    
    log_info "正在扩展文件系统..."
    if ! resize2fs /dev/mapper/pve-root; then
        log_error "扩展文件系统失败"
        return 1
    fi
    
    log_success "Swap 删除完成！系统空间更宽裕了 "
}

# 更新系统
update_system() {
    log_step "开始更新系统，让 PVE 保持最新状态 "
    
    # 检查网络连接
    if ! ping -c 1 mirrors.tuna.tsinghua.edu.cn &> /dev/null; then
        log_warn "网络连接可能有问题，请检查网络设置"
    fi
    
    show_progress "正在更新软件包列表..."
    if apt update; then
        update_progress "软件包列表更新完成"
    else
        log_error "更新软件包列表失败"
        return 1
    fi
    
    show_progress "正在升级系统软件包..."
    if apt upgrade -y; then
        update_progress "系统软件包升级完成"
    else
        log_error "升级系统软件包失败"
        return 1
    fi
    
    show_progress "正在清理不需要的软件包..."
    if apt autoremove -y; then
        update_progress "清理不需要的软件包完成"
    else
        log_error "清理不需要的软件包失败"
        return 1
    fi
    
    log_success "系统更新完成！您的 PVE 现在是最新版本 "
}

# 显示系统信息
show_system_info() {
    log_step "为您展示系统运行状况 "
    echo
    echo -e "${CYAN}️  系统信息概览${NC}"
    echo -e "${BLUE}================================${NC}"
    echo -e " PVE 版本: ${GREEN}$(pveversion | head -n1)${NC}"
    echo -e " 内核版本: ${GREEN}$(uname -r)${NC}"
    echo -e " 系统负载: ${GREEN}$(uptime | awk -F'load average:' '{print $2}')${NC}"
    echo -e " 内存使用: ${GREEN}$(free -h | grep Mem | awk '{print $3"/"$2" ("int($3/$2*100)"%)"}')${NC}"
    echo -e " 磁盘使用:"
    df -h | grep -E '^/dev/' | awk '{print "    "$1" "$3"/"$2" ("$5")"}'
    echo -e "${BLUE}================================${NC}"
}

# 系统健康检查
check_system_health() {
    log_step "执行系统健康检查"
    
    # 检查磁盘空间
    local root_usage=$(df / | tail -1 | awk '{print $5}' | sed 's/%//')
    if [[ $root_usage -gt 90 ]]; then
        log_warn "根分区使用率过高: ${root_usage}%"
    elif [[ $root_usage -gt 80 ]]; then
        log_info "根分区使用率: ${root_usage}%"
    else
        log_info "根分区使用率正常: ${root_usage}%"
    fi
    
    # 检查内存使用
    local mem_usage=$(free | grep Mem | awk '{printf("%.0f", $3/$2 * 100.0)}')
    if [[ $mem_usage -gt 80 ]]; then
        log_warn "内存使用率较高: ${mem_usage}%"
    else
        log_info "内存使用率正常: ${mem_usage}%"
    fi
    
    # 检查系统负载
    local load_avg=$(uptime | awk -F'load average:' '{print $2}' | awk '{print $1}' | sed 's/,//')
    local cpu_count=$(nproc)
    if (( $(echo "$load_avg > $cpu_count" | bc -l) )); then
        log_warn "系统负载较高: $load_avg (CPU核心数: $cpu_count)"
    else
        log_info "系统负载正常: $load_avg (CPU核心数: $cpu_count)"
    fi
    
    log_info "系统健康检查完成"
}

# 一键配置
quick_setup() {
    log_step "开始一键配置，坐和放宽，让我来搞定一切 ️"
    echo
    
    if change_sources; then
        echo
        if remove_subscription_popup; then
            echo
            if update_system; then
                echo
                log_success " 一键配置全部完成！您的 PVE 已经完美优化 "
                echo -e "${CYAN}现在您可以愉快地使用 PVE 了！${NC}"
                return 0
            fi
        fi
    fi
    
    log_error "一键配置过程中出现错误"
    return 1
}

# 显示菜单
show_menu() {
    echo -e "${MAGENTA} 请选择您需要的功能：${NC}"
    echo
    echo -e "${YELLOW}1.${NC}  更换软件源 ${GREEN}(强烈推荐，让下载飞起来)${NC}"
    echo -e "${YELLOW}2.${NC}  删除订阅弹窗 ${GREEN}(告别烦人提醒)${NC}"
    echo -e "${YELLOW}3.${NC}  合并 local 与 local-lvm ${CYAN}(小硬盘救星)${NC}"
    echo -e "${YELLOW}4.${NC}  删除 Swap 分区 ${CYAN}(释放更多空间)${NC}"
    echo -e "${YELLOW}5.${NC}  更新系统 ${GREEN}(保持最新状态)${NC}"
    echo -e "${YELLOW}6.${NC}  显示系统信息 ${BLUE}(查看运行状况)${NC}"
    echo -e "${YELLOW}7.${NC}  系统健康检查 ${BLUE}(检查系统状态)${NC}"
    echo -e "${YELLOW}8.${NC}  一键配置 ${MAGENTA}(换源+删弹窗+更新，懒人必选)${NC}"
    echo -e "${YELLOW}0.${NC}  退出脚本"
    echo
    echo -e "${CYAN} 小贴士：新装系统推荐选择 8 进行一键配置${NC}"
    echo
    echo -n -e "${GREEN}请输入您的选择 [0-8]: ${NC}"
}

# 主程序
main() {
    check_root
    check_pve_version
    
    while true; do
        show_banner
        show_menu
        read -n 1 choice
        echo
        echo
        
        case $choice in
            1)
                change_sources
                ;;
            2)
                remove_subscription_popup
                ;;
            3)
                merge_local_storage
                ;;
            4)
                remove_swap
                ;;
            5)
                update_system
                ;;
            6)
                show_system_info
                ;;
            7)
                check_system_health
                ;;
            8)
                quick_setup
                ;;
            0)
                echo -e "${GREEN}感谢使用 PVE Tools！祝您使用愉快 ${NC}"
                echo -e "${CYAN}再见！${NC}"
                exit 0
                ;;
            *)
                log_error "哎呀，这个选项不存在呢 "
                log_warn "请输入 0-8 之间的数字"
                ;;
        esac
        
        echo
        echo -e "${YELLOW}按回车键返回主菜单...${NC}"
        read -r
    done
}

# 运行主程序
main "$@"
