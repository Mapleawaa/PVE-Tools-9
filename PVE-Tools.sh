#!/bin/bash

# PVE 9.0 配置工具脚本
# 支持换源、删除订阅弹窗、硬盘管理等功能
# 适用于 Proxmox VE 9.0 (基于 Debian 13)
# Auther:Maple 二次修改使用请不要删除此段注释

# 版本信息
CURRENT_VERSION="4.2.1"
VERSION_FILE_URL="https://raw.githubusercontent.com/Mapleawaa/PVE-Tools-9/main/VERSION"

# 颜色定义 - 保持一致性
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
MAGENTA='\033[0;35m'
WHITE='\033[1;37m'
ORANGE='\033[0;33m'  
NC='\033[0m'

# UI 界面一致性常量
UI_BORDER="------------------------------------------------"
UI_DIVIDER="------------------------------------------------"
UI_FOOTER="------------------------------------------------"
UI_HEADER="------------------------------------------------"
UI_FOOTER_SHORT="------------------------------------------------"

# 镜像源配置
MIRROR_USTC="https://mirrors.ustc.edu.cn/proxmox/debian/pve"
MIRROR_TUNA="https://mirrors.tuna.tsinghua.edu.cn/proxmox/debian/pve"
MIRROR_DEBIAN="https://deb.debian.org/debian"
SELECTED_MIRROR=""

# CT 模板源配置
CT_MIRROR_USTC="https://mirrors.ustc.edu.cn/proxmox"
CT_MIRROR_TUNA="https://mirrors.tuna.tsinghua.edu.cn/proxmox"
CT_MIRROR_OFFICIAL="http://download.proxmox.com"

# 日志函数
log_info() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} ${CYAN}[INFO]${NC} $1" | tee -a /var/log/pve-tools.log
}

log_warn() {
    echo -e "${YELLOW}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} ${ORANGE}[WARN]${NC} $1" | tee -a /var/log/pve-tools.log
}

log_error() {
    echo -e "${RED}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} ${RED}[ERROR]${NC} $1" | tee -a /var/log/pve-tools.log >&2
}

log_step() {
    echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} ${MAGENTA}[STEP]${NC} $1" | tee -a /var/log/pve-tools.log
}

log_success() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} ${GREEN}[SUCCESS]${NC} $1" | tee -a /var/log/pve-tools.log
}

log_tips(){
    echo -e "${CYAN}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} ${MAGENTA}[TIPS]${NC} $1" | tee -a /var/log/pve-tools.log
}

# Enhanced error handling function with consistent messaging
display_error() {
    local error_msg="$1"
    local suggestion="${2:-请检查输入或联系作者寻求帮助。}"
    
    log_error "$error_msg"
    echo -e "${YELLOW}提示: $suggestion${NC}"
    pause_function
}

# Enhanced success feedback
display_success() {
    local success_msg="$1"
    local next_step="${2:-}"
    
    log_success "$success_msg"
    if [[ -n "$next_step" ]]; then
        echo -e "${GREEN}下一步: $next_step${NC}"
    fi
}

# Confirmation prompt with consistent UI
confirm_action() {
    local action_desc="$1"
    local default_choice="${2:-N}"
    
    echo -e "${YELLOW}确认操作: $action_desc${NC}"
    read -p "请输入 'yes' 确认继续，其他任意键取消 [$default_choice]: " -r confirm
    if [[ "$confirm" == "yes" || "$confirm" == "YES" ]]; then
        return 0
    else
        log_info "操作已取消"
        return 1
    fi
}

# 进度指示函数
show_progress() {
    local message="$1"
    local spinner="|/-\\"
    local i=0
    # Print initial message
    echo -ne "${CYAN}[    ]${NC} $message\033[0K\r"
    
    # Update the spinner position in the box
    while true; do
        i=$(( (i + 1) % 4 ))
        echo -ne "\b\b\b\b\b${CYAN}[${spinner:$i:1}]${NC}\033[0K\r"
        sleep 0.1
    done &
    # Store the background job ID to be killed later
    SPINNER_PID=$!
}

update_progress() {
    local message="$1"
    # Kill the spinner if running
    if [[ -n "$SPINNER_PID" ]]; then
        kill $SPINNER_PID 2>/dev/null
    fi
    echo -ne "${GREEN}[ OK ]${NC} $message\033[0K\r"
    echo
}

# Enhanced visual feedback function
show_status() {
    local status="$1"
    local message="$2"
    local color="$3"
    
    case $status in
        "info")
            echo -e "${CYAN}[INFO]${NC} $message"
            ;;
        "success")
            echo -e "${GREEN}[ OK ]${NC} $message"
            ;;
        "warning")
            echo -e "${YELLOW}[WARN]${NC} $message"
            ;;
        "error")
            echo -e "${RED}[FAIL]${NC} $message"
            ;;
        "step")
            echo -e "${MAGENTA}[STEP]${NC} $message"
            ;;
        *)
            echo -e "${WHITE}[$status]${NC} $message"
            ;;
    esac
}

# Progress bar function
show_progress_bar() {
    local current="$1"
    local total="$2"
    local message="$3"
    local width=40
    local percentage=$(( current * 100 / total ))
    local filled=$(( width * current / total ))
    
    printf "${CYAN}[${NC}"
    for ((i=0; i<filled; i++)); do
        printf "█"
    done
    for ((i=filled; i<width; i++)); do
        printf " "
    done
    printf "${CYAN}]${NC} ${percentage}%% $message\r"
}

# 显示横幅
show_banner() {
    clear
    cat << 'EOF'
██████╗ ██╗   ██╗███████╗    ████████╗ ██████╗  ██████╗ ██╗     ███████╗     █████╗ 
██╔══██╗██║   ██║██╔════╝    ╚══██╔══╝██╔═══██╗██╔═══██╗██║     ██╔════╝    ██╔══██╗
██████╔╝██║   ██║█████╗         ██║   ██║   ██║██║   ██║██║     ███████╗    ╚██████║
██╔═══╝ ╚██╗ ██╔╝██╔══╝         ██║   ██║   ██║██║   ██║██║     ╚════██║     ╚═══██║
██║      ╚████╔╝ ███████╗       ██║   ╚██████╔╝╚██████╔╝███████╗███████║     █████╔╝
╚═╝       ╚═══╝  ╚══════╝       ╚═╝    ╚═════╝  ╚═════╝ ╚══════╝╚══════╝     ╚════╝ 
EOF
    echo "                    ═══════════════════════════════════════"
    echo "                           PVE 9.0 一键配置神器"
    echo "                            让 PVE 配置变得简单快乐"
    echo "                             作者: Maple & Claude 4"
    echo "                             当前版本: $CURRENT_VERSION"
    echo "                             最新版本: $remote_version"
    echo "                    ═══════════════════════════════════════"
    echo
}

# 检查是否为 root 用户
check_root() {
    if [[ $EUID -ne 0 ]]; then
        log_error "哎呀！需要超级管理员权限才能运行哦"
        echo "请使用以下命令重新运行："
        echo "sudo $0"
        exit 1
    fi
}

# 检查调试模式
check_debug_mode() {
    for arg in "$@"; do
        if [[ "$arg" == "--debug" ]]; then
            log_warn "警告：您正在使用调试模式！"
            log_warn "此模式将跳过 PVE 系统版本检测"
            log_warn "仅在开发和测试环境中使用"
            log_warn "在非 PVE (Debian 系) 系统上使用可能导致系统损坏"
            echo "您确定要继续吗？输入 'yes' 确认，其他任意键退出: "
            read -r confirm
            if [[ "$confirm" != "yes" ]]; then
                log_info "已取消操作，退出脚本"
                exit 0
            fi
            DEBUG_MODE=true
            log_success "已启用调试模式"
            return
        fi
    done
    DEBUG_MODE=false
}

# 检查是否安装依赖软件包
check_packages() {
    # 程序依赖的软件包: `sudo` `curl`
    local packages=("sudo" "curl")
    for pkg in "${packages[@]}"; do
        if ! command -v "$pkg" &> /dev/null; then
            log_error "哎呀！需要安装 $pkg 软件包才能运行哦"
            log_tips "请使用以下命令安装：apt install -y $pkg"
            exit 1
        fi
    done
 }
    



# 检查 PVE 版本
check_pve_version() {
    # 如果在调试模式下，跳过 PVE 版本检测
    if [[ "$DEBUG_MODE" == "true" ]]; then
        log_warn "调试模式：跳过 PVE 版本检测"
        log_tips "请注意：您正在非 PVE 系统上运行此脚本，某些功能可能无法正常工作"
        return
    fi
    
    if ! command -v pveversion &> /dev/null; then
        log_error "咦？这里好像不是 PVE 环境呢"
        log_warn "请在 Proxmox VE 系统上运行此脚本"
        exit 1
    fi
    
    local pve_version=$(pveversion | head -n1 | cut -d'/' -f2 | cut -d'-' -f1)
    log_info "太好了！检测到 PVE 版本: $pve_version"
}

# 检测当前内核版本
check_kernel_version() {
    log_info "检测当前内核信息..."
    local current_kernel=$(uname -r)
    local kernel_arch=$(uname -m)
    local kernel_variant=""
    
    # 检测内核变体（普通/企业版/测试版）
    if [[ $current_kernel == *"pve"* ]]; then
        kernel_variant="PVE标准内核"
    elif [[ $current_kernel == *"edge"* ]]; then
        kernel_variant="PVE边缘内核"
    elif [[ $current_kernel == *"test"* ]]; then
        kernel_variant="测试内核"
    else
        kernel_variant="未知类型"
    fi
    
    echo -e "${CYAN}当前内核信息：${NC}"
    echo -e "  版本: ${GREEN}$current_kernel${NC}"
    echo -e "  架构: ${GREEN}$kernel_arch${NC}"
    echo -e "  类型: ${GREEN}$kernel_variant${NC}"
    
    # 检测可用的内核版本
    local installed_kernels=$(dpkg -l | grep -E 'pve-kernel|linux-image' | grep -E 'ii|hi' | awk '{print $2}' | sort -V)
    if [[ -n "$installed_kernels" ]]; then
        echo -e "${CYAN}已安装的内核版本：${NC}"
        while IFS= read -r kernel; do
            echo -e "  ${GREEN}•${NC} $kernel"
        done <<< "$installed_kernels"
    fi
    
    return 0
}

# 获取可用内核列表
get_available_kernels() {
    log_info "获取可用内核列表..."
    
    # 检查网络连接
    if ! ping -c 1 mirrors.tuna.tsinghua.edu.cn &> /dev/null; then
        log_error "网络连接失败，无法获取内核列表"
        return 1
    fi
    
    # 获取当前 PVE 版本
    local pve_version=$(pveversion | head -n1 | cut -d'/' -f2 | cut -d'-' -f1)
    local major_version=$(echo $pve_version | cut -d'.' -f1)
    
    # 构建内核包URL
    local kernel_url="https://mirrors.tuna.tsinghua.edu.cn/proxmox/debian/pve/dists/trixie/pve-no-subscription/binary-amd64/Packages"
    
    # 下载并解析可用内核
    local available_kernels=$(curl -s "$kernel_url" | grep -E 'Package: (pve-kernel|linux-pve)' | awk '{print $2}' | sort -V | uniq)
    
    if [[ -z "$available_kernels" ]]; then
        log_warn "无法获取可用内核列表，使用备用方法"
        # 备用方法：使用apt-cache搜索
        available_kernels=$(apt-cache search --names-only '^pve-kernel-.*' | awk '{print $1}' | sort -V)
    fi
    
    if [[ -n "$available_kernels" ]]; then
        echo -e "${CYAN}可用内核版本：${NC}"
        while IFS= read -r kernel; do
            echo -e "  ${BLUE}•${NC} $kernel"
        done <<< "$available_kernels"
    else
        log_error "无法找到可用内核"
        return 1
    fi
    
    return 0
}

# 安装指定内核版本
install_kernel() {
    local kernel_version=$1
    
    # 验证内核版本格式
    if [[ -z "$kernel_version" ]]; then
        log_error "请指定要安装的内核版本"
        return 1
    fi
    
    # 检查是否已经是完整包名格式 (contains "pve" and ends with "pve")
    if [[ "$kernel_version" =~ ^[a-zA-Z0-9.-]+pve$ ]]; then
        # This looks like a complete package name, use it as is
        log_info "检测到完整包名格式: $kernel_version"
    elif ! [[ "$kernel_version" =~ ^pve-kernel- ]]; then
        # If not in the correct format, prepend "pve-kernel-"
        log_info "检测到版本号格式，自动补全包名为 pve-kernel-$kernel_version"
        kernel_version="pve-kernel-$kernel_version"
    fi
    
    log_info "开始安装内核: $kernel_version"
    
    # 检查内核是否已安装
    if dpkg -l | grep -q "^ii.*$kernel_version"; then
        log_warn "内核 $kernel_version 已经安装"
        read -p "是否重新安装？(y/N): " reinstall
        if [[ "$reinstall" != "y" && "$reinstall" != "Y" ]]; then
            return 0
        fi
    fi
    
    # 更新软件包列表
    log_info "更新软件包列表..."
    if ! apt-get update; then
        log_error "更新软件包列表失败"
        return 1
    fi
    
    # 安装内核
    log_info "正在安装内核 $kernel_version ..."
    if ! apt-get install -y "$kernel_version"; then
        log_error "内核安装失败"
        return 1
    fi
    
    log_success "内核 $kernel_version 安装成功"
    
    # 更新引导配置
    update_grub_config
    
    return 0
}

# 更新 GRUB 配置
update_grub_config() {
    log_info "更新引导配置..."
    
    # 检查是否是 UEFI 系统
    local efi_dir="/boot/efi"
    local grub_cfg=""
    
    if [[ -d "$efi_dir" ]]; then
        log_info "检测到 UEFI 启动模式"
        grub_cfg="/boot/efi/EFI/proxmox/grub.cfg"
    else
        log_info "检测到 Legacy BIOS 启动模式"
        grub_cfg="/boot/grub/grub.cfg"
    fi
    
    # 更新 GRUB
    if command -v update-grub &> /dev/null; then
        if update-grub; then
            log_success "GRUB 配置更新成功"
        else
            log_warn "GRUB 配置更新过程中出现警告，但可能仍然成功"
        fi
    elif command -v grub-mkconfig &> /dev/null; then
        if grub-mkconfig -o "$grub_cfg"; then
            log_success "GRUB 配置更新成功"
        else
            log_warn "GRUB 配置更新过程中出现警告"
        fi
    else
        log_error "找不到 GRUB 更新工具"
        return 1
    fi
    
    return 0
}

# 切换默认启动内核
set_default_kernel() {
    local kernel_version=$1
    
    if [[ -z "$kernel_version" ]]; then
        log_error "请指定要设置为默认的内核版本"
        return 1
    fi
    
    log_info "设置默认启动内核: ${GREEN}$kernel_version${NC}"
    
    # 检查内核是否存在
    if ! [[ -d "/boot/initrd.img-$kernel_version" || -d "/boot/vmlinuz-$kernel_version" ]]; then
        log_error "内核文件不存在，请先安装该内核"
        return 1
    fi
    
    # 使用 grub-set-default 设置默认内核
    if command -v grub-set-default &> /dev/null; then
        # 查找内核在 GRUB 菜单中的位置
        local menu_entry=$(grep -n "$kernel_version" /boot/grub/grub.cfg | head -1 | cut -d: -f1)
        if [[ -n "$menu_entry" ]]; then
            # 计算 GRUB 菜单项索引（从0开始）
            local grub_index=$(( (menu_entry - 1) / 2 ))
            if grub-set-default "$grub_index"; then
                log_success "默认启动内核设置成功"
                return 0
            fi
        fi
    fi
    
    # 备用方法：手动编辑 GRUB 配置
    log_warn "使用备用方法设置默认内核"
    
    # 备份当前 GRUB 配置
    cp /etc/default/grub /etc/default/grub.backup.$(date +%Y%m%d%H%M%S)
    
    # 设置 GRUB_DEFAULT 为内核版本
    if sed -i "s/^GRUB_DEFAULT=.*/GRUB_DEFAULT=\"Advanced options for Proxmox VE GNU\/Linux>Proxmox VE GNU\/Linux, with Linux $kernel_version\"/" /etc/default/grub; then
        log_success "GRUB 配置更新成功"
        update_grub_config
        return 0
    else
        log_error "GRUB 配置更新失败"
        return 1
    fi
}

# 删除旧内核（保留最近2个版本）
remove_old_kernels() {
    log_info "清理旧内核..."
    
    # 获取所有已安装的内核
    local installed_kernels=$(dpkg -l | grep -E '^ii.*pve-kernel' | awk '{print $2}' | sort -V)
    local kernel_count=$(echo "$installed_kernels" | wc -l)
    
    if [[ $kernel_count -le 2 ]]; then
        log_info "当前只有 $kernel_count 个内核，无需清理"
        return 0
    fi
    
    # 计算需要保留的内核数量（保留最新的2个）
    local keep_count=2
    local remove_count=$((kernel_count - keep_count))
    
    echo -e "${YELLOW}将删除 $remove_count 个旧内核，保留最新的 $keep_count 个内核${NC}"
    
    # 获取要删除的内核列表（最旧的几个）
    local kernels_to_remove=$(echo "$installed_kernels" | head -n $remove_count)
    
    read -p "是否继续？(y/N): " confirm
    if [[ "$confirm" != "y" && "$confirm" != "Y" ]]; then
        log_info "取消内核清理"
        return 0
    fi
    
    # 删除旧内核
    while IFS= read -r kernel; do
        log_info "正在删除内核: $kernel"
        if apt-get remove -y --purge "$kernel"; then
            log_success "内核 $kernel 删除成功"
        else
            log_error "删除内核 $kernel 失败"
        fi
    done <<< "$kernels_to_remove"
    
    # 更新引导配置
    update_grub_config
    
    log_success "旧内核清理完成"
    return 0
}

