#!/bin/bash 
####
# 2024 https://github.com/shidahuilang/pve
# 2025 https://github.com/xiangfeidexiaohuo/pve-diy
####

# PVE语言设置
pvelocale(){
	sed -i 's/# en_US.UTF-8 UTF-8/en_US.UTF-8 UTF-8/' /etc/locale.gen && locale-gen && TIME g "PVE语言包设置完成!"
}
if [ `export|grep 'LC_ALL'|wc -l` = 0 ];then
	pvelocale
	if [ `grep "LC_ALL" /etc/profile|wc -l` = 0 ];then
		echo "export LC_ALL='en_US.UTF-8'" >> /etc/profile
		echo "export LANG='en_US.UTF-8'" >> /etc/profile
	fi
fi
if [ `grep "alias ll" /etc/profile|wc -l` = 0 ];then
	echo "alias ll='ls -alh'" >> /etc/profile
	echo "alias sn='snapraid'" >> /etc/profile
fi
source /etc/profile
# pause
pause(){
    read -n 1 -p " 按任意键继续... " input
    if [[ -n ${input} ]]; then
        echo -e "\b\n"
    fi
}

# 字体颜色设置
TIME() {
[[ -z "$1" ]] && {
	echo -ne " "
} || {
	 case $1 in
	r) export Color="\e[31;1m";;
	g) export Color="\e[32;1m";;
	b) export Color="\e[34;1m";;
	y) export Color="\e[33;1m";;
	z) export Color="\e[35;1m";;
	l) export Color="\e[36;1m";;
	  esac
	[[ $# -lt 2 ]] && echo -e "\e[36m\e[0m ${1}" || {
		echo -e "\e[36m\e[0m ${Color}${2}\e[0m"
	 }
	  }
}


#--------------PVE更换软件源----------------
# apt国内源
aptsources() {
	sver=`cat /etc/debian_version |awk -F"." '{print $1}'`
	case "$sver" in
 	13 )
  		sver="trixie"
 	;;
 	12 )
  		sver="bookworm"
 	;;
	11 )
		sver="bullseye"
	;;
	10 )
		sver="buster"
	;;
	9 )
		sver="stretch"
	;;
	8 )
		sver="jessie"
	;;
	7 )
		sver="wheezy"
	;;
	6 )
		sver="squeeze"
	;;
	* )
		sver=""
	;;
	esac
	if [ ! $sver ];then
		TIME r "您的版本不支持！"
		exit 1
	fi

	[[ -e /etc/apt/sources.list ]] && cp -rf /etc/apt/sources.list /etc/apt/backup/sources.list.bak
	[[ -e /etc/apt/sources.list.d/debian.sources ]] && mv /etc/apt/sources.list.d/debian.sources /etc/apt/backup/debian.sources.bak

	echo " 请选择您需要的apt国内源"
	echo " 1. 清华大学镜像站"
	echo " 2. 中科大镜像站"
	input="请输入选择[默认1]"
	while :; do
	read -t 30 -p " ${input}： " aptsource || echo
	aptsource=${aptsource:-1}
	case $aptsource in
	1)
	cat > /etc/apt/sources.list <<-EOF
		deb https://mirrors.tuna.tsinghua.edu.cn/debian/ ${sver} main contrib non-free non-free-firmware
		deb https://mirrors.tuna.tsinghua.edu.cn/debian/ ${sver}-updates main contrib non-free non-free-firmware
		deb https://mirrors.tuna.tsinghua.edu.cn/debian/ ${sver}-backports main contrib non-free non-free-firmware
		deb https://mirrors.tuna.tsinghua.edu.cn/debian-security ${sver}-security main contrib non-free non-free-firmware
	EOF
	break
	;;
	2)
	cat > /etc/apt/sources.list <<-EOF
		deb https://mirrors.ustc.edu.cn/debian/ ${sver} main contrib non-free non-free-firmware
		deb https://mirrors.ustc.edu.cn/debian/ ${sver}-updates main contrib non-free non-free-firmware
		deb https://mirrors.ustc.edu.cn/debian/ ${sver}-backports main contrib non-free non-free-firmware
		deb https://mirrors.ustc.edu.cn/debian-security/ ${sver}-security main contrib non-free non-free-firmware
	EOF
	break
	;;
	*)
	TIME r "请输入正确编码！"
	;;
	esac
	done
	TIME g "apt源，更换完成!"
}
# CT模板国内源
ctsources() {
    [[ -e /usr/share/perl5/PVE/APLInfo.pm ]] && cp -rf /usr/share/perl5/PVE/APLInfo.pm /etc/apt/backup/APLInfo.pm.bak
    [[ -e /var/lib/pve-manager/apl-info/download.proxmox.com ]] && cp -rf /var/lib/pve-manager/apl-info/download.proxmox.com /etc/apt/backup/download.proxmox.com.bak
	echo " 请选择您需要的CT模板国内源"
	echo " 1. 清华大学镜像站"
	echo " 2. 中科大镜像站"
	input="请输入选择[默认1]"
	while :; do
	read -t 30 -p " ${input}： " ctsource || echo
	ctsource=${ctsource:-1}
	case $ctsource in
	1)
	sed -i 's|http://download.proxmox.com|https://mirrors.tuna.tsinghua.edu.cn/proxmox|g' /usr/share/perl5/PVE/APLInfo.pm
	sed -i 's|http://mirrors.ustc.edu.cn/proxmox|https://mirrors.tuna.tsinghua.edu.cn/proxmox|g' /usr/share/perl5/PVE/APLInfo.pm
    pveam update
	break
	;;
	2)
	sed -i 's|http://download.proxmox.com|http://mirrors.ustc.edu.cn/proxmox|g' /usr/share/perl5/PVE/APLInfo.pm
	sed -i 's|https://mirrors.tuna.tsinghua.edu.cn/proxmox|http://mirrors.ustc.edu.cn/proxmox|g' /usr/share/perl5/PVE/APLInfo.pm
    pveam update
	break
	;;
	*)
	TIME r "请输入正确编码！"
	;;
	esac
	done
	TIME g "CT模板源，更换完成!"
}
# 更换使用帮助源
pvehelp(){
	[[ ! -d /etc/apt/sources.list.d ]] && mkdir -p /etc/apt/sources.list.d
	[[ -e /etc/apt/sources.list.d/ceph.sources ]] && mv /etc/apt/sources.list.d/ceph.sources /etc/apt/backup/ceph.sources.bak
	[[ -e /etc/apt/sources.list.d/ceph.list ]] && mv /etc/apt/sources.list.d/ceph.list /etc/apt/backup/ceph.list.bak

    [[ -e /etc/apt/sources.list.d/pve-no-subscription.list ]] && cp -rf /etc/apt/sources.list.d/pve-no-subscription.list /etc/apt/backup/pve-no-subscription.list.bak

	cat > /etc/apt/sources.list.d/pve-no-subscription.list <<-EOF
deb https://mirrors.tuna.tsinghua.edu.cn/proxmox/debian ${sver} pve-no-subscription
EOF
	TIME g "使用帮助源，更换完成!"
}
# 关闭企业源
pveenterprise(){
	if [[ -e /etc/apt/sources.list.d/pve-enterprise.sources ]];then
		mv /etc/apt/sources.list.d/pve-enterprise.sources /etc/apt/backup/pve-enterprise.sources.bak
		TIME g "企业源pve-enterprise.sources已移除完成!"
	else
		TIME g "企业源pve-enterprise.sources不存在，忽略!"
	fi

	if [[ -e /etc/apt/sources.list.d/pve-enterprise.list ]];then
		mv /etc/apt/sources.list.d/pve-enterprise.list /etc/apt/backup/pve-enterprise.list.bak
		TIME g "企业源pve-enterprise.list已移除完成!"
	else
		TIME g "企业源pve-enterprise.list不存在，忽略!"
	fi
}
# 移除无效订阅
novalidsub(){
	# 移除 Proxmox VE 无有效订阅提示 (6.4-5、6、8、9 、13；7.0-9、10、11已测试通过)
	cp -rf /usr/share/javascript/proxmox-widget-toolkit/proxmoxlib.js /usr/share/javascript/proxmox-widget-toolkit/proxmoxlib.js.bak
	sed -Ezi.bak "s/(Ext.Msg.show\(\{\s+title: gettext\('No valid sub)/void\(\{ \/\/\1/g" /usr/share/javascript/proxmox-widget-toolkit/proxmoxlib.js
	# sed -i 's#if (res === null || res === undefined || !res || res#if (false) {#g' /usr/share/javascript/proxmox-widget-toolkit/proxmoxlib.js
	# sed -i '/data.status.toLowerCase/d' /usr/share/javascript/proxmox-widget-toolkit/proxmoxlib.js
	TIME g "已移除订阅提示!"
}
pvegpg(){
	[[ -e /etc/apt/trusted.gpg.d/proxmox-release-${sver}.gpg ]] && mv /etc/apt/trusted.gpg.d/proxmox-release-${sver}.gpg /etc/apt/backup/proxmox-release-${sver}.gpg.bak
	wget -q --timeout=5 --tries=1 --show-progres http://mirrors.tuna.tsinghua.edu.cn/proxmox/debian/proxmox-release-${sver}.gpg -O /etc/apt/trusted.gpg.d/proxmox-release-${sver}.gpg
	if [[ $? -ne 0 ]];then
		TIME r "尝试重新下载..."
		wget -q --timeout=5 --tries=1 --show-progres https://raw.githubusercontent.com/xiangfeidexiaohuo/pve-diy/master/gpg/proxmox-release-${sver}.gpg -O /etc/apt/trusted.gpg.d/proxmox-release-${sver}.gpg
			if [[ $? -ne 0 ]];then
				TIME r "下载秘钥失败，请检查网络再尝试!"
				sleep 2
				exit 1
		else
			TIME g "密匙下载完成!"
			fi
	else
		TIME g "密匙下载完成!"	
	fi
}
pve_optimization(){
	echo
	clear
	TIME y "提示：PVE原配置文件放入/etc/apt/backup文件夹"
	[[ ! -d /etc/apt/backup ]] && mkdir -p /etc/apt/backup
	echo
	TIME y "※※※※※ 更换apt源... ※※※※※"
	aptsources
	echo
	TIME y "※※※※※ 更换CT模板源... ※※※※※"
	ctsources
	echo
	TIME y "※※※※※ 更换使用帮助源... ※※※※※"
	pvehelp
	echo
	TIME y "※※※※※ 关闭企业源... ※※※※※"
	pveenterprise
	echo
	TIME y "※※※※※ 移除 Proxmox VE 无有效订阅提示... ※※※※※"
	novalidsub
	echo
	TIME y "※※※※※ 下载 Proxmox VE 源的密匙... ※※※※※"
	pvegpg
	echo
	TIME y "※※※※※ 重新加载服务配置文件、重启web控制台... ※※※※※"
	systemctl daemon-reload && systemctl restart pveproxy.service && TIME g "服务重启完成!"
	sleep 3
	echo
	TIME y "※※※※※ 更新源、更新常用软件和升级... ※※※※※"
	# apt-get update && apt-get install -y net-tools curl git
	# apt-get dist-upgrade -y
	TIME g "更新源命令：apt-get update -y"
	TIME g "更新软件包命令：apt-get upgrade -y"
	TIME g "更新PVE命令：apt-get dist-upgrade -y"
	echo
	TIME g "修改完毕！"
}
#--------------PVE更换软件源----------------



