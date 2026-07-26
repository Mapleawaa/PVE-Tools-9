#!/bin/bash
# SPDX-License-Identifier: GPL-3.0-only
# Copyright (C) 2026 Ciriu Networks

# ============================================================
# IT87 DKMS Driver Manager
# 管理 ITE Super I/O 芯片的内核驱动，使 lm-sensors 能读取风扇转速
# ============================================================

# ---------- 辅助函数 ----------

# 从 /etc/modprobe.d/it87.conf 提取当前 force_id
it87_get_force_id() {
    local conf_file="/etc/modprobe.d/it87.conf"
    if [[ -f "$conf_file" ]]; then
        grep -oP 'force_id=\K0x[0-9a-fA-F]+' "$conf_file" 2>/dev/null || echo ""
    fi
}

# 查找 it87 hwmon 设备路径
it87_find_hwmon_path() {
    local hwmon_dir name
    for hwmon_dir in /sys/class/hwmon/hwmon*/; do
        if [[ -f "${hwmon_dir}name" ]]; then
            name=$(cat "${hwmon_dir}name" 2>/dev/null)
            # it87 驱动注册的名称可能是 it87 或具体芯片名
            case "$name" in
                it87|it8603|it8620|it8628|it8631|it8655|it8665|it8686|it8689|it8720)
                    echo "${hwmon_dir%/}"
                    return 0
                    ;;
            esac
        fi
    done
    return 1
}

# 从 hwmon 路径读取风扇 RPM
it87_read_fan_rpm() {
    local hwmon_path="$1"
    local fan rpm rpm_str="" count=0

    for fan in "$hwmon_path"/fan*_input; do
        [[ -f "$fan" ]] || continue
        rpm=$(cat "$fan" 2>/dev/null)
        if [[ -n "$rpm" ]]; then
            local label
            label=$(basename "$fan" _input)
            rpm_str+="${label}=${rpm}RPM "
            ((++count))
        fi
    done

    if [[ $count -gt 0 ]]; then
        echo "${rpm_str% }"
    fi
}

# 保存 force_id 到 modprobe.d 配置
it87_save_force_id() {
    local new_id="$1"
    local conf_file="/etc/modprobe.d/it87.conf"

    mkdir -p "/etc/modprobe.d"
    local content="options it87 ignore_resource_conflict=1 force_id=${new_id}"
    apply_block "$conf_file" "IT87_OPTIONS" "$content"
    log_info "force_id 已设置为 ${new_id}"
}

