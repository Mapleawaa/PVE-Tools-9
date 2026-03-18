---
layout: home

hero:
  name: "PVE-Tools-9"
  text: "用于 Proxmox VE 9.0 的一键脚本"
  tagline: "让每个人都能体验虚拟化技术带来的便利。"
  image:
    light: /logo.svg
    dark: /logo-dark.svg
    alt: PVE-Tools
  actions:
    - theme: brand
      text: 立即开始
      link: /guide
    - theme: brand
      text: 更新日志
      link: /update
    - theme: alt
      text: 在 GitHub 查看
      link: https://github.com/Mapleawaa/PVE-Tools-9

my_features:
  - title: 一键换源
    details: 支持中科大、清华等国内镜像源，加速系统更新与软件包下载。
    iconClass: icon-rocket
  - title: 完美去弹窗
    details: 彻底删除 PVE 登录时的“无有效订阅”提示，告别烦人的弹窗。
    iconClass: icon-sparkles
  - title: 智能硬盘管理
    details: 支持硬盘直通、LVM 管理、分区挂载等，操作简单直观。
    iconClass: icon-harddrive
  - title: 显卡管理
    details: 包含 Intel 核显直通、SR-IOV 虚拟化及 NVIDIA vGPU 自动化配置。
    iconClass: icon-gpu
  - title: 定时开关机
    details: 支持 VM 和容器的定时任务管理，基于 cron.d 幂等配置，安全可靠。
    iconClass: icon-clock
  - title: 更多功能
    details: 包含内核管理、硬件直通一键配置、UPS 监控等丰富工具。
    iconClass: icon-more
---

<script setup>
import HomeFeaturesWithTimeline from './.vitepress/theme/components/HomeFeaturesWithTimeline.vue'
</script>

<HomeFeaturesWithTimeline />

<style>
:root {
  --vp-home-hero-name-color: transparent;
  --vp-home-hero-name-background: -webkit-linear-gradient(120deg, #bd34fe 30%, #41d1ff);
}
</style>