#---------PVE8/9添加ceph-squid源-----------
pve9_ceph(){
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
		TIME r "版本不支持！"
		exit 1
	fi

	TIME g "ceph-squid目前仅支持PVE8和9！"
	[[ ! -d /etc/apt/backup ]] && mkdir -p /etc/apt/backup
	[[ ! -d /etc/apt/sources.list.d ]] && mkdir -p /etc/apt/sources.list.d

	[[ -e /etc/apt/sources.list.d/ceph.sources ]] && mv /etc/apt/sources.list.d/ceph.sources /etc/apt/backup/ceph.sources.bak
    [[ -e /etc/apt/sources.list.d/ceph.list ]] && mv /etc/apt/sources.list.d/ceph.list /etc/apt/backup/ceph.list.bak

    [[ -e /usr/share/perl5/PVE/CLI/pveceph.pm ]] && cp -rf /usr/share/perl5/PVE/CLI/pveceph.pm /etc/apt/backup/pveceph.pm.bak
	sed -i 's|http://download.proxmox.com|https://mirrors.tuna.tsinghua.edu.cn/proxmox|g' /usr/share/perl5/PVE/CLI/pveceph.pm

	cat > /etc/apt/sources.list.d/ceph.list <<-EOF
deb https://mirrors.tuna.tsinghua.edu.cn/proxmox/debian/ceph-squid ${sver} no-subscription
EOF
	TIME g "添加ceph-squid源完成!"
}
#---------PVE8/9添加ceph-squid源-----------