# 安装依赖软件包
it87_install_deps() {
    local pkgs=()

    command -v git >/dev/null 2>&1 || pkgs+=(git)
    command -v dkms >/dev/null 2>&1 || pkgs+=(dkms)
    command -v sensors >/dev/null 2>&1 || pkgs+=(lm-sensors)

    # pve-headers
    local kernel_version
    kernel_version=$(uname -r)
    if ! dpkg-query -W -f='${Status}' "pve-headers-${kernel_version}" 2>/dev/null | grep -q "install ok installed"; then
        pkgs+=("pve-headers-${kernel_version}")
    fi

    if [[ ${#pkgs[@]} -eq 0 ]]; then
        log_info "所有依赖已满足"
        return 0
    fi

    log_step "安装依赖: ${pkgs[*]}"
    apt-get install -y "${pkgs[@]}" || {
        display_error "依赖安装失败" "请检查 apt 源和网络连接"
        return 1
    }
    return 0
}

# ---------- 状态检测 ----------

it87_detect_status() {
    local loaded="否" hwmon_path="" fan_info="" status_str=""

    lsmod | grep -q "^it87 " && loaded="是"

    hwmon_path=$(it87_find_hwmon_path)
    if [[ -n "$hwmon_path" ]]; then
        fan_info=$(it87_read_fan_rpm "$hwmon_path")
    fi

    if [[ "$loaded" == "是" && -n "$hwmon_path" ]]; then
        status_str="已加载/设备就绪"
        [[ -n "$fan_info" ]] && status_str+=" [${fan_info}]"
    elif [[ "$loaded" == "是" ]]; then
        status_str="已加载/无 hwmon 设备"
    elif ls /usr/src/${IT87_DKMS_NAME:-it87}-* >/dev/null 2>&1; then
        status_str="已安装/未加载"
    else
        status_str="未安装"
    fi

    echo "$status_str"
}

it87_detect_version() {
    local dkms_ver mod_ver src_ver

    if command -v dkms >/dev/null 2>&1; then
        dkms_ver=$(dkms status 2>/dev/null | grep "^${IT87_DKMS_NAME:-it87}[/ ,]" | head -1 | awk -F'[,/ ]' '{print $2}')
    fi

    if command -v modinfo >/dev/null 2>&1; then
        mod_ver=$(modinfo -F version it87 2>/dev/null)
    fi

    src_ver=$(ls -d /usr/src/${IT87_DKMS_NAME:-it87}-* 2>/dev/null | head -1 | sed 's|/usr/src/it87-||')

    if [[ -n "$dkms_ver" ]]; then
        echo "DKMS ${dkms_ver}"
    elif [[ -n "$mod_ver" ]]; then
        echo "${mod_ver}"
    elif [[ -n "$src_ver" ]]; then
        echo "源码 ${src_ver} (未安装)"
    else
        echo "未安装"
    fi
}

# ---------- 配置管理 ----------

it87_configure_boot() {
    local force_id
    force_id=$(it87_get_force_id)

    if [[ -z "$force_id" ]]; then
        display_error "未设置芯片型号 (force_id)" "请先通过「选择芯片型号」菜单设置"
        return 1
    fi

    # modprobe.d 配置
    mkdir -p "/etc/modprobe.d"
    local content="options it87 ignore_resource_conflict=1 force_id=${force_id}"
    apply_block "/etc/modprobe.d/it87.conf" "IT87_OPTIONS" "$content"

    # /etc/modules 添加 it87（幂等，不加标记块，纯模块名）
    if ! grep -q "^it87" /etc/modules 2>/dev/null; then
        echo "it87" >> /etc/modules
        log_info "已添加 it87 到 /etc/modules"
    else
        log_info "it87 已在 /etc/modules 中"
    fi

    # 更新 initramfs
    log_step "更新 initramfs..."
    if command -v update-initramfs >/dev/null 2>&1; then
        update-initramfs -u || log_warn "update-initramfs 执行失败，请手动更新"
    else
        log_warn "update-initramfs 不可用"
    fi

    display_success "开机自启配置完成" "驱动将在下次启动时自动加载"
}

# ---------- force_id 选择菜单 ----------

it87_force_id_menu() {
    while true; do
        clear
        show_menu_header "选择 ITE 芯片型号 (force_id)"

        local current_id
        current_id=$(it87_get_force_id)
        if [[ -n "$current_id" ]]; then
            echo -e "  当前配置: ${CYAN}force_id=${current_id}${NC}"
        else
            echo -e "  当前配置: ${ORANGE}未设置${NC}"
        fi
        echo "  如果不确定芯片型号，可先安装驱动后运行 sensors 命令，"
        echo "  在输出中查看芯片名称再来选择。"
        echo "$UI_DIVIDER"
        show_menu_option "1"  "IT8613  (0x8613)"
        show_menu_option "2"  "IT8620  (0x8620) - 常见"
        show_menu_option "3"  "IT8628  (0x8628)"
        show_menu_option "4"  "IT8631  (0x8631)"
        show_menu_option "5"  "IT8655  (0x8655)"
        show_menu_option "6"  "IT8656  (0x8656)"
        show_menu_option "7"  "IT8665  (0x8665)"
        show_menu_option "8"  "IT8686  (0x8686) - 常见"
        show_menu_option "9"  "IT8689  (0x8689)"
        show_menu_option "10" "IT8720  (0x8720)"
        show_menu_option "11" "自定义 ID"
        echo "$UI_DIVIDER"
        show_menu_option "0" "返回"
        show_menu_footer

        local choice id_value=""
        read -r -p "请选择芯片型号 [0-11]: " choice
        case "$choice" in
            1)  id_value="0x8613" ;;
            2)  id_value="0x8620" ;;
            3)  id_value="0x8628" ;;
            4)  id_value="0x8631" ;;
            5)  id_value="0x8655" ;;
            6)  id_value="0x8656" ;;
            7)  id_value="0x8665" ;;
            8)  id_value="0x8686" ;;
            9)  id_value="0x8689" ;;
            10) id_value="0x8720" ;;
            11)
                read -r -p "请输入自定义 force_id (如 0x8620): " id_value
                if [[ ! "$id_value" =~ ^0x[0-9a-fA-F]{4}$ ]]; then
                    display_error "无效的 ID 格式" "请输入 0x 开头的 4 位十六进制数"
                    continue
                fi
                ;;
            0) return ;;
            *) log_error "无效选择" ; pause_function ; continue ;;
        esac

        if [[ -n "$id_value" ]]; then
            it87_save_force_id "$id_value"
            display_success "芯片型号已设置为 force_id=${id_value}" "需重新加载驱动或重启后生效"

            # 询问是否立即重载模块
            local reload_now
            read -r -p "是否立即重新加载驱动模块？[yes]: " reload_now
            reload_now="${reload_now:-yes}"
            if [[ "$reload_now" =~ ^[Yy][Ee][Ss]?$ ]]; then
                log_step "重新加载 it87 模块..."
                rmmod it87 2>/dev/null || true
                if modprobe it87 2>/dev/null; then
                    log_success "模块已重新加载"
                else
                    display_error "模块加载失败" "请重启后重试，或检查 force_id 是否正确"
                fi
            fi
            return
        fi
    done
}

