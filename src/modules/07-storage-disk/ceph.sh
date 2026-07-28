#!/bin/bash
# SPDX-License-Identifier: GPL-3.0-only
# Copyright (C) 2026 Ciriu Networks

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

    # 仅首次备份原始文件，避免第二次运行时用已被 sed 修改过的版本覆盖掉好备份
    [[ -e /usr/share/perl5/PVE/CLI/pveceph.pm && ! -e /etc/apt/backup/pveceph.pm.bak ]] && cp -a /usr/share/perl5/PVE/CLI/pveceph.pm /etc/apt/backup/pveceph.pm.bak
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

    # 仅首次备份原始文件，避免第二次运行时用已被 sed 修改过的版本覆盖掉好备份
    [[ -e /usr/share/perl5/PVE/CLI/pveceph.pm && ! -e /etc/apt/backup/pveceph.pm.bak ]] && cp -a /usr/share/perl5/PVE/CLI/pveceph.pm /etc/apt/backup/pveceph.pm.bak
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
    local unit osd_dirs

    if ! command -v pveceph >/dev/null 2>&1 && [[ ! -d /var/lib/ceph && ! -e /etc/pve/ceph.conf ]]; then
        log_info "未检测到 Ceph 安装，无需卸载。"
        return 0
    fi

    echo -e "${RED}即将完全卸载 Ceph：停止全部 Ceph 服务、purge 软件包，并删除以下数据目录：${NC}"
    echo "  /var/lib/ceph (含全部 mon/mgr/mds/osd 数据)"
    echo "  /etc/ceph、/etc/pve/ceph.conf、/etc/pve/priv/ceph.*、/var/log/ceph"

    osd_dirs="$(ls -A /var/lib/ceph/osd 2>/dev/null)"
    if [[ -n "$osd_dirs" ]] || pgrep -x ceph-osd >/dev/null 2>&1; then
        echo -e "${RED}警告：检测到本机存在 OSD（数据盘）！卸载会销毁其上的所有存储数据，且不可恢复。${NC}"
    fi

    if ! confirm_high_risk_action \
        "完全卸载本机 Ceph 并删除全部相关数据" \
        "所有 mon/mgr/mds/osd 数据目录会被永久删除，OSD 上的存储数据不可恢复" \
        "使用该 Ceph 存储的 VM/CT 磁盘将全部丢失；集群其他节点的 Ceph 状态也会受影响" \
        "请确认已迁移或备份 Ceph 上的所有数据，且该节点已按官方流程移出 Ceph 集群" \
        "DESTROY-CEPH"; then
        return 1
    fi

    for unit in ceph-mon.target ceph-mgr.target ceph-mds.target ceph-osd.target; do
        systemctl stop "$unit" 2>/dev/null || log_warn "停止 $unit 失败或该服务不存在，继续。"
    done
    rm -rf /etc/systemd/system/ceph*

    killall -9 ceph-mon ceph-mgr ceph-mds ceph-osd 2>/dev/null
    rm -rf /var/lib/ceph/mon/* /var/lib/ceph/mgr/* /var/lib/ceph/mds/* /var/lib/ceph/osd/*

    if command -v pveceph >/dev/null 2>&1; then
        pveceph purge || log_warn "pveceph purge 未完全成功，继续清理残留文件。"
    fi

    if ! apt purge -y ceph-mon ceph-osd ceph-mgr ceph-mds; then
        log_warn "部分 Ceph 核心包卸载失败，请稍后手动检查 dpkg 状态。"
    fi
    apt purge -y ceph-base ceph-mgr-modules-core || log_warn "ceph-base/ceph-mgr-modules-core 卸载失败或未安装。"

    rm -rf /etc/ceph /etc/pve/ceph.conf /etc/pve/priv/ceph.* /var/log/ceph /etc/pve/ceph /var/lib/ceph

    mkdir -p /etc/apt/backup
    [[ -e /etc/apt/sources.list.d/ceph.sources ]] && mv /etc/apt/sources.list.d/ceph.sources /etc/apt/backup/ceph.sources.bak
    [[ -e /etc/apt/sources.list.d/ceph.list ]] && mv /etc/apt/sources.list.d/ceph.list /etc/apt/backup/ceph.list.bak

    log_success "已成功卸载ceph."
}
#---------PVE一键卸载ceph-----------

#---------第三方小工具管理-----------
# 小工具配置
# FastPVE - PVE 虚拟机快速下载
ceph_management_menu() {
    run_menu "Ceph管理" ceph_management_menu_render ceph_management_menu_dispatch "0-3"
}

ceph_management_menu_render() {
    show_menu_option "1" "添加 ${CYAN}ceph-squid${NC} 源 (PVE8/9专用)"
    show_menu_option "2" "添加 ${CYAN}ceph-quincy${NC} 源 (PVE7/8专用)"
    show_menu_option "3" "${RED}卸载 Ceph${NC} (完全移除Ceph)"
}

ceph_management_menu_dispatch() {
    case "$1" in
        1) pve9_ceph ;;
        2) pve8_ceph ;;
        3) remove_ceph ;;
        *) return 1 ;;
    esac
    return 0
}

# 救砖：恢复官方 pve-qemu-kvm