#---------PVE7/8添加ceph-quincy源-----------
pve8_ceph(){
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
		TIME r "版本不支持！"
		exit 1
	fi

	TIME g "ceph-quincy目前仅支持PVE7和8！"
	[[ ! -d /etc/apt/backup ]] && mkdir -p /etc/apt/backup
	[[ ! -d /etc/apt/sources.list.d ]] && mkdir -p /etc/apt/sources.list.d

	[[ -e /etc/apt/sources.list.d/ceph.sources ]] && mv /etc/apt/sources.list.d/ceph.sources /etc/apt/backup/ceph.sources.bak
    [[ -e /etc/apt/sources.list.d/ceph.list ]] && mv /etc/apt/sources.list.d/ceph.list /etc/apt/backup/ceph.list.bak

    [[ -e /usr/share/perl5/PVE/CLI/pveceph.pm ]] && cp -rf /usr/share/perl5/PVE/CLI/pveceph.pm /etc/apt/backup/pveceph.pm.bak
	sed -i 's|http://download.proxmox.com|https://mirrors.tuna.tsinghua.edu.cn/proxmox|g' /usr/share/perl5/PVE/CLI/pveceph.pm

	cat > /etc/apt/sources.list.d/ceph.list <<-EOF
deb https://mirrors.tuna.tsinghua.edu.cn/proxmox/debian/ceph-quincy ${sver} main
EOF
	TIME g "添加ceph-quincy源完成!"
}
#---------PVE7/8添加ceph-quincy源-----------


#---------PVE一键卸载ceph-----------
remove_ceph(){
TIME g "会卸载ceph，并删除所有ceph相关文件！"

systemctl stop ceph-mon.target && systemctl stop ceph-mgr.target && systemctl stop ceph-mds.target && systemctl stop ceph-osd.target
rm -rf /etc/systemd/system/ceph*

killall -9 ceph-mon ceph-mgr ceph-mds ceph-osd
rm -rf /var/lib/ceph/mon/* && rm -rf /var/lib/ceph/mgr/* && rm -rf /var/lib/ceph/mds/* && rm -rf /var/lib/ceph/osd/*

pveceph purge

apt purge -y ceph-mon ceph-osd ceph-mgr ceph-mds
apt purge -y ceph-base ceph-mgr-modules-core

rm -rf /etc/ceph && rm -rf /etc/pve/ceph.conf  && rm -rf /etc/pve/priv/ceph.* && rm -rf /var/log/ceph && rm -rf /etc/pve/ceph && rm -rf /var/lib/ceph

[[ -e /etc/apt/sources.list.d/ceph.sources ]] && mv /etc/apt/sources.list.d/ceph.sources /etc/apt/backup/ceph.sources.bak

TIME g "已成功卸载ceph."
}
#---------PVE一键卸载ceph-----------


#--------------开启硬件直通----------------
# 开启硬件直通
enable_pass(){
	echo
	TIME y "开启硬件直通..."
	if [ `dmesg | grep -e DMAR -e IOMMU|wc -l` = 0 ];then
		TIME r "您的硬件不支持直通！"
		pause
		menu
	fi
	if [ `cat /proc/cpuinfo|grep Intel|wc -l` = 0 ];then
		iommu="amd_iommu=on"
	else
		iommu="intel_iommu=on"
	fi
	if [ `grep $iommu /etc/default/grub|wc -l` = 0 ];then
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
		TIME g "开启设置后需要重启系统，请稍后重启。"
	else
		TIME r "您已经配置过!"
	   fi

}
# 关闭硬件直通
disable_pass(){
	echo
	TIME y "关闭硬件直通..."
	if [ `dmesg | grep -e DMAR -e IOMMU|wc -l` = 0 ];then
		TIME r "您的硬件不支持直通！"
		pause
		menu
	fi
	if [ `cat /proc/cpuinfo|grep Intel|wc -l` = 0 ];then
		iommu="amd_iommu=on"
	else
		iommu="intel_iommu=on"
	fi
	if [ `grep $iommu /etc/default/grub|wc -l` = 0 ];then
		TIME r "您还没有配置过该项"
	else
		{
			sed -i 's/ '$iommu'//g' /etc/default/grub
			sed -i '/vfio/d' /etc/modules
			rm -rf /etc/modprobe.d/blacklist.conf
			rm -rf /etc/modprobe.d/vfio.conf
			sleep 1
		}|TIME g "关闭设置后需要重启系统，请稍后重启。"
		sleep 1
		update-grub
	fi
}
# 硬件直通菜单
hw_passth(){
	while :; do
		clear
		cat <<-EOF
`TIME y "	      配置硬件直通"`
┌──────────────────────────────────────────┐
    1. 开启硬件直通
    2. 关闭硬件直通
├──────────────────────────────────────────┤
    0. 返回
└──────────────────────────────────────────┘
EOF
		echo -ne " 请选择: [ ]\b\b"
		read -t 60 hwmenuid
		hwmenuid=${hwmenuid:-0}
		case "${hwmenuid}" in
		1)
			enable_pass
			pause
			hw_passth
			break
		;;
		2)
			disable_pass
			pause
			hw_passth
			break
		;;
		0)
			menu
			break
		;;
		*)
		;;
		esac
	done
}
#--------------开启硬件直通----------------


#--------------设置CPU电源模式----------------

# 设置CPU电源模式
cpupower(){
	governors=`cat /sys/devices/system/cpu/cpu0/cpufreq/scaling_available_governors`
	while :; do
		clear
		cat <<-EOF
`TIME y "	      设置CPU电源模式"`
┌──────────────────────────────────────────┐

    1. 设置CPU模式 conservative(保守)
    2. 设置CPU模式 ondemand(按需)
    3. 设置CPU模式 powersave(节能)
    4. 设置CPU模式 performance(性能)
    5. 设置CPU模式 schedutil(负载)

    6. 恢复系统默认电源设置

├──────────────────────────────────────────┤
    0. 返回
└──────────────────────────────────────────┘
EOF
		echo
		echo "部分CPU默认是pstate驱动，仅有 performance 和 powersave 模式；更智能，响应更快！"
		echo
		echo "你的CPU支持 ${governors} 等模式"
		echo
		echo
		echo
		echo -ne " 请选择: [ ]\b\b"
		read -t 60 cpupowerid
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
			break
		;;
		0)
			menu
			break
		;;
		*)
			echo "你的输入无效 ,请重新输入 !!!"
			pause
			cpupower
		;;
		esac
		if [[ ${GOVERNOR} != "" ]]; then
			if [[ -n `echo "${governors}" | grep -o "${GOVERNOR}"` ]]; then
				echo "您选择的CPU模式：${GOVERNOR}"
				echo
				cpupower_add
			else
				echo "您的CPU不支持该模式！"
				cpupower
			fi
		fi
	done
}

# 修改CPU模式
cpupower_add(){
	echo "${GOVERNOR}" | tee /sys/devices/system/cpu/cpu*/cpufreq/scaling_governor >/dev/null
	echo "查看当前CPU模式"
	cat /sys/devices/system/cpu/cpu0/cpufreq/scaling_governor

	echo "添加开机任务"
	NEW_CRONTAB_COMMAND="sleep 10 && echo "${GOVERNOR}" | tee /sys/devices/system/cpu/cpu*/cpufreq/scaling_governor >/dev/null #CPU Power Mode"
	EXISTING_CRONTAB=$(crontab -l 2>/dev/null)
     if [[ -n "$EXISTING_CRONTAB" ]]; then
       TEMP_CRONTAB_FILE=$(mktemp)
       echo "$EXISTING_CRONTAB" | grep -v "@reboot sleep 10 && echo*" > "$TEMP_CRONTAB_FILE"
       crontab "$TEMP_CRONTAB_FILE"
       rm "$TEMP_CRONTAB_FILE"
     fi
	# 修改完成
    (crontab -l 2>/dev/null; echo "@reboot $NEW_CRONTAB_COMMAND") | crontab -
    echo -e "\n检查计划任务设置 (使用 'crontab -l' 命令来检查)"

    pause
}