# ---------- 安装 ----------

it87_install_dkms() {
    block_non_pve9_destructive "安装 IT87 DKMS 驱动" || return 1

    if ! command -v apt-get >/dev/null 2>&1; then
        display_error "缺少 apt-get" "请在 Debian/PVE 宿主机环境中运行"
        return 1
    fi

    # 确保有 force_id
    local force_id
    force_id=$(it87_get_force_id)
    if [[ -z "$force_id" ]]; then
        log_warn "尚未设置芯片型号，请先选择"
        it87_force_id_menu
        force_id=$(it87_get_force_id)
        [[ -z "$force_id" ]] && { display_error "未选择芯片型号" "安装已取消"; return 1; }
    fi

    clear
    show_menu_header "安装 IT87 驱动 (DKMS)"
    echo -e "${CYAN}仓库:${NC} ${IT87_REPO_URL:-https://github.com/shauno8/it87.git}"
    echo -e "${CYAN}芯片:${NC} force_id=${force_id}"
    echo "$UI_DIVIDER"
    echo "  将通过 DKMS 从源码编译安装 it87 内核驱动模块。"
    echo "  安装后 lm-sensors 可读取 ITE 芯片风扇转速/温度/电压。"
    echo "$UI_DIVIDER"

    if ! confirm_high_risk_action "安装 IT87 内核驱动 (DKMS)" \
        "会从 GitHub 克隆源码并编译安装内核模块到当前 PVE 内核" \
        "编译失败可能影响系统稳定性；错误的 force_id 可能导致传感器读数异常" \
        "建议确认主板 ITE 芯片型号；安装后运行 sensors 验证；保留控制台访问" \
        "IT87-DKMS"; then
        return 0
    fi

    # 安装依赖
    it87_install_deps || return 1

    # 清理旧源码目录（包括精确克隆目标和带版本后缀的目录）
    rm -rf "/usr/src/${IT87_DKMS_NAME:-it87}" /usr/src/"${IT87_DKMS_NAME:-it87}"-*

    # 克隆仓库
    local src_dir="/usr/src/${IT87_DKMS_NAME:-it87}"
    log_step "克隆源码到 ${src_dir}..."
    if [[ -n "${IT87_REPO_REF}" ]]; then
        # git init + fetch 比 git clone --branch 更可靠地支持任意 commit SHA
        git init "$src_dir" >/dev/null 2>&1 || {
            display_error "源码克隆失败" "请检查网络连接和 git 可用性"
            return 1
        }
        (
            cd "$src_dir" || exit 1
            git remote add origin "${IT87_REPO_URL:-https://github.com/shauno8/it87.git}" || exit 1
            git fetch --depth 1 origin "${IT87_REPO_REF}" || exit 1
            git checkout FETCH_HEAD || exit 1
        ) || {
            display_error "源码克隆失败" "请检查网络连接和 git 可用性"
            return 1
        }
    else
        if ! git clone --depth 1 "${IT87_REPO_URL:-https://github.com/shauno8/it87.git}" "$src_dir"; then
            display_error "源码克隆失败" "请检查网络连接和 git 可用性"
            return 1
        fi
    fi

    # DKMS 编译安装（在子 shell 中运行，不影响父 shell 工作目录）
    log_step "DKMS 编译安装..."
    if ! (cd "$src_dir" && make dkms); then
        display_error "DKMS 编译安装失败" "请检查 make/dkms 输出；可能需要安装 pve-headers 或使用直接编译模式"
        return 1
    fi

    # 配置开机加载
    it87_configure_boot

    # 加载模块
    log_step "加载 it87 内核模块..."
    if modprobe it87 2>/dev/null; then
        display_success "IT87 驱动安装完成" "运行 sensors 查看传感器数据"
    else
        log_warn "模块已安装但加载失败，可能需要重启后生效"
        display_success "IT87 驱动已安装" "重启系统后驱动将自动加载"
    fi

    # 询问是否查看传感器
    local run_sensors
    read -r -p "是否立即查看传感器输出？[yes]: " run_sensors
    run_sensors="${run_sensors:-yes}"
    if [[ "$run_sensors" =~ ^[Yy][Ee][Ss]?$ ]]; then
        sensors 2>/dev/null || log_warn "sensors 命令执行失败"
    fi

    return 0
}