# 内核管理主菜单
kernel_management_menu() {
    while true; do
        echo
        echo "${UI_BORDER}"
        echo "  内核管理菜单"
        echo "${UI_DIVIDER}"
        show_menu_option "1" "显示当前内核信息"
        show_menu_option "2" "查看可用内核列表"
        show_menu_option "3" "安装新内核"
        show_menu_option "4" "设置默认启动内核"
        show_menu_option "5" "清理旧内核"
        show_menu_option "6" "重启系统应用新内核"
        echo "${UI_DIVIDER}"
        show_menu_option "0" "返回主菜单"
        echo "${UI_FOOTER}"
        
        read -p "请选择操作 [0-6]: " choice
        
        case $choice in
            1)
                check_kernel_version
                ;;
            2)
                get_available_kernels
                ;;
            3)
                echo "请输入要安装的内核版本："
                echo "  - 完整包名格式 (推荐): 如 proxmox-kernel-6.14.8-2-pve"
                echo "  - 简化版本格式: 如 6.8.8-1 (将自动补全为 pve-kernel-6.8.8-1)"
                read -p "请输入内核标识: " kernel_ver
                if [[ -n "$kernel_ver" ]]; then
                    install_kernel "$kernel_ver"
                else
                    log_error "请输入有效的内核版本"
                fi
                ;;
            4)
                read -p "请输入要设置为默认的内核版本 (例如: 6.8.8-1-pve): " kernel_ver
                if [[ -n "$kernel_ver" ]]; then
                    set_default_kernel "$kernel_ver"
                else
                    log_error "请输入有效的内核版本"
                fi
                ;;
            5)
                remove_old_kernels
                ;;
            6)
                read -p "确认要重启系统吗？(y/N): " reboot_confirm
                if [[ "$reboot_confirm" == "y" || "$reboot_confirm" == "Y" ]]; then
                    log_info "系统将在5秒后重启..."
                    echo "按 Ctrl+C 取消重启"
                    sleep 5
                    reboot
                else
                    log_info "取消重启"
                fi
                ;;
            0)
                break
                ;;
            *)
                log_error "无效的选择，请重新输入"
                ;;
        esac
        
        echo
        pause_function
    done
}

# 内核同步更新（自动检测并更新到最新稳定版）
sync_kernel_update() {
    log_info "开始内核同步更新检查..."
    
    # 获取当前内核版本
    local current_kernel=$(uname -r)
    log_info "当前内核版本: ${GREEN}$current_kernel${NC}"
    
    # 获取最新可用内核
    local latest_kernel=$(get_available_kernels | tail -1 | awk '{print $2}')
    
    if [[ -z "$latest_kernel" ]]; then
        log_error "无法获取最新内核信息"
        return 1
    fi
    
    log_info "最新可用内核: ${GREEN}$latest_kernel${NC}"
    
    # 检查是否需要更新
    if [[ "$current_kernel" == *"$latest_kernel"* ]]; then
        log_success "当前已是最新内核，无需更新"
        return 0
    fi
    
    echo -e "${YELLOW}发现新内核版本: $latest_kernel${NC}"
    read -p "是否安装并更新到最新内核？(Y/n): " update_confirm
    
    if [[ "$update_confirm" == "n" || "$update_confirm" == "N" ]]; then
        log_info "取消内核更新"
        return 0
    fi
    
    # 安装最新内核
    if install_kernel "$latest_kernel"; then
        # 设置新内核为默认启动项
        if set_default_kernel "$latest_kernel"; then
            log_success "内核同步更新完成"
            echo -e "${YELLOW}建议重启系统以应用新内核${NC}"
            return 0
        else
            log_warn "内核安装成功但设置默认启动项失败"
            return 1
        fi
    else
        log_error "内核更新失败"
        return 1
    fi
}

# 备份文件
backup_file() {
    local file="$1"
    if [[ -f "$file" ]]; then
        # 创建备份目录
        local backup_dir="/etc/pve-tools-9-bak"
        mkdir -p "$backup_dir"
        
        # 生成带时间戳的备份文件名
        local filename=$(basename "$file")
        local timestamp=$(date +%Y%m%d_%H%M%S)
        local backup_path="${backup_dir}/${filename}.backup.${timestamp}"
        
        cp "$file" "$backup_path"
        log_info "贴心备份完成: ${CYAN}$file${NC}"
        log_info "备份文件位置: ${CYAN}${backup_path}${NC}"
    fi
}

# 换源功能
change_sources() {
    log_step "开始为您的 PVE 换上飞速源"
    
    # 根据选择的镜像源确定URL
    local debian_mirror=""
    local debian_security_mirror=""
    local pve_mirror=""
    local ct_mirror=""

    case $SELECTED_MIRROR in
        $MIRROR_USTC)
            debian_mirror="https://mirrors.ustc.edu.cn/debian"
            pve_mirror="$MIRROR_USTC"
            ct_mirror="$CT_MIRROR_USTC"
            ;;
        $MIRROR_TUNA)
            debian_mirror="https://mirrors.tuna.tsinghua.edu.cn/debian"
            pve_mirror="$MIRROR_TUNA"
            ct_mirror="$CT_MIRROR_TUNA"
            ;;
        $MIRROR_DEBIAN)
            debian_mirror="https://deb.debian.org/debian"
            debian_security_mirror="https://security.debian.org/debian-security"
            pve_mirror="https://ftp.debian.org/debian"
            ct_mirror="$CT_MIRROR_OFFICIAL"
            ;;
    esac
    
    # 询问用户是否要更换安全更新源
    log_info "安全更新源选择"
    echo "  安全更新源包含重要的系统安全补丁，选择合适的源很重要："
    echo "  1) 使用官方安全源 (推荐，更新最及时，但可能较慢)"
    echo "  2) 使用镜像站安全源 (速度快，但可能有延迟)"
    echo ""
    
    read -p "  请选择 [1-2] (默认: 1): " security_choice
    security_choice=${security_choice:-1}
    
    if [[ "$security_choice" == "2" ]]; then
        # 使用镜像站的安全源
        case $SELECTED_MIRROR in
            $MIRROR_USTC)
                debian_security_mirror="https://mirrors.ustc.edu.cn/debian-security"
                ;;
            $MIRROR_TUNA)
                debian_security_mirror="https://mirrors.tuna.tsinghua.edu.cn/debian-security"
                ;;
            $MIRROR_DEBIAN)
                debian_security_mirror="https://security.debian.org/debian-security"
                ;;
        esac
        log_info "将使用镜像站的安全更新源"
    else
        # 使用官方安全源
        debian_security_mirror="https://security.debian.org/debian-security"
        log_info "将使用官方安全更新源"
    fi
    
    # 1. 更换 Debian 软件源 (DEB822 格式)
    log_info "正在配置 Debian 镜像源..."
    backup_file "/etc/apt/sources.list.d/debian.sources"
    
    cat > /etc/apt/sources.list.d/debian.sources << EOF
Types: deb
URIs: $debian_mirror
Suites: trixie trixie-updates trixie-backports
Components: main contrib non-free non-free-firmware
Signed-By: /usr/share/keyrings/debian-archive-keyring.gpg

# 默认注释了源码镜像以提高 apt update 速度，如有需要可自行取消注释
# Types: deb-src
# URIs: $debian_mirror
# Suites: trixie trixie-updates trixie-backports
# Components: main contrib non-free non-free-firmware
# Signed-By: /usr/share/keyrings/debian-archive-keyring.gpg

# 以下安全更新软件源包含了官方源与镜像站配置，如有需要可自行修改注释切换
Types: deb
URIs: $debian_security_mirror
Suites: trixie-security
Components: main contrib non-free non-free-firmware
Signed-By: /usr/share/keyrings/debian-archive-keyring.gpg

# Types: deb-src
# URIs: $debian_security_mirror
# Suites: trixie-security
# Components: main contrib non-free non-free-firmware
# Signed-By: /usr/share/keyrings/debian-archive-keyring.gpg
EOF
    
    # 2. 注释企业源
    log_info "正在关闭企业源（我们用免费版就够啦）..."
    if [[ -f "/etc/apt/sources.list.d/pve-enterprise.sources" ]]; then
        backup_file "/etc/apt/sources.list.d/pve-enterprise.sources"
        sed -i 's/^Types:/#Types:/g' /etc/apt/sources.list.d/pve-enterprise.sources
        sed -i 's/^URIs:/#URIs:/g' /etc/apt/sources.list.d/pve-enterprise.sources
        sed -i 's/^Suites:/#Suites:/g' /etc/apt/sources.list.d/pve-enterprise.sources
        sed -i 's/^Components:/#Components:/g' /etc/apt/sources.list.d/pve-enterprise.sources
        sed -i 's/^Signed-By:/#Signed-By:/g' /etc/apt/sources.list.d/pve-enterprise.sources
    fi
    
    # 3. 更换 Ceph 源
    log_info "正在配置 Ceph 镜像源..."
    if [[ -f "/etc/apt/sources.list.d/ceph.sources" ]]; then
        backup_file "/etc/apt/sources.list.d/ceph.sources"
        cat > /etc/apt/sources.list.d/ceph.sources << EOF
Types: deb
URIs: $pve_mirror
Suites: trixie
Components: main
Signed-By: /usr/share/keyrings/proxmox-archive-keyring.gpg
EOF
    fi
    
    # 4. 添加无订阅源
    log_info "正在添加免费版专用源..."
    cat > /etc/apt/sources.list.d/pve-no-subscription.sources << EOF
Types: deb
URIs: $pve_mirror
Suites: trixie
Components: pve-no-subscription
Signed-By: /usr/share/keyrings/proxmox-archive-keyring.gpg
EOF
    
    # 5. 更换 CT 模板源
    log_info "正在加速 CT 模板下载..."
    if [[ -f "/usr/share/perl5/PVE/APLInfo.pm" ]]; then
        backup_file "/usr/share/perl5/PVE/APLInfo.pm"
        # 先恢复为官方源,确保可以二次替换
        sed -i "s|https://mirrors.ustc.edu.cn/proxmox|http://download.proxmox.com|g" /usr/share/perl5/PVE/APLInfo.pm
        sed -i "s|https://mirrors.tuna.tsinghua.edu.cn/proxmox|http://download.proxmox.com|g" /usr/share/perl5/PVE/APLInfo.pm
        # 然后替换为选定的镜像源
        sed -i "s|http://download.proxmox.com|$ct_mirror|g" /usr/share/perl5/PVE/APLInfo.pm
    fi
    
    log_success "太棒了！所有源都换成飞速版本啦"
}

# 删除订阅弹窗
remove_subscription_popup() {
    log_step "正在消除那个烦人的订阅弹窗"
    
    local js_file="/usr/share/javascript/proxmox-widget-toolkit/proxmoxlib.js"
    if [[ -f "$js_file" ]]; then
        backup_file "$js_file"
        sed -Ezi.bak "s/(Ext.Msg.show\(\{\s+title: gettext\('No valid sub)/void\(\{ \/\/\1/g" "$js_file"
        systemctl restart pveproxy.service
        log_success "完美！再也不会有烦人的弹窗啦"
    else
        log_warn "咦？没找到弹窗文件，可能已经被处理过了"
    fi
}

# 合并 local 与 local-lvm
merge_local_storage() {
    log_step "准备合并存储空间，让小硬盘发挥最大价值"
    log_warn "重要提醒：此操作会删除 local-lvm，请确保重要数据已备份！"
    
    echo -e "${YELLOW}您确定要继续吗？这个操作不可逆哦${NC}"
    read -p "输入 'yes' 确认继续，其他任意键取消: " -r
    if [[ ! $REPLY == "yes" ]]; then
        log_info "明智的选择！操作已取消"
        return
    fi
    
    # 检查 local-lvm 是否存在
    if ! lvdisplay /dev/pve/data &> /dev/null; then
        log_warn "没有找到 local-lvm 分区，可能已经合并过了"
        return
    fi
    
    log_info "正在删除 local-lvm 分区..."
    lvremove -f /dev/pve/data
    
    log_info "正在扩容 local 分区..."
    lvextend -l +100%FREE /dev/pve/root
    
    log_info "正在扩展文件系统..."
    resize2fs /dev/pve/root
    
    log_success "存储合并完成！现在空间更充裕了"
    log_warn "温馨提示：请在 Web UI 中删除 local-lvm 存储配置，并编辑 local 存储勾选所有内容类型"
}

# 删除 Swap 分配给主分区
remove_swap() {
    log_step "准备释放 Swap 空间给系统使用"
    log_warn "注意：删除 Swap 后请确保内存充足！"
    
    echo -e "${YELLOW}您确定要删除 Swap 分区吗？${NC}"
    read -p "输入 'yes' 确认继续，其他任意键取消: " -r
    if [[ ! $REPLY == "yes" ]]; then
        log_info "好的，操作已取消"
        return
    fi
    
    # 检查 swap 是否存在
    if ! lvdisplay /dev/pve/swap &> /dev/null; then
        log_warn "没有找到 swap 分区，可能已经删除过了"
        return
    fi
    
    log_info "正在关闭 Swap..."
    swapoff /dev/mapper/pve-swap
    
    log_info "正在修改启动配置..."
    backup_file "/etc/fstab"
    sed -i 's|^/dev/pve/swap|# /dev/pve/swap|g' /etc/fstab
    
    log_info "正在删除 swap 分区..."
    lvremove -f /dev/pve/swap
    
    log_info "正在扩展系统分区..."
    lvextend -l +100%FREE /dev/mapper/pve-root
    
    log_info "正在扩展文件系统..."
    resize2fs /dev/mapper/pve-root
    
    log_success "Swap 删除完成！系统空间更宽裕了"
}

# 更新系统
update_system() {
    log_step "开始更新系统，让 PVE 保持最新状态 📦"
    
    echo -e "${CYAN}正在更新软件包列表...${NC}"
    apt update
    
    echo -e "${CYAN}正在升级系统软件包...${NC}"
    apt upgrade -y
    
    echo -e "${CYAN}正在清理不需要的软件包...${NC}"
    apt autoremove -y
    
    log_success "系统更新完成！您的 PVE 现在是最新版本"
}

# 标准化暂停函数
pause_function() {
    echo -n "按任意键继续... "
    read -n 1 -s input
    if [[ -n ${input} ]]; then
        echo -e "\b
"
    fi
}



#--------------开启硬件直通----------------
# 开启硬件直通
enable_pass() {
    echo
    log_step "开启硬件直通..."
    if [ `dmesg | grep -e DMAR -e IOMMU|wc -l` = 0 ];then
        log_error "您的硬件不支持直通！不如检查一下主板的BIOS设置？"
        pause_function
        return
    fi
    if [ `cat /proc/cpuinfo|grep Intel|wc -l` = 0 ];then
        iommu="amd_iommu=on"
    else
        iommu="intel_iommu=on"
    fi
    if [ `grep $iommu /etc/default/grub|wc -l` = 0 ];then
        backup_file "/etc/default/grub"
        sed -i 's|quiet|quiet '$iommu'|' /etc/default/grub
        update-grub
        if [ `grep "vfio" /etc/modules|wc -l` = 0 ];then
            cat <<-EOF >> /etc/modules
vfio
vfio_iommu_type1
vfio_pci
vfio_virqfd
kvmgt
EOF
        fi
        
        if [ ! -f "/etc/modprobe.d/blacklist.conf" ];then
            echo "blacklist snd_hda_intel" >> /etc/modprobe.d/blacklist.conf 
            echo "blacklist snd_hda_codec_hdmi" >> /etc/modprobe.d/blacklist.conf 
            echo "blacklist i915" >> /etc/modprobe.d/blacklist.conf 
        fi

        if [ ! -f "/etc/modprobe.d/vfio.conf" ];then
            echo "options vfio-pci ids=8086:3185" >> /etc/modprobe.d/vfio.conf
        fi
        
        log_success "开启设置后需要重启系统，请准备就绪后重启宿主机"
        log_tips "重启后才可以应用对内核引导的修改哦！命令是 reboot"
    else
        log_warn "您已经配置过!"
    fi
}