# 恢复系统默认电源设置
cpupower_del(){
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

    echo "已恢复系统默认电源设置！"
}
#--------------设置CPU电源模式----------------


#--------------CPU、主板、硬盘温度显示----------------

# 安装工具
cpu_add(){

nodes="/usr/share/perl5/PVE/API2/Nodes.pm"
pvemanagerlib="/usr/share/pve-manager/js/pvemanagerlib.js"
proxmoxlib="/usr/share/javascript/proxmox-widget-toolkit/proxmoxlib.js"

pvever=$(pveversion | awk -F"/" '{print $2}')
echo pve版本$pvever

# 判断是否已经执行过修改
[ ! -e $nodes.$pvever.bak ] || { echo 已经执行过修改，请勿重复执行; exit 1;}

# 先刷新下源
apt-get update
sleep 5
echo "开始修改~"

# 输入需要安装的软件包
packages=(lm-sensors nvme-cli sysstat linux-cpupower)

# 查询软件包，判断是否安装
for package in "${packages[@]}"; do
    if ! dpkg -s "$package" &> /dev/null; then
        echo "$package 未安装，开始安装软件包"
        apt-get install "${packages[@]}" -y
        modprobe msr
        install=ok
        break
    fi
done


[[ -e /usr/sbin/linux-cpupower ]] && chmod +s /usr/sbin/linux-cpupower
chmod +s /usr/sbin/nvme
[[ -e /usr/sbin/hddtemp ]] && chmod +s /usr/sbin/hddtemp
chmod +s /usr/sbin/smartctl
chmod +s /usr/sbin/turbostat || echo "Failed to set permissions for /usr/sbin/turbostat"
modprobe msr && echo msr > /etc/modules-load.d/turbostat-msr.conf


# 软件包安装完成
if [ "$install" == "ok" ]; then
    echo 软件包安装完成，检测硬件信息
sensors-detect --auto > /tmp/sensors
drivers=`sed -n '/Chip drivers/,/\#----cut here/p' /tmp/sensors|sed '/Chip /d'|sed '/cut/d'`
if [ `echo $drivers|wc -w` = 0 ];then
    echo 没有找到任何驱动，似乎你的系统不支持或驱动安装失败。
    pause
    menu
else
    for i in $drivers
    do
        modprobe $i
        if [ `grep $i /etc/modules|wc -l` = 0 ];then
            echo $i >> /etc/modules
        fi
    done
    sensors
    sleep 3
    echo 驱动信息配置成功。
fi
[[ -e /etc/init.d/kmod ]] && /etc/init.d/kmod start
rm /tmp/sensors
# 驱动信息配置完成
fi

echo 备份源文件
# 删除旧版本备份文件
rm -f  $nodes.*.bak
rm -f  $pvemanagerlib.*.bak
rm -f  $proxmoxlib.*.bak
# 备份当前版本文件
[ ! -e $nodes.$pvever.bak ] && cp $nodes $nodes.$pvever.bak
[ ! -e $pvemanagerlib.$pvever.bak ] && cp $pvemanagerlib $pvemanagerlib.$pvever.bak
[ ! -e $proxmoxlib.$pvever.bak ] && cp $proxmoxlib $proxmoxlib.$pvever.bak

# 生成系统变量
tmpf=tmpfile.temp
touch $tmpf
cat > $tmpf << 'EOF' 
        $res->{thermalstate} = `sensors`;
        $res->{cpusensors} = `cat /proc/cpuinfo | grep MHz && lscpu | grep MHz`;

        $res->{hdd_temperatures} = `smartctl -a /dev/sd?|grep -E "Device Model|Capacity|Power_On_Hours|Temperature"`;

        my $powermode = `cat /sys/devices/system/cpu/cpu0/cpufreq/scaling_governor && turbostat -S -q -s PkgWatt -i 0.1 -n 1 -c package | grep -v PkgWatt`;
        $res->{cpupower} = $powermode;

EOF

# NVME磁盘变量
for i in {0..9}; do
    for dev in "/dev/nvme${i}" "/dev/nvme${i}n1"; do
        if [ -b "$dev" ]; then
            echo "检测到NVME磁盘: $dev" >&2
            cat >> $tmpf << EOF

        my \$nvme${i}_temperatures = \`smartctl -a $dev | grep -E "Model Number|(?=Total|Namespace)[^:]+Capacity|Temperature:|Available Spare:|Percentage|Data Unit|Power Cycles|Power On Hours|Unsafe Shutdowns|Integrity Errors"\`;
        my \$nvme${i}_io = \`iostat -d -x -k 1 1 | grep -E "^${dev##*/}"\`;
        \$res->{nvme${i}_status} = \$nvme${i}_temperatures . \$nvme${i}_io;

EOF
            break
        fi
    done
done

###################  修改node.pm   ##########################
echo 修改node.pm：
echo 找到关键字 PVE::pvecfg::version_text 的行号并跳到下一行
# 显示匹配的行
ln=$(expr $(sed -n -e '/PVE::pvecfg::version_text/=' $nodes) + 1)
echo "匹配的行号：" $ln

echo 修改结果：
sed -i "${ln}r $tmpf" $nodes
# 显示修改结果
sed -n '/PVE::pvecfg::version_text/,+18p' $nodes
rm $tmpf



###################  修改pvemanagerlib.js   ##########################
tmpf=tmpfile.temp
touch $tmpf
cat > $tmpf << 'EOF'

		{
	          itemId: 'CPUW',
	          colspan: 2,
	          printBar: false,
	          title: gettext('CPU功耗'),
	          textField: 'cpupower',
	          renderer:function(value){
				  const w0 = value.split('\n')[0].split(' ')[0];
				  const w1 = value.split('\n')[1].split(' ')[0];
				  return `CPU电源模式: <strong>${w0}</strong> | CPU功耗: <strong>${w1} W</strong> `
	            }
		},

		{
	          itemId: 'MHz',
	          colspan: 2,
	          printBar: false,
	          title: gettext('CPU频率'),
	          textField: 'cpusensors',
	          renderer:function(value){
				  const f0 = value.match(/cpu MHz.*?([\d]+)/)[1];
				  const f1 = value.match(/CPU min MHz.*?([\d]+)/)[1];
				  const f2 = value.match(/CPU max MHz.*?([\d]+)/)[1];
				  return `CPU实时: <strong>${f0} MHz</strong> | 最小: ${f1} MHz | 最大: ${f2} MHz `
	            }
		},
		
		{
	          itemId: 'thermal',
	          colspan: 2,
	          printBar: false,
	          title: gettext('CPU温度'),
	          textField: 'thermalstate',
	          renderer: function(value) {
				  const coreTemps = [];
				  let coreMatch;
				  const coreRegex = /(Core\s*\d+|Core\d+|Tdie|Tctl|Physical id\s*\d+).*?\+\s*([\d\.]+)/gi;

				  while ((coreMatch = coreRegex.exec(value)) !== null) {
	                  let label = coreMatch[1];
	                  let tempValue = coreMatch[2];

	                  if (label.match(/Tdie|Tctl/i)) {
	                  	  coreTemps.push(`CPU温度: <strong>${tempValue}℃</strong>`);
	                  }

	                  else {
	              	      const coreNumberMatch = label.match(/\d+/);
	              	      const coreNum = coreNumberMatch ? parseInt(coreNumberMatch[0]) + 1 : 1;
	              	      coreTemps.push(`核心${coreNum}: <strong>${tempValue}℃</strong>`);
	                  }
	              }

	              // 核显温度
	              let igpuTemp = '';
	              const intelIgpuMatch = value.match(/(GFX|Graphics).*?\+\s*([\d\.]+)/i);
	              const amdIgpuMatch = value.match(/(junction|edge).*?\+\s*([\d\.]+)/i);
	        
	              if (intelIgpuMatch) {
	                  igpuTemp = `核显: ${intelIgpuMatch[2]}℃`;
	              } else if (amdIgpuMatch) {
	                  igpuTemp = `核显: ${amdIgpuMatch[2]}℃`;
	              }

	              if (coreTemps.length === 0) {
	              	  const k10tempMatch = value.match(/k10temp-pci-\w+\n[^+]*\+\s*([\d\.]+)/);
	              	  if (k10tempMatch) {
	              	  	  coreTemps.push(`CPU温度: <strong>${k10tempMatch[1]}℃</strong>`);
	              	  }
	              }

	              const groupedTemps = [];
	              for (let i = 0; i < coreTemps.length; i += 4) {
	              	  groupedTemps.push(coreTemps.slice(i, i + 4).join(' | '));
	              }

	              const packageMatch = value.match(/(Package|SoC)\s*(id \d+)?.*?\+\s*([\d\.]+)/i);
	              const packageTemp = packageMatch ? `CPU Package: <strong>${packageMatch[3]}℃</strong>` : '';

	              const boardTempMatch = value.match(/(?:temp1|motherboard|sys).*?\+\s*([\d\.]+)/i);
	              const boardTemp = boardTempMatch ? `主板: <strong>${boardTempMatch[1]}℃</strong>` : '';

	              const combinedTemps = [
	                  igpuTemp,
	                  packageTemp,
	                  boardTemp
	              ].filter(Boolean).join(' | ');

	              const result = [
	                  groupedTemps.join('<br>'),
	                  combinedTemps
	              ].filter(Boolean).join('<br>');

	              return result || '未获取到温度信息';
	          }
		},

		{
	          itemId: 'HEXIN',
	          colspan: 2,
	          printBar: false,
	          title: gettext('核心频率'),
	          textField: 'cpusensors',
	          renderer: function(value) {
				  const freqMatches = value.matchAll(/^cpu MHz\s*:\s*([\d\.]+)/gm);
				  const frequencies = [];
				  
				  for (const match of freqMatches) {
				      const coreNum = frequencies.length + 1;
				      frequencies.push(`核心${coreNum}: <strong>${parseInt(match[1])} MHz</strong>`);
				  }
				  
				  if (frequencies.length === 0) {
				      return '无法获取CPU频率信息';
				  }
				  
				  const groupedFreqs = [];
				  for (let i = 0; i < frequencies.length; i += 4) {
				      const group = frequencies.slice(i, i + 4);
				      groupedFreqs.push(group.join(' | '));
				  }
				  
				  return groupedFreqs.join('<br>');
	           }
		},
		
		/* 检测不到相关参数的可以注释掉---需要的注释本行即可
		// 风扇转速
		{
	          itemId: 'RPM',
	          colspan: 2,
	          printBar: false,
	          title: gettext('CPU风扇'),
	          textField: 'thermalstate',
	          renderer:function(value){
				  const fan1 = value.match(/fan1:.*?\ ([\d.]+) R/)[1];
				  const fan2 = value.match(/fan2:.*?\ ([\d.]+) R/)[1];
				  if (fan1 === "0") {
				    fan11 = "停转";
				  } else {
				    fan11 = fan1 + " RPM";
				  }
				  if (fan2 === "0") {
				    fan22 = "停转";
				  } else {
				    fan22 = fan2 + " RPM";
				  }
				  return `CPU风扇: ${fan11} | 系统风扇: ${fan22}`
	            }
		},
		检测不到相关参数的可以注释掉---需要的注释本行即可  */

EOF

# NVME硬盘温度
for i in {0..9}; do
    for dev in "/dev/nvme${i}" "/dev/nvme${i}n1"; do
        if [ -b "$dev" ]; then
            echo "添加NVME磁盘: $dev" >&2
            cat >> $tmpf << EOF
		{
		    itemId: 'nvme${i}-status',
		    colspan: 2,
		    printBar: false,
		    title: gettext('NVME盘'),
		    textField: 'nvme${i}_status',
		    renderer:function(value){
		        if (value.length > 0) {
		            value = value.replace(/Â/g, '');
		            let data = [];
		            let nvmeNumber = -1;
		            let nvmes = value.matchAll(/(^(?:Model|Total|Temperature:|Available Spare:|Percentage|Data|Power|Unsafe|Integrity Errors|nvme)[\s\S]*)+/gm);
		            for (const nvme of nvmes) {
		             if (/Model Number:/.test(nvme[1])) {
		             nvmeNumber++;
		                data[nvmeNumber] = {
		                    Models: [],
		                    Integrity_Errors: [],
		                    Capacitys: [],
		                    Temperatures: [],
		                    Available_Spares: [],
		                    Useds: [],
		                    Reads: [],
		                    Writtens: [],
		                    Cycles: [],
		                    Hours: [],
		                    Shutdowns: [],
		                    States: [],
		                    r_kBs: [],
		                    r_awaits: [],
		                    w_kBs: [],
		                    w_awaits: [],
		                    utils: []
		                };
		                }
		                let Models = nvme[1].matchAll(/^Model Number: *([ \S]*)$/gm);
		                for (const Model of Models) {
		                    data[nvmeNumber]['Models'].push(Model[1]);
		                }
		                let Integrity_Errors = nvme[1].matchAll(/^Media and Data Integrity Errors: *([ \S]*)$/gm);
		                for (const Integrity_Error of Integrity_Errors) {
		                    data[nvmeNumber]['Integrity_Errors'].push(Integrity_Error[1]);
		                }
		                let Capacitys = nvme[1].matchAll(/^(?=Total|Namespace)[^:]+Capacity:[^\[]*\[([ \S]*)\]$/gm);
		                for (const Capacity of Capacitys) {
		                    data[nvmeNumber]['Capacitys'].push(Capacity[1]);
		                }
		                let Temperatures = nvme[1].matchAll(/^Temperature: *([\d]*)[ \S]*$/gm);
		                for (const Temperature of Temperatures) {
		                    data[nvmeNumber]['Temperatures'].push(Temperature[1]);
		                }
		                let Available_Spares = nvme[1].matchAll(/^Available Spare: *([\d]*%)[ \S]*$/gm);
		                for (const Available_Spare of Available_Spares) {
		                    data[nvmeNumber]['Available_Spares'].push(Available_Spare[1]);
		                }
		                let Useds = nvme[1].matchAll(/^Percentage Used: *([ \S]*)%$/gm);
		                for (const Used of Useds) {
		                    data[nvmeNumber]['Useds'].push(Used[1]);
		                }
		                let Reads = nvme[1].matchAll(/^Data Units Read:[^\[]*\[([ \S]*)\]$/gm);
		                for (const Read of Reads) {
		                    data[nvmeNumber]['Reads'].push(Read[1]);
		                }
		                let Writtens = nvme[1].matchAll(/^Data Units Written:[^\[]*\[([ \S]*)\]$/gm);
		                for (const Written of Writtens) {
		                    data[nvmeNumber]['Writtens'].push(Written[1]);
		                }
		                let Cycles = nvme[1].matchAll(/^Power Cycles: *([ \S]*)$/gm);
		                for (const Cycle of Cycles) {
		                    data[nvmeNumber]['Cycles'].push(Cycle[1]);
		                }
		                let Hours = nvme[1].matchAll(/^Power On Hours: *([ \S]*)$/gm);
		                for (const Hour of Hours) {
		                    data[nvmeNumber]['Hours'].push(Hour[1]);
		                }
		                let Shutdowns = nvme[1].matchAll(/^Unsafe Shutdowns: *([ \S]*)$/gm);
		                for (const Shutdown of Shutdowns) {
		                    data[nvmeNumber]['Shutdowns'].push(Shutdown[1]);
		                }
		                let States = nvme[1].matchAll(/^nvme\S+(( *\d+\.\d{2}){22})/gm);
		                for (const State of States) {
		                    data[nvmeNumber]['States'].push(State[1]);
		                    const IO_array = [...State[1].matchAll(/\d+\.\d{2}/g)];
		                    if (IO_array.length > 0) {
		                        data[nvmeNumber]['r_kBs'].push(IO_array[1]);
		                        data[nvmeNumber]['r_awaits'].push(IO_array[4]);
		                        data[nvmeNumber]['w_kBs'].push(IO_array[7]);
		                        data[nvmeNumber]['w_awaits'].push(IO_array[10]);
		                        data[nvmeNumber]['utils'].push(IO_array[21]);
		                    }
		                }
		                let output = '';
		                for (const [i, nvme] of data.entries()) {
		                 if (i > 0) output += '<br><br>';
		                    if (nvme.Models.length > 0) {
		                        output += \`<strong>\${nvme.Models[0]}</strong>\`;
		                        if (nvme.Integrity_Errors.length > 0) {
		                         for (const nvmeIntegrity_Error of nvme.Integrity_Errors) {
		                         if (nvmeIntegrity_Error != 0) {
		                         output += \`(\`;
		                         output += \`0E: \${nvmeIntegrity_Error}-故障！\`;
		                         if (nvme.Available_Spares.length > 0) {
		                         output += ', ';
		                         for (const Available_Spare of nvme.Available_Spares) {
		                         output += \`备用空间: \${Available_Spare}\`;
		                         }
		                         }
		                         output += \`)\`;
		                         }
		                         }
		                        }
		                        output += '<br>';
		                        }
		                    if (nvme.Capacitys.length > 0) {
		                        for (const nvmeCapacity of nvme.Capacitys) {
		                            output += \`容量: \${nvmeCapacity.replace(/ |,/gm, '')}\`;
		                        }
		                    }
		                    if (nvme.Useds.length > 0) {
		                        output += ' | ';
		                        for (const nvmeUsed of nvme.Useds) {
		                            output += \`寿命: <strong>\${100-Number(nvmeUsed)}%</strong>\` ;
		                            if (nvme.Reads.length > 0) {
		                                output += '(';
		                                for (const nvmeRead of nvme.Reads) {
		                                    output += \`已读\${nvmeRead.replace(/ |,/gm, '')}\`;
		                                    output += ')';
		                                }
		                            }
		                            if (nvme.Writtens.length > 0) {
		                                output = output.slice(0, -1);
		                                output += ', ';
		                                for (const nvmeWritten of nvme.Writtens) {
		                                    output += \`已写\${nvmeWritten.replace(/ |,/gm, '')}\`;
		                                }
		                                output += ')';
		                            }
		                        }
		                    }
		                    if (nvme.Temperatures.length > 0) {
		                        output += ' | ';
		                        for (const nvmeTemperature of nvme.Temperatures) {
		                            output += \`温度: <strong>\${nvmeTemperature}°C</strong>\`;
		                        }
		                    }
		                    if (nvme.States.length > 0) {
		                        if (nvme.Models.length > 0) {
		                            output += '\n';
		                        }
		                        output += 'I/O: ';
		                        if (nvme.r_kBs.length > 0 || nvme.r_awaits.length > 0) {
		                            output += '读-';
		                            if (nvme.r_kBs.length > 0) {
		                                for (const nvme_r_kB of nvme.r_kBs) {
		                                    var nvme_r_mB = \`\${nvme_r_kB}\` / 1024;
		                                    nvme_r_mB = nvme_r_mB.toFixed(2);
		                                    output += \`速度\${nvme_r_mB}MB/s\`;
		                                }
		                            }
		                            if (nvme.r_awaits.length > 0) {
		                                for (const nvme_r_await of nvme.r_awaits) {
		                                    output += \`, 延迟\${nvme_r_await}ms /\` ;
		                                }
		                            }
		                        }
		                        if (nvme.w_kBs.length > 0 || nvme.w_awaits.length > 0) {
		                            output += '写-';
		                            if (nvme.w_kBs.length > 0) {
		                                for (const nvme_w_kB of nvme.w_kBs) {
		                                    var nvme_w_mB = \`\${nvme_w_kB}\` / 1024;
		                                    nvme_w_mB = nvme_w_mB.toFixed(2);
		                                    output += \`速度\${nvme_w_mB}MB/s\`;
		                                }
		                            }
		                            if (nvme.w_awaits.length > 0) {
		                                for (const nvme_w_await of nvme.w_awaits) {
		                                    output += \`, 延迟\${nvme_w_await}ms |\` ;
		                                }
		                            }
		                        }
		                        if (nvme.utils.length > 0) {
		                            for (const nvme_util of nvme.utils) {
		                                output += \`负载\${nvme_util}%\`;
		                            }
		                        }
		                    }
		                        if (nvme.Cycles.length > 0) {
		                            output += '\n';
		                            for (const nvmeCycle of nvme.Cycles) {
		                                output += \`通电: \${nvmeCycle.replace(/ |,/gm, '')}次\`;
		                            }
		                            if (nvme.Shutdowns.length > 0) {
		                                output += ', ';
		                                for (const nvmeShutdown of nvme.Shutdowns) {
		                                    output += \`不安全断电\${nvmeShutdown.replace(/ |,/gm, '')}次\`;
		                                    break
		                                }
		                            }
		                            if (nvme.Hours.length > 0) {
		                                output += ', ';
		                                for (const nvmeHour of nvme.Hours) {
		                                    output += \`累计\${nvmeHour.replace(/ |,/gm, '')}小时\`;
		                                }
		                            }
		                        }
		                    //output = output.slice(0, -3);
		                }
		                return output.replace(/\n/g, '<br>');
		            }
		            return output;
		        } else {
		            return \`提示: 未安装 NVME 或已直通 NVME 控制器！\`;
		        }
		    }
		},

EOF
            break
        fi
    done
done


# SATA硬盘温度
cat >> $tmpf << 'EOF'

		{
		    itemId: 'hdd-temperatures',
		    colspan: 2,
		    printBar: false,
		    title: gettext('SATA盘'),
		    textField: 'hdd_temperatures',
		    renderer: function(value) {
		        if (value.length > 0) {
		           try {
		           const jsonData = JSON.parse(value);
		        if (jsonData.standy === true) {
		           return '休眠中';
		           }
		        let output = '';
		        if (jsonData.model_name) {
		        output = `<strong>${jsonData.model_name}</strong><br>`;
		                if (jsonData.temperature?.current !== undefined) {
		                   output += `温度: <strong>${jsonData.temperature.current}°C</strong>`;
		                }
		                if (jsonData.power_on_time?.hours !== undefined) {
		                   if (output.length > 0) output += ' | ';
		                   output += `通电: ${jsonData.power_on_time.hours}小时`;
		                if (jsonData.power_cycle_count) {
		                   output += `, 次数: ${jsonData.power_cycle_count}`;
		                   }
		                }
		                if (jsonData.smart_status?.passed !== undefined) {
		                   if (output.length > 0) output += ' | ';
		                   output += 'SMART: ' + (jsonData.smart_status.passed ? '正常' : '警告!');
		                }
		                   return output;
		                   }
		                   } catch (e) {
		                }
		                let outputs = [];
		                let devices = value.matchAll(/(\s*(Model|Device Model|Vendor).*:\s*[\s\S]*?\n){1,2}^User.*\[([\s\S]*?)\]\n^\s*9[\s\S]*?\-\s*([\d]+)[\s\S]*?(\n(^19[0,4][\s\S]*?$){1,2}|\s{0}$)/gm);
		                for (const device of devices) {
		                let devicemodel = '';
		                if (device[1].indexOf("Family") !== -1) {
		                   devicemodel = device[1].replace(/.*Model Family:\s*([\s\S]*?)\n^Device Model:\s*([\s\S]*?)\n/m, '$1 - $2');
		                } else if (device[1].match(/Vendor/)) {
		                   devicemodel = device[1].replace(/.*Vendor:\s*([\s\S]*?)\n^.*Model:\s*([\s\S]*?)\n/m, '$1 $2');
		                } else {
		                   devicemodel = device[1].replace(/.*(Model|Device Model):\s*([\s\S]*?)\n/m, '$2');
		                }
		                let capacity = device[3] ? device[3].replace(/ |,/gm, '') : "未知容量";
		                let powerOnHours = device[4] || "未知";
		                let deviceOutput = '';
		                if (value.indexOf("Min/Max") !== -1) {
		                   let devicetemps = device[6]?.matchAll(/19[0,4][\s\S]*?\-\s*(\d+)(\s\(Min\/Max\s(\d+)\/(\d+)\)$|\s{0}$)/gm);
		                   for (const devicetemp of devicetemps || []) {
		                     deviceOutput = `<strong>${devicemodel}</strong><br>容量: ${capacity} | 已通电: ${powerOnHours}小时 | 温度: <strong>${devicetemp[1]}°C</strong>`;
		                     outputs.push(deviceOutput);
		                  }
		                } else if (value.indexOf("Temperature") !== -1 || value.match(/Airflow_Temperature/)) {
		                   let devicetemps = device[6]?.matchAll(/19[0,4][\s\S]*?\-\s*(\d+)/gm);
		                for (const devicetemp of devicetemps || []) {
		                   deviceOutput = `<strong>${devicemodel}</strong><br>容量: ${capacity} | 已通电: ${powerOnHours}小时 | 温度: <strong>${devicetemp[1]}°C</strong>`;
		                   outputs.push(deviceOutput);
		                }
		                } else {
		                   if (value.match(/\/dev\/sd[a-z]/)) {
		                       deviceOutput = `<strong>${devicemodel}</strong><br>容量: ${capacity} | 已通电: ${powerOnHours}小时 | 提示: 设备存在但未报告温度信息`;
		                       outputs.push(deviceOutput);
		                   } else {
		                       deviceOutput = `<strong>${devicemodel}</strong><br>容量: ${capacity} | 已通电: ${powerOnHours}小时 | 提示: 未检测到温度传感器`;
		                       outputs.push(deviceOutput);
		                   }
		                  }
		                }
		                if (!outputs.length && value.length > 0) {
		                   let fallbackDevices = value.matchAll(/(\/dev\/sd[a-z]).*?Model:([\s\S]*?)\n/gm);
		                   for (const fallbackDevice of fallbackDevices || []) {
		                     outputs.push(`${fallbackDevice[2].trim()}<br>提示: 设备存在但无法获取完整信息`);
		                   }
		                }
		                return outputs.length ? outputs.join('<br>') : '提示: 检测到硬盘但无法识别详细信息';
		            } else {
		                return '提示: 未安装硬盘或已直通硬盘控制器';
		        }
		    }
		},

EOF

echo 找到关键字pveversion的行号
# 显示匹配的行
ln=$(sed -n '/pveversion/,+10{/},/{=;q}}' $pvemanagerlib)
echo "匹配的行号pveversion：" $ln

echo 修改结果：
sed -i "${ln}r $tmpf" $pvemanagerlib
# 显示修改结果
# sed -n '/pveversion/,+30p' $pvemanagerlib
rm $tmpf


echo 修改页面高度
disk_count=$(lsblk -d -o NAME | grep -cE 'sd[a-z]|nvme[0-9]')
# 高度变量，某些CPU核心过多，或者想显示那个PVE存储库那一行，导致高度不够，修改69为合适的数字，如80、100等。
height_increase=$((disk_count * 69))

node_status_new_height=$((400 + height_increase))
sed -i -r '/widget\.pveNodeStatus/,+5{/height/{s#[0-9]+#'$node_status_new_height'#}}' $pvemanagerlib
cpu_status_new_height=$((300 + height_increase))
sed -i -r '/widget\.pveCpuStatus/,+5{/height/{s#[0-9]+#'$cpu_status_new_height'#}}' $pvemanagerlib

echo "修改后的高度值："
sed -n -e '/widget\.pveNodeStatus/,+5{/height/{p}}' \
       -e '/widget\.pveCpuStatus/,+5{/height/{p}}' $pvemanagerlib

# 调整显示布局
ln=$(expr $(sed -n -e '/widget.pveDcGuests/=' $pvemanagerlib) + 10)
sed -i "${ln}a\ textAlign: 'right'," $pvemanagerlib
ln=$(expr $(sed -n -e '/widget.pveNodeStatus/=' $pvemanagerlib) + 10)
sed -i "${ln}a\ textAlign: 'right'," $pvemanagerlib

###################  修改proxmoxlib.js   ##########################


echo 加强去除订阅弹窗
# sed -r -i '/\/nodes\/localhost\/subscription/,+10{/^\s+if \(res === null /{N;s#.+#\t\t  if(false){#}}' $proxmoxlib
sed -r -i '/\/nodes\/localhost\/subscription/,+30 {
    /^\s+if\s*\(/ {
        :loop
        N
        /\s*\)\s*\{/!b loop
        s/(if\s*\([[:space:]]*res\s*===\s*null\s*(\|\|\s*res\s*===\s*undefined\s*)?(\|\|\s*!res\s*)?(\|\|\s*res\.data\.status\.toLowerCase\(\)\s*!==\s*['\''"]active['\''"]\s*)?[[:space:]]*\)\s*\{)/if(false){/
    }
}' /usr/share/javascript/proxmox-widget-toolkit/proxmoxlib.js

# 显示修改结果
sed -n '/\/nodes\/localhost\/subscription/,+10p' $proxmoxlib
systemctl restart pveproxy

echo "请刷新浏览器缓存shift+f5"


}

# 删除工具
cpu_del(){

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

echo "已删除温度显示，请重新刷新浏览器缓存."
else
echo "你没有添加过温度显示，退出脚本."
fi


}

#--------------CPU、主板、硬盘温度显示----------------


#--------------一键卸载旧内核----------------
remove_kernel(){

YW="\033[33m"
GN="\033[1;92m"
RD="\033[01;31m"
CL="\033[m"

echo -e "${RD}此操作非常危险，风险自行承担！！！${CL}"
echo -e "${RD}操作不当会引起系统崩溃，请知悉！${CL}"

current_kernel=$(uname -r)
available_kernels=$(dpkg --list | grep 'kernel-.*-pve' | awk '{print $2}' | grep -v "$current_kernel" | sort -V)

if [ -z "$available_kernels" ]; then
  echo -e "${GN}未检测到旧内核，当前内核: ${current_kernel}${CL}"
  exit 0
fi

echo -e "${YW}可供移除的内核:${CL}"
echo "$available_kernels" | nl -w 2 -s '. '

echo -e "\n${YW}选择要删除的内核（以逗号分隔，例如 1,2）:${CL}"
read -r selected

# Parse selection
IFS=',' read -r -a selected_indices <<<"$selected"
kernels_to_remove=()

for index in "${selected_indices[@]}"; do
  kernel=$(echo "$available_kernels" | sed -n "${index}p")
  if [ -n "$kernel" ]; then
    kernels_to_remove+=("$kernel")
  fi
done

if [ ${#kernels_to_remove[@]} -eq 0 ]; then
  echo -e "${RD}未做出有效选择，退出。${CL}"
  exit 1
fi

# Confirm removal
echo -e "${YW}待移除的内核:${CL}"
printf "%s\n" "${kernels_to_remove[@]}"
read -rp "继续删除吗？(y/n): " confirm
if [[ "$confirm" != "y" ]]; then
  echo -e "${RD}已中止${CL}"
  exit 1
fi

# Remove kernels
for kernel in "${kernels_to_remove[@]}"; do
  echo -e "${YW}移除 $kernel...${CL}"
  if apt-get purge -y "$kernel" >/dev/null 2>&1; then
    echo -e "${GN}已成功移除: $kernel${CL}"
  else
    echo -e "${RD}删除失败: $kernel ，检查依赖关系。${CL}"
  fi
done

# Clean up and update GRUB
echo -e "${YW}清理中...${CL}"
apt-get autoremove -y >/dev/null 2>&1 && update-grub >/dev/null 2>&1
echo -e "${GN}清理和 GRUB 更新完成。${CL}"


}

#--------------一键卸载旧内核----------------


# 主菜单
menu(){
	cat <<-EOF

`TIME y "    PVE优化脚本 - 2025 刀刀优化版    "`
┌──────────────────────────────────────────┐
    1. 一键优化PVE(换源、去订阅等)
    2. 配置PCI硬件直通
    3. 设置CPU电源模式
    4. 添加CPU、主板、硬盘温度显示
    5. 删除CPU、主板、硬盘温度显示
    6. PVE8/9添加ceph-squid源
    7. PVE7/8添加ceph-quincy源
    8. 一键卸载ceph
    9. 一键卸载旧内核(危险，谨慎操作！)
├──────────────────────────────────────────┤
    0. 退出
└──────────────────────────────────────────┘

EOF
	echo -ne " 请选择: [ ]\b\b"
	read -t 60 menuid
	menuid=${menuid:-0}
	case ${menuid} in
	1)
		pve_optimization
		echo
		pause
		menu
	;;
	2)
		hw_passth
		echo
		pause
		menu
	;;
	3)
		cpupower
		echo
		pause
		menu
	;;
	4)
		cpu_add
		echo
		pause
		menu
	;;
	5)
		cpu_del
		echo
		pause
		menu
	;;
	6)
		pve9_ceph
		echo
		pause
		menu
	;;
	7)
		pve8_ceph
		echo
		pause
		menu
	;;
	8)
		remove_ceph
		echo
		pause
		menu
	;;
	9)
		remove_kernel
		echo
		pause
		menu
	;;
	0)
		clear
		exit 0
	;;
	*)
		echo "你的输入无效 ,请重新输入 !!!"
		pause
		menu
	;;
	esac
}
menu