it87_install_direct() {
    block_non_pve9_destructive "安装 IT87 驱动 (直接编译)" || return 1

    if ! command -v apt-get >/dev/null 2>&1; then
        display_error "缺少 apt-get" "请在 Debian/PVE 宿主机环境中运行"
        return 1
    fi

    local force_id
    force_id=$(it87_get_force_id)
    if [[ -z "$force_id" ]]; then
        log_warn "尚未设置芯片型号，请先选择"
        it87_force_id_menu
        force_id=$(it87_get_force_id)
        [[ -z "$force_id" ]] && { display_error "未选择芯片型号" "安装已取消"; return 1; }
    fi

    clear
    show_menu_header "安装 IT87 驱动 (直接编译)"
    echo -e "${CYAN}仓库:${NC} ${IT87_REPO_URL:-https://github.com/shauno8/it87.git}"
    echo -e "${CYAN}芯片:${NC} force_id=${force_id}"
    echo "$UI_DIVIDER"
    echo "  将通过 make && make install 直接编译安装（无 DKMS）。"
    echo "  适用于不支持 DKMS 的系统，或作为 DKMS 失败的备选方案。"
    echo "  注意：内核更新后需要手动重新编译。"
    echo "$UI_DIVIDER"

    if ! confirm_high_risk_action "安装 IT87 内核驱动 (直接编译)" \
        "会从 GitHub 克隆源码并直接编译安装到当前内核" \
        "内核更新后需要手动重新编译；无 DKMS 自动重建机制" \
        "建议优先使用 DKMS 方式；确认 DKMS 确实不可用再使用此方式" \
        "IT87-DIRECT"; then
        return 0
    fi

    # 安装依赖（不含 dkms）
    local pkgs=()
    command -v git >/dev/null 2>&1 || pkgs+=(git)
    command -v sensors >/dev/null 2>&1 || pkgs+=(lm-sensors)
    if ! dpkg-query -W -f='${Status}' "pve-headers-$(uname -r)" 2>/dev/null | grep -q "install ok installed"; then
        pkgs+=("pve-headers-$(uname -r)")
    fi
    if [[ ${#pkgs[@]} -gt 0 ]]; then
        log_step "安装依赖: ${pkgs[*]}"
        apt-get install -y "${pkgs[@]}" || { display_error "依赖安装失败" ""; return 1; }
    fi

    # 创建临时构建目录
    local build_dir
    build_dir=$(mktemp -d) || {
        display_error "创建临时目录失败" ""
        return 1
    }

    # 克隆到临时目录
    log_step "克隆源码..."
    if [[ -n "${IT87_REPO_REF}" ]]; then
        # git init + fetch 比 git clone --branch 更可靠地支持任意 commit SHA
        git init "$build_dir" >/dev/null 2>&1 || {
            display_error "源码克隆失败" "请检查网络连接"
            rm -rf "$build_dir"
            return 1
        }
        (
            cd "$build_dir" || exit 1
            git remote add origin "${IT87_REPO_URL:-https://github.com/shauno8/it87.git}" || exit 1
            git fetch --depth 1 origin "${IT87_REPO_REF}" || exit 1
            git checkout FETCH_HEAD || exit 1
        ) || {
            display_error "源码克隆失败" "请检查网络连接"
            rm -rf "$build_dir"
            return 1
        }
    else
        if ! git clone --depth 1 "${IT87_REPO_URL:-https://github.com/shauno8/it87.git}" "$build_dir"; then
            display_error "源码克隆失败" "请检查网络连接"
            rm -rf "$build_dir"
            return 1
        fi
    fi

    # 编译安装（子 shell）
    log_step "编译安装..."
    if ! (cd "$build_dir" && make && make install); then
        display_error "编译安装失败" "请检查 make 输出和 pve-headers 安装情况"
        rm -rf "$build_dir"
        return 1
    fi
    rm -rf "$build_dir"

    # 配置开机加载
    it87_configure_boot

    # 加载模块
    log_step "加载 it87 内核模块..."
    if modprobe it87 2>/dev/null; then
        display_success "IT87 驱动安装完成" "注意：内核更新后需手动重新编译"
    else
        log_warn "模块已安装但加载失败，可能需要重启后生效"
        display_success "IT87 驱动已安装" "重启后驱动将自动加载（内核更新后需手动重新编译）"
    fi

    return 0
}

# ---------- 查看传感器 ----------

it87_show_sensors() {
    clear
    show_menu_header "IT87 传感器信息"

    if ! command -v sensors >/dev/null 2>&1; then
        display_error "未安装 lm-sensors" "请先安装：apt-get install -y lm-sensors"
        return 1
    fi

    # 检测 hwmon 设备
    local hwmon_path
    hwmon_path=$(it87_find_hwmon_path)
    if [[ -n "$hwmon_path" ]]; then
        echo -e "${CYAN}检测到 IT87 hwmon 设备:${NC} ${hwmon_path}"
        local fan_info
        fan_info=$(it87_read_fan_rpm "$hwmon_path")
        if [[ -n "$fan_info" ]]; then
            echo -e "${CYAN}风扇转速:${NC} ${fan_info}"
        fi
        echo "$UI_DIVIDER"
    fi

    if ! lsmod | grep -q "^it87 "; then
        echo -e "${YELLOW}it87 内核模块未加载。${NC}"
        echo "  显示的是系统其他传感器信息，不包含 IT87 芯片数据。"
        echo "$UI_DIVIDER"
    fi

    echo -e "${H2}sensors 输出（高亮 IT87 相关行）:${NC}"
    echo "$UI_DIVIDER"

    local sensors_output
    sensors_output=$(sensors 2>/dev/null) || {
        display_error "sensors 命令执行失败" "请检查 lm-sensors 是否正确安装"
        return 1
    }

    while IFS= read -r line; do
        if echo "$line" | grep -qi "it8[67]\|ite"; then
            echo -e "${CYAN}${line}${NC}"
        else
            echo "$line"
        fi
    done <<< "$sensors_output"

    echo "$UI_DIVIDER"
    echo -e "${YELLOW}提示:${NC} 运行 ${CYAN}sensors${NC} 查看完整输出，风扇 RPM 值显示在 fan1/fan2/fan3 行"
    pause_function
}

# ---------- 开机自启管理 ----------

it87_enable_autostart() {
    block_non_pve9_destructive "配置 IT87 开机自启" || return 1

    local force_id
    force_id=$(it87_get_force_id)
    if [[ -z "$force_id" ]]; then
        # 尝试从旧配置恢复
        log_warn "未检测到 force_id 配置，请在设置芯片型号后重试"
        display_error "未设置芯片型号" "请先通过「选择芯片型号」菜单设置"
        return 1
    fi

    it87_configure_boot
    display_success "开机自启已启用" "驱动将在下次启动时自动加载"
}

it87_disable_autostart() {
    block_non_pve9_destructive "禁用 IT87 开机自启" || return 1

    log_step "禁用 IT87 开机自启..."

    # 备份系统配置文件
    backup_file "/etc/modprobe.d/it87.conf" >/dev/null 2>&1 || true
    [[ -f /etc/modules ]] && backup_file "/etc/modules" >/dev/null 2>&1 || true

    # 移除 modprobe.d 配置
    remove_block "/etc/modprobe.d/it87.conf" "IT87_OPTIONS"

    # 从 /etc/modules 移除 it87 行
    if [[ -f /etc/modules ]] && grep -q "^it87" /etc/modules 2>/dev/null; then
        sed -i '/^it87/d' /etc/modules
        log_info "已从 /etc/modules 移除 it87"
    fi

    # 更新 initramfs
    log_step "更新 initramfs..."
    if command -v update-initramfs >/dev/null 2>&1; then
        update-initramfs -u || log_warn "update-initramfs 执行失败"
    fi

    display_success "开机自启已禁用" "当前运行的驱动不受影响，重启后将不再自动加载"
}

# ---------- 卸载 ----------

it87_uninstall() {
    block_non_pve9_destructive "卸载 IT87 驱动" || return 1

    clear
    show_menu_header "卸载 IT87 驱动"
    echo "  将卸载 IT87 内核模块并清理相关配置。"
    echo "  卸载后 ITE 芯片风扇/传感器将回到系统默认状态。"
    echo "$UI_DIVIDER"

    if ! confirm_high_risk_action "卸载 IT87 内核驱动" \
        "会卸载内核模块、移除 DKMS 注册、删除配置文件和更新 initramfs" \
        "卸载后 it87 驱动不可用，风扇转速/温度/电压通过主板默认方式报告" \
        "确认不再需要此驱动；注意部分主板 EC 风扇需要此驱动才能检测" \
        "IT87-REMOVE"; then
        return 0
    fi

    # 卸载内核模块
    log_step "卸载 it87 内核模块..."
    if lsmod | grep -q "^it87 "; then
        rmmod it87 2>/dev/null || log_warn "it87 模块卸载失败（可能正在被使用）"
    fi

    # DKMS 移除
    if command -v dkms >/dev/null 2>&1; then
        log_step "移除 DKMS 注册..."
        local entries
        entries=$(dkms status 2>/dev/null | grep "^${IT87_DKMS_NAME:-it87}[/ ,]" | awk -F'[,/ ]' '{print $1"/"$2}' || true)
        local entry
        for entry in $entries; do
            [[ -n "$entry" ]] && dkms remove "$entry" --all 2>/dev/null || true
        done
    fi

    # 清理源码目录
    log_step "清理源码目录..."
    rm -rf /usr/src/${IT87_DKMS_NAME:-it87}-*

    # 备份并清理配置文件
    log_step "备份并清理配置文件..."
    backup_file "/etc/modprobe.d/it87.conf" >/dev/null 2>&1 || true
    rm -f /etc/modprobe.d/it87.conf

    # 备份并从 /etc/modules 移除
    if [[ -f /etc/modules ]]; then
        backup_file "/etc/modules" >/dev/null 2>&1 || true
        sed -i '/^it87/d' /etc/modules
    fi

    # 更新 initramfs
    log_step "更新 initramfs..."
    if command -v update-initramfs >/dev/null 2>&1; then
        update-initramfs -u || log_warn "update-initramfs 执行失败"
    fi

    # 更新模块依赖
    command -v depmod >/dev/null 2>&1 && depmod -a 2>/dev/null || true

    display_success "IT87 驱动已卸载" "建议重启宿主机以完全清除内核模块残留"
}

# ---------- 主菜单 ----------

it87_manager_menu() {
    while true; do
        clear
        show_menu_header "IT87 Driver 管理器"

        local status version chip
        status=$(it87_detect_status)
        version=$(it87_detect_version)
        chip=$(it87_get_force_id)

        echo -e "  当前状态 ： ${CYAN}${status}${NC}"
        echo -e "  当前版本 ： ${CYAN}${version}${NC}"
        if [[ -n "$chip" ]]; then
            echo -e "  芯片型号 ： ${CYAN}force_id=${chip}${NC}"
        else
            echo -e "  芯片型号 ： ${ORANGE}未设置${NC}"
        fi
        echo "$UI_DIVIDER"
        show_menu_option "1" "安装 (DKMS 编译)"
        show_menu_option "2" "安装 (直接编译, DKMS 备选)"
        echo "$UI_DIVIDER"
        show_menu_option "3" "选择芯片型号 (force_id)"
        show_menu_option "4" "启用开机自启"
        show_menu_option "5" "禁用开机自启"
        show_menu_option "6" "查看传感器信息"
        echo "$UI_DIVIDER"
        show_menu_option "7" "卸载"
        echo "$UI_DIVIDER"
        echo "  安装后需要重启或 modprobe it87 加载驱动。"
        echo "  传感器数据通过 sensors 命令查看。"
        echo "  项目仓库: ${IT87_REPO_URL:-https://github.com/shauno8/it87.git}"
        echo "$UI_DIVIDER"
        show_menu_option "0" "返回"
        show_menu_footer

        local choice
        read -r -p "请选择操作 [0-7]: " choice
        case "$choice" in
            1) it87_install_dkms ;;
            2) it87_install_direct ;;
            3) it87_force_id_menu ;;
            4) it87_enable_autostart ;;
            5) it87_disable_autostart ;;
            6) it87_show_sensors ;;
            7) it87_uninstall ;;
            0) return ;;
            *) log_error "无效选择" ;;
        esac
        pause_function
    done
}