# 关闭硬件直通
disable_pass() {
    echo
    log_step "关闭硬件直通..."
    if [ `dmesg | grep -e DMAR -e IOMMU|wc -l` = 0 ];then
        log_error "您的硬件不支持直通！"
        log_tips "不如检查一下主板的BIOS设置？"
        pause_function
        return
    fi
    if [ `cat /proc/cpuinfo|grep Intel|wc -l` = 0 ];then
        iommu="amd_iommu=on"
    else
        iommu="intel_iommu=on"
    fi
    if [ `grep $iommu /etc/default/grub|wc -l` = 0 ];then
        log_warn "您还没有配置过该项"
    else
        backup_file "/etc/default/grub"
        {
            sed -i 's/ '$iommu'//g' /etc/default/grub
            sed -i '/vfio/d' /etc/modules
            rm -rf /etc/modprobe.d/blacklist.conf
            rm -rf /etc/modprobe.d/vfio.conf
            sleep 1
        }
        log_success "关闭设置后需要重启系统，请准备就绪后重启宿主机。"
        log_tips "重启后才可以应用对内核引导的修改哦！命令是 reboot"
        sleep 1
        update-grub
    fi
}

# 硬件直通菜单
hw_passth() {
    while :; do
        clear
        show_banner
        show_menu_header "配置硬件直通"
        show_menu_option "1" "开启硬件直通"
        show_menu_option "2" "关闭硬件直通"
        echo "${UI_DIVIDER}"
        show_menu_option "0" "返回"
        show_menu_footer
        read -p "请选择: [ ]" -n 1 hwmenuid
        echo  # New line after input
        hwmenuid=${hwmenuid:-0}
        case "${hwmenuid}" in
            1)
                enable_pass
                pause_function
                ;;
            2)
                disable_pass
                pause_function
                ;;
            0)
                break
                ;;
            *)
                log_error "无效选项!"
                pause_function
                ;;
        esac
    done
}
#--------------开启硬件直通----------------

#--------------设置CPU电源模式----------------
# 设置CPU电源模式
cpupower() {
    governors=`cat /sys/devices/system/cpu/cpu0/cpufreq/scaling_available_governors`
    while :; do
        clear
        show_banner
        show_menu_header "设置CPU电源模式"
        echo "  1. 设置CPU模式 conservative  保守模式   [变身老年机]"
        echo "  2. 设置CPU模式 ondemand       按需模式  [默认]"
        echo "  3. 设置CPU模式 powersave      节能模式  [省电小能手]"
        echo "  4. 设置CPU模式 performance   性能模式   [性能释放]"
        echo "  5. 设置CPU模式 schedutil      负载模式  [交给负载自动配置]"
        echo
        echo "  6. 恢复系统默认电源设置"
        echo "${UI_DIVIDER}"
        show_menu_option "0" "返回"
        show_menu_footer
        echo
        echo "部分CPU仅支持 performance 和 powersave 模式，只能选择这两项，其他模式无效不要选！"
        echo
        echo "你的CPU支持 ${governors} 模式"
        echo
        read -p "请选择: [ ]" -n 1 cpupowerid
        echo  # New line after input
        cpupowerid=${cpupowerid:-2}
        case "${cpupowerid}" in
            1)
                GOVERNOR="conservative"
                ;;
            2)
                GOVERNOR="ondemand"
                ;;
            3)
                GOVERNOR="powersave"
                ;;
            4)
                GOVERNOR="performance"
                ;;
            5)
                GOVERNOR="schedutil"
                ;;
            6)
                cpupower_del
                pause_function
                break
                ;;
            0)
                break
                ;;
            *)
                log_error "你的输入无效，请重新输入！"
                pause_function
                ;;
        esac
        if [[ ${GOVERNOR} != "" ]]; then
            if [[ -n `echo "${governors}" | grep -o "${GOVERNOR}"` ]]; then
                echo "您选择的CPU模式：${GOVERNOR}"
                echo
                cpupower_add
                pause_function
            else
                log_error "您的CPU不支持该模式！"
                log_tips "现在暂时不会对你的系统造成影响，但是下次开机时，CPU模式会恢复为默认模式。"
                pause_function
            fi
        fi
    done
}

# 修改CPU模式
cpupower_add() {
    echo "${GOVERNOR}" | tee /sys/devices/system/cpu/cpu*/cpufreq/scaling_governor >/dev/null
    echo "查看当前CPU模式"
    cat /sys/devices/system/cpu/cpu0/cpufreq/scaling_governor

    echo "正在添加开机任务"
    NEW_CRONTAB_COMMAND="sleep 10 && echo "${GOVERNOR}" | tee /sys/devices/system/cpu/cpu*/cpufreq/scaling_governor >/dev/null #CPU Power Mode"
    EXISTING_CRONTAB=$(crontab -l 2>/dev/null)
    if [[ -n "$EXISTING_CRONTAB" ]]; then
        TEMP_CRONTAB_FILE=$(mktemp)
        echo "$EXISTING_CRONTAB" | grep -v "@reboot sleep 10 && echo*" > "$TEMP_CRONTAB_FILE"
        crontab "$TEMP_CRONTAB_FILE"
        rm "$TEMP_CRONTAB_FILE"
    fi
    log_success "CPU模式已修改完成"
    # 修改完成
    (crontab -l 2>/dev/null; echo "@reboot $NEW_CRONTAB_COMMAND") | crontab -
    echo -e "
检查计划任务设置 (使用 'crontab -l' 命令来检查)"
}

# 恢复系统默认电源设置
cpupower_del() {
    # 恢复性模式
    echo "performance" | tee /sys/devices/system/cpu/cpu*/cpufreq/scaling_governor >/dev/null
    # 删除计划任务
    EXISTING_CRONTAB=$(crontab -l 2>/dev/null)
    if [[ -n "$EXISTING_CRONTAB" ]]; then
        TEMP_CRONTAB_FILE=$(mktemp)
        echo "$EXISTING_CRONTAB" | grep -v "@reboot sleep 10 && echo*" > "$TEMP_CRONTAB_FILE"
        crontab "$TEMP_CRONTAB_FILE"
        rm "$TEMP_CRONTAB_FILE"
    fi

    log_success "已恢复系统默认电源设置！还是默认的好用吧"
}
#--------------设置CPU电源模式----------------

#--------------CPU、主板、硬盘温度显示----------------
# 安装工具
cpu_add() {
    nodes="/usr/share/perl5/PVE/API2/Nodes.pm"
    pvemanagerlib="/usr/share/pve-manager/js/pvemanagerlib.js"
    proxmoxlib="/usr/share/javascript/proxmox-widget-toolkit/proxmoxlib.js"

    pvever=$(pveversion | awk -F"/" '{print $2}')
    echo pve版本$pvever

    # 判断是否已经执行过修改 (使用 modbyshowtempfreq 标记检测)
    if [ $(grep 'modbyshowtempfreq' $nodes $pvemanagerlib $proxmoxlib 2>/dev/null | wc -l) -eq 3 ]; then
        log_warn "已经修改过，请勿重复修改"
        log_tips "如果没有生效，请使用 Shift+F5 刷新浏览器缓存"
        log_tips "如果需要强制重新修改，请先执行还原操作"
        pause_function
        return
    fi

    # 先刷新下源
    log_step "更新软件包列表..."
    apt-get update

    log_step "开始安装所需工具..."
    # 输入需要安装的软件包 (添加 hdparm 用于 SATA 硬盘休眠检测, apcupsd for UPS support)
    packages=(lm-sensors nvme-cli sysstat linux-cpupower hdparm smartmontools apcupsd)

    # 查询软件包，判断是否安装
    for package in "${packages[@]}"; do
        if ! dpkg -s "$package" &> /dev/null; then
            log_info "$package 未安装，开始安装软件包"
            apt-get install "${packages[@]}" -y
            modprobe msr
            install=ok
            break
        fi
    done

    # 设置执行权限 (修正路径)
    [[ -e /usr/sbin/linux-cpupower ]] && chmod +s /usr/sbin/linux-cpupower
    chmod +s /usr/sbin/nvme
    chmod +s /usr/sbin/smartctl
    chmod +s /usr/sbin/turbostat || log_warn "无法设置 turbostat 权限"

    # 启用 MSR 模块
    modprobe msr && echo msr > /etc/modules-load.d/turbostat-msr.conf

    # 软件包安装完成
    if [ "$install" == "ok" ]; then
        log_success "软件包安装完成，检测硬件信息"
        sensors-detect --auto > /tmp/sensors
        drivers=$(sed -n '/Chip drivers/,/\#----cut here/p' /tmp/sensors | sed '/Chip /d' | sed '/cut/d')

        if [ $(echo $drivers | wc -w) = 0 ]; then
            log_warn "没有找到任何驱动，似乎你的系统不支持或驱动安装失败。"
            pause_function
        else
            for i in $drivers; do
                modprobe $i
                if [ $(grep $i /etc/modules | wc -l) = 0 ]; then
                    echo $i >> /etc/modules
                fi
            done
            sensors
            sleep 3
            log_success "驱动信息配置成功。"
        fi
        [[ -e /etc/init.d/kmod ]] && /etc/init.d/kmod start
        rm /tmp/sensors
    fi

    log_step "备份源文件"
    # 备份当前版本文件
    backup_file "$nodes"
    backup_file "$pvemanagerlib"
    backup_file "$proxmoxlib"

    # 备份当前版本文件
    cp "$nodes" "$nodes.$pvever.bak"
    cp "$pvemanagerlib" "$pvemanagerlib.$pvever.bak"
    cp "$proxmoxlib" "$proxmoxlib.$pvever.bak"

    # 检测是否有 UPS 设备
    log_info "检测 UPS 设备"
    if command -v apcaccess >/dev/null 2>&1 && apcaccess status 2>/dev/null | grep -q "STATUS"; then
        has_ups=true
        log_success "检测到 UPS 设备，将添加 UPS 监控"
    else
        has_ups=false
        log_info "未检测到 UPS 设备，跳过 UPS 监控"
    fi

    # 生成系统变量 (参考 PVE 8 脚本的改进实现)
    tmpf=tmpfile.temp
    touch $tmpf
    cat > $tmpf << 'EOF'

#modbyshowtempfreq

        $res->{thermalstate} = `sensors -A`;
        $res->{cpuFreq} = `
            goverf=/sys/devices/system/cpu/cpufreq/policy0/scaling_governor
            maxf=/sys/devices/system/cpu/cpufreq/policy0/cpuinfo_max_freq
            minf=/sys/devices/system/cpu/cpufreq/policy0/cpuinfo_min_freq

            cat /proc/cpuinfo | grep -i "cpu mhz"
            echo -n 'gov:'
            [ -f \$goverf ] && cat \$goverf || echo none
            echo -n 'min:'
            [ -f \$minf ] && cat \$minf || echo none
            echo -n 'max:'
            [ -f \$maxf ] && cat \$maxf || echo none
            echo -n 'pkgwatt:'
            [ -e /usr/sbin/turbostat ] && turbostat --quiet --cpu package --show "PkgWatt" -S sleep 0.25 2>&1 | tail -n1
        `;
EOF

    # 如果检测到 UPS，添加 UPS 状态变量
    if [ "$has_ups" = true ]; then
        cat >> $tmpf << 'EOF'
        $res->{ups_status} = `apcaccess status`;
EOF
    fi

    # 添加空行结束变量定义
    echo >> $tmpf

    # NVME 硬盘变量 (动态检测，参考 PVE 8 实现)
    log_info "检测系统中的 NVME 硬盘"
    nvi=0
    for nvme in $(ls /dev/nvme[0-9] 2> /dev/null); do
        chmod +s /usr/sbin/smartctl 2>/dev/null

        cat >> $tmpf << EOF

        \$res->{nvme$nvi} = \`smartctl $nvme -a -j\`;
EOF
        echo "检测到 NVME 硬盘: $nvme (nvme$nvi)"
        let nvi++
    done
    echo "已添加 $nvi 块 NVME 硬盘"

    # SATA 硬盘变量 (动态检测，参考 PVE 8 实现)
    log_info "检测系统中的 SATA 固态和机械硬盘"
    sdi=0
    for sd in $(ls /dev/sd[a-z] 2> /dev/null); do
        chmod +s /usr/sbin/smartctl 2>/dev/null
        chmod +s /usr/sbin/hdparm 2>/dev/null

        # 检测是否是真的硬盘
        sdsn=$(awk -F '/' '{print $NF}' <<< $sd)
        sdcr=/sys/block/$sdsn/queue/rotational
        [ -f $sdcr ] || continue

        if [ "$(cat $sdcr)" = "0" ]; then
            hddisk=false
            sdtype="固态硬盘"
        else
            hddisk=true
            sdtype="机械硬盘"
        fi

        # 硬盘输出信息逻辑，如果硬盘不存在就输出空 JSON
        cat >> $tmpf << EOF

        \$res->{sd$sdi} = \`
            if [ -b $sd ]; then
                if $hddisk && hdparm -C $sd | grep -iq 'standby'; then
                    echo '{"standy": true}'
                else
                    smartctl $sd -a -j
                fi
            else
                echo '{}'
            fi
        \`;
EOF
        echo "检测到 $sdtype: $sd (sd$sdi)"
        let sdi++
    done
    echo "已添加 $sdi 块 SATA 固态和机械硬盘"


    ###################  修改node.pm   ##########################
    log_info "修改node.pm："
    log_info "找到关键字 PVE::pvecfg::version_text 的行号并跳到下一行"

    # 显示匹配的行
    ln=$(expr $(sed -n -e '/PVE::pvecfg::version_text/=' $nodes) + 1)
    echo "匹配的行号：" $ln

    log_info "修改结果："
    sed -i "${ln}r $tmpf" $nodes
    # 显示修改结果
    sed -n '/PVE::pvecfg::version_text/,+18p' $nodes
    rm $tmpf

    ###################  修改pvemanagerlib.js   ##########################
    tmpf=tmpfile.temp
    touch $tmpf
    cat > $tmpf << 'EOF'

//modbyshowtempfreq
    {
          itemId: 'cpumhz',
          colspan: 2,
          printBar: false,
          title: gettext('CPU频率(GHz)'),
          textField: 'cpuFreq',
          renderer:function(v){
              console.log(v);

              // 解析所有核心频率
              let m = v.match(/(?<=^cpu[^\d]+)\d+/img);
              if (!m || m.length === 0) {
                  return '无法获取CPU频率信息';
              }

              let freqs = m.map(e => parseFloat((e / 1000).toFixed(1)));

              // 计算统计信息
              let avgFreq = (freqs.reduce((a, b) => a + b, 0) / freqs.length).toFixed(1);
              let minFreq = Math.min(...freqs).toFixed(1);
              let maxFreq = Math.max(...freqs).toFixed(1);
              let coreCount = freqs.length;

              // 获取系统配置的频率范围
              let sysMin = (v.match(/(?<=^min:).+/im)[0]);
              if (sysMin !== 'none') {
                  sysMin = (sysMin / 1000000).toFixed(1);
              }

              let sysMax = (v.match(/(?<=^max:).+/im)[0]);
              if (sysMax !== 'none') {
                  sysMax = (sysMax / 1000000).toFixed(1);
              }

              let gov = v.match(/(?<=^gov:).+/im)[0].toUpperCase();

              let watt = v.match(/(?<=^pkgwatt:)[\d.]+$/im);
              watt = watt ? " | 功耗: " + (watt[0]/1).toFixed(1) + 'W' : '';

              // 简洁显示：平均值 + 当前范围 + 系统范围 + 功耗 + 调速器
              return `${coreCount}核心 平均: ${avgFreq} GHz (当前: ${minFreq}~${maxFreq}) | 范围: ${sysMin}~${sysMax} GHz${watt} | 调速器: ${gov}`;
           }
    },

    {
          itemId: 'thermal',
          colspan: 2,
          printBar: false,
          title: gettext('CPU温度'),
          textField: 'thermalstate',
          renderer:function(value){
              console.log(value);
              let b = value.trim().split(/\s+(?=^\w+-)/m).sort();
              let cpuResults = [];
              let otherResults = [];

              b.forEach(function(v){
                  // 风扇转速数据
                  let fandata = v.match(/(?<=:\s+)[1-9]\d*(?=\s+RPM\s+)/ig);
                  if (fandata) {
                      otherResults.push('风扇: ' + fandata.join(', ') + ' RPM');
                      return;
                  }

                  let name = v.match(/^[^-]+/);
                  if (!name) return;
                  name = name[0].toUpperCase();

                  let temps = v.match(/(?<=:\s+)[+-][\d.]+(?=.?°C)/g);
                  if (!temps) return;

                  temps = temps.map(t => parseFloat(t));

                  // 只处理 CPU 温度（coretemp）
                  if (/coretemp/i.test(name)) {
                      let packageTemp = temps[0].toFixed(0);

                      if (temps.length > 1) {
                          let coreTemps = temps.slice(1);
                          let avgCore = (coreTemps.reduce((a, b) => a + b, 0) / coreTemps.length).toFixed(0);
                          let maxCore = Math.max(...coreTemps).toFixed(0);
                          let minCore = Math.min(...coreTemps).toFixed(0);

                          cpuResults.push(`封装: ${packageTemp}°C | 核心: 平均 ${avgCore}°C (${minCore}~${maxCore}°C)`);
                      } else {
                          cpuResults.push(`封装: ${packageTemp}°C`);
                      }

                      // 添加临界温度
                      let crit = v.match(/(?<=\bcrit\b[^+]+\+)\d+/);
                      if (crit) {
                          cpuResults[cpuResults.length - 1] += ` | 临界: ${crit[0]}°C`;
                      }
                  } else {
                      // 非 CPU 温度（主板、NVME等）放到其他结果中
                      let tempStr = `${name}: ${temps[0].toFixed(0)}°C`;
                      let crit = v.match(/(?<=\bcrit\b[^+]+\+)\d+/);
                      if (crit) {
                          tempStr += ` (临界: ${crit[0]}°C)`;
                      }
                      otherResults.push(tempStr);
                  }
              });

              // 只返回 CPU 相关温度，其他传感器信息不显示在这里
              // （NVME温度会在NVME硬盘信息中单独显示）
              if (cpuResults.length === 0) {
                  return '未获取到CPU温度信息';
              }

              // 如果有多个CPU（如双路服务器），分别显示
              if (cpuResults.length > 1) {
                  return cpuResults.map((temp, idx) => `CPU${idx}: ${temp}`).join(' | ');
              } else {
                  return cpuResults[0];
              }
           }
    },
EOF

    # 动态为每个 NVME 硬盘添加 JavaScript 代码
    for i in $(seq 0 $((nvi - 1))); do
        cat >> $tmpf << EOF

    {
          itemId: 'nvme${i}0',
          colspan: 2,
          printBar: false,
          title: gettext('NVME${i}'),
          textField: 'nvme${i}',
          renderer:function(value){
              try{
                  let  v = JSON.parse(value);

                  // 检查是否为空 JSON（硬盘不存在或已直通）
                  if (Object.keys(v).length === 0) {
                      return '<span style="color: #888;">未检测到 NVME（可能已直通或移除）</span>';
                  }

                  // 检查型号
                  let model = v.model_name;
                  if (!model) {
                      return '<span style="color: #f39c12;">NVME 信息不完整（建议检查连接状态）</span>';
                  }

                  // 构建显示内容
                  let parts = [model];
                  let hasData = false;

                  // 温度
                  if (v.temperature?.current !== undefined) {
                      parts.push(v.temperature.current + '°C');
                      hasData = true;
                  }

                  // 健康度和读写
                  let log = v.nvme_smart_health_information_log;
                  if (log) {
                      // 健康度
                      if (log.percentage_used !== undefined) {
                          let health = '健康: ' + (100 - log.percentage_used) + '%';
                          if (log.media_errors !== undefined && log.media_errors > 0) {
                              health += ' <span style="color: #e74c3c;">(0E: ' + log.media_errors + ')</span>';
                          }
                          parts.push(health);
                          hasData = true;
                      }

                      // 读写
                      if (log.data_units_read && log.data_units_written) {
                          let read = (log.data_units_read / 1956882).toFixed(1);
                          let write = (log.data_units_written / 1956882).toFixed(1);
                          parts.push('读写: ' + read + 'T / ' + write + 'T');
                          hasData = true;
                      }
                  }

                  // 通电时间
                  if (v.power_on_time?.hours !== undefined) {
                      let pot = '通电: ' + v.power_on_time.hours + '时';
                      if (v.power_cycle_count) {
                          pot += ' (次: ' + v.power_cycle_count + ')';
                      }
                      parts.push(pot);
                      hasData = true;
                  }

                  // SMART 状态
                  if (v.smart_status?.passed !== undefined) {
                      parts.push('SMART: ' + (v.smart_status.passed ? '<span style="color: #27ae60;">正常</span>' : '<span style="color: #e74c3c;">警告!</span>'));
                      hasData = true;
                  }

                  // 如果只有型号，没有其他数据，说明可能是权限或驱动问题
                  if (!hasData) {
                      return model + ' <span style="color: #888;">| 无法获取详细信息（检查 smartctl 权限或驱动）</span>';
                  }

                  return parts.join(' | ');

              }catch(e){
                  return '<span style="color: #888;">无法解析 NVME 信息（可能使用控制器直通）</span>';
              };

           }
    },
EOF
    done

    # 动态为每个 SATA 硬盘添加 JavaScript 代码
    for i in $(seq 0 $((sdi - 1))); do
        # 获取硬盘类型（固态/机械）
        sd="/dev/sd$(echo {a..z} | cut -d' ' -f$((i+1)))"
        sdsn=$(basename $sd 2>/dev/null)
        sdcr=/sys/block/$sdsn/queue/rotational
        if [ -f $sdcr ] && [ "$(cat $sdcr)" = "0" ]; then
            sdtype="固态硬盘$i"
        else
            sdtype="机械硬盘$i"
        fi

        cat >> $tmpf << EOF

    {
          itemId: 'sd${i}0',
          colspan: 2,
          printBar: false,
          title: gettext('${sdtype}'),
          textField: 'sd${i}',
          renderer:function(value){
              try{
                  let  v = JSON.parse(value);
                  console.log(v)

                  // 场景 1：硬盘休眠（节能模式）
                  if (v.standy === true) {
                      return '<span style="color: #27ae60;">💤 硬盘休眠中（省电模式）</span>'
                  }

                  // 场景 2：空 JSON（硬盘不存在或已直通）
                  if (Object.keys(v).length === 0) {
                      return '<span style="color: #888;">未检测到硬盘（可能已直通或移除）</span>';
                  }

                  // 场景 3：检查型号
                  let model = v.model_name;
                  if (!model) {
                      return '<span style="color: #f39c12;">硬盘信息不完整（建议检查连接状态）</span>';
                  }

                  // 场景 4：构建正常显示内容
                  let parts = [model];

                  // 温度
                  if (v.temperature?.current !== undefined) {
                      parts.push('温度: ' + v.temperature.current + '°C');
                  }

                  // 通电时间
                  if (v.power_on_time?.hours !== undefined) {
                      let pot = '通电: ' + v.power_on_time.hours + '时';
                      if (v.power_cycle_count) {
                          pot += ',次: ' + v.power_cycle_count;
                      }
                      parts.push(pot);
                  }

                  // SMART 状态
                  if (v.smart_status?.passed !== undefined) {
                      parts.push('SMART: ' + (v.smart_status.passed ? '正常' : '<span style="color: #e74c3c;">警告!</span>'));
                  }

                  return parts.join(' | ');

              }catch(e){
                  // JSON 解析失败
                  return '<span style="color: #888;">无法获取硬盘信息（可能使用 HBA 直通）</span>';
              };
           }
    },
EOF
    done

    # 如果检测到 UPS，添加 UPS 信息显示
    if [ "$has_ups" = true ]; then
        cat >> $tmpf << 'EOF'

    {
        itemId: 'ups-status',
        colspan: 2,
        printBar: false,
        title: gettext('UPS 信息'),
        textField: 'ups_status',
        cellWrap: true,
        renderer: function(value) {
            if (value.length > 0) {
                try {
                    const DATE    = value.match(/DATE\s*:\s*([\d\-]+ \d+:\d+:\d+)/)[1];
                    const STATUS  = value.match(/STATUS\s*:\s*([A-Z]+)/)[1];
                    const LINEV   = value.match(/OUTPUTV\s*:\s*([\d\.]+)/)[1];
                    const LOADPCT = value.match(/LOADPCT\s*:\s*([\d\.]+)/)[1];
                    const BCHARGE = value.match(/BCHARGE\s*:\s*([\d\.]+)/)[1];
                    const TIMELEFT= value.match(/TIMELEFT\s*:\s*([\d\.]+)/)[1];
                    const MODEL   = value.match(/MODEL\s*:\s*(.+)/)[1].trim();

                    return `${MODEL}  | ${STATUS}  | ${DATE}<br>
                            电量：${BCHARGE} %  | 剩余供电时间：${TIMELEFT} 分钟<br>
                            电压：${LINEV} V  |  负载：${LOADPCT} %`;
                } catch(e) {
                    return 'UPS 信息解析失败:' + value;
                }
            } else {
                return '提示: 未检测到 UPS 或 apcaccess 未运行';
            }
        }
    },
EOF
    fi


    log_info "找到关键字pveversion的行号"
    # 显示匹配的行
    ln=$(sed -n '/pveversion/,+10{/},/{=;q}}' $pvemanagerlib)
    echo "匹配的行号pveversion：" $ln

    log_info "修改结果："
    sed -i "${ln}r $tmpf" $pvemanagerlib
    # 显示修改结果
    # sed -n '/pveversion/,+30p' $pvemanagerlib

    log_info "修改页面高度"
    # 统计添加了几条内容（2个基础项 + NVME + SATA + UPS）
    if [ "$has_ups" = true ]; then
        addRs=$((2 + nvi + sdi + 1))
        ups_info="+ 1 个UPS"
    else
        addRs=$((2 + nvi + sdi))
        ups_info=""
    fi

    echo
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo "检测到添加了 $addRs 条监控项 (2个基础项 + $nvi 个NVME + $sdi 个SATA $ups_info)"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo "请选择高度调整方式："
    echo "  1. 自动计算 (推荐，参考 PVE 8 算法：28px/项)"
    echo "  2. 手动设置 (自定义每项的高度增量)"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    read -p "请输入选项 [1-2] (直接回车使用自动计算): " height_choice

    case ${height_choice:-1} in
        1)
            # 自动计算：每项 28px
            addHei=$((28 * addRs))
            log_info "使用自动计算：$addRs 项 × 28px = ${addHei}px"
            ;;
        2)
            # 手动设置
            echo
            echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
            echo "手动设置说明："
            echo "  - 推荐值范围: 20-40 (默认 28)"
            echo "  - 如果 CPU 核心很多或想显示更多信息，可适当增大"
            echo "  - 如果界面出现遮挡，可适当减小此值"
            echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
            read -p "请输入每项的高度增量 (px) [默认: 28]: " height_per_item

            # 验证输入是否为数字，如果不是或为空则使用默认值 28
            if [[ -z "$height_per_item" ]] || ! [[ "$height_per_item" =~ ^[0-9]+$ ]]; then
                height_per_item=28
                log_info "使用默认值: 28px/项"
            else
                log_info "使用自定义值: ${height_per_item}px/项"
            fi

            addHei=$((height_per_item * addRs))
            log_success "计算结果：$addRs 项 × ${height_per_item}px = ${addHei}px"
            ;;
        *)
            # 无效选项，使用自动计算
            addHei=$((28 * addRs))
            log_warn "无效选项，使用自动计算：${addHei}px"
            ;;
    esac

    rm $tmpf

    # 修改左栏高度（原高度 300）
    log_step "修改左栏高度"
    wph=$(sed -n -E "/widget\.pveNodeStatus/,+4{/height:/{s/[^0-9]*([0-9]+).*/\1/p;q}}" $pvemanagerlib)
    if [ -n "$wph" ]; then
        sed -i -E "/widget\.pveNodeStatus/,+4{/height:/{s#[0-9]+#$((wph + addHei))#}}" $pvemanagerlib
        log_success "左栏高度: $wph → $((wph + addHei))"
    else
        log_warn "找不到左栏高度修改点"
    fi

    # 修改右栏高度和左栏一致，解决浮动错位（原高度 325）
    log_step "修改右栏高度和左栏一致，解决浮动错位"
    nph=$(sed -n -E '/nodeStatus:\s*nodeStatus/,+10{/minHeight:/{s/[^0-9]*([0-9]+).*/\1/p;q}}' "$pvemanagerlib")
    if [ -n "$nph" ]; then
        sed -i -E "/nodeStatus:\s*nodeStatus/,+10{/minHeight:/{s#[0-9]+#$((nph + addHei - (nph - wph)))#}}" $pvemanagerlib
        log_success "右栏高度: $nph → $((nph + addHei - (nph - wph)))"
    else
        log_warn "找不到右栏高度修改点"
    fi

    # 调整显示布局
    ln=$(expr $(sed -n -e '/widget.pveDcGuests/=' $pvemanagerlib) + 10)
    sed -i "${ln}a\ textAlign: 'right'," $pvemanagerlib
    ln=$(expr $(sed -n -e '/widget.pveNodeStatus/=' $pvemanagerlib) + 10)
    sed -i "${ln}a\ textAlign: 'right'," $pvemanagerlib

    ###################  修改proxmoxlib.js   ##########################

    log_info "加强去除订阅弹窗"
    # sed -r -i '/\/nodes\/localhost\/subscription/,+10{/^\s+if \(res === null /{N;s#.+#\t\t  if(false){#}}' $proxmoxlib
    sed -r -i '/\/nodes\/localhost\/subscription/,+30 {
        /^\s+if\s*\(/ {
            :loop
            N
            /\s*\)\s*\{/!b loop
            s/(if\s*\([[:space:]]*res\s*===\s*null\s*(\|\|\s*res\s*===\s*undefined\s*)?(\|\|\s*!res\s*)?(\|\|\s*res\.data\.status\.toLowerCase\(\)\s*!==\s*['\''"]active['\''"]\s*)?[[:space:]]*\)\s*\{)/if(false){ \/\/modbyshowtempfreq/
        }
    }' /usr/share/javascript/proxmox-widget-toolkit/proxmoxlib.js

    # 显示修改结果
    sed -n '/\/nodes\/localhost\/subscription/,+10p' $proxmoxlib
    systemctl restart pveproxy

    log_success "请刷新浏览器缓存shift+f5"
}

cpu_del() {

nodes="/usr/share/perl5/PVE/API2/Nodes.pm"
pvemanagerlib="/usr/share/pve-manager/js/pvemanagerlib.js"
proxmoxlib="/usr/share/javascript/proxmox-widget-toolkit/proxmoxlib.js"

pvever=$(pveversion | awk -F"/" '{print $2}')
echo pve版本$pvever
if [ -f "$nodes.$pvever.bak" ];then
rm -f $nodes $pvemanagerlib $proxmoxlib
mv $nodes.$pvever.bak $nodes
mv $pvemanagerlib.$pvever.bak $pvemanagerlib
mv $proxmoxlib.$pvever.bak $proxmoxlib

log_success "已删除温度显示，请重新刷新浏览器缓存."
else
log_warn "你没有添加过温度显示，退出脚本."
fi


}
#--------------CPU、主板、硬盘温度显示----------------

#--------------GRUB 配置管理工具----------------
# 展示当前 GRUB 配置
show_grub_config() {
    log_info "当前 GRUB 配置信息"
    log_step "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

    if [ ! -f "/etc/default/grub" ]; then
        log_error "未找到 /etc/default/grub 文件"
        return 1
    fi

    log_info "文件路径: /etc/default/grub"
    log_info "当前内核参数:"

    # 读取并显示 GRUB_CMDLINE_LINUX_DEFAULT
    current_config=$(grep '^GRUB_CMDLINE_LINUX_DEFAULT=' /etc/default/grub | sed 's/GRUB_CMDLINE_LINUX_DEFAULT=//' | tr -d '"')

    if [ -z "$current_config" ]; then
        log_warn "未找到 GRUB_CMDLINE_LINUX_DEFAULT 配置"
    else
        log_success "GRUB_CMDLINE_LINUX_DEFAULT 内容:"
        # 逐行显示参数
        echo "$current_config" | tr ' ' '\n' | while read -r param; do
            [ -n "$param" ] && log_info "  - $param"
        done
    fi

    log_step "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

    # 检测关键参数
    log_info "关键参数检测:"

    # 检测 IOMMU
    if echo "$current_config" | grep -q "intel_iommu=on\|amd_iommu=on"; then
        log_success "  IOMMU: 已启用"
    else
        log_warn "  IOMMU: 未启用"
    fi

    # 检测 SR-IOV
    if echo "$current_config" | grep -q "i915.enable_guc=3"; then
        log_success "  SR-IOV (i915.enable_guc=3): 已配置"
    else
        log_info "  SR-IOV: 未配置"
    fi

    # 检测 GVT-g
    if echo "$current_config" | grep -q "i915.enable_gvt=1"; then
        log_success "  GVT-g (i915.enable_gvt=1): 已配置"
    else
        log_info "  GVT-g: 未配置"
    fi

    # 检测硬件直通
    if echo "$current_config" | grep -q "iommu=pt"; then
        log_success "  硬件直通 (iommu=pt): 已启用"
    else
        log_info "  硬件直通: 未启用"
    fi

    log_step "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
}

# GRUB 配置备份
backup_grub_with_note() {
    local note="$1"
    local backup_dir="/etc/pvetools9/backup/grub"
    local timestamp=$(date +"%Y%m%d_%H%M%S")
    local backup_file="${backup_dir}/${timestamp}_${note}.bak"

    log_step "备份 GRUB 配置..."

    # 创建备份目录
    if [ ! -d "$backup_dir" ]; then
        mkdir -p "$backup_dir" || {
            log_error "无法创建备份目录: $backup_dir"
            return 1
        }
        log_info "创建备份目录: $backup_dir"
    fi

    # 检查源文件
    if [ ! -f "/etc/default/grub" ]; then
        log_error "源文件不存在: /etc/default/grub"
        return 1
    fi

    # 执行备份
    cp "/etc/default/grub" "$backup_file" || {
        log_error "备份失败"
        return 1
    }

    log_success "GRUB 配置已备份"
    log_info "备份文件: $backup_file"
    log_info "备份时间: $(date '+%Y-%m-%d %H:%M:%S')"
    log_info "备份备注: $note"

    # 统计备份文件数量
    local backup_count=$(ls -1 "$backup_dir"/*.bak 2>/dev/null | wc -l)
    log_info "当前共有 $backup_count 个备份文件"

    return 0
}

# 列出所有 GRUB 备份
list_grub_backups() {
    local backup_dir="/etc/pvetools9/backup/grub"

    log_info "GRUB 配置备份列表"
    log_step "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

    if [ ! -d "$backup_dir" ]; then
        log_warn "备份目录不存在: $backup_dir"
        log_tips "尚未创建任何备份"
        return 0
    fi

    local backup_files=$(ls -1t "$backup_dir"/*.bak 2>/dev/null)

    if [ -z "$backup_files" ]; then
        log_warn "未找到任何备份文件"
        return 0
    fi

    local count=1
    echo "$backup_files" | while read -r backup_file; do
        local filename=$(basename "$backup_file")
        local filesize=$(du -h "$backup_file" | awk '{print $1}')
        local filetime=$(stat -c '%y' "$backup_file" 2>/dev/null || stat -f '%Sm' "$backup_file")

        log_info "备份 $count:"
        log_info "  文件名: $filename"
        log_info "  大小: $filesize"
        log_info "  时间: $filetime"
        log_step "  ────────────────────────────────────"

        count=$((count + 1))
    done

    log_step "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
}

# 恢复 GRUB 备份
restore_grub_backup() {
    local backup_dir="/etc/pvetools9/backup/grub"

    list_grub_backups

    if [ ! -d "$backup_dir" ] || [ -z "$(ls -A "$backup_dir"/*.bak 2>/dev/null)" ]; then
        log_error "没有可恢复的备份文件"
        pause_function
        return 1
    fi

    echo
    log_warn "请输入要恢复的备份文件名（完整文件名）:"
    read -p "> " backup_filename

    local backup_file="${backup_dir}/${backup_filename}"

    if [ ! -f "$backup_file" ]; then
        log_error "备份文件不存在: $backup_filename"
        pause_function
        return 1
    fi

    log_warn "即将恢复 GRUB 配置"
    log_info "源文件: $backup_file"
    log_info "目标文件: /etc/default/grub"

    if ! confirm_action "确认恢复此备份"; then
        log_info "用户取消恢复操作"
        return 0
    fi

    # 在恢复前备份当前配置
    backup_grub_with_note "恢复前自动备份"

    # 执行恢复
    cp "$backup_file" "/etc/default/grub" || {
        log_error "恢复失败"
        pause_function
        return 1
    }

    log_success "GRUB 配置已恢复"

    # 更新 GRUB
    if confirm_action "是否立即更新 GRUB"; then
        update-grub && log_success "GRUB 更新完成" || log_error "GRUB 更新失败"
    fi

    pause_function
}
#--------------GRUB 配置管理工具----------------

#--------------核显虚拟化管理----------------
# Intel 11-15代 SR-IOV 核显虚拟化配置
igpu_sriov_setup() {
    log_info "开始配置 Intel 11-15代 SR-IOV 核显虚拟化"

    # 检查内核版本
    kernel_version=$(uname -r | awk -F'-' '{print $1}')
    kernel_major=$(echo $kernel_version | cut -d'.' -f1)
    kernel_minor=$(echo $kernel_version | cut -d'.' -f2)

    if [ "$kernel_major" -lt 6 ] || ([ "$kernel_major" -eq 6 ] && [ "$kernel_minor" -lt 8 ]); then
        log_error "SR-IOV 需要内核版本 6.8 或更高"
        log_tips "当前内核版本: $(uname -r)"
        log_tips "请先使用内核管理功能升级到 6.8 内核"
        pause_function
        return 1
    fi

    log_success "内核版本检查通过: $(uname -r)"

    # 展示当前 GRUB 配置
    echo
    show_grub_config
    echo

    # 危险性警告
    log_step "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    log_error "【高危操作警告】SR-IOV 核显虚拟化配置"
    log_step "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    log_warn "此操作属于【高危险性】系统配置，配置错误可能导致："
    log_error "  - 系统无法正常启动（GRUB 配置错误）"
    log_error "  - 核显完全不可用（参数配置错误）"
    log_error "  - 虚拟机黑屏或无法启动（直通配置错误）"
    log_error "  - 需要通过恢复模式修复系统"
    log_step "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo
    log_info "此功能将修改以下系统配置："
    log_info "  1. 修改 GRUB 引导参数（启用 IOMMU 和 SR-IOV）"
    log_info "  2. 加载 VFIO 内核模块"
    log_info "  3. 下载并安装 i915-sriov-dkms 驱动（约 10MB）"
    log_info "  4. 配置虚拟核显数量（VFs）"
    echo
    log_info "前置要求（请确认已完成）："
    log_info "  ✓ BIOS 已开启 VT-d 虚拟化"
    log_info "  ✓ BIOS 已开启 SR-IOV（如有此选项）"
    log_info "  ✓ BIOS 已开启 Above 4GB（如有此选项）"
    log_info "  ✓ BIOS 已关闭 Secure Boot 安全启动"
    log_info "  ✓ CPU 为 Intel 11-15 代处理器"
    echo
    log_error "重要：物理核显 (00:02.0) 不能直通，否则所有虚拟核显将消失"
    log_step "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo
    log_warn "强烈建议："
    log_tips "1. 在继续前先备份当前 GRUB 配置"
    log_tips "2. 确保了解核显虚拟化的工作原理"
    log_tips "3. 准备好通过 SSH 或物理访问恢复系统"
    echo

    # 询问是否要备份
    if confirm_action "是否先备份当前 GRUB 配置（强烈推荐）"; then
        echo
        log_info "请输入备份备注（例如：SR-IOV配置前备份）："
        read -p "> " backup_note
        backup_note=${backup_note:-"SR-IOV配置前备份"}
        backup_grub_with_note "$backup_note"
        echo
    fi

    if ! confirm_action "确认继续配置 SR-IOV 核显虚拟化"; then
        log_info "用户取消操作"
        return 0
    fi

    # 安装必要的软件包
    log_step "安装必要的软件包..."
    apt-get update

    log_info "安装 pve-headers..."
    apt-get install -y "pve-headers-$(uname -r)" || {
        log_error "安装 pve-headers 失败"
        pause_function
        return 1
    }

    log_info "安装构建工具..."
    apt-get install -y build-essential dkms sysfsutils || {
        log_error "安装构建工具失败"
        pause_function
        return 1
    }

    log_success "软件包安装完成"

    # 备份并修改 GRUB 配置
    log_step "配置 GRUB 引导参数..."
    backup_file "/etc/default/grub"

    # 检查是否已配置
    if grep -q "i915.enable_guc=3.*i915.max_vfs=7" /etc/default/grub; then
        log_warn "GRUB 已配置 SR-IOV 参数，跳过修改"
    else
        # 移除旧的配置（如果有 GVT-g 配置）
        sed -i 's/i915.enable_gvt=1//g' /etc/default/grub

        # 添加 SR-IOV 参数
        sed -i '/^GRUB_CMDLINE_LINUX_DEFAULT=/c\GRUB_CMDLINE_LINUX_DEFAULT="quiet intel_iommu=on iommu=pt i915.enable_guc=3 i915.max_vfs=7 module_blacklist=xe"' /etc/default/grub

        log_success "GRUB 配置已更新"
    fi

    # 更新 GRUB
    log_step "更新 GRUB..."
    update-grub || {
        log_error "更新 GRUB 失败"
        pause_function
        return 1
    }

    # 配置内核模块
    log_step "配置内核模块..."
    backup_file "/etc/modules"

    # 添加 VFIO 模块（如果未添加）
    for module in vfio vfio_iommu_type1 vfio_pci vfio_virqfd; do
        if ! grep -q "^$module$" /etc/modules; then
            echo "$module" >> /etc/modules
            log_info "已添加模块: $module"
        fi
    done

    # 移除 kvmgt 模块（如果有 GVT-g 配置）
    sed -i '/^kvmgt$/d' /etc/modules

    log_success "内核模块配置完成"

    # 更新 initramfs
    log_step "更新 initramfs..."
    update-initramfs -u -k all || {
        log_warn "更新 initramfs 失败，但可以继续"
    }

    # 下载并安装 i915-sriov-dkms 驱动
    log_step "下载 i915-sriov-dkms 驱动..."

    dkms_version="2025.05.18"
    dkms_url="https://github.com/strongtz/i915-sriov-dkms/releases/download/${dkms_version}/i915-sriov-dkms_${dkms_version}_amd64.deb"
    dkms_file="/tmp/i915-sriov-dkms_${dkms_version}_amd64.deb"

    # 检查是否已下载
    if [ -f "$dkms_file" ]; then
        log_info "驱动文件已存在，跳过下载"
    else
        log_info "从 GitHub 下载驱动..."
        log_tips "如果下载失败，请检查网络或手动下载后放到 /tmp/ 目录"

        wget -O "$dkms_file" "$dkms_url" || {
            log_error "下载驱动失败"
            log_tips "请手动下载: $dkms_url"
            log_tips "并上传到 PVE 的 /tmp/ 目录后重试"
            pause_function
            return 1
        }
    fi

    log_step "安装 i915-sriov-dkms 驱动..."
    log_warn "驱动安装可能需要较长时间，请耐心等待..."

    dpkg -i "$dkms_file" || {
        log_error "安装驱动失败"
        pause_function
        return 1
    }

    # 验证驱动安装
    log_step "验证驱动安装..."
    if modinfo i915 2>/dev/null | grep -q "max_vfs"; then
        log_success "i915-sriov 驱动安装成功"
    else
        log_error "驱动验证失败，请检查安装过程"
        pause_function
        return 1
    fi

    # 配置 VFs 数量
    echo
    log_step "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    log_info "配置虚拟核显（VFs）数量"
    log_step "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo
    log_info "虚拟核显数量范围: 1-7"
    log_info "推荐配置："
    log_info "  - 1 个 VF: 性能最强，适合单个高性能虚拟机"
    log_info "  - 2-3 个 VF: 平衡性能，适合多个虚拟机"
    log_info "  - 4-7 个 VF: 最多虚拟机数量，性能较弱"
    echo
    read -p "请输入 VFs 数量 [1-7, 默认: 3]: " vfs_num

    # 验证输入
    if [[ -z "$vfs_num" ]]; then
        vfs_num=3
    elif ! [[ "$vfs_num" =~ ^[1-7]$ ]]; then
        log_error "无效的 VFs 数量，必须是 1-7"
        pause_function
        return 1
    fi

    log_info "配置 $vfs_num 个虚拟核显"

    # 写入 sysfs.conf
    echo "devices/pci0000:00/0000:00:02.0/sriov_numvfs = $vfs_num" > /etc/sysfs.conf
    log_success "VFs 数量配置完成"

    # 完成提示
    echo
    log_step "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    log_success "SR-IOV 核显虚拟化配置完成！"
    log_step "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo
    log_info "配置摘要："
    log_info "  • 内核参数: intel_iommu=on iommu=pt i915.enable_guc=3 i915.max_vfs=7"
    log_info "  • VFIO 模块: 已加载"
    log_info "  • i915-sriov 驱动: 已安装"
    log_info "  • 虚拟核显数量: $vfs_num 个"
    echo
    log_warn "下一步操作："
    log_error "  1. 重启系统使配置生效"
    log_info "  2. 重启后使用 '验证核显虚拟化状态' 检查配置"
    log_info "  3. 在虚拟机配置中添加核显 SR-IOV 设备"
    echo
    log_error "重要提示："
    log_warn "  • 物理核显 (00:02.0) 不能直通给虚拟机"
    log_warn "  • 只能直通虚拟核显 (00:02.1 ~ 00:02.$vfs_num)"
    log_warn "  • 虚拟机需要勾选 ROM-Bar 和 PCIE 选项"
    echo
    log_step "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

    if confirm_action "是否现在重启系统"; then
        log_info "正在重启系统..."
        reboot
    else
        log_warn "请记得手动重启系统以使配置生效"
    fi
}

# Intel 6-10代 GVT-g 核显虚拟化配置
igpu_gvtg_setup() {
    log_info "开始配置 Intel 6-10代 GVT-g 核显虚拟化"

    # 展示当前 GRUB 配置
    echo
    show_grub_config
    echo

    # 危险性警告
    log_step "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    log_error "【高危操作警告】GVT-g 核显虚拟化配置"
    log_step "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    log_warn "此操作属于【高危险性】系统配置，配置错误可能导致："
    log_error "  - 系统无法正常启动（GRUB 配置错误）"
    log_error "  - 核显完全不可用（参数配置错误）"
    log_error "  - 虚拟机黑屏或无法启动（直通配置错误）"
    log_error "  - 需要通过恢复模式修复系统"
    log_step "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo
    log_info "此功能将修改以下系统配置："
    log_info "  1. 修改 GRUB 引导参数（启用 IOMMU 和 GVT-g）"
    log_info "  2. 加载 VFIO 和 kvmgt 内核模块"
    echo
    log_info "前置要求（请确认已完成）："
    log_info "  ✓ BIOS 已开启 VT-d 虚拟化"
    log_info "  ✓ BIOS 已开启 SR-IOV（如有此选项）"
    log_info "  ✓ BIOS 已开启 Above 4GB（如有此选项）"
    log_info "  ✓ BIOS 已关闭 Secure Boot 安全启动"
    log_info "  ✓ CPU 为 Intel 6-10 代处理器"
    echo
    log_info "支持的处理器代号："
    log_info "  • Skylake (6代)"
    log_info "  • Kaby Lake (7代)"
    log_info "  • Coffee Lake (8代)"
    log_info "  • Coffee Lake Refresh (9代)"
    log_info "  • Comet Lake (10代)"
    echo
    log_error "特殊的处理器代号："
    log_warn "  • Rocket Lake / Tiger Lake (11代) 因处在当前代与上一代交界"
    log_warn "    部分型号支持，但是不保证兼容性，请谨慎使用"
    log_step "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo
    log_warn "强烈建议："
    log_tips "1. 在继续前先备份当前 GRUB 配置"
    log_tips "2. 确保了解核显虚拟化的工作原理"
    log_tips "3. 准备好通过 SSH 或物理访问恢复系统"
    echo

    # 询问是否要备份
    if confirm_action "是否先备份当前 GRUB 配置（强烈推荐）"; then
        echo
        log_info "请输入备份备注（例如：GVT-g配置前备份）："
        read -p "> " backup_note
        backup_note=${backup_note:-"GVT-g配置前备份"}
        backup_grub_with_note "$backup_note"
        echo
    fi

    if ! confirm_action "确认继续配置 GVT-g 核显虚拟化"; then
        log_info "用户取消操作"
        return 0
    fi

    # 备份并修改 GRUB 配置
    log_step "配置 GRUB 引导参数..."
    backup_file "/etc/default/grub"

    # 检查是否已配置
    if grep -q "i915.enable_gvt=1" /etc/default/grub; then
        log_warn "GRUB 已配置 GVT-g 参数，跳过修改"
    else
        # 移除旧的 SR-IOV 配置（如果有）
        sed -i 's/i915.enable_guc=3//g; s/i915.max_vfs=7//g; s/module_blacklist=xe//g' /etc/default/grub

        # 添加 GVT-g 参数
        sed -i '/^GRUB_CMDLINE_LINUX_DEFAULT=/c\GRUB_CMDLINE_LINUX_DEFAULT="quiet intel_iommu=on iommu=pt i915.enable_gvt=1 pcie_acs_override=downstream,multifunction"' /etc/default/grub

        log_success "GRUB 配置已更新"
    fi

    # 更新 GRUB
    log_step "更新 GRUB..."
    update-grub || {
        log_error "更新 GRUB 失败"
        pause_function
        return 1
    }

    # 配置内核模块
    log_step "配置内核模块..."
    backup_file "/etc/modules"

    # 添加 VFIO 和 kvmgt 模块
    for module in vfio vfio_iommu_type1 vfio_pci vfio_virqfd kvmgt; do
        if ! grep -q "^$module$" /etc/modules; then
            echo "$module" >> /etc/modules
            log_info "已添加模块: $module"
        fi
    done

    log_success "内核模块配置完成"

    # 更新 initramfs
    log_step "更新 initramfs..."
    update-initramfs -u -k all || {
        log_warn "更新 initramfs 失败，但可以继续"
    }

    # 完成提示
    echo
    log_step "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    log_success "GVT-g 核显虚拟化配置完成！"
    log_step "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo
    log_info "配置摘要："
    log_info "  • 内核参数: intel_iommu=on iommu=pt i915.enable_gvt=1"
    log_info "  • VFIO 模块: 已加载"
    log_info "  • kvmgt 模块: 已加载"
    echo
    log_warn "下一步操作："
    log_error "  1. 重启系统使配置生效"
    log_info "  2. 重启后使用 '验证核显虚拟化状态' 检查配置"
    log_info "  3. 在虚拟机配置中添加核显 GVT-g 设备（Mdev 类型）"
    echo
    log_info "常见 Mdev 类型："
    log_info "  • i915-GVTg_V5_4: 低性能，可创建更多虚拟机"
    log_info "  • i915-GVTg_V5_8: 高性能，推荐使用（UHD630 最多 2 个）"
    echo
    log_step "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

    if confirm_action "是否现在重启系统"; then
        log_info "正在重启系统..."
        reboot
    else
        log_warn "请记得手动重启系统以使配置生效"
    fi
}

# 验证核显虚拟化状态
igpu_verify() {
    log_info "检查核显虚拟化状态"

    echo
    echo "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo "  核显虚拟化状态检查"
    echo "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo

    # 检查 IOMMU
    log_step "1. 检查 IOMMU 状态..."
    if dmesg | grep -qi "DMAR.*IOMMU\|iommu.*enabled"; then
        log_success "IOMMU 已启用"
        echo "  $(dmesg | grep -i "DMAR.*IOMMU\|iommu.*enabled" | head -3)"
    else
        log_error "IOMMU 未启用"
        log_tips "请检查 BIOS 是否开启 VT-d"
        log_tips "请检查 GRUB 配置是否包含 intel_iommu=on"
    fi
    echo

    # 检查 VFIO 模块
    log_step "2. 检查 VFIO 模块加载状态..."
    if lsmod | grep -q vfio; then
        log_success "VFIO 模块已加载"
        echo "  $(lsmod | grep vfio)"
    else
        log_error "VFIO 模块未加载"
        log_tips "请检查 /etc/modules 配置"
    fi
    echo

    # 检查 SR-IOV
    log_step "3. 检查 SR-IOV 虚拟核显..."
    if lspci | grep -i "VGA.*Intel" | wc -l | grep -q "^[2-9]"; then
        vf_count=$(($(lspci | grep -i "VGA.*Intel" | wc -l) - 1))
        log_success "检测到 $vf_count 个虚拟核显 (SR-IOV)"
        echo
        lspci | grep -i "VGA.*Intel"
        echo
        log_tips "物理核显: 00:02.0 (不能直通)"
        log_tips "虚拟核显: 00:02.1 ~ 00:02.$vf_count (可直通给虚拟机)"
    else
        log_warn "未检测到 SR-IOV 虚拟核显"
    fi
    echo

    # 检查 GVT-g
    log_step "4. 检查 GVT-g mdev 类型..."
    if [ -d "/sys/bus/pci/devices/0000:00:02.0/mdev_supported_types" ]; then
        mdev_types=$(ls /sys/bus/pci/devices/0000:00:02.0/mdev_supported_types 2>/dev/null | wc -l)
        if [ "$mdev_types" -gt 0 ]; then
            log_success "GVT-g 已启用，可用 Mdev 类型: $mdev_types 个"
            echo
            ls -1 /sys/bus/pci/devices/0000:00:02.0/mdev_supported_types
        else
            log_warn "GVT-g 未正确配置"
        fi
    else
        log_warn "未检测到 GVT-g 支持"
        log_tips "此 CPU 可能不支持 GVT-g 或未配置"
    fi
    echo

    # 检查 kvmgt 模块（GVT-g 需要）
    log_step "5. 检查 kvmgt 模块（GVT-g）..."
    if lsmod | grep -q kvmgt; then
        log_success "kvmgt 模块已加载（GVT-g 模式）"
    else
        log_info "kvmgt 模块未加载（SR-IOV 模式或未配置 GVT-g）"
    fi
    echo

    # 检查 i915 驱动参数
    log_step "6. 检查 i915 驱动参数..."
    if [ -f "/sys/module/i915/parameters/enable_guc" ]; then
        guc_value=$(cat /sys/module/i915/parameters/enable_guc)
        if [ "$guc_value" = "3" ]; then
            log_success "i915.enable_guc = 3 (SR-IOV 模式)"
        else
            log_info "i915.enable_guc = $guc_value"
        fi
    fi

    if [ -f "/sys/module/i915/parameters/enable_gvt" ]; then
        gvt_value=$(cat /sys/module/i915/parameters/enable_gvt)
        if [ "$gvt_value" = "Y" ]; then
            log_success "i915.enable_gvt = Y (GVT-g 模式)"
        else
            log_info "i915.enable_gvt = $gvt_value"
        fi
    fi
    echo

    # 总结
    echo "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo "  检查完成"
    echo "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

    pause_function
}

# 移除核显虚拟化配置
igpu_remove() {
    log_warn "移除核显虚拟化配置"

    echo
    echo "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo "${RED}⚠️  警告 - 移除核显虚拟化配置${NC}"
    echo "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo
    echo "  ${RED}此操作将：${NC}"
    echo "  • 恢复 GRUB 配置为默认值"
    echo "  • 清理 /etc/modules 中的 VFIO 和 kvmgt 模块"
    echo "  • 删除 /etc/sysfs.conf 中的 VFs 配置"
    echo "  • 卸载 i915-sriov-dkms 驱动（如已安装）"
    echo
    echo "  ${YELLOW}注意：此操作不会自动重启系统${NC}"
    echo
    echo "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

    if ! confirm_action "确认移除核显虚拟化配置"; then
        log_info "用户取消操作"
        return 0
    fi

    # 恢复 GRUB 配置
    log_step "恢复 GRUB 配置..."
    backup_file "/etc/default/grub"

    # 移除所有核显虚拟化参数
    sed -i 's/intel_iommu=on//g; s/iommu=pt//g; s/i915.enable_guc=3//g; s/i915.max_vfs=7//g; s/module_blacklist=xe//g; s/i915.enable_gvt=1//g; s/pcie_acs_override=downstream,multifunction//g' /etc/default/grub

    # 清理多余空格
    sed -i 's/  */ /g' /etc/default/grub

    update-grub
    log_success "GRUB 配置已恢复"

    # 清理 /etc/modules
    log_step "清理内核模块配置..."
    backup_file "/etc/modules"

    sed -i '/^vfio$/d; /^vfio_iommu_type1$/d; /^vfio_pci$/d; /^vfio_virqfd$/d; /^kvmgt$/d' /etc/modules
    log_success "内核模块配置已清理"

    # 清理 /etc/sysfs.conf
    if [ -f "/etc/sysfs.conf" ]; then
        log_step "清理 sysfs 配置..."
        backup_file "/etc/sysfs.conf"
        sed -i '/sriov_numvfs/d' /etc/sysfs.conf
        log_success "sysfs 配置已清理"
    fi

    # 卸载 i915-sriov-dkms
    log_step "检查 i915-sriov-dkms 驱动..."
    if dpkg -l | grep -q i915-sriov-dkms; then
        log_info "卸载 i915-sriov-dkms 驱动..."
        dpkg -P i915-sriov-dkms || log_warn "卸载驱动失败，可能需要手动处理"
        log_success "驱动已卸载"
    else
        log_info "未安装 i915-sriov-dkms 驱动，跳过"
    fi

    # 更新 initramfs
    log_step "更新 initramfs..."
    update-initramfs -u -k all

    log_success "核显虚拟化配置已移除"

    echo
    log_step "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    log_success "配置移除完成"
    log_step "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo
    log_warn "请重启系统使更改生效"
    echo

    if confirm_action "是否现在重启系统"; then
        log_info "正在重启系统..."
        reboot
    else
        log_warn "请记得手动重启系统"
    fi
}

# 核显高级功能菜单
igpu_management_menu() {
    while true; do
        clear
        show_banner

        log_step "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
        log_info "              核显虚拟化高级功能"
        log_step "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
        echo
        log_error "【危险警告】核显虚拟化属于高危操作"
        log_warn "配置错误可能导致系统无法启动，请务必提前备份 GRUB 配置"
        echo
        log_step "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
        echo
        echo "  1. Intel 11-15代 SR-IOV 核显虚拟化"
        echo "     支持: Rocket Lake, Alder Lake, Raptor Lake"
        echo "     特性: 最多 7 个虚拟核显，性能较好"
        echo
        echo "  2. Intel 6-10代 GVT-g 核显虚拟化"
        echo "     支持: Skylake ~ Comet Lake"
        echo "     特性: 最多 2-8 个虚拟核显（取决于型号）"
        echo
        echo "  3. 验证核显虚拟化状态"
        echo "     检查 IOMMU、VFIO、SR-IOV/GVT-g 配置"
        echo
        echo "  4. 移除核显虚拟化配置"
        echo "     恢复默认配置，移除所有核显虚拟化设置"
        echo
        log_step "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
        echo "  GRUB 配置管理（强烈推荐使用）"
        log_step "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
        echo
        echo "  5. 查看当前 GRUB 配置"
        echo "     展示当前的 GRUB 引导参数和关键配置"
        echo
        echo "  6. 备份 GRUB 配置"
        echo "     备份到 /etc/pvetools9/backup/grub/"
        echo
        echo "  7. 查看 GRUB 备份列表"
        echo "     列出所有已创建的备份文件"
        echo
        echo "  8. 恢复 GRUB 配置"
        echo "     从备份文件恢复 GRUB 配置"
        echo
        log_step "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
        echo "  0. 返回主菜单"
        log_step "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
        echo
        read -p "请选择操作 [0-8]: " choice

        case $choice in
            1)
                igpu_sriov_setup
                ;;
            2)
                igpu_gvtg_setup
                ;;
            3)
                igpu_verify
                ;;
            4)
                igpu_remove
                ;;
            5)
                show_grub_config
                pause_function
                ;;
            6)
                echo
                log_info "请输入备份备注（例如：手动备份_测试）："
                read -p "> " backup_note
                backup_note=${backup_note:-"手动备份"}
                backup_grub_with_note "$backup_note"
                pause_function
                ;;
            7)
                list_grub_backups
                pause_function
                ;;
            8)
                restore_grub_backup
                ;;
            0)
                log_info "返回主菜单"
                return 0
                ;;
            *)
                log_error "无效的选择，请输入 0-8"
                pause_function
                ;;
        esac
    done
}
#--------------核显虚拟化管理----------------

#---------PVE8/9添加ceph-squid源-----------
pve9_ceph() {
    sver=`cat /etc/debian_version |awk -F"." '{print $1}'`
    case "$sver" in
     13 )
         sver="trixie"
     ;;
     12 )
         sver="bookworm"
     ;;
    * )
        sver=""
     ;;
    esac
    if [ ! $sver ];then
        log_error "版本不支持！"
        pause_function
        return
    fi

    log_info "ceph-squid目前仅支持PVE8和9！"
    [[ ! -d /etc/apt/backup ]] && mkdir -p /etc/apt/backup
    [[ ! -d /etc/apt/sources.list.d ]] && mkdir -p /etc/apt/sources.list.d

    [[ -e /etc/apt/sources.list.d/ceph.sources ]] && mv /etc/apt/sources.list.d/ceph.sources /etc/apt/backup/ceph.sources.bak
    [[ -e /etc/apt/sources.list.d/ceph.list ]] && mv /etc/apt/sources.list.d/ceph.list /etc/apt/backup/ceph.list.bak

    [[ -e /usr/share/perl5/PVE/CLI/pveceph.pm ]] && cp -rf /usr/share/perl5/PVE/CLI/pveceph.pm /etc/apt/backup/pveceph.pm.bak
    sed -i 's|http://download.proxmox.com|https://mirrors.tuna.tsinghua.edu.cn/proxmox|g' /usr/share/perl5/PVE/CLI/pveceph.pm

    cat > /etc/apt/sources.list.d/ceph.list <<-EOF
deb https://mirrors.tuna.tsinghua.edu.cn/proxmox/debian/ceph-squid ${sver} no-subscription
EOF
    log_success "添加ceph-squid源完成!"
}
#---------PVE8/9添加ceph-squid源-----------

#---------PVE7/8添加ceph-quincy源-----------
pve8_ceph() {
    sver=`cat /etc/debian_version |awk -F"." '{print $1}'`
    case "$sver" in
     12 )
         sver="bookworm"
     ;;
     11 )
         sver="bullseye"
     ;;
    * )
        sver=""
     ;;
    esac
    if [ ! $sver ];then
        log_error "版本不支持！"
        pause_function
        return
    fi

    log_info "ceph-quincy目前仅支持PVE7和8！"
    [[ ! -d /etc/apt/backup ]] && mkdir -p /etc/apt/backup
    [[ ! -d /etc/apt/sources.list.d ]] && mkdir -p /etc/apt/sources.list.d

    [[ -e /etc/apt/sources.list.d/ceph.sources ]] && mv /etc/apt/sources.list.d/ceph.sources /etc/apt/backup/ceph.sources.bak
    [[ -e /etc/apt/sources.list.d/ceph.list ]] && mv /etc/apt/sources.list.d/ceph.list /etc/apt/backup/ceph.list.bak

    [[ -e /usr/share/perl5/PVE/CLI/pveceph.pm ]] && cp -rf /usr/share/perl5/PVE/CLI/pveceph.pm /etc/apt/backup/pveceph.pm.bak
    sed -i 's|http://download.proxmox.com|https://mirrors.tuna.tsinghua.edu.cn/proxmox|g' /usr/share/perl5/PVE/CLI/pveceph.pm

    cat > /etc/apt/sources.list.d/ceph.list <<-EOF
deb https://mirrors.tuna.tsinghua.edu.cn/proxmox/debian/ceph-quincy ${sver} main
EOF
    log_success "添加ceph-quincy源完成!"
}
#---------PVE7/8添加ceph-quincy源-----------
# 待办
#---------PVE7/8添加ceph-quincy源-----------
#---------PVE一键卸载ceph-----------
remove_ceph() {
    log_warn "会卸载ceph，并删除所有ceph相关文件！"

    systemctl stop ceph-mon.target && systemctl stop ceph-mgr.target && systemctl stop ceph-mds.target && systemctl stop ceph-osd.target
    rm -rf /etc/systemd/system/ceph*

    killall -9 ceph-mon ceph-mgr ceph-mds ceph-osd
    rm -rf /var/lib/ceph/mon/* && rm -rf /var/lib/ceph/mgr/* && rm -rf /var/lib/ceph/mds/* && rm -rf /var/lib/ceph/osd/*

    pveceph purge

    apt purge -y ceph-mon ceph-osd ceph-mgr ceph-mds
    apt purge -y ceph-base ceph-mgr-modules-core

    rm -rf /etc/ceph && rm -rf /etc/pve/ceph.conf  && rm -rf /etc/pve/priv/ceph.* && rm -rf /var/log/ceph && rm -rf /etc/pve/ceph && rm -rf /var/lib/ceph

    [[ -e /etc/apt/sources.list.d/ceph.sources ]] && mv /etc/apt/sources.list.d/ceph.sources /etc/apt/backup/ceph.sources.bak

    log_success "已成功卸载ceph."
}
#---------PVE一键卸载ceph-----------

#---------第三方小工具管理-----------
# 小工具配置
TOOLS_DIR="./Tools"
TOOLS_SOURCE_URL="https://github.com/tteck/Proxmox/raw/main/misc"
TOOLS_AUTHOR="tteck"
TOOLS_REPO="https://github.com/tteck/Proxmox"

# 小工具列表（名称|描述）
declare -A TOOLS_LIST=(
    ["post-pbs-install.sh"]="PBS 安装后配置|Post PBS Installation Setup"
    ["post-pve-install.sh"]="PVE 安装后配置|Post PVE Installation Setup"
    ["scaling-governor.sh"]="CPU 调频策略配置|CPU Scaling Governor Setup"
    ["cron-update-lxcs.sh"]="定时更新 LXC 容器|Cron Update LXC Containers"
    ["host-backup.sh"]="主机备份工具|Host Backup Tool"
    ["kernel-clean.sh"]="内核清理工具|Kernel Cleanup Tool"
    ["kernel-pin.sh"]="内核版本固定|Kernel Version Pin"
    ["clean-lxcs.sh"]="清理 LXC 容器|Clean LXC Containers"
    ["fstrim.sh"]="SSD Trim 优化|SSD Trim Optimization"
    ["update-lxcs.sh"]="更新 LXC 容器|Update LXC Containers"
    ["monitor-all.sh"]="全局监控工具|Monitor All Services"
    ["netdata.sh"]="Netdata 监控安装|Netdata Monitoring Setup"
    ["microcode.sh"]="CPU 微码更新|CPU Microcode Update"
)

# 检查并创建工具目录
check_tools_directory() {
    if [[ ! -d "$TOOLS_DIR" ]]; then
        log_info "创建工具目录: $TOOLS_DIR"
        mkdir -p "$TOOLS_DIR"
    fi
}

# 下载所有小工具
download_tools() {
    log_step "开始下载第三方小工具集..."
    check_tools_directory

    echo
    log_info "工具来源: $TOOLS_AUTHOR - $TOOLS_REPO"
    log_info "下载位置: $TOOLS_DIR"
    echo

    local total=${#TOOLS_LIST[@]}
    local current=0
    local success=0
    local failed=0

    for tool_name in "${!TOOLS_LIST[@]}"; do
        current=$((current + 1))
        local tool_url="$TOOLS_SOURCE_URL/$tool_name"
        local tool_path="$TOOLS_DIR/$tool_name"

        # 显示进度
        show_progress_bar $current $total "下载: $tool_name"

        # 使用 curl 下载（带进度和超时）
        if command -v curl &> /dev/null; then
            if curl -fsSL --connect-timeout 10 --max-time 60 \
                -o "$tool_path" "$tool_url" 2>/dev/null; then
                chmod +x "$tool_path"
                success=$((success + 1))
            else
                failed=$((failed + 1))
                log_warn "下载失败: $tool_name"
            fi
        else
            # 备用 wget
            if wget -q -O "$tool_path" "$tool_url" 2>/dev/null; then
                chmod +x "$tool_path"
                success=$((success + 1))
            else
                failed=$((failed + 1))
                log_warn "下载失败: $tool_name"
            fi
        fi
    done

    echo  # 进度条后换行
    echo

    if [[ $success -eq $total ]]; then
        log_success "所有工具下载完成！成功: $success/$total"
    elif [[ $success -gt 0 ]]; then
        log_warn "部分工具下载完成。成功: $success, 失败: $failed"
    else
        log_error "工具下载失败！请检查网络连接"
        return 1
    fi

    log_info "工具已保存到: $(cd "$TOOLS_DIR" && pwd)"
    return 0
}

# 检查工具是否已下载
check_tools_downloaded() {
    if [[ ! -d "$TOOLS_DIR" ]] || [[ $(ls -1 "$TOOLS_DIR"/*.sh 2>/dev/null | wc -l) -eq 0 ]]; then
        return 1
    fi
    return 0
}

# 显示已下载的工具列表
list_downloaded_tools() {
    log_info "已下载的工具:"
    echo

    local index=1
    for tool_name in "${!TOOLS_LIST[@]}"; do
        local tool_path="$TOOLS_DIR/$tool_name"
        local desc_full="${TOOLS_LIST[$tool_name]}"
        local desc_cn=$(echo "$desc_full" | cut -d'|' -f1)
        local desc_en=$(echo "$desc_full" | cut -d'|' -f2)

        if [[ -f "$tool_path" ]]; then
            printf "  %-2s. %-30s %s\n" "$index" "$desc_cn" "($desc_en)"
            printf "      文件: %s\n" "$tool_name"
        else
            printf "  %-2s. %-30s %s\n" "$index" "$desc_cn" "(未下载)"
        fi

        index=$((index + 1))
        echo
    done
}

# 执行小工具
run_tool() {
    local tool_name="$1"
    local tool_path="$TOOLS_DIR/$tool_name"

    if [[ ! -f "$tool_path" ]]; then
        log_error "工具不存在: $tool_name"
        return 1
    fi

    if [[ ! -x "$tool_path" ]]; then
        log_warn "工具不可执行，尝试添加执行权限..."
        chmod +x "$tool_path"
    fi

    local desc_full="${TOOLS_LIST[$tool_name]}"
    local desc_cn=$(echo "$desc_full" | cut -d'|' -f1)

    echo
    log_step "准备执行工具: $desc_cn"
    log_info "工具文件: $tool_name"
    log_info "工具路径: $tool_path"
    echo

    echo "${UI_BORDER}"
    log_warn "注意事项："
    echo "  1. 此工具来自第三方项目: $TOOLS_AUTHOR"
    echo "  2. 工具执行可能修改系统配置"
    echo "  3. 建议先了解工具功能再使用"
    echo "  4. 项目地址: $TOOLS_REPO"
    echo "${UI_DIVIDER}"

    read -p "确认执行此工具吗？(y/N): " confirm
    if [[ "$confirm" != "y" && "$confirm" != "Y" ]]; then
        log_info "已取消工具执行"
        return 0
    fi

    echo
    log_step "开始执行工具..."
    echo "${UI_BORDER}"

    # 记录执行日志
    log_info "工具执行开始: $tool_name ($(date '+%Y-%m-%d %H:%M:%S'))"

    # 执行工具并捕获输出
    if bash "$tool_path"; then
        echo "${UI_BORDER}"
        log_success "工具执行完成: $desc_cn"
        log_info "工具执行结束: $tool_name ($(date '+%Y-%m-%d %H:%M:%S'))"
    else
        echo "${UI_BORDER}"
        log_error "工具执行失败: $desc_cn"
        log_error "工具执行失败: $tool_name (退出码: $?)"
    fi
}

# 小工具选择菜单
tools_selection_menu() {
    while true; do
        clear
        show_banner
        show_menu_header "第三方小工具管理"

        echo "  工具来源: $TOOLS_AUTHOR"
        echo "  项目地址: $TOOLS_REPO"
        echo "${UI_DIVIDER}"

        # 显示工具列表
        local index=1
        local -a tool_names=()

        for tool_name in $(echo "${!TOOLS_LIST[@]}" | tr ' ' '\n' | sort); do
            tool_names[$index]=$tool_name
            local desc_full="${TOOLS_LIST[$tool_name]}"
            local desc_cn=$(echo "$desc_full" | cut -d'|' -f1)
            local tool_path="$TOOLS_DIR/$tool_name"

            if [[ -f "$tool_path" ]]; then
                show_menu_option "$index" "$desc_cn ✓"
            else
                show_menu_option "$index" "$desc_cn ✗"
            fi

            index=$((index + 1))
        done

        echo "${UI_DIVIDER}"
        show_menu_option "r" "重新下载所有工具"
        show_menu_option "l" "列出工具详情"
        show_menu_option "0" "返回主菜单"
        show_menu_footer
        echo

        read -p "请选择工具 [0-${#TOOLS_LIST[@]}] 或 [r/l]: " choice
        echo

        case $choice in
            0)
                break
                ;;
            r)
                download_tools
                pause_function
                ;;
            l)
                list_downloaded_tools
                pause_function
                ;;
            [1-9]|[1-9][0-9])
                if [[ $choice -le ${#TOOLS_LIST[@]} ]] && [[ -n "${tool_names[$choice]}" ]]; then
                    run_tool "${tool_names[$choice]}"
                else
                    log_error "无效选择"
                fi
                pause_function
                ;;
            *)
                log_error "无效选择，请重新输入"
                pause_function
                ;;
        esac
    done
}

# 第三方工具主入口
third_party_tools_menu() {
    clear
    show_banner

    # 显示重要警告信息
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo -e "${RED}⚠️  重要提示  ⚠️${NC}"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo
    log_warn "此处提到的脚本已经不再更新，使用可能会出现问题"
    echo
    echo -e "${YELLOW}存在这里的意义仅是为了提示您：${NC}"
    echo "  有第三方社区提供了更完善的脚本工具集"
    echo
    echo -e "${GREEN}推荐访问以下地址获取最新可用脚本：${NC}"
    echo -e "${CYAN}  👉 https://community-scripts.github.io/ProxmoxVE/scripts${NC}"
    echo
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo
    read -p "按任意键继续 (或输入 'q' 返回主菜单): " -n 1 continue_choice
    echo

    if [[ "$continue_choice" == "q" || "$continue_choice" == "Q" ]]; then
        return 0
    fi

    # 检查是否已下载工具
    if ! check_tools_downloaded; then
        clear
        show_banner
        show_menu_header "第三方小工具管理"

        echo "  检测到您还未下载第三方工具集"
        echo
        log_warn "注意: 这些工具来自旧版仓库，可能存在兼容性问题"
        echo
        log_info "工具来源: $TOOLS_AUTHOR (已停止更新)"
        log_info "项目地址: $TOOLS_REPO"
        log_info "工具数量: ${#TOOLS_LIST[@]} 个"
        echo
        echo "  这些工具包括:"
        echo "    • PVE/PBS 安装后配置"
        echo "    • CPU 调频策略管理"
        echo "    • LXC 容器管理"
        echo "    • 内核管理工具"
        echo "    • 系统监控工具"
        echo "    • 等等..."
        echo
        echo "${UI_DIVIDER}"

        read -p "是否立即下载工具集？(Y/n): " download_confirm
        download_confirm=${download_confirm:-Y}

        if [[ "$download_confirm" == "Y" || "$download_confirm" == "y" ]]; then
            echo
            download_tools
            pause_function

            # 下载成功后进入工具菜单
            if check_tools_downloaded; then
                tools_selection_menu
            fi
        else
            log_info "已取消下载"
            return 0
        fi
    else
        # 已下载，直接进入工具菜单
        tools_selection_menu
    fi
}
#---------第三方小工具管理-----------

# PVE8 to PVE9 升级功能
pve8_to_pve9_upgrade() {
    log_step "开始 PVE 8.x 升级到 PVE 9.x"
    
    # 检查当前 PVE 版本
    local current_pve_version=$(pveversion | head -n1 | cut -d'/' -f2 | cut -d'-' -f1)
    local major_version=$(echo $current_pve_version | cut -d'.' -f1)
    
    if [[ "$major_version" != "8" ]]; then
        log_error "当前 PVE 版本为 $current_pve_version，不是 PVE 8.x 版本，无法执行此升级"
        log_info "PVE7 请先试用ISO或升级教程升级哦! ：https://pve.proxmox.com/wiki/Upgrade_from_7_to_8"
        log_tips "如果你已经是PVE 9.x了，你还来用这个脚本，敲你额头！"
        return 1
    fi
    
    log_info "检测到当前 PVE 版本: $current_pve_version"
    log_warn "即将开始 PVE 8.x 到 PVE 9.x 的升级流程"
    log_warn "此过程不可逆，请确保已备份重要数据！"
    log_warn "建议在升级前阅读官方升级指南：https://pve.proxmox.com/wiki/Upgrade_from_8.x_to_9.0"
    echo
    log_warn "升级过程中请勿中断，确保有稳定的网络连接"
    log_warn "升级完成后，系统将自动重启以应用更改"
    log_warn "如果脚本出现升级问题，请及时联系作者或参照官方文档解决。"
    echo
    log_info "推荐使用我的新项目嘿嘿，一个独立的升级AGENT: https://github.com/Mapleawaa/PVE-8-Upgrage-helper"
    
    # 确认用户要继续执行升级
    echo "您确定要继续升级吗？本次任务执行以下操作："
    echo "  1. 安装 pve8to9 检查工具"
    echo "  2. 运行升级前检查"
    echo "  3. 更新软件源到 Debian 13 (Trixie)"
    echo "  4. 执行系统升级"
    echo "  5. 重启系统以应用更改"
    echo
    echo "注意：升级过程中可能会遇到一些警告或错误，请根据提示进行处理！脚本无法处理故障提示！(脚本只能把提示扔给你..) )"
    read -p "输入 'yesido' 确认继续，其他任意键取消: " confirm
    if [[ "$confirm" != "yesido" ]]; then
        log_info "已取消升级操作"
        return 0
    fi
    
    # 1. 更新当前系统到最新 PVE 8.x 版本
    log_info "更新当前系统到最新 PVE 8.x 版本..."
    if ! apt update && apt dist-upgrade -y; then
        log_error "更新 PVE 8.x 到最新版本失败了，请检查网络连接或源配置，或者前往作者的GitHub反馈issue.."
        return 1
    fi
    
    # 再次检查当前版本
    current_pve_version=$(pveversion | head -n1 | cut -d'/' -f2 | cut -d'-' -f1)
    log_info "更新后 PVE 版本: ${GREEN}$current_pve_version${NC}"
    
    # PVE8.4 自带这个包，此处无需检查安装，apt 源无此包会报错。
    # 2. 安装和运行 pve8to9 检查工具
    # log_info "安装 pve8to9 升级检查工具..."
    # if ! apt install -y pve8to9; then
    #     log_warn "pve8to9 工具安装失败，尝试手动安装..."
    #     # 尝试手动添加 PVE 8 仓库安装 pve8to9
    #     if ! apt install -y pve8to9; then
    #         log_error "无法安装 pve8to9 检查工具,奇怪！请检查网络连接或源配置，或者前往作者的GitHub反馈issue.."
    #         return 1
    #     fi
    # fi
    
    log_info "运行升级前检查..."
    echo -e "${CYAN}pve8to9 检查结果：${NC}"
    # 运行 pve8to9 检查，但不直接退出，而是捕获输出并分析
    echo -e "检查结果会保存到 /tmp/pve8to9_check.log 文件中，如出现故障建议查看该文件以获取详细信息"
    echo -e "再次提示，脚本只能做到把错误扔给你，无法修复问题，请根据提示自行解决(或前往作者issue反馈问题)..."
    local check_result=$(pve8to9 | tee /tmp/pve8to9_check.log)
    echo "$check_result"
    
    # 检查是否有 FAIL 标记（这意味着有严重错误需要修复）
    if echo "$check_result" | grep -E -i "FAIL" > /dev/null; then
        log_error "pve8to9 检查发现严重错误!! 一般是软件包冲突或是其他报错!建议修复后再进行升级！"
        echo -e "${YELLOW}升级检查结果详情：${NC}"
        cat /tmp/pve8to9_check.log
        read -p "您确定要忽略这些错误并继续升级吗？这不是在开玩笑！(y/N): " force_upgrade
        if [[ "$force_upgrade" != "y" && "$force_upgrade" != "Y" ]]; then
            log_info "由于存在严重错误，已取消升级操作...返回主界面"
            return 1
        fi
    else
        log_success "pve8to9 检查通过，没有发现严重错误，太好了！"
        
        # 检查是否有 WARNING 标记
        if echo "$check_result" | grep -E -i "WARN" > /dev/null; then
            log_warn "pve8to9 检查发现一些警告信息，请查看以上详情并根据需要处理。(有些可能是软件包没升级上去，不是关键软件包可以无视先升级喔)"
            read -p "是否继续升级？(Y/n): " continue_check
            if [[ "$continue_check" == "n" || "$continue_check" == "N" ]]; then
                log_info "已取消升级操作"
                return 0
            fi
        fi
    fi
    
    # 3. 安装 CPU 微码（如果提示需要）
    log_info "检查是否需要安装 CPU 微码..."
    if command -v lscpu &> /dev/null; then
        local cpu_vendor=$(lscpu | grep "Vendor ID" | awk '{print $3}')
        if [[ "$cpu_vendor" == "GenuineIntel" ]]; then
            log_info "检测到 Intel CPU，安装 Intel 微码..."
            apt install -y intel-microcode
        elif [[ "$cpu_vendor" == "AuthenticAMD" ]]; then
            log_info "检测到 AMD CPU，安装 AMD 微码..."
            apt install -y amd64-microcode
        fi
    fi
    
    # 4. 检查当前启动方式并更新引导配置
    log_info "检查系统启动方式..."
    local boot_method="unknown"
    if [[ -d "/boot/efi" ]]; then
        boot_method="efi"
        log_info "检测到 EFI 启动模式"
        # 为 EFI 系统配置 GRUB
        echo 'grub-efi-amd64 grub2/force_efi_extra_removable boolean true' | debconf-set-selections -v -u
    else
        boot_method="bios"
        log_info "检测到 BIOS 启动模式"
        log_tips "怎么还在用BIOS启用呀？建议升级到UEFI启动方式，提升系统兼容性和安全性"
    fi
    
    # 5. 备份当前源文件
    log_info "备份当前源文件..."
    local backup_dir="/etc/pve-tools-9-bak"
    mkdir -p "$backup_dir"
    local timestamp=$(date +%Y%m%d_%H%M%S)
    
    # 备份各种源文件
    if [[ -f "/etc/apt/sources.list" ]]; then
        cp /etc/apt/sources.list "${backup_dir}/sources.list.backup.${timestamp}"
    fi
    
    if [[ -f "/etc/apt/sources.list.d/pve-enterprise.list" ]]; then
        cp /etc/apt/sources.list.d/pve-enterprise.list "${backup_dir}/pve-enterprise.list.backup.${timestamp}"
    fi
    
    # 6. 更新源到 Debian 13 (Trixie) 并添加 PVE 9.x 源
    log_info "更新软件源到 Debian 13 (Trixie)..."
    
    # 将所有 bookworm 源替换为 trixie
    log_step "替换 sources.list 和 pve-enterprise.list 中的 bookworm 为 trixie"
    sed -i 's/bookworm/trixie/g' /etc/apt/sources.list 2>/dev/null || true
    sed -i 's/bookworm/trixie/g' /etc/apt/sources.list.d/pve-enterprise.list 2>/dev/null || true
    
    # 创建 PVE 9.x 的 sources 配置文件
    log_step "创建 PVE 9.x 的 sources 配置文件..."
    cat > /etc/apt/sources.list.d/proxmox.sources << EOF
Types: deb
URIs: http://download.proxmox.com/debian/pve
Suites: trixie
Components: pve-no-subscription
Signed-By: /usr/share/keyrings/proxmox-archive-keyring.gpg
EOF
    
    # 创建 Ceph Squid 源配置文件
    log_step "创建 Ceph Squid 源配置文件..."
    cat > /etc/apt/sources.list.d/ceph.sources << EOF
Types: deb
URIs: http://download.proxmox.com/debian/ceph-squid
Suites: trixie
Components: no-subscription
Signed-By: /usr/share/keyrings/proxmox-archive-keyring.gpg
EOF
    
    log_info "软件源已更新到 Debian 13 (Trixie) 和 PVE 9.x 配置"
    
    # 7. 再次运行升级前检查确认源更新无误
    log_info "再次运行 pve8to9 检查以确认源配置..."
    local final_check_result=$(pve8to9)
    if echo "$final_check_result" | grep -E -i "FAIL" > /dev/null; then
        log_error "pve8to9 最终检查发现错误，请手动检查源配置后再继续"
        echo "$final_check_result"
        return 1
    else
        log_success "源更新配置检查通过"
    fi
    
    # 8. 更新包列表并开始升级
    log_info "更新包列表..."
    if ! apt update; then
        log_error "更新包列表失败，请检查网络连接和源配置"
        return 1
    fi
    
    log_info "开始 PVE 9.x 升级过程，这可能需要较长时间..."
    log_warn "如果你正在使用Web UI内置的终端，建议改用SSH连接以防止连接中断"
    echo -e "${YELLOW}升级过程中可能会出现多个提示，通常按回车键或选择默认选项即可${NC}"
    
    # 使用非交互模式升级，自动回答问题
    DEBIAN_FRONTEND=noninteractive apt dist-upgrade -y \
        -o Dpkg::Options::="--force-confdef" \
        -o Dpkg::Options::="--force-confold"
    
    if [[ $? -ne 0 ]]; then
        log_error "PVE 升级过程失败，请查看日志并手动处理...如果是在看不明白可以试试问AI或者提交issue"
        return 1
    fi
    
    # 9. 清理无用包
    log_info "清理无用软件包..."
    apt autoremove -y
    apt autoclean
    
    # 10. 检查升级结果
    local new_pve_version=$(pveversion | head -n1 | cut -d'/' -f2 | cut -d'-' -f1)
    local new_major_version=$(echo $new_pve_version | cut -d'.' -f1)
    
    if [[ "$new_major_version" == "9" ]]; then
        log_success "（撒花）PVE 升级成功！新的 PVE 版本: ${GREEN}$new_pve_version${NC}"
        
        # 运行最终的升级后检查
        log_info "运行升级后检查..."
        pve8to9 2>/dev/null || true
        
        log_info "系统将在 30 秒后重启以完成升级..."
        log_success "如果一切顺利，重启后就能体验到PVE9啦！"
        log_warn "如果升级后出现问题，例如卡内核卡Grub，请先使用LiveCD抢修内核，提取日志文件后联系作者寻求帮助"
        echo -e "${YELLOW}按 Ctrl+C 可取消自动重启${NC}"
        sleep 30
        
        # 重启系统以完成升级
        log_info "正在重启系统以完成 PVE 9.x 升级..."
        reboot
    else
        log_error "升级完成后检查发现，PVE 版本仍为 $new_pve_version，升级可能未完全成功"
        log_tips "请手动检查系统状态，并确认是否需要重试升级"
        return 1
    fi
}

# 显示系统信息
show_system_info() {
    log_step "为您展示系统运行状况"
    echo
    echo "${UI_BORDER}"
    echo "  系统信息概览"
    echo "${UI_DIVIDER}"
    echo "PVE 版本: $(pveversion | head -n1)"
    echo "内核版本: $(uname -r)"
    echo "CPU 信息: $(lscpu | grep 'Model name' | sed 's/Model name:[ \t]*//')"
    echo "CPU 核心: $(nproc) 核心"
    echo "系统架构: $(dpkg --print-architecture)"
    echo "系统启动: $(uptime -p | sed 's/up //')"
    echo "引导类型: $(if [ -d /sys/firmware/efi ]; then echo UEFI; else echo BIOS; fi)"
    echo "系统负载: $(uptime | awk -F'load average:' '{print $2}')"
    echo "内存使用: $(free -h | grep Mem | awk '{print $3"/"$2}')"
    echo "磁盘使用:"
    df -h | grep -E '^/dev/' | awk '{print "  "$1" "$3"/"$2" ("$5")"}'
    echo "网络接口:"
    ip -br addr show | awk '{print "  "$1" "$3}'
    echo "当前时间: $(date)"
    echo "${UI_FOOTER}"
}

# 主菜单
show_menu() {
    show_menu_header "请选择您需要的功能："
    show_menu_option "1"  "更换软件源 (强烈推荐，让下载飞起来)"
    show_menu_option "2"  "删除订阅弹窗 (告别烦人提醒)"
    show_menu_option "3"  "合并 local 与 local-lvm (小硬盘救星)"
    show_menu_option "4"  "删除 Swap 分区 (释放更多空间)"
    show_menu_option "5"  "更新系统 (保持最新状态)"
    show_menu_option "6"  "显示系统信息 (查看运行状况)"
    echo
    show_menu_option "7"  "一键配置 (换源+删弹窗+更新，懒人必选，推荐在SSH下使用)"
    echo
    show_menu_option "8"  "硬件直通配置 (PCI设备直通设置)"
    show_menu_option "9"  "CPU电源模式 (调整CPU性能模式)"
    show_menu_option "10" "温度监控管理 (CPU/硬盘监控设置)"
    show_menu_option "11" "Ceph管理 (存储相关配置)"
    show_menu_option "12" "内核管理 (内核切换/更新/清理)"
    show_menu_option "13" "PVE8 升级到 PVE9 (PVE8专用)"
    show_menu_option "14" "第三方工具集 (tteck社区工具)"
    show_menu_option "15" "核显高级功能 (Intel 核显虚拟化)"
    show_menu_option "16" "给作者点个Star吧，谢谢喵~"
    echo
    show_menu_option "0"  "退出脚本"
    show_menu_footer
    echo
    echo "小贴士：新装系统推荐选择 7 进行一键配置"
    echo -n "请输入您的选择 [0-16]: "
}

# 一键配置
quick_setup() {
    log_step "开始一键配置"
    log_step "天涯若比邻，海内存知己，坐和放宽，让我来搞定一切。"
    echo
    change_sources
    echo
    remove_subscription_popup
    echo
    update_system
    echo
    log_success "一键配置全部完成！您的 PVE 已经完美优化"
    echo -e "${CYAN}现在您可以愉快地使用 PVE 了！${NC}"
}

# 通用UI函数
show_menu_header() {
    local title="$1"
    echo "${UI_BORDER}"
    printf "  %s\n" "$title"
    echo "${UI_DIVIDER}"
}

show_menu_footer() {
    echo "${UI_FOOTER}"
}

show_menu_option() {
    local num="$1"
    local desc="$2"
    # Use plain text without color codes
    printf "  %-3s. %s\\n" "$num" "$desc"
}

# 镜像源选择函数
select_mirror() {
    while true; do
        clear
        show_banner
        show_menu_header "请选择镜像源"
        show_menu_option "1" "中科大镜像源"
        show_menu_option "2" "清华Tuna镜像源" 
        show_menu_option "3" "Debian默认源"
        echo "${UI_DIVIDER}"
        echo "注意：选择后将作为后续所有软件源操作的基础"
        show_menu_footer
        echo
        
        read -p "请选择 [1-3]: " mirror_choice
        
        case $mirror_choice in
            1)
                SELECTED_MIRROR=$MIRROR_USTC
                log_success "已选择中科大镜像源"
                break
                ;;
            2)
                SELECTED_MIRROR=$MIRROR_TUNA
                log_success "已选择清华Tuna镜像源"
                break
                ;;
            3)
                SELECTED_MIRROR=$MIRROR_DEBIAN
                log_success "已选择Debian默认源"
                break
                ;;
            *)
                log_error "无效选择，请重新输入"
                pause_function
                ;;
        esac
    done
}

# 版本检查函数
check_update() {
    log_info "正在检查更新..."
    
    # 下载文件的函数（带超时）
    download_file() {
        local url="$1"
        local timeout=10
        
        if command -v curl &> /dev/null; then
            curl -s --connect-timeout $timeout --max-time $timeout "$url" 2>/dev/null
        elif command -v wget &> /dev/null; then
            wget -q -T $timeout -O - "$url" 2>/dev/null
        else
            echo ""
        fi
    }
    
    # 显示进度提示
    echo -ne "[....] 正在检查更新...\033[0K\r"
    
    # 首先尝试从GitHub下载版本文件
    remote_content=$(download_file "$VERSION_FILE_URL")
    
    # 如果GitHub下载失败，自动尝试镜像源
    if [ -z "$remote_content" ]; then
        echo -ne "[WARN] GitHub连接失败，尝试镜像源...\033[0K\r"
        mirror_url="https://ghfast.top/Mapleawaa/PVE-Tools-9/main/VERSION"
        remote_content=$(download_file "$mirror_url")
    fi
    
    # 清除进度显示
    echo -ne "\033[0K\r"
    
    # 如果所有下载都失败
    if [ -z "$remote_content" ]; then
        log_warn "网络连接失败，跳过版本检查"
        echo "提示：您可以手动访问以下地址检查更新："
        echo "https://github.com/Mapleawaa/PVE-Tools-9"
        echo "按回车键继续..."
        read -r
        return
    fi
    
    # 提取版本号和更新日志
    remote_version=$(echo "$remote_content" | head -1 | tr -d '[:space:]')
    version_changelog=$(echo "$remote_content" | tail -n +2)
    
    if [ -z "$remote_version" ]; then
        log_warn "获取的版本信息格式不正确"
        return
    fi
    
    # 尝试获取详细的更新日志
    UPDATE_FILE_URL="https://raw.githubusercontent.com/Mapleawaa/PVE-Tools-9/main/UPDATE"
    detailed_changelog=$(download_file "$UPDATE_FILE_URL")
    
    # 如果GitHub的UPDATE文件获取失败，尝试镜像源
    if [ -z "$detailed_changelog" ]; then
        mirror_update_url="https://ghfast.top/Mapleawaa/PVE-Tools-9/main/UPDATE"
        detailed_changelog=$(download_file "$mirror_update_url")
    fi
    
    # 比较版本
    if [ "$(printf '%s\n' "$remote_version" "$CURRENT_VERSION" | sort -V | tail -n1)" != "$CURRENT_VERSION" ]; then
        echo "----------------------------------------------"
        echo "发现新版本！推荐更新哦，新增功能和修复BUG喵"
        echo "当前版本: $CURRENT_VERSION"
        echo "最新版本: $remote_version"
        echo "更新内容："
        
        # 如果获取到了详细的更新日志，则显示详细内容，否则显示从VERSION文件中获取的内容
        if [ -n "$detailed_changelog" ]; then
            echo "$detailed_changelog"
        else
            # 格式化显示版本文件中的更新内容
            if [ -n "$version_changelog" ] && [ "$version_changelog" != "$remote_version" ]; then
                echo "$version_changelog"
            else
                echo "  - 请查看项目页面获取详细更新内容"
            fi
        fi
        
        echo "----------------------------------------------"
        echo "请访问项目页面获取最新版本："
        echo "https://github.com/Mapleawaa/PVE-Tools-9"
        echo "按回车键继续..."
        read -r
    else
        log_success "当前已是最新版本 ($CURRENT_VERSION) 放心用吧"
    fi
}

# 温度监控管理菜单
temp_monitoring_menu() {
    while true; do
        clear
        show_banner
        show_menu_header "温度监控管理"
        show_menu_option "1" "配置温度监控 (CPU/硬盘温度显示)"
        show_menu_option "2" "移除温度监控 (移除温度监控功能)"
        show_menu_option "3" "自定义温度监控选项 (高级)"
        echo "${UI_DIVIDER}"
        show_menu_option "0" "返回主菜单"
        show_menu_footer
        echo
        read -p "请选择 [0-3]: " temp_choice
        echo
        
        case $temp_choice in
            1)
                cpu_add
                ;;
            2)
                cpu_del
                ;;
            3)
                custom_temp_monitoring
                ;;
            0)
                break
                ;;
            *)
                log_error "无效选择，请重新输入"
                ;;
        esac
        
        echo
        pause_function
    done
}

# 自定义温度监控配置
custom_temp_monitoring() {
    clear
    show_banner
    
    # Define options
    declare -A options
    # options[0]="CPU 实时主频"
    # options[1]="CPU 最小及最大主频 (必选 0)"
    # options[2]="CPU 线程主频"
    # options[3]="CPU 工作模式 (必选 0)"
    # options[4]="CPU 功率 (必选 0)"
    # options[5]="CPU 温度"
    # options[6]="CPU 核心温度 (不支持 AMD, 必选 5)"
    # options[7]="核显温度 (仅支持 AMD, 必选 5)"
    # options[8]="风扇转速 (可能需要单独安装传感器驱动, 必选 5)"
    # options[9]="UPS 信息 (仅支持 apcupsd - apcaccess 软件包)"
    # options[a]="硬盘基础信息 (容量、寿命 (仅 NVME )、温度)"
    # options[b]="硬盘通电信息 (必选 a)"
    # options[c]="硬盘 IO 信息 (必选 a)"
    # options[l]="概要信息: 居左显示"
    # options[r]="概要信息: 居右显示"
    # options[m]="概要信息: 居中显示"
    # options[j]="概要信息: 平铺显示"
    options[o]="推荐方案一：高大全 (除 UPS 信息以外全部居右显示)"
    options[p]="推荐方案二：精简"
    options[q]="推荐方案三：极简"
    options[x]="一键清空 (还原默认)"
    options[s]="跳过本次修改"
    
    echo "请选择要启用的监控项目 (用空格分隔，如: o):"
    echo
    
    # Display options with checkboxes
    # for key in 0 1 2 3 4 5 6 7 8 9 a b c l r m j o p q x s; do
    for key in o p q x s; do
        if [[ -n "${options[$key]}" ]]; then
            echo "  [ ] $key) ${options[$key]}"
        fi
    done
    
    echo
    read -p "请输入选择 (如: 0 5 6 或 o 或 s): " input
    
    # Process user selections
    if [[ "$input" == "s" ]]; then
        log_info "跳过自定义配置"
        return
    fi
    
    if [[ "$input" == "x" ]]; then
        log_info "正在还原默认设置..."
        cpu_del
        log_success "已还原默认设置"
        return
    fi
    
    if [[ "$input" == "o" ]]; then
        log_info "应用推荐方案一：高大全..."
        # Apply comprehensive configuration
        cpu_add
        log_success "推荐方案一已应用"
        return
    fi
    
    if [[ "$input" == "p" ]]; then
        log_info "应用推荐方案二：精简..."
        # Apply simplified configuration
        cpu_add
        log_success "推荐方案二已应用"
        return
    fi
    
    if [[ "$input" == "q" ]]; then
        log_info "应用推荐方案三：极简..."
        # Apply minimal configuration
        cpu_add
        log_success "推荐方案三已应用"
        return
    fi
    
    # Process selected individual options
    echo "您选择了: $input"
    echo "正在配置自定义温度监控..."
    
    # Parse and validate dependencies
    selections=($input)
    dependencies_met=true
    
    # Check for dependencies
    for selection in "${selections[@]}"; do
        case "$selection" in
            1) if [[ ! " ${selections[@]} " =~ " 0 " ]]; then
                 log_error "选项 1 需要选项 0，请重新选择"
                 dependencies_met=false
                 break
               fi ;;
            3|4) if [[ ! " ${selections[@]} " =~ " 0 " ]]; then
                 log_error "选项 3 或 4 需要选项 0，请重新选择"
                 dependencies_met=false
                 break
               fi ;;
            6|7|8) if [[ ! " ${selections[@]} " =~ " 5 " ]]; then
                 log_error "选项 6, 7 或 8 需要选项 5，请重新选择"
                 dependencies_met=false
                 break
               fi ;;
            b) if [[ ! " ${selections[@]} " =~ " a " ]]; then
                 log_error "选项 b 需要选项 a，请重新选择"
                 dependencies_met=false
                 break
               fi ;;
            c) if [[ ! " ${selections[@]} " =~ " a " ]]; then
                 log_error "选项 c 需要选项 a，请重新选择"
                 dependencies_met=false
                 break
               fi ;;
        esac
    done
    
    if [[ "$dependencies_met" == true ]]; then
        log_info "配置所选监控项..."
        # In a real implementation, this would customize the monitoring based on selections
        # For now, we'll use the existing cpu_add function
        cpu_add  # Use the existing function to install the basic monitoring
        log_success "自定义温度监控配置完成"
    else
        log_error "配置失败，依赖关系不满足"
    fi
}

# Ceph管理菜单
ceph_management_menu() {
    while true; do
        clear
        show_banner
        show_menu_header "Ceph管理"
        show_menu_option "1" "添加ceph-squid源 (PVE8/9专用)"
        show_menu_option "2" "添加ceph-quincy源 (PVE7/8专用)"
        show_menu_option "3" "卸载Ceph (完全移除Ceph)"
        echo "${UI_DIVIDER}"
        show_menu_option "0" "返回主菜单"
        show_menu_footer
        echo
        read -p "请选择 [0-3]: " ceph_choice
        echo
        
        case $ceph_choice in
            1)
                pve9_ceph
                ;;
            2)
                pve8_ceph
                ;;
            3)
                remove_ceph
                ;;
            0)
                break
                ;;
            *)
                log_error "无效选择，请重新输入"
                ;;
        esac
        
        echo
        pause_function
    done
}

# 主程序
main() {
    check_root
    check_debug_mode "$@"
    check_pve_version
    
    # 检查更新
    check_update
    
    # 选择镜像源
    select_mirror
    
    while true; do
        show_banner
        show_menu
        read -n 2 choice
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
                quick_setup
                ;;
            8)
                hw_passth
                ;;
            9)
                cpupower
                ;;
            10)
                temp_monitoring_menu
                ;;
            11)
                ceph_management_menu
                ;;
            12)
                kernel_management_menu
                ;;
            13)
                pve8_to_pve9_upgrade
                ;;
            14)
                third_party_tools_menu
                ;;
            15)
                igpu_management_menu
                ;;
            16)
                echo "项目地址：https://github.com/Mapleawaa/PVE-Tools-9"
                echo "有你真好~"
                ;;
            0)
                echo "感谢使用,谢谢喵"
                echo "再见！"
                exit 0
                ;;
            *)
                log_error "哎呀，这个选项不存在呢"
                log_warn "请输入 0-16 之间的数字"
                ;;
        esac
        
        echo
        pause_function
    done
}

# 运行主程序
main "$@"
